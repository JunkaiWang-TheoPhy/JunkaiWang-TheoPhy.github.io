# 公开数学物理问题：Codex/AI 可发表子题普查

> 截止 2026-08-13。阈值严格为 **工作流适合度 > 8.8/10**；这不是完整名题的解决概率。

## 结论

原始候选母集 303 个槽位，落盘 100 个可追溯审计决定，最终保留 85 个忠实、可独立发表的子题。覆盖 38 个领域，其中历史名题 37 个，此前对话未涉及 77 个。

这里最重要的修正是：**解决概率**与**工作流适合度**分开。前者问完整历史名题是否会被解决；后者问 Codex 能否在一个明确切片中完成“生成候选—独立证书—复现—论文叙事”的闭环。高分主要集中在有限维代数、固定图/圈数、有限秩范畴、计算机辅助动力系统、SDP/区间算术和可由第二种方法复核的数值—符号任务。

## 候选母集与选择偏差

303 是四个独立批次的原始候选槽位之和，不是 303 个互不重复的猜想。合并同题不同切片后，本文件落盘 100 个可追溯审计决定（85 个保留、15 个代表性排除）；其余槽位为重复、邻近切片或门槛以下条目，不伪造一个无法复算的‘精确去重总数’。

DeepSeek 独立扫描 87 个历史/公开候选，用作高召回生成器；Luna Max 第一轮分层扫描 64 个候选，并另开历史名题普查。模型输出不直接决定收录：已解决、复现型、物理接口不足或 verifier 不够强的候选进入排除审计。用户提供的筛法对话只贡献方法论——成熟框架内的参数搜索、分解恒等式和有理/区间证书——不作为数学物理问题来源。

## 评分方法

- 完整问题：`F/10 = 0.20(P+O+W+I+D)`。P=物理重要性，O=开放度，W=可判定性，I=物理接口，D=可分解性。
- 忠实子题：`AI/10 = 0.30·H(G,V)+0.20·B+0.20·R+0.15·N+0.15·Is`。G/V 为生成器/独立核验器，H 为调和平均；B benchmark，R 可复现，N 新颖性，Is 物理增量。
- 硬门槛：V<8.5 或 Is<7.5 时最高 8.8；仅数值拟合时 V≤7.5；已解决复现最高 8.5。
- 网页中的“闭环把握”是研究流程完成的定性分档，不是完整猜想在若干年内被解决的客观概率。

## 分层覆盖

| 领域 | 保留数 |
|---|---:|
| 量子多体 | 6 |
| 数学相对论 | 5 |
| 谱理论 | 5 |
| 拓扑量子场论 | 4 |
| 散射振幅 | 4 |
| 天体力学 | 3 |
| 量子信息 | 3 |
| 量子基础 | 3 |
| 量子场论 | 3 |
| 格点规范论 | 3 |
| 共形场论 | 3 |
| 格点统计物理 | 3 |
| 动力学PDE | 3 |
| 量子引力 | 3 |
| 概率统计力学 | 3 |
| 随机矩阵 | 3 |
| 可积系统 | 2 |
| 数值分析 | 2 |
| 拓扑量子物态 | 2 |
| 流体与PDE | 2 |
| 随机过程 | 2 |
| 量子复杂性 | 2 |
| 量子计算 | 1 |
| 变分力学 | 1 |
| 广义对称 | 1 |
| 正几何 | 1 |
| 动力系统 | 1 |
| 反问题 | 1 |
| 表示论物理 | 1 |
| 枚举几何 | 1 |
| 开放量子系统 | 1 |
| 量子控制 | 1 |
| 量子统计 | 1 |
| 量子计量 | 1 |
| 可积概率 | 1 |
| 几何分析 | 1 |
| 弦论与BPS | 1 |
| 量子拓扑 | 1 |

## 完整目录

