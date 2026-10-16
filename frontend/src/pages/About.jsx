
import React, { useState } from "react";
import { Trash2, Users, BookOpen, Handshake } from "lucide-react";
import { useAuth } from "../AuthContext.jsx";
import { api } from "../api.js";

export default function About() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleDeleteRequest() {
    const confirmed = window.confirm(
      "Are you sure you want to request account deletion? " +
      "Your request will be sent to the administrator for review."
    );

    if (!confirmed) return;

    setLoading(true);
    setMessage("");
    setError("");

    try {
      // This endpoint must be implemented in your backend.
      await api.post("/account/delete-request", {});

      setMessage(
        "Your account deletion request has been submitted. " +
        "The administrator will be notified."
      );
    } catch (err) {
      setError(
        err.message ||
        "Unable to submit your request. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <section className="text-center mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-moss-600 mb-4">
          About Skillxchange
        </h1>

        <p className="text-gray-600 leading-7 max-w-2xl mx-auto">
          Skillxchange is a student skill-sharing platform that connects
          students who want to learn new skills with those who are willing
          to share their knowledge and expertise. It encourages collaboration,
          peer learning, and the exchange of practical skills within the
          student community.
        </p>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
        <div className="border rounded-lg p-6 text-center shadow-sm">
          <Users
            size={32}
            className="mx-auto mb-3 text-moss-600"
          />
          <h2 className="font-semibold mb-2">Connect</h2>
          <p className="text-sm text-gray-600">
            Find other students with skills, interests, and knowledge
            you would like to learn.
          </p>
        </div>

        <div className="border rounded-lg p-6 text-center shadow-sm">
          <BookOpen
            size={32}
            className="mx-auto mb-3 text-moss-600"
          />
          <h2 className="font-semibold mb-2">Learn</h2>
          <p className="text-sm text-gray-600">
            Develop your abilities by learning from fellow students
            and exploring new skills.
          </p>
        </div>

        <div className="border rounded-lg p-6 text-center shadow-sm">
          <Handshake
            size={32}
            className="mx-auto mb-3 text-moss-600"
          />
          <h2 className="font-semibold mb-2">Exchange</h2>
          <p className="text-sm text-gray-600">
            Share what you know, help others grow, and build a
            collaborative learning community.
          </p>
        </div>
      </section>

      {user && (
        <section className="border border-red-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <Trash2 className="text-red-600" size={24} />
            <h2 className="text-xl font-semibold">
              Delete Account
            </h2>
          </div>

          <p className="text-sm text-gray-600 leading-6 mb-4">
            If you no longer wish to use Skillxchange, you can submit
            an account deletion request. The administrator will be
            notified and can review your request.
          </p>

          {message && (
            <p
              role="status"
              className="text-green-700 text-sm mb-4"
            >
              {message}
            </p>
          )}

          {error && (
            <p
              role="alert"
              className="text-red-600 text-sm mb-4"
            >
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={handleDeleteRequest}
            disabled={loading}
            className="bg-red-600 text-white px-5 py-2 rounded-md hover:bg-red-700 disabled:opacity-60 transition-colors"
          >
            {loading ? "Submitting request..." : "Request Account Deletion"}
          </button>
        </section>
      )}
    </div>
  );
}
