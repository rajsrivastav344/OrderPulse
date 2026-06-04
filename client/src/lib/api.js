const BASE = process.env.REACT_APP_API_URL || "http://localhost:4000/api";

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  listOrders: (page = 1, limit = 20) =>
    request(`/orders?page=${page}&limit=${limit}`),

  createOrder: (data) =>
    request("/orders", { method: "POST", body: JSON.stringify(data) }),

  updateOrder: (id, data) =>
    request(`/orders/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  deleteOrder: (id) =>
    request(`/orders/${id}`, { method: "DELETE" }),
};
