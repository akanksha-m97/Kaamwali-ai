// src/api.js

// Use Render backend URL in production, fallback to localhost for local dev
const localHosts = ["localhost", "127.0.0.1", "::1"];
export const API_BASE =
  import.meta.env.VITE_API_BASE ||
  localHosts.includes(window.location.hostname)
    ? "http://localhost:4000"
    : "https://kaamwali-1.onrender.com";

export function resolveMediaUrl(url) {
  if (!url) return "";
  if (/^(https?:)?\/\//i.test(url) || url.startsWith("data:") || url.startsWith("blob:")) {
    return url;
  }
  return `${API_BASE}${url.startsWith("/") ? url : `/${url}`}`;
}

// Metrics (you can make this hit your backend or just stub it)
export async function getMetrics() {
  try {
    const res = await fetch(`${API_BASE}/api/workers`);
    const data = await res.json();
    return {
      workersCount: (data.workers || []).length,
      employersCount: 0,

    };
  } catch {
    return { workersCount: 0, employersCount: 0 };
  }
}

// Employer search: call GET /api/workers with stable filter codes.

export async function searchWorkers(cityCode, skillCode) {
  const params = new URLSearchParams();

  if (cityCode) {
    params.append("cityArea", cityCode);
    params.append("q", cityCode);
  }

  if (skillCode) params.append("skill", skillCode);

  const res = await fetch(`${API_BASE}/api/workers?${params.toString()}`);
  if (!res.ok) {
    throw new Error("Failed to fetch workers");
  }
  const data = await res.json();
  return data.workers || [];
}

// Called when worker finishes onboarding
// Always try to send both sessionId and latest draft
export async function completeWorkerProfile(sessionId, draft) {
  // Get the worker's login phone from localStorage
  const userData = localStorage.getItem('userData');
  const workerPhone = userData ? JSON.parse(userData).phone : null;
  
  const body = draft ? { sessionId, draft, workerPhone } : { sessionId, workerPhone };

  const res = await fetch(`${API_BASE}/api/profile/complete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    let errBody = {};
    try {
      errBody = await res.json();
    } catch {
      // ignore JSON parse error
    }
    console.error("completeWorkerProfile error", res.status, errBody);
    throw new Error(errBody.error || "Failed to complete profile");
  }

  const data = await res.json();
  return data.worker;
}