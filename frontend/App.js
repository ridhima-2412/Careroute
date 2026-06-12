import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Buttons from "./components/Buttons";
import DashboardHeader from "./components/DashboardHeader";
import EmergencyStatusCard from "./components/EmergencyStatusCard";
import HospitalList from "./components/HospitalList";
import MapView from "./components/MapView";
import PatientSummaryCard from "./components/PatientSummaryCard";
import RecommendationReason from "./components/RecommendationReason";
import Vitals from "./components/Vitals";
import {
  broadcastSOS,
  getHospitalRecommendations,
  getRoute,
  getSeverityScore,
  sendPreAlert,
  submitVitals,
  triggerAutonomousReroute,
} from "./api";
import "./dashboard.css";

const CASE_ID = "EMRG-2024-441";
const AMBULANCE_LOCATION = { lat: 28.6139, lng: 77.209 };
const AUTONOMOUS_REROUTE_DELAY_MS = 5000;

function inferSpecialty(vitals) {
  if (!vitals) return "general";
  if (vitals.heartRate > 130 || vitals.spo2 < 92) return "cardiology";
  if (vitals.gcs < 10) return "trauma";
  return "general";
}

export default function App() {
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [hospitals, setHospitals] = useState([]);
  const [latestVitals, setLatestVitals] = useState(null);
  const [severity, setSeverity] = useState("STABLE");
  const [survivalProbability, setSurvivalProbability] = useState(87);
  const [route, setRoute] = useState(null);
  const [loadingState, setLoadingState] = useState("Waiting for patient vitals");
  const [dashboardError, setDashboardError] = useState("");
  const [alertStatus, setAlertStatus] = useState("idle");
  const [alertingHospitalId, setAlertingHospitalId] = useState(null);
  const [rerouteEvent, setRerouteEvent] = useState(null);
  const [rerouteStatus, setRerouteStatus] = useState("monitoring");
  const autonomousRerouteStartedRef = useRef(false);
  const autonomousRerouteTimerRef = useRef(null);

  const specialty = useMemo(() => inferSpecialty(latestVitals), [latestVitals]);
  const activeHospital = useMemo(() => {
    if (!hospitals.length) return selectedHospital;
    return hospitals.find((hospital) => hospital.id === selectedHospital?.id) || hospitals[0];
  }, [hospitals, selectedHospital]);
  const alternatives = useMemo(
    () => hospitals.filter((hospital) => hospital.id !== activeHospital?.id),
    [hospitals, activeHospital]
  );

  const loadRecommendations = useCallback(async (vitals, options = {}) => {
    if (!vitals) return null;

    setDashboardError("");
    setLoadingState(options.refresh ? "Refreshing hospital capacity" : "Evaluating hospital readiness");

    try {
      const severityResponse = await getSeverityScore(vitals);
      const requiredSpecialty = inferSpecialty(vitals);
      setSeverity(severityResponse.severity);
      setSurvivalProbability(severityResponse.survivalProbability);

      await submitVitals(CASE_ID, vitals);
      const recommendationResponse = await getHospitalRecommendations({
        severity: severityResponse.severity,
        specialty: requiredSpecialty,
        location: AMBULANCE_LOCATION,
        patientVitals: vitals,
      });

      const rankedHospitals = recommendationResponse.hospitals || [];
      const preferredHospital = recommendationResponse.recommendation || rankedHospitals[0] || null;
      setHospitals(rankedHospitals);
      setSelectedHospital((current) => {
        if (options.forceBest || !current) return preferredHospital;
        return rankedHospitals.find((hospital) => hospital.id === current.id) || preferredHospital;
      });

      if (preferredHospital?.id) {
        const routeResponse = await getRoute(AMBULANCE_LOCATION, preferredHospital.id);
        setRoute(routeResponse.route);
      }

      setLoadingState("");
      return { preferredHospital, severityResponse, requiredSpecialty };
    } catch (error) {
      console.error("Failed to synchronize emergency dashboard", error);
      setDashboardError("Live hospital data could not be loaded. Confirm that the backend is running on port 5000.");
      setLoadingState("");
      return null;
    }
  }, []);

  useEffect(() => {
    if (!latestVitals) return;
    let active = true;

    loadRecommendations(latestVitals).then((result) => {
      if (!active || !result?.preferredHospital) return;
      if (
        !autonomousRerouteStartedRef.current &&
        result.preferredHospital.name?.toLowerCase().includes("aiims")
      ) {
        autonomousRerouteStartedRef.current = "scheduled";
        autonomousRerouteTimerRef.current = setTimeout(async () => {
          try {
            setRerouteStatus("evaluating");
            const response = await triggerAutonomousReroute({
              caseId: CASE_ID,
              severity: result.severityResponse.severity,
              specialty: result.requiredSpecialty,
              location: AMBULANCE_LOCATION,
              patientVitals: latestVitals,
            });
            const nextHospital = response.recommendation || response.hospitals?.[0] || null;
            setRerouteEvent(response.event);
            setHospitals(response.hospitals || []);
            setSelectedHospital(nextHospital);
            setRerouteStatus("rerouted");
            autonomousRerouteStartedRef.current = "complete";

            if (nextHospital?.id) {
              const routeResponse = await getRoute(AMBULANCE_LOCATION, nextHospital.id);
              setRoute(routeResponse.route);
            }
          } catch (error) {
            console.error("Autonomous reroute failed", error);
            setRerouteStatus("monitoring");
            autonomousRerouteStartedRef.current = false;
          }
        }, AUTONOMOUS_REROUTE_DELAY_MS);
      }
    });

    return () => {
      active = false;
    };
  }, [latestVitals, loadRecommendations]);

  useEffect(() => () => clearTimeout(autonomousRerouteTimerRef.current), []);

  async function handleAlertHospital(hospital) {
    try {
      setAlertStatus("sending");
      setAlertingHospitalId(hospital.id);
      const response = await sendPreAlert(hospital.id, {
        caseId: CASE_ID,
        severity,
        specialty,
        location: AMBULANCE_LOCATION,
        vitals: latestVitals,
      });
      setAlertStatus("sent");
      return response;
    } catch (error) {
      setAlertStatus("error");
      setDashboardError("The hospital alert was not delivered. Check backend connectivity and retry.");
      throw error;
    } finally {
      setAlertingHospitalId(null);
    }
  }

  async function handleViewRoute(hospital) {
    setSelectedHospital(hospital);
    setLoadingState("Calculating route");
    try {
      const routeResponse = await getRoute(AMBULANCE_LOCATION, hospital.id);
      setRoute(routeResponse.route);
    } finally {
      setLoadingState("");
    }
  }

  async function handleAction(actionId) {
    if (actionId === "recommend") {
      await loadRecommendations(latestVitals, { forceBest: true });
      return { message: "Hospital recommendation updated using current vitals and capacity." };
    }

    if (actionId === "refresh") {
      await loadRecommendations(latestVitals, { refresh: true });
      return { message: "Hospital capacity and route data refreshed." };
    }

    if (actionId === "alert" && activeHospital) {
      const response = await handleAlertHospital(activeHospital);
      return { message: response.message || `Alert sent to ${activeHospital.name}.` };
    }

    if (actionId === "sos") {
      const response = await broadcastSOS({
        severity,
        specialty,
        location: AMBULANCE_LOCATION,
        vitals: latestVitals,
      });
      return { message: response.message };
    }

    return { message: "Select a destination hospital before sending an alert." };
  }

  return (
    <div className="dashboard-shell">
      <DashboardHeader caseId={CASE_ID} severity={severity} />

      <main className="dashboard-main">
        {dashboardError && <div className="error-state dashboard-error">{dashboardError}</div>}
        {loadingState && <div className="loading-state dashboard-loading">{loadingState}...</div>}

        <div className="dashboard-grid">
          <div className="dashboard-column">
            <PatientSummaryCard
              severity={severity}
              specialty={specialty}
              survivalProbability={survivalProbability}
            />
            <Vitals
              patientName="Patient #EMRG-441 - Ramesh K."
              onVitalsChange={setLatestVitals}
            />
            <EmergencyStatusCard
              hospital={activeHospital}
              alertStatus={alertStatus}
              rerouteStatus={rerouteStatus}
            />
          </div>

          <div className="dashboard-column">
            <RecommendationReason
              hospital={activeHospital}
              alternatives={alternatives}
              specialty={specialty}
              severity={severity}
              rerouteEvent={rerouteEvent}
            />
            <MapView selectedHospital={activeHospital} hospitals={hospitals} route={route} />
            <Buttons
              onAction={handleAction}
              disabled={!latestVitals}
              alertStatus={alertStatus}
              destinationName={activeHospital?.name}
            />
          </div>

          <div className="dashboard-column">
            <HospitalList
              hospitals={hospitals}
              selectedHospitalId={activeHospital?.id}
              specialty={specialty}
              onSelect={setSelectedHospital}
              onAlertHospital={handleAlertHospital}
              onViewRoute={handleViewRoute}
              alertingHospitalId={alertingHospitalId}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
