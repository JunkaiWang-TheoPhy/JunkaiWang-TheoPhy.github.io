const STORAGE_KEY = "timerTasksV1";
const RUN_LOG_KEY = "timerRunLogV1";
const VIEW_KEY = "timerViewV1";
const DEFAULT_CATEGORY = "默认";
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
const categoryInput = document.getElementById("task-category");
const minutesInput = document.getElementById("task-minutes");
const autoStartInput = document.getElementById("task-autostart");
const quickCreate = document.getElementById("quick-create");
const viewButtons = document.querySelectorAll(".nav-item");
const starToggle = document.getElementById("star-toggle");
const starMenu = document.getElementById("star-menu");
const viewTimer = document.getElementById("view-timer");
const viewStats = document.getElementById("view-stats");
const rangeButtons = document.querySelectorAll("[data-range]");
const chartButtons = document.querySelectorAll("[data-chart]");
const statsListEl = document.getElementById("stats-list");
const chartCanvas = document.getElementById("chart-canvas");
const chartLegend = document.getElementById("chart-legend");
const lineFilterEl = document.getElementById("line-filter");
const lineOptionsEl = document.getElementById("line-options");

let tasks = loadTasks();
let runLog = loadRuns();
let activeRange = "today";
let activeChart = "bar";
let selectedLineCategories = new Set();

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
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
  const note = typeof task.note === "string" ? task.note : "";

  return {
    id: task.id || `task-${now}-${Math.random().toString(16).slice(2, 8)}`,
    title: title || "新任务",
    category: category || DEFAULT_CATEGORY,
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
      .filter((run) => run && run.timestamp)
      .map((run) => ({
        id: run.id || `run-${run.timestamp}`,
        taskId: run.taskId || "",
        category: run.category || DEFAULT_CATEGORY,
        timestamp: Number(run.timestamp)
      }));
  } catch {
    return [];
  }
}

function saveRuns() {
  localStorage.setItem(RUN_LOG_KEY, JSON.stringify(runLog));
}

function clampMinutes(value) {
  const num = Number.parseInt(value, 10);
  if (Number.isNaN(num)) return 1;
  return Math.min(Math.max(num, 1), 1440);
}

