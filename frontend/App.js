import React, { useState, useEffect } from "react";
import Vitals from "./components/Vitals";
import HospitalList from "./components/HospitalList";
import MapView from "./components/MapView";
import Buttons from "./components/Buttons";

function TopBar() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={topBarStyles.bar}>
      <div style={topBarStyles.left}>
        <div style={topBarStyles.logo}>
          <span style={topBarStyles.logoIcon}>🚑</span>
          <div>
            <div style={topBarStyles.logoTitle}>SMART AMBULANCE</div>
            <div style={topBarStyles.logoSub}>Decision Support System v1.0</div>
          </div>
        </div>
      </div>

      <div style={topBarStyles.center}>
        <div style={topBarStyles.statusItem}>
          <span style={{ ...topBarStyles.indicator, background: "#06d6a0" }} />
          GPS LOCK
        </div>
        <div style={topBarStyles.statusItem}>
          <span style={{ ...topBarStyles.indicator, background: "#00d4ff" }} />
          4G CONNECTED
        </div>
        <div style={topBarStyles.statusItem}>
          <span style={{ ...topBarStyles.indicator, background: "#ffd166", animation: "blink 1s infinite" }} />
          EN ROUTE
        </div>
      </div>

      <div style={topBarStyles.right}>
        <div style={topBarStyles.time}>
          {time.toLocaleTimeString("en-IN", { hour12: false })}
        </div>
        <div style={topBarStyles.date}>
          {time.toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })}
        </div>
      </div>
    </div>
  );
}

function SurvivalBadge() {
  return (
    <div style={survivalStyles.container}>
      <div style={survivalStyles.label}>SURVIVAL PROBABILITY</div>
      <div style={survivalStyles.value}>87<span style={{ fontSize: 20 }}>%</span></div>
      <div style={survivalStyles.bar}>
        <div style={survivalStyles.fill} />
      </div>
      <div style={survivalStyles.sub}>Based on current vitals & hospital match</div>
    </div>
  );
}

function CaseSummary() {
  return (
    <div style={summaryStyles.container}>
      <div style={summaryStyles.label}>CASE SUMMARY</div>
      <div style={summaryStyles.row}><span>Case ID</span><strong>#EMRG-2024-441</strong></div>
      <div style={summaryStyles.row}><span>Incident Type</span><strong style={{ color: "#ff4d6d" }}>Cardiac Arrest</strong></div>
      <div style={summaryStyles.row}><span>Age / Gender</span><strong>52 / Male</strong></div>
      <div style={summaryStyles.row}><span>Crew</span><strong>Dr. Mehta + EMT Raza</strong></div>
      <div style={summaryStyles.row}><span>Dispatch Time</span><strong>17:01:14</strong></div>
      <div style={summaryStyles.row}><span>On Scene At</span><strong>17:04:28</strong></div>
    </div>
  );
}

export default function App() {
  const [selectedHospital, setSelectedHospital] = useState(null);

  return (
    <div style={appStyles.root}>
      <TopBar />

      <div style={appStyles.main}>
        {/* Left Column */}
        <div style={appStyles.leftCol}>
          <Vitals patientName="Patient #EMRG-441 — Ramesh K." />
          <div style={{ display: "flex", gap: 14 }}>
            <SurvivalBadge />
            <CaseSummary />
          </div>
        </div>

        {/* Center Column */}
        <div style={appStyles.centerCol}>
          <MapView selectedHospital={selectedHospital} />
          <Buttons />
        </div>

        {/* Right Column */}
        <div style={appStyles.rightCol}>
          <HospitalList onSelect={setSelectedHospital} />
        </div>
      </div>

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #070a0f; }
        @keyframes blink { 0%,100% { opacity:1 } 50% { opacity:0.3 } }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0d1117; }
        ::-webkit-scrollbar-thumb { background: #ffffff15; border-radius: 2px; }
      `}</style>
    </div>
  );
}

const appStyles = {
  root: { background: "#070a0f", minHeight: "100vh", fontFamily: "'JetBrains Mono', 'Courier New', monospace", color: "#f0f0f0", display: "flex", flexDirection: "column" },
  main: { display: "grid", gridTemplateColumns: "360px 1fr 380px", gap: 14, padding: "14px 20px 20px", flex: 1, minHeight: 0, overflow: "auto" },
  leftCol: { display: "flex", flexDirection: "column", gap: 14, minWidth: 0 },
  centerCol: { display: "flex", flexDirection: "column", gap: 14, minWidth: 0 },
  rightCol: { display: "flex", flexDirection: "column", gap: 14, minWidth: 0, overflowY: "auto", maxHeight: "calc(100vh - 80px)" },
};

const topBarStyles = {
  bar: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", background: "#0d1117", borderBottom: "1px solid #ffffff10" },
  left: { display: "flex", alignItems: "center" },
  logo: { display: "flex", alignItems: "center", gap: 12 },
  logoIcon: { fontSize: 28 },
  logoTitle: { fontSize: 16, fontWeight: 800, color: "#fff", letterSpacing: 2 },
  logoSub: { fontSize: 9, color: "#555", letterSpacing: 2, textTransform: "uppercase" },
  center: { display: "flex", alignItems: "center", gap: 24 },
  statusItem: { display: "flex", alignItems: "center", gap: 6, fontSize: 9, letterSpacing: 2, color: "#888" },
  indicator: { display: "inline-block", width: 7, height: 7, borderRadius: "50%" },
  right: { textAlign: "right" },
  time: { fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: 2, fontVariantNumeric: "tabular-nums" },
  date: { fontSize: 9, color: "#555", letterSpacing: 2, textTransform: "uppercase", marginTop: 2 },
};

const survivalStyles = {
  container: { flex: 1, background: "#0d1117", border: "1px solid #06d6a033", borderRadius: 14, padding: 16 },
  label: { fontSize: 9, letterSpacing: 3, color: "#888", textTransform: "uppercase", marginBottom: 6 },
  value: { fontSize: 42, fontWeight: 900, color: "#06d6a0", lineHeight: 1 },
  bar: { height: 4, background: "#ffffff10", borderRadius: 4, margin: "10px 0 6px", overflow: "hidden" },
  fill: { width: "87%", height: "100%", background: "linear-gradient(90deg, #06d6a0, #00d4ff)", borderRadius: 4 },
  sub: { fontSize: 9, color: "#555", lineHeight: 1.4 },
};

const summaryStyles = {
  container: { flex: 1.5, background: "#0d1117", border: "1px solid #ffffff10", borderRadius: 14, padding: 16 },
  label: { fontSize: 9, letterSpacing: 3, color: "#888", textTransform: "uppercase", marginBottom: 10 },
  row: { display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 10, color: "#666", marginBottom: 7, borderBottom: "1px solid #ffffff06", paddingBottom: 6 },
};
