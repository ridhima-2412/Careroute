import React, { useState } from "react";

const actions = [
  {
    id: "sos",
    label: "SOS BROADCAST",
    icon: "🆘",
    description: "Alert all hospitals simultaneously",
    color: "#ff4d6d",
    hotkey: "F1",
  },
  {
    id: "prealert",
    label: "SEND PRE-ALERT",
    icon: "⚡",
    description: "Transmit patient vitals to destination",
    color: "#ffd166",
    hotkey: "F2",
  },
  {
    id: "route",
    label: "REROUTE NOW",
    icon: "🗺",
    description: "Recalculate optimal path",
    color: "#00d4ff",
    hotkey: "F3",
  },
  {
    id: "escalate",
    label: "ESCALATE CASE",
    icon: "🔺",
    description: "Mark as mass casualty / trauma",
    color: "#c77dff",
    hotkey: "F4",
  },
  {
    id: "offline",
    label: "OFFLINE MODE",
    icon: "📡",
    description: "Switch to cached local data",
    color: "#06d6a0",
    hotkey: "F5",
  },
  {
    id: "contact",
    label: "CONTACT HOSPITAL",
    icon: "📞",
    description: "Open direct voice channel",
    color: "#f77f00",
    hotkey: "F6",
  },
];

function ActionButton({ action, onClick, active, loading }) {
  return (
    <button
      onClick={() => onClick(action.id)}
      style={{
        ...styles.btn,
        border: `1px solid ${active ? action.color : action.color + "33"}`,
        background: active ? action.color + "22" : "#ffffff05",
        boxShadow: active ? `0 0 16px ${action.color}44` : "none",
        transform: loading ? "scale(0.97)" : "scale(1)",
      }}
    >
      <div style={styles.btnTop}>
        <span style={{ fontSize: 20 }}>{action.icon}</span>
        <span style={{ ...styles.hotkey, color: action.color + "99", border: `1px solid ${action.color}33` }}>{action.hotkey}</span>
      </div>
      <div style={{ ...styles.btnLabel, color: active ? action.color : "#ccc" }}>{action.label}</div>
      <div style={styles.btnDesc}>{action.description}</div>
      {loading && (
        <div style={{ ...styles.loadBar, background: action.color }}>
          <div style={{ ...styles.loadFill, background: action.color + "55" }} />
        </div>
      )}
    </button>
  );
}

export default function Buttons() {
  const [active, setActive] = useState({});
  const [loading, setLoading] = useState(null);
  const [log, setLog] = useState([
    { time: "17:01:22", msg: "System initialized — GPS lock acquired", type: "info" },
    { time: "17:01:25", msg: "Hospital database synced — 4 hospitals in range", type: "success" },
    { time: "17:01:30", msg: "Vitals monitoring active — Patient stable", type: "info" },
  ]);

  function handleAction(id) {
    setLoading(id);
    setTimeout(() => {
      setLoading(null);
      setActive((prev) => ({ ...prev, [id]: !prev[id] }));
      const action = actions.find((a) => a.id === id);
      const now = new Date();
      const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
      const msgs = {
        sos: "🆘 SOS broadcast sent to all 4 hospitals",
        prealert: "⚡ Patient vitals transmitted to AIIMS Trauma",
        route: "🗺 Route recalculated — ETA updated to 4 min",
        escalate: "🔺 Case escalated to MASS CASUALTY protocol",
        offline: "📡 Switched to offline mode — cached data active",
        contact: "📞 Voice channel opened with AIIMS Trauma Centre",
      };
      setLog((prev) => [
        ...prev,
        { time, msg: msgs[id] || `Action executed: ${action.label}`, type: active[id] ? "warning" : "success" },
      ].slice(-6));
    }, 800);
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <div style={styles.label}>QUICK ACTIONS</div>
          <div style={styles.title}>Emergency Controls</div>
        </div>
        <div style={styles.statusDot}>
          <span style={styles.dot} />
          SYSTEM READY
        </div>
      </div>

      <div style={styles.grid}>
        {actions.map((a) => (
          <ActionButton
            key={a.id}
            action={a}
            onClick={handleAction}
            active={!!active[a.id]}
            loading={loading === a.id}
          />
        ))}
      </div>

      <div style={styles.logContainer}>
        <div style={styles.logHeader}>
          <span style={{ color: "#06d6a0", fontSize: 9 }}>●</span> ACTIVITY LOG
        </div>
        <div style={styles.logList}>
          {log.map((entry, i) => (
            <div key={i} style={styles.logEntry}>
              <span style={styles.logTime}>{entry.time}</span>
              <span style={{ ...styles.logMsg, color: entry.type === "success" ? "#06d6a0" : entry.type === "warning" ? "#ffd166" : "#888" }}>
                {entry.msg}
              </span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes fillBar { from { width: 0% } to { width: 100% } }
      `}</style>
    </div>
  );
}

const styles = {
  container: { background: "#0d1117", border: "1px solid #ffffff15", borderRadius: 16, padding: 24, fontFamily: "'JetBrains Mono', 'Courier New', monospace", color: "#f0f0f0" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  label: { fontSize: 10, letterSpacing: 3, color: "#888", textTransform: "uppercase" },
  title: { fontSize: 18, fontWeight: 700, color: "#fff", marginTop: 4 },
  statusDot: { display: "flex", alignItems: "center", gap: 6, fontSize: 9, letterSpacing: 2, color: "#06d6a0" },
  dot: { display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: "#06d6a0", animation: "blink 1.5s infinite" },
  grid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 20 },
  btn: { borderRadius: 12, padding: 14, cursor: "pointer", textAlign: "left", transition: "all 0.25s ease", position: "relative", overflow: "hidden" },
  btnTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 },
  hotkey: { fontSize: 9, borderRadius: 4, padding: "1px 5px", letterSpacing: 1 },
  btnLabel: { fontSize: 10, fontWeight: 800, letterSpacing: 1.5, marginBottom: 4 },
  btnDesc: { fontSize: 9, color: "#555", lineHeight: 1.4 },
  loadBar: { position: "absolute", bottom: 0, left: 0, right: 0, height: 2, animation: "fillBar 0.8s ease forwards" },
  loadFill: { height: "100%", width: "100%" },
  logContainer: { background: "#000000aa", border: "1px solid #ffffff0a", borderRadius: 10, padding: 14 },
  logHeader: { fontSize: 9, letterSpacing: 3, color: "#555", marginBottom: 10, display: "flex", alignItems: "center", gap: 6, textTransform: "uppercase" },
  logList: { display: "flex", flexDirection: "column", gap: 6 },
  logEntry: { display: "flex", gap: 10, alignItems: "flex-start" },
  logTime: { fontSize: 9, color: "#444", whiteSpace: "nowrap", minWidth: 60 },
  logMsg: { fontSize: 10, lineHeight: 1.4 },
};
