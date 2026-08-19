import React, { useEffect, useState } from "react";
import { api } from "../api.js";
import { useAuth } from "../AuthContext.jsx";
import SkillCard from "../components/SkillCard.jsx";

export default function Browse() {
  const [skills, setSkills] = useState(null);
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState("");
  const [q, setQ] = useState("");
  const [message, setMessage] = useState("");
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
      setMessage("Please log in to request a session.");
      return;
    }
    try {
      await api.post("/requests", { skill_id: skill.id });
      setMessage(`Request sent to ${skill.provider_name}!`);
    } catch (err) {
      setMessage(err.message);
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Browse Skills</h1>

      <div className="flex gap-3 mb-4">
        <input
          className="border p-2 rounded flex-1"
          placeholder="Search skills..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && loadSkills()}
        />
        <select className="border p-2 rounded" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.name}>{c.name}</option>
          ))}
        </select>
        <button onClick={loadSkills} className="bg-indigo-600 text-white px-4 rounded">Search</button>
      </div>

      {message && <p className="text-sm text-indigo-700 mb-3">{message}</p>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {skills === null &&
          [1, 2, 3].map((i) => (
            <div key={i} className="border rounded-lg p-4 animate-pulse h-40">
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-3"></div>
              <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        {skills && skills.map((skill) => (
          <SkillCard key={skill.id} skill={skill} onRequest={handleRequest} />
        ))}
      </div>
      {skills && skills.length === 0 && (
        <div className="border rounded-lg p-8 text-center mt-2">
          <p className="text-gray-500 mb-1">No listings found.</p>
          <p className="text-sm text-gray-400">Try a different search term or category.</p>
        </div>
      )}
    </div>
  );
}