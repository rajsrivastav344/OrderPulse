import React from "react";

const TYPE_CONFIG = {
  ORDER_INSERTED: { label: "INSERT", color: "#10b981" },
  ORDER_UPDATED:  { label: "UPDATE", color: "#3b82f6" },
  ORDER_DELETED:  { label: "DELETE", color: "#ef4444" },
  CONNECTED:      { label: "SYS",    color: "#a78bfa" },
};

function formatTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d)) return "—";
  return d.toLocaleTimeString("en-US", { hour12: false });
}

export function EventLog({ events }) {
  return (
    <div style={{
      background: "#0a0a0f",
      border: "1px solid #1f1f2e",
      borderRadius: 12,
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      height: "100%",
      minHeight: 300,
    }}>
      {/* Header */}
      <div style={{
        padding: "12px 16px",
        borderBottom: "1px solid #1f1f2e",
        display: "flex",
        alignItems: "center",
        gap: 8,
        background: "#0d0d14",
      }}>
        <span style={{
          width: 8, height: 8, borderRadius: "50%",
          background: "#10b981",
          boxShadow: "0 0 8px #10b981",
          animation: "pulse 2s infinite",
        }} />
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#666", letterSpacing: "0.1em" }}>
          LIVE EVENT LOG
        </span>
        <span style={{
          marginLeft: "auto",
          fontFamily: "'Space Mono', monospace",
          fontSize: 10,
          color: "#444",
        }}>
          {events.length} events
        </span>
      </div>

      {/* Events list */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: "8px 0",
        display: "flex",
        flexDirection: "column-reverse", // newest at bottom
      }}>
        {events.length === 0 && (
          <div style={{
            textAlign: "center",
            color: "#333",
            fontFamily: "'Space Mono', monospace",
            fontSize: 12,
            padding: "40px 16px",
          }}>
            Waiting for changes…
          </div>
        )}
        {[...events].reverse().map((evt, i) => {
          const cfg = TYPE_CONFIG[evt.type] || { label: evt.type, color: "#aaa" };
          const name = evt.payload?.customer_name || evt.payload?.message || evt.payload?._id || "—";
          return (
            <div key={i} style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              padding: "8px 16px",
              borderBottom: "1px solid #0f0f1a",
              animation: i === 0 ? "fadeIn 0.3s ease" : "none",
            }}>
              <span style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 10,
                color: "#333",
                whiteSpace: "nowrap",
                paddingTop: 2,
              }}>
                {formatTime(evt.timestamp)}
              </span>
              <span style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 10,
                fontWeight: 700,
                color: cfg.color,
                background: `${cfg.color}18`,
                padding: "2px 6px",
                borderRadius: 3,
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}>
                {cfg.label}
              </span>
              <span style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 11,
                color: "#888",
                wordBreak: "break-all",
              }}>
                {evt.type === "ORDER_DELETED" ? (
                  <span>Deleted order <span style={{ color: "#ef4444" }}>{String(name).slice(0, 8)}…</span></span>
                ) : (
                  <span>
                    <span style={{ color: "#ccc" }}>{name}</span>
                    {evt.payload?.product_name && <> · {evt.payload.product_name}</>}
                    {evt.payload?.status && (
                      <span style={{ color: cfg.color }}> [{evt.payload.status.toUpperCase()}]</span>
                    )}
                  </span>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}