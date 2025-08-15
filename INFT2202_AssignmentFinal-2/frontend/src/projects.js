import "bootstrap/dist/css/bootstrap.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "./styles.css";

import cardTpl from "./templates/projectCard.hbs";
import formTpl from "./templates/projectForm.hbs";


document.addEventListener("click", (e) => {
  const closeBtn = e.target.closest("[data-bs-dismiss='alert']");
  if (!closeBtn) return;
  const alertEl = closeBtn.closest(".alert");
  if (!alertEl) return;
  if (window.bootstrap?.Alert) {
    const inst = bootstrap.Alert.getOrCreateInstance(alertEl);
    inst.close();
  } else {
    alertEl.classList.remove("show");
    setTimeout(() => alertEl.remove(), 150);
  }
});

export function showAlert(type, message, timeoutMs = 3000) {
  const container = document.getElementById("alert-container");
  if (!container) return;

  const existing = container.querySelectorAll(".alert");
  if (existing.length >= 3) {
    existing[0].remove();
  }

  const box = document.createElement("div");
  box.className = `alert alert-${type} alert-dismissible fade show`;
  box.role = "alert";
  box.textContent = message;

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "btn-close";
  btn.setAttribute("data-bs-dismiss", "alert");
  btn.setAttribute("aria-label", "Close");
  box.appendChild(btn);

  container.appendChild(box);

  if (type !== "danger") {
    setTimeout(() => {
      if (window.bootstrap?.Alert) {
        const inst = bootstrap.Alert.getOrCreateInstance(box);
        inst.close();
      } else {
        box.classList.remove("show");
        setTimeout(() => box.remove(), 150);
      }
    }, timeoutMs);
  }
}

export function renderProjects(list) {
  const grid = document.getElementById("projects-container");
  if (!grid) return;

  grid.innerHTML = list
    .map(p => `<div class="col-12 col-md-6 col-lg-4">${cardTpl(p)}</div>`)
    .join("");

  // Delete
  grid.querySelectorAll("[data-del]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-del");
      if (!id) return;
      window.dispatchEvent(new CustomEvent("delete-project", { detail: { id } }));
    });
  });

  // Edit 
  grid.querySelectorAll("[data-edit]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-edit");
      if (!id) return;
      window.dispatchEvent(new CustomEvent("navigate", { detail: { path: `/edit-task/${id}` } }));
    });
  });
}

export function updateFilterDropdown(list) {
  const select = document.getElementById("skill-filter");
  if (!select) return;

  const uniqueSkills = Array.from(new Set(list.flatMap(p => p.skills || []))).sort();
  select.innerHTML =
    `<option value="">All</option>` +
    uniqueSkills.map(s => `<option value="${s}">${s}</option>`).join("");
}

export function renderForm(model = {}) {
  const container = document.getElementById("projects-container");
  if (!container) return;

  const viewModel = {
    ...model,
    skillsCsv: Array.isArray(model.skills) ? model.skills.join(", ") : ""
  };
  container.innerHTML = formTpl(viewModel);
}
