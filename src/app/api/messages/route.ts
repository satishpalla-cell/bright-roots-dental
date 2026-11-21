import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversationId");
    const accessToken = request.headers.get("x-conversation-token");

    if (!conversationId || !accessToken) {
      return NextResponse.json(
        { error: "Conversation ID and access token are required" },
        { status: 401 }
      );
    }

    // Verify conversation ownership
    const { data: conversation, error: authError } = await supabase
      .from("conversations")
      .select("id")
      .eq("id", conversationId)
      .eq("access_token", accessToken)
      .maybeSingle();

    if (authError) throw authError;

    if (!conversation) {
      return NextResponse.json(
        { error: "Unauthorized conversation access" },
        { status: 403 }
      );
    }

    // Retrieve messages only after successful verification
    const { data, error } = await supabase
      .from("messages")
      .select("id, sender_role, message_text, created_at, source")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    return NextResponse.json({
      count: data?.length ?? 0,
      messages: data ?? [],
    });
  } catch (error) {
    console.error("Messages API error:", error);

    return NextResponse.json(
      { error: "Unable to retrieve messages" },
      { status: 500 }
    );
  }
}