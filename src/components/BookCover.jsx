// composant BookCover.jsx (version finale livre)
import { STATUS_LABELS } from "../utils/mockData";

export function BookCover({ book, size = "md" }) {
  const hasImage = !!book.coverImageUrl;

  const dims = {
    xs: { w: 40, h: 56, fs: 8, pad: 4 },
    sm: { w: 80, h: 112, fs: 11, pad: 8 },
    md: { w: 130, h: 184, fs: 13, pad: 12 },
    lg: { w: 200, h: 280, fs: 16, pad: 16 },
  }[size];

  // Motifs (si pas d’image)
  const patterns = {
    stripes: <pattern id={`pat-${book.id}`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="3" height="6" fill="rgba(255,255,255,0.06)"/></pattern>,
    dots: <pattern id={`pat-${book.id}`} width="10" height="10" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill="rgba(255,255,255,0.1)"/></pattern>,
    wave: <pattern id={`pat-${book.id}`} width="20" height="8" patternUnits="userSpaceOnUse"><path d="M0 4 Q5 0 10 4 T20 4" stroke="rgba(255,255,255,0.08)" fill="none"/></pattern>,
    diagonal: <pattern id={`pat-${book.id}`} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(-30)"><line x1="0" y1="0" x2="8" y2="0" stroke="rgba(255,255,255,0.08)"/></pattern>,
  };

  const coverBaseStyle = {
    width: dims.w,
    height: dims.h,
    position: "relative",
    flexShrink: 0,
    borderRadius: "3px 8px 8px 3px",  // dos légèrement moins arrondi
    overflow: "hidden",
    boxShadow: "0 12px 24px -8px rgba(0,0,0,0.35), 0 0 0 1px rgba(0,0,0,0.08) inset",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
    background: book.coverColor || "#2c3e50", // fallback
  };

  if (hasImage) {
    coverBaseStyle.backgroundImage = `url(${book.coverImageUrl})`;
    coverBaseStyle.backgroundSize = "cover";
    coverBaseStyle.backgroundPosition = "center";
    coverBaseStyle.backgroundColor = "transparent";
  }

  return (
    <div style={coverBaseStyle}>
      {/* Motif SVG uniquement si pas d'image */}
      {!hasImage && (
        <svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
          <defs>{patterns[book.coverPattern] || patterns.stripes}</defs>
          <rect width="100%" height="100%" fill={`url(#pat-${book.id})`} />
        </svg>
      )}

      {/* Effet de dos de livre (tranche) */}
      <div style={{
        position: "absolute",
        left: 0,
        top: 0,
        bottom: 0,
        width: 12,
        background: "linear-gradient(90deg, rgba(0,0,0,0.4), rgba(0,0,0,0.08), transparent)",
        borderRadius: "3px 0 0 3px",
        pointerEvents: "none",
        zIndex: 1,
      }} />

      {/* Effet de pages (bord droit blanc) */}
      <div style={{
        position: "absolute",
        right: 0,
        top: 2,
        bottom: 2,
        width: 3,
        background: "linear-gradient(90deg, rgba(255,250,235,0.3), rgba(255,250,235,0.8))",
        borderRadius: "0 2px 2px 0",
        pointerEvents: "none",
        zIndex: 1,
      }} />

      {/* Overlay général de profondeur */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: "linear-gradient(135deg, rgba(255,255,240,0.08) 0%, rgba(0,0,0,0.2) 100%)",
        pointerEvents: "none",
        zIndex: 1,
      }} />

      {/* Overlay de lisibilité (plus fort si image) */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: hasImage
          ? "linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.75) 100%)"
          : "linear-gradient(180deg, rgba(255,255,255,0.04), transparent 50%, rgba(0,0,0,0.15) 100%)",
        pointerEvents: "none",
        zIndex: 1,
      }} />

      {/* Texte */}
      <div style={{
        position: "absolute",
        left: dims.pad + 4,
        right: dims.pad,
        bottom: dims.pad,
        color: "#FFF8F0",
        textShadow: hasImage ? "0 2px 5px rgba(0,0,0,0.7)" : "0 1px 2px rgba(0,0,0,0.4)",
        zIndex: 2,
      }}>
        <div style={{
          fontSize: dims.fs - 3,
          opacity: 0.8,
          marginBottom: 3,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          fontWeight: 500,
        }}>
          {STATUS_LABELS[book.genre] || book.genre || "LIVRE"}
        </div>
        <div style={{
          fontSize: dims.fs,
          lineHeight: 1.2,
          fontWeight: 600,
          wordBreak: "break-word",
        }}>
          {book.title}
        </div>
        {size === "lg" && book.subtitle && (
          <div style={{
            fontSize: dims.fs - 4,
            opacity: 0.85,
            marginTop: 6,
            fontStyle: "italic",
            fontWeight: 400,
          }}>
            {book.subtitle}
          </div>
        )}
      </div>

      {/* Petit ruban décoratif (optionnel, seulement taille lg) */}
      {size === "lg" && (
        <div style={{
          position: "absolute",
          top: 0,
          right: -12,
          width: 28,
          height: 28,
          background: "var(--terracotta, #b85c38)",
          transform: "rotate(45deg) translate(10px, -18px)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
          pointerEvents: "none",
          zIndex: 3,
        }} />
      )}
    </div>
  );
}