"use client";

import { useState, useEffect, useRef } from "react";

type Message = {
  id: string | number;
  role: "bot" | "user" | "staff";
  text: string;
  time: string;
  source?: string;
};

const QUICK_REPLIES = [
  "What are your consultation fees?",
  "Which doctors are available?",
  "What are your timings?",
  "Where is the clinic?",
  "I want to book an appointment",
];

function getBotReply(message: string): string {
  const q = message.toLowerCase();

  // Emergency detection
  if (
    q.includes("trouble breathing") ||
    q.includes("cannot breathe") ||
    q.includes("can't breathe") ||
    q.includes("heavy bleeding") ||
    q.includes("face swelling") ||
    q.includes("neck swelling")
  ) {
    return (
      "🚨 URGENT MEDICAL ATTENTION REQUIRED\n\n" +
      "Please call our emergency number immediately:\n\n" +
      "📞 90000 00001\n\n" +
      "Go to the nearest hospital immediately. " +
      "Do not wait for a chatbot response."
    );
  }

  // Clinic timings
  if (
    q.includes("timing") ||
    q.includes("opening") ||
    q.includes("hours") ||
    q.includes("open")
  ) {
    return (
      "Our clinic timings are:\n\n" +
      "Monday – Saturday: 9:00 AM – 8:00 PM\n\n" +
      "Sunday: 10:00 AM – 2:00 PM (Emergencies only)\n\n" +
      "Lunch break: 1:30 PM – 2:30 PM.\n\n" +
      "We are closed on public holidays. " +
      "Our emergency line remains available."
    );
  }

  // Fees
  if (
    q.includes("fee") ||
    q.includes("price") ||
    q.includes("cost") ||
    q.includes("charge")
  ) {
    return (
      "Here are our consultation and treatment charges:\n\n" +
      "• Consultation: ₹400\n" +
      "• Teeth cleaning: ₹1,200\n" +
      "• Tooth filling: ₹1,500 – ₹3,000\n" +
      "• Root canal: ₹6,500 – ₹9,000\n" +
      "• Teeth whitening: ₹8,000\n" +
      "• Metal braces: ₹35,000 – ₹60,000\n" +
      "• Dental implant: ₹28,000 per tooth\n" +
      "• Single X-ray: ₹300\n\n" +
      "Final treatment costs may depend on the dentist's examination."
    );
  }

  // Doctors
  if (
    q.includes("doctor") ||
    q.includes("dentist") ||
    q.includes("specialist")
  ) {
    return (
      "Our dental specialists are:\n\n" +
      "👩‍⚕️ Dr. Meera Nair\n" +
      "Lead Dentist – Root canals and fillings.\n" +
      "Available Monday to Saturday.\n\n" +
      "👨‍⚕️ Dr. Imran Qureshi\n" +
      "Orthodontist – Braces and aligners.\n" +
      "Available Tuesday, Thursday and Saturday.\n\n" +
      "👩‍⚕️ Dr. Sneha Rao\n" +
      "Paediatric Dentist – Children under 14.\n" +
      "Available Saturday only."
    );
  }

  // Location
  if (
    q.includes("location") ||
    q.includes("address") ||
    q.includes("where") ||
    q.includes("direction")
  ) {
    return (
      "📍 Bright Roots Dental\n\n" +
      "Plot 21, Road No. 12,\n" +
      "Banjara Hills,\n" +
      "Hyderabad – 500034.\n\n" +
      "Landmark: Opposite Green Leaf Cafe, above the pharmacy.\n\n" +
      "Free basement parking is available for 2 hours with a clinic stamp."
    );
  }

  // Appointment
  if (
    q.includes("appointment") ||
    q.includes("book") ||
    q.includes("booking") ||
    q.includes("visit")
  ) {
    return (
      "We would be happy to help you arrange an appointment!\n\n" +
      "Please contact our front desk:\n\n" +
      "📞 040 5550 0123\n\n" +
      "You can also contact us on WhatsApp:\n" +
      "90000 00001\n\n" +
      "Our staff will assist you with the appointment."
    );
  }

  // Insurance
  if (q.includes("insurance")) {
    return (
      "We offer cashless facilities with:\n\n" +
      "• Star Health\n" +
      "• Niva Bupa\n\n" +
      "For other insurers, we provide a bill that you can submit for reimbursement."
    );
  }

  // Payment
  if (
    q.includes("payment") ||
    q.includes("upi") ||
    q.includes("card")
  ) {
    return (
      "We accept the following payment methods:\n\n" +
      "• UPI\n" +
      "• Debit cards\n" +
      "• Credit cards\n" +
      "• Cash\n\n" +
      "No-cost EMI for 6 months is available on braces and implants, subject to bank approval."
    );
  }

  // Symptoms and pain
  if (
    q.includes("pain") ||
    q.includes("toothache") ||
    q.includes("swelling") ||
    q.includes("tooth") ||
    q.includes("bleeding")
  ) {
    return (
      "I'm sorry to hear that you are experiencing discomfort.\n\n" +
      "I cannot diagnose dental conditions or recommend treatment through chat.\n\n" +
      "A dentist needs to examine you.\n\n" +
      "Would you like to arrange an appointment?\n\n" +
      "📞 040 5550 0123"
    );
  }

  // Languages
  if (
    q.includes("language") ||
    q.includes("telugu") ||
    q.includes("hindi")
  ) {
    return (
      "Our clinic can assist patients in:\n\n" +
      "• English\n" +
      "• Hindi\n" +
      "• Telugu"
    );
  }

  // Default response
  return (
    "Thank you for contacting Bright Roots Dental.\n\n" +
    "I don't have verified information to answer that question.\n\n" +
    "Our front desk can assist you:\n\n" +
    "📞 040 5550 0123\n\n" +
    "For a staff callback, please contact our front desk directly."
  );
}

