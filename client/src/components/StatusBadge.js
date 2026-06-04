import React from "react";

const CONFIG = {
  pending:   { label: "PENDING",   color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  shipped:   { label: "SHIPPED",   color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
  delivered: { label: "DELIVERED", color: "#10b981", bg: "rgba(16,185,129,0.12)" },
};

export function StatusBadge({ status }) {
  const cfg = CONFIG[status] || { label: status?.toUpperCase(), color: "#aaa", bg: "rgba(170,170,170,0.12)" };
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "3px 10px",
      borderRadius: 4,
      background: cfg.bg,
      color: cfg.color,
      fontFamily: "'Space Mono', monospace",
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: "0.08em",
      border: `1px solid ${cfg.color}33`,
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: "50%",
        background: cfg.color,
        boxShadow: `0 0 6px ${cfg.color}`,
        flexShrink: 0,
      }} />
      {cfg.label}
    </span>
  );
}
