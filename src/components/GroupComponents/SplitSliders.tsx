import React from "react";

interface Props {
  splits: { user_id: string; percent: number }[];
  setSplits: (arr: { user_id: string; percent: number }[]) => void;
  currentUser: any;
  showName: (uid: string) => string;
}

export default function SplitSliders({
  splits,
  setSplits,
  showName
}: Props) {
  return (
    <div>
      <hr />
      <h3>Percentages (total must equal 100%)</h3>

      {splits.map((s, i) => (
        <div key={s.user_id}>
          <b>{showName(s.user_id)}</b>

          <input
            type="range"
            min="0"
            max="100"
            value={s.percent}
            onChange={(e) => {
              const copy = [...splits];
              copy[i].percent = Number(e.target.value);
              setSplits(copy);
            }}
          />

          &nbsp;{s.percent}%
        </div>
      ))}

      <p>
        <b>
          Total: {splits.reduce((s, x) => s + x.percent, 0).toFixed(2)}%
        </b>
      </p>
    </div>
  );
}
