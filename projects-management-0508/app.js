const DATA_URL = "./data/tasks.json";
const PROFILE_URL = "./config/journal_profiles.json";
const STORAGE_KEY = "projects-management-0508-local-draft-v1";
const GITHUB_TARGET_KEY = "projects-management-0508-github-target-v1";
const SOURCE_FILE_HINT = "projects-management-0508/data/tasks.json";
const GITHUB_API_VERSION = "2022-11-28";
const DEFAULT_JOURNAL = "PRD";
const DONE_FORMULA = "DONE(PR)=G_eng ∧ G_journal ∧ G_science ∧ G_packaging";
const DONE_GROUP_ORDER = ["eng", "journal", "science", "packaging"];

const FALLBACK_PROFILES = {
  version: 1,
  groups: {
    eng: "G_eng",
    journal: "G_journal",
    science: "G_science",
    packaging: "G_packaging"
  },
  journals: {
    PRD: {
      displayName: "Physical Review D",
      skeleton: ["Introduction", "Methods", "Results", "Discussion", "Conclusions"],
      artifacts: ["main.pdf", "source.tar.gz", "figures", "data_availability.md"],
      gates: {
        eng: [
          { key: "compile", label: "latexmk -pdf passes" },
          { key: "refs_clean", label: "No undefined references" }
        ],
        journal: [
          { key: "title_sentence_case", label: "Title uses sentence case" },
          { key: "abstract_lt_500_words", label: "Abstract < 500 words" }
        ],
        science: [
          { key: "claims_evidence_trace", label: "Claims map to explicit evidence" },
          { key: "scope_limits", label: "Applicability domain and limits stated" }
        ],
        packaging: [
          { key: "main_pdf", label: "main.pdf generated" },
          { key: "source_tarball", label: "source.tar.gz generated" }
        ]
      }
    }
  }
};

const tasksBoard = document.getElementById("tasksBoard");
const emptyState = document.getElementById("emptyState");
const taskCount = document.getElementById("taskCount");
const lastUpdated = document.getElementById("lastUpdated");
const statusSummary = document.getElementById("statusSummary");
const githubSaveStatus = document.getElementById("githubSaveStatus");
const dataSourceHint = document.getElementById("dataSourceHint");
const draftHint = document.getElementById("draftHint");
const newTaskBtn = document.getElementById("newTaskBtn");
const restoreBtn = document.getElementById("restoreBtn");
const exportBtn = document.getElementById("exportBtn");
const importInput = document.getElementById("importInput");
const saveGithubBtn = document.getElementById("saveGithubBtn");
const clearDraftBtn = document.getElementById("clearDraftBtn");
const taskDialog = document.getElementById("taskDialog");
const closeDialogBtn = document.getElementById("closeDialogBtn");
const cancelDialogBtn = document.getElementById("cancelDialogBtn");
const taskForm = document.getElementById("taskForm");
const githubSaveDialog = document.getElementById("githubSaveDialog");
const githubSaveForm = document.getElementById("githubSaveForm");
const closeSaveDialogBtn = document.getElementById("closeSaveDialogBtn");
const cancelSaveDialogBtn = document.getElementById("cancelSaveDialogBtn");
const pushGithubBtn = document.getElementById("pushGithubBtn");
const githubSaveResult = document.getElementById("githubSaveResult");

let meta = {};
let tasks = [];
let repoSnapshot = null;
let usingLocalDraft = false;
let githubStatusText = "not saved";
let profileData = FALLBACK_PROFILES;