export default function Home() {
  const [patientName, setPatientName] = useState("");
const [patientPhone, setPatientPhone] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: "bot",
      text:
        "Hello! 👋 Welcome to Bright Roots Dental.\n\n" +
        "I'm your virtual dental assistant.\n\n" +
        "I can help you with:\n\n" +
        "• Dental services and fees\n" +
        "• Doctors and specialities\n" +
        "• Clinic timings and location\n" +
        "• Appointment enquiries\n\n" +
        "How may I help you today?",
      time: "Now",
    },
  ]);

  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [conversationRefresh, setConversationRefresh] = useState(0);
const autoQuestionSent = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, typing]);
// Load existing conversation messages and staff replies
useEffect(() => {
const conversationId = localStorage.getItem(
  "bright-roots-conversation-id"
);

const accessToken = localStorage.getItem(
  "bright-roots-access-token"
);

if (!conversationId || !accessToken) {
  return;
}
const validConversationId: string = conversationId;
const validAccessToken: string = accessToken;
  async function loadMessages() {
    try {
const response = await fetch(
  `/api/messages?conversationId=${encodeURIComponent(validConversationId)}`,
  {
    headers: {
      "x-conversation-token": validAccessToken,
    },
  }
);

      if (!response.ok) return;

      const data = await response.json();

      if (data.messages && data.messages.length > 0) {
        setMessages(
          data.messages.map((item: any) => ({
            id: item.id,
            role:
              item.sender_role === "patient"
                ? "user"
                : item.sender_role === "staff"
                  ? "staff"
                  : "bot",
            text: item.message_text,
            source: item.source,
            time: new Date(item.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          }))
        );
      }
    } catch (error) {
      console.error("Unable to load conversation:", error);
    }
  }

  loadMessages();

  const interval = setInterval(loadMessages, 5000);

  return () => clearInterval(interval);
}, [conversationRefresh]);
  function sendMessage(text: string) {
    const value = text.trim();

    if (!value || typing) return;

    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      text: value,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setTyping(true);

    setTimeout(async () => {
  try {
    const savedConversationId = localStorage.getItem(
  "bright-roots-conversation-id"
);

const savedAccessToken = localStorage.getItem(
  "bright-roots-access-token"
);

    const apiResponse = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
body: JSON.stringify({
  message: value,
  conversationId: savedConversationId,
  accessToken: savedAccessToken,
  patientName: patientName,
  patientPhone: patientPhone,
}),
    });

    const data = await apiResponse.json();

    if (!apiResponse.ok) {
      throw new Error(data.error || "Unable to get a response.");
    }

    if (data.conversationId && data.accessToken) {
  localStorage.setItem(
    "bright-roots-conversation-id",
    data.conversationId
  );

  localStorage.setItem(
    "bright-roots-access-token",
    data.accessToken
  );
}
setConversationRefresh((current) => current + 1);
const botMessage: Message = {
  id: Date.now() + 1,
  role: "bot",
  text: data.answer,
  source: data.source,
  time: new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  }),
};
    setMessages((prev) => [...prev, botMessage]);

  } catch (error) {
    console.error("Chat API error:", error);

    const errorMessage: Message = {
      id: Date.now() + 1,
      role: "bot",
      text: "Sorry, I am unable to process your request right now. Please contact the clinic.",
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, errorMessage]);

  } finally {
    setTyping(false);
  }
}, 700);
  }
