const STORAGE_KEY = "timerTasksV1";

const taskListEl = document.getElementById("task-list");
const emptyStateEl = document.getElementById("empty-state");
const clockEl = document.getElementById("clock");
const createForm = document.getElementById("create-form");
const titleInput = document.getElementById("task-title");
const minutesInput = document.getElementById("task-minutes");
const quickCreate = document.getElementById("quick-create");

let tasks = loadTasks();

function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((task) => ({
      id: task.id,
      title: task.title || "新任务",
      durationMs: Number(task.durationMs) || 1500000,
      elapsedMs: Number(task.elapsedMs) || 0,
      running: Boolean(task.running),
      startAt: task.startAt ? Number(task.startAt) : null,
      createdAt: Number(task.createdAt) || Date.now(),
      updatedAt: Number(task.updatedAt) || Date.now()
    }));
  } catch {
    return [];
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
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

function addTask(title, minutes) {
  const now = Date.now();
  const task = {
    id: `task-${now}-${Math.random().toString(16).slice(2, 8)}`,
    title: title?.trim() || "新任务",
    durationMs: clampMinutes(minutes) * 60 * 1000,
    elapsedMs: 0,
    running: false,
    startAt: null,
    createdAt: now,
    updatedAt: now
  };
  tasks.unshift(task);
  saveTasks();
  renderTasks();
}

function updateTask(id, updates) {
  const index = tasks.findIndex((task) => task.id === id);
  if (index === -1) return;
  tasks[index] = { ...tasks[index], ...updates, updatedAt: Date.now() };
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
    return;
  }
  emptyStateEl.classList.remove("show");
  taskListEl.innerHTML = tasks
    .map((task) => {
      const minutes = Math.round(task.durationMs / 60000);
      return `
        <article class="task-card" data-id="${task.id}">
          <div class="task-top">
            <div>
              <div class="task-title" data-role="title">${task.title}</div>
              <div class="status-pill" data-role="status">准备中</div>
            </div>
            <div class="task-actions">
              <button class="icon-btn" data-action="edit">编辑</button>
              <button class="icon-btn" data-action="delete">删除</button>
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
          <div class="quick-sets">
            <button data-action="quick" data-minutes="5">5m</button>
            <button data-action="quick" data-minutes="15">15m</button>
            <button data-action="quick" data-minutes="25">25m</button>
            <button data-action="quick" data-minutes="45">45m</button>
            <button data-action="quick" data-minutes="60">60m</button>
          </div>
          <div class="edit-panel" data-role="edit-panel">
            <label>
              <span>任务名称</span>
              <input type="text" data-role="edit-title" value="${task.title}" maxlength="60" />
            </label>
            <label>
              <span>时长（分钟）</span>
              <input type="number" min="1" max="1440" data-role="edit-minutes" value="${minutes}" />
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

createForm.addEventListener("submit", (event) => {
  event.preventDefault();
  addTask(titleInput.value, minutesInput.value);
  titleInput.value = "";
  minutesInput.value = "25";
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
    case "edit":
      card.classList.toggle("editing");
      break;
    case "cancel":
      card.classList.remove("editing");
      break;
    case "save": {
      const titleField = card.querySelector('[data-role="edit-title"]');
      const minutesField = card.querySelector('[data-role="edit-minutes"]');
      updateTask(id, {
        title: titleField.value.trim() || "新任务",
        durationMs: clampMinutes(minutesField.value) * 60 * 1000
      });
      card.classList.remove("editing");
      break;
    }
    default:
      break;
  }
});

renderTasks();
updateClock();
setInterval(tick, 250);
