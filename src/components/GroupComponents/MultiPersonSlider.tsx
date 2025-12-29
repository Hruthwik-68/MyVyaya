import React, { useState, useRef, useEffect } from "react";

interface Props {
  splits: { user_id: string; percent: number }[];
  setSplits: (s: { user_id: string; percent: number }[]) => void;
  currentUser: any;
  showName: (uid: string) => string;
}

// Colors for different users
const USER_COLORS = [
  "#3b82f6", // blue
  "#ef4444", // red
  "#10b981", // green
  "#f59e0b", // orange
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#84cc16", // lime
];

export default function MultiPersonSlider({
  splits,
  setSplits,
  currentUser,
  showName,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<number | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  // Calculate cumulative percentages for positioning
  const getCumulativePercents = () => {
    let cumulative = 0;
    return splits.map((s) => {
      cumulative += s.percent;
      return cumulative;
    });
  };

  const handleMouseDown = (index: number) => {
    setDragging(index);
  };

  const handleMouseMove = (e: React.MouseEvent | MouseEvent) => {
    if (dragging === null || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));

    // Update percentages
    const newSplits = [...splits];
    const cumulative = getCumulativePercents();
    
    // Find which split we're dragging between
    const leftIndex = dragging;
    const rightIndex = leftIndex + 1;

    if (rightIndex >= splits.length) return;

    // Calculate new percentages
    const leftStart = leftIndex === 0 ? 0 : cumulative[leftIndex - 1];
    const rightEnd = cumulative[rightIndex];
    
    // Clamp the percent within bounds
    const minPercent = leftStart + 5; // minimum 5% per person
    const maxPercent = rightEnd - 5;
    const clampedPercent = Math.max(minPercent, Math.min(maxPercent, percent));

    // Update left split
    newSplits[leftIndex].percent = clampedPercent - leftStart;
    
    // Update right split
    newSplits[rightIndex].percent = rightEnd - clampedPercent;

    // Round to 2 decimals
    newSplits.forEach((s) => {
      s.percent = Math.round(s.percent * 100) / 100;
    });

    // Fix rounding to ensure total is exactly 100
    const total = newSplits.reduce((sum, s) => sum + s.percent, 0);
    if (Math.abs(total - 100) > 0.01) {
      const diff = 100 - total;
      newSplits[newSplits.length - 1].percent += diff;
      newSplits[newSplits.length - 1].percent = 
        Math.round(newSplits[newSplits.length - 1].percent * 100) / 100;
    }

    setSplits(newSplits);
  };

  const handleMouseUp = () => {
    setDragging(null);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (dragging === null || !containerRef.current) return;
    
    const touch = e.touches[0];
    const rect = containerRef.current.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));

    handleMouseMove({ clientX: rect.left + (percent / 100) * rect.width } as any);
  };

  useEffect(() => {
    if (dragging !== null) {
      const handleGlobalMove = (e: MouseEvent) => handleMouseMove(e);
      const handleGlobalUp = () => setDragging(null);

      window.addEventListener("mousemove", handleGlobalMove);
      window.addEventListener("mouseup", handleGlobalUp);

      return () => {
        window.removeEventListener("mousemove", handleGlobalMove);
        window.removeEventListener("mouseup", handleGlobalUp);
      };
    }
  }, [dragging]);

  const cumulativePercents = getCumulativePercents();

  return (
    <div style={{ marginTop: 20, marginBottom: 20 }}>
      <h4 style={{ marginBottom: 15, fontSize: 16 }}>
        Percentages (total must equal 100%)
      </h4>

      {/* Multi-person slider bar */}
      <div
        ref={containerRef}
        style={{
          position: "relative",
          height: 50,
          borderRadius: 25,
          overflow: "hidden",
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          cursor: dragging !== null ? "grabbing" : "default",
          touchAction: "none",
        }}
      >
        {/* Colored sections */}
        {splits.map((split, index) => {
          const startPercent = index === 0 ? 0 : cumulativePercents[index - 1];
          const endPercent = cumulativePercents[index];
          const width = endPercent - startPercent;
          const color = USER_COLORS[index % USER_COLORS.length];

          return (
            <div
              key={split.user_id}
              style={{
                position: "absolute",
                left: `${startPercent}%`,
                width: `${width}%`,
                height: "100%",
                backgroundColor: color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontWeight: "bold",
                fontSize: 14,
                transition: dragging === index || dragging === index - 1 ? "none" : "all 0.2s",
              }}
            >
              <span
                style={{
                  textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  padding: "0 10px",
                }}
              >
                {showName(split.user_id)}: {split.percent.toFixed(1)}%
              </span>
            </div>
          );
        })}

        {/* Draggable handles */}
        {splits.slice(0, -1).map((_, index) => {
          const position = cumulativePercents[index];

          return (
            <div
              key={`handle-${index}`}
              onMouseDown={() => handleMouseDown(index)}
              onTouchStart={() => handleMouseDown(index)}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleMouseUp}
              style={{
                position: "absolute",
                left: `calc(${position}% - 15px)`,
                top: "50%",
                transform: "translateY(-50%)",
                width: 30,
                height: 30,
                backgroundColor: "white",
                border: "3px solid #333",
                borderRadius: "50%",
                cursor: "grab",
                boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                zIndex: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: dragging === index ? "none" : "all 0.2s",
              }}
            >
              <div
                style={{
                  width: 4,
                  height: 16,
                  backgroundColor: "#666",
                  borderRadius: 2,
                  marginRight: 2,
                }}
              />
              <div
                style={{
                  width: 4,
                  height: 16,
                  backgroundColor: "#666",
                  borderRadius: 2,
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Total display */}
      <div
        style={{
          marginTop: 15,
          fontSize: 18,
          fontWeight: "bold",
          textAlign: "center",
          color: splits.reduce((s, x) => s + x.percent, 0) === 100 ? "#16a34a" : "#dc2626",
        }}
      >
        Total: {splits.reduce((s, x) => s + x.percent, 0).toFixed(2)}%
      </div>

      {/* Legend on mobile */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          marginTop: 15,
          justifyContent: "center",
        }}
      >
        {splits.map((split, index) => (
          <div
            key={split.user_id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 12px",
              backgroundColor: "#f3f4f6",
              borderRadius: 20,
              fontSize: 14,
            }}
          >
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: "50%",
                backgroundColor: USER_COLORS[index % USER_COLORS.length],
              }}
            />
            <span style={{ fontWeight: "600" }}>
              {showName(split.user_id)}: {split.percent.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}