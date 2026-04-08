export const AUTH_TOKEN_KEY = "resumind_token";

export function apiBase() {
  return (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
}

export function apiUrl(path) {
  const base = apiBase();
  if (path.startsWith("/")) {
    return base ? `${base}${path}` : path;
  }
  return base ? `${base}/${path}` : `/${path}`;
}

export function getAuthHeaders() {
  const token =
    typeof localStorage !== "undefined"
      ? localStorage.getItem(AUTH_TOKEN_KEY)
      : null;
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export async function apiFetch(path, init = {}) {
  const headers = new Headers(init.headers);
  const auth = getAuthHeaders();
  if (auth.Authorization)
    headers.set("Authorization", auth.Authorization);
  return fetch(apiUrl(path), { ...init, headers });
}

export async function fetchResumeImageBlob(publicId) {
  const res = await apiFetch(`/api/resumes/${publicId}/image`);
  if (!res.ok) return null;
  return res.blob();
}

export async function fetchResumePdfBlob(publicId) {
  const res = await apiFetch(`/api/resumes/${publicId}/pdf`);
  if (!res.ok) return null;
  return res.blob();
}

export async function saveResumeToServer(data) {
  const form = new FormData();
  form.append("publicId", data.publicId);
  form.append("companyName", data.companyName);
  form.append("jobTitle", data.jobTitle);
  form.append("jobDescription", data.jobDescription);
  form.append("feedback", JSON.stringify(data.feedback ?? null));
  form.append("pdf", data.pdf);
  form.append("image", data.image);

  const res = await apiFetch("/api/resumes", {
    method: "POST",
    body: form,
  });
  return res.ok;
}

export async function deleteResume(publicId) {
  const res = await apiFetch(`/api/resumes/${publicId}`, { method: "DELETE" });
  return res.ok;
}
