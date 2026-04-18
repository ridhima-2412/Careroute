import React, { useState, useEffect, useRef } from "react";

// Simulated map using Canvas (no external API needed for prototype)
const HOSPITALS = [
  { id: 1, name: "AIIMS Trauma", x: 0.62, y: 0.38, score: 94, status: "AVAILABLE" },
  { id: 2, name: "Safdarjung", x: 0.45, y: 0.55, score: 61, status: "LIMITED" },
  { id: 3, name: "RML Hospital", x: 0.72, y: 0.6, score: 87, status: "AVAILABLE" },
  { id: 4, name: "GTB Hospital", x: 0.3, y: 0.35, score: 22, status: "FULL" },
];

const AMBULANCE_PATH = [
  { x: 0.5, y: 0.75 },
  { x: 0.52, y: 0.7 },
  { x: 0.55, y: 0.62 },
  { x: 0.58, y: 0.55 },
  { x: 0.61, y: 0.46 },
  { x: 0.62, y: 0.38 },
];

function statusColor(s) {
  return s === "AVAILABLE" ? "#06d6a0" : s === "LIMITED" ? "#ffd166" : "#ff4d6d";
}

export default function MapView({ selectedHospital }) {
  const canvasRef = useRef(null);
  const [ambulancePos, setAmbulancePos] = useState(0);
  const [hoveredHospital, setHoveredHospital] = useState(null);
  const [tick, setTick] = useState(0);
  const animRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setAmbulancePos((p) => (p + 1) % AMBULANCE_PATH.length);
      setTick((t) => t + 1);
    }, 600);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;

    // Background
    ctx.fillStyle = "#0d1117";
    ctx.fillRect(0, 0, W, H);

    // Grid lines
    ctx.strokeStyle = "#ffffff06";
    ctx.lineWidth = 1;
    for (let i = 0; i < W; i += 40) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, H); ctx.stroke();
    }
    for (let i = 0; i < H; i += 40) {
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(W, i); ctx.stroke();
    }

    // Roads (simulated)
    ctx.strokeStyle = "#ffffff10";
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    const roads = [
      [[0.1, 0.5], [0.9, 0.5]],
      [[0.5, 0.1], [0.5, 0.9]],
      [[0.2, 0.2], [0.8, 0.8]],
      [[0.8, 0.2], [0.2, 0.8]],
      [[0.3, 0.1], [0.7, 0.9]],
    ];
    roads.forEach(([[x1, y1], [x2, y2]]) => {
      ctx.beginPath();
      ctx.moveTo(x1 * W, y1 * H);
      ctx.lineTo(x2 * W, y2 * H);
      ctx.stroke();
    });

    // Route to best hospital (animated dashes)
    const dest = selectedHospital || HOSPITALS[0];
    const amb = AMBULANCE_PATH[ambulancePos];
    ctx.setLineDash([8, 6]);
    ctx.lineDashOffset = -tick * 2;
    ctx.strokeStyle = "#00d4ff88";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    AMBULANCE_PATH.slice(ambulancePos).forEach((pt, i) => {
      if (i === 0) ctx.moveTo(pt.x * W, pt.y * H);
      else ctx.lineTo(pt.x * W, pt.y * H);
    });
    ctx.stroke();
    ctx.setLineDash([]);

    // Hospitals
    HOSPITALS.forEach((h) => {
      const hx = h.x * W;
      const hy = h.y * H;
      const isSelected = selectedHospital?.id === h.id || (!selectedHospital && h.id === 1);
      const color = statusColor(h.status);

      // Pulse ring for selected
      if (isSelected) {
        const pulse = 0.5 + 0.5 * Math.sin(tick * 0.3);
        ctx.beginPath();
        ctx.arc(hx, hy, 22 + pulse * 8, 0, Math.PI * 2);
        ctx.strokeStyle = color + "44";
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Marker
      ctx.beginPath();
      ctx.arc(hx, hy, isSelected ? 14 : 10, 0, Math.PI * 2);
      ctx.fillStyle = color + "22";
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Cross icon
      ctx.fillStyle = color;
      ctx.font = `bold ${isSelected ? 14 : 10}px monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("✚", hx, hy);

      // Label
      ctx.fillStyle = "#ffffff";
      ctx.font = `${isSelected ? "bold " : ""}10px monospace`;
      ctx.fillText(h.name, hx, hy + (isSelected ? 22 : 18));

      // Score badge
      ctx.fillStyle = color;
      ctx.font = "bold 9px monospace";
      ctx.fillText(`${h.score}`, hx, hy - (isSelected ? 22 : 18));
    });

    // Ambulance
    const ax = amb.x * W;
    const ay = amb.y * H;

    // Ambulance glow
    const g = ctx.createRadialGradient(ax, ay, 0, ax, ay, 22);
    g.addColorStop(0, "#ff4d6d33");
    g.addColorStop(1, "transparent");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(ax, ay, 22, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(ax, ay, 12, 0, Math.PI * 2);
    ctx.fillStyle = "#ff4d6d";
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "bold 12px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🚑", ax, ay);

  }, [tick, selectedHospital, ambulancePos]);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <div style={styles.label}>LIVE ROUTE MAP</div>
          <div style={styles.title}>Real-Time Navigation</div>
        </div>
        <div style={styles.etaBadge}>ETA: <strong>4 min</strong></div>
      </div>

      <div style={styles.mapWrap}>
        <canvas ref={canvasRef} width={560} height={340} style={styles.canvas} />
        <div style={styles.legend}>
          {[["AVAILABLE", "#06d6a0"], ["LIMITED", "#ffd166"], ["FULL", "#ff4d6d"]].map(([label, color]) => (
            <div key={label} style={styles.legendItem}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
              <span>{label}</span>
            </div>
          ))}
          <div style={styles.legendItem}>
            <span style={{ color: "#ff4d6d" }}>🚑</span>
            <span>Ambulance</span>
          </div>
        </div>
      </div>

      <div style={styles.routeInfo}>
        <div style={styles.routeItem}><span style={styles.routeDot}>📍</span> Current Location: ITO, Delhi</div>
        <div style={styles.routeItem}><span style={styles.routeDot}>🏥</span> Destination: AIIMS Trauma Centre</div>
        <div style={styles.routeItem}><span style={styles.routeDot}>🚦</span> Traffic: Low — Optimal route active</div>
      </div>
    </div>
  );
}

const styles = {
  container: { background: "#0d1117", border: "1px solid #ffffff15", borderRadius: 16, padding: 24, fontFamily: "'JetBrains Mono', 'Courier New', monospace", color: "#f0f0f0" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  label: { fontSize: 10, letterSpacing: 3, color: "#888", textTransform: "uppercase" },
  title: { fontSize: 18, fontWeight: 700, color: "#fff", marginTop: 4 },
  etaBadge: { background: "#00d4ff15", border: "1px solid #00d4ff44", color: "#00d4ff", borderRadius: 8, padding: "6px 14px", fontSize: 12 },
  mapWrap: { position: "relative", borderRadius: 12, overflow: "hidden", border: "1px solid #ffffff10" },
  canvas: { display: "block", width: "100%", height: "auto" },
  legend: { position: "absolute", bottom: 12, left: 12, display: "flex", flexDirection: "column", gap: 4, background: "#0d111799", backdropFilter: "blur(8px)", borderRadius: 8, padding: "8px 12px" },
  legendItem: { display: "flex", alignItems: "center", gap: 6, fontSize: 9, color: "#aaa", letterSpacing: 1 },
  routeInfo: { marginTop: 14, display: "flex", flexDirection: "column", gap: 6 },
  routeItem: { fontSize: 11, color: "#888", display: "flex", alignItems: "center", gap: 8 },
  routeDot: { fontSize: 12 },
};
