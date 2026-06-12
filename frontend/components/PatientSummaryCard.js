import React from "react";

export default function PatientSummaryCard({
  severity,
  specialty,
  survivalProbability,
  hospital,
  route,
  alertStatus,
}) {
  const riskCopy =
    severity === "CRITICAL"
      ? "Immediate critical-care placement required"
      : severity === "MODERATE"
        ? "Deterioration risk requires continuous monitoring"
        : "Patient condition currently stable";

  return (
    <section className="case-overview">
      <div className="case-overview-patient">
        <div>
          <div className="eyebrow">Patient condition</div>
          <h2 className="case-overview-title">Ramesh K.</h2>
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

      <div className="case-overview-metrics">
        <div className="case-metric">
          <span className="metric-label">Patient</span>
          <strong>52 / Male</strong>
        </div>
        <div className="case-metric">
          <span className="metric-label">Survival outlook</span>
          <strong>{survivalProbability}%</strong>
        </div>
        <div className="case-metric">
          <span className="metric-label">Required specialty</span>
          <strong style={{ textTransform: "capitalize" }}>{specialty}</strong>
        </div>
        <div className="case-metric">
          <span className="metric-label">Destination</span>
          <strong>{hospital?.name || "Evaluating"}</strong>
        </div>
        <div className="case-metric case-metric-accent">
          <span className="metric-label">ETA</span>
          <strong>{route?.eta || hospital?.eta || "--"}</strong>
        </div>
        <div className="case-metric">
          <span className="metric-label">Receiving team</span>
          <strong className={alertStatus === "sent" ? "text-success" : "text-warning"}>
            {alertStatus === "sent" ? "Alerted" : "Pending alert"}
          </strong>
        </div>
      </div>
    </section>
  );
}
