const DATA_URL = "./data/tasks.json";
const STORAGE_KEY = "projects-management-0508-local-draft-v1";
const SOURCE_FILE_HINT = "projects-management-0508/data/tasks.json";

const tasksBody = document.getElementById("tasksBody");
const taskCount = document.getElementById("taskCount");
const lastUpdated = document.getElementById("lastUpdated");
const statusSummary = document.getElementById("statusSummary");
const dataSourceHint = document.getElementById("dataSourceHint");
const draftHint = document.getElementById("draftHint");
const newTaskBtn = document.getElementById("newTaskBtn");
const restoreBtn = document.getElementById("restoreBtn");
const exportBtn = document.getElementById("exportBtn");
const importInput = document.getElementById("importInput");
const clearDraftBtn = document.getElementById("clearDraftBtn");
const taskDialog = document.getElementById("taskDialog");
const closeDialogBtn = document.getElementById("closeDialogBtn");
const cancelDialogBtn = document.getElementById("cancelDialogBtn");
const taskForm = document.getElementById("taskForm");

let meta = {};
let tasks = [];
let repoSnapshot = null;
let usingLocalDraft = false;

function nowIso() {
  return new Date().toISOString();
}

function formatIsoForDisplay(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function textToHtml(value) {
  return escapeHtml(value || "-").replace(/\n/g, "<br>");
}

function slugify(value) {
  const base = String(value || "task")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "task";
}

function parseMaterialsText(text) {
  return String(text || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [labelPart, urlPart] = line.split("|");
      const label = (labelPart || "").trim();
      const url = (urlPart || "").trim();
      if (url) {
        return { label: label || url, url };
      }
      return { label: label || "material" };
    });
}

function materialsToHtml(materials) {
  if (!Array.isArray(materials) || materials.length === 0) {
    return "-";
  }

  return materials
    .map((item) => {
      if (!item) return "";
      if (typeof item === "string") {
        return `<div>${escapeHtml(item)}</div>`;
      }

      const label = escapeHtml(item.label || item.url || "material");
      const url = item.url ? String(item.url) : "";
      if (!url) {
        return `<div>${label}</div>`;
      }

      const safeUrl = escapeHtml(url);
      return `<div><a class="material-link" href="${safeUrl}" target="_blank" rel="noopener noreferrer">${label}</a></div>`;
    })
    .join("");
}

function statusClass(status) {
  return String(status || "").toLowerCase().replace(/\s+/g, "-");
}

function statusCountSummary() {
  const counter = new Map();
  tasks.forEach((task) => {
    const key = task.status || "Unknown";
    counter.set(key, (counter.get(key) || 0) + 1);
  });

  return Array.from(counter.entries())
    .map(([key, value]) => `${key}:${value}`)
    .join(" | ");
}

function render() {
  if (!Array.isArray(tasks) || tasks.length === 0) {
    tasksBody.innerHTML = `
      <tr>
        <td colspan="10">No tasks yet. Click <strong>New Task</strong> to create one.</td>
      </tr>
    `;
  } else {
    tasksBody.innerHTML = tasks
      .map((task) => {
        const tags = Array.isArray(task.tags) ? task.tags : [];
        const tagsHtml = tags.length
          ? tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")
          : "-";

        return `
          <tr data-id="${escapeHtml(task.id || "")}">
            <td><div class="col-name">${escapeHtml(task.projectName || "Untitled")}</div><div>${escapeHtml(task.id || "")}</div></td>
            <td>${escapeHtml(task.discoveryDate || "-")}</td>
            <td><span class="badge ${statusClass(task.status)}">${escapeHtml(task.status || "-")}</span></td>
            <td>${textToHtml(task.statusReason)}</td>
            <td>${textToHtml(task.ideas)}</td>
            <td>${textToHtml(task.notes)}</td>
            <td>${materialsToHtml(task.materials)}</td>
            <td>${escapeHtml(task.assignedResearcher || "-")}</td>
            <td>${tagsHtml}</td>
            <td>
              <button class="btn delete-btn" type="button" data-action="delete" data-id="${escapeHtml(task.id || "")}">Delete</button>
            </td>
          </tr>
        `;
      })
      .join("");
  }

  taskCount.textContent = `${tasks.length} tasks`;
  lastUpdated.textContent = `updated: ${formatIsoForDisplay(meta.updatedAt)}`;
  statusSummary.textContent = `status: ${statusCountSummary() || "-"}`;
  dataSourceHint.textContent = `Source file: ${SOURCE_FILE_HINT}`;
  draftHint.textContent = usingLocalDraft
    ? "Draft mode: loaded from local browser cache"
    : "Draft mode: repository baseline";
}

