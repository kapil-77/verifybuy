const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

export async function sendIdTokenToBackend(idToken: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/auth/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to verify session with backend");
  }
}