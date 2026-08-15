# DeepSeek × Luna Max 开放问题语料审计

审计日期：2026-08-14 至 2026-08-15。本文审计的是召回语料及清洗流水线，不把聚合站状态视为独立权威结论。

## 1. 母集与可复核性

v3 重抓 `raw_records.jsonl` 共 5,375 行，JSON 坏行 0。`manifest.json` 记录 expected/list=5,426、extracted=5,375、duplicate_occurrences=51、pages=109；`source_record_id` 与 `source_url` 均各自 5,375 唯一。全部记录的来源等级为 `S1-recall`、证据等级为 `C`。状态分布为 open 4,220、partial 963、closed 192；来源备注已明确这些状态只能作为召回证据。

109 页中，105 页各 50 条；第 1、4、7、109 页分别为 33、34、32、26 条。

## 2. 领域与难度

领域字段在 5,375 条中全部非空，共 17 类：Topology 1,210、Graph Theory 723、Number Theory 677、Geometry 601、Analysis 559、Dynamical Systems 420、Combinatorics 389、Group Theory 299、Probability 142、Algebra 124、Computer Science 57、Logic 50、Mathematical Physics 50、Partial Differential Equations 34、Algebraic Geometry 25、Set Theory 14、Miscellaneous 1。

难度字段在 5,375 条中全部非空：L1 916、L2 332、L3 3,428、L4 572、L5 127。Mathematical Physics 类共有 50 条，状态为 partial 27、open 22、closed 1；难度为 L3 30、L4 14、L5 6。

## 3. 垃圾、计划条目与抓取风险

`DARPA-*` 共 17 条，均为计划式 imperative prompt，而非边界清楚、可证伪的数学命题；其中 Mathematical Physics 标签有 4 条（DARPA-005、016、017、023）。`HIL-006` 同属计划型条目。合计 18 条应标记 `too-vague`，不进入正式数学物理候选。

抓取 artifact 包括：15 条含 literal `[source label:...]`、6 条含异常 `\\ u...`、29 条含疑似丢失 LaTeX 的 ` eq `、1 条含 `Jon es`。funcoid/reloid 相关 21 条可能是真实数学内容，不能自动视作 spam，但必须人工复核。

全部 5,375 条 preview 均以 `...` 结尾，最长 154 字符；短于 40 字符的有 25 条，短于 60 字符的有 170 条。因此所有使用 preview 的 DeepSeek 行都必须保留 `statement-truncated`。

## 4. 重复与 canonical 安全

标题完全重复有 57 组、涉及 178 行、超额 121 行；其中 21 组状态异质、2 组领域异质。preview 完全重复有 27 组、涉及 128 行、超额 101 行；其中 AMR-050-0001 至 AMR-050-0069 的 69 条记录因截断而发生同 preview 碰撞。

因此禁止按标题或截断 preview 自动去重。canonical 合并必须使用完整 statement/claim 指纹与经确认的标题别名，并保留每个 `source_record_id`、`source_url` 及 provenance。不足以证明逻辑等价时，只能标记 `possible-duplicate`。manifest 中 51 个 list-level duplicate 已在抓取层消除，但不能替代语义去重。

## 5. 本项目 D1–D4 召回分层

D1–D4 不是 UnsolvedMath 原生标签；清洗任务原生只要求 relevance 0–3。以下分层只用于本项目召回：

- D1：来源领域为 Mathematical Physics，共 50 条；排除 4 条 DARPA 计划条目与 HIL-006 后，正式数学物理候选为 45 条。
- D2-only：不在 D1 中的严格显式量子模型或量子算法 20 条。严格量子召回总量是 37，其中 17 条与 D1 重叠；剔除计划条目后的正式量子候选为 34，正式 MP/量子交集为 15。
- D3：物理原语关键词命中且不属于 D1/D2 的 280 条。这是高召回上界，包含词义误命中，必须经 DeepSeek 与人工二审。
- D4：其余 5,025 条，不作为本轮重点推介。

D1–D3 并集为 350 条，只表示候选召回，不等同正式收录或刘锦鹏老师认可。

## 6. DeepSeek 验收与发布阻断

