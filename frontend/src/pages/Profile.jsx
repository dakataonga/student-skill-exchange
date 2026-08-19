import React, { useEffect, useState } from "react";
import { api } from "../api.js";
import { useAuth } from "../AuthContext.jsx";

export default function Profile() {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [matches, setMatches] = useState([]);
  const [message, setMessage] = useState("");
  const [aiMatches, setAiMatches] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  async function findAiMatches() {
    setAiLoading(true);
    setAiError("");
    try {
      const data = await api.get("/skills/ai-matches");
      setAiMatches(data.matches);
      if (data.message) setAiError(data.message);
    } catch (err) {
      setAiError(err.message);
    } finally {
      setAiLoading(false);
    }
  }

  const [offerForm, setOfferForm] = useState({
    category_id: "", title: "", description: "", payment_type: "barter", price: "", availability: "",
  });
  const [wantForm, setWantForm] = useState({ category_id: "", notes: "" });

  useEffect(() => {
    api.get("/skills/categories").then(setCategories);
    api.get("/skills/matches").then(setMatches).catch(() => {});
  }, []);

  async function submitOffer(e) {
    e.preventDefault();
    if (!offerForm.category_id) {
      setMessage("Please select a category.");
      return;
    }
    if (!offerForm.title.trim()) {
      setMessage("Title is required.");
      return;
    }
    if (offerForm.payment_type !== "barter" && !offerForm.price) {
      setMessage("Please enter a price, or switch to barter only.");
      return;
    }
    try {
      await api.post("/skills", {
        ...offerForm,
        category_id: Number(offerForm.category_id),
        price: offerForm.price ? Number(offerForm.price) : null,
      });
      setMessage("Listing created!");
      setOfferForm({ category_id: "", title: "", description: "", payment_type: "barter", price: "", availability: "" });
    } catch (err) {
      setMessage(err.message);
    }
  }
  async function submitWant(e) {
    e.preventDefault();
    try {
      await api.post("/skills/wanted", { ...wantForm, category_id: Number(wantForm.category_id) });
      setMessage("Added to skills you're looking for!");
      setWantForm({ category_id: "", notes: "" });
      api.get("/skills/matches").then(setMatches);
    } catch (err) {
      setMessage(err.message);
    }
  }

  if (!user) return <p className="p-6">Please log in to view your profile.</p>;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">{user.name}'s Profile</h1>
        <p className="text-sm text-gray-500">
          {user.verified ? "✓ Verified student" : "Student ID pending admin verification"}
        </p>
      </div>

      {message && <p className="text-sm text-indigo-700">{message}</p>}

      <section className="border rounded-lg p-4">
        <h2 className="font-semibold mb-3">Offer a skill</h2>
        <form onSubmit={submitOffer} className="grid grid-cols-2 gap-3">
          <select className="border p-2 rounded col-span-2" value={offerForm.category_id}
                  onChange={(e) => setOfferForm({ ...offerForm, category_id: e.target.value })} required>
            <option value="">Select category</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input className="border p-2 rounded col-span-2" placeholder="Title (e.g. Python tutoring for beginners)"
                 value={offerForm.title} onChange={(e) => setOfferForm({ ...offerForm, title: e.target.value })} required />
          <textarea className="border p-2 rounded col-span-2" placeholder="Description"
                    value={offerForm.description} onChange={(e) => setOfferForm({ ...offerForm, description: e.target.value })} />
          <select className="border p-2 rounded" value={offerForm.payment_type}
                  onChange={(e) => setOfferForm({ ...offerForm, payment_type: e.target.value })}>
            <option value="barter">Barter only</option>
            <option value="paid">Paid only</option>
            <option value="both">Barter or paid</option>
          </select>
          <input className="border p-2 rounded" placeholder="Price (if paid)" type="number"
                 value={offerForm.price} onChange={(e) => setOfferForm({ ...offerForm, price: e.target.value })} />
          <input className="border p-2 rounded col-span-2" placeholder="Availability (e.g. weekday evenings)"
                 value={offerForm.availability} onChange={(e) => setOfferForm({ ...offerForm, availability: e.target.value })} />
          <button className="bg-indigo-600 text-white py-2 rounded col-span-2">Post listing</button>
        </form>
      </section>

      <section className="border rounded-lg p-4">
        <h2 className="font-semibold mb-3">Skills I'm looking for</h2>
        <form onSubmit={submitWant} className="flex gap-3">
          <select className="border p-2 rounded flex-1" value={wantForm.category_id}
                  onChange={(e) => setWantForm({ ...wantForm, category_id: e.target.value })} required>
            <option value="">Select category</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input className="border p-2 rounded flex-1" placeholder="Notes (optional)"
                 value={wantForm.notes} onChange={(e) => setWantForm({ ...wantForm, notes: e.target.value })} />
          <button className="bg-indigo-600 text-white px-4 rounded">Add</button>
        </form>
      </section>

      <section className="border rounded-lg p-4 bg-indigo-50">
        <div className="flex justify-between items-center mb-2">
          <h2 className="font-semibold">✨ AI-powered matches</h2>
          <button
            onClick={findAiMatches}
            disabled={aiLoading}
            className="bg-indigo-600 text-white px-3 py-1.5 rounded text-sm disabled:opacity-50"
          >
            {aiLoading ? "Thinking..." : "Find matches with AI"}
          </button>
        </div>
        <p className="text-xs text-gray-500 mb-2">
          Uses Claude to compare what you're looking for against every listing's
          full description, not just its category — so it can catch relevant matches
          that pure category search would miss.
        </p>
        {aiError && <p className="text-sm text-red-600">{aiError}</p>}
        {aiMatches && aiMatches.length > 0 && (
          <ul className="space-y-2 mt-2">
            {aiMatches.map((m) => (
              <li key={m.id} className="text-sm border-b pb-2">
                <div className="flex justify-between">
                  <strong>{m.title}</strong>
                  <span className="text-indigo-700">{m.score}% match</span>
                </div>
                <p className="text-gray-600">{m.provider_name} — {m.category_name}</p>
                <p className="italic text-gray-500 mt-1">{m.reason}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="border rounded-lg p-4">
        <h2 className="font-semibold mb-3">Suggested matches (category-based)</h2>
        <p className="text-xs text-gray-500 mb-2">
          Students who offer something you want, and want something you offer.
        </p>
        {matches.length === 0 && <p className="text-gray-500 text-sm">No mutual matches yet.</p>}
        <ul className="space-y-2">
          {matches.map((m, i) => (
            <li key={i} className="text-sm border-b pb-2">
              <strong>{m.user_name}</strong> offers "{m.they_offer_title}" ({m.they_offer_category})
              and wants your {m.you_offer_category} skills.
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