function getCategory(value) {
  const text = value?.trim();
  return text ? text : DEFAULT_CATEGORY;
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

function logRun(task) {
  const now = Date.now();
  runLog.push({
    id: `run-${now}-${Math.random().toString(16).slice(2, 8)}`,
    taskId: task.id,
    category: task.category || DEFAULT_CATEGORY,
    timestamp: now
  });
  saveRuns();
}

function addTask(title, category, minutes, autoStart) {
  const now = Date.now();
  const task = {
    id: `task-${now}-${Math.random().toString(16).slice(2, 8)}`,
    title: title?.trim() || "新任务",
    category: getCategory(category),
    note: "",
    durationMs: clampMinutes(minutes) * 60 * 1000,
    elapsedMs: 0,
    running: Boolean(autoStart),
    startAt: autoStart ? now : null,
    createdAt: now,
    updatedAt: now
  };
  if (task.running) {
    logRun(task);
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
  next.category = getCategory(next.category);
  next.note = typeof next.note === "string" ? next.note : "";

  if (typeof updates.durationMs === "number") {
    next.durationMs = Math.max(60000, updates.durationMs);
    if (next.elapsedMs > next.durationMs) {
      next.elapsedMs = next.durationMs;
      next.running = false;
      next.startAt = null;
    }
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
  } else {
    task.startAt = now;
    task.running = true;
    logRun(task);
  }
  task.updatedAt = now;
  saveTasks();
  renderTasks();
}

function resetTask(id) {
  const task = tasks.find((item) => item.id === id);
  if (!task) return;
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
  task.elapsedMs = 0;
  task.running = true;
  task.startAt = Date.now();
  task.updatedAt = Date.now();
  logRun(task);
  saveTasks();
  renderTasks();
}

function quickSetTask(id, minutes) {
  const task = tasks.find((item) => item.id === id);
  if (!task) return;
  task.durationMs = clampMinutes(minutes) * 60 * 1000;
  task.elapsedMs = 0;
  task.running = true;
  task.startAt = Date.now();
  task.updatedAt = Date.now();
  logRun(task);
  saveTasks();
  renderTasks();
}

function deleteTask(id) {
  tasks = tasks.filter((task) => task.id !== id);
  saveTasks();
  renderTasks();
}

function renderTasks() {
  if (tasks.length === 0) {
    taskListEl.innerHTML = "";
    emptyStateEl.classList.add("show");
    updateStats();
    return;
  }
  emptyStateEl.classList.remove("show");
  taskListEl.innerHTML = tasks
    .map((task) => {
      const minutes = Math.round(task.durationMs / 60000);
      const noteText = task.note?.trim();
      const noteClass = noteText ? "note" : "note empty";
      const noteDisplay = noteText || "暂无备注";
      return `
        <article class="task-card" data-id="${task.id}">
          <div class="task-top">
            <div>
              <div class="task-title" data-role="title">${escapeHtml(task.title)}</div>
              <div class="task-meta">栏目：<span data-role="category">${escapeHtml(task.category)}</span></div>
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
                <button data-action="note">备注</button>
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
            <label>
              <span>栏目</span>
              <input type="text" data-role="edit-category" value="${escapeHtml(task.category)}" maxlength="30" />
            </label>
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
      changed = true;
    }
  });
  if (changed) saveTasks();
  refreshTaskDisplay();
  updateClock();
}

function closeAllMenus() {
  document.querySelectorAll(".menu.show").forEach((menu) => menu.classList.remove("show"));
  document
    .querySelectorAll(".icon-btn.more")
    .forEach((button) => button.setAttribute("aria-expanded", "false"));
}

function setStarMenu(open) {
  if (!starMenu || !starToggle) return;
  starMenu.classList.toggle("show", open);
  starToggle.setAttribute("aria-expanded", open ? "true" : "false");
}

function toggleStarMenu() {
  const isOpen = starMenu?.classList.contains("show");
  setStarMenu(!isOpen);
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
  setStarMenu(false);
  if (view === "stats") {
    requestAnimationFrame(() => updateStats(true));
  }
}

function colorForKey(key) {
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % COLOR_PALETTE.length;
  return COLOR_PALETTE[index];
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

function getFilteredRuns(range) {
  const start = getRangeStart(range);
  return runLog.filter((run) => run.timestamp >= start);
}

function getCountsByCategory(range) {
  const counts = {};
  getFilteredRuns(range).forEach((run) => {
    const category = run.category || DEFAULT_CATEGORY;
    counts[category] = (counts[category] || 0) + 1;
  });
  return counts;
}

function getAllCategories() {
  const set = new Set();
  tasks.forEach((task) => set.add(task.category || DEFAULT_CATEGORY));
  runLog.forEach((run) => set.add(run.category || DEFAULT_CATEGORY));
  return Array.from(set);
}

function syncSelectedCategories(categories) {
  if (selectedLineCategories.size === 0) {
    selectedLineCategories = new Set(categories);
    return;
  }
  const next = new Set();
  categories.forEach((category) => {
    if (selectedLineCategories.has(category)) {
      next.add(category);
    }
  });
  selectedLineCategories = next.size ? next : new Set(categories);
}

function renderLineOptions(categories) {
  syncSelectedCategories(categories);
  lineOptionsEl.innerHTML = categories
    .map((category) => {
      const checked = selectedLineCategories.has(category);
      return `
        <label class="line-option">
          <input type="checkbox" data-category="${escapeHtml(category)}" ${checked ? "checked" : ""} />
          <span>${escapeHtml(category)}</span>
        </label>
      `;
    })
    .join("");
}

function renderStatsList(counts) {
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) {
    statsListEl.innerHTML = "<p class=\"hint\">暂无执行记录</p>";
    return;
  }
  statsListEl.innerHTML = entries
    .map(([category, count]) => {
      const color = colorForKey(category);
      return `
        <div class="stats-row">
          <span><span class="legend-swatch" style="background:${color}"></span>${escapeHtml(
            category
          )}</span>
          <span>${count} 次</span>
        </div>
      `;
    })
    .join("");
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

function buildLineSeries(range, categories) {
  const filteredRuns = getFilteredRuns(range);
  const start = getRangeStart(range);
  const labels = range === "today"
    ? Array.from({ length: 24 }, (_, i) => `${i}`)
    : ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
  const bucketCount = labels.length;
  const seriesMap = new Map();

  categories.forEach((category) => {
    seriesMap.set(category, {
      label: category,
      color: colorForKey(category),
      values: new Array(bucketCount).fill(0)
    });
  });

  filteredRuns.forEach((run) => {
    if (!seriesMap.has(run.category)) return;
    if (range === "today") {
      const hour = new Date(run.timestamp).getHours();
      if (hour >= 0 && hour < bucketCount) {
        seriesMap.get(run.category).values[hour] += 1;
      }
    } else {
      const index = Math.floor((run.timestamp - start) / (24 * 60 * 60 * 1000));
      if (index >= 0 && index < bucketCount) {
        seriesMap.get(run.category).values[index] += 1;
      }
    }
  });

  return { labels, series: Array.from(seriesMap.values()) };
}

function updateStats(forceDraw = false) {
  const categories = getAllCategories();
  renderLineOptions(categories);

  lineFilterEl.classList.toggle("show", activeChart === "line");
  const counts = getCountsByCategory(activeRange);
  renderStatsList(counts);

  if (!viewStats.classList.contains("active") && !forceDraw) return;

  if (activeChart === "line") {
    const selected = Array.from(selectedLineCategories);
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

  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) {
    const { ctx, width, height } = getChartContext();
    drawEmptyChart(ctx, width, height, "暂无数据");
    renderLegend([]);
    return;
  }
  const labels = entries.map(([label]) => label);
  const values = entries.map(([, value]) => value);
  const colors = labels.map((label) => colorForKey(label));

  if (activeChart === "bar") {
    drawBarChart(labels, values, colors);
  } else {
    drawPieChart(labels, values, colors);
  }
  renderLegend(labels.map((label, index) => ({ label, color: colors[index] })));
}

createForm.addEventListener("submit", (event) => {
  event.preventDefault();
  addTask(titleInput.value, categoryInput.value, minutesInput.value, autoStartInput.checked);
  titleInput.value = "";
  categoryInput.value = "";
  minutesInput.value = "30";
  autoStartInput.checked = false;
});

quickCreate.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  const minutes = button.dataset.minutes;
  minutesInput.value = minutes;
  minutesInput.focus();
});

taskListEl.addEventListener("click", (event) => {
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
    case "note":
      openEditPanel(card, "edit-note");
      break;
    case "cancel":
      card.classList.remove("editing");
      break;
    case "save": {
      const titleField = card.querySelector('[data-role="edit-title"]');
      const categoryField = card.querySelector('[data-role="edit-category"]');
      const minutesField = card.querySelector('[data-role="edit-minutes"]');
      const noteField = card.querySelector('[data-role="edit-note"]');
      updateTask(id, {
        title: titleField.value.trim() || "新任务",
        category: categoryField.value.trim() || DEFAULT_CATEGORY,
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

document.addEventListener("click", (event) => {
  if (!event.target.closest(".task-menu")) {
    closeAllMenus();
  }
  if (!event.target.closest(".star-nav")) {
    setStarMenu(false);
  }
});

starToggle?.addEventListener("click", (event) => {
  event.stopPropagation();
  toggleStarMenu();
});

lineOptionsEl.addEventListener("change", (event) => {
  const input = event.target;
  if (!input.matches("input[type=checkbox]")) return;
  const category = input.dataset.category;
  if (!category) return;
  if (input.checked) {
    selectedLineCategories.add(category);
  } else {
    selectedLineCategories.delete(category);
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
