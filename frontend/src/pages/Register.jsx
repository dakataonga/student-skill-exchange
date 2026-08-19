import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api.js";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "", student_id: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const data = await api.post("/auth/register", form);
      setMessage(data.message);
      setTimeout(() => navigate("/login"), 1800);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="max-w-sm mx-auto mt-16 p-6 border rounded-lg shadow-sm">
      <h1 className="text-xl font-bold mb-4">Create account</h1>
      {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
      {message && <p className="text-green-600 text-sm mb-2">{message}</p>}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input className="border p-2 rounded" placeholder="Full name"
               value={form.name} onChange={(e) => update("name", e.target.value)} required />
        <input className="border p-2 rounded" placeholder="College email" type="email"
               value={form.email} onChange={(e) => update("email", e.target.value)} required />
        <input className="border p-2 rounded" placeholder="Student ID number"
               value={form.student_id} onChange={(e) => update("student_id", e.target.value)} required />
        <input className="border p-2 rounded" placeholder="Password" type="password"
               value={form.password} onChange={(e) => update("password", e.target.value)} required />
        <button className="bg-indigo-600 text-white py-2 rounded">Sign up</button>
      </form>
      <p className="text-xs text-gray-500 mt-3">
        You'll be able to browse right away, but you'll need admin approval of your student ID
        before you can post listings or send requests.
      </p>
      <p className="text-sm mt-3">
        Already have an account? <Link to="/login" className="text-indigo-600">Log in</Link>
      </p>
    </div>
  );
}