| ID | 问题 / 忠实子题 | 时代与提出者 | 完整难题 / AI 子题 | 生成器 → 核验器 | 来源 |
|---|---|---|---:|---|---|
| DYN-03 | **平面三体对称周期轨道的分类**<br>固定质量、对称群和拓扑词，枚举新周期轨道并认证存在、非碰撞与非退化。 | 1770s–；Euler、Lagrange；现代 choreography 社区 | 8.2 / **9.3** | Fourier/射击搜索、连续 Newton、拓扑词枚举 → interval Newton/Krawczyk、validated ODE 与 Floquet 区间谱 | [ICM / 公开清单](https://www.crm.cat/wp-content/uploads/2022/06/bookQ-copy.pdf) |
| QEC-01 | **量子 LDPC 的阈值—码率—距离最优权衡**<br>对一个显式好量子 LDPC 族，在电路级噪声下构造译码器并认证有限尺寸阈值下界。 | 1990s–；Calderbank–Shor–Steane；LDPC 社区 | 8.4 / **9.4** | 码族/译码器搜索、张量网络和 RL → GF(2) 精确检查、综合故障注入与置信区间 | [综述](https://arxiv.org/abs/2103.06309) |
| YB-01 | **Yang–Baxter 方程谱参数解的有限维分类**<br>固定局域维数 d≤4 与多项式/有理非差分型 ansatz，枚举规范等价类并给出完备性或最小反例证书。 | 1967–1972；C. N. Yang；R. J. Baxter | 7.4 / **9.4** | 神经候选搜索、符号回归、Gröbner 分解 → 逐项精确代回 YBE，核验 unitarity、crossing 与转移矩阵对易 | [综述](https://arxiv.org/abs/hep-th/9404143) |
| QEC-04 | **SIC-POVM 的全维存在性：固定未解维数切片**<br>在一个尚无精确闭式的固定维数寻找 SIC，并给出精确代数数、Galois 轨道和 Gram 矩阵证书。 | 1999；Gerhard Zauner | 8.9 / **9.3** | 高精度非线性求解、代数数识别、群轨道搜索 → 等角条件精确代回、PSD 与独立数域计算 | [综述](https://journals.aps.org/prxquantum/abstract/10.1103/PRXQuantum.3.010101) |
| QCIR-01 | **容错逻辑态制备/线路最优化的有限实例**<br>固定码、门集和硬件图，寻找最短 encoder/flag 电路并证明在给定故障模型下最优。 | 1990s–；Shor；Steane；容错社区 | 8.5 / **9.2** | RL、ZX 重写、SAT/ILP → Clifford tableau、穷举故障注入与下界证书 | [综述](https://arxiv.org/abs/2402.17761) |
| TQFT-01 | **秩六及以上幺正模张量范畴分类**<br>在一个固定 Galois/群论约束下完成 rank-6 单位ary modular tensor category 分类。 | 1980s–；Reshetikhin–Turaev；融合范畴社区 | 7.2 / **9.2** | 融合环枚举、数值代数几何、SAT → pentagon/hexagon 精确求解、unitarity 与等价消重 | [综述](https://arxiv.org/abs/1908.07128) |
| DYN-04 | **三体 choreography 的作用量全局极小性**<br>对固定对称/同伦类，将候选轨道的严格上界与所有竞争路径的分块下界闭合。 | 2000s；Chenciner–Montgomery 等 | 8.8 / **9.2** | 谱配置搜索、对称约化、全局分支定界 → 区间变分、碰撞排除和覆盖全部竞争盒的证书 | [ICM](https://icmconjectures.com/2002-mathphys-125) |
| ML-02 | **格点规范论的 loop/positivity bootstrap**<br>对固定维数、规范群和有限 Wilson-loop 截断，收紧一个质量隙/plaquette 严格界并证明收敛方向。 | 2020s；现代 lattice bootstrap 社区 | 8.7 / **9.2** | loop 方程生成、SDP/正性约束搜索 → 对偶可行证书、强弱耦合极限和 Monte Carlo 交叉 | [综述](https://arxiv.org/abs/2404.17071) |
| LAT-04 | **有限密度 QCD 符号问题的可证 toy model**<br>在重密度或低维规范 toy model 中证明一种 dual/thimble/complex-Langevin 算法无偏并给方差界。 | 1980s–；有限密度格点 QCD 社区 | 7.0 / **9.1** | 复积分 contour 搜索、张量网络与符号重权 → 精确配分函数、Ward 恒等式和体积缩放审计 | [综述](https://arxiv.org/abs/2108.12423) |
| AMP-02 | **椭圆与多尺度 Feynman 积分的规范微分方程**<br>对一个固定两圈椭圆拓扑寻找并认证 ε-分解基底、字母表和边界常数。 | 1990s–；IBP/DE 社区 | 8.0 / **9.5** | 有限域 IBP、基底搜索、有理重构 → IBP 恒等式、微分方程残差、sector decomposition 高精度点 | [综述](https://arxiv.org/abs/2203.13014) |
| CB-01 | **三维 Ising CFT 的混合相关器 bootstrap**<br>加入一个明确混合相关器，收紧单个 OPE 系数或谱隙界，并给任意精度对偶可行证书。 | 1970s / 2012–；Wilson；现代数值 bootstrap 社区 | 8.8 / **9.4** | 共形块生成、SDP 功能泛函搜索 → SDPB 高精度正性、区间算术与独立截断复算 | [综述](https://arxiv.org/abs/1805.04405) |
| NUM-01 | **半经典 Schrödinger 的 asymptotic-preserving 算法**<br>在 1D/2D 明确势与短中时间内构造 uniform-in-ℏ 的可观测量误差 O(ℏ^p) 算法。 | 1926–；Schrödinger；半经典数值社区 | 8.2 / **9.4** | WKB/FGA 符号展开、自动微分和网格搜索 → 区间稳定性、独立 split-step/FEM 与误差定理 | [ICM](https://icmconjectures.com/2010-numcs-40) |
| AMP-03 | **颜色—运动学对偶与 double-copy 的高圈构造**<br>为固定五点三圈拓扑求 BCJ 分子，并输出 Jacobi 与 generalized unitarity 机器证书。 | 2008–；Bern–Carrasco–Johansson | 7.5 / **9.2** | 图枚举、线性/多项式约束求解 → 全部切割、Jacobi 恒等式与独立数值点 | [综述](https://arxiv.org/abs/2203.13011) |
| DYN-01 | **现实行星模型中的 Arnold 扩散**<br>在一个固定 Sun–Jupiter–asteroid 或空间三体模型中认证一条漂移轨道并给扩散时间界。 | 1964；Vladimir Arnold | 7.8 / **9.2** | 正规形自动化、共振网搜索、validated numerics → 区间 shadowing、Melnikov/分裂界与独立积分 | [公开清单 / 综述](https://www.crm.cat/wp-content/uploads/2022/06/bookQ-copy.pdf) |
| ISDM-01 | **非理想周期晶格上的临界 Ising/dimer 极限**<br>对一个弱非均匀或双周期晶格证明关联/高度场收敛 CFT/GFF 并给误差。 | 1930s–；Ising/dimer 社区 | 7.9 / **9.2** | Pfaffian、离散解析函数与数值猜测 → determinantal 恒等式、tightness 与离散 Green 函数 | [综述](https://arxiv.org/abs/2110.09372) |
| LAT-03 | **4D Yang–Mills 存在性与质量隙的格点切片**<br>在固定 SU(2) Wilson 格点与受控极限中证明反射正性、谱隙统一下界或连续极限的一个 OS 公理。 | 1954 / 2000；Yang–Mills；Clay 问题由 Jaffe–Witten 表述 | 6.4 / **9.1** | 强耦合簇展开、格点 bootstrap、传递矩阵谱搜索 → 反射正性、区间谱界和不同体积/格距一致性 | [公开清单](https://www.claymath.org/millennium/yang-mills-the-maths-gap/) |
| PDE-04 | **相对论 Vlasov–Maxwell 小数据全局性**<br>对周期或外部场中的一个小数据类证明全局存在、衰减与明确常数。 | 1930s–；Vlasov；Maxwell | 7.6 / **9.1** | 特征线/能量层级搜索、数值 bootstrap → 双线性估计、守恒量和 interval-PDE 残差 | [综述](https://link.springer.com/article/10.12942/lrr-2005-2) |
| QEC-05 | **六维最大互无偏基组**<br>分类或排除一个明确的六维复 Hadamard 参数族，给等价群轨道和不可扩张证书。 | 1960 / 1981；Schwinger；Ivanović | 8.8 / **9.1** | Hadamard 枚举、SAT/Gröbner 与 interval branch-and-bound → 精确正交/等模条件、轨道覆盖和独立求解器 | [综述](https://journals.aps.org/prxquantum/abstract/10.1103/PRXQuantum.3.010101) |
| FUS-01 | **低秩 fusion ring 到 unitary category 的实现**<br>枚举秩≤6 的整数 FP 维 fusion rings，并对一个新环求全部 unitary pentagon/hexagon 解。 | 2000s–；Etingof–Nikshych–Ostrik 等 | 7.2 / **9.0** | 有限融合规则、6j-symbol 与数值代数几何 → 精确 coherence、unitarity、Galois 与等价消重 | [综述](https://arxiv.org/abs/math/0203060) |
| LAT-02 | **一般边界六顶点模型的非临界关联函数**<br>在非自由费米点计算一个有限尺寸边界关联函数并认证 determinant/多重积分公式。 | 1960s–；Lieb、Sutherland、Baxter 等 | 7.9 / **9.0** | algebraic Bethe ansatz、行列式 ansatz → 精确对角化、Bethe 方程残差和渐近极限 | [综述](https://arxiv.org/abs/cond-mat/0304309) |
| ML-05 | **任意子凝聚的显式格点边界实现**<br>对一个小秩 UMTC 和 condensable algebra 构造 commuting-projector/PEPS 边界并核验全 excitation map。 | 2010s–；Bais–Slingerland；Kong 等 | 8.1 / **9.0** | 范畴数据、张量网络与局域项合成 → pentagon/half-braiding、谱隙小系统与边界扇区 | [综述](https://arxiv.org/abs/1307.8244) |
| QEC-03 | **现实噪声下的鲁棒 self-testing**<br>对一个固定 Bell 不等式和探测器噪声模型导出近最优鲁棒常数与有限统计证书。 | 1990s–；Mayers–Yao 等 | 8.4 / **9.0** | NPA/SDP 对偶搜索、符号不等式 → 解析 SOS 证书、独立 NPA 层级与模拟 | [综述](https://arxiv.org/abs/1702.01931) |
| TQFT-04 | **融合 2-范畴与广义对称 anomaly**<br>对一个有限 2-group 在 3+1D 枚举 anomaly 类并构造匹配边界/反例。 | 2010s–；高阶对称/SymTFT 社区 | 7.1 / **9.0** | 群上同调、bordism 与 coherence 方程枚举 → coboundary、pentagonator 与 anomaly inflow 独立检查 | [综述](https://arxiv.org/abs/2205.05096) |
| GR-05 | **临界引力坍缩的严格指数**<br>在 Einstein–scalar 或 Einstein–Yang–Mills 的一个对称类中认证自相似临界解和一个不稳定本征值。 | 1993；Matthew Choptuik | 8.1 / **8.9** | 自适应数值、self-similar ansatz、谱求解 → 区间本征值、独立离散化与守恒检查 | [综述](https://doi.org/10.1007/S10714-019-2559-5) |
| PDE-06 | **高频 Helmholtz 的无污染认证算法**<br>对一个 hp-FEM/预条件器区间证明 k-uniform quasi-optimality 并提供可运行误差证书。 | 1940s–；Helmholtz 方程数值分析社区 | 8.7 / **8.9** | 网格/阶数搜索、自动残差估计 → 后验区间界与 manufactured solution 交叉 | [综述](https://arxiv.org/abs/1510.06479) |
| RIG-01 | **费米 Hamiltonian 的 sign-free 基变换分类**<br>对一个明确相互作用图族分类全部局域基变换中可 stoquastic/sign-free 的实例。 | 1980s–；量子 Monte Carlo 社区 | 7.2 / **8.9** | SAT/图搜索、局域酉参数化 → 精确矩阵元符号、复杂性归约与独立枚举 | [综述](https://arxiv.org/abs/1802.03408) |
| ML-01 | **局域 Hamiltonian 学习的可证稀疏切片**<br>对一个 k-local、有限温或短时可访问模型，给样本复杂度和稳定重构的端到端证书。 | 2010s–；量子 Hamiltonian learning 社区 | 8.8 / **9.3** | 实验设计、稀疏回归、符号交换子生成 → 保留数据盲测、区间置信集与独立量子模拟 | [综述](https://arxiv.org/abs/2004.07266) |
| AMP-04 | **固定图的 Landau 奇点与物理片区**<br>枚举二至三圈给定图的 Landau 方程分支，判定物理片区并给出解析延拓证书。 | 1959；Lev Landau | 7.2 / **9.2** | 图生成、消元、数值代数几何 → 精确 Landau 方程、微分方程与独立积分的支切检查 | [综述](https://arxiv.org/abs/2203.13014) |
| ALG-02 | **有限 (n,k) amplituhedron 的 canonical form**<br>固定小 (n,k,L) 枚举 triangulation，精确计算 canonical form 并核对 BCFW 表达式。 | 2013–；Arkani-Hamed–Trnka 等 | 7.6 / **9.1** | 正几何/cluster 枚举、符号 residue → 有理函数恒等式、正性和独立振幅软件 | [ICM](https://icmconjectures.com/2022-alg-178) |
| CHIR-01 | **无异常手征规范理论的格点镜像费米子解耦**<br>对一个指定无异常表示证明强 Yukawa 区镜像费米子质量化且不破坏规范/手征对称。 | 1980s–；Eichten–Preskill；Ginsparg–Wilson 社区 | 7.0 / **9.0** | 强耦合相图、张量网络与 Monte Carlo → Ward 恒等式、anomaly matching 与独立谱测量 | [综述](https://arxiv.org/abs/1003.5896) |
| FAST-01 | **快慢混沌系统的扩散极限**<br>在显式 mixing 条件下对一个 3-DOF 快慢流证明慢变量扩散极限并计算 Green–Kubo 系数。 | 1970s–；Khasminskii；确定性均匀化社区 | 8.0 / **9.0** | 轨道积分、Poisson 方程与平均化 ansatz → martingale CLT、残差区间界和独立模拟 | [综述](https://arxiv.org/abs/1803.06137) |
| PDE-02 | **湍流异常耗散与结构函数的可证模型**<br>在一个 shell model 或受限随机 Navier–Stokes 模型证明异常耗散/单个结构函数指数。 | 1941；Andrey Kolmogorov | 7.0 / **9.0** | DNS、闭合 ansatz 与多重分形拟合 → 能量通量恒等式、独立 ensemble 和概率界 | [综述](https://arxiv.org/abs/2101.03761) |
| INV-01 | **受限 Lorentz 时空的波响应反问题**<br>在静态/球对称或小扰动度规类中，从有限源—响应数据恢复一个度规分量并给稳定性。 | 2000s–；Kurylev–Lassas–Uhlmann 等 | 7.5 / **8.9** | 有限元边界控制、参数反演 → Carleman/唯一性估计、合成数据与区间误差 | [综述](https://doi.org/10.1007/s00222-017-0780-y) |
| ALG-01 | **有限秩 current algebra fusion product**<br>固定 sl2/sl3 与有限权，证明 fusion product 参数无关性并给 PBW/Hilbert 证书。 | 1990s–；Feigin–Loktev 等 | 7.8 / **9.2** | 非交换 Gröbner、PBW 基与 fermionic 公式搜索 → 精确 GB/PBW 计算和 Lean/Coq 小核验 | [ICM](https://icmconjectures.com/2014-mathphys-32) |
| ML-03 | **矩阵量子力学的谱/热力学 bootstrap**<br>对一个有限 N 矩阵模型用矩正性和 Ward 恒等式给基态能/热力学量严格上下界。 | 1996–；BFSS；现代数值 bootstrap 社区 | 8.1 / **9.1** | 矩方程生成、SDP 与高精度拟合 → 对偶可行性、Monte Carlo 与已知大 N/微扰极限 | [综述](https://arxiv.org/abs/2004.10212) |
| ALG-03 | **有限 quiver/CY3 的 DT 壁穿越**<br>对一个有限 quiver（含 potential）枚举稳定 chamber 并精确验证 KS/Joyce–Song 生成函数恒等式。 | 1990s–；Donaldson–Thomas；Kontsevich–Soibelman | 7.0 / **9.0** | quiver mutation、chamber 与生成函数枚举 → Hall algebra/壁穿越乘积和精确系数 | [综述](https://arxiv.org/abs/0811.2435) |
| DYN-02 | **太阳系长期稳定性的严格子系统界**<br>把 Nekhoroshev/KAM 的计算机辅助界推进到一个真实质量的四体子系统。 | 1890s–；Poincaré；Kolmogorov–Arnold–Moser | 7.2 / **9.0** | 高阶正规形、整数关系约化、区间计算 → 小分母、twist 条件和区间余项 | [公开清单 / 综述](https://www.crm.cat/wp-content/uploads/2022/06/bookQ-copy.pdf) |
| LAT-07 | **二维有隙量子系统的面积律子类**<br>对一个 commuting-projector 或弱纠缠二维子类证明面积律并构造可控 PEPS 近似。 | 1990s–；Bekenstein；量子信息/多体社区 | 7.0 / **9.0** | 准绝热延拓、张量网络与局域分解搜索 → Lieb–Robinson、熵不等式和精确 contraction 小例 | [综述](https://arxiv.org/abs/1306.1501) |
| OPQ-01 | **有限维 Lindblad 生成元的最优谱隙界**<br>对一个局域耗散链族自动发现并证明 mixing time/谱隙的紧界。 | 1970s–；Gorini–Kossakowski–Sudarshan–Lindblad | 8.2 / **8.9** | Lyapunov/对数 Sobolev ansatz、SDP → 生成元谱、complete positivity 和区间线性代数 | [综述](https://arxiv.org/abs/1210.7127) |
| PROB-02 | **WASEP 到 KPZ 的定量极限**<br>对一个新初值/弱非对称率证明 1:2:3 缩放到 KPZ，并给离散误差界。 | 1980s–；Gärtner；Bertini–Giacomin 等 | 8.6 / **9.3** | 生成元与鞅分解自动化、正则结构模板 → tightness、martingale problem 与独立模拟 | [综述](https://arxiv.org/abs/1106.1591) |
| CTRL-01 | **有限维开放量子系统的鲁棒反馈综合**<br>固定 Lindblad/Kraus 系统和目标子空间，综合反馈律并证明全局及参数鲁棒收敛。 | 2000s–；Wiseman–Milburn；量子控制社区 | 8.0 / **9.2** | 控制律搜索、Lyapunov/SOS/SDP → Lyapunov 不等式、谱隙和独立主方程模拟 | [综述](https://arxiv.org/abs/1210.7127) |
| FQH-01 | **给定模数据的拓扑序/整格实现**<br>给定小秩 K 矩阵或模数据，搜索 UMTC/整格实现并检查边界 anomaly 与局域模型候选。 | 1980s–；Laughlin；Chern–Simons/FQH 社区 | 7.8 / **9.2** | 整数格、模表示、SAT/ILP → S,T、Verlinde、unitarity 与独立边界条件 | [综述](https://arxiv.org/abs/1212.5121) |
| LAT-01 | **三维最近邻 Ising 模型的受限解析定理**<br>对各向异性切片或高温区证明一个新的 susceptibility/自然边界/系数渐近定理。 | 1920s–；Lenz–Ising；Onsager 后续问题 | 6.9 / **9.2** | 高阶级数、transfer matrix、符号恒等式搜索 → 整数/有理系数复算、cluster expansion 与独立 Monte Carlo | [综述](https://arxiv.org/abs/2205.12357) |
| PDE-01 | **三维 Navier–Stokes 正则性的计算机辅助子类**<br>对一个轴对称/离散自相似/大数据参数族，用区间 PDE 排除有限时 blow-up 或闭合正则性判据。 | 1934 / 2000；Leray；Clay 问题由 Fefferman 表述 | 6.5 / **9.2** | 能量泛函搜索、interval CFD、bootstrap 猜测 → 严格残差、后验误差估计与独立网格 | [公开清单](https://www.claymath.org/millennium/Navier-Stokes-Equation/) |
| GR-02 | **极端 Kerr 的非线性稳定性**<br>对近极端外部区域的一个扰动类建立统一衰减与非线性闭合估计。 | 1963–；Roy Kerr；现代稳定性计划 | 8.0 / **9.1** | vector-field multiplier 搜索、张量恒等式自动化 → 独立能量估计、规范约束与模式数值 | [综述](https://doi.org/10.1007/S10714-019-2559-5) |
| HOLO-01 | **黑洞信息的有限模型 Hilbert 空间因子化**<br>在具体 JT+物质或有限 N holographic toy model 构造内部算符、因子化 Hilbert 空间与可验证解码协议。 | 1976–；Hawking；Page；全息社区 | 7.0 / **9.1** | replica/矩阵积分、张量网络和量子线路 → unitarity、相对熵、代数因子化与独立谱计算 | [综述](https://adscft.org/black-hole-information/frontiers/open-problems/) |
| KPZ-02 | **2+1 维 KPZ 指数与极限律**<br>对一个指定离散增长模型给出可重复有限尺寸分析，并证明一个非平凡指数界或弱非线性极限。 | 1986；Kardar–Parisi–Zhang | 7.3 / **9.1** | GPU Monte Carlo、正则化群候选、统计推断 → 独立随机种子、有限尺寸误差审计与解析上下界 | [综述](https://arxiv.org/abs/1809.00803) |
| LAT-06 | **多体局域化的强无序稳定区**<br>对一个指定 1D 局域 Hamiltonian 和无序分布证明 LIOM 指数局域及小扰动稳定。 | 2005–；Basko–Aleiner–Altshuler 等 | 7.5 / **9.1** | ED/张量网络、LIOM ansatz 与图展开 → 多尺度分析、纠缠/输运界和独立动力学 | [综述](https://arxiv.org/abs/2403.07111) |
| PROB-01 | **随机正则图 hard-core 模型的阈值与混合**<br>固定度数 Δ，严格定位 uniqueness/cavity 阈值或证明一个采样算法的快混合区间。 | 1980s–；Dobrushin；Bethe/cavity 社区 | 7.8 / **9.1** | 树递推、belief propagation、小图反例搜索 → 收缩/聚合函数、概率界与独立枚举 | [ICM](https://icmconjectures.com/2002-mathphys-121) |
| RSP-01 | **结构化随机矩阵的极限矩**<br>固定 link function，枚举配对词并证明极限矩序列、唯一谱律与一个局部修正。 | 1970s–；Toeplitz/Hankel 随机谱社区 | 8.0 / **9.1** | 配对词/图枚举、符号矩生成 → 矩法、Carleman、正定性和独立谱模拟 | [综述](https://www.isical.ac.in/~statmath/report/54978-14.pdf) |
| YB-02 | **高秩 qKZ 方程的联络矩阵与单值化**<br>对固定 U_q(sl3) 表示与边界数据计算联络矩阵，严格验证 braid/monodromy 关系。 | 1990s；Frenkel–Reshetikhin 等 | 8.1 / **9.1** | 精确递推、特殊函数基底搜索、数值解析延拓 → 符号 braid 关系与高精度独立 monodromy 复算 | [综述](https://arxiv.org/abs/q-alg/9602024) |
| CB-02 | **边界与界面共形 bootstrap**<br>对一个指定 3D bulk/2D defect 系统建立 crossing 方程并得到可复核的谱界。 | 1980s–；Cardy 等 | 8.2 / **9.0** | 缺陷共形块、功能泛函与 SDP → 反射正性、交叉残差、独立 SDPB | [综述](https://arxiv.org/abs/1805.04405) |
| ETH-01 | **固定非可积自旋链的强 ETH 界**<br>对一个明确非可积局域链证明微正则窗内本征矩阵元偏差的尺寸界。 | 1991–；Deutsch；Srednicki | 7.2 / **9.0** | 谱统计、局域观测与随机矩阵 ansatz → 独立 resolvent/浓缩估计和有限尺寸严格包络 | [综述](https://arxiv.org/abs/1509.06411) |
| QEC-07 | **QMA 与 QCMA 的受限分离**<br>在一个明确 oracle/query 模型构造 QMA≠QCMA 分离，量化量子见证优势。 | 2000s；Watrous；Aharonov–Naveh 等 | 8.3 / **9.0** | 随机 oracle、通信协议与 SDP → adversary/diagonalization 下界和独立 query 计数 | [综述](https://arxiv.org/abs/2109.06917) |
| QSP-01 | **固定解析势的准周期谱相图**<br>对一个指定解析准周期势，按 Lyapunov 指数与频率算术条件证明一段 AC/SC/PP 谱相图。 | 1970s–；Aubry–André；Avila 等 | 7.9 / **9.0** | 转移矩阵、有限频率近似和 Lyapunov 数值 → reducibility/LDT 定理与谱测度独立计算 | [ICM](https://icmconjectures.com/2022-mathphys-83) |
| GR-03 | **AdS 时空的非线性稳定性/弱湍流**<br>固定对称初值族，证明一个能量级联分支或一个非线性稳定岛。 | 1990s / 2011–；Bizoń–Rostworowski 等 | 7.5 / **8.9** | 谱 Galerkin、共振图枚举、长时积分 → 守恒量、误差控制与独立高精度演化 | [综述](https://arxiv.org/abs/1708.05600) |
| INV-02 | **非自伴随机算子的共振统计**<br>对一个稀疏非 Hermitian ensemble 推导极限共振密度或离群值定理。 | 1990s–；开放量子系统/随机算子社区 | 7.7 / **8.9** | resolvent 展开、随机矩阵模拟 → pseudospectrum、奇异值界与独立抽样 | [综述](https://arxiv.org/abs/1609.06686) |
| PDE-03 | **有边界 Boltzmann 方程的流体极限**<br>在一个有界几何和指定 accommodation law 下证明到 Navier–Stokes 的极限并控制边界层。 | 1872 / 1900；Boltzmann；Hilbert 第六问题 | 7.7 / **8.9** | Hilbert/Chapman–Enskog 展开与 DSMC → 熵方法、谱隙和独立数值残差 | [综述](https://arxiv.org/abs/1009.3663) |
| PDE-05 | **低正则 Landau 阻尼与 plasma echoes**<br>对 Penrose 稳定平衡和指定 Sobolev 指数证明衰减率或精确构造 echo 阻碍。 | 1946；Lev Landau | 7.8 / **8.9** | 频率共振图、Volterra 核展开与谱模拟 → 能量估计、echo 级联界和独立数值 | [综述](https://doi.org/10.1007/s40818-016-0008-2) |
| SCAR-01 | **PXP/规范链中量子 scar 的可证持久性**<br>对一个变形 PXP 或 gauge 链分类嵌入 scar 态并给微扰下寿命下界。 | 2017–；Bernien 等；scar 社区 | 8.2 / **8.9** | ED/DMRG、代数 ladder ansatz → 本征残差、动力学复现与扰动论界 | [综述](https://arxiv.org/abs/1711.09656) |
| SPEC-03 | **有边界混沌台球的量子唯一遍历率**<br>为一个散射台球证明量子方差衰减率，或排除一类 scar 序列。 | 1970s–；Bohigas–Giannoni–Schmit；Rudnick–Sarnak | 7.6 / **8.9** | 周期轨道/迹公式枚举、谱数值 → microlocal 估计、边界项与独立本征函数计算 | [综述](https://arxiv.org/abs/math/0507164) |
| AMP-01 | **非平面多圈规范理论振幅 bootstrap**<br>固定五点三圈的一个非平面颜色分量，从幺正切、Steinmann 与对称性约束重构解析表达式。 | 1980s–；Bern–Dixon–Kosower 等 | 7.3 / **9.4** | 图拓扑枚举、有限域采样、符号 ansatz → Jacobi/幺正切、软共线极限与独立数值相空间点 | [综述](https://arxiv.org/abs/2203.13011) |
| LAT-05 | **二维 Hubbard 模型的配对关联界**<br>固定 U/t、掺杂与几何，严格上下夹逼 d-wave pairing susceptibility 或排除某相。 | 1963；John Hubbard | 7.1 / **9.3** | DMRG/AFQMC、变分态和不等式猜测 → 无符号子域、不同张量网络、有限尺寸与解析界交叉 | [综述](https://par.nsf.gov/servlets/purl/10320097) |
| GR-01 | **旋转/带电黑洞内部的强宇宙监督**<br>对一个亚极端 Kerr–de Sitter 参数区证明合适正则性版本的不可延拓。 | 1969；Roger Penrose | 8.2 / **9.2** | PDE bootstrap 层级与符号张量计算 → 能量估计、蓝移/衰减率比较与严格数值 | [综述](https://arxiv.org/abs/1602.03837) |
| RBM-01 | **随机带矩阵的固定参数局部化—GOE 转变**<br>固定一维带宽尺度和能区，证明一个局部律/本征向量离域或 crossover 子定理。 | 1990s–；Fyodorov–Mirlin 等 | 7.4 / **9.2** | 谱/本征向量统计、resolvent 图展开 → Green-function comparison、moment flow 与独立数值 | [综述](https://arxiv.org/abs/1205.5669) |
| QMET-01 | **多参数量子 Cramér–Rao 界的可饱和性**<br>对一个有限维含噪多参数族判定 Holevo 界与 SLD 界何时相等并构造最优测量。 | 1960s–；Helstrom；Holevo | 8.1 / **9.0** | Fisher 信息、POVM 枚举与 SDP → Holevo bound 解析、PSD 与独立数值 | [综述](https://journals.aps.org/prxquantum/abstract/10.1103/PRXQuantum.3.010101) |
| YB-03 | **带边界随机顶点模型与 KPZ 极限**<br>为一个新的可积边界族导出精确电流涨落核，并证明概率权重非负及 KPZ 缩放极限。 | 2010s；Borodin–Corwin 等 | 8.4 / **9.0** | Bethe ansatz、边界 K 矩阵搜索、Monte Carlo → 随机性逐项检查、Fredholm 行列式渐近与独立模拟 | [综述](https://arxiv.org/abs/1703.07314) |
| GR-04 | **含角动量/电荷的 Penrose 不等式**<br>对轴对称最大初始数据和一个明确电荷条件证明强化 Penrose 不等式。 | 1973；Roger Penrose | 8.3 / **8.9** | 几何流候选、符号变分与 SDP/SOS → 几何不等式链、边界项与数值极值检查 | [综述](https://arxiv.org/abs/1602.03837) |
| RMT-01 | **稀疏相关随机矩阵的局部普适性**<br>对一个明确稀疏相关 ensemble 证明 bulk 或 edge 局部律及最小奇异值界。 | 1950s–；Wigner；现代局部律社区 | 8.2 / **8.9** | 矩/累积量展开、近核向量搜索 → 小球概率、Green 函数比较与独立谱模拟 | [综述](https://arxiv.org/abs/2202.00669) |
| KPZ-01 | **一般初值/边界下的 KPZ 固定点普适性**<br>证明一个可积模型的指定非可积扰动或初值类收敛到同一 KPZ 固定点。 | 1986；Kardar–Parisi–Zhang | 8.0 / **9.3** | 耦合构造、随机模拟、尺度律发现 → tightness、鞅问题、可积极限基准 | [综述](https://arxiv.org/abs/1506.04131) |
| PROB-03 | **定向聚合物自由能与 KPZ 涨落切片**<br>对一个指定 i.i.d. 或近可积环境证明自由能变分式并控制一个涨落指数界。 | 1980s–；Huse–Henley；Kardar 等 | 7.9 / **9.2** | 动态规划、Monte Carlo 与变分候选 → 次可加性、集中不等式和可积核基准 | [综述](https://arxiv.org/abs/1311.3016) |
| QEC-02 | **量子 PCP 猜想的受限 gap amplification**<br>对一个指定 k-local Hamiltonian/量子码族构造保持局域性的常数 gap 放大，或给出严格不可能性。 | 2006–；Aharonov 等 | 8.0 / **9.2** | 局域 gadget、SAT/编码器搜索 → 谱界、QMA 归约与 proof assistant 小引理 | [综述](https://arxiv.org/abs/1309.7495) |
| QEC-06 | **NPT bound entanglement 的对称族判定**<br>在 3×3 或 4×4 指定对称态族中构造 NPT 不可蒸馏证书，或给出统一蒸馏协议。 | 1998–；DiVincenzo–Shor–Smolin 等 | 8.7 / **9.1** | 随机密度矩阵、正映射与 SDP 搜索 → 部分转置谱、k-copy SDP、解析纠缠见证 | [综述](https://journals.aps.org/prxquantum/abstract/10.1103/PRXQuantum.3.010101) |
| SPEC-01 | **Riemann 零点的自伴谱实现**<br>对一个具体自伴算子候选证明有限能窗谱与显式公式兼容，并排除伪零点。 | 1910s–；Hilbert–Pólya 思路 | 7.0 / **9.1** | 逆谱、迹公式与高精度零点拟合 → 自伴性、rigorous eigenvalue enclosure 与显式公式 | [公开清单](https://www.claymath.org/riemann/) |
| CONF-01 | **非超对称规范理论 conformal window 的固定 Nf 判定**<br>固定 SU(3) 基本表示，区分一个 Nf 的 IR fixed point、walking 与手征破缺并给连续外推。 | 1980s–；Banks–Zaks；格点强耦合社区 | 7.6 / **9.0** | 格点谱、gradient flow 和有限尺寸标度 → 多格距/体积、谱密度与独立离散化 | [综述](https://arxiv.org/abs/1102.4066) |
| ML-04 | **固定 BPS quiver 的稳定谱枚举**<br>固定 quiver 和 chamber，枚举稳定表示并认证 wall-crossing/BPS 指标。 | 1990s–；Seiberg–Witten；BPS quiver 社区 | 8.0 / **9.0** | quiver representation、mutation 与整数谱搜索 → KS 因子、DT 不变量和独立谱网络 | [综述](https://arxiv.org/abs/1211.7071) |
| SPEC-02 | **三维 Anderson 局域化—离域化转变**<br>对一个明确相关无序模型证明一侧局域化界或一个临界标度不等式。 | 1958；Philip Anderson | 7.7 / **9.0** | 大规模稀疏对角化、multifractal/transfer-matrix 搜索 → 多尺度分析、fractional moments 与独立有限尺寸标度 | [综述](https://arxiv.org/abs/1001.3005) |
| TQFT-03 | **非半单范畴的扩展 3D TQFT**<br>构造一个显式非半单 fully-dualizable 候选并计算若干生成流形的配分函数。 | 1990s–；Lyubashenko 等 | 7.4 / **9.0** | 图解代数、state-sum 张量生成 → Pachner move、迹收敛与独立 surgery 计算 | [综述](https://arxiv.org/abs/1706.07813) |
| ALG-04 | **有限 knot family 的链级 Khovanov 精炼**<br>对交叉数≤N 的一个结族构造链级精炼并验证自然性与 BPS 维数。 | 1999–；Mikhail Khovanov | 7.5 / **8.9** | 链复形枚举、表示论模式发现 → 链同伦、Euler/Poincaré 与已知不变量 | [综述](https://arxiv.org/abs/math/9908171) |
| CB-03 | **对数/非幺正 CFT 的交叉方程**<br>为一个 c<0 模型推导含 Jordan 块的 crossing-consistent 共形块并验证单值性。 | 1980s–；Gurarie 等 | 7.9 / **8.9** | 表示论模板、微分方程与符号级数 → null-vector、monodromy、已知格点极限交叉检查 | [综述](https://arxiv.org/abs/1805.04405) |
| GEN-01 | **异常匹配与广义对称实现的固定群分类**<br>固定有限群和 3+1D 手征规范内容，枚举 anomaly-free 实现并构造匹配 IR TQFT 或 obstruction。 | 1969–；'t Hooft；现代广义对称社区 | 7.4 / **8.9** | 群上同调/bordism、表示与范畴枚举 → anomaly inflow、配分函数相位与独立 bordism | [综述](https://arxiv.org/abs/1911.05034) |
| GEN-02 | **量子多体的准局域等价反问题**<br>在 1D injective MPS/MPO 或严格限定 automorphism 类中，证明准局域基态映射可积为统一有隙路径。 | 2010s–；Ogata；Bachmann–Michalakis–Nachtergaele–Sims 等 | 6.8 / **8.9** | 生成元反演、MPS 插值与 Lieb–Robinson 约束搜索 → 父 Hamiltonian 谱隙、quasi-adiabatic flow 和不变量检查 | [ICM](https://icmconjectures.com/2022-mathphys-47) |
| GR-06 | **高维黑洞/黑环的受限唯一性分类**<br>在 D=5 双轴对称、给定 rod structure 下枚举正则分支并证明完备性。 | 2002–；Emparan–Reall 等 | 7.6 / **8.9** | Einstein 方程约化、分支延拓、拓扑枚举 → 正则性、Smarr/Komar 关系与独立 continuation | [综述](https://pmc.ncbi.nlm.nih.gov/articles/PMC5253845/) |
| QG-01 | **渐近安全量子引力固定点的截断稳定性**<br>固定有限导数/维数截断，自动枚举算符并证明一个 regulator/gauge 稳定的 fixed-point 指标。 | 1976–；Steven Weinberg；FRG 社区 | 7.0 / **8.9** | functional RG beta 函数生成与截断搜索 → 多 regulator/gauge、谱稳定与独立离散 RG | [综述](https://www.frontiersin.org/journals/physics/articles/10.3389/fphy.2020.00269/full) |
| TQFT-02 | **模张量范畴 Witt 群的族关系**<br>确定一个无限 braided-category 家族的 Witt 阶与全部低阶关系。 | 2010–；Davydov–Müger–Nikshych–Ostrik | 7.8 / **8.9** | 凝聚候选、融合规则与数论模式搜索 → 中心/凝聚构造、模数据与 pivotal 一致性 | [综述](https://arxiv.org/abs/1001.2023) |

## 排除审计

- **最小 Kochen–Specker 集**：当前下界、构造和‘最小’所指维数/射线/上下文口径易混；审计来源结论冲突，先列待核而非虚构开放状态。
- **渐近好量子 LDPC 码是否存在**：基础存在性已有突破；保留的是阈值—码率—距离及译码权衡。
- **NLTS 存在性**：基础版本已有定理；只保留 qPCP/gap amplification 加强版。
- **一圈 all-plus Yang–Mills 振幅**：闭式和证明已知；仅可作回归基准，不是开放题。
- **标准 XXX/XXZ 有限链 Bethe 谱**：经典可解基准；新颖性不足，除非换成非对角边界等新切片。
- **黑洞 Page 曲线本身**：岛公式已有重大解决；保留 Hilbert 空间因子化和真实黑洞信息问题。
- **一维有隙系统面积律**：已解决；保留一般二维受限子类。
- **庞加莱猜想**：已解决且不应作为当前 AI 开放题。
- **孪生素数/Goldbach 筛法优化**：可作方法论对照，但本次要求数学物理/理论物理，缺少足够直接物理接口。
- **一般 Kerr 外部稳定性**：已有重大定理；改列极端/近极端参数缺口。
- **任意维 SIC 的纯数值搜索**：没有精确数域证书时 verifier 不达 8.5，按硬门槛剔除。
- **三维 Ising 的‘闭式解’**：命题边界不清且难独立验收；改为高温/各向异性解析定理与 bootstrap 子题。
- **完整 M-theory 非微扰定义**：研究纲领而非单一可判定命题；有限 BFSS 可观测量进入矩阵模型切片。
- **所有弦论 de Sitter 真空的存在性**：定义和控制条件争议大，难形成独立 verifier，未过 8.8。
- **量子退火的一般指数加速**：缺少稳定统一命题；有限实例又多为基准复现，工作流适合度未过门槛。

## 使用说明

本表是选题路由器，不是悬赏榜。先按研究背景筛领域，再看 verifier 是否真能独立于 generator；只有在边界写进题面、证书格式预先确定时，高分才有意义。完整问题分低而子题分高不是矛盾：这正表示宏大纲领不适合端到端攻克，但其中存在机器非常擅长的忠实切片。