function persistDraft() {
  usingLocalDraft = true;
  meta.updatedAt = nowIso();
  const payload = {
    meta,
    tasks,
    localSavedAt: nowIso()
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  render();
}

function loadLocalDraft() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return false;

  try {
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.tasks)) {
      return false;
    }
    meta = parsed.meta || {};
    tasks = parsed.tasks;
    usingLocalDraft = true;
    return true;
  } catch (error) {
    console.error("Failed to parse local draft:", error);
    return false;
  }
}

async function loadRepoData() {
  const response = await fetch(DATA_URL, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to load ${DATA_URL}: ${response.status}`);
  }

  const parsed = await response.json();
  if (!parsed || !Array.isArray(parsed.tasks)) {
    throw new Error("Invalid data file: tasks array is required.");
  }

  repoSnapshot = parsed;
  if (!loadLocalDraft()) {
    meta = parsed.meta || {};
    tasks = parsed.tasks;
    usingLocalDraft = false;
  }
}

function resetToRepoData() {
  if (!repoSnapshot) return;
  localStorage.removeItem(STORAGE_KEY);
  meta = JSON.parse(JSON.stringify(repoSnapshot.meta || {}));
  tasks = JSON.parse(JSON.stringify(repoSnapshot.tasks || []));
  usingLocalDraft = false;
  render();
}

function parseImportedPayload(text) {
  const parsed = JSON.parse(text);
  if (!parsed || !Array.isArray(parsed.tasks)) {
    throw new Error("Imported JSON must contain a top-level 'tasks' array.");
  }
  return {
    meta: parsed.meta || {},
    tasks: parsed.tasks
  };
}

function downloadJson(filename, payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function createTaskFromForm() {
  const formData = new FormData(taskForm);
  const projectName = String(formData.get("projectName") || "").trim();
  if (!projectName) {
    throw new Error("Project name is required.");
  }

  const timestamp = Date.now().toString(36);
  const id = `${slugify(projectName)}-${timestamp}`;
  const now = nowIso();

  return {
    id,
    projectName,
    discoveryDate: String(formData.get("discoveryDate") || "").trim(),
    status: String(formData.get("status") || "In Progress").trim(),
    statusReason: String(formData.get("statusReason") || "").trim(),
    ideas: String(formData.get("ideas") || "").trim(),
    notes: String(formData.get("notes") || "").trim(),
    materials: parseMaterialsText(formData.get("materialsText")),
    assignedResearcher: String(formData.get("assignedResearcher") || "").trim(),
    tags: String(formData.get("tags") || "")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    createdAt: now,
    updatedAt: now
  };
}

function attachEvents() {
  newTaskBtn.addEventListener("click", () => {
    if (typeof taskDialog.showModal === "function") {
      taskDialog.showModal();
    }
  });

  closeDialogBtn.addEventListener("click", () => taskDialog.close());
  cancelDialogBtn.addEventListener("click", () => taskDialog.close());

  taskForm.addEventListener("submit", (event) => {
    event.preventDefault();

    try {
      const newTask = createTaskFromForm();
      tasks.unshift(newTask);
      persistDraft();
      taskDialog.close();
      taskForm.reset();
    } catch (error) {
      alert(error.message);
    }
  });

  tasksBody.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    if (target.dataset.action === "delete") {
      const id = target.dataset.id;
      if (!id) return;

      const confirmed = window.confirm(`Delete task '${id}'?`);
      if (!confirmed) return;

      tasks = tasks.filter((task) => task.id !== id);
      persistDraft();
    }
  });

  restoreBtn.addEventListener("click", () => {
    const confirmed = window.confirm("Discard local draft and restore repository version?");
    if (!confirmed) return;
    resetToRepoData();
  });

  clearDraftBtn.addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEY);
    usingLocalDraft = false;
    render();
  });

  exportBtn.addEventListener("click", () => {
    const exportPayload = {
      meta: {
        ...meta,
        sourceFile: SOURCE_FILE_HINT,
        updatedAt: nowIso()
      },
      tasks
    };
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    downloadJson(`tasks-export-${stamp}.json`, exportPayload);
  });

  importInput.addEventListener("change", async (event) => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) return;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];

    try {
      const text = await file.text();
      const imported = parseImportedPayload(text);
      meta = imported.meta;
      tasks = imported.tasks;
      persistDraft();
    } catch (error) {
      alert(`Failed to import JSON: ${error.message}`);
    } finally {
      input.value = "";
    }
  });
}

async function init() {
  try {
    await loadRepoData();
    attachEvents();
    render();
  } catch (error) {
    console.error(error);
    tasksBody.innerHTML = `
      <tr>
        <td colspan="10">Failed to initialize board: ${escapeHtml(error.message)}</td>
      </tr>
    `;
  }
}

init();