useEffect(() => {
  if (autoQuestionSent.current) return;

  const params = new URLSearchParams(window.location.search);
  const question = params.get("q");

  if (question && question.trim()) {
    autoQuestionSent.current = true;
    sendMessage(question);
  }
}, []);
  return (
    <main className="min-h-screen bg-[#f4f7f5] text-gray-800">

      {/* Header */}

      <header className="bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">

          <div className="flex items-center gap-3">

            <div className="w-12 h-12 rounded-full bg-green-700 text-white flex items-center justify-center text-2xl">
              ✚
            </div>

            <div>
              <h1 className="text-xl font-bold text-green-900">
                Bright Roots Dental
              </h1>

              <p className="text-xs text-gray-500">
                Your Smile, Our Priority
              </p>
            </div>

          </div>

          <div className="hidden sm:block text-right">
            <p className="text-sm font-semibold text-green-800">
              Dental Care Made Simple
            </p>

            <p className="text-xs text-gray-500">
              English | Hindi | Telugu
            </p>
          </div>

        </div>
      </header>

      {/* Main Content */}

      <section className="max-w-6xl mx-auto px-4 py-8">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left Information Panel */}

          <aside className="space-y-5">

            <div className="bg-white rounded-2xl shadow-sm p-6">

              <h2 className="text-lg font-bold text-green-900 mb-3">
                Welcome to Bright Roots
              </h2>

              <p className="text-sm text-gray-600 leading-6">
                We are here to help you with dental enquiries,
                treatment information and appointment assistance.
              </p>
<div className="mt-5 space-y-3">

  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      Patient Name
    </label>
    <input
      type="text"
      value={patientName}
      onChange={(e) => setPatientName(e.target.value)}
      placeholder="Enter your name"
      className="w-full border rounded-lg px-3 py-2 text-sm"
    />
  </div>

  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      Phone Number
    </label>
    <input
      type="tel"
      value={patientPhone}
      onChange={(e) => setPatientPhone(e.target.value)}
      placeholder="Enter your phone number"
      className="w-full border rounded-lg px-3 py-2 text-sm"
    />
  </div>

