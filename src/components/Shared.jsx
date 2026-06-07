import { useEffect } from "react";
import { Icon } from "./Icon";
import { STATUS_LABELS, STATUS_COLORS } from "../utils/mockData";

export function StatusBadge({ status, dot = true }) {
  const color = STATUS_COLORS[status] || "neutral";
  const label = STATUS_LABELS[status] || status;
  return <span className={`badge badge-${color} ${dot ? "badge-dot" : ""}`}>{label}</span>;
}

export function Modal({ open, onClose, title, subtitle, children, size = "md" }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open, onClose]);

  if (!open) return null;
  const maxW = { sm: 420, md: 540, lg: 720, xl: 920 }[size];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" style={{ maxWidth: maxW }} onClick={(e) => e.stopPropagation()}>
        {(title || subtitle) && (
          <div className="modal-header">
            <div>
              {title && <h2 className="modal-title display">{title}</h2>}
              {subtitle && <p className="modal-subtitle">{subtitle}</p>}
            </div>
            <button className="icon-btn" onClick={onClose}><Icon name="x" size={18} /></button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

export function ProgressRing({ value, size = 48, strokeWidth = 3, color = "var(--terracotta)", showValue = true }) {
  const radius = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (value / 100) * circ;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="var(--bg-soft)" strokeWidth={strokeWidth} fill="none"/>
        <circle cx={size / 2} cy={size / 2} r={radius} stroke={color} strokeWidth={strokeWidth} fill="none"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.8s var(--ease)" }}/>
      </svg>
      {showValue && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontSize: size <= 48 ? 12 : 16, fontWeight: 500, color: "var(--ink)" }}>
          {value}<span style={{ fontSize: 10, opacity: 0.6 }}>%</span>
        </div>
      )}
    </div>
  );
}

export function Avatar({ name, size = "md", color }) {
  const initials = (name || "?").split(" ").map(p => p[0]).slice(0, 2).join("").toUpperCase();
  const palette = ["#B8553B", "#5A7A4A", "#3D5470", "#C9974A", "#8C3F2A", "#3F5A33"];
  const bgs = ["var(--terracotta-bg)", "var(--moss-bg)", "var(--indigo-bg)", "var(--ochre-bg)"];
  const idx = name ? name.charCodeAt(0) % palette.length : 0;
  return (
    <div className={`avatar avatar-${size}`} style={{ background: color || bgs[idx % bgs.length], color: palette[idx] }}>
      {initials}
    </div>
  );
}

export function EmptyState({ icon = "book", title, description, action }) {
  return (
    <div className="empty fade-up">
      <div className="empty-icon"><Icon name={icon} size={24} /></div>
      <div>
        <div className="display" style={{ fontSize: 18, color: "var(--ink)" }}>{title}</div>
        {description && <p style={{ color: "var(--text-secondary)", fontSize: 13.5, marginTop: 4 }}>{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Spinner({ size = 16, color = "currentColor" }) {
  return <div style={{ width: size, height: size, border: `2px solid ${color}`, borderRightColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />;
}
