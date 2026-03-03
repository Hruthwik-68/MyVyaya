import { useState } from "react";
import type { ReactNode } from "react";

interface CollapsibleSectionProps {
  title: string;
  icon?: string;
  badge?: string | number;
  badgeColor?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

export default function CollapsibleSection({
  title,
  icon = "📋",
  badge,
  badgeColor = "#3b82f6",
  defaultOpen = false,
  children,
}: CollapsibleSectionProps) {
  // ... rest of the component (no changes)
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div
      style={{
        backgroundColor: "rgba(10, 31, 51, 0.7)",
        border: "1px solid rgba(33, 150, 196, 0.08)",
        borderRadius: 10,
        marginBottom: 15,
        overflow: "hidden",
        backdropFilter: "blur(16px)",
      }}
    >
      {/* Header - Always Visible */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "15px 20px",
          cursor: "pointer",
          backgroundColor: isOpen ? "rgba(12, 36, 58, 0.6)" : "transparent",
          borderBottom: isOpen ? "1px solid rgba(33, 150, 196, 0.08)" : "none",
          transition: "all 0.2s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "rgba(15, 40, 65, 0.85)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = isOpen ? "rgba(12, 36, 58, 0.6)" : "transparent";
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }}>{icon}</span>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "#e8eff5" }}>
            {title}
          </h3>
          {badge !== undefined && (
            <span
              style={{
                backgroundColor: badgeColor,
                color: "white",
                padding: "2px 10px",
                borderRadius: 12,
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {badge}
            </span>
          )}
        </div>

        <div
          style={{
            fontSize: 20,
            color: "#8ba4bc",
            transition: "transform 0.2s",
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
          }}
        >
          ▼
        </div>
      </div>

      {/* Content - Collapsible */}
      {isOpen && (
        <div
          style={{
            padding: 20,
            animation: "slideDown 0.2s ease-out",
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}