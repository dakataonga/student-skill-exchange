import React, { useEffect, useState } from "react";
import { api } from "../api.js";
import { useAuth } from "../AuthContext.jsx";

function MessageThread({ requestId, onClose }) {
  const [messages, setMessages] = useState(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    try {
      const data = await api.get(`/requests/${requestId}/messages`);
      setMessages(data);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => { load(); }, [requestId]);

  async function send(e) {
    e.preventDefault();
    if (!draft.trim()) {
      setError("Type a message first.");
      return;
    }
    setSending(true);
    setError("");
    try {
      await api.post(`/requests/${requestId}/messages`, { body: draft.trim() });
      setDraft("");
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mt-3 border-t pt-3">
      <div className="flex justify-between items-center mb-2">
        <p className="text-sm font-medium">Messages</p>
        <button onClick={onClose} className="text-xs text-gray-500 underline">Close</button>
      </div>

      <div className="max-h-48 overflow-y-auto space-y-2 mb-2 bg-gray-50 rounded p-2">
        {messages === null && <p className="text-xs text-gray-400">Loading messages...</p>}
        {messages && messages.length === 0 && (
          <p className="text-xs text-gray-400">No messages yet. Say hello!</p>
        )}
        {messages && messages.map((m) => (
          <div key={m.id} className="text-sm">
            <span className="font-medium">{m.sender_name}: </span>
            <span>{m.body}</span>
          </div>
        ))}
      </div>

      {error && <p className="text-xs text-red-600 mb-1">{error}</p>}
      <form onSubmit={send} className="flex gap-2">
        <input
          className="border p-1.5 rounded flex-1 text-sm"
          placeholder="Write a message..."
          value={draft}
          onChange={(e) => { setDraft(e.target.value); if (error) setError(""); }}
        />
        <button disabled={sending} className="bg-indigo-600 text-white px-3 py-1.5 rounded text-sm disabled:opacity-50">
          {sending ? "Sending..." : "Send"}
        </button>
      </form>
    </div>
  );
}

export default function Requests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState(null);
  const [message, setMessage] = useState("");
  const [openThreadId, setOpenThreadId] = useState(null);

  async function load() {
    try {
      const data = await api.get("/requests/mine");
      setRequests(data);
    } catch (err) {
      setMessage(err.message);
      setRequests([]);
    }
  }

  useEffect(() => { load(); }, []);

  async function updateStatus(id, status) {
    try {
      await api.patch(`/requests/${id}/status`, { status });
      load();
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function markPaid(id) {
    try {
      await api.patch(`/requests/${id}/pay`);
      load();
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function leaveReview(id) {
    const rating = Number(prompt("Rating 1-5:"));
    if (!rating || rating < 1 || rating > 5) {
      setMessage("Rating must be a number between 1 and 5.");
      return;
    }
    const comment = prompt("Comment (optional):") || "";
    try {
      await api.post("/reviews", { request_id: id, rating, comment });
      setMessage("Review submitted!");
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function reportUser(otherUserId, otherUserName) {
    const reason = prompt(`Why are you reporting ${otherUserName}?`);
    if (!reason || !reason.trim()) return;
    try {
      await api.post("/reports", { reported_user: otherUserId, reason: reason.trim() });
      setMessage(`Report submitted. An admin will review it.`);
    } catch (err) {
      setMessage(err.message);
    }
  }

  if (!user) return <p className="p-6">Please log in to view your requests.</p>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">My Requests</h1>
      {message && <p className="text-sm text-indigo-700 mb-3">{message}</p>}

      {requests === null && (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="border rounded-lg p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/4"></div>
            </div>
          ))}
        </div>
      )}

      {requests && requests.length === 0 && (
        <div className="border rounded-lg p-8 text-center">
          <p className="text-gray-500 mb-1">No requests yet.</p>
          <p className="text-sm text-gray-400">
            Head to Browse to find a listing and send your first request.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {requests && requests.map((r) => {
          const iAmProvider = r.provider_id === user.id;
          return (
            <div key={r.id} className="border rounded-lg p-4">
              <div className="flex justify-between">
                <div>
                  <p className="font-semibold">{r.skill_title}</p>
                  <p className="text-sm text-gray-600">
                    {iAmProvider ? `From ${r.seeker_name}` : `To ${r.provider_name}`}
                  </p>
                </div>
                <span className="text-xs bg-gray-100 px-2 py-1 rounded h-fit">{r.status}</span>
              </div>

              <p className="text-sm mt-2">
                Payment: {r.agreed_payment}
                {r.agreed_price ? ` ($${r.agreed_price})` : ""}
                {r.paid && " — paid ✓"}
              </p>

              <div className="flex gap-2 mt-3 flex-wrap">
                {iAmProvider && r.status === "pending" && (
                  <>
                    <button onClick={() => updateStatus(r.id, "accepted")} className="bg-green-600 text-white px-3 py-1 rounded text-sm">Accept</button>
                    <button onClick={() => updateStatus(r.id, "rejected")} className="bg-red-600 text-white px-3 py-1 rounded text-sm">Reject</button>
                  </>
                )}
                {r.status === "accepted" && (
                  <button onClick={() => updateStatus(r.id, "completed")} className="bg-indigo-600 text-white px-3 py-1 rounded text-sm">Mark Completed</button>
                )}
                {!iAmProvider && r.agreed_payment !== "barter" && !r.paid && r.status !== "rejected" && (
                  <button onClick={() => markPaid(r.id)} className="bg-yellow-500 text-white px-3 py-1 rounded text-sm">Mark as Paid (mock)</button>
                )}
                {r.status === "completed" && (
                  <button onClick={() => leaveReview(r.id)} className="bg-gray-700 text-white px-3 py-1 rounded text-sm">Leave Review</button>
                )}
                {["pending", "accepted"].includes(r.status) && (
                  <button onClick={() => updateStatus(r.id, "cancelled")} className="text-sm text-gray-500 underline">Cancel</button>
                )}
                <button
                  onClick={() => setOpenThreadId(openThreadId === r.id ? null : r.id)}
                  className="text-sm text-indigo-600 underline"
                >
                  {openThreadId === r.id ? "Hide messages" : "Messages"}
                </button>
                <button
                  onClick={() =>
                    reportUser(
                      iAmProvider ? r.seeker_id : r.provider_id,
                      iAmProvider ? r.seeker_name : r.provider_name
                    )
                  }
                  className="text-sm text-red-500 underline ml-auto"
                >
                  Report
                </button>
              </div>

              {openThreadId === r.id && (
                <MessageThread requestId={r.id} onClose={() => setOpenThreadId(null)} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}