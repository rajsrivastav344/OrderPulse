import React, { useState } from "react";
import { StatusBadge } from "./StatusBadge";
import { api } from "../lib/api";

const STATUSES = ["pending", "shipped", "delivered"];

function timeAgo(date) {
  const diff = (Date.now() - new Date(date)) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function OrderRow({ order, highlighted }) {
  const [deleting, setDeleting] = useState(false);
  const [updating, setUpdating] = useState(false);

  async function cycleStatus() {
    const next = STATUSES[(STATUSES.indexOf(order.status) + 1) % STATUSES.length];
    setUpdating(true);
    try {
      await api.updateOrder(order._id, { status: next });
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Delete order for ${order.customer_name}?`)) return;
    setDeleting(true);
    try {
      await api.deleteOrder(order._id);
    } catch (err) {
      console.error(err);
      setDeleting(false);
    }
  }

  return (
    <tr style={{
      borderBottom: "1px solid #13131e",
      background: highlighted ? "rgba(99,102,241,0.07)" : "transparent",
      transition: "background 1s ease",
    }}>
      <td style={td}>
        <span style={{ color: "#ccc", fontWeight: 600 }}>{order.customer_name}</span>
      </td>
      <td style={td}>
        <span style={{ color: "#888" }}>{order.product_name}</span>
      </td>
      <td style={td}>
        <button
          onClick={cycleStatus}
          disabled={updating}
          title="Click to advance status"
          style={{ background: "none", border: "none", cursor: "pointer", padding: 0, opacity: updating ? 0.5 : 1 }}
        >
          <StatusBadge status={order.status} />
        </button>
      </td>
      <td style={{ ...td, fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#444" }}>
        {timeAgo(order.updated_at)}
      </td>
      <td style={{ ...td, textAlign: "right" }}>
        <button
          onClick={handleDelete}
          disabled={deleting}
          style={{
            background: "transparent", border: "1px solid #2a2a3a",
            color: "#666", borderRadius: 6, padding: "4px 10px",
            fontFamily: "'Space Mono', monospace", fontSize: 11,
            cursor: "pointer", transition: "all 0.15s",
          }}
          onMouseEnter={(e) => { e.target.style.borderColor = "#ef4444"; e.target.style.color = "#ef4444"; }}
          onMouseLeave={(e) => { e.target.style.borderColor = "#2a2a3a"; e.target.style.color = "#666"; }}
        >
          {deleting ? "…" : "DEL"}
        </button>
      </td>
    </tr>
  );
}

const td = {
  padding: "14px 16px",
  fontFamily: "'Syne', sans-serif",
  fontSize: 14,
  verticalAlign: "middle",
};