当前 UnsolvedMath 主清洗批先处理 status=open 的 4,220 条。100 条批次出现输出长度上限后，流水线改为 25 条一批，共 169 个 chunk；已成功的 800 条按 `source_record_id` 迁移复用，只有完整覆盖一个新 chunk 的缓存才会被接受。每一批输入 N 行必须输出 N 行，ID 与顺序完全一致；最终必须有 169 个输出文件、总记录数 4,220。

每行必须具备清洗 schema 的 11 个字段，枚举与类型合法；status 不得无证据漂移。4,220 条均必须含 `statement-truncated` 与 `status-needs-verification`；`none` 不得与其他 quality flag 并存；relevance 必须是 0–3 整数；rationale 必须非空；非标准重复不得随意填写 `duplicate_hint`。

任一缺行、乱序、重复 ID、额外垃圾行、非法枚举、缺少 mandatory flags、或将 open 擅自改为 closed，均阻断该 chunk 发布。Luna Max 已对固定备份快照 `deepseek_cleaned_size100_backup/chunk-001..007.jsonl` 的 700 条逐条复核：schema、ID、顺序、枚举和两项强制 flag 均为 700/700 合格；语义上严格放行 389 条、退回 311 条。退回项包括 300 条仍使用合集/编号式泛标题的记录，以及 11 条 direction、domain、too-vague 或 duplicate hint 明确错误的记录。

随后又审计 25 条批次的 chunk 028–047，共 500 条，放行 442 条、退回 58 条。退回原因包括 5 条领域误标、合集/编号式题名、8 条遗漏 `statement-truncated`、7 条 `too-vague` 和 1 条乱码题名。两批审计存在 100 条输入区间重叠；按唯一 `source_record_id` 合并并应用“任一批拒绝即阻断”的保守规则后，UnsolvedMath 当前共有 736 条进入主表，而不是把两批放行数机械相加。每批审计分别物化为 `luna_audit*.json`，构建器合并全部审计文件，并让拒绝决定优先。

第三批审计覆盖 chunk 048–057 的 250 条，严格放行 167 条、退回 83 条；退回项主要是合集/编号式泛标题、强制 flag 缺失、方向或题名反转、`too-vague` 与不安全的 duplicate hint。三批审计合并、去除重叠并应用拒绝优先后，UnsolvedMath 当前主表为 903 条。

第四批审计覆盖 chunk 058–067 的 250 条，按相同口径放行 228 条、退回 22 条。`statement-truncated` 是必须保留的风险标记，但当 preview 仍给出明确量词、等式、界或分类目标时不自动阻断；本批实际退回的是 1 条遗漏强制截断标记，以及 21 条缺少目标、分支不完整或不可证伪的纲领性表述。UnsolvedMath 当前主表增至 1,131 条。

第五批审计覆盖 chunk 068–077 的 250 条，结构、ID、顺序、状态和两项强制标记全部通过，语义层放行 196 条、退回 54 条。退回项是主观或祈使式研究纲领、只含交叉引用或前文上下文的片段、目标缺失、proof-only 请求、泛描述，以及 6 条 DeepSeek 已标记的 `too-vague`。UnsolvedMath 当前主表增至 1,327 条。

第六批审计覆盖 chunk 078–087 的 250 条，放行 199 条、退回 51 条。退回项包括 4 条遗漏强制截断标记，以及泛标题、proof-only 请求、上下文残片、缺失结论和不可证伪的宽泛研究纲领。第七批 chunk 088–097 同为 250 条，放行 229 条、退回 21 条；其中 17 条是没有确定数学命题的 DARPA 计划条目，另有 3 条 `too-vague` 或 programmatic 记录和 1 条遗漏强制截断标记。UnsolvedMath 当前主表增至 1,755 条。

第八批 chunk 098–107 的 250 条均通过结构和强制标记检查，语义层放行 186 条、退回 64 条；退回项均为 visible preview 只有 setup/definition 而没有任何问题或断言目标的片段。第九批 chunk 108–117 最终放行 200 条、退回 50 条：首次输出中 `EP-75`/`EP-750` 顺序交换，DeepSeek 定点重跑后恢复 25/25 同序，Luna 复审仅保留 3 条 setup-only 退回；chunk 115 的 25 条 normalized title 仍只是“Erdős Problem #编号”而退回，另有 setup-only 片段和遗漏强制标记。UnsolvedMath 当前主表增至 2,141 条。

