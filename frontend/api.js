const BASE_URL = 'http://localhost:5000/api';

export const fetchHospitals = async () => {
  try {
    const response = await fetch(`${BASE_URL}/hospitals`);
    return await response.json();
  } catch (error) {
    console.warn("Backend not found, using mock data");
    return [
      { id: 1, name: "City Trauma", eta: "5m", beds: 4 },
      { id: 2, name: "General Hospital", eta: "8m", beds: 2 }
    ];
  }
};

export const sendPatientVitals = async (vitals) => {
  return await fetch(`${BASE_URL}/update-vitals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(vitals),
  });
};
