import React from "react";

interface Props {
  members: { user_id: string }[];
  participants: string[];
  setParticipants: (arr: string[]) => void;
  splits: { user_id: string; percent: number }[];
  setSplits: (arr: { user_id: string; percent: number }[]) => void;
  currentUser: any;
  showName: (uid: string) => string;
}

export default function MemberTags({
  members,
  participants,
  setParticipants,
  setSplits,
  currentUser,
  showName
}: Props) {
  return (
    <div>
      <hr />
      <h3>Tags — Who is part of this expense?</h3>

      {members.map((m) => (
        <div key={m.user_id}>
          <label>
            <input
              type="checkbox"
              checked={participants.includes(m.user_id)}
              onChange={() => {
                let updated = [...participants];

                if (updated.includes(m.user_id))
                  updated = updated.filter((u) => u !== m.user_id);
                else updated.push(m.user_id);

                setParticipants(updated);

                const equal = updated.length ? 100 / updated.length : 0;

                setSplits(
                  updated.map((u) => ({
                    user_id: u,
                    percent: parseFloat(equal.toFixed(2))
                  }))
                );
              }}
            />
            {showName(m.user_id)}
          </label>
        </div>
      ))}
    </div>
  );
}
