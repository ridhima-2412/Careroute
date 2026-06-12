import React, { useEffect, useState } from "react";

export default function DashboardHeader({ caseId, severity }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const severityClass =
    severity === "CRITICAL"
      ? "status-critical"
      : severity === "MODERATE"
        ? "status-warning"
        : "status-success";

  return (
    <header className="dashboard-header">
      <div className="brand">
        <div className="brand-mark" aria-hidden="true">+</div>
        <div>
          <div className="brand-name">CareRoute</div>
          <div className="brand-subtitle">Ambulance decision support and hospital coordination</div>
        </div>
      </div>

      <div className="header-case">
        <div>
          <span className="header-label">Emergency case</span>
          <span className="header-value">#{caseId}</span>
        </div>
        <div>
          <span className="header-label">Dispatch state</span>
          <span className={`status-pill ${severityClass}`}>{severity} - EN ROUTE</span>
        </div>
        <div>
          <span className="header-label">Connectivity</span>
          <span className="header-value">GPS locked / Live data</span>
        </div>
      </div>

      <div className="header-clock">
        <div className="header-time">
          {now.toLocaleTimeString("en-IN", { hour12: false })}
        </div>
        <div className="header-date">
          {now.toLocaleDateString("en-IN", {
            weekday: "short",
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </div>
      </div>
    </header>
  );
}
