import React, { useEffect, useState } from "react";
import { api } from "../api.js";
import { useAuth } from "../AuthContext.jsx";

export default function Admin() {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState("overview");
  const [pendingUsers, setPendingUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [deletionRequests, setDeletionRequests] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [actionMsg, setActionMsg] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [pending, reps, dels, users] = await Promise.all([
        api.get("/admin/users?verified=false"),
        api.get("/admin/reports"),
        api.get("/admin/deletion-requests"),
        api.get("/admin/users"),
      ]);
      setPendingUsers(pending || []);
      setReports(reps || []);
      setDeletionRequests(dels || []);
      setAllUsers(users || []);
    } catch (err) {
      console.error(err);
      setActionMsg(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function verify(id) {
    try {
      await api.patch(`/admin/users/${id}/verify`);
      setActionMsg("Student verified successfully");
      load();
    } catch (err) {
      setActionMsg(err.message || "Failed to verify student");
    }
  }

  async function resolveReport(id) {
    try {
      await api.patch(`/admin/reports/${id}/resolve`);
      setActionMsg("Report marked as resolved");
      load();
    } catch (err) {
      setActionMsg(err.message || "Failed to resolve report");
    }
  }

  async function approveDeletion(id, userName) {
    const confirmed = window.confirm(
      `Permanently delete the account of "${userName}"?\n\nThis cannot be undone.`
    );
    if (!confirmed) return;

    try {
      await api.patch(`/admin/deletion-requests/${id}/approve`);
      setActionMsg(`Account of "${userName}" has been permanently deleted.`);
      load();
    } catch (err) {
      setActionMsg(err.message || "Failed to delete account");
    }
  }

  async function rejectDeletion(id) {
    try {
      await api.patch(`/admin/deletion-requests/${id}/reject`);
      setActionMsg("Deletion request rejected.");
      load();
    } catch (err) {
      setActionMsg(err.message || "Failed to reject request");
    }
  }

  if (!user || user.role !== "admin") {
    return <p className="p-6">Admin access only.</p>;
  }

  const totalStudents = allUsers.filter((u) => u.role === "student").length;
  const openReports = reports.filter((r) => !r.resolved).length;

  const menuItems = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "verifications", label: "Verifications", icon: "✅" },
    { id: "deletions", label: "Account Deletion", icon: "🗑️" },
    { id: "reports", label: "Reports", icon: "🚩" },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* ===== LEFT SIDEBAR ===== */}
      <aside className="w-64 bg-slate-800 text-white flex flex-col">
        <div className="p-5 border-b border-slate-700">
          <h1 className="text-lg font-bold">Admin Panel</h1>
          <p className="text-xs text-slate-400 mt-1">SkillXchange</p>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-sm transition ${
                activeSection === item.id
                  ? "bg-indigo-600 text-white"
                  : "text-slate-300 hover:bg-slate-700"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-700 text-xs text-slate-400">
          Logged in as {user.name}
        </div>
      </aside>

      {/* ===== RIGHT MAIN AREA ===== */}
      <main className="flex-1 p-6 overflow-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">
            {menuItems.find((m) => m.id === activeSection)?.label}
          </h2>
          <button
            onClick={load}
            className="text-sm bg-white border hover:bg-gray-50 px-3 py-1.5 rounded shadow-sm"
          >
            Refresh Data
          </button>
        </div>

        {actionMsg && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded flex justify-between items-center">
            <span>{actionMsg}</span>
            <button
              onClick={() => setActionMsg("")}
              className="text-green-700 font-bold text-lg leading-none"
            >
              ×
            </button>
          </div>
        )}

        {loading && <p className="text-gray-500">Loading data...</p>}

        {/* ===== OVERVIEW ===== */}
        {activeSection === "overview" && !loading && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl border p-5 shadow-sm">
                <p className="text-sm text-gray-500">Total Students</p>
                <p className="text-3xl font-bold text-indigo-600 mt-1">{totalStudents}</p>
              </div>
              <div className="bg-white rounded-xl border p-5 shadow-sm">
                <p className="text-sm text-gray-500">Pending Verifications</p>
                <p className="text-3xl font-bold text-amber-600 mt-1">{pendingUsers.length}</p>
              </div>
              <div className="bg-white rounded-xl border p-5 shadow-sm">
                <p className="text-sm text-gray-500">Deletion Requests</p>
                <p className="text-3xl font-bold text-red-600 mt-1">{deletionRequests.length}</p>
              </div>
              <div className="bg-white rounded-xl border p-5 shadow-sm">
                <p className="text-sm text-gray-500">Open Reports</p>
                <p className="text-3xl font-bold text-orange-600 mt-1">{openReports}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl border p-6 shadow-sm">
              <h3 className="font-semibold mb-3">Quick Summary</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• <strong>{totalStudents}</strong> students have registered on the platform.</li>
                <li>• <strong>{pendingUsers.length}</strong> students are waiting for ID verification.</li>
                <li>• <strong>{deletionRequests.length}</strong> account deletion requests need review.</li>
                <li>• <strong>{openReports}</strong> reports are still open.</li>
              </ul>
            </div>
          </div>
        )}

        {/* ===== VERIFICATIONS ===== */}
        {activeSection === "verifications" && !loading && (
          <div className="bg-white rounded-xl border shadow-sm">
            <div className="p-5 border-b">
              <h3 className="font-semibold">Pending Student ID Verifications</h3>
              <p className="text-sm text-gray-500 mt-1">
                Review and approve student identity before they can post listings or send requests.
              </p>
            </div>

            {pendingUsers.length === 0 ? (
              <p className="p-6 text-gray-500 text-sm">No pending verifications.</p>
            ) : (
              <div className="divide-y">
                {pendingUsers.map((u) => (
                  <div key={u.id} className="p-5 flex justify-between items-center">
                    <div>
                      <p className="font-medium">{u.name}</p>
                      <p className="text-sm text-gray-500">{u.email}</p>
                      <p className="text-sm text-gray-500">Student ID: {u.student_id}</p>
                    </div>
                    <button
                      onClick={() => verify(u.id)}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm"
                    >
                      Verify Student
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===== ACCOUNT DELETION ===== */}
        {activeSection === "deletions" && !loading && (
          <div className="bg-white rounded-xl border shadow-sm">
            <div className="p-5 border-b">
              <h3 className="font-semibold text-red-700">Account Deletion Requests</h3>
              <p className="text-sm text-gray-500 mt-1">
                Students who requested to permanently delete their accounts.
              </p>
            </div>

            {deletionRequests.length === 0 ? (
              <p className="p-6 text-gray-500 text-sm">No pending deletion requests.</p>
            ) : (
              <div className="divide-y">
                {deletionRequests.map((r) => (
                  <div key={r.id} className="p-5 flex justify-between items-center bg-red-50">
                    <div>
                      <p className="font-medium">{r.user_name || r.name || "Unknown"}</p>
                      <p className="text-sm text-gray-500">{r.user_email || r.email}</p>
                      <p className="text-sm text-gray-500">
                        Student ID: {r.student_id || "—"}
                      </p>
                      {r.reason && (
                        <p className="text-sm text-gray-600 mt-1">Reason: {r.reason}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        Requested: {new Date(r.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          approveDeletion(r.id, r.user_name || r.name || "this user")
                        }
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-sm"
                      >
                        Approve & Delete
                      </button>
                      <button
                        onClick={() => rejectDeletion(r.id)}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1.5 rounded text-sm"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===== REPORTS ===== */}
        {activeSection === "reports" && !loading && (
          <div className="bg-white rounded-xl border shadow-sm">
            <div className="p-5 border-b">
              <h3 className="font-semibold">Reports</h3>
              <p className="text-sm text-gray-500 mt-1">
                Review reports submitted by students about misconduct.
              </p>
            </div>

            {reports.length === 0 ? (
              <p className="p-6 text-gray-500 text-sm">No reports yet.</p>
            ) : (
              <div className="divide-y">
                {reports.map((r) => (
                  <div key={r.id} className="p-5">
                    <p className="text-sm">
                      <strong>{r.reporter_name}</strong> reported{" "}
                      <strong>{r.reported_name}</strong>
                    </p>
                    <p className="text-sm text-gray-600 mt-1">{r.reason}</p>
                    <p className="text-xs mt-2">
                      Status:{" "}
                      <span
                        className={
                          r.resolved ? "text-green-600" : "text-orange-600 font-medium"
                        }
                      >
                        {r.resolved ? "Resolved" : "Open"}
                      </span>
                    </p>
                    {!r.resolved && (
                      <button
                        onClick={() => resolveReport(r.id)}
                        className="mt-3 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded text-sm"
                      >
                        Mark as Resolved
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}