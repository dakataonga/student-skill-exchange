const BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : "/api";

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handle(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export const api = {
  get: (path) => fetch(`${BASE}${path}`, { headers: { ...authHeaders() } }).then(handle),

  post: (path, body) =>
    fetch(`${BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(body),
    }).then(handle),

  patch: (path, body) =>
    fetch(`${BASE}${path}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(body || {}),
    }).then(handle),

  delete: (path) =>
    fetch(`${BASE}${path}`, { method: "DELETE", headers: { ...authHeaders() } }).then(handle),
};
