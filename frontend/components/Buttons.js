import React, { useState } from "react";

const actions = [
  {
    id: "recommend",
    label: "Recommend Hospital",
    description: "Re-score hospitals using current vitals",
    className: "button-primary",
  },
  {
    id: "alert",
    label: "Send Hospital Alert",
    description: "Transmit vitals, risk level, and ETA",
    className: "button-success",
  },
  {
    id: "refresh",
    label: "Refresh Capacity",
    description: "Check ICU beds and ventilator access",
    className: "",
  },
  {
    id: "sos",
    label: "Emergency Broadcast",
    description: "Alert all hospitals in range",
    className: "button-danger",
  },
];

export default function Buttons({ onAction, disabled, alertStatus, destinationName }) {
  const [loading, setLoading] = useState("");
  const [message, setMessage] = useState("Controls ready. Confirm the destination before transport.");
  const [error, setError] = useState("");

  async function runAction(action) {
    setLoading(action.id);
    setError("");
    try {
      const result = await onAction?.(action.id);
      setMessage(result?.message || `${action.label} completed.`);
    } catch (actionError) {
      setError(actionError.message || `${action.label} failed.`);
    } finally {
      setLoading("");
    }
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <div className="eyebrow">Emergency controls</div>
          <h2 className="panel-title">Dispatch actions</h2>
          <p className="panel-copy">
            {destinationName ? `Current destination: ${destinationName}` : "Waiting for a destination recommendation"}
          </p>
        </div>
        <span className={`status-pill ${alertStatus === "sent" ? "status-success" : "status-info"}`}>
          {alertStatus === "sent" ? "RECEIVING TEAM NOTIFIED" : "SYSTEM READY"}
        </span>
      </div>

      <div className="action-grid">
        {actions.map((action) => (
          <button
            type="button"
            key={action.id}
            className={`button action-button ${action.className}`}
            onClick={() => runAction(action)}
            disabled={disabled || !!loading}
          >
            <strong>{loading === action.id ? "Working..." : action.label}</strong>
            <span>{action.description}</span>
          </button>
        ))}
      </div>

      <div className={error ? "error-state action-message" : "operational-note action-message"}>
        {error || message}
      </div>
    </section>
  );
}
