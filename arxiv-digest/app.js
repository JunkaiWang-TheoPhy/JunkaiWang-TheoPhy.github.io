const state = {
  mode: "loading",
  llmEnabled: false,
  llmModel: "",
  papers: [],
  digest: null,
  ideas: [],
  selectedId: null,
  currentPaper: null,
  currentNotes: null,
  category: "all",
  search: "",
  pollHandle: null,
};

const NOTE_STORAGE_KEY = "arxiv_digest_notes_v1";
const IDEA_STORAGE_KEY = "arxiv_digest_ideas_v1";
const API_BASE = new URLSearchParams(window.location.search).get("api") || "";
const SUBPATH_PREFIX = window.location.pathname.startsWith("/arxiv-digest") ? "/arxiv-digest/" : "/";

const els = {
  paperCountBadge: document.getElementById("paperCountBadge"),
  llmBadge: document.getElementById("llmBadge"),
  searchInput: document.getElementById("searchInput"),
  categoryFilter: document.getElementById("categoryFilter"),
  refreshBtn: document.getElementById("refreshBtn"),
  paperList: document.getElementById("paperList"),
  digestDate: document.getElementById("digestDate"),
  hotCount: document.getElementById("hotCount"),
  focusCount: document.getElementById("focusCount"),
  laterCount: document.getElementById("laterCount"),
  topicTags: document.getElementById("topicTags"),
  summaryBlocks: document.getElementById("summaryBlocks"),
  highlightList: document.getElementById("highlightList"),
  ideaHint: document.getElementById("ideaHint"),
  ideaForm: document.getElementById("ideaForm"),
  ideaInput: document.getElementById("ideaInput"),
  ideaList: document.getElementById("ideaList"),
  detailArxivId: document.getElementById("detailArxivId"),
  analyzeBtn: document.getElementById("analyzeBtn"),
  detailMeta: document.getElementById("detailMeta"),
  detailTitle: document.getElementById("detailTitle"),
  detailSummary: document.getElementById("detailSummary"),
  featureList: document.getElementById("featureList"),
  directionText: document.getElementById("directionText"),
  routeText: document.getElementById("routeText"),
  relatedWorkBody: document.getElementById("relatedWorkBody"),
  notesReferences: document.getElementById("notesReferences"),
  notesIdeas: document.getElementById("notesIdeas"),
  notesQuestions: document.getElementById("notesQuestions"),
  saveNotesBtn: document.getElementById("saveNotesBtn"),
  paperLink: document.getElementById("paperLink"),
  paperPdfLink: document.getElementById("paperPdfLink"),
  paperItemTemplate: document.getElementById("paperItemTemplate"),
};

function escapeHtml(text) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function apiUrl(path) {
  if (API_BASE) {
    return `${API_BASE.replace(/\/$/, "")}${path}`;
  }
  return path;
}

