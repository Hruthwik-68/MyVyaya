import React from "react";

export default function BalanceSummary({ myBalance }: { myBalance: number }) {
  return (
    <div>
      <hr />
      <h3>Your Balance</h3>

      {myBalance > 0 && <p>You should receive <b>₹{myBalance.toFixed(2)}</b></p>}
      {myBalance < 0 && <p>You should pay <b>₹{Math.abs(myBalance).toFixed(2)}</b></p>}
      {myBalance === 0 && <p>You are settled</p>}
    </div>
  );
}
