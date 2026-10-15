import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { api } from "../api.js";

export default function VerifyEmail() {
  const location = useLocation();
  const navigate = useNavigate();

  // email comes from the register page
  const [email] = useState(location.state?.email || "");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleVerify(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const data = await api.post("/auth/verify-email", { email, code });
      setMessage(data.message);
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setError("");
    setMessage("");
    try {
      const data = await api.post("/auth/resend-code", { email });
      setMessage(data.message);
    } catch (err) {
      setError(err.message);
    }
  }

  if (!email) {
    return (
      <div className="max-w-sm mx-auto mt-16 p-6 border rounded-lg shadow-sm text-center">
        <p className="text-red-600">No email found. Please register first.</p>
        <Link to="/register" className="text-indigo-600 mt-3 inline-block">Go to Register</Link>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto mt-16 p-6 border rounded-lg shadow-sm">
      <h1 className="text-xl font-bold mb-2">Verify your email</h1>
      <p className="text-sm text-gray-600 mb-4">
        We sent a 6-digit code to <strong>{email}</strong>
      </p>

      {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
      {message && <p className="text-green-600 text-sm mb-2">{message}</p>}

      <form onSubmit={handleVerify} className="flex flex-col gap-3">
        <input
          className="border p-2 rounded text-center text-lg tracking-widest"
          placeholder="123456"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          maxLength={6}
          required
        />
        <button
          className="bg-indigo-600 text-white py-2 rounded disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Verifying..." : "Verify email"}
        </button>
      </form>

      <button
        onClick={handleResend}
        className="text-sm text-indigo-600 mt-4 underline"
      >
        Resend code
      </button>

      <p className="text-sm mt-4">
        Already verified? <Link to="/login" className="text-indigo-600">Log in</Link>
      </p>
    </div>
  );
}