</div>
              <div className="mt-5 space-y-3 text-sm">

                <p>🦷 General Dentistry</p>
                <p>😁 Teeth Whitening</p>
                <p>🩺 Root Canal Treatment</p>
                <p>👨‍⚕️ Braces and Aligners</p>
                <p>👶 Paediatric Dentistry</p>

              </div>

            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6">

              <h3 className="font-bold text-green-900 mb-4">
                Contact Information
              </h3>

              <div className="space-y-4 text-sm">

                <div>
                  <p className="text-gray-500">Clinic Phone</p>
                  <a
                    href="tel:04055500123"
                    className="font-semibold text-green-700"
                  >
                    040 5550 0123
                  </a>
                </div>

                <div>
                  <p className="text-gray-500">Emergency Phone</p>
                  <a
                    href="tel:90000 00001"
                    className="font-semibold text-red-600"
                  >
                    90000 00001
                  </a>
                </div>

                <div>
                  <p className="text-gray-500">Address</p>
                  <p>
                    Plot 21, Road No. 12,
                    Banjara Hills,
                    Hyderabad 500034.
                  </p>
                </div>

                <div>
                  <p className="text-gray-500">Clinic Hours</p>
                  <p>Monday – Saturday</p>
                  <p className="font-semibold">
                    9 AM – 8 PM
                  </p>
                </div>

              </div>

            </div>

            <a
              href="https://wa.me/9190000 00001"
              target="_blank"
              rel="noreferrer"
              className="block text-center bg-green-700 hover:bg-green-800 text-white rounded-xl py-4 font-semibold"
            >
              Contact Us on WhatsApp
            </a>

          </aside>

          {/* Chat Window */}

          <div className="lg:col-span-2 bg-white rounded-2xl shadow-md overflow-hidden flex flex-col min-h-[680px]">

            {/* Chat Header */}

            <div className="bg-green-800 text-white p-5 flex items-center justify-between">

              <div className="flex items-center gap-3">

                <div className="w-11 h-11 bg-white text-green-800 rounded-full flex items-center justify-center text-xl">
                  🦷
                </div>

                <div>
                  <h2 className="font-bold">
                    Dental Assistant
                  </h2>

                  <p className="text-xs text-green-100">
                    ● Online Assistant
                  </p>
                </div>

              </div>

              <span className="text-xs bg-green-700 px-3 py-2 rounded-full">
                Virtual Helpdesk
              </span>

            </div>

            {/* Messages */}

            <div className="flex-1 p-5 overflow-y-auto space-y-5 bg-[#f9fbf9]">

              {messages.map((message) => (

                <div
                  key={message.id}
                  className={`flex ${
                    message.role === "user"
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >

                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
  message.role === "user"
    ? "bg-green-700 text-white rounded-br-sm"
    : "bot-msg bg-white border text-gray-800 rounded-bl-sm"
}`}
                  >
<p className="text-sm whitespace-pre-line leading-6">
  {message.text}
</p>
                    {message.role === "bot" && message.source === "clinic" && (
  <p className="text-xs text-green-700 mt-2">
    Answered from the clinic file
  </p>
)}

                    <p
                      className={`text-[10px] mt-2 text-right ${
                        message.role === "user"
                          ? "text-green-100"
                          : "text-gray-400"
                      }`}
                    >
                      {message.time}
                    </p>

                  </div>

                </div>

              ))}

              {typing && (
                <div className="bg-white border rounded-xl p-4 w-fit text-sm text-gray-500">
                  Assistant is typing...
                </div>
              )}

              <div ref={bottomRef} />

            </div>

            {/* Quick Replies */}

            <div className="border-t px-4 py-4">

              <p className="text-xs text-gray-500 mb-3">
                Suggested questions
              </p>

              <div className="flex flex-wrap gap-2">

                {QUICK_REPLIES.map((reply) => (

                  <button
                    key={reply}
                    onClick={() => sendMessage(reply)}
                    disabled={typing}
                    className="text-xs border border-green-200 text-green-800 rounded-full px-3 py-2 hover:bg-green-50 disabled:opacity-50"
                  >
                    {reply}
                  </button>

                ))}

              </div>

            </div>

            {/* Input */}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage(input);
              }}
              className="border-t p-4 flex gap-3"
            >

              <input
                id="chat-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your dental enquiry..."
                className="flex-1 border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-green-500"
              />

              <button
              id="chat-send"
                type="submit"
                disabled={!input.trim() || typing}
                className="bg-green-800 hover:bg-green-900 disabled:opacity-50 text-white px-6 rounded-xl font-semibold"
              >
                Send
              </button>

            </form>

            <div className="text-center text-[10px] text-gray-400 pb-3 px-3">
              This assistant provides clinic information, not medical diagnosis.
              For emergencies, contact the emergency number.
            </div>

          </div>

        </div>

      </section>

      {/* Footer */}

      <footer className="text-center py-6 text-xs text-gray-500">
        © 2026 Bright Roots Dental | Patient Assistance Portal
      </footer>

    </main>
  );
}