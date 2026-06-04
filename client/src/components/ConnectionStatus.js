import React from "react";

const CONFIG = {
  connected:    { color: "#10b981", label: "LIVE" },
  connecting:   { color: "#f59e0b", label: "CONNECTING" },
  disconnected: { color: "#ef4444", label: "DISCONNECTED" },
};

export function ConnectionStatus({ status }) {
  const cfg = CONFIG[status] || CONFIG.disconnected;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{
        width: 8, height: 8, borderRadius: "50%",
        background: cfg.color,
        boxShadow: status === "connected" ? `0 0 8px ${cfg.color}` : "none",
        animation: status === "connected" ? "pulse 2s infinite" : "none",
        flexShrink: 0,
      }} />
      <span style={{
        fontFamily: "'Space Mono', monospace",
        fontSize: 11,
        color: cfg.color,
        letterSpacing: "0.08em",
      }}>
        {cfg.label}
      </span>
    </div>
  );
}
