import React, { useMemo, useState } from "react";

function resourceState(value) {
  if (value <= 0) return "resource-critical";
  if (value <= 2) return "resource-warning";
  return "resource-available";
}

function specialtyMatch(hospital, specialty) {
  if (specialty === "general") return true;
  return hospital.specialists?.some((item) =>
    String(item).toLowerCase().includes(String(specialty).toLowerCase())
  );
}

function capacityProbability(hospital) {
  const predicted = hospital.predictedAvailability?.icuBedsIn15Minutes;
  const beds = predicted ?? hospital.icuBeds;
  if (beds >= 4) return "High";
  if (beds >= 1) return "Moderate";
  return "Low";
}

export default function HospitalList({
  hospitals = [],
  selectedHospitalId,
  specialty = "general",
  onSelect,
  onAlertHospital,
  onViewRoute,
  alertingHospitalId,
}) {
  const [alertedId, setAlertedId] = useState(null);
  const ranked = useMemo(
    () => [...hospitals].sort((left, right) => right.score - left.score),
    [hospitals]
  );

  async function handleAlert(hospital) {
    const result = await onAlertHospital?.(hospital);
    if (result?.success) setAlertedId(hospital.id);
  }

  return (
    <section className="panel hospital-panel">
      <div className="panel-header">
        <div>
          <div className="eyebrow">Hospital capacity</div>
          <h2 className="panel-title">Live receiving options</h2>
          <p className="panel-copy">Ranked by clinical fit, capacity, travel time, and emergency load</p>
        </div>
        <span className="status-pill status-info">{ranked.length} IN RANGE</span>
      </div>

      {!ranked.length ? (
        <div className="loading-state">
          Checking nearby hospitals for ICU beds, ventilators, and specialty coverage...
        </div>
      ) : (
        <div className="hospital-list">
          {ranked.map((hospital, index) => {
            const selected = hospital.id === selectedHospitalId;
            const matched = specialtyMatch(hospital, specialty);
            const statusClass =
              hospital.status === "AVAILABLE"
                ? "status-success"
                : hospital.status === "LIMITED"
                  ? "status-warning"
                  : "status-critical";

            return (
              <article
                className={`hospital-card ${selected ? "hospital-card-selected" : ""}`}
                key={hospital.id}
                onClick={() => onSelect?.(hospital)}
              >
                <div className="hospital-card-heading">
                  <div>
                    <div className="hospital-rank">
                      {index === 0 ? "Recommended destination" : `Alternative ${index}`}
                    </div>
                    <h3>{hospital.name}</h3>
                  </div>
                  <span className={`status-pill ${statusClass}`}>{hospital.status}</span>
                </div>

                <div className="hospital-route-summary">
                  <div><span>Distance</span><strong>{hospital.distance}</strong></div>
                  <div><span>ETA</span><strong>{hospital.eta}</strong></div>
                  <div><span>Score</span><strong>{hospital.score}/100</strong></div>
                </div>

                <div className="capacity-grid">
                  <div className={resourceState(hospital.icuBeds)}>
                    <span>ICU beds</span>
                    <strong>{hospital.icuBeds}</strong>
                  </div>
                  <div className={resourceState(hospital.ventilators)}>
                    <span>Ventilators</span>
                    <strong>{hospital.ventilators}</strong>
                  </div>
                  <div>
                    <span>Bed probability</span>
                    <strong>{capacityProbability(hospital)}</strong>
                  </div>
                </div>

                <div className="specialty-row">
                  <span className={matched ? "match-chip match-positive" : "match-chip match-negative"}>
                    {matched ? `${specialty} support confirmed` : `${specialty} match not confirmed`}
                  </span>
                  <span className="match-chip">{hospital.traffic || "Unknown"} traffic</span>
                  <span className="match-chip">{hospital.waitTime || "Wait unknown"}</span>
                </div>

                <p className="hospital-reason">
                  {hospital.reason ||
                    (index === 0
                      ? `Recommended hospital has ${specialty} support and critical-care access.`
                      : hospital.icuBeds <= 0
                        ? "Not selected because no ICU bed is currently available."
                        : `Lower suitability than ${ranked[0].name} for this emergency.`)}
                </p>

                <div className="hospital-actions">
                  <button
                    type="button"
                    className="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onViewRoute?.(hospital);
                    }}
                  >
                    View Route
                  </button>
                  <button
                    type="button"
                    className={`button ${alertedId === hospital.id ? "" : "button-success"}`}
                    disabled={alertingHospitalId === hospital.id}
                    onClick={(event) => {
                      event.stopPropagation();
                      handleAlert(hospital);
                    }}
                  >
                    {alertingHospitalId === hospital.id
                      ? "Sending..."
                      : alertedId === hospital.id
                        ? "Alert Sent"
                        : "Send Hospital Alert"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
