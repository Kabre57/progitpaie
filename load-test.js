import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "30s", target: 50 },   // Montée progressive à 50 VUs
    { duration: "1m", target: 200 },   // Montée à 200 VUs
    { duration: "2m", target: 500 },   // Pic de charge à 500 VUs simultanés
    { duration: "30s", target: 0 },    // Descente progressive
  ],
  thresholds: {
    http_req_duration: ["p(95)<500"], // 95% des requêtes doivent être < 500ms
    http_req_failed: ["rate<0.01"],   // Taux d'erreur inférieur à 1%
  },
};

const BASE_URL = __ENV.TARGET_URL || "http://localhost:3500";

export default function () {
  // 1. Check-in GPS Pointage Géolocalisé Simultané
  const checkInPayload = JSON.stringify({
    lat: 5.3599517,
    lng: -4.0082563,
  });

  const checkInParams = {
    headers: { "Content-Type": "application/json" },
  };

  const checkInRes = http.post(`${BASE_URL}/api/attendance/check-in`, checkInPayload, checkInParams);
  check(checkInRes, {
    "Check-in Status 200 ou Auth 401": (r) => r.status === 200 || r.status === 401,
  });

  sleep(1);

  // 2. Health Check Monitoring Endpoint
  const healthRes = http.get(`${BASE_URL}/api/health`);
  check(healthRes, {
    "Health Status 200": (r) => r.status === 200,
    "Health Latency < 200ms": (r) => r.timings.duration < 200,
  });

  sleep(1);

  // 3. Endpoint Métriques Prometheus
  const metricsRes = http.get(`${BASE_URL}/api/metrics`);
  check(metricsRes, {
    "Metrics Status 200": (r) => r.status === 200,
  });

  sleep(2);
}
