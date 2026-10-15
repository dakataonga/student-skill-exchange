import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api.js";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "", student_id: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/register", form);
      // Go to the verification page and pass the email
      navigate("/verify-email", { state: { email: form.email } });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto mt-16 p-6 border rounded-lg shadow-sm">
      <h1 className="text-xl font-bold mb-4">Create account</h1>
      {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input className="border p-2 rounded" placeholder="Full name"
               value={form.name} onChange={(e) => update("name", e.target.value)} required />
        <input className="border p-2 rounded" placeholder="College email" type="email"
               value={form.email} onChange={(e) => update("email", e.target.value)} required />
        <input className="border p-2 rounded" placeholder="Student ID number"
               value={form.student_id} onChange={(e) => update("student_id", e.target.value)} required />
        <input className="border p-2 rounded" placeholder="Password" type="password"
               value={form.password} onChange={(e) => update("password", e.target.value)} required />
        <button className="bg-indigo-600 text-white py-2 rounded disabled:opacity-50" disabled={loading}>
          {loading ? "Creating account..." : "Sign up"}
        </button>
      </form>
      <p className="text-xs text-gray-500 mt-3">
        After signing up you will receive a verification code in your email.
      </p>
      <p className="text-sm mt-3">
        Already have an account? <Link to="/login" className="text-indigo-600">Log in</Link>
      </p>
    </div>
  );
}