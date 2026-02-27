# arxiv-digest

本目录提供一个可本地运行的三栏研究助手（界面按你给的 PDF 风格重构）：

- 左栏：实时论文列表（搜索/分类/优先级）
- 中栏：当天 digest + 焦点论文 + 零散 idea 流
- 右栏：单篇结构化分析 + 可持久化笔记（参考文献/想法/疑问）

## 1. 本地启动（实时模式）

```bash
python3 arxiv-digest/backend/server.py --host 127.0.0.1 --port 8502
```

打开：`http://127.0.0.1:8502` 或 `http://127.0.0.1:8502/arxiv-digest`

服务会：

- 拉取 arXiv API 最新论文（默认 `cs.CL, cs.AI, cs.LG, cs.CV`）
- 写入本地 SQLite：`arxiv-digest/backend/arxiv_digest.db`
- 定时轮询刷新（默认每 30 分钟）

常用参数：

```bash
python3 arxiv-digest/backend/server.py \
  --port 8502 \
  --categories cs.CL,cs.AI,cs.LG,cs.SE \
  --max-results 120 \
  --poll-minutes 20 \
  --auto-llm-top-k 3
```

## 2. 接入 DeepSeek LLM 解析

先设置环境变量（不要把密钥写进仓库）：

```bash
export DEEPSEEK_BASE_URL="https://api.deepseek.com"
export DEEPSEEK_API_KEY="<YOUR_DEEPSEEK_API_KEY>"
export DEEPSEEK_MODEL="deepseek-chat"
```

可选：设置你的研究兴趣，影响提示词：

```bash
export ARXIV_DIGEST_INTEREST="LLM Agent, CoT, RLVR, 低成本训练, 软件工程自动化"
```

启动后：

- 系统会对高优先级论文自动做少量 LLM 解析（`--auto-llm-top-k`）
- 右栏支持手动触发 `LLM 深度解析`

## 3. 子网站路径

静态页面位于：`/arxiv-digest`

- 在 GitHub Pages 上会显示页面骨架和演示数据（`data/demo.json`）
- 需要“实时追踪 + 笔记持久化 + LLM 解析”时，请用上面的本地后端启动方式

## 4. API（本地）

- `GET /api/bootstrap`
- `POST /api/refresh`
- `GET /api/papers/{arxiv_id}`
- `POST /api/papers/{arxiv_id}/analyze`
- `GET/PUT /api/notes/{arxiv_id}`
- `GET/POST /api/ideas`
- `GET /api/status`

