import React from "react";

export default function PatientSummaryCard({ severity, specialty, survivalProbability }) {
  const riskCopy =
    severity === "CRITICAL"
      ? "Immediate critical-care placement required"
      : severity === "MODERATE"
        ? "Deterioration risk requires continuous monitoring"
        : "Patient condition currently stable";

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <div className="eyebrow">Patient condition</div>
          <h2 className="panel-title">Ramesh K., 52 / Male</h2>
          <p className="panel-copy">{riskCopy}</p>
        </div>
        <span className={`status-pill ${
          severity === "CRITICAL"
            ? "status-critical"
            : severity === "MODERATE"
              ? "status-warning"
              : "status-success"
        }`}>
          {severity} RISK
        </span>
      </div>

      <div className="metric-grid">
        <div className="metric-card">
          <span className="metric-label">Survival outlook</span>
          <span className="metric-value">{survivalProbability}</span>
          <span className="metric-unit">%</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Required specialty</span>
          <span style={{ fontSize: 20, fontWeight: 800, textTransform: "capitalize" }}>
            {specialty}
          </span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Crew</span>
          <span style={{ fontSize: 17, fontWeight: 800 }}>Dr. Mehta + EMT Raza</span>
        </div>
      </div>
    </section>
  );
}
