import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "crypto";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(
  supabaseUrl,
  serviceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function detectLanguage(text: string) {
  if (/[\u0C00-\u0C7F]/.test(text)) return "te";
  if (/[\u0900-\u097F]/.test(text)) return "hi";
  return "en";
}

function isEmergency(text: string) {
  return /emergency|accident|unconscious|heavy bleeding|severe bleeding|severe dental bleeding|dental bleeding|uncontrolled bleeding|continuous bleeding|severe pain|severe swelling|facial swelling|face swelling|jaw swelling|swelling of face|swelling of jaw|breathing difficulty|difficulty breathing|cannot breathe|trouble breathing|difficulty swallowing|అత్యవసర|రక్తస్రావం|ఊపిరి ఆడటం లేదు|స్పృహ కోల్పోవడం|ముఖం వాపు|తీవ్రమైన నొప్పి|बेहोश|दुर्घटना|सांस नहीं|सांस लेने में कठिनाई|भारी खून|तेज रक्तस्राव|चेहरे पर सूजन|गंभीर दर्द/i.test(text);
}

function isSymptom(text: string) {
  return /pain|ache|swelling|bleeding|fever|infection|toothache|broken tooth|hurt|దంత నొప్పి|నొప్పి|వాపు|నొప్పిగా|दर्द|सूजन|खून|बुखार/i.test(text);
}

function isBooking(text: string) {
  return /book|booking|appointment|schedule|visit|consultation|reserve|reservation|విజిట్|అపాయింట్మెంట్|అపాయింట్‌మెంట్|అపాయింట్మెంట్ కావాలి|నియామకం|కలవాలి|బుక్|బుక్ చేయాలి|ములాఖాత్|मुलाकात|मुलाक़ात|अपॉइंटमेंट|बुक|बुक करना|समय लेना|मिलने का समय|डॉक्टर से मिलना/i.test(text);
}
function parseRequestedFor(text: string): string | null {
  const timeMatch = text.match(
    /(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i
      );
  if (!timeMatch) return null;

  let hours = Number(timeMatch[1]);
  const minutes = Number(timeMatch[2] || 0);
  const period = (timeMatch[3] || "").toLowerCase();

  if (hours < 1 || hours > 12 || minutes > 59) return null;

  const morning =
    /morning|ఉదయం|सुबह/i.test(text);

  const afternoon =
    /afternoon| మధ్యాహ్నం|दोपहर/i.test(text);

  const evening =
    /evening|సాయంత్రం|शाम/i.test(text);

  if (period === "pm" || afternoon || evening) {
    if (hours !== 12) hours += 12;
  } else if (period === "am" || morning) {
    if (hours === 12) hours = 0;
  }

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = Number(parts.find(p => p.type === "year")?.value);
  const month = Number(parts.find(p => p.type === "month")?.value);
  const day = Number(parts.find(p => p.type === "day")?.value);

  const requestedDate = new Date(Date.UTC(year, month - 1, day));

if (/day after tomorrow|ఎల్లుండి|परसों/i.test(text)) {
  requestedDate.setUTCDate(requestedDate.getUTCDate() + 2);
} else if (/tomorrow|రేపు|कल/i.test(text)) {
  requestedDate.setUTCDate(requestedDate.getUTCDate() + 1);
}

  const dateString = requestedDate.toISOString().slice(0, 10);

  const result = `${dateString}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00+05:30`;
return result;
}

function tokenize(text: string) {
  return text
    .normalize("NFC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(word => word.length > 2);
}

function findClinicAnswer(
  question: string,
  records: any[]
) {
  const words = tokenize(question);

  if (words.length === 0) return null;

  const stopWords = new Set([
    "the", "is", "are", "was", "were",
    "what", "when", "where", "which",
    "how", "can", "could", "would",
    "you", "your", "for", "and", "with",
    "please", "tell", "about", "does",
    "do", "does", "have", "has"
  ]);

  const questionWords = words.filter(
    word => !stopWords.has(word)
  );

  let bestRecord: any = null;
  let bestScore = 0;

  for (const record of records) {

    const titleWords = tokenize(record.title || "");
    const categoryWords = tokenize(record.category || "");
    const contentWords = tokenize(record.content || "");

    const keywordWords = tokenize(
      (record.keywords || []).join(" ")
    );

    let score = 0;

    for (const word of questionWords) {

      if (keywordWords.includes(word)) {
        score += 4;
      }

      if (titleWords.includes(word)) {
        score += 3;
      }

      if (categoryWords.includes(word)) {
        score += 3;
      }

      if (contentWords.includes(word)) {
        score += 1;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestRecord = record;
    }
  }

  return bestScore >= 3 ? bestRecord : null;
}

function localizedReply(
  language: string,
  type: string,
  content?: string
) {
  if (language === "te") {
    if (type === "unknown")
      return "క్షమించండి. ఈ సమాచారం మా క్లినిక్ ఫైల్‌లో లేదు. మా సిబ్బంది 2 పని గంటల్లో మీకు ఫోన్ చేస్తారు.";

    if (type === "symptom")
      return "మీ లక్షణాలను పరిశీలించడానికి దంతవైద్యుడిని ప్రత్యక్షంగా కలవాలి. అపాయింట్‌మెంట్ కావాలా?";

    if (type === "booking")
      return `మీ అపాయింట్‌మెంట్ అభ్యర్థన స్వీకరించబడింది. ${content || ""} అపాయింట్‌మెంట్‌ను నిర్ధారించడానికి మా క్లినిక్ సిబ్బంది మిమ్మల్ని సంప్రదిస్తారు.`;

    if (type === "emergency")
      return `అత్యవసర పరిస్థితి! దయచేసి వెంటనే క్లినిక్ అత్యవసర నంబర్ ${content} కు కాల్ చేయండి. సిబ్బంది ఫోన్ కోసం వేచి ఉండకండి.`;

    return content || "ధన్యవాదాలు. మీకు ఎలా సహాయం చేయగలం?";
  }

  if (language === "hi") {
    if (type === "unknown")
      return "क्षमा करें। यह जानकारी क्लिनिक फाइल में उपलब्ध नहीं है। हमारा स्टाफ 2 कार्य घंटों के भीतर आपको फोन करेगा।";

    if (type === "symptom")
      return "आपके लक्षणों की जांच के लिए दंत चिकित्सक से मिलना आवश्यक है। क्या आप अपॉइंटमेंट बुक करना चाहेंगे?";

    if (type === "booking")
      return `आपका अपॉइंटमेंट अनुरोध प्राप्त हो गया है। ${content || ""} अपॉइंटमेंट की पुष्टि के लिए हमारा क्लिनिक स्टाफ आपसे संपर्क करेगा।`;

    if (type === "emergency")
      return `आपातकालीन स्थिति! कृपया तुरंत क्लिनिक के आपातकालीन नंबर ${content} पर कॉल करें। फोन आने का इंतजार न करें।`;

    return content || "धन्यवाद। हम आपकी कैसे सहायता कर सकते हैं?";
  }

  if (type === "unknown")
    return "I'm not sure about this information. Our staff will call you back within 2 working hours.";

  if (type === "symptom")
    return "A dentist must examine you to assess your symptoms. Would you like to book an appointment?";

  if (type === "booking")
    return `Your appointment request has been received. ${content || ""} Our clinic staff will contact you to confirm the appointment.`;

  if (type === "emergency")
    return `EMERGENCY: Please call the clinic emergency number ${content || "immediately"}. Do not wait for a callback.`;

  return content || "Thank you. How may I help you?";
}
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const message = String(body.message || "").trim();

    if (!message) {
      return NextResponse.json(
        { error: "Please enter a message." },
        { status: 400 }
      );
    }

    const language = detectLanguage(message);

    // 1. Retrieve clinic information

    const { data: knowledge, error: knowledgeError } =
      await supabase
        .from("clinic_knowledge")
        .select("category,title,content,content_hi,content_te,keywords")
        .eq("is_active", true);

    if (knowledgeError) throw knowledgeError;

    const records = knowledge || [];

    // 2. Find emergency contact

    const emergencyRecord = records.find(
      (r: any) => r.category === "emergency"
    );

    // 3. Determine question type

    const emergency = isEmergency(message);
    const symptom = isSymptom(message);
    const booking = isBooking(message);

    let answer = "";
    let ticketStatus = "";
    let ticketType = "general";

    let source = "fallback";

if (emergency) {
  const emergencyNumber =
    emergencyRecord?.content?.match(/\d{10,}/)?.[0] || "9000000001";
console.log("Emergency record:", emergencyRecord);
console.log("Extracted emergency number:", emergencyNumber);
  answer = localizedReply(
    language,
    "emergency",
    emergencyNumber
  );

  ticketStatus = "urgent";
  ticketType = "emergency";

    } else if (symptom) {
      answer = localizedReply(language, "symptom");

      ticketStatus = "needs human";
      ticketType = "clinical enquiry";

} else if (booking) {
  const requestedFor = parseRequestedFor(message);

  const appointmentTime = requestedFor
    ? new Date(requestedFor).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        dateStyle: "long",
        timeStyle: "short",
      })
    : "";

  answer = localizedReply(
    language,
    "booking",
    appointmentTime
  );

  ticketStatus = "needs human";
  ticketType = "appointment";
} else {
      // 4. Match the question against clinic information

// Identify the information category requested by the patient
const intentRules = [
   {
    pattern: /\b(insurance|insurer|insured|cashless|star health|health insurance)\b|बीमा|इंश्योरेंस|బీమా|ఇన్సూరెన్స్/i,
    recordPattern: /insurance|insurer|cashless/i,
  },
   {
    pattern: /\b(price|prices|pricing|cost|costs|fee|fees|charge|charges|how much|rate|rates)\b|कीमत|कितना|शुल्क|फीस|ధర|ధరలు|ఫీజు|ఎంత/i,
    recordPattern: /price|pricing|fee|cost|charge/i,
  },
  {
    pattern: /\b(time|timing|timings|hours|open|opening|close|closing)\b|समय|कब खुल|काम करने का समय|समय-सारणी|సమయం|వేళలు|పని వేళలు|ఎప్పుడు తెరుస్తారు/i,
    recordPattern: /working hours|timing|hours/i,
  },
  {
  pattern: /\b(service|services|treatment|treatments|dentistry)\b|सेवाएं|सेवाएँ|दंत चिकित्सा|दंत सेवाएं|दांतों का इलाज|इलाज|उपचार|చికిత్స|సేవలు|దంత వైద్యం/i,
  recordPattern: /services|treatment/i,
},{
    pattern: /\b(address|location|where|directions)\b|पता|कहाँ|स्थान|पता बताएं|చిరునామా|ఎక్కడ|స్థానం/i,
    recordPattern: /address|location/i,
  },
{
  pattern: /\b(phone|contact|number|call|telephone|mobile)\b|फोन|संपर्क|नंबर|दूरभाष|मोबाइल|ఫోన్|సంప్రదింపు|నంబర్|కాంటాక్ట్/i,
  recordPattern: /contact|phone|number/i,
},
  {

  pattern: /\b(phone|contact|number|call|telephone|mobile)\b|फोन|संपर्क|संपर्क नंबर|फोन नंबर|कॉन्टैक्ट|नंबर|दूरभाष|ఫోన్|సంప్రదింపు|సంప్రదింపు నంబర్|నంబర్|కాంటాక్ట్/i,
  recordPattern: /contact|phone/i,

  },
  {
    pattern: /\b(emergency|urgent)\b|आपातकाल|आपात स्थिति|అత్యవసర/i,
    recordPattern: /emergency/i,
  },
];

// Find the intended category
const matchedIntent = intentRules.find(rule =>
  rule.pattern.test(message)
);

// Restrict matching to the relevant clinic information
const relevantRecords = matchedIntent
  ? records.filter((record: any) =>
      matchedIntent.recordPattern.test(
        `${record.category} ${record.title}`
      )
    )
  : records;

const matched = matchedIntent
  ? relevantRecords.length > 0
    ? findClinicAnswer(message, relevantRecords)
    : null
  : findClinicAnswer(message, relevantRecords);

if (matched) {
  answer =
    language === "te"
      ? matched.content_te || matched.content
      : language === "hi"
        ? matched.content_hi || matched.content
        : matched.content;

  source = "clinic";
} else {
  answer = localizedReply(language, "unknown");
  ticketStatus = "needs human";
}
    }

    // 5. Create or reuse conversation

    let conversationId = body.conversationId || null;
let accessToken = body.accessToken || null;
    if (conversationId) {
  const { data: existing, error: authError } = await supabase
    .from("conversations")
    .select("id")
    .eq("id", conversationId)
    .eq("access_token", accessToken)
    .maybeSingle();

  if (authError) throw authError;

  if (!existing) {
    return NextResponse.json(
      { error: "Unauthorized conversation access" },
      { status: 403 }
    );
  }
}

    if (!conversationId) {
  accessToken = randomBytes(32).toString("hex");

  const { data: conversation, error } = await supabase
    .from("conversations")
    .insert({
      patient_name: body.patientName || null,
      patient_phone: body.patientPhone || null,
      language,
      status: "open",
      access_token: accessToken,
    })
    .select("id")
    .single();

  if (error) throw error;

  conversationId = conversation.id;
}
// Update patient details for existing conversations
const patientDetails: {
  patient_name?: string;
  patient_phone?: string;
} = {};

if (body.patientName?.trim()) {
  patientDetails.patient_name = body.patientName.trim();
}

if (body.patientPhone?.trim()) {
  patientDetails.patient_phone = body.patientPhone.trim();
}

if (Object.keys(patientDetails).length > 0) {
  const { error: updateError } = await supabase
    .from("conversations")
    .update(patientDetails)
    .eq("id", conversationId);

  if (updateError) throw updateError;
}
    // 6. Save patient message

    const { error: patientMessageError } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_role: "patient",
        message_text: message,
        source: "chat"
      });

    if (patientMessageError) throw patientMessageError;

    // 7. Create human-support ticket when required

    let ticketId = null;

    if (ticketStatus) {
      const { data: ticket, error } = await supabase
        .from("tickets")
        .insert({
          conversation_id: conversationId,
          subject: emergency
            ? "URGENT: Patient emergency"
            : booking
              ? "Appointment request"
              : "Patient enquiry requires human support",

          description: message,

          ticket_type: ticketType,

          status: ticketStatus,

          priority: emergency ? 1 : 2
        })
        .select("id")
        .single();

      if (error) throw error;

      ticketId = ticket.id;
// Save appointment request in appointments table
if (booking) {
  const requestedFor = parseRequestedFor(message);

  const { error: appointmentError } = await supabase
    .from("appointments")
    .insert({
      conversation_id: conversationId,
      ticket_id: ticketId,
      patient_name: body.patientName || "Not provided",
      patient_phone: body.patientPhone || "Not provided",
      requested_for: requestedFor,
      status: "requested",
      notes: message,
    });

if (appointmentError) throw appointmentError;
}

    }

    // 8. Save bot response

    const { error: botError } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_role: "bot",
        message_text: answer,
        source: source,
        metadata: {
          language,
          ticketId,
          fallback: source !== "clinic",
        }
      });

    if (botError) throw botError;

    // 9. Return response

return NextResponse.json({
  answer,
  conversationId,
  accessToken,
  ticketId,
  ticketStatus,
  source,
  language
});

  } catch (error: any) {
    console.error("Chat API error:", error);

    return NextResponse.json(
      {
        error: "Unable to process your request. Please contact the clinic."
      },
      { status: 500 }
    );
  }
}