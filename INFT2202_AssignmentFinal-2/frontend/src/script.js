import {
  getProjects,
  createProject,
  removeProject,
  getProjectById,
  updateProject
} from "./storage.js";

import {
  renderProjects,
  updateFilterDropdown,
  showAlert
} from "./projects.js";

let allProjects = [];

document.addEventListener("DOMContentLoaded", init);

function hasToken() {
  return !!localStorage.getItem("userToken");
}

function guard() {
  const app = document.getElementById("app-section");
  const login = document.getElementById("login-section");
  if (hasToken()) {
    app.classList.remove("d-none");
    login.classList.add("d-none");
  } else {
    app.classList.add("d-none");
    login.classList.remove("d-none");
  }
}

async function init() {
  wireLogin();
  wireForm();
  wireFilter();
  wireDeleteBus();
  wireNav();        
  wirePopstate();   

  guard();

  // Info alert every 10s
  setInterval(() => {
    showAlert("info", `You have ${allProjects.length} projects`);
  }, 10000);

  // initial route
  const initial = location.pathname === "/" ? "/tasks" : location.pathname;
  navigate(initial, { replace: true });
}

// --- routing ---
function wireNav() {
  document.body.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (a && a.getAttribute("href") && a.getAttribute("href").startsWith("/")) {
      e.preventDefault();
      const path = a.getAttribute("href");
      navigate(path);
    }
  });

  window.addEventListener("navigate", (ev) => {
    const path = ev.detail?.path || "/tasks";
    navigate(path);
  });
}

function wirePopstate() {
  window.addEventListener("popstate", () => handleRoute(location.pathname));
}

function navigate(path, opts = {}) {
  if (opts.replace) history.replaceState({}, "", path);
  else history.pushState({}, "", path);
  handleRoute(path);
}

async function handleRoute(path) {
  guard();
  if (!hasToken()) {
    history.replaceState({}, "", "/login");
    showAlert("danger", "Please log in to access projects");
    return;
  }

  if (path.startsWith("/add-task")) {
    // clear form for create
    setFormModel(null);
    return;
  }

  if (path.startsWith("/edit-task/")) {
    const id = path.split("/edit-task/")[1];
    try {
      const model = await getProjectById(id);
      setFormModel(model); 
    } catch (err) {
      showAlert("danger", `Failed to load project: ${err.message}`);
      navigate("/tasks");
    }
    return;
  }

  // default: /tasks
  await refresh();
}

async function refresh() {
  try {
    allProjects = await getProjects();
    renderProjects(allProjects);
    updateFilterDropdown(allProjects);
  } catch (e) {
    showAlert("danger", `Failed to load projects: ${e.message}`);
  }
}

function wireLogin() {
  const btn = document.getElementById("login-btn");
  if (!btn) return;

  btn.addEventListener("click", async () => {
    localStorage.setItem("userToken", "demo-token"); // simulated auth
    showAlert("success", "Logged in successfully!");
    guard();
    await refresh();
    navigate("/tasks");
  });
}

function wireFilter() {
  const select = document.getElementById("skill-filter");
  if (!select) return;
  select.addEventListener("change", () => {
    const val = select.value.trim();
    const view = val ? allProjects.filter(p => (p.skills || []).includes(val)) : allProjects;
    renderProjects(view);
  });
}

function wireForm() {
  const form = document.getElementById("project-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const title = document.getElementById("title").value.trim();
    const description = document.getElementById("description").value.trim();
    const skills = document.getElementById("skills").value
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);

    if (!title || title.length > 50 || !/^[a-z0-9 ]+$/i.test(title)) {
      return showAlert("danger", "Project title must be alphanumeric and ≤ 50 chars");
    }
    if (!description || description.length > 200) {
      return showAlert("danger", "Description required and ≤ 200 chars");
    }
    if (!skills.length) {
      return showAlert("danger", "At least one skill is required");
    }

    const editId = form.getAttribute("data-edit-id");

    try {
      if (editId) {
        await updateProject(editId, { title, description, skills });
        showAlert("success", "Project updated successfully!");
      } else {
        await createProject({ title, description, skills });
        showAlert("success", "Project added successfully!");
      }
      form.reset();
      form.removeAttribute("data-edit-id");
      setSubmitLabel(false);
      await refresh();
      navigate("/tasks");
    } catch (err) {
      showAlert("danger", `Failed to save project: ${err.message}`);
    }
  });
}

function setFormModel(model) {
  const form = document.getElementById("project-form");
  const t = document.getElementById("title");
  const d = document.getElementById("description");
  const s = document.getElementById("skills");

  if (!form || !t || !d || !s) return;

  if (model && model._id) {
    form.setAttribute("data-edit-id", model._id);
    t.value = model.title || "";
    d.value = model.description || "";
    s.value = Array.isArray(model.skills) ? model.skills.join(", ") : "";
    setSubmitLabel(true);
  } else {
    form.removeAttribute("data-edit-id");
    t.value = "";
    d.value = "";
    s.value = "";
    setSubmitLabel(false);
  }
}

function setSubmitLabel(isEdit) {
  const btn = document.querySelector("#project-form button[type='submit']");
  if (!btn) return;
  btn.textContent = isEdit ? "Update Project" : "Add Project";
  btn.classList.toggle("btn-primary", isEdit);
  btn.classList.toggle("btn-success", !isEdit);
}

function wireDeleteBus() {
  window.addEventListener("delete-project", async (ev) => {
    try {
      await removeProject(ev.detail.id);
      showAlert("success", "Project deleted successfully!");
      await refresh();
    } catch (e) {
      showAlert("danger", `Failed to delete: ${e.message}`);
    }
  });
}
