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
        backgroundColor: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: 10,
        marginBottom: 15,
        overflow: "hidden",
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
          backgroundColor: isOpen ? "#f9fafb" : "#ffffff",
          borderBottom: isOpen ? "1px solid #e5e7eb" : "none",
          transition: "all 0.2s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "#f3f4f6";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = isOpen ? "#f9fafb" : "#ffffff";
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }}>{icon}</span>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
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