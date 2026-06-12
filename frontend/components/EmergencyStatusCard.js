import React from "react";

export default function EmergencyStatusCard({ hospital, alertStatus, rerouteStatus }) {
  const alertSent = alertStatus === "sent";

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <div className="eyebrow">Ambulance-to-hospital communication</div>
          <h2 className="panel-title">Receiving team status</h2>
        </div>
        <span className={`status-pill ${alertSent ? "status-success" : "status-warning"}`}>
          {alertSent ? "ALERT SENT" : "ACTION REQUIRED"}
        </span>
      </div>

      <div className="communication-list">
        <div>
          <span className="communication-dot status-success" />
          <div><strong>Vitals stream active</strong><small>Patient data synchronized with dispatch</small></div>
        </div>
        <div>
          <span className={`communication-dot ${hospital ? "status-success" : "status-warning"}`} />
          <div><strong>{hospital ? `Destination: ${hospital.name}` : "Destination pending"}</strong><small>Hospital selected from live resource data</small></div>
        </div>
        <div>
          <span className={`communication-dot ${alertSent ? "status-success" : "status-warning"}`} />
          <div><strong>{alertSent ? "Receiving hospital alerted" : "Hospital alert not yet sent"}</strong><small>{alertSent ? "Clinical summary and ETA transmitted" : "Send alert before arrival"}</small></div>
        </div>
        <div>
          <span className={`communication-dot ${rerouteStatus === "evaluating" ? "status-warning" : "status-info"}`} />
          <div><strong>Capacity monitoring active</strong><small>Route will update if critical resources change</small></div>
        </div>
      </div>
    </section>
  );
}
