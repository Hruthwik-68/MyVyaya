import React from "react";

interface Props {
  myBalance: number;
}

export default function BalanceSummary({ myBalance }: Props) {
  const getBalanceColor = () => {
    if (myBalance > 0) return "#16a34a"; // green
    if (myBalance < 0) return "#dc2626"; // red
    return "#6b7280"; // gray
  };

  const getBalanceIcon = () => {
    if (myBalance > 0) return "💰";
    if (myBalance < 0) return "💸";
    return "✓";
  };

  const getBalanceMessage = () => {
    if (myBalance > 0) return "You should receive";
    if (myBalance < 0) return "You should pay";
    return "You are all settled up!";
  };

  return (
    <div
      style={{
        backgroundColor: "#f9fafb",
        border: `2px solid ${getBalanceColor()}`,
        borderRadius: 10,
        padding: 20,
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 48, marginBottom: 10 }}>{getBalanceIcon()}</div>
      
      <div style={{ fontSize: 16, color: "#666", marginBottom: 10 }}>
        {getBalanceMessage()}
      </div>

      {myBalance !== 0 && (
        <div
          style={{
            fontSize: 36,
            fontWeight: "bold",
            color: getBalanceColor(),
          }}
        >
          ₹{Math.abs(myBalance).toFixed(2)}
        </div>
      )}

      {myBalance === 0 && (
        <div
          style={{
            fontSize: 20,
            fontWeight: 600,
            color: getBalanceColor(),
            marginTop: 10,
          }}
        >
          🎉 No pending payments!
        </div>
      )}
    </div>
  );
}