import React, { useEffect, useMemo, useRef, useState } from "react";

const FALLBACK_POSITIONS = [
  { x: 0.68, y: 0.28 },
  { x: 0.42, y: 0.35 },
  { x: 0.76, y: 0.61 },
  { x: 0.28, y: 0.62 },
  { x: 0.55, y: 0.18 },
  { x: 0.18, y: 0.3 },
  { x: 0.84, y: 0.4 },
  { x: 0.48, y: 0.7 },
];
const AMBULANCE = { x: 0.49, y: 0.82 };

function statusColor(status) {
  if (status === "AVAILABLE") return "#32d583";
  if (status === "LIMITED") return "#ffbd4a";
  return "#ff5d68";
}

export default function MapView({ selectedHospital, hospitals = [], route }) {
  const canvasRef = useRef(null);
  const [tick, setTick] = useState(0);
  const mappedHospitals = useMemo(
    () =>
      hospitals.map((hospital, index) => ({
        ...hospital,
        ...(FALLBACK_POSITIONS[index % FALLBACK_POSITIONS.length]),
      })),
    [hospitals]
  );

  useEffect(() => {
    const timer = setInterval(() => setTick((value) => value + 1), 80);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;

    context.clearRect(0, 0, width, height);
    const gradient = context.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#0c1b28");
    gradient.addColorStop(1, "#07111a");
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);

    context.strokeStyle = "rgba(117, 150, 174, 0.09)";
    context.lineWidth = 1;
    for (let x = 0; x < width; x += 44) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, height);
      context.stroke();
    }
    for (let y = 0; y < height; y += 44) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(width, y);
      context.stroke();
    }

    const roads = [
      [[0.06, 0.68], [0.94, 0.36]],
      [[0.15, 0.18], [0.88, 0.82]],
      [[0.08, 0.42], [0.92, 0.58]],
      [[0.45, 0.05], [0.52, 0.95]],
    ];
    context.strokeStyle = "rgba(151, 177, 196, 0.14)";
    context.lineWidth = 8;
    context.lineCap = "round";
    roads.forEach((road) => {
      context.beginPath();
      context.moveTo(road[0][0] * width, road[0][1] * height);
      context.lineTo(road[1][0] * width, road[1][1] * height);
      context.stroke();
    });

    const destination = mappedHospitals.find((hospital) => hospital.id === selectedHospital?.id);
    if (destination) {
      context.setLineDash([12, 8]);
      context.lineDashOffset = -tick;
      context.strokeStyle = "#47b5ff";
      context.lineWidth = 4;
      context.beginPath();
      context.moveTo(AMBULANCE.x * width, AMBULANCE.y * height);
      context.quadraticCurveTo(
        0.56 * width,
        0.52 * height,
        destination.x * width,
        destination.y * height
      );
      context.stroke();
      context.setLineDash([]);
    }

    mappedHospitals.forEach((hospital) => {
      const x = hospital.x * width;
      const y = hospital.y * height;
      const selected = hospital.id === selectedHospital?.id;
      const color = statusColor(hospital.status);

      if (selected) {
        context.beginPath();
        context.arc(x, y, 27 + Math.sin(tick / 7) * 4, 0, Math.PI * 2);
        context.strokeStyle = `${color}66`;
        context.lineWidth = 3;
        context.stroke();
      }

      context.beginPath();
      context.arc(x, y, selected ? 17 : 13, 0, Math.PI * 2);
      context.fillStyle = "#0b1721";
      context.fill();
      context.strokeStyle = color;
      context.lineWidth = 3;
      context.stroke();

      context.fillStyle = color;
      context.font = "bold 18px Segoe UI";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText("+", x, y - 1);

      context.fillStyle = "#f4f8fb";
      context.font = `${selected ? "bold " : ""}13px Segoe UI`;
      context.fillText(hospital.name, x, y + 31);
      context.fillStyle = color;
      context.font = "bold 12px Segoe UI";
      context.fillText(`${hospital.score || 0}`, x, y - 27);
    });

    const ambulanceX = AMBULANCE.x * width;
    const ambulanceY = AMBULANCE.y * height;
    context.beginPath();
    context.arc(ambulanceX, ambulanceY, 18, 0, Math.PI * 2);
    context.fillStyle = "#d94150";
    context.fill();
    context.fillStyle = "#ffffff";
    context.font = "bold 18px Segoe UI";
    context.fillText("A", ambulanceX, ambulanceY);
  }, [mappedHospitals, selectedHospital, tick]);

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <div className="eyebrow">Live route</div>
          <h2 className="panel-title">Ambulance navigation</h2>
          <p className="panel-copy">ITO, Delhi to {selectedHospital?.name || "awaiting destination"}</p>
        </div>
        <span className="route-eta">
          <small>Estimated arrival</small>
          <strong>{route?.eta || selectedHospital?.eta || "--"}</strong>
        </span>
      </div>

      <div className="map-frame">
        <canvas ref={canvasRef} width="760" height="390" />
        {!mappedHospitals.length && (
          <div className="map-empty">Hospital locations will appear after recommendation data loads.</div>
        )}
        <div className="map-legend">
          <span><i style={{ background: "#32d583" }} />Available</span>
          <span><i style={{ background: "#ffbd4a" }} />Limited</span>
          <span><i style={{ background: "#ff5d68" }} />Full</span>
        </div>
      </div>

      <div className="route-strip">
        <div><span>Distance</span><strong>{route?.distance || selectedHospital?.distance || "--"}</strong></div>
        <div><span>Traffic</span><strong>{route?.trafficLevel || selectedHospital?.traffic || "--"}</strong></div>
        <div><span>Destination readiness</span><strong>{selectedHospital?.status || "Pending"}</strong></div>
      </div>
    </section>
  );
}
