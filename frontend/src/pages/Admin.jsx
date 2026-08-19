import React, { useEffect, useState } from "react";
import { api } from "../api.js";
import { useAuth } from "../AuthContext.jsx";

export default function Admin() {
  const { user } = useAuth();
  const [pendingUsers, setPendingUsers] = useState([]);
  const [reports, setReports] = useState([]);

  async function load() {
    setPendingUsers(await api.get("/admin/users?verified=false"));
    setReports(await api.get("/admin/reports"));
  }

  useEffect(() => { load(); }, []);

  async function verify(id) {
    await api.patch(`/admin/users/${id}/verify`);
    load();
  }

  async function resolveReport(id) {
    await api.patch(`/admin/reports/${id}/resolve`);
    load();
  }

  if (!user || user.role !== "admin") return <p className="p-6">Admin access only.</p>;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>

      <section>
        <h2 className="font-semibold mb-3">Pending Student ID Verifications</h2>
        <div className="space-y-2">
          {pendingUsers.map((u) => (
            <div key={u.id} className="border rounded p-3 flex justify-between items-center">
              <div>
                <p className="font-medium">{u.name} ({u.email})</p>
                <p className="text-sm text-gray-500">Student ID: {u.student_id}</p>
              </div>
              <button onClick={() => verify(u.id)} className="bg-green-600 text-white px-3 py-1 rounded text-sm">
                Verify
              </button>
            </div>
          ))}
          {pendingUsers.length === 0 && <p className="text-gray-500 text-sm">No pending verifications.</p>}
        </div>
      </section>

      <section>
        <h2 className="font-semibold mb-3">Reports</h2>
        <div className="space-y-2">
          {reports.map((r) => (
            <div key={r.id} className="border rounded p-3">
              <p className="text-sm"><strong>{r.reporter_name}</strong> reported <strong>{r.reported_name}</strong></p>
              <p className="text-sm text-gray-600">{r.reason}</p>
              <p className="text-xs mt-1">{r.resolved ? "Resolved" : "Open"}</p>
              {!r.resolved && (
                <button onClick={() => resolveReport(r.id)} className="mt-2 bg-indigo-600 text-white px-3 py-1 rounded text-sm">
                  Mark Resolved
                </button>
              )}
            </div>
          ))}
          {reports.length === 0 && <p className="text-gray-500 text-sm">No reports.</p>}
        </div>
      </section>
    </div>
  );
}
