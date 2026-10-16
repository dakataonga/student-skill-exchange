
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
import { api } from "../api.js";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      await api.post("/auth/forgot-password", { email });

      setMessage(
        "If an account exists with this email, password reset instructions will be sent."
      );
    } catch (err) {
      setError(err.message || "Unable to process your request.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto mt-16 p-6 border rounded-lg shadow-sm">
      <h1 className="text-xl font-bold mb-2">Forgot Password?</h1>

      <p className="text-sm text-gray-600 mb-5">
        Enter your registered email address to receive instructions
        for resetting your password.
      </p>

      {message && (
        <p role="status" className="text-green-700 text-sm mb-3">
          {message}
        </p>
      )}

      {error && (
        <p role="alert" className="text-red-600 text-sm mb-3">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="relative">
          <Mail
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
          />

          <input
            className="border p-2 pl-10 rounded w-full"
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-moss-600 text-white py-2 rounded disabled:opacity-70"
        >
          {loading ? "Sending..." : "Send Reset Instructions"}
        </button>
      </form>

      <p className="text-sm mt-4">
        Remember your password?{" "}
        <Link to="/login" className="text-indigo-600 hover:underline">
          Back to login
        </Link>
      </p>
    </div>
  );
}
