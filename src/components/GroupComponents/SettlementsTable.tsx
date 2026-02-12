// ============================================
// SETTLEMENTS TABLE - DARK THEME
// ============================================

import React from "react";
import { CheckCircle2, CreditCard } from "lucide-react";

interface Settlement {
  from: string;
  to: string;
  amount: number;
}

interface Props {
  settlements: Settlement[];
  currentUser: any;
  markPaid: (s: Settlement) => void;
  showName: (uid: string) => string;
  disableIf?: (s: Settlement) => boolean;
  pendingNow?: boolean;
  handlePayViaUPI?: (s: Settlement) => void;
}

export default function SettlementsTable({
  settlements,
  currentUser,
  markPaid,
  showName,
  disableIf,
  pendingNow,
  handlePayViaUPI,
}: Props) {
  const isMobile = window.innerWidth < 640;

  if (settlements.length === 0) {
    return (
      <div style={{
        textAlign: "center",
        padding: 40,
        color: "#94a3b8",
        background: "rgba(30, 41, 59, 0.4)",
        borderRadius: 16,
        border: "1px dashed rgba(148, 163, 184, 0.2)"
      }}>
        <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.8 }}>✅</div>
        <p style={{ margin: 0, fontSize: 16, color: "#e2e8f0" }}>All settled up! No pending settlements.</p>
      </div>
    );
  }

  return (
    <div style={{
      overflowX: "auto",
      background: "rgba(30, 41, 59, 0.4)",
      borderRadius: 16,
      border: "1px solid rgba(148, 163, 184, 0.1)"
    }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
        }}
      >
        <thead>
          <tr style={{
            background: "rgba(15, 23, 42, 0.6)",
            borderBottom: "1px solid rgba(148, 163, 184, 0.1)"
          }}>
            <th style={{ padding: "16px", textAlign: "left", fontWeight: 600, fontSize: 13, color: "#94a3b8", textTransform: 'uppercase', letterSpacing: '0.05em' }}>From</th>
            <th style={{ padding: "16px", textAlign: "left", fontWeight: 600, fontSize: 13, color: "#94a3b8", textTransform: 'uppercase', letterSpacing: '0.05em' }}>To</th>
            <th style={{ padding: "16px", textAlign: "right", fontWeight: 600, fontSize: 13, color: "#94a3b8", textTransform: 'uppercase', letterSpacing: '0.05em' }}>Amount</th>
            <th style={{ padding: "16px", textAlign: "center", fontWeight: 600, fontSize: 13, color: "#94a3b8", textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {settlements.map((s, index) => {
            const disabled = pendingNow || (disableIf ? disableIf(s) : false);
            const isMyDebt = s.from === currentUser?.id;

            return (
              <tr
                key={s.from + s.to}
                style={{
                  borderBottom: "1px solid rgba(148, 163, 184, 0.05)",
                  background: index % 2 === 0 ? "transparent" : "rgba(255, 255, 255, 0.02)",
                }}
              >
                <td style={{ padding: "16px", fontSize: 14, fontWeight: 500, color: "#e2e8f0" }}>
                  {showName(s.from)}
                  {s.from === currentUser?.id && (
                    <span style={{ marginLeft: 8, fontSize: 11, color: "#f87171", fontWeight: 600 }}>(You)</span>
                  )}
                </td>
                <td style={{ padding: "16px", fontSize: 14, fontWeight: 500, color: "#e2e8f0" }}>
                  {showName(s.to)}
                  {s.to === currentUser?.id && (
                    <span style={{ marginLeft: 8, fontSize: 11, color: "#34d399", fontWeight: 600 }}>(You)</span>
                  )}
                </td>
                <td style={{ padding: "16px", textAlign: "right", fontSize: 16, fontWeight: 600, color: "#f87171" }}>
                  ₹{s.amount.toFixed(2)}
                </td>
                <td style={{ padding: "16px" }}>
                  {isMyDebt && (
                    <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
                      {/* UPI Payment Button */}
                      {handlePayViaUPI && (
                        <button
                          onClick={() => handlePayViaUPI(s)}
                          disabled={disabled}
                          style={{
                            padding: "8px 16px",
                            background: disabled
                              ? "rgba(148, 163, 184, 0.2)"
                              : "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)",
                            color: "white",
                            border: "none",
                            borderRadius: 8,
                            cursor: disabled ? "not-allowed" : "pointer",
                            fontWeight: 600,
                            fontSize: 13,
                            whiteSpace: "nowrap",
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            boxShadow: disabled ? "none" : "0 4px 12px rgba(99, 102, 241, 0.3)"
                          }}
                        >
                          <CreditCard size={14} /> Pay via UPI
                        </button>
                      )}

                      {/* Mark Paid Button */}
                      <button
                        onClick={() => markPaid(s)}
                        disabled={disabled}
                        style={{
                          padding: "8px 16px",
                          background: disabled
                            ? "rgba(148, 163, 184, 0.2)"
                            : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                          color: "white",
                          border: "none",
                          borderRadius: 8,
                          cursor: disabled ? "not-allowed" : "pointer",
                          fontWeight: 600,
                          fontSize: 13,
                          whiteSpace: "nowrap",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          boxShadow: disabled ? "none" : "0 4px 12px rgba(16, 185, 129, 0.3)"
                        }}
                      >
                        {disabled ? "⏳ Pending..." : <><CheckCircle2 size={14} /> Mark Paid</>}
                      </button>
                    </div>
                  )}

                  {!isMyDebt && (
                    <div style={{ textAlign: "center", fontSize: 13, color: "#64748b", fontStyle: "italic" }}>
                      Waiting for payment
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}