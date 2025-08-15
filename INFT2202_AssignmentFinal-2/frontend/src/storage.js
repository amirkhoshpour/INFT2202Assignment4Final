const API = "http://localhost:3000/projects";

function authHeader() {
  const token = localStorage.getItem("userToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getProjects() {
  const res = await fetch(API, { headers: { ...authHeader() } });
  if (!res.ok) throw new Error(`GET /projects failed: ${res.status}`);
  return res.json();
}

export async function getProjectById(id) {
  const res = await fetch(`${API}/${id}`, { headers: { ...authHeader() } });
  if (!res.ok) throw new Error(`GET /projects/${id} failed: ${res.status}`);
  return res.json();
}

export async function createProject(payload) {
  const res = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(`POST /projects failed: ${res.status}`);
  return res.json();
}

export async function updateProject(id, payload) {
  const res = await fetch(`${API}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(`PUT /projects/${id} failed: ${res.status}`);
  return res.json();
}

export async function removeProject(id) {
  const res = await fetch(`${API}/${id}`, {
    method: "DELETE",
    headers: { ...authHeader() }
  });
  if (!res.ok) throw new Error(`DELETE /projects/${id} failed: ${res.status}`);
  return res.json();
}

export async function getSkills() {
  const res = await fetch("http://localhost:3000/skills", { headers: { ...authHeader() } });
  if (!res.ok) throw new Error(`GET /skills failed: ${res.status}`);
  return res.json();
}
