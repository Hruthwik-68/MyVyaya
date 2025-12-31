import React from "react";

interface Payment {
  id: string;
  from_user: string;
  to_user: string;
  amount: number;
  status: string;
  created_at?: string;
}

interface Props {
  payments: Payment[];
  currentUser: any;
  confirmPayment: (id: string) => void;
  showName: (uid: string) => string;
}

export default function PendingPayments({
  payments,
  currentUser,
  confirmPayment,
  showName
}: Props) {
  const pendingForMe = payments.filter(
    (p) => p.status === "pending" && p.to_user === currentUser?.id
  );

  if (pendingForMe.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: 40, color: "#666" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
        <p>No pending confirmations. You're all caught up!</p>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 15 }}>
      {pendingForMe.map((p) => (
        <div
          key={p.id}
          style={{
            backgroundColor: "#fef3c7",
            border: "2px solid #f59e0b",
            borderRadius: 10,
            padding: 15,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 15,
          }}
        >
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 5 }}>
              💰 {showName(p.from_user)} marked ₹{Number(p.amount).toFixed(2)} as paid
            </div>
            <div style={{ fontSize: 13, color: "#666" }}>
              {p.created_at && (
                <>Created on {new Date(p.created_at).toLocaleString()}</>
              )}
            </div>
          </div>
          
          <button
            onClick={() => confirmPayment(p.id)}
            style={{
              padding: "10px 20px",
              backgroundColor: "#16a34a",
              color: "white",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 14,
              whiteSpace: "nowrap",
            }}
          >
            ✓ Confirm Payment
          </button>
        </div>
      ))}
    </div>
  );
}