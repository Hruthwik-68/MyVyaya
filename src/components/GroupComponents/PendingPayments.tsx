import React from "react";

interface Payment {
  id: string;
  from_user: string;
  to_user: string;
  amount: number;
  status: string;
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
  return (
    <div>
      <hr />
      <h3>Payments awaiting your confirmation</h3>

      {payments
        .filter((p) => p.status === "pending")
        .filter((p) => p.to_user === currentUser?.id)
        .map((p) => (
          <div key={p.id}>
            {showName(p.from_user)} paid you ₹{p.amount}
            <button onClick={() => confirmPayment(p.id)}>Confirm</button>
          </div>
        ))}
    </div>
  );
}