第十批 chunk 118–127 放行 193 条、退回 57 条，主要退回遗漏强制截断标记、setup-only Green/Kourovka 条目、宽泛 programme、定义片段，以及已解决或已否证却仍按 open 表述的 Hilbert 条目。第十一批 chunk 128–137 放行 194 条、退回 56 条，其中 50 条 Kirby 记录的 duplicate hint 仅是合集名，另有算法方向误标和非确定命题。第十二批 chunk 138–147 放行 120 条、退回 130 条：chunk 140 初次顺序错位，DeepSeek 定点重跑后恢复同序；但该 chunk 及相邻三块共 100 条 Kirby 记录仍因合集级 hint 被语义阻断，另有 5 条方向或 programme 错误。第十三批 chunk 148–157 放行 206 条、退回 44 条，退回项为 setup-only 片段、过泛定义、4 条强制标记缺失、1 条明确已解决记录和 1 条宽泛 Hilbert-12 计划。UnsolvedMath 当前主表增至 2,854 条。

尾批 chunk 158–162 共 125 条，放行 107 条、退回 18 条；chunk 163–165 共 75 条，放行 45 条、退回 30 条；chunk 166–168 共 70 条，放行 44 条、退回 26 条。退回项继续限定为 setup-only/no-target、强制截断标记缺失、明确 `too-vague` 或不可证伪的 programme。至此 UnsolvedMath 的 169 个 DeepSeek chunk、4,220 条 open 记录全部完成清洗且 ID/顺序一致，Luna 全覆盖审计后 3,050 条进入主表、1,170 条阻断。

## 7. 状态置信

来源 `status` 与 `status_raw` 的机械映射无不一致，但它们全部来自同一个 S1 聚合器。当前 4,220 条 open 记录都必须保留 `status-needs-verification`；partial 与 closed 尚未进入本轮 DeepSeek 主批。任何正式候选仍须由原论文、官方问题页或近期权威综述二次核验。

## 8. 跨来源扩展与 StackExchange 二审

流水线随后加入 Full Erdős、TheoremDB、Open Problem Garden、StackExchange/MathOverflow 和 Kourovka Notebook。Kourovka 21 版实际抽取 2,000 条，其中官方 solved archive 691 条已隔离为 closed；正文 1,309 条按 partial/uncertain 进入待清洗队列。这个口径使原始记录总量超过一万，但原始抓取量绝不等于高置信开放问题量。

Luna Max 对 StackExchange/MathOverflow 首批 400 条做了保守复核，仅放行 93 条，退回或阻断 307 条。退回构成为：结构错位 50 条、非公认/自拟或题面证据不足 151 条、问答/状态/讨论/资源帖 77 条、证明求助或核验帖 19 条、已关闭/已解决 10 条。两个错位 chunk 整批阻断，必须由 DeepSeek 按原 ID 顺序重跑后才能再次审计。StackExchange 帖子身份本身不构成“公认且仍开放”的证据。

第二批复核 chunk 016–025 的 250 条，结构全部合格，但严格口径仅放行 126 条、退回 124 条。复核中特别纠正了两条原先误放行的已解决问题：`mathoverflow-3307` 已有 Danzer set 反例，`mathoverflow-69099` 已有最短长度 `4π` 的接受证明；其余状态讨论、资料征集、证明求助和个人临时猜想也不升格为公开公认问题。

第三批复核 chunk 026–035 的 250 条同样结构完整，严格放行 114 条、退回 136 条。退回项仍以开放问题列表、文献/进展询问、证明求助、个人启发式或临时猜想、已解决记录和证据不足题面为主。StackExchange/MathOverflow 当前主表合计 333 条，其中 MathOverflow 240 条、Mathematics 93 条。

Luna Max 已对 TheoremDB 前 1,500 条完成逐行复核：schema、ID 和顺序全部一致，合并后 1,483 条放行、17 条退回修订。退回原因全部是命题方向被清洗文本强化、反转或丢失分支：例如把“证明或否证”写成既成定理、把存在性问题写成“不存在”、把存在/不存在二择题缩成单向结论，或在原题自身含正负冲突时擅自选择一边。最新 250 条仅退回 `P3080` 与 `P3124`，两者都是把 `Prove or disprove` 缩成肯定分支。TheoremDB 的结构质量显著高于社区问答源，但仍不能跳过语义忠实性检查。

