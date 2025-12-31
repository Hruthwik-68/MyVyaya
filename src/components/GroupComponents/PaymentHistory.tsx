import React from "react";

interface Payment {
  id: string;
  from_user: string;
  to_user: string;
  amount: number;
  status: string;
  created_at: string;
  confirmed_at?: string;
}

interface Props {
  payments: Payment[];
  currentUser: any;
  showName: (uid: string) => string;
}

export default function PaymentHistory({ payments, currentUser, showName }: Props) {
  const confirmedPayments = payments.filter((p) => p.status === "confirmed");

  if (confirmedPayments.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: 40, color: "#666" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📜</div>
        <p>No payment history yet.</p>
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
            <th style={{ padding: "12px", textAlign: "left", fontWeight: 600, fontSize: 14 }}>Date</th>
            <th style={{ padding: "12px", textAlign: "left", fontWeight: 600, fontSize: 14 }}>From</th>
            <th style={{ padding: "12px", textAlign: "left", fontWeight: 600, fontSize: 14 }}>To</th>
            <th style={{ padding: "12px", textAlign: "right", fontWeight: 600, fontSize: 14 }}>Amount</th>
            <th style={{ padding: "12px", textAlign: "center", fontWeight: 600, fontSize: 14 }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {confirmedPayments.map((p, index) => {
            const isInvolvedInPayment = p.from_user === currentUser?.id || p.to_user === currentUser?.id;
            
            return (
              <tr
                key={p.id}
                style={{
                  borderBottom: "1px solid #e5e7eb",
                  backgroundColor: index % 2 === 0 ? "#fff" : "#f9fafb",
                  opacity: isInvolvedInPayment ? 1 : 0.6,
                }}
              >
                <td style={{ padding: "12px", fontSize: 13, color: "#666" }}>
                  {new Date(p.confirmed_at || p.created_at).toLocaleDateString()}
                </td>
                <td style={{ padding: "12px", fontSize: 14 }}>
                  {showName(p.from_user)}
                  {p.from_user === currentUser?.id && (
                    <span style={{ marginLeft: 8, fontSize: 12, color: "#dc2626" }}>(You)</span>
                  )}
                </td>
                <td style={{ padding: "12px", fontSize: 14 }}>
                  {showName(p.to_user)}
                  {p.to_user === currentUser?.id && (
                    <span style={{ marginLeft: 8, fontSize: 12, color: "#16a34a" }}>(You)</span>
                  )}
                </td>
                <td style={{ padding: "12px", textAlign: "right", fontSize: 15, fontWeight: 600, color: "#16a34a" }}>
                  ₹{Number(p.amount).toFixed(2)}
                </td>
                <td style={{ padding: "12px", textAlign: "center" }}>
                  <span
                    style={{
                      padding: "4px 12px",
                      borderRadius: 12,
                      backgroundColor: "#d1fae5",
                      color: "#166534",
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    ✓ Confirmed
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}