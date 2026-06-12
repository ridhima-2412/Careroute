import React from "react";

function hasSpecialty(hospital, specialty) {
  return hospital?.specialists?.some((item) =>
    String(item).toLowerCase().includes(String(specialty).toLowerCase())
  );
}

function rejectionReason(hospital, specialty) {
  if (hospital.status === "FULL") return "Rejected: critical-care capacity is full.";
  if (hospital.icuBeds <= 0) return "Rejected: no ICU bed is currently available.";
  if (hospital.ventilators <= 0) return "Lower priority: no ventilator is currently available.";
  if (!hasSpecialty(hospital, specialty) && specialty !== "general") {
    return `Lower priority: no confirmed ${specialty} specialty match.`;
  }
  if (hospital.traffic === "High") return "Lower priority: high traffic increases transfer time.";
  return `Lower priority: suitability score ${hospital.score} is below the selected destination.`;
}

export default function RecommendationReason({
  hospital,
  alternatives,
  specialty,
  severity,
  rerouteEvent,
}) {
  if (!hospital) {
    return (
      <section className="panel">
        <div className="eyebrow">Destination decision</div>
        <h2 className="panel-title">Awaiting hospital recommendation</h2>
        <div className="loading-state" style={{ marginTop: 18 }}>
          Live vitals are being evaluated against hospital capacity, specialty support, and ETA.
        </div>
      </section>
    );
  }

  const selectedReason =
    hospital.reason ||
    `${hospital.name} has ${hospital.icuBeds} ICU bed(s), ${hospital.ventilators} ventilator(s), ` +
      `${specialty} support, and an estimated arrival time of ${hospital.eta}.`;
  const suggestedAction =
    severity === "CRITICAL"
      ? `Send the receiving alert now and prepare airway support during the ${hospital.eta} transfer.`
      : `Confirm acceptance with ${hospital.name} and continue monitoring for deterioration.`;

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <div className="eyebrow">Destination decision</div>
          <h2 className="panel-title">{hospital.name}</h2>
          <p className="panel-copy">Best hospital for the current clinical and transport constraints</p>
        </div>
        <span className="status-pill status-success">BEST MATCH {hospital.score}</span>
      </div>

      <div className="operational-note">
        CareRoute selected {hospital.name} because it {selectedReason.replace(/^./, (c) => c.toLowerCase())}
      </div>

      <div className="recommendation-facts">
        <div><span>ETA</span><strong>{hospital.eta}</strong></div>
        <div><span>ICU beds</span><strong>{hospital.icuBeds}</strong></div>
        <div><span>Ventilators</span><strong>{hospital.ventilators}</strong></div>
        <div><span>Emergency load</span><strong>{hospital.waitTime || "Low"}</strong></div>
      </div>

      {rerouteEvent && (
        <div className="decision-alert">
          <strong>Route update:</strong> {rerouteEvent.trigger} {rerouteEvent.agentAction}
        </div>
      )}

      <div className="decision-section">
        <h3>Why other hospitals were not selected</h3>
        {(alternatives || []).slice(0, 3).map((alternative) => (
          <div className="rejection-row" key={alternative.id}>
            <span>{alternative.name}</span>
            <strong>{rejectionReason(alternative, specialty)}</strong>
          </div>
        ))}
      </div>

      <div className="suggested-action">
        <span>Suggested paramedic action</span>
        <strong>{suggestedAction}</strong>
      </div>
    </section>
  );
}
