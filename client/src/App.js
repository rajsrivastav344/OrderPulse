import React, { useState, useEffect, useCallback, useRef } from "react";
import { useWebSocket } from "./hooks/useWebSocket";
import { api } from "./lib/api";
import { OrderRow } from "./components/OrderRow";
import { EventLog } from "./components/EventLog";
import { ConnectionStatus } from "./components/ConnectionStatus";
import { CreateOrderModal } from "./components/CreateOrderModal";

const MAX_LOG_EVENTS = 50;

export default function App() {
  const [orders, setOrders] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [highlightedIds, setHighlightedIds] = useState(new Set());
  const highlightTimers = useRef({});

  // ── Load initial orders ──────────────────────────────────────────────────────
  useEffect(() => {
    api.listOrders(1, 50)
      .then(({ orders }) => setOrders(orders))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // ── Highlight helper (flashes a row briefly) ────────────────────────────────
  const highlight = useCallback((id) => {
    const key = String(id);
    setHighlightedIds((prev) => new Set([...prev, key]));
    clearTimeout(highlightTimers.current[key]);
    highlightTimers.current[key] = setTimeout(() => {
      setHighlightedIds((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }, 2000);
  }, []);

  // ── Handle incoming WebSocket messages ──────────────────────────────────────
  const handleMessage = useCallback((msg) => {
    // Always append to event log
    setEvents((prev) => [msg, ...prev].slice(0, MAX_LOG_EVENTS));

    const { type, payload } = msg;

    if (type === "ORDER_INSERTED") {
      setOrders((prev) => [payload, ...prev]);
      highlight(payload._id);
    }

    if (type === "ORDER_UPDATED") {
      setOrders((prev) =>
        prev.map((o) => (String(o._id) === String(payload._id) ? payload : o))
      );
      highlight(payload._id);
    }

    if (type === "ORDER_DELETED") {
      setOrders((prev) => prev.filter((o) => String(o._id) !== String(payload._id)));
    }
  }, [highlight]);

  const { status } = useWebSocket(handleMessage);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const counts = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div style={appStyle}>
      <style>{globalCSS}</style>

      {/* Header */}
      <header style={headerStyle}>
        <div>
          <h1 style={logoStyle}>OrderPulse</h1>
          <p style={{ margin: 0, color: "#444", fontFamily: "'Space Mono', monospace", fontSize: 11, letterSpacing: "0.06em" }}>
            REAL-TIME ORDER TRACKER
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <ConnectionStatus status={status} />
          <button style={newOrderBtn} onClick={() => setShowModal(true)}>
            + New Order
          </button>
        </div>
      </header>

      {/* Stats bar */}
      <div style={statsBar}>
        <StatPill label="Total" value={orders.length} color="#a78bfa" />
        <StatPill label="Pending"   value={counts.pending   || 0} color="#f59e0b" />
        <StatPill label="Shipped"   value={counts.shipped   || 0} color="#3b82f6" />
        <StatPill label="Delivered" value={counts.delivered || 0} color="#10b981" />
      </div>

      {/* Main layout */}
      <div style={mainGrid}>
        {/* Orders table */}
        <div style={tableCard}>
          <div style={tableHeader}>
            <span style={sectionTitle}>Orders</span>
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#444" }}>
              {orders.length} records
            </span>
          </div>

          {loading ? (
            <div style={emptyState}>Loading…</div>
          ) : orders.length === 0 ? (
            <div style={emptyState}>No orders yet. Create one!</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #1a1a28" }}>
                    {["Customer", "Product", "Status", "Updated", ""].map((h) => (
                      <th key={h} style={th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <OrderRow
                      key={order._id}
                      order={order}
                      highlighted={highlightedIds.has(String(order._id))}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Event Log */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={sectionTitle}>Live Events</div>
          <EventLog events={events} />
        </div>
      </div>

      {showModal && <CreateOrderModal onClose={() => setShowModal(false)} />}
    </div>
  );
}

function StatPill({ label, value, color }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "10px 18px", background: "#0d0d14",
      border: "1px solid #1a1a28", borderRadius: 10,
    }}>
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
      <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 13, color: "#888" }}>{label}</span>
      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 18, color: "#fff", fontWeight: 700 }}>
        {value}
      </span>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const appStyle = {
  minHeight: "100vh",
  background: "#07070e",
  color: "#e0e0e0",
  padding: "0 0 60px",
};

const headerStyle = {
  display: "flex", alignItems: "center", justifyContent: "space-between",
  padding: "24px 40px",
  borderBottom: "1px solid #11111c",
  position: "sticky", top: 0, zIndex: 10,
  background: "rgba(7,7,14,0.92)",
  backdropFilter: "blur(12px)",
};

const logoStyle = {
  margin: 0,
  fontFamily: "'Syne', sans-serif",
  fontSize: 26,
  fontWeight: 800,
  letterSpacing: "-0.02em",
  background: "linear-gradient(135deg, #a78bfa 0%, #6366f1 100%)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
};

const newOrderBtn = {
  padding: "9px 20px",
  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
  border: "none", borderRadius: 8,
  color: "#fff", fontFamily: "'Syne', sans-serif",
  fontSize: 14, fontWeight: 700, cursor: "pointer",
  boxShadow: "0 4px 20px rgba(99,102,241,0.3)",
  transition: "transform 0.15s, box-shadow 0.15s",
};

const statsBar = {
  display: "flex", gap: 12, flexWrap: "wrap",
  padding: "20px 40px",
};

const mainGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 340px",
  gap: 20,
  padding: "0 40px",
  alignItems: "start",
};

const tableCard = {
  background: "#0d0d14",
  border: "1px solid #1a1a28",
  borderRadius: 12,
  overflow: "hidden",
};

const tableHeader = {
  display: "flex", alignItems: "center", justifyContent: "space-between",
  padding: "16px 20px",
  borderBottom: "1px solid #1a1a28",
};

const sectionTitle = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 14, fontWeight: 700, color: "#ccc",
  letterSpacing: "0.02em",
};

const th = {
  padding: "10px 16px", textAlign: "left",
  fontFamily: "'Space Mono', monospace",
  fontSize: 10, color: "#444", letterSpacing: "0.1em",
  fontWeight: 400,
};

const emptyState = {
  padding: "60px 20px", textAlign: "center",
  color: "#333", fontFamily: "'Space Mono', monospace", fontSize: 13,
};

const globalCSS = `
  * { box-sizing: border-box; }
  body { margin: 0; background: #07070e; }
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: #0d0d14; }
  ::-webkit-scrollbar-thumb { background: #2a2a3a; border-radius: 3px; }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-4px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @media (max-width: 900px) {
    .main-grid { grid-template-columns: 1fr !important; }
  }
`;
