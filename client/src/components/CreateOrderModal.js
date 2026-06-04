import React, { useState } from "react";
import { api } from "../lib/api";

const PRODUCTS = [
  "Mechanical Keyboard", "Wireless Headphones", "USB-C Hub",
  "Standing Desk Mat", "Monitor Arm", "Webcam HD", "Ergonomic Mouse", "Laptop Stand",
];

export function CreateOrderModal({ onClose }) {
  const [form, setForm] = useState({ customer_name: "", product_name: PRODUCTS[0], status: "pending" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  function set(field, val) {
    setForm((f) => ({ ...f, [field]: val }));
  }

  async function handleSubmit() {
    if (!form.customer_name.trim()) { setError("Customer name is required"); return; }
    setLoading(true);
    setError(null);
    try {
      await api.createOrder(form);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ margin: "0 0 24px", fontFamily: "'Syne', sans-serif", fontSize: 20, color: "#fff" }}>
          New Order
        </h2>

        <label style={labelStyle}>Customer Name</label>
        <input
          style={inputStyle}
          value={form.customer_name}
          onChange={(e) => set("customer_name", e.target.value)}
          placeholder="e.g. Priya Sharma"
          autoFocus
        />

        <label style={labelStyle}>Product</label>
        <select style={inputStyle} value={form.product_name} onChange={(e) => set("product_name", e.target.value)}>
          {PRODUCTS.map((p) => <option key={p}>{p}</option>)}
        </select>

        <label style={labelStyle}>Initial Status</label>
        <select style={inputStyle} value={form.status} onChange={(e) => set("status", e.target.value)}>
          <option value="pending">Pending</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
        </select>

        {error && <p style={{ color: "#ef4444", fontFamily: "'Space Mono', monospace", fontSize: 12, margin: "8px 0 0" }}>{error}</p>}

        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
          <button style={cancelBtn} onClick={onClose}>Cancel</button>
          <button style={submitBtn} onClick={handleSubmit} disabled={loading}>
            {loading ? "Creating…" : "Create Order"}
          </button>
        </div>
      </div>
    </div>
  );
}

const overlay = {
  position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
  display: "flex", alignItems: "center", justifyContent: "center",
  zIndex: 100, backdropFilter: "blur(4px)",
};
const modal = {
  background: "#111118", border: "1px solid #2a2a3a", borderRadius: 16,
  padding: 32, width: "100%", maxWidth: 440, boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
};
const labelStyle = {
  display: "block", marginBottom: 6, marginTop: 16,
  fontFamily: "'Space Mono', monospace", fontSize: 11,
  color: "#555", letterSpacing: "0.08em",
};
const inputStyle = {
  width: "100%", boxSizing: "border-box", padding: "10px 14px",
  background: "#0a0a0f", border: "1px solid #2a2a3a", borderRadius: 8,
  color: "#e0e0e0", fontFamily: "'Space Mono', monospace", fontSize: 13,
  outline: "none",
};
const cancelBtn = {
  flex: 1, padding: "10px 16px", background: "transparent",
  border: "1px solid #2a2a3a", borderRadius: 8, color: "#777",
  fontFamily: "'Syne', sans-serif", fontSize: 14, cursor: "pointer",
};
const submitBtn = {
  flex: 2, padding: "10px 16px", background: "#6366f1",
  border: "none", borderRadius: 8, color: "#fff",
  fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 700, cursor: "pointer",
};
