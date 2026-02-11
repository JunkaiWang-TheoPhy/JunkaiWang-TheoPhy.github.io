const STORAGE_KEY = "timerTasksV1";
const RUN_LOG_KEY = "timerRunLogV1";
const TAG_KEY = "timerTagsV1";
const GROUP_KEY = "timerGroupsV1";
const VIEW_KEY = "timerViewV1";
const UNTAGGED_ID = "tag-untagged";
const UNTAGGED_NAME = "未标记";
const UNTAGGED_COLOR = "#b7a6d8";
const GROUP_DEFAULT_NAME = "新建分组";
const COLOR_PALETTE = [
  "#8d6bff",
  "#ff85d6",
  "#6dd3ff",
  "#ffc857",
  "#5de7c0",
  "#ff8f6b",
  "#7bd389",
  "#ffb3f5"
];

const taskListEl = document.getElementById("task-list");
const emptyStateEl = document.getElementById("empty-state");
const clockEl = document.getElementById("clock");
const createForm = document.getElementById("create-form");
const titleInput = document.getElementById("task-title");
const tagPickerEl = document.getElementById("tag-picker");
const tagManagerEl = document.getElementById("tag-manager");
const tagManagerToggle = document.getElementById("toggle-tag-manager");
const tagListEl = document.getElementById("tag-list");
const newTagNameInput = document.getElementById("new-tag-name");
const newTagColorInput = document.getElementById("new-tag-color");
const addTagButton = document.getElementById("add-tag");
const minutesInput = document.getElementById("task-minutes");
const autoStartInput = document.getElementById("task-autostart");
const quickCreate = document.getElementById("quick-create");
const viewButtons = document.querySelectorAll(".tab");
const viewTimer = document.getElementById("view-timer");
const viewStats = document.getElementById("view-stats");
const rangeButtons = document.querySelectorAll("[data-range]");
const chartButtons = document.querySelectorAll("[data-chart]");
const statsListEl = document.getElementById("stats-list");
const chartCanvas = document.getElementById("chart-canvas");
const chartLegend = document.getElementById("chart-legend");
const lineFilterEl = document.getElementById("line-filter");
const lineOptionsEl = document.getElementById("line-options");

