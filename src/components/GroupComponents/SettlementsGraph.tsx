import React from "react";

type Member = {
  user_id: string;
};

type Settlement = {
  from: string;
  to: string;
  amount: number;
};

export default function SettlementsGraph({
  members,
  settlements,
  currentUserId,
  showName
}: {
  members: Member[];
  settlements: Settlement[];
  currentUserId: string;
  showName: (uid: string) => string;
}) {
  const radius = 120;
  const centerX = 200;
  const centerY = 160;
  const circleR = 22;

  const positioned = members.map((m, i) => {
    const angle = (2 * Math.PI * i) / members.length;
    return {
      ...m,
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  });

  const find = (id: string) =>
    positioned.find((m) => m.user_id === id) || { x: 0, y: 0 };

  return (
    <div style={{ marginTop: 30 }}>
      <h3>Visual Split Map</h3>

      <svg width={400} height={330} style={{ border: "1px solid #ddd" }}>
        <defs>
          {/* Arrow markers */}
          <marker
            id="arrow-green"
            markerWidth="10"
            markerHeight="10"
            refX="8"
            refY="5"
            orient="auto"
          >
            <path d="M0,0 L10,5 L0,10" fill="green" />
          </marker>

          <marker
            id="arrow-red"
            markerWidth="10"
            markerHeight="10"
            refX="8"
            refY="5"
            orient="auto"
          >
            <path d="M0,0 L10,5 L0,10" fill="red" />
          </marker>
        </defs>

        {settlements.map((s, index) => {
          const from = find(s.from);
          const to = find(s.to);
          if (!from || !to) return null;

          const color = s.from === currentUserId ? "red" : "green";

          // shorten line so it doesn’t hit the circle edge
          const dx = to.x - from.x;
          const dy = to.y - from.y;
          const len = Math.sqrt(dx * dx + dy * dy);
          const ux = dx / len;
          const uy = dy / len;

          const startX = from.x + ux * circleR;
          const startY = from.y + uy * circleR;
          const endX = to.x - ux * circleR;
          const endY = to.y - uy * circleR;

          return (
            <g key={index}>
              <line
                x1={startX}
                y1={startY}
                x2={endX}
                y2={endY}
                stroke={color}
                strokeWidth={3}
                markerEnd={`url(#arrow-${color})`}
              />

              {/* Direction label */}
              <text
                x={(startX + endX) / 2}
                y={(startY + endY) / 2 - 5}
                fill={color}
                fontSize={12}
                textAnchor="middle"
              >
                {showName(s.from)} → {showName(s.to)}
              </text>

              {/* Amount label */}
              <text
                x={(startX + endX) / 2}
                y={(startY + endY) / 2 + 12}
                fill={color}
                fontSize={12}
                textAnchor="middle"
              >
                ₹{s.amount.toFixed(2)}
              </text>
            </g>
          );
        })}

        {/* Draw users */}
        {positioned.map((m) => (
          <g key={m.user_id}>
            <circle
              cx={m.x}
              cy={m.y}
              r={circleR}
              fill={m.user_id === currentUserId ? "#4CAF50" : "#2196F3"}
              stroke="#000"
            />
            <text
              x={m.x}
              y={m.y + 4}
              fill="white"
              textAnchor="middle"
              fontSize={12}
            >
              {showName(m.user_id)}
            </text>
          </g>
        ))}
      </svg>

      <p>
        <small>
          🔴 Red = You pay • 🟢 Green = You receive
        </small>
      </p>
    </div>
  );
}