Full Erdős 首批 500 条中，450 条来自结构完整的 DeepSeek chunk；其中 Luna Max 再退回题面自身含糊损坏的 #662，以及 25 条把“Erdős problem #编号”误作重复命名提示的记录，放行 424 条。修复后的 chunk 003 与 019 又逐条复审 50 条，放行 30 条、退回 20 条；退回项包括 17 条泛 duplicate hint，以及 3 条量词或边界改写。Full Erdős 当前主表合计 454 条。

Kourovka 首批 250 条中，chunk 000–007 的 200 条完成结构与语义审计，放行 190 条、退回 10 条；退回原因包括 status 漂移、存在/否证方向误标、题意反转、非标准 duplicate hint 和 3 条控制字符/OCR 污染。chunk 008–009 因 cleaned 输出缺失保持阻断，未计入审计分母。

Kourovka 第二批 chunk 010–019 的 250 条全部完成结构复核，放行 223 条、退回 27 条；退回项包括 14 条从 `uncertain` 擅自漂移到 `partial/closed` 的状态、方向或子问题丢失、泛 duplicate hint，以及 2 条 OCR 控制字符污染。

第三批 chunk 020–029 的 250 条结构同样完整，放行 225 条、退回 25 条。退回项包括 13 条状态漂移、4 条 OCR 控制字符、缺失决定性子问题上下文、泛 duplicate hint 和方向/结论丢失。

第四批 chunk 030–039 的 250 条无结构阻断，放行 228 条、退回 22 条。退回项集中在多子问分支或核心结论丢失、状态漂移、算法问题误标为构造问题、条件翻译错误和 yes/no 极性单向化。Kourovka 当前主表合计 866 条。

第五批 chunk 040–049 的 250 条结构完整，放行 152 条、退回 98 条。退回项中 80 条是把 raw `uncertain` 擅自改成 `open/partial/closed` 的状态漂移，其余是题面或多子问分支缺失、方向错误、泛 duplicate hint 和一条 OCR 控制字符污染。

末批 chunk 050–052 实际共有 59 条，结构、ID、顺序、状态与 OCR 检查均通过；Luna 放行 53 条、退回 6 条。退回项为四条多子问分支丢失或 claim direction 不忠实，以及两条泛 duplicate hint。Kourovka 当前主表合计 1,071 条；早期因输出缺失而阻断的 chunk 008–009 仍未计入主表。

Open Problem Garden 首批 250 条已完成逐行复核，放行 154 条、退回 96 条。退回项中有 79 条是伪装成代数问题的游戏作弊码、资源生成器或产品宣传页；其余是题面截断或过泛、命题分支丢失、非标准 duplicate hint、领域误标和状态漂移。原始聚合站的页面身份不构成数学问题证据，spam 记录不会通过改标签进入主表。

Open Problem Garden 第二批 250 条结构完整，Luna 语义层放行 126 条、退回 124 条；其中 109 条仍是游戏作弊/营销垃圾，其余是状态漂移、已解决、重复、截断或过泛记录。`laplacian_degrees_of_a_graph` 虽通过 Luna 分区，但 DeepSeek 仍保留 `too-vague`，因此继续受质量门阻断；第二批实际进入 canonical 主表 125 条。

OPG 剩余 chunk 020–028 共 213 条也已全部完成 DeepSeek 与 Luna 对齐复核，来源内审计先放行 117 条、退回 96 条；退回项包括 87 条非数学营销垃圾，以及题面过泛、截断、已解决或只有标题的重复记录。随后按截至 2026-08-16 的外部状态再退回 4 条已证明、已否证或有限版本已解决而原题范围不完整的记录。至此 OPG 的 713 条 raw records 已实现全量两级审计，392 条进入主表。

截止本次构建，网站主表共放行 6,783 条：TheoremDB 1,483、Kourovka 1,071、UnsolvedMath 3,050、Full Erdős 454、Open Problem Garden 392、StackExchange/MathOverflow 333。原始抓取 11,893 条、进入清洗队列 9,352 条，现已全部完成 DeepSeek 清洗；Luna 放行层累计 6,784 条，其中 1 条仍被 `too-vague` 质量门阻断，因此最终主表为 6,783 条。其余 2,569 条保持阻断。Open Problem Garden 的新增记录以 append-only chunk 方式进入 DeepSeek，旧审计 chunk 未被重排。
