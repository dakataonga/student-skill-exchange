import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../AuthContext.jsx";
import SkillCard from "../components/SkillCard.jsx";

function AuthRequiredModal({ onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] px-4">
      <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6">
        <h2 className="font-display text-xl mb-2">Please register to request a skill</h2>
        <p className="text-sm text-ink/70 mb-5">
          You need a verified student account to send exchange requests. It only takes a minute to sign up.
        </p>
        <div className="flex gap-3">
          <Link
            to="/register"
            className="flex-1 bg-moss-600 text-white text-center py-2 rounded-sm font-medium hover:bg-moss-700 transition-colors"
          >
            Sign Up
          </Link>
          <button
            onClick={onClose}
            className="flex-1 border border-moss-100 text-ink py-2 rounded-sm hover:bg-moss-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function SuccessToast({ text, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="fixed top-20 right-6 z-[100] bg-moss-600 text-white px-5 py-3 rounded-lg shadow-lg flex items-center gap-3 max-w-sm">
      <span className="text-lg">✓</span>
      <span className="text-sm">{text}</span>
    </div>
  );
}

export default function Browse() {
  const [skills, setSkills] = useState(null);
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState("");
  const [q, setQ] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [successToast, setSuccessToast] = useState("");
  const { user } = useAuth();

  async function loadSkills() {
    setSkills(null);
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (q) params.set("q", q);
    const data = await api.get(`/skills?${params.toString()}`);
    setSkills(data);
  }

  useEffect(() => {
    api.get("/skills/categories").then(setCategories);
    loadSkills();
  }, []);

  useEffect(() => {
    loadSkills();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  async function handleRequest(skill) {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    try {
      await api.post("/requests", { skill_id: skill.id });
      setSuccessToast(`Request sent to ${skill.provider_name}!`);
    } catch (err) {
      setErrorMessage(err.message);
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-10">
      {showAuthModal && <AuthRequiredModal onClose={() => setShowAuthModal(false)} />}
      {successToast && <SuccessToast text={successToast} onClose={() => setSuccessToast("")} />}

      <h1 className="font-display text-3xl mb-1">What can we trade today?</h1>
      <p className="text-ink/60 mb-6">Skills offered by verified students on campus.</p>

      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <input
          className="border border-moss-100 bg-white p-2.5 rounded-sm flex-1 focus:outline-none focus:ring-2 focus:ring-moss-400"
          placeholder="Search for a skill..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && loadSkills()}
        />
        <select
          className="border border-moss-100 bg-white p-2.5 rounded-sm focus:outline-none focus:ring-2 focus:ring-moss-400"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.name}>{c.name}</option>
          ))}
        </select>
        <button onClick={loadSkills} className="bg-moss-600 text-white px-5 rounded-sm font-medium hover:bg-moss-700 transition-colors">
          Search
        </button>
      </div>

      {errorMessage && (
        <p className="text-sm bg-clay-500/10 text-clay-600 px-4 py-2 rounded-sm mb-5 inline-block">{errorMessage}</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {skills === null &&
          [1, 2, 3].map((i) => (
            <div key={i} className="border border-moss-100 rounded-lg p-5 animate-pulse h-48 bg-white">
              <div className="h-3 bg-moss-50 rounded w-1/3 mb-3"></div>
              <div className="h-5 bg-moss-50 rounded w-2/3 mb-3"></div>
              <div className="h-3 bg-moss-50 rounded w-full mb-2"></div>
              <div className="h-3 bg-moss-50 rounded w-1/2"></div>
            </div>
          ))}
        {skills && skills.map((skill) => (
          <SkillCard key={skill.id} skill={skill} onRequest={handleRequest} />
        ))}
      </div>

      {skills && skills.length === 0 && (
        <div className="border border-dashed border-moss-100 rounded-lg p-10 text-center mt-2">
          <p className="font-display text-xl mb-1">Nothing here yet</p>
          <p className="text-sm text-ink/60">Try a different search term or category.</p>
        </div>
      )}
    </div>
  );
}