"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Ticket = {
  id: string;
  conversation_id: string;
  subject: string;
  description: string;
  ticket_type: string;
  status: string;
  priority: number;
  created_at: string;
  conversations?: {
    patient_name: string | null;
    patient_phone: string | null;
  } | null;
};

export default function StaffPage() {
  const [session, setSession] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [replies, setReplies] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [staffName, setStaffName] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.user) {
      verifyStaff();
    }
  }, [session]);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) setMessage(error.message);

    setLoading(false);
  }

  async function verifyStaff() {
    const { data, error } = await supabase
      .from("staff_profiles")
      .select("display_name, role")
      .eq("user_id", session.user.id)
      .eq("active", true)
      .maybeSingle();

    if (error || !data) {
      setMessage("Access denied. You are not an authorised staff member.");
      await supabase.auth.signOut();
      return;
    }

    setStaffName(data.display_name);
    loadTickets();
  }

  async function loadTickets() {
    setLoading(true);

    const { data, error } = await supabase
      .from("tickets")
      .select(`
        id,
        conversation_id,
        subject,
        description,
        ticket_type,
        status,
        priority,
        created_at,
        conversations (
          patient_name,
          patient_phone
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      setMessage("Unable to load tickets: " + error.message);
    } else {
      setTickets((data || []) as unknown as Ticket[]);
    }

    setLoading(false);
  }

  async function sendReply(ticket: Ticket) {
    const reply = replies[ticket.id]?.trim();

    if (!reply) {
      setMessage("Please enter a reply before sending.");
      return;
    }

    setLoading(true);
    setMessage("");

    const { error: messageError } = await supabase
      .from("messages")
      .insert({
        conversation_id: ticket.conversation_id,
        sender_role: "staff",
        message_text: reply,
        source: "staff",
      });

    if (messageError) {
      setMessage("Reply failed: " + messageError.message);
      setLoading(false);
      return;
    }

    const { error: ticketError } = await supabase
      .from("tickets")
      .update({
        status: "answered",
        updated_at: new Date().toISOString(),
      })
      .eq("id", ticket.id);

    if (ticketError) {
      setMessage("Reply saved, but ticket status could not be updated.");
    } else {
      setMessage("Reply sent successfully.");
      setReplies((prev) => ({ ...prev, [ticket.id]: "" }));
      await loadTickets();
    }

    setLoading(false);
  }

  async function logout() {
    await supabase.auth.signOut();
    setTickets([]);
    setStaffName("");
  }

  if (!session) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-100 p-5">
        <form
          onSubmit={login}
          className="w-full max-w-md rounded-xl bg-white p-8 shadow"
        >
          <h1 className="mb-2 text-2xl font-bold text-green-800">
            Bright Roots Dental
          </h1>

          <h2 className="mb-6 text-lg font-semibold">
            Staff Login
          </h2>

          <label className="mb-2 block text-sm font-medium">
            Email
          </label>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mb-4 w-full rounded-lg border p-3"
            placeholder="Staff email"
          />

          <label className="mb-2 block text-sm font-medium">
            Password
          </label>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mb-4 w-full rounded-lg border p-3"
            placeholder="Password"
          />

          {message && (
            <p className="mb-4 text-sm text-red-600">{message}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-green-700 p-3 font-semibold text-white"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-5">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-5 shadow">
          <div>
            <h1 className="text-2xl font-bold text-green-800">
              Bright Roots Dental
            </h1>
            <p className="text-sm text-gray-600">
              Staff Dashboard — {staffName}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={loadTickets}
              className="rounded-lg border px-4 py-2"
            >
              Refresh
            </button>

            <button
              onClick={logout}
              className="rounded-lg bg-red-600 px-4 py-2 text-white"
            >
              Logout
            </button>
          </div>
        </header>

        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold">Patient Ticket Queue</h2>
          <span className="rounded-full bg-green-100 px-3 py-1 text-sm text-green-800">
            {tickets.length} Tickets
          </span>
        </div>

        {message && (
          <p className="mb-4 rounded-lg bg-white p-3 text-sm">
            {message}
          </p>
        )}

        {loading && (
          <p className="mb-4 text-gray-600">Loading...</p>
        )}

        <section id="ticket-queue" className="space-y-4">
          {tickets.map((ticket) => (
            <article
              key={ticket.id}
              data-ticket={ticket.id}
              data-status={ticket.status}
              className="rounded-xl bg-white p-5 shadow"
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-bold">{ticket.subject}</h3>

                <span
                  className={`rounded-full px-3 py-1 text-sm font-semibold ${
                    ticket.status === "urgent"
                      ? "bg-red-100 text-red-700"
                      : ticket.status === "needs human"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-green-100 text-green-800"
                  }`}
                >
                  {ticket.status}
                </span>
              </div>

              <p className="mb-2 text-sm text-gray-700">
                <strong>Patient:</strong>{" "}
                {ticket.conversations?.patient_name || "Not provided"}
              </p>

              <p className="mb-2 text-sm text-gray-700">
                <strong>Phone:</strong>{" "}
                {ticket.conversations?.patient_phone || "Not provided"}
              </p>

              <p className="mb-2 text-sm text-gray-700">
                <strong>Type:</strong> {ticket.ticket_type}
              </p>
<p className="mb-2 text-sm text-gray-700">
  <strong>Priority:</strong>{" "}
  <span
    className={
      ticket.priority === 1
        ? "font-semibold text-red-600"
        : ticket.priority === 2
          ? "font-semibold text-yellow-700"
          : "font-semibold text-green-700"
    }
  >
    {ticket.priority === 1
      ? "High"
      : ticket.priority === 2
        ? "Medium"
        : "Low"}
  </span>
</p>

<p className="mb-2 text-sm text-gray-700">
  <strong>Ticket Age:</strong>{" "}
  {(() => {
    const minutes = Math.max(
      0,
      Math.floor(
        (Date.now() - new Date(ticket.created_at).getTime()) / 60000
      )
    );

    if (minutes < 60) return `${minutes} minutes`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)} hours`;
    return `${Math.floor(minutes / 1440)} days`;
  })()}
</p>
              <p className="mb-3 whitespace-pre-wrap text-gray-800">
                {ticket.description}
              </p>

              <p className="mb-3 text-xs text-gray-500">
                Received: {new Date(ticket.created_at).toLocaleString()}
              </p>

              <textarea
                id="staff-reply"
                value={replies[ticket.id] || ""}
                onChange={(e) =>
                  setReplies((prev) => ({
                    ...prev,
                    [ticket.id]: e.target.value,
                  }))
                }
                placeholder="Type your reply to the patient..."
                className="mb-3 min-h-24 w-full rounded-lg border border-gray-300 bg-white p-3 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
              />

              <button
                id="staff-send"
                onClick={() => sendReply(ticket)}
                disabled={loading}
                className="rounded-lg bg-green-700 px-5 py-2 font-semibold text-white"
              >
                Send Reply
              </button>
            </article>
          ))}

          {!loading && tickets.length === 0 && (
            <p className="rounded-lg bg-white p-6 text-center text-gray-600">
              No patient tickets available.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}