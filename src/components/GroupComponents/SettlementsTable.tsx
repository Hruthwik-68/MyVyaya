import React from "react";

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
      <div style={{ textAlign: "center", padding: 40, color: "#666" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
        <p>All settled up! No pending settlements.</p>
      </div>
    );
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          backgroundColor: "#fff",
        }}
      >
        <thead>
          <tr style={{ backgroundColor: "#f9fafb", borderBottom: "2px solid #e5e7eb" }}>
            <th style={{ padding: "12px", textAlign: "left", fontWeight: 600, fontSize: 14 }}>From</th>
            <th style={{ padding: "12px", textAlign: "left", fontWeight: 600, fontSize: 14 }}>To</th>
            <th style={{ padding: "12px", textAlign: "right", fontWeight: 600, fontSize: 14 }}>Amount</th>
            <th style={{ padding: "12px", textAlign: "center", fontWeight: 600, fontSize: 14 }}>Actions</th>
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
                  borderBottom: "1px solid #e5e7eb",
                  backgroundColor: index % 2 === 0 ? "#fff" : "#f9fafb",
                }}
              >
                <td style={{ padding: "12px", fontSize: 14, fontWeight: 500 }}>
                  {showName(s.from)}
                  {s.from === currentUser?.id && (
                    <span style={{ marginLeft: 8, fontSize: 12, color: "#dc2626" }}>(You)</span>
                  )}
                </td>
                <td style={{ padding: "12px", fontSize: 14, fontWeight: 500 }}>
                  {showName(s.to)}
                  {s.to === currentUser?.id && (
                    <span style={{ marginLeft: 8, fontSize: 12, color: "#16a34a" }}>(You)</span>
                  )}
                </td>
                <td style={{ padding: "12px", textAlign: "right", fontSize: 16, fontWeight: 600, color: "#dc2626" }}>
                  ₹{s.amount.toFixed(2)}
                </td>
                <td style={{ padding: "12px" }}>
                  {isMyDebt && (
                    <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
                      {/* UPI Payment Button */}
                      {handlePayViaUPI && (
                        <button
                          onClick={() => handlePayViaUPI(s)}
                          disabled={disabled}
                          style={{
                            padding: "8px 16px",
                            backgroundColor: disabled ? "#ccc" : "#8b5cf6",
                            color: "white",
                            border: "none",
                            borderRadius: 6,
                            cursor: disabled ? "not-allowed" : "pointer",
                            fontWeight: 600,
                            fontSize: 13,
                            whiteSpace: "nowrap",
                          }}
                        >
                          💳 Pay via UPI
                        </button>
                      )}
                      
                      {/* Mark Paid Button */}
                      <button
                        onClick={() => markPaid(s)}
                        disabled={disabled}
                        style={{
                          padding: "8px 16px",
                          backgroundColor: disabled ? "#ccc" : "#16a34a",
                          color: "white",
                          border: "none",
                          borderRadius: 6,
                          cursor: disabled ? "not-allowed" : "pointer",
                          fontWeight: 600,
                          fontSize: 13,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {disabled ? "⏳ Pending..." : "✓ Mark Paid"}
                      </button>
                    </div>
                  )}
                  
                  {!isMyDebt && (
                    <div style={{ textAlign: "center", fontSize: 13, color: "#666", fontStyle: "italic" }}>
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