let tags = loadTags();
let groups = loadGroups();
let tasks = loadTasks();
let runLog = loadRuns();
syncRunningSegments();
let activeRange = "today";
let activeChart = "bar";
let selectedLineTags = new Set();
let selectedCreateTags = new Set();
let pressState = null;
let dragState = null;

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function loadTags() {
  try {
    const raw = localStorage.getItem(TAG_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((tag) => normalizeTag(tag)).filter(Boolean);
  } catch {
    return [];
  }
}

function loadGroups() {
  try {
    const raw = localStorage.getItem(GROUP_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((group) => {
        if (!group || !group.id) return null;
        return {
          id: group.id,
          name: typeof group.name === "string" && group.name.trim() ? group.name.trim() : GROUP_DEFAULT_NAME,
          color: isColor(group.color) ? group.color : pickTagColor()
        };
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

function saveGroups() {
  localStorage.setItem(GROUP_KEY, JSON.stringify(groups));
}

function generateGroupId() {
  return `group-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function getGroupById(id) {
  return groups.find((group) => group.id === id) || null;
}

function createGroup(taskIds) {
  const group = {
    id: generateGroupId(),
    name: GROUP_DEFAULT_NAME,
    color: pickTagColor()
  };
  groups.push(group);
  taskIds.forEach((taskId) => {
    const task = tasks.find((item) => item.id === taskId);
    if (task) task.groupId = group.id;
  });
  saveGroups();
  saveTasks();
  return group;
}

function updateGroup(groupId, updates) {
  const group = getGroupById(groupId);
  if (!group) return;
  if (typeof updates.name === "string" && updates.name.trim()) {
    group.name = updates.name.trim();
  }
  if (isColor(updates.color)) {
    group.color = updates.color;
  }
  saveGroups();
  renderTasks();
}

function cleanupGroups() {
  const used = new Set(tasks.map((task) => task.groupId).filter(Boolean));
  const before = groups.length;
  groups = groups.filter((group) => used.has(group.id));
  if (groups.length !== before) {
    saveGroups();
  }
}

function normalizeTag(tag) {
  if (!tag) return null;
  const name = typeof tag.name === "string" ? tag.name.trim() : "";
  if (!name) return null;
  return {
    id: tag.id || generateTagId(),
    name,
    color: isColor(tag.color) ? tag.color : pickTagColor()
  };
}

function saveTags() {
  localStorage.setItem(TAG_KEY, JSON.stringify(tags));
}

function generateTagId() {
  return `tag-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function isColor(value) {
  return typeof value === "string" && value.startsWith("#") && value.length >= 4;
}

function pickTagColor() {
  const index = tags.length % COLOR_PALETTE.length;
  return COLOR_PALETTE[index];
}

function getTagById(id) {
  return tags.find((tag) => tag.id === id) || null;
}

function ensureTagByName(name, color) {
  const trimmed = String(name || "").trim();
  if (!trimmed) return null;
  const existing = tags.find((tag) => tag.name === trimmed);
  if (existing) return existing.id;
  const tag = {
    id: generateTagId(),
    name: trimmed,
    color: isColor(color) ? color : pickTagColor()
  };
  tags.push(tag);
  saveTags();
  return tag.id;
}

function normalizeTagIds(rawTags) {
  if (!Array.isArray(rawTags)) return [];
  const ids = [];
  rawTags.forEach((item) => {
    if (typeof item !== "string") return;
    const byId = getTagById(item);
    if (byId) {
      ids.push(byId.id);
      return;
    }
    if (item.startsWith("tag-")) {
      ids.push(item);
      return;
    }
    const id = ensureTagByName(item);
    if (id) ids.push(id);
  });
  return Array.from(new Set(ids));
}

function ensureTagIds(tagIds) {
  return Array.from(new Set(tagIds));
}

function areTagSetsEqual(left = [], right = []) {
  if (left.length !== right.length) return false;
  const set = new Set(left);
  return right.every((id) => set.has(id));
}

function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((task) => normalizeTask(task));
  } catch {
    return [];
  }
}

function normalizeTask(task) {
  const now = Date.now();
  const durationMs = Number(task.durationMs) || 30 * 60 * 1000;
  const elapsedMs = Math.max(0, Number(task.elapsedMs) || 0);
  const running = Boolean(task.running) && Number(task.startAt);
  const title = typeof task.title === "string" ? task.title.trim() : "";
  const category = typeof task.category === "string" ? task.category.trim() : "";
  const groupId = typeof task.groupId === "string" ? task.groupId : null;
  let tagIds = normalizeTagIds(task.tags);
  if (tagIds.length === 0 && category) {
    tagIds = [ensureTagByName(category)];
  }
  tagIds = ensureTagIds(tagIds);
  const note = typeof task.note === "string" ? task.note : "";

  return {
    id: task.id || `task-${now}-${Math.random().toString(16).slice(2, 8)}`,
    title: title || "新任务",
    tags: tagIds,
    groupId: groupId && getGroupById(groupId) ? groupId : null,
    note,
    durationMs,
    elapsedMs,
    running,
    startAt: running ? Number(task.startAt) : null,
    createdAt: Number(task.createdAt) || now,
    updatedAt: Number(task.updatedAt) || now
  };
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function loadRuns() {
  try {
    const raw = localStorage.getItem(RUN_LOG_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((run) => {
        if (!run) return null;
        const legacyCategory = typeof run.category === "string" ? run.category.trim() : "";
        const legacyTags = normalizeTagIds(run.tagIds);
        const legacyId = legacyCategory ? ensureTagByName(legacyCategory) : null;
        const tagIds = legacyTags.length ? legacyTags : legacyId ? [legacyId] : [];
        if (run.start) {
          return {
            id: run.id || `seg-${run.start}`,
            taskId: run.taskId || "",
            tagIds,
            start: Number(run.start),
            end: run.end ? Number(run.end) : null
          };
        }
        if (run.timestamp) {
          const stamp = Number(run.timestamp);
          return {
            id: run.id || `seg-${stamp}`,
            taskId: run.taskId || "",
            tagIds,
            start: stamp,
            end: stamp
          };
        }
        return null;
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

function saveRuns() {
  localStorage.setItem(RUN_LOG_KEY, JSON.stringify(runLog));
}

function getActiveSegment(taskId) {
  for (let i = runLog.length - 1; i >= 0; i -= 1) {
    const segment = runLog[i];
    if (segment.taskId === taskId && !segment.end) return segment;
  }
  return null;
}

function startSegment(task, startTime = Date.now()) {
  if (getActiveSegment(task.id)) return;
  runLog.push({
    id: `seg-${startTime}-${Math.random().toString(16).slice(2, 8)}`,
    taskId: task.id,
    tagIds: ensureTagIds(normalizeTagIds(task.tags)),
    start: startTime,
    end: null
  });
  saveRuns();
}

function stopSegment(task, endTime = Date.now()) {
  const active = getActiveSegment(task.id);
  if (!active) return;
  active.end = Math.max(active.start, endTime);
  saveRuns();
}

function syncRunningSegments() {
  let changed = false;
  tasks.forEach((task) => {
    const active = getActiveSegment(task.id);
    if (task.running) {
      if (!active) {
        runLog.push({
          id: `seg-${task.startAt || Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
          taskId: task.id,
          tagIds: ensureTagIds(normalizeTagIds(task.tags)),
          start: task.startAt || Date.now(),
          end: null
        });
        changed = true;
      }
    } else if (active) {
      active.end = Math.max(active.start, task.updatedAt || Date.now());
      changed = true;
    }
  });
  if (changed) saveRuns();
}

function clampMinutes(value) {
  const num = Number.parseInt(value, 10);
  if (Number.isNaN(num)) return 1;
  return Math.min(Math.max(num, 1), 1440);
}

function formatTime(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n) => String(n).padStart(2, "0");
  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

function formatClock(now) {
  const date = new Date(now);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

function computeElapsed(task, now) {
  if (!task.running || !task.startAt) return task.elapsedMs;
  return task.elapsedMs + (now - task.startAt);
}

function computeRemaining(task, now) {
  return Math.max(task.durationMs - computeElapsed(task, now), 0);
}

function updateClock() {
  clockEl.textContent = formatClock(Date.now());
}

function addTask(title, tagIds, minutes, autoStart) {
  const now = Date.now();
  const normalizedTags = ensureTagIds(Array.from(tagIds || []));
  const task = {
    id: `task-${now}-${Math.random().toString(16).slice(2, 8)}`,
    title: title?.trim() || "新任务",
    tags: normalizedTags,
    note: "",
    durationMs: clampMinutes(minutes) * 60 * 1000,
    elapsedMs: 0,
    running: Boolean(autoStart),
    startAt: autoStart ? now : null,
    createdAt: now,
    updatedAt: now
  };
  if (task.running) {
    startSegment(task, now);
  }
  tasks.unshift(task);
  saveTasks();
  renderTasks();
}

function updateTask(id, updates) {
  const index = tasks.findIndex((task) => task.id === id);
  if (index === -1) return;
  const now = Date.now();
  const current = tasks[index];
  const next = { ...current, ...updates, updatedAt: now };

  next.title = next.title?.trim() || "新任务";
  next.tags = ensureTagIds(normalizeTagIds(next.tags));
  next.note = typeof next.note === "string" ? next.note : "";

  if (typeof updates.durationMs === "number") {
    next.durationMs = Math.max(60000, updates.durationMs);
    if (current.running) {
      const elapsedNow = computeElapsed(current, now);
      if (elapsedNow > next.durationMs) {
        next.elapsedMs = next.durationMs;
        next.running = false;
        next.startAt = null;
      }
    } else if (next.elapsedMs > next.durationMs) {
      next.elapsedMs = next.durationMs;
    }
  }

  if (current.running && !next.running) {
    stopSegment(current, now);
  }

  if (current.running && next.running && !areTagSetsEqual(current.tags, next.tags)) {
    const elapsedNow = computeElapsed(current, now);
    next.elapsedMs = elapsedNow;
    stopSegment(current, now);
    next.startAt = now;
    startSegment(next, now);
  }

  tasks[index] = next;
  saveTasks();
  renderTasks();
}

function toggleTask(id) {
  const now = Date.now();
  const task = tasks.find((item) => item.id === id);
  if (!task) return;
  const remaining = computeRemaining(task, now);
  if (remaining === 0) {
    task.elapsedMs = 0;
  }
  if (task.running) {
    task.elapsedMs = computeElapsed(task, now);
    task.running = false;
    task.startAt = null;
    stopSegment(task, now);
  } else {
    task.startAt = now;
    task.running = true;
    startSegment(task, now);
  }
  task.updatedAt = now;
  saveTasks();
  renderTasks();
}

function resetTask(id) {
  const task = tasks.find((item) => item.id === id);
  if (!task) return;
  if (task.running) {
    stopSegment(task, Date.now());
  }
  task.elapsedMs = 0;
  task.running = false;
  task.startAt = null;
  task.updatedAt = Date.now();
  saveTasks();
  renderTasks();
}

function restartTask(id) {
  const task = tasks.find((item) => item.id === id);
  if (!task) return;
  stopSegment(task, Date.now());
  task.elapsedMs = 0;
  task.running = true;
  task.startAt = Date.now();
  task.updatedAt = Date.now();
  startSegment(task, task.startAt);
  saveTasks();
  renderTasks();
}

function quickSetTask(id, minutes) {
  const task = tasks.find((item) => item.id === id);
  if (!task) return;
  stopSegment(task, Date.now());
  task.durationMs = clampMinutes(minutes) * 60 * 1000;
  task.elapsedMs = 0;
  task.running = true;
  task.startAt = Date.now();
  task.updatedAt = Date.now();
  startSegment(task, task.startAt);
  saveTasks();
  renderTasks();
}

function deleteTask(id) {
  const task = tasks.find((item) => item.id === id);
  if (task && task.running) {
    stopSegment(task, Date.now());
  }
  tasks = tasks.filter((task) => task.id !== id);
  cleanupGroups();
  saveTasks();
  renderTasks();
}

function renderTasks() {
  renderCreateTagPicker();
  renderTagManagerList();
  if (tasks.length === 0) {
    taskListEl.innerHTML = "";
    emptyStateEl.classList.add("show");
    updateStats();
    return;
  }
  emptyStateEl.classList.remove("show");
  const renderedGroups = new Set();
  taskListEl.innerHTML = tasks
    .map((task) => {
      if (task.groupId) {
        if (renderedGroups.has(task.groupId)) return "";
        renderedGroups.add(task.groupId);
        const group = getGroupById(task.groupId) || {
          id: task.groupId,
          name: GROUP_DEFAULT_NAME,
          color: pickTagColor()
        };
        const groupTasks = tasks.filter((item) => item.groupId === task.groupId);
        return renderGroupCard(group, groupTasks);
      }
      return renderTaskCard(task);
    })
    .join("");

  refreshTaskDisplay();
  updateStats();
}

function refreshTaskDisplay() {
  const now = Date.now();
  tasks.forEach((task) => {
    const card = taskListEl.querySelector(`.task-card[data-id="${task.id}"]`);
    if (!card) return;
    const remaining = computeRemaining(task, now);
    const elapsed = Math.min(task.durationMs, computeElapsed(task, now));
    const progress = task.durationMs === 0 ? 0 : elapsed / task.durationMs;

    const statusEl = card.querySelector('[data-role="status"]');
    const remainingEl = card.querySelector('[data-role="remaining"]');
    const subEl = card.querySelector('[data-role="sub"]');
    const progressEl = card.querySelector('[data-role="progress"]');
    const toggleBtn = card.querySelector('[data-role="toggle"]');

    remainingEl.textContent = formatTime(remaining);
    subEl.textContent = `已用 ${formatTime(elapsed)} / 总计 ${formatTime(task.durationMs)}`;
    progressEl.style.width = `${Math.min(progress * 100, 100)}%`;

    if (remaining === 0 && task.durationMs > 0) {
      statusEl.textContent = "完成";
      card.classList.add("done");
      toggleBtn.textContent = "再来一次";
    } else if (task.running) {
      statusEl.textContent = "进行中";
      card.classList.remove("done");
      toggleBtn.textContent = "暂停";
    } else {
      statusEl.textContent = "准备中";
      card.classList.remove("done");
      toggleBtn.textContent = "开始";
    }
  });
}

function tick() {
  const now = Date.now();
  let changed = false;
  tasks.forEach((task) => {
    if (!task.running) return;
    const elapsed = computeElapsed(task, now);
    if (elapsed >= task.durationMs) {
      task.elapsedMs = task.durationMs;
      task.running = false;
      task.startAt = null;
      task.updatedAt = now;
      stopSegment(task, now);
      changed = true;
    }
  });
  if (changed) saveTasks();
  refreshTaskDisplay();
  updateClock();
  if (viewStats.classList.contains("active")) {
    updateStats(true);
  }
}

function closeAllMenus() {
  document.querySelectorAll(".menu.show").forEach((menu) => menu.classList.remove("show"));
  document
    .querySelectorAll(".icon-btn.more")
    .forEach((button) => button.setAttribute("aria-expanded", "false"));
}

function openEditPanel(card, focusRole) {
  card.classList.add("editing");
  closeAllMenus();
  requestAnimationFrame(() => {
    const input = card.querySelector(`[data-role="${focusRole}"]`);
    if (input) input.focus();
  });
}

function setActiveView(view) {
  viewButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.view === view);
  });
  viewTimer.classList.toggle("active", view === "timer");
  viewStats.classList.toggle("active", view === "stats");
  localStorage.setItem(VIEW_KEY, view);
  if (view === "stats") {
    requestAnimationFrame(() => updateStats(true));
  }
}

function getRangeStart(range) {
  const now = new Date();
  if (range === "today") {
    now.setHours(0, 0, 0, 0);
    return now.getTime();
  }
  const day = now.getDay();
  const diff = (day + 6) % 7;
  now.setDate(now.getDate() - diff);
  now.setHours(0, 0, 0, 0);
  return now.getTime();
}

function getRangeBounds(range) {
  return {
    start: getRangeStart(range),
    end: Date.now()
  };
}

function getTagName(tagId) {
  if (tagId === UNTAGGED_ID) return UNTAGGED_NAME;
  const tag = getTagById(tagId);
  return tag ? tag.name : "已删除标签";
}

function getTagColor(tagId) {
  if (tagId === UNTAGGED_ID) return UNTAGGED_COLOR;
  const tag = getTagById(tagId);
  return tag ? tag.color : "#c0b2e3";
}

function getDurationsByTag(range) {
  const { start, end } = getRangeBounds(range);
  const now = Date.now();
  const totals = {};
  runLog.forEach((segment) => {
    if (!segment?.start) return;
    const segStart = Number(segment.start);
    const segEnd = segment.end ? Number(segment.end) : now;
    const overlapStart = Math.max(segStart, start);
    const overlapEnd = Math.min(segEnd, end);
    if (overlapEnd <= overlapStart) return;
    const duration = overlapEnd - overlapStart;
    const tagIds = Array.isArray(segment.tagIds) && segment.tagIds.length ? segment.tagIds : [UNTAGGED_ID];
    tagIds.forEach((tagId) => {
      totals[tagId] = (totals[tagId] || 0) + duration;
    });
  });
  return totals;
}

function getAllTagIds() {
  const set = new Set(tags.map((tag) => tag.id));
  const hasUntagged =
    tasks.some((task) => !task.tags || task.tags.length === 0) ||
    runLog.some((segment) => !segment.tagIds || segment.tagIds.length === 0);
  if (hasUntagged) {
    set.add(UNTAGGED_ID);
  }
  runLog.forEach((segment) => {
    (segment.tagIds || []).forEach((tagId) => {
      if (tagId && !set.has(tagId)) {
        set.add(tagId);
      }
    });
  });
  return Array.from(set);
}

function syncSelectedTags(tagIds) {
  if (selectedLineTags.size === 0) {
    selectedLineTags = new Set(tagIds);
    return;
  }
  const next = new Set();
  tagIds.forEach((tagId) => {
    if (selectedLineTags.has(tagId)) {
      next.add(tagId);
    }
  });
  selectedLineTags = next.size ? next : new Set(tagIds);
}

function renderLineOptions(tagIds) {
  syncSelectedTags(tagIds);
  lineOptionsEl.innerHTML = tagIds
    .map((tagId) => {
      const checked = selectedLineTags.has(tagId);
      return `
        <label class="line-option">
          <input type="checkbox" data-tag-id="${escapeHtml(tagId)}" ${checked ? "checked" : ""} />
          <span>${escapeHtml(getTagName(tagId))}</span>
        </label>
      `;
    })
    .join("");
}

function renderStatsList(counts) {
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) {
    statsListEl.innerHTML = "<p class=\"hint\">暂无统计时长</p>";
    return;
  }
  statsListEl.innerHTML = entries
    .map(([tagId, duration]) => {
      const color = getTagColor(tagId);
      return `
        <div class="stats-row">
          <span><span class="legend-swatch" style="background:${color}"></span>${escapeHtml(
            getTagName(tagId)
          )}</span>
          <span>${formatDuration(duration)}</span>
        </div>
      `;
    })
    .join("");
}

function formatDuration(ms) {
  const totalMinutes = Math.round(ms / 60000);
  if (totalMinutes <= 0) return "0分钟";
  if (totalMinutes < 60) return `${totalMinutes}分钟`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes ? `${hours}小时${minutes}分钟` : `${hours}小时`;
}

function renderSelectedTagChips(tagIds) {
  const chips = (tagIds || [])
    .map((id) => {
      const label = getTagName(id);
      const color = getTagColor(id);
      return `
        <span class="tag-chip static" style="--tag-color:${color}">
          <span class="dot"></span>${escapeHtml(label)}
        </span>
      `;
    })
    .filter(Boolean)
    .join("");
  return (
    chips ||
    `<span class="tag-chip static" style="--tag-color:${UNTAGGED_COLOR}"><span class="dot"></span>${UNTAGGED_NAME}</span>`
  );
}

function renderTagPickerHtml(selectedIds = [], role = "edit-tag") {
  const selectedSet = new Set(selectedIds);
  return tags
    .map((tag) => {
      const selected = selectedSet.has(tag.id);
      return `
        <button type="button" class="tag-chip ${selected ? "selected" : ""}" data-role="${role}" data-tag-id="${
          tag.id
        }" style="--tag-color:${tag.color}">
          <span class="dot"></span>${escapeHtml(tag.name)}
        </button>
      `;
    })
    .join("");
}

function syncSelectedCreateTags() {
  const available = new Set(tags.map((tag) => tag.id));
  selectedCreateTags = new Set([...selectedCreateTags].filter((id) => available.has(id)));
}

function renderCreateTagPicker() {
  if (!tagPickerEl) return;
  syncSelectedCreateTags();
  tagPickerEl.innerHTML = renderTagPickerHtml(Array.from(selectedCreateTags), "create-tag");
}

function renderTagManagerList() {
  if (!tagListEl) return;
  tagListEl.innerHTML = tags
    .map((tag) => {
      return `
        <div class="tag-manager-row" data-tag-id="${tag.id}">
          <input type="text" data-field="name" value="${escapeHtml(tag.name)}" maxlength="20" />
          <input type="color" data-field="color" value="${tag.color}" />
          <button class="icon-btn" type="button" data-action="delete-tag">删除</button>
        </div>
      `;
    })
    .join("");
}

function renderTaskCard(task) {
  const minutes = Math.round(task.durationMs / 60000);
  const noteText = task.note?.trim();
  const noteClass = noteText ? "note" : "note empty";
  const noteDisplay = noteText || "暂无备注";
  return `
    <article class="task-card" data-id="${task.id}">
      <div class="task-top">
        <div>
          <div class="task-title" data-role="title">${escapeHtml(task.title)}</div>
          <div class="tag-row">${renderSelectedTagChips(task.tags)}</div>
          <div class="status-pill" data-role="status">准备中</div>
        </div>
      </div>
      <div class="time-big" data-role="remaining">00:00</div>
      <div class="time-sub" data-role="sub">已用 00:00 / 总计 00:00</div>
      <div class="progress">
        <div class="progress-bar" data-role="progress"></div>
      </div>
      <div class="controls">
        <button class="btn primary" data-action="toggle" data-role="toggle">开始</button>
        <button class="btn secondary" data-action="reset">重置</button>
        <button class="btn ghost" data-action="restart">重新开始</button>
      </div>
      <div class="task-footer">
        <div class="quick-sets">
          <button data-action="quick" data-minutes="30">30m</button>
          <button data-action="quick" data-minutes="45">45m</button>
          <button data-action="quick" data-minutes="60">1h</button>
          <button data-action="quick" data-minutes="90">1h30m</button>
        </div>
        <div class="task-menu">
          <button class="icon-btn more" data-action="menu" aria-label="更多选项" aria-expanded="false">⋯</button>
              <div class="menu" data-role="menu">
                <button data-action="rename">重命名</button>
                <button data-action="edit">编辑</button>
                <button data-action="delete">删除</button>
              </div>
        </div>
      </div>
          <div class="${noteClass}" data-role="note">${escapeHtml(noteDisplay)}</div>
      <div class="edit-panel" data-role="edit-panel">
        <label>
          <span>任务名称</span>
          <input type="text" data-role="edit-title" value="${escapeHtml(task.title)}" maxlength="60" />
        </label>
        <div class="tag-field">
          <span>标签</span>
          <div class="tag-picker" data-role="edit-tags">
            ${renderTagPickerHtml(task.tags, "edit-tag")}
          </div>
        </div>
        <label>
          <span>时长（分钟）</span>
          <input type="number" min="1" max="1440" data-role="edit-minutes" value="${minutes}" />
        </label>
        <label>
          <span>备注</span>
          <textarea data-role="edit-note">${escapeHtml(task.note || "")}</textarea>
        </label>
        <div class="edit-actions">
          <button class="btn secondary" data-action="save">保存</button>
          <button class="btn ghost" data-action="cancel">取消</button>
        </div>
      </div>
    </article>
  `;
}

function renderGroupCard(group, groupTasks) {
  return `
    <div class="group-card" data-group-id="${group.id}" style="--group-color:${group.color}">
      <div class="group-head">
        <span class="group-dot"></span>
        <input type="text" data-role="group-name" value="${escapeHtml(group.name)}" maxlength="30" />
        <input type="color" data-role="group-color" value="${group.color}" />
      </div>
      <div class="group-body">
        ${groupTasks.map((task) => renderTaskCard(task)).join("")}
      </div>
    </div>
  `;
}


function updateTag(tagId, updates) {
  const tag = tags.find((item) => item.id === tagId);
  if (!tag) return;
  if (typeof updates.name === "string" && updates.name.trim()) {
    tag.name = updates.name.trim();
  }
  if (isColor(updates.color)) {
    tag.color = updates.color;
  }
  saveTags();
  renderTasks();
  updateStats(true);
}

function deleteTag(tagId) {
  tags = tags.filter((tag) => tag.id !== tagId);
  tasks = tasks.map((task) => ({
    ...task,
    tags: Array.isArray(task.tags) ? task.tags.filter((id) => id !== tagId) : []
  }));
  runLog = runLog.map((segment) => ({
    ...segment,
    tagIds: Array.isArray(segment.tagIds) ? segment.tagIds.filter((id) => id !== tagId) : []
  }));
  saveTags();
  saveTasks();
  saveRuns();
  renderTasks();
  updateStats(true);
}

function getChartContext() {
  const parentWidth = chartCanvas.parentElement?.clientWidth || 600;
  const height = 320;
  const dpr = window.devicePixelRatio || 1;
  chartCanvas.width = parentWidth * dpr;
  chartCanvas.height = height * dpr;
  chartCanvas.style.width = `${parentWidth}px`;
  chartCanvas.style.height = `${height}px`;
  const ctx = chartCanvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, parentWidth, height);
  return { ctx, width: parentWidth, height };
}

function drawEmptyChart(ctx, width, height, text) {
  ctx.fillStyle = "#b7a6d8";
  ctx.font = "16px Fredoka";
  ctx.textAlign = "center";
  ctx.fillText(text, width / 2, height / 2);
}

function drawBarChart(labels, values, colors) {
  const { ctx, width, height } = getChartContext();
  const maxValue = Math.max(...values, 1);
  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  const barGap = 12;
  const barWidth = Math.max(24, (chartWidth - barGap * (labels.length - 1)) / labels.length);

  if (values.every((value) => value === 0)) {
    drawEmptyChart(ctx, width, height, "暂无数据");
    return;
  }

  ctx.strokeStyle = "#e3d7ff";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(padding, padding + chartHeight);
  ctx.lineTo(width - padding, padding + chartHeight);
  ctx.stroke();

  ctx.font = "12px Fredoka";
  ctx.textAlign = "center";
  ctx.fillStyle = "#5c4599";

  labels.forEach((label, index) => {
    const barHeight = (values[index] / maxValue) * chartHeight;
    const x = padding + index * (barWidth + barGap);
    const y = padding + chartHeight - barHeight;
    ctx.fillStyle = colors[index];
    ctx.fillRect(x, y, barWidth, barHeight);
    ctx.fillStyle = "#5c4599";
    ctx.fillText(label, x + barWidth / 2, padding + chartHeight + 18);
  });
}

function drawPieChart(labels, values, colors) {
  const { ctx, width, height } = getChartContext();
  const total = values.reduce((sum, value) => sum + value, 0);
  if (total === 0) {
    drawEmptyChart(ctx, width, height, "暂无数据");
    return;
  }
  const radius = Math.min(width, height) / 3;
  const centerX = width / 2;
  const centerY = height / 2;
  let startAngle = -Math.PI / 2;

  values.forEach((value, index) => {
    const slice = (value / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.fillStyle = colors[index];
    ctx.arc(centerX, centerY, radius, startAngle, startAngle + slice);
    ctx.closePath();
    ctx.fill();
    startAngle += slice;
  });
}

function drawLineChart(labels, series) {
  const { ctx, width, height } = getChartContext();
  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const maxValue = Math.max(
    1,
    ...series.flatMap((item) => item.values)
  );

  ctx.strokeStyle = "#e3d7ff";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i += 1) {
    const y = padding + (chartHeight / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(width - padding, y);
    ctx.stroke();
  }

  ctx.font = "12px Fredoka";
  ctx.fillStyle = "#5c4599";
  ctx.textAlign = "center";
  const labelStep = Math.max(1, Math.floor(labels.length / 6));
  labels.forEach((label, index) => {
    if (index % labelStep !== 0 && index !== labels.length - 1) return;
    const x = padding + (chartWidth / (labels.length - 1)) * index;
    ctx.fillText(label, x, height - 14);
  });

  series.forEach((item) => {
    ctx.strokeStyle = item.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    item.values.forEach((value, index) => {
      const x = padding + (chartWidth / (labels.length - 1)) * index;
      const y = padding + chartHeight - (value / maxValue) * chartHeight;
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    ctx.fillStyle = item.color;
    item.values.forEach((value, index) => {
      const x = padding + (chartWidth / (labels.length - 1)) * index;
      const y = padding + chartHeight - (value / maxValue) * chartHeight;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    });
  });
}

function renderLegend(items) {
  chartLegend.innerHTML = items
    .map((item) => {
      return `
        <span class="legend-item">
          <span class="legend-swatch" style="background:${item.color}"></span>
          ${escapeHtml(item.label)}
        </span>
      `;
    })
    .join("");
}

function buildLineSeries(range, tagIds) {
  const { start, end } = getRangeBounds(range);
  const labels = range === "today"
    ? Array.from({ length: 24 }, (_, i) => `${i}`)
    : ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
  const bucketCount = labels.length;
  const seriesMap = new Map();
  const bucketMs = range === "today" ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;

  tagIds.forEach((tagId) => {
    seriesMap.set(tagId, {
      label: getTagName(tagId),
      color: getTagColor(tagId),
      values: new Array(bucketCount).fill(0)
    });
  });

  const now = Date.now();
  runLog.forEach((segment) => {
    if (!segment?.start) return;
    const segStart = Number(segment.start);
    const segEnd = segment.end ? Number(segment.end) : now;
    const overlapStart = Math.max(segStart, start);
    const overlapEnd = Math.min(segEnd, end);
    if (overlapEnd <= overlapStart) return;
    const segmentTags =
      Array.isArray(segment.tagIds) && segment.tagIds.length ? segment.tagIds : [UNTAGGED_ID];

    let cursor = overlapStart;
    while (cursor < overlapEnd) {
      const bucketIndex = Math.floor((cursor - start) / bucketMs);
      if (bucketIndex < 0 || bucketIndex >= bucketCount) break;
      const bucketStart = start + bucketIndex * bucketMs;
      const bucketEnd = bucketStart + bucketMs;
      const sliceEnd = Math.min(bucketEnd, overlapEnd);
      const duration = sliceEnd - cursor;
      segmentTags.forEach((tagId) => {
        if (!seriesMap.has(tagId)) return;
        const series = seriesMap.get(tagId);
        series.values[bucketIndex] += duration / 60000;
      });
      cursor = sliceEnd;
    }
  });

  return { labels, series: Array.from(seriesMap.values()) };
}

function updateStats(forceDraw = false) {
  const tagIds = getAllTagIds();
  renderLineOptions(tagIds);

  lineFilterEl.classList.toggle("show", activeChart === "line");
  const durations = getDurationsByTag(activeRange);
  renderStatsList(durations);

  if (!viewStats.classList.contains("active") && !forceDraw) return;

  if (activeChart === "line") {
    const selected = Array.from(selectedLineTags);
    const { labels, series } = buildLineSeries(activeRange, selected);
    if (series.length === 0 || series.every((item) => item.values.every((value) => value === 0))) {
      const { ctx, width, height } = getChartContext();
      drawEmptyChart(ctx, width, height, "暂无数据");
      renderLegend(series.map((item) => ({ label: item.label, color: item.color })));
      return;
    }
    drawLineChart(labels, series);
    renderLegend(series.map((item) => ({ label: item.label, color: item.color })));
    return;
  }

  const entries = Object.entries(durations).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) {
    const { ctx, width, height } = getChartContext();
    drawEmptyChart(ctx, width, height, "暂无数据");
    renderLegend([]);
    return;
  }
  const labels = entries.map(([tagId]) => getTagName(tagId));
  const values = entries.map(([, value]) => value / 60000);
  const colors = entries.map(([tagId]) => getTagColor(tagId));

  if (activeChart === "bar") {
    drawBarChart(labels, values, colors);
  } else {
    drawPieChart(labels, values, colors);
  }
  renderLegend(labels.map((label, index) => ({ label, color: colors[index] })));
}

createForm.addEventListener("submit", (event) => {
  event.preventDefault();
  addTask(titleInput.value, Array.from(selectedCreateTags), minutesInput.value, autoStartInput.checked);
  titleInput.value = "";
  minutesInput.value = "30";
  autoStartInput.checked = false;
  selectedCreateTags = new Set();
  renderCreateTagPicker();
});

quickCreate.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  const minutes = button.dataset.minutes;
  minutesInput.value = minutes;
  minutesInput.focus();
});

tagPickerEl?.addEventListener("click", (event) => {
  const button = event.target.closest('button[data-role="create-tag"]');
  if (!button) return;
  const tagId = button.dataset.tagId;
  if (!tagId) return;
  if (selectedCreateTags.has(tagId)) {
    selectedCreateTags.delete(tagId);
    button.classList.remove("selected");
  } else {
    selectedCreateTags.add(tagId);
    button.classList.add("selected");
  }
});

tagManagerToggle?.addEventListener("click", () => {
  if (!tagManagerEl) return;
  const isOpen = tagManagerEl.classList.toggle("open");
  if (tagManagerToggle) {
    tagManagerToggle.textContent = isOpen ? "收起" : "展开";
  }
});

addTagButton?.addEventListener("click", () => {
  const name = newTagNameInput.value.trim();
  if (!name) return;
  const color = newTagColorInput.value;
  const newId = ensureTagByName(name, color);
  selectedCreateTags.add(newId);
  newTagNameInput.value = "";
  renderTasks();
  updateStats(true);
});

tagListEl?.addEventListener("change", (event) => {
  const row = event.target.closest(".tag-manager-row");
  if (!row) return;
  const tagId = row.dataset.tagId;
  if (!tagId) return;
  if (event.target.matches('input[data-field="name"]')) {
    const value = event.target.value.trim();
    if (!value) return;
    updateTag(tagId, { name: value });
  }
  if (event.target.matches('input[data-field="color"]')) {
    updateTag(tagId, { color: event.target.value });
  }
});

tagListEl?.addEventListener("click", (event) => {
  const button = event.target.closest('button[data-action="delete-tag"]');
  if (!button) return;
  const row = button.closest(".tag-manager-row");
  if (!row) return;
  const tagId = row.dataset.tagId;
  if (!tagId) return;
  deleteTag(tagId);
});

taskListEl.addEventListener("change", (event) => {
  const groupEl = event.target.closest(".group-card");
  if (!groupEl) return;
  const groupId = groupEl.dataset.groupId;
  if (!groupId) return;
  if (event.target.matches('[data-role="group-name"]')) {
    updateGroup(groupId, { name: event.target.value });
  }
  if (event.target.matches('[data-role="group-color"]')) {
    updateGroup(groupId, { color: event.target.value });
  }
});

taskListEl.addEventListener("pointerdown", (event) => {
  const card = event.target.closest(".task-card");
  if (!card) return;
  if (event.target.closest("button, input, textarea, label, .task-menu, .edit-panel")) return;
  if (dragState) return;

  const startX = event.clientX;
  const startY = event.clientY;
  const pointerId = event.pointerId;

  const onPressMove = (moveEvent) => {
    if (!pressState) return;
    const distance = Math.hypot(moveEvent.clientX - startX, moveEvent.clientY - startY);
    if (distance > 6) {
      clearPressState();
    }
  };

  const timer = window.setTimeout(() => {
    clearPressState();
    startDrag(card, pointerId, startX, startY);
  }, 350);

  pressState = { card, startX, startY, pointerId, timer, moveHandler: onPressMove };

  window.addEventListener("pointermove", onPressMove);
  window.addEventListener("pointerup", clearPressState, { once: true });
  window.addEventListener("pointercancel", clearPressState, { once: true });
});

taskListEl.addEventListener("click", (event) => {
  const tagButton = event.target.closest('button[data-role="edit-tag"]');
  if (tagButton) {
    tagButton.classList.toggle("selected");
    return;
  }

  const noteDisplay = event.target.closest('[data-role="note"]');
  if (noteDisplay) {
    const card = noteDisplay.closest(".task-card");
    if (card) {
      openEditPanel(card, "edit-note");
    }
    return;
  }

  const button = event.target.closest("button");
  if (!button) return;
  const action = button.dataset.action;
  if (!action) return;

  const card = button.closest(".task-card");
  if (!card) return;
  const id = card.dataset.id;

  switch (action) {
    case "toggle":
      toggleTask(id);
      break;
    case "reset":
      resetTask(id);
      break;
    case "restart":
      restartTask(id);
      break;
    case "quick":
      quickSetTask(id, button.dataset.minutes);
      break;
    case "delete":
      deleteTask(id);
      break;
    case "menu": {
      const menu = card.querySelector('[data-role="menu"]');
      const isOpen = menu.classList.contains("show");
      closeAllMenus();
      menu.classList.toggle("show", !isOpen);
      button.setAttribute("aria-expanded", (!isOpen).toString());
      break;
    }
    case "rename":
      openEditPanel(card, "edit-title");
      break;
    case "edit":
      openEditPanel(card, "edit-note");
      break;
    case "cancel":
      card.classList.remove("editing");
      break;
    case "save": {
      const titleField = card.querySelector('[data-role="edit-title"]');
      const minutesField = card.querySelector('[data-role="edit-minutes"]');
      const noteField = card.querySelector('[data-role="edit-note"]');
      const tagButtons = card.querySelectorAll('button[data-role="edit-tag"].selected');
      const selectedTags = Array.from(tagButtons).map((btn) => btn.dataset.tagId).filter(Boolean);
      updateTask(id, {
        title: titleField.value.trim() || "新任务",
        tags: selectedTags,
        durationMs: clampMinutes(minutesField.value) * 60 * 1000,
        note: noteField.value
      });
      card.classList.remove("editing");
      break;
    }
    default:
      break;
  }
});

function startDrag(card, pointerId, startX, startY) {
  const rect = card.getBoundingClientRect();
  card.classList.add("dragging");
  card.style.width = `${rect.width}px`;
  card.style.height = `${rect.height}px`;
  card.style.position = "fixed";
  card.style.left = `${rect.left}px`;
  card.style.top = `${rect.top}px`;
  card.style.zIndex = "50";
  card.style.pointerEvents = "none";
  card.style.transition = "none";

  dragState = {
    id: card.dataset.id,
    element: card,
    startX,
    startY,
    offsetX: startX - rect.left,
    offsetY: startY - rect.top,
    lastX: startX,
    lastY: startY,
    overId: null
  };

  window.addEventListener("pointermove", onDragMove);
  window.addEventListener("pointerup", onDragEnd, { once: true });
  window.addEventListener("pointercancel", onDragEnd, { once: true });
}

function onDragMove(event) {
  if (!dragState) return;
  dragState.lastX = event.clientX;
  dragState.lastY = event.clientY;
  const dx = event.clientX - dragState.startX;
  const dy = event.clientY - dragState.startY;
  dragState.element.style.transform = `translate(${dx}px, ${dy}px) scale(0.94)`;

  const target = getCardUnderPointer(event.clientX, event.clientY);
  setDropTarget(target);
  dragState.overId = target ? target.dataset.id : null;
}

function onDragEnd(event) {
  if (!dragState) return;
  window.removeEventListener("pointermove", onDragMove);

  const dragId = dragState.id;
  const target = getCardUnderPointer(dragState.lastX, dragState.lastY);
  const targetId = target ? target.dataset.id : null;

  if (targetId && targetId !== dragId) {
    handleGrouping(dragId, targetId);
  } else {
    const reorderTarget = findReorderTarget(dragState.lastY, dragId);
    if (reorderTarget) {
      moveTask(dragId, reorderTarget.targetId, reorderTarget.insertAfter);
    }
  }

  cleanupDragState();
  renderTasks();
}

function cleanupDragState() {
  if (!dragState) return;
  if (dragState.element) {
    dragState.element.classList.remove("dragging");
    dragState.element.style.position = "";
    dragState.element.style.left = "";
    dragState.element.style.top = "";
    dragState.element.style.width = "";
    dragState.element.style.height = "";
    dragState.element.style.zIndex = "";
    dragState.element.style.pointerEvents = "";
    dragState.element.style.transition = "";
    dragState.element.style.transform = "";
  }
  clearDropTargets();
  dragState = null;
}

function getCardUnderPointer(x, y) {
  const el = document.elementFromPoint(x, y);
  if (!el) return null;
  const card = el.closest(".task-card");
  if (!card || card.classList.contains("dragging")) return null;
  return card;
}

function setDropTarget(card) {
  clearDropTargets();
  if (card) {
    card.classList.add("drop-target");
  }
}

function clearDropTargets() {
  document.querySelectorAll(".task-card.drop-target").forEach((item) => {
    item.classList.remove("drop-target");
  });
}

function findReorderTarget(pointerY, dragId) {
  const cards = Array.from(document.querySelectorAll(".task-card")).filter(
    (card) => card.dataset.id !== dragId
  );
  if (cards.length === 0) return null;
  for (const card of cards) {
    const rect = card.getBoundingClientRect();
    const mid = rect.top + rect.height / 2;
    if (pointerY < mid) {
      return { targetId: card.dataset.id, insertAfter: false };
    }
  }
  return { targetId: cards[cards.length - 1].dataset.id, insertAfter: true };
}

function moveTask(dragId, targetId, insertAfter) {
  const fromIndex = tasks.findIndex((task) => task.id === dragId);
  const toIndex = tasks.findIndex((task) => task.id === targetId);
  if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return;
  const [item] = tasks.splice(fromIndex, 1);
  let insertIndex = toIndex;
  if (fromIndex < toIndex && !insertAfter) {
    insertIndex = toIndex - 1;
  } else if (fromIndex < toIndex && insertAfter) {
    insertIndex = toIndex;
  } else if (fromIndex > toIndex && insertAfter) {
    insertIndex = toIndex + 1;
  }
  tasks.splice(insertIndex, 0, item);
  saveTasks();
}

function handleGrouping(dragId, targetId) {
  if (dragId === targetId) return;
  const dragTask = tasks.find((task) => task.id === dragId);
  const targetTask = tasks.find((task) => task.id === targetId);
  if (!dragTask || !targetTask) return;

  const previousGroupId = dragTask.groupId;
  if (targetTask.groupId) {
    dragTask.groupId = targetTask.groupId;
  } else {
    const group = createGroup([dragId, targetId]);
    dragTask.groupId = group.id;
    targetTask.groupId = group.id;
  }
  if (previousGroupId && previousGroupId !== dragTask.groupId) {
    cleanupGroups();
  }
  cleanupGroups();
  saveTasks();
  saveGroups();
}

function clearPressState() {
  if (!pressState) return;
  clearTimeout(pressState.timer);
  if (pressState.moveHandler) {
    window.removeEventListener("pointermove", pressState.moveHandler);
  }
  pressState = null;
}

document.addEventListener("click", (event) => {
  if (!event.target.closest(".task-menu")) {
    closeAllMenus();
  }
});

lineOptionsEl.addEventListener("change", (event) => {
  const input = event.target;
  if (!input.matches("input[type=checkbox]")) return;
  const tagId = input.dataset.tagId;
  if (!tagId) return;
  if (input.checked) {
    selectedLineTags.add(tagId);
  } else {
    selectedLineTags.delete(tagId);
  }
  updateStats(true);
});

viewButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setActiveView(button.dataset.view);
  });
});

rangeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeRange = button.dataset.range;
    rangeButtons.forEach((btn) => btn.classList.toggle("active", btn === button));
    updateStats(true);
  });
});

chartButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeChart = button.dataset.chart;
    chartButtons.forEach((btn) => btn.classList.toggle("active", btn === button));
    updateStats(true);
  });
});

window.addEventListener("resize", () => {
  if (viewStats.classList.contains("active")) {
    updateStats(true);
  }
});

renderTasks();
updateClock();
setActiveView(localStorage.getItem(VIEW_KEY) || "timer");
setInterval(tick, 250);
