
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, LoaderCircle } from "lucide-react";
import { api } from "../api.js";
import { useAuth } from "../AuthContext.jsx";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await api.post("/auth/login", { email, password });
      login(data.token, data.user);
      navigate("/browse");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto mt-16 p-6 border rounded-lg shadow-sm">
      <h1 className="text-xl font-bold mb-4">Log in</h1>

      {error && (
        <p className="text-red-600 text-sm mb-2">{error}</p>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="relative">
          <Mail
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
          />
          <input
            className="border p-2 pl-10 rounded w-full"
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="relative">
          <Lock
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
          />
          <input
            className="border p-2 pl-10 rounded w-full"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-moss-600 text-white py-2 rounded flex items-center justify-center gap-2 disabled:opacity-70"
        >
          {loading && (
            <LoaderCircle size={18} className="animate-spin" />
          )}
          {loading ? "Logging in..." : "Log in"}
        </button>
      </form>
      <div className="text-right">
  <Link
    to="/forgot-password"
    className="text-sm text-moss-600 hover:text-black transition-colors"
  >
    Forgot password?
  </Link>
</div>

      <p className="text-sm mt-3">
        No account?{" "}
        <Link to="/register" className="text-indigo-600">
          Sign up
        </Link>
      </p>
    </div>

    
    
  );
}
