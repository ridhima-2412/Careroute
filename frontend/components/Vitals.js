const VitalSign = ({ label, value, unit, status }) => (
  <div className={`p-4 rounded-lg border-l-4 bg-slate-900 ${status === 'critical' ? 'border-red-500' : 'border-emerald-500'}`}>
    <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold">{label}</p>
    <div className="flex items-baseline gap-1">
      <span className="text-4xl font-black">{value}</span>
      <span className="text-sm opacity-60">{unit}</span>
    </div>
  </div>
);

function Vitals() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold mb-2 flex items-center gap-2">
        🩺 PATIENT VITALS
      </h2>
      <VitalSign label="Heart Rate" value="112" unit="BPM" status="critical" />
      <VitalSign label="SpO2" value="94" unit="%" status="normal" />
      <VitalSign label="Blood Pressure" value="140/90" unit="mmHg" status="normal" />
    </div>
  );
}

export default Vitals;
