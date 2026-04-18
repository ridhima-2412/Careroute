const hospitals = [
  { id: 1, name: "City Trauma Center", distance: "2.4 km", eta: "5 mins", beds: 4, score: "Match 98%" },
  { id: 2, name: "St. Mary's General", distance: "4.1 km", eta: "9 mins", beds: 12, score: "Match 85%" },
];

function HospitalList({ onSelect }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold mb-2">🏥 RECOMMENDED DESTINATION</h2>
      {hospitals.map((h, index) => (
        <button
          key={h.id}
          onClick={() => onSelect(h)}
          className={`w-full text-left p-4 rounded-xl border transition-all ${
            index === 0 
            ? 'bg-blue-600 border-blue-400 scale-105 shadow-lg shadow-blue-900/20' 
            : 'bg-slate-900 border-slate-800 hover:border-slate-600'
          }`}
        >
          <div className="flex justify-between items-start">
            <h3 className="font-bold text-lg">{h.name}</h3>
            <span className="bg-white/20 px-2 py-0.5 rounded text-xs">{h.score}</span>
          </div>
          <div className="mt-2 flex justify-between text-sm font-medium opacity-90">
            <span>{h.distance} ({h.eta})</span>
            <span>{h.beds} ICU Beds Free</span>
          </div>
        </button>
      ))}
    </div>
  );
}

export default HospitalList;
