import { renderProjects, renderForm, showAlert, updateFilterDropdown } from "./projects.js";
import { getProjects, createProject, updateProject, removeProject, getProjectById, getSkills } from "./storage.js";

let state = { projects: [] };

function hasToken() { return !!localStorage.getItem("userToken"); }

function guard() {
  const app = document.getElementById("app-section");
  const login = document.getElementById("login-section");
  if (hasToken()) { app.classList.remove("d-none"); login.classList.add("d-none"); }
  else { app.classList.add("d-none"); login.classList.remove("d-none"); }
}

async function loadProjects() {
  state.projects = await getProjects();
  renderProjects(state.projects);
  updateFilterDropdown(state.projects);
}

async function route(path) {
  guard();
  if (!hasToken()) {
    history.replaceState({}, "", "/login");
    showAlert("danger", "Please log in to access projects");
    return;
  }

  if (path.startsWith("/add-task")) {
    renderForm({});
    wireFormHandlers(null);
    return;
  }

  if (path.startsWith("/edit-task/")) {
    const id = path.split("/edit-task/")[1];
    const model = await getProjectById(id);
    renderForm(model);
    wireFormHandlers(id);
    return;
  }

  await loadProjects();
}

function wireFormHandlers(editId) {
  const form = document.getElementById("project-form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = document.getElementById("title").value.trim();
    const description = document.getElementById("description").value.trim();
    const skills = document.getElementById("skills").value.split(",").map(s => s.trim()).filter(Boolean);

    if (!title || title.length > 50 || !/^[a-z0-9 ]+$/i.test(title)) return showAlert("danger", "Title must be alphanumeric and ≤ 50 chars");
    if (!description || description.length > 200) return showAlert("danger", "Description required and ≤ 200 chars");
    if (!skills.length) return showAlert("danger", "At least one skill is required");

    try {
      if (editId) {
        await updateProject(editId, { title, description, skills });
        showAlert("success", "Project updated successfully!");
      } else {
        await createProject({ title, description, skills });
        showAlert("success", "Project added successfully!");
      }
      history.pushState({}, "", "/tasks");
      await route("/tasks");
    } catch (e2) {
      showAlert("danger", `Save failed: ${e2.message}`);
    }
  });
}

export function initRouter() {
  document.body.addEventListener("click", (e) => {
    const a = e.target.closest("a.nav-link");
    if (a && a.getAttribute("href").startsWith("/")) {
      e.preventDefault();
      const path = a.getAttribute("href");
      history.pushState({}, "", path);
      route(path);
    }
  });

  window.addEventListener("navigate", (ev) => {
    const path = ev.detail.path;
    history.pushState({}, "", path);
    route(path);
  });

  window.addEventListener("popstate", () => route(location.pathname));

  window.addEventListener("delete-project", async (ev) => {
    try {
      await removeProject(ev.detail.id);
      showAlert("success", "Project deleted successfully!");
      await route("/tasks");
    } catch (e) {
      showAlert("danger", `Failed to delete: ${e.message}`);
    }
  });

  // filter
  const select = document.getElementById("skill-filter");
  if (select) {
    select.addEventListener("change", () => {
      const val = select.value.trim();
      const view = val ? state.projects.filter(p => (p.skills || []).includes(val)) : state.projects;
      renderProjects(view);
    });
  }

  // login button
  const loginBtn = document.getElementById("login-btn");
  if (loginBtn) {
    loginBtn.addEventListener("click", async () => {
      localStorage.setItem("userToken", "demo-token");
      showAlert("success", "Logged in successfully!");
      history.pushState({}, "", "/tasks");
      await route("/tasks");
    });
  }

  // initial route
  const initial = location.pathname === "/" ? "/tasks" : location.pathname;
  route(initial);
}
