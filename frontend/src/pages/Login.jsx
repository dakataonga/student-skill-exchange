import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../AuthContext.jsx";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const data = await api.post("/auth/login", { email, password });
      login(data.token, data.user);
      navigate("/browse");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="max-w-sm mx-auto mt-16 p-6 border rounded-lg shadow-sm">
      <h1 className="text-xl font-bold mb-4">Log in</h1>
      {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input className="border p-2 rounded" placeholder="Email" type="email"
               value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="border p-2 rounded" placeholder="Password" type="password"
               value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button className="bg-indigo-600 text-white py-2 rounded">Log in</button>
      </form>
      <p className="text-sm mt-3">
        No account? <Link to="/register" className="text-indigo-600">Sign up</Link>
      </p>
    </div>
  );
}
