import React, { useState } from 'react';
import MapView from './components/MapView';
import Vitals from './components/Vitals';
import HospitalList from './components/HospitalList';

function App() {
  const [selectedHospital, setSelectedHospital] = useState(null);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans p-4 lg:p-6">
      {/* Header with High Contrast Status */}
      <header className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-bold tracking-tight">
          <span className="text-red-500 text-3xl mr-2">●</span>
          SMART AMBULANCE <span className="font-light opacity-70">| UNIT-04</span>
        </h1>
        <div className="bg-red-600 px-4 py-2 rounded-full font-bold animate-pulse">
          EMERGENCY MODE
        </div>
      </header>

      <main className="grid grid-cols-12 gap-6">
        {/* Left Column: Patient Data */}
        <section className="col-span-12 lg:col-span-3 space-y-6">
          <Vitals />
        </section>

        {/* Center: Map Navigation */}
        <section className="col-span-12 lg:col-span-6 bg-slate-900 rounded-xl overflow-hidden border border-slate-800 h-[600px]">
          <MapView selectedHospital={selectedHospital} />
        </section>

        {/* Right Column: AI Hospital Recommendations */}
        <section className="col-span-12 lg:col-span-3">
          <HospitalList onSelect={setSelectedHospital} />
        </section>
      </main>
    </div>
  );
}

export default App;