async function fetchJson(path, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);
  try {
    const response = await fetch(apiUrl(path), {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    if (data && data.ok === false) {
      throw new Error(data.error || "API returned error");
    }
    return data;
  } finally {
    clearTimeout(timer);
  }
}

async function loadDemoData() {
  const demoResponse = await fetch(`${SUBPATH_PREFIX}data/demo.json`);
  if (!demoResponse.ok) {
    throw new Error("演示数据加载失败");
  }
  return demoResponse.json();
}

function scoreClass(score) {
  if (score >= 8) return "hot";
  if (score >= 6.5) return "focus";
  return "later";
}

function formatDate(raw) {
  if (!raw) return "--";
  return raw.slice(0, 10);
}

function loadLocalNotes(arxivId) {
  try {
    const payload = JSON.parse(localStorage.getItem(NOTE_STORAGE_KEY) || "{}");
    return (
      payload[arxivId] || {
        arxiv_id: arxivId,
        references_text: "",
        ideas_text: "",
        questions_text: "",
      }
    );
  } catch {
    return {
      arxiv_id: arxivId,
      references_text: "",
      ideas_text: "",
      questions_text: "",
    };
  }
}

function saveLocalNotes(notes) {
  const payload = JSON.parse(localStorage.getItem(NOTE_STORAGE_KEY) || "{}");
  payload[notes.arxiv_id] = notes;
  localStorage.setItem(NOTE_STORAGE_KEY, JSON.stringify(payload));
}

function loadLocalIdeas() {
  try {
    return JSON.parse(localStorage.getItem(IDEA_STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveLocalIdeas(ideas) {
  localStorage.setItem(IDEA_STORAGE_KEY, JSON.stringify(ideas));
}

function showToast(message, isError = false) {
  const node = document.createElement("div");
  node.className = `status-toast${isError ? " error" : ""}`;
  node.textContent = message;
  document.body.appendChild(node);
  window.setTimeout(() => {
    node.remove();
  }, 3200);
}

function filteredPapers() {
  return state.papers.filter((paper) => {
    const matchCategory = state.category === "all" || paper.categories.includes(state.category);
    const search = state.search.trim().toLowerCase();
    if (!search) return matchCategory;
    const haystack = `${paper.title} ${paper.summary}`.toLowerCase();
    return matchCategory && haystack.includes(search);
  });
}

function renderCategories() {
  const allCats = new Set();
  state.papers.forEach((paper) => {
    paper.categories.forEach((cat) => allCats.add(cat));
  });
  const selectedValue = state.category;
  els.categoryFilter.innerHTML = "<option value=\"all\">全部类别</option>";
  Array.from(allCats)
    .sort()
    .forEach((cat) => {
      const option = document.createElement("option");
      option.value = cat;
      option.textContent = cat;
      els.categoryFilter.appendChild(option);
    });
  if (Array.from(els.categoryFilter.options).some((opt) => opt.value === selectedValue)) {
    els.categoryFilter.value = selectedValue;
  }
}

function renderPaperList() {
  const papers = filteredPapers();
  els.paperList.innerHTML = "";

  papers.forEach((paper) => {
    const node = els.paperItemTemplate.content.firstElementChild.cloneNode(true);
    node.dataset.id = paper.arxiv_id;
    if (paper.arxiv_id === state.selectedId) {
      node.classList.add("is-selected");
    }

    const score = Number(paper.score || 0);
    const scoreNode = node.querySelector(".paper-score");
    scoreNode.className = `paper-score ${scoreClass(score)}`;
    scoreNode.textContent = `${score >= 8 ? "🔥" : score >= 6.5 ? "👀" : "🗂"} ${score.toFixed(1)}`;

    node.querySelector(".paper-id").textContent = paper.arxiv_id;
    node.querySelector(".paper-title").textContent = paper.title;
    node.querySelector(".paper-meta").textContent = `${formatDate(paper.published)} • ${paper.primary_category}`;

    node.addEventListener("click", () => {
      selectPaper(paper.arxiv_id);
    });
    els.paperList.appendChild(node);
  });

  if (papers.length === 0) {
    els.paperList.innerHTML = "<p class='paper-meta'>没有匹配结果，换个关键词试试。</p>";
  }
}

function renderDigest() {
  const digest = state.digest || {};
  els.digestDate.textContent = digest.date || "--";
  els.hotCount.textContent = `🔥 速览 ${digest.hot_count || 0}`;
  els.focusCount.textContent = `👀 精读 ${digest.focus_count || 0}`;
  els.laterCount.textContent = `🗂 待看 ${digest.read_later_count || 0}`;

  els.topicTags.innerHTML = "";
  (digest.topic_tags || []).forEach((tag) => {
    const chip = document.createElement("span");
    chip.textContent = tag;
    els.topicTags.appendChild(chip);
  });

  els.summaryBlocks.innerHTML = "";
  (digest.summary_blocks || []).forEach((block) => {
    const card = document.createElement("article");
    card.className = "summary-item";
    card.innerHTML = `<h4>${escapeHtml(block.title)}</h4><p>${escapeHtml(block.content)}</p>`;
    els.summaryBlocks.appendChild(card);
  });

  els.highlightList.innerHTML = "";
  (digest.highlight_cards || []).forEach((card) => {
    const div = document.createElement("article");
    div.className = "highlight-item";
    div.innerHTML = `
      <h4>${escapeHtml(card.title)}</h4>
      <p>${escapeHtml(card.arxiv_id)} • score ${Number(card.score || 0).toFixed(1)} • ${escapeHtml(card.reason || "")}</p>
    `;
    div.addEventListener("click", () => selectPaper(card.arxiv_id));
    els.highlightList.appendChild(div);
  });
}

function renderIdeas() {
  els.ideaList.innerHTML = "";
  const ideas = state.ideas || [];
  if (ideas.length === 0) {
    els.ideaList.innerHTML = "<li><p>还没有记录。随手写一句想法，系统会持久化。</p></li>";
    return;
  }

  ideas.forEach((item) => {
    const li = document.createElement("li");
    li.innerHTML = `<p>${escapeHtml(item.content)}</p><span>${escapeHtml(formatDate(item.created_at))}</span>`;
    els.ideaList.appendChild(li);
  });
}

function renderHeader() {
  const papers = filteredPapers();
  els.paperCountBadge.textContent = `${papers.length} 篇论文`;

  if (state.mode === "live") {
    els.ideaHint.textContent = "已连接本地后端，笔记和想法写入 SQLite";
  } else {
    els.ideaHint.textContent = "演示模式：本地存储到浏览器";
  }

  if (state.llmEnabled) {
    els.llmBadge.textContent = `LLM 已启用 (${state.llmModel || "deepseek-chat"})`;
    els.llmBadge.style.color = "#86efac";
  } else {
    els.llmBadge.textContent = "LLM 未启用";
    els.llmBadge.style.color = "";
  }
}

function fillNotes(notes) {
  els.notesReferences.value = notes?.references_text || "";
  els.notesIdeas.value = notes?.ideas_text || "";
  els.notesQuestions.value = notes?.questions_text || "";
}

function renderDetail() {
  const paper = state.currentPaper;
  const notes = state.currentNotes;

  if (!paper) {
    els.detailArxivId.textContent = "未选论文";
    els.detailMeta.innerHTML = "";
    els.detailTitle.textContent = "请从左侧选择一篇论文";
    els.detailSummary.textContent = "";
    els.featureList.innerHTML = "";
    els.directionText.textContent = "";
    els.routeText.textContent = "";
    els.relatedWorkBody.innerHTML = "";
    fillNotes({});
    return;
  }

  const analysis = paper.analysis || {};
  const tags = analysis.topic_tags || [];

  els.detailArxivId.textContent = paper.arxiv_id;
  els.detailMeta.innerHTML = [
    `<span>${paper.primary_category}</span>`,
    `<span>score ${Number(paper.score || 0).toFixed(1)}</span>`,
    `<span>${paper.llm_ready ? "LLM" : "Heuristic"}</span>`,
    `<span>${escapeHtml(formatDate(paper.published))}</span>`,
    ...tags.slice(0, 4).map((tag) => `<span>${escapeHtml(tag)}</span>`),
  ].join("");

  els.detailTitle.textContent = paper.title || "";
  els.detailSummary.textContent = analysis.one_line_summary || paper.summary || "";

  const features = analysis.research_features || [];
  els.featureList.innerHTML = features.map((feature) => `<li>${escapeHtml(feature)}</li>`).join("") || "<li>暂无结构化特点</li>";
  els.directionText.textContent = analysis.research_direction || "暂无";
  els.routeText.textContent = analysis.research_route || "暂无";

  const related = analysis.related_work || [];
  els.relatedWorkBody.innerHTML = related
    .map(
      (row) =>
        `<tr><td>${escapeHtml(row.work || "")}</td><td>${escapeHtml(row.relation || "")}</td></tr>`
    )
    .join("") || "<tr><td colspan='2'>暂无</td></tr>";

  fillNotes(notes || {});

  els.paperLink.href = paper.link_abs || "#";
  els.paperPdfLink.href = paper.link_pdf || "#";
  els.analyzeBtn.disabled = !(state.mode === "live" && state.llmEnabled);
}

async function loadPaperDetail(arxivId) {
  if (!arxivId) return;

  if (state.mode === "live") {
    try {
      const payload = await fetchJson(`/api/papers/${encodeURIComponent(arxivId)}`);
      state.currentPaper = payload.paper;
      state.currentNotes = payload.notes;
      renderDetail();
      return;
    } catch (error) {
      showToast(`加载论文详情失败: ${error.message}`, true);
    }
  }

  const paper = state.papers.find((item) => item.arxiv_id === arxivId) || null;
  state.currentPaper = paper;
  state.currentNotes = loadLocalNotes(arxivId);
  renderDetail();
}

async function selectPaper(arxivId) {
  state.selectedId = arxivId;
  renderPaperList();
  renderHeader();
  await loadPaperDetail(arxivId);
}

async function reloadDashboard({ quiet = false } = {}) {
  try {
    const payload = await fetchJson("/api/bootstrap?limit=120");
    state.mode = "live";
    state.llmEnabled = Boolean(payload.llm_enabled);
    state.llmModel = payload.llm_model || "";
    state.papers = payload.papers || [];
    state.digest = payload.digest || {};
    state.ideas = payload.ideas || [];

    if (!state.selectedId || !state.papers.some((paper) => paper.arxiv_id === state.selectedId)) {
      state.selectedId = payload.selected_id || state.papers[0]?.arxiv_id || null;
    }
  } catch (error) {
    if (!quiet) {
      showToast(`在线接口不可用，切换演示模式: ${error.message}`, true);
    }
    const payload = await loadDemoData();
    state.mode = "demo";
    state.llmEnabled = Boolean(payload.llm_enabled);
    state.llmModel = payload.llm_model || "";
    state.papers = payload.papers || [];
    state.digest = payload.digest || {};
    state.ideas = loadLocalIdeas().concat(payload.ideas || []).slice(0, 40);
    state.selectedId = payload.selected_id || state.papers[0]?.arxiv_id || null;
  }

  renderCategories();
  renderPaperList();
  renderDigest();
  renderIdeas();
  renderHeader();
  await loadPaperDetail(state.selectedId);
}

async function onRefresh() {
  if (state.mode !== "live") {
    showToast("演示模式无法实时刷新。请用本地后端启动。", true);
    return;
  }

  els.refreshBtn.disabled = true;
  els.refreshBtn.classList.add("is-loading");
  els.refreshBtn.textContent = "更新中...";

  try {
    const payload = await fetchJson("/api/refresh", {
      method: "POST",
      body: JSON.stringify({ auto_llm_top_k: 3 }),
    });
    await reloadDashboard({ quiet: true });
    showToast(`刷新完成：抓取 ${payload.fetched} 篇，LLM 补充 ${payload.llm_enriched} 篇。`);
  } catch (error) {
    showToast(`刷新失败: ${error.message}`, true);
  } finally {
    els.refreshBtn.disabled = false;
    els.refreshBtn.classList.remove("is-loading");
    els.refreshBtn.textContent = "实时更新";
  }
}

async function onAnalyze() {
  if (!state.selectedId) {
    return;
  }
  if (state.mode !== "live") {
    showToast("演示模式不支持 LLM 解析", true);
    return;
  }
  if (!state.llmEnabled) {
    showToast("尚未配置 DEEPSEEK_API_KEY", true);
    return;
  }

  els.analyzeBtn.disabled = true;
  els.analyzeBtn.classList.add("is-loading");
  try {
    const payload = await fetchJson(`/api/papers/${encodeURIComponent(state.selectedId)}/analyze`, {
      method: "POST",
      body: JSON.stringify({ force: true }),
    });
    const updated = payload.paper;
    state.papers = state.papers.map((paper) => (paper.arxiv_id === updated.arxiv_id ? updated : paper));
    state.currentPaper = updated;
    renderPaperList();
    renderDetail();
    showToast("LLM 深度解析已完成。", false);
  } catch (error) {
    showToast(`LLM 解析失败: ${error.message}`, true);
  } finally {
    els.analyzeBtn.disabled = !(state.mode === "live" && state.llmEnabled);
    els.analyzeBtn.classList.remove("is-loading");
  }
}

async function onSaveNotes() {
  if (!state.selectedId) {
    return;
  }

  const notesPayload = {
    arxiv_id: state.selectedId,
    references_text: els.notesReferences.value,
    ideas_text: els.notesIdeas.value,
    questions_text: els.notesQuestions.value,
  };

  if (state.mode === "live") {
    try {
      const payload = await fetchJson(`/api/notes/${encodeURIComponent(state.selectedId)}`, {
        method: "PUT",
        body: JSON.stringify(notesPayload),
      });
      state.currentNotes = payload.notes;
      showToast("笔记已保存到本地 SQLite");
      return;
    } catch (error) {
      showToast(`保存失败: ${error.message}`, true);
      return;
    }
  }

  saveLocalNotes(notesPayload);
  state.currentNotes = notesPayload;
  showToast("笔记已保存到浏览器本地存储");
}

async function onAddIdea(event) {
  event.preventDefault();
  const content = (els.ideaInput.value || "").trim();
  if (!content) return;

  if (state.mode === "live") {
    try {
      const payload = await fetchJson("/api/ideas", {
        method: "POST",
        body: JSON.stringify({ content }),
      });
      state.ideas.unshift(payload.idea);
      state.ideas = state.ideas.slice(0, 40);
      renderIdeas();
      els.ideaInput.value = "";
      return;
    } catch (error) {
      showToast(`记录 idea 失败: ${error.message}`, true);
      return;
    }
  }

  const ideas = loadLocalIdeas();
  const item = { id: Date.now(), content, created_at: new Date().toISOString() };
  ideas.unshift(item);
  saveLocalIdeas(ideas.slice(0, 40));
  state.ideas = ideas.slice(0, 40);
  renderIdeas();
  els.ideaInput.value = "";
}

function bindEvents() {
  els.searchInput.addEventListener("input", () => {
    state.search = els.searchInput.value || "";
    renderPaperList();
    renderHeader();
  });

  els.categoryFilter.addEventListener("change", () => {
    state.category = els.categoryFilter.value;
    renderPaperList();
    renderHeader();
  });

  els.refreshBtn.addEventListener("click", onRefresh);
  els.analyzeBtn.addEventListener("click", onAnalyze);
  els.saveNotesBtn.addEventListener("click", onSaveNotes);
  els.ideaForm.addEventListener("submit", onAddIdea);
}

function startPolling() {
  if (state.pollHandle) {
    window.clearInterval(state.pollHandle);
  }

  state.pollHandle = window.setInterval(async () => {
    if (state.mode !== "live") return;
    const before = state.selectedId;
    await reloadDashboard({ quiet: true });
    if (before && state.papers.some((paper) => paper.arxiv_id === before)) {
      state.selectedId = before;
      await loadPaperDetail(before);
      renderPaperList();
      renderHeader();
    }
  }, 120000);
}

async function init() {
  bindEvents();
  await reloadDashboard();
  startPolling();
}

init().catch((error) => {
  showToast(`初始化失败: ${error.message}`, true);
});