function nowIso() {
  return new Date().toISOString();
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
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
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function contentHtml(value, placeholder = "—") {
  const text = String(value ?? "").trim();
  if (!text) {
    return `<span class="placeholder">${escapeHtml(placeholder)}</span>`;
  }
  return escapeHtml(text).replace(/\n/g, "<br>");
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

function journalCodes() {
  return Object.keys(profileData.journals || {});
}

function getGroupAlias(group) {
  return (profileData.groups && profileData.groups[group]) || `G_${group}`;
}

function isKnownJournal(code) {
  return Boolean(profileData.journals && profileData.journals[code]);
}

function getJournalCode(code) {
  if (isKnownJournal(code)) return code;
  if (isKnownJournal(DEFAULT_JOURNAL)) return DEFAULT_JOURNAL;
  const codes = journalCodes();
  return codes.length > 0 ? codes[0] : DEFAULT_JOURNAL;
}

function getProfile(code) {
  return profileData.journals[getJournalCode(code)] || null;
}

function gateItemsFor(journalCode, group) {
  const profile = getProfile(journalCode);
  if (!profile || !profile.gates || !Array.isArray(profile.gates[group])) {
    return [];
  }
  return profile.gates[group];
}

function createDoneTemplate(journalCode) {
  const template = {
    eng: {},
    journal: {},
    science: {},
    packaging: {}
  };

  DONE_GROUP_ORDER.forEach((group) => {
    gateItemsFor(journalCode, group).forEach((item) => {
      template[group][item.key] = false;
    });
  });

  return template;
}

function normalizeDone(done, journalCode) {
  const template = createDoneTemplate(journalCode);
  const source = done && typeof done === "object" ? done : {};

  DONE_GROUP_ORDER.forEach((group) => {
    const sourceGroup = source[group] && typeof source[group] === "object" ? source[group] : {};
    const normalizedGroup = {};

    Object.keys(template[group]).forEach((key) => {
      normalizedGroup[key] = Boolean(sourceGroup[key]);
    });

    Object.entries(sourceGroup).forEach(([key, value]) => {
      if (!(key in normalizedGroup)) {
        normalizedGroup[key] = Boolean(value);
      }
    });

    template[group] = normalizedGroup;
  });

  return template;
}

function normalizeTask(task) {
  const journal = getJournalCode(task.targetJournal);
  return {
    ...task,
    targetJournal: journal,
    materials: Array.isArray(task.materials) ? task.materials : [],
    tags: Array.isArray(task.tags) ? task.tags : [],
    done: normalizeDone(task.done, journal)
  };
}

function normalizeTasks(inputTasks) {
  return (Array.isArray(inputTasks) ? inputTasks : []).map((task) => normalizeTask(task));
}

function computeGroupProgress(task, group) {
  const items = gateItemsFor(task.targetJournal, group);
  const total = items.length;
  const completed = items.filter((item) => Boolean(task.done && task.done[group] && task.done[group][item.key])).length;
  return {
    total,
    completed,
    ratio: total === 0 ? 1 : completed / total
  };
}

function computeDoneProgress(task) {
  const summary = {
    total: 0,
    completed: 0,
    ratio: 0,
    byGroup: {}
  };

  DONE_GROUP_ORDER.forEach((group) => {
    const stats = computeGroupProgress(task, group);
    summary.byGroup[group] = stats;
    summary.total += stats.total;
    summary.completed += stats.completed;
  });

  summary.ratio = summary.total === 0 ? 1 : summary.completed / summary.total;
  return summary;
}

function materialsToHtml(materials) {
  if (!Array.isArray(materials) || materials.length === 0) {
    return `<span class="placeholder">—</span>`;
  }

  return materials
    .map((item) => {
      if (!item) return "";
      if (typeof item === "string") {
        return `<span class="material-link is-static">${escapeHtml(item)}</span>`;
      }

      const label = escapeHtml(item.label || item.url || "material");
      const url = item.url ? String(item.url) : "";
      if (!url) {
        return `<span class="material-link is-static">${label}</span>`;
      }

      const safeUrl = escapeHtml(url);
      return `<a class="material-link" href="${safeUrl}" target="_blank" rel="noopener noreferrer">${label}</a>`;
    })
    .join("");
}

function renderJournalOptions(selected) {
  return journalCodes()
    .map((code) => {
      const profile = getProfile(code);
      const isSelected = code === selected ? "selected" : "";
      return `<option value="${escapeHtml(code)}" ${isSelected}>${escapeHtml(code)} · ${escapeHtml(profile.displayName || code)}</option>`;
    })
    .join("");
}

function renderGateGroup(task, group, stats) {
  const alias = getGroupAlias(group);
  const items = gateItemsFor(task.targetJournal, group);
  const itemsHtml = items
    .map((item) => {
      const checked = Boolean(task.done && task.done[group] && task.done[group][item.key]);
      return `
        <label class="gate-item">
          <input
            type="checkbox"
            data-action="toggle-gate"
            data-id="${escapeHtml(task.id || "")}" 
            data-group="${escapeHtml(group)}"
            data-key="${escapeHtml(item.key)}"
            ${checked ? "checked" : ""}
          >
          <span>${escapeHtml(item.label)}</span>
        </label>
      `;
    })
    .join("");

  return `
    <section class="gate-group">
      <div class="gate-head">
        <span class="gate-title">${escapeHtml(alias)}</span>
        <span class="gate-count">${stats.completed}/${stats.total}</span>
      </div>
      <div class="gate-list">
        ${itemsHtml || `<span class="placeholder">No gate configured.</span>`}
      </div>
    </section>
  `;
}

function renderJournalGuidance(task) {
  const profile = getProfile(task.targetJournal);
  if (!profile) return "";

  const skeletonHtml = (Array.isArray(profile.skeleton) ? profile.skeleton : [])
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("");
  const artifactsHtml = (Array.isArray(profile.artifacts) ? profile.artifacts : [])
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("");

  return `
    <details class="journal-details">
      <summary>Journal profile: ${escapeHtml(task.targetJournal)} · ${escapeHtml(profile.displayName || "")}</summary>
      <div class="journal-hints">
        <div>
          <strong>Structure skeleton</strong>
          <ul>${skeletonHtml || "<li>—</li>"}</ul>
        </div>
        <div>
          <strong>Submission artifacts</strong>
          <ul>${artifactsHtml || "<li>—</li>"}</ul>
        </div>
      </div>
    </details>
  `;
}

function render() {
  if (!Array.isArray(tasks) || tasks.length === 0) {
    tasksBoard.innerHTML = "";
    emptyState.hidden = false;
  } else {
    emptyState.hidden = true;
    tasksBoard.innerHTML = tasks
      .map((task) => {
        const tags = Array.isArray(task.tags) ? task.tags : [];
        const tagsHtml = tags.length
          ? tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")
          : `<span class="tag">untagged</span>`;

        const done = computeDoneProgress(task);
        const donePct = Math.round(done.ratio * 100);
        const doneState = done.total > 0 && done.completed === done.total ? "submission-ready" : "in-progress";
        const discovery = task.discoveryDate ? escapeHtml(task.discoveryDate) : "Not set";
        const assigned = task.assignedResearcher ? escapeHtml(task.assignedResearcher) : "Unassigned";

        return `
          <article class="project-card" data-id="${escapeHtml(task.id || "")}">
            <div class="card-top">
              <div>
                <h3 class="project-title">${escapeHtml(task.projectName || "Untitled Project")}</h3>
                <p class="project-id">${escapeHtml(task.id || "-")}</p>
              </div>
              <div class="card-actions">
                <span class="chip status ${statusClass(task.status)}">${escapeHtml(task.status || "Backlog")}</span>
                <span class="chip person">${assigned}</span>
                <button class="btn delete-btn" type="button" data-action="delete" data-id="${escapeHtml(task.id || "")}">Delete</button>
              </div>
            </div>

            <div class="card-meta">
              <div class="meta-item">
                <div class="meta-label">Discovery Date</div>
                <div class="meta-value">${discovery}</div>
              </div>
              <div class="meta-item">
                <div class="meta-label">Status Reason</div>
                <div class="meta-value">${contentHtml(task.statusReason)}</div>
              </div>
              <div class="meta-item">
                <div class="meta-label">Materials</div>
                <div class="material-list">${materialsToHtml(task.materials)}</div>
              </div>
            </div>

            <div class="card-sections">
              <section class="section-block">
                <div class="section-label">Ideas</div>
                <div class="section-content">${contentHtml(task.ideas)}</div>
              </section>
              <section class="section-block">
                <div class="section-label">Notes</div>
                <div class="section-content">${contentHtml(task.notes)}</div>
              </section>
            </div>

            <section class="done-contract">
              <div class="done-head">
                <div>
                  <div class="done-title">DONE Contract</div>
                  <div class="done-formula">${escapeHtml(DONE_FORMULA)}</div>
                </div>
                <div class="done-stats ${doneState}">${done.completed}/${done.total} · ${donePct}%</div>
              </div>
              <div class="done-bar"><span style="width:${donePct}%"></span></div>

              <div class="journal-picker">
                <label>
                  <span>target_journal</span>
                  <select data-action="set-journal" data-id="${escapeHtml(task.id || "")}">
                    ${renderJournalOptions(task.targetJournal)}
                  </select>
                </label>
              </div>

              <div class="gate-grid">
                ${DONE_GROUP_ORDER.map((group) => renderGateGroup(task, group, done.byGroup[group])).join("")}
              </div>
              ${renderJournalGuidance(task)}
            </section>

            <div class="tag-group">${tagsHtml}</div>

            <div class="card-footer">
              <span>Created: ${formatIsoForDisplay(task.createdAt || "")}</span>
              <span>Updated: ${formatIsoForDisplay(task.updatedAt || "")}</span>
            </div>
          </article>
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

  if (githubSaveStatus) {
    githubSaveStatus.textContent = `github: ${githubStatusText}`;
  }
}

function setTaskUpdated(task) {
  task.updatedAt = nowIso();
  meta.updatedAt = nowIso();
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
    tasks = normalizeTasks(parsed.tasks);
    usingLocalDraft = true;
    return true;
  } catch (error) {
    console.error("Failed to parse local draft:", error);
    return false;
  }
}

async function loadJournalProfiles() {
  try {
    const response = await fetch(PROFILE_URL, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Failed to load ${PROFILE_URL}: ${response.status}`);
    }

    const parsed = await response.json();
    if (!parsed || !parsed.journals || typeof parsed.journals !== "object") {
      throw new Error("Invalid journal profile file.");
    }

    profileData = parsed;
  } catch (error) {
    console.warn("Using fallback journal profiles:", error);
    profileData = FALLBACK_PROFILES;
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

  repoSnapshot = {
    meta: parsed.meta || {},
    tasks: normalizeTasks(parsed.tasks)
  };

  if (!loadLocalDraft()) {
    meta = deepClone(repoSnapshot.meta || {});
    tasks = deepClone(repoSnapshot.tasks || []);
    usingLocalDraft = false;
  }
}

function resetToRepoData() {
  if (!repoSnapshot) return;
  localStorage.removeItem(STORAGE_KEY);
  meta = deepClone(repoSnapshot.meta || {});
  tasks = deepClone(repoSnapshot.tasks || []);
  usingLocalDraft = false;
  githubStatusText = "restored repository baseline";
  render();
}

function parseImportedPayload(text) {
  const parsed = JSON.parse(text);
  if (!parsed || !Array.isArray(parsed.tasks)) {
    throw new Error("Imported JSON must contain a top-level 'tasks' array.");
  }
  return {
    meta: parsed.meta || {},
    tasks: normalizeTasks(parsed.tasks)
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

  const targetJournal = getJournalCode(String(formData.get("targetJournal") || DEFAULT_JOURNAL).trim());
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
    targetJournal,
    done: createDoneTemplate(targetJournal),
    createdAt: now,
    updatedAt: now
  };
}

function inferDefaultOwner() {
  const host = window.location.hostname || "";
  const suffix = ".github.io";
  if (host.endsWith(suffix)) {
    return host.slice(0, -suffix.length);
  }
  return "";
}

function inferDefaultRepo(owner) {
  return owner ? `${owner}.github.io` : "";
}

function loadGitHubTargetConfig() {
  const owner = inferDefaultOwner();
  const defaults = {
    owner,
    repo: inferDefaultRepo(owner),
    branch: "main",
    path: SOURCE_FILE_HINT,
    message: "chore(projects-management-0508): update tasks board"
  };

  const raw = localStorage.getItem(GITHUB_TARGET_KEY);
  if (!raw) return defaults;

  try {
    const parsed = JSON.parse(raw);
    return {
      owner: parsed.owner || defaults.owner,
      repo: parsed.repo || defaults.repo,
      branch: parsed.branch || defaults.branch,
      path: parsed.path || defaults.path,
      message: parsed.message || defaults.message
    };
  } catch (_error) {
    return defaults;
  }
}

function persistGitHubTargetConfig(config) {
  const safeConfig = {
    owner: config.owner,
    repo: config.repo,
    branch: config.branch,
    path: config.path,
    message: config.message
  };
  localStorage.setItem(GITHUB_TARGET_KEY, JSON.stringify(safeConfig));
}

function setGitHubFormDefaults() {
  const target = loadGitHubTargetConfig();
  githubSaveForm.elements.owner.value = target.owner || "";
  githubSaveForm.elements.repo.value = target.repo || "";
  githubSaveForm.elements.branch.value = target.branch || "main";
  githubSaveForm.elements.path.value = target.path || SOURCE_FILE_HINT;
  githubSaveForm.elements.message.value = target.message || "chore(projects-management-0508): update tasks board";
  githubSaveForm.elements.token.value = "";
}

function setGitHubSaveResult(message, kind = "") {
  githubSaveResult.textContent = message;
  githubSaveResult.className = kind ? `save-result ${kind}` : "save-result";
}

function buildRepoPayload() {
  return {
    meta: {
      ...meta,
      sourceFile: SOURCE_FILE_HINT,
      doneContract: meta.doneContract || DONE_FORMULA,
      updatedAt: nowIso()
    },
    tasks: deepClone(normalizeTasks(tasks))
  };
}

function encodeGitHubPath(path) {
  return String(path || "")
    .replace(/^\/+/, "")
    .split("/")
    .filter(Boolean)
    .map((part) => encodeURIComponent(part))
    .join("/");
}

function utf8ToBase64(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

async function parseGitHubError(response) {
  const fallback = `GitHub API error: HTTP ${response.status}`;
  try {
    const body = await response.json();
    if (!body || !body.message) return fallback;

    if (Array.isArray(body.errors) && body.errors.length > 0) {
      const first = body.errors[0];
      if (typeof first === "string") {
        return `${body.message}: ${first}`;
      }
      if (first && typeof first === "object" && first.message) {
        return `${body.message}: ${first.message}`;
      }
    }

    return body.message;
  } catch (_error) {
    return fallback;
  }
}

async function pushTasksJsonToGitHub(target) {
  const owner = String(target.owner || "").trim();
  const repo = String(target.repo || "").trim();
  const branch = String(target.branch || "main").trim();
  const path = String(target.path || "").trim();
  const message = String(target.message || "update tasks").trim();
  const token = String(target.token || "").trim();

  if (!owner || !repo || !branch || !path || !message || !token) {
    throw new Error("Owner, repo, branch, path, message and token are all required.");
  }

  const encodedPath = encodeGitHubPath(path);
  if (!encodedPath) {
    throw new Error("Invalid path.");
  }

  const apiUrl = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encodedPath}`;
  const baseHeaders = {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": GITHUB_API_VERSION
  };

  const getResp = await fetch(`${apiUrl}?ref=${encodeURIComponent(branch)}`, {
    method: "GET",
    headers: baseHeaders
  });

  let remoteSha;
  if (getResp.status === 404) {
    remoteSha = undefined;
  } else if (getResp.ok) {
    const data = await getResp.json();
    remoteSha = data.sha;
  } else {
    throw new Error(await parseGitHubError(getResp));
  }

  const payload = buildRepoPayload();
  const content = utf8ToBase64(`${JSON.stringify(payload, null, 2)}\n`);
  const putBody = {
    message,
    content,
    branch
  };

  if (remoteSha) {
    putBody.sha = remoteSha;
  }

  const putResp = await fetch(apiUrl, {
    method: "PUT",
    headers: {
      ...baseHeaders,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(putBody)
  });

  if (!putResp.ok) {
    throw new Error(await parseGitHubError(putResp));
  }

  const result = await putResp.json();
  return {
    payload,
    commitUrl: result.commit && result.commit.html_url ? result.commit.html_url : ""
  };
}

function openGitHubSaveDialog() {
  setGitHubFormDefaults();
  setGitHubSaveResult("", "");
  if (typeof githubSaveDialog.showModal === "function") {
    githubSaveDialog.showModal();
  }
}

function changeTargetJournal(taskId, targetJournal) {
  const nextJournal = getJournalCode(targetJournal);
  const task = tasks.find((item) => item.id === taskId);
  if (!task) return;

  task.targetJournal = nextJournal;
  task.done = normalizeDone(task.done, nextJournal);
  setTaskUpdated(task);
  persistDraft();
}

function toggleGate(taskId, group, key, checked) {
  const task = tasks.find((item) => item.id === taskId);
  if (!task) return;

  if (!task.done || typeof task.done !== "object") {
    task.done = createDoneTemplate(task.targetJournal);
  }
  if (!task.done[group] || typeof task.done[group] !== "object") {
    task.done[group] = {};
  }

  task.done[group][key] = Boolean(checked);
  setTaskUpdated(task);
  persistDraft();
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
      taskForm.elements.targetJournal.value = DEFAULT_JOURNAL;
    } catch (error) {
      alert(error.message);
    }
  });

  tasksBoard.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    if (target.dataset.action === "delete") {
      const id = target.dataset.id;
      if (!id) return;

      const confirmed = window.confirm(`Delete task '${id}'?`);
      if (!confirmed) return;

      tasks = tasks.filter((task) => task.id !== id);
      meta.updatedAt = nowIso();
      persistDraft();
    }
  });

  tasksBoard.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    if (target.dataset.action === "set-journal" && target instanceof HTMLSelectElement) {
      const id = target.dataset.id;
      if (!id) return;
      changeTargetJournal(id, target.value);
      return;
    }

    if (target.dataset.action === "toggle-gate" && target instanceof HTMLInputElement) {
      const id = target.dataset.id;
      const group = target.dataset.group;
      const key = target.dataset.key;
      if (!id || !group || !key) return;
      toggleGate(id, group, key, target.checked);
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
    githubStatusText = "local draft cleared";
    render();
  });

  exportBtn.addEventListener("click", () => {
    const exportPayload = buildRepoPayload();
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

  saveGithubBtn.addEventListener("click", () => {
    openGitHubSaveDialog();
  });

  closeSaveDialogBtn.addEventListener("click", () => {
    githubSaveDialog.close();
  });

  cancelSaveDialogBtn.addEventListener("click", () => {
    githubSaveDialog.close();
  });

  githubSaveForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(githubSaveForm);
    const target = {
      owner: String(formData.get("owner") || "").trim(),
      repo: String(formData.get("repo") || "").trim(),
      branch: String(formData.get("branch") || "main").trim(),
      path: String(formData.get("path") || SOURCE_FILE_HINT).trim(),
      message: String(formData.get("message") || "chore: update tasks").trim(),
      token: String(formData.get("token") || "").trim()
    };

    pushGithubBtn.disabled = true;
    saveGithubBtn.disabled = true;
    setGitHubSaveResult("Saving to GitHub...", "");

    try {
      const result = await pushTasksJsonToGitHub(target);
      persistGitHubTargetConfig(target);

      repoSnapshot = deepClone(result.payload);
      meta = deepClone(result.payload.meta);
      tasks = deepClone(result.payload.tasks);
      usingLocalDraft = false;
      localStorage.removeItem(STORAGE_KEY);

      const displayTime = new Date().toLocaleTimeString();
      githubStatusText = `saved at ${displayTime}`;
      render();

      const commitHint = result.commitUrl ? ` Commit: ${result.commitUrl}` : "";
      setGitHubSaveResult(`Saved successfully.${commitHint}`, "success");
      githubSaveForm.elements.token.value = "";
    } catch (error) {
      githubStatusText = `save failed at ${new Date().toLocaleTimeString()}`;
      render();
      setGitHubSaveResult(`Save failed: ${error.message}`, "error");
    } finally {
      githubSaveForm.elements.token.value = "";
      pushGithubBtn.disabled = false;
      saveGithubBtn.disabled = false;
    }
  });
}

async function init() {
  try {
    await loadJournalProfiles();
    await loadRepoData();
    if (!meta.doneContract) {
      meta.doneContract = DONE_FORMULA;
    }
    attachEvents();
    render();
  } catch (error) {
    console.error(error);
    tasksBoard.innerHTML = `<article class="project-card"><div class="section-content">Failed to initialize board: ${escapeHtml(error.message)}</div></article>`;
    emptyState.hidden = true;
  }
}

init();
