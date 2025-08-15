import {
  getProjects as fetchProjects,
  createProject as addProject,
  removeProject as deleteProject,
  getProjectById,
  updateProject
} from "./storage.js";

import {
  renderProjects,
  updateFilterDropdown,
  showAlert
} from "./projects.js";

// Element refs
const loginSection      = document.getElementById("login-section");
const loginBtn          = document.getElementById("login-btn");
const appSection        = document.getElementById("app-section");
const logoutBtn         = document.getElementById("logout-btn");
const form              = document.getElementById("project-form");
const filterEl =
  document.getElementById("skill-filter") ||
  document.getElementById("filter-dropdown");
const projectsContainer = document.getElementById("projects-container");

let allProjects = [];

document.addEventListener("DOMContentLoaded", initApp);

function hasToken() {
  return !!localStorage.getItem("userToken");
}

function guard() {
  if (hasToken()) {
    appSection?.classList.remove("d-none");
    loginSection?.classList.add("d-none");
  } else {
    appSection?.classList.add("d-none");
    loginSection?.classList.remove("d-none");
  }
}

async function initApp() {
  guard();

  // auth buttons
  loginBtn?.addEventListener("click", handleLogin);
  logoutBtn?.addEventListener("click", handleLogout);

  // form/filter
  form?.addEventListener("submit", handleFormSubmit);
  filterEl?.addEventListener("change", handleFilter);

  // Delete from card
  window.addEventListener("delete-project", async (ev) => {
    try {
      await deleteProject(ev.detail.id);
      showAlert("success", "Project deleted successfully!");
      await refresh();
    } catch (e) {
      showAlert("danger", `Failed to delete: ${e.message}`);
    }
  });

  // Edit from card
  window.addEventListener("navigate", async (ev) => {
    const path = ev.detail?.path || "";
    if (!path.startsWith("/edit-task/")) return;
    const id = path.split("/edit-task/")[1];

    if (!id || id.length < 12) {
      showAlert("danger", "Invalid project id");
      return;
    }

    try {
      const model = await getProjectById(id);
      prefillForm(model);
      form?.scrollIntoView({ behavior: "smooth", block: "center" });
      document.getElementById("title")?.focus();
    } catch (err) {
      showAlert("danger", `Failed to load project: ${err.message}`);
    }
  });

  // info alert every 10s
  setInterval(() => {
    showAlert("info", `You have ${allProjects.length} projects`);
  }, 10000);

  if (hasToken()) {
    await refresh();
  }
}

function handleLogin() {
  localStorage.setItem("userToken", "demo-token");
  showAlert("success", "Logged in successfully!");
  guard();
  refresh();
}

function handleLogout() {
  localStorage.removeItem("userToken");
  showAlert("success", "Logged out");
  guard(); 
  if (projectsContainer) projectsContainer.innerHTML = "";
  form?.reset();
}

async function refresh() {
  try {
    allProjects = await fetchProjects();
    renderProjects(allProjects);
    updateFilterDropdown(allProjects);
  } catch (err) {
    showAlert("danger", `Failed to load projects: ${err.message}`);
  }
}

async function handleFormSubmit(e) {
  e.preventDefault();

  const title       = document.getElementById("title")?.value.trim() || "";
  const description = document.getElementById("description")?.value.trim() || "";
  const skills      = (document.getElementById("skills")?.value || "")
    .split(",").map(s => s.trim()).filter(Boolean);

  const errors = [];
  if (!/^[a-zA-Z0-9 ]{1,50}$/.test(title)) {
    errors.push("Title must be alphanumeric (max 50 chars).");
  }
  if (!description || description.length > 200) {
    errors.push("Description is required (max 200 chars).");
  }
  if (skills.length === 0 || skills.some(s => !/^[a-zA-Z0-9]+$/.test(s))) {
    errors.push("Enter at least one comma-separated alphanumeric skill.");
  }
  if (errors.length) {
    errors.forEach(msg => showAlert("danger", msg));
    return;
  }

  const editId = form.getAttribute("data-edit-id");
  try {
    if (editId) {
      await updateProject(editId, { title, description, skills });
      showAlert("success", "Project updated");
      form.removeAttribute("data-edit-id");
      setSubmitLabel(false);
    } else {
      await addProject({ title, description, skills });
      showAlert("success", "Project added");
    }
    form.reset();
    await refresh();
  } catch (err) {
    showAlert("danger", `Failed to save project: ${err.message}`);
  }
}

async function handleFilter(e) {
  const selected = e.target.value;
  const view = selected
    ? allProjects.filter(p => (p.skills || []).includes(selected))
    : allProjects;
  renderProjects(view);
}

function prefillForm(model) {
  const t = document.getElementById("title");
  const d = document.getElementById("description");
  const s = document.getElementById("skills");
  if (!form || !t || !d || !s) return;

  form.setAttribute("data-edit-id", model._id);
  t.value = model.title || "";
  d.value = model.description || "";
  s.value = Array.isArray(model.skills) ? model.skills.join(", ") : "";
  setSubmitLabel(true);
}

function setSubmitLabel(isEdit) {
  const btn = form?.querySelector("button[type='submit']");
  if (!btn) return;
  btn.textContent = isEdit ? "Update Project" : "Add Project";
  btn.classList.toggle("btn-primary", isEdit);
  btn.classList.toggle("btn-success", !isEdit);
}
