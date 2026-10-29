# 交接：新对话从这里开始

> **本文只写「现在」。**
> 历史快照（0.0.13 之前共 8 代、1 906 行）**原样**在
> [docs/archive/HANDOVER-ARCHIVE.md](docs/archive/HANDOVER-ARCHIVE.md)；
> 逐版一句话在 [CHANGELOG.md](CHANGELOG.md)；
> 每一版当时的实测数字、根因分析去 archive 里 grep。

---

## 0. 一句话状态（2026-10-29 18:30）

| 项 | 值 |
|---|---|
| App | **0.9.73（Build 128）**，`/Applications/Quileg HID.app`，线上 **v0.9.73 已是 Latest**（双架构 DMG 均公证 + staple，旧版已标 pre-release） |
| 固件 | **0.7.0**，`s3_16m_universal` 一份镜像带双板（XIAO + N16R8） |
| 探针 | **Pointer Tester 0.2.5 (12)** —— 粗测模式 ⌘I / HUD 开关 ⌘K / 二维码开关 ⌘B；**已上传 TestFlight** |
| 被控设备 | **iPhone SE 608×1080（直角屏）** 与 iPhone 500×1080（圆角）**两台并存**，`profiles` 里各一张表，按画面尺寸自动切换 |
| 校准表 | `airplay:608x1080`（SE，`measured_at 18:18:19`）+ `airplay:500x1080`（`13:36:12`），都在 `profiles` 里 |
| 校准质量 | SE **中位 0.75 px / 最大 29.3 px**（实点复测 1.5 px）；圆角那台 6.8 / 19.9 px |
| 源码 | 本地**有未提交改动**；`VERSION` 0.9.71 / `BUILD_NUMBER` 126。**git 推不上去**，远端只同步了 `README/CHANGELOG/HANDOVER/PITFALLS`（走 `gh api`），代码本身没推 |

## 1. 开工 30 秒

```bash
curl -s http://127.0.0.1:8890/api/status | head -c 200      # device/screen 都 true 才算能干活
.venv/bin/python -m unittest discover -s app/tests -q        # 669 条，应全绿
```

> 2026-10-29 之前这里挂着一条既有失败（`test_frame_freshness.ForceSystemZoneTest`）：它读本机的
> 「被控设备」设置，设成 iPhone 时会走闭环而报错。现在用例里把平台钉成 iPad，**应为 0 失败**。

```text
status()              → app.version=0.9.70、positioning=table、table=airplay:500x1080
calibration_status()  → resume 为空 = 没有被打断的校准；calibrating=false
```

**常见开局故障**：`device=false` → 板子没通电，或 Mac 连了手机热点（板子在 `192.168.31.x`）；
`screen=false` → App 重启后 AirPlay 断了，去手机控制中心重选「屏幕镜像」；
`8890` 直接拒连 → **App 根本没在跑**（`pgrep -fl HIDBridge` 确认后 `open -a`）。

**OCR 报「30 s 超时 / ANE 初始化」**（`ocr_jpeg` 抛 RuntimeError，单测里那条真机帧回归会被 skip）：
不是代码问题，是 Vision 的模型缓存坏了。`mv ~/Library/Caches/vision_arm64{,.bak}` 挪开重启即可，
重建后 0.6 s 出结果（2026-10-29 实测）。**二维码解码走的是另一条路径，此时仍然正常** ——
所以 HUD 关着的时候，OCR 挂了可能完全无感。

## 2. 最近五版改了什么（完整表见 [CHANGELOG](CHANGELOG.md)）

| 版本 | 一句话 |
|---|---|
| 0.9.68 | 没有校准表时不再盖卡片（那条「弹窗和视频抢前台」的根因）；平轴 20 s 内判；删表即失效 |
| 0.9.69 | 轴的「覆盖不足」当场判（与验证同一个 0.40 阈值） |
| 0.9.70 | 坏轴先记账、四角量完再对角镜像（「续校从 TL 继续」不再必然失败） |
| 0.9.71 | 探针双模式（粗测/精细）+ 删文字 HUD 后 TL 不再镜像，验证中位 6.8 / 最大 19.9 px |
| 0.9.72 | 粗测切模式修好：固件只认 `cmd+i`（不是 `gui+i`），409 与断链都会重试、失败自动还原精细模式 |
| 0.9.73 | 档位表自适应续延 + 贴边档不剪：直角屏 iPhone SE 首次通过，验证中位 0.75 px |

## 3. 校准：现在这套口径

**判据（唯一）**：**1100 单位 ≈ 一屏高（1.1–1.5 px/单位）**。校准表是对「单位→像素」增益曲线的采样，
**iOS 指针设置一改，旧表立即作废**（增益由「初始延迟 / 最大速度 / 追踪灵敏度」决定）。

| 实测增益 | 一屏高需要 | 后果 |
|---|---|---|
| 0.40 px/单位 | 2700 单位 | 只走 41%，某轴只采到 3 档，其余靠外推 |
| 2.05 px/单位 | 530 单位 | 后 5 档贴边被 `clean_table` 剪掉，一次跨 1/4 屏 |
| **1.13 px/单位** | **955 单位** | 8 个轴覆盖 0.74–0.91，验证中位 11.8 px |

**校准前必看**：命令回执正常几十到一两百毫秒；>300 ms 先修 Wi-Fi；**>1200 ms 会被直接拒绝**
（每档读到的是移动前的画面，表会偏短）。

### 3.1 TL 不再是弱区（2026-10-29 定案）

左上一整片 `y 0.09–0.64、x 0–0.92` 的盲区，根因**不是**停车点贴顶，而是**探针的文字 HUD**
—— 13 行标签正好盖在那里，指针停进去 hover 就不刷新，TL 的 x 轴整段量不出来。

现在 HUD 默认**不显示**（需要时 ⌘K 调出来），TL 直接可测：

| | 旧（0.9.70 的表） | 现在 |
|---|---|---|
| TL 停车点 | `(0.0507, 0.0233)`，圆角几何模型**估**的 | `(0.1385, 0.0649)`，探针**真值**测的 |
| TL 的 x 轴 | TR 镜像（`1−f`） | 6 档全实测，**0 次镜像** |
| 验证中位 / 最大 | 11.8 px / 103.8 px | **6.8 px / 19.9 px** |

**顺带修掉的两个真问题**（都写进单测了）：

- `STOPS_Y` 原来 600→1000 之间**没有采样点**，而指针饱和拐点正好在 ~750。
  表里没拐点，`units_for` 把 600→1400 拉成直线，y=0.198 被算成 728 单位（实际 ~620）
  → 偏 141 px。现在 `STOPS_Y = [30, 60, 100, 300, 600, 750, 850, 1000, 1400, 1500]`。
- `clean_table` 在「平台抖动」时删的是**前**一个点（平台起点），把那段陡坡的唯一锚点
  自己剪掉了。现在幅度 < `SAT_FLAT` 时删后一个。

### 3.2.1 直角屏（iPhone SE）与慢增益设备（2026-10-29 首次实测）

iPhone SE（**608×1080，直角屏**）和之前那台圆角 iPhone 的差异很大：

| | 圆角 iPhone 500×1080 | iPhone SE 608×1080 |
|---|---|---|
| 停车点 TL | `(0.139, 0.065)`（被圆角弧顶回来） | **`(0.011, 0.017)`**（真的到角） |
| 停车点 BL | `(0.192, 0.966)` | **`(0.020, 0.989)`** |
| 验证中位 / 最大 | 6.8 / 19.9 px | **0.75 / 29.3 px**（实点 1.5 px 以内） |
| 盲区 | 顶边那条带 | **几乎没有**（直角无弧 + HUD 已关 + 无刘海） |

**慢增益是这台机器的真坑**：指针设置不同，1500 单位只走 0.77 屏高，
而 `STOPS_Y` 原来写死到 1500 —— 表断在 77%，闸门判「底部 23% 没有映射」整轮作废。
现在 `measure_tables` 走完固定档位后，**按 1.35× 续延**（最多 6 档 / 6000 单位），
直到指针真的贴边。SE 实际续到 2030 单位。

**另一个坑**：`clean_table` 的表尾规则会把「跳到贴边」的那一档当成坏点剪掉
（判据是「末尾这步 > 4×中位步长」，而 0.77→0.999 这一步跳了 0.22）。
现在**贴边值（≥0.98 或 ≤0.02）永远不剪** —— 那正是覆盖率的证据。

### 3.2 粗测：先量「哪里看得见」，再精细量角

`control/scanmap.py` + `Calibrator.coarse_scan()`（探针 0.2.5 的粗测模式，⌘I 切换）。

- 判据是**两条独立信道**：系统白点（镜像里有它，与 App 无关）+ 令牌（App 收到 hover 才画，
  且**冻在最后位置不隐藏** —— 冻住本身就是「收不到」的证据）。
- 地图按**单位**记（`(从某角走多少单位 → V/B)`），不按屏幕坐标：粗测必须跑在没有分段表的
  状态，屏幕坐标那时算不出来。存 `calib.wip.json` 的 meta 里，**不进 `calib.json`**。
- `measure_tables` 命中盲区档位 → `skipped(blind)`，**不计 miss**。没有地图时行为与以前完全一致。
- **只能连跑两次 `B` 才记**：`verdict_at` 容差是 0.75×步长，一个假 `B` 会让精细校准白白跳掉
  一档正常采样。
- 本机实测结论：**除顶边那条带（≥720 单位，返回 `?`）之外整屏可见** —— 也就是「没有要跳的」。

⚠️ 切模式走 `⌘I`，偶发 **409 Conflict** 必须重试（`_retry`），否则粗测会静默跳过；
  扫完若因断链没切回精细，`_calibrate` 开头的 `_ensure_fine_mode()` 会兜底还原。

⚠️ 用之前必须 `measure_latency()`：不测延迟时 `_settle` 退化到 0.2 s，帧还没更新就读，
  扫描会变成一步一个 `B`。

## 4. 动手前必须知道的六条

1. **改了 `control/*.py`（或升级 App）必须重启 MCP**：DSH 用的是源码目录的 `mcp_server.py`，
   宿主拉起来后一直跑旧代码；App 升级也不会让 MCP 自动更新。
2. **两条入口别混**：DSH 走源码（`.venv/bin/python control/mcp_server.py`）；
   打包的 `/Applications/Quileg HID.app` 自带一份（`HIDBridge --mcp`）。改代码只影响源码那份。
3. **系统手势区不是 bug**：iPad 底部 17%（程序坞/主屏条）、顶部 3.5% 在 `guard` 下点不到是设计；
   要进就 `mode="open"`。iPhone 没有程序坞带（`park_lift=0`，不钳位）。
4. **打包 Swift 小工具必须指定真实 `-target`**：`build_release.sh` 已固定 `ocr`/`textsize`→`macos13.0`、
   `uvc`→`macos14.0`，并有 `nm -u | grep __StaticArrayStorage` 闸门。**别「按宿主编译、事后改 minos」**，dyld 只认符号。
5. **GitHub 上只放「闭源发布 + 官网」，源码只在本地 git**（这是**产品决定**，不是环境问题）。
   - `git push` 到 `github.com:443` 在本机也不通（`api.github.com` 正常），但**别去修它** ——
     也不要把源码传上去；
   - 发版用 `gh release create`；改远端文档用 `gh api -X PUT .../contents/...`
     （远端只有 `README/CHANGELOG/HANDOVER/PITFALLS`、`docs/`、`docs-src/`、`index.html` 这些）；
   - **本地 git 是源码的唯一真相** → 每次发版后打一份 bundle 到 `backups/`：
     `git bundle create backups/repo-v<版本>.bundle --all`，再 `git bundle verify`
     （当前锚点见 `backups/RESTORE.md`）。
6. **拼音输入法会把 ASCII 组合成汉字**：`type_text` 有护栏，但**手写 `key` 逐字**没有；
   写文案/搜索优先 `type_text`，或打字前 `key("ctrl+space")` 切英文。

## 5. 下一步（按优先级）

1. **粗测的端到端验证（`run(scan=True)`）**：粗测单跑通过、地图也能写进 wip，但「粗测 → 精细」
   在同一次 `run()` 里**还没跑过**。本机扫描结论是「没有要跳的」，跑它主要是验链路（+3 分钟）。
2. **Pointer Tester 0.2.5 (12) 还没进 TestFlight**：0.2.4 (8) 的 IPA 曾通过 `altool --validate-app`，
   但没上传（90 天会过期）。0.2.5 加了粗测模式，发版前先确认 `project.yml` 里的版本号。
3. **把这次的表也用 `scan=True` 复跑一遍**，确认 `skipped(blind)` 这条分支在真机上不会误跳
   （本机没有盲区带，所以只能靠断言「跳过 0 档」）。
4. **校准向导加「探针体检」**：`VIEW≠SIZE`（网页版）或 AGE 长期 >1 s 时，直接提示
   「校准请换原生 App / 指针可能落在 HUD 里」。
5. UVC 在 macOS 13 上仍不可用（API 下限，0.9.66 已改为不拉进程 + 退避），保持现状。
6. `docs/*.html` 的生成脚本仍未找到（站点渲染页不会自动跟着 `docs-src/*.md` 更新）。
7. **出 0.9.71 之前**：`VERSION` / `BUILD_NUMBER` 还没动，CHANGELOG 也没有这一行 ——
   这次的改动（探针双模式 + 粗测地图 + TL 直测 + `STOPS_Y`/`clean_table` 修复）都还是**未提交**状态。

## 6. 发版流程（一次完整发版）

1. `CHANGELOG.md` 加**一行**（版本 / Build / 日期 / 一句话）—— 随包的 `RELEASE-NOTES.md` 由它生成；
2. `VERSION` / `BUILD_NUMBER` 递增（唯一来源）；
3. `packaging/build_release.sh`（arm64）与 `ARCH=intel …`（Intel）→ 两个 DMG，均已公证 + staple；
4. 生成 `.sha256`（`shasum -a 256 "$f" | awk '{print $1"  "$2}' > "${f%.dmg}.sha256"`）；
5. `packaging/fetch_uxplay_source.sh` 出 GPL 对应源码 + `packaging/uxplay-build.patch`；
6. `gh release create vX.Y.Z -R jianghui1974/Quileg-HID --notes-file <(从 CHANGELOG 抽这一行) <7 个资产>`；
7. **把上一版标 pre-release**（`gh release edit v<old> --prerelease`），否则用户继续下旧版；
8. 站点：改 `README.md`（版本行 + 两个 DMG 的 SHA）、`docs/install.html`、`docs-src/VERSION.txt`，
   commit + push → Pages 自动构建（`gh api repos/.../pages/builds/latest -q .status` 轮询到 `built`）；
9. 本机 `/Applications` 覆盖安装，重选屏幕镜像，`app_docs()` 确认随包文档是这一版。

⚠️ `build_release.sh | tee` 的退出码是 `tee` 的 —— 看 `status: Accepted`，别只看退出码。
⚠️ 公证卡在 "Conducting pre-submission checks" 且 `history` 查不到 = **DMG 还挂着**（PITFALLS §4.4c）。

## 7. 架构与关键路径

```
iPhone ──AirPlay──▶ UxPlay(7100) ──GStreamer──▶ JPEG ──▶ hidagent(:8890) ──▶ MCP 工具
   ▲                                                              │
   └──── BLE HID 鼠标/键盘 ◀── ESP32 板子 ◀── Wi-Fi TCP 7300 ◀─────┘
```

| 东西 | 位置 |
|---|---|
| 数据 / 日志 / 校准表 | `~/Library/Application Support/HIDBridge/`（`calib.json` 是唯一权威表） |
| 源码 | `app/`（GUI）`control/`（控制层 + MCP）`firmware/`（固件）`packaging/`（出包）`pointer-tester/`（探针） |
| 粗测地图 | `control/scanmap.py`（纯逻辑）+ `Calibrator.coarse_scan()`；落在 `calib.wip.json` 的 `_wip.visibility` |
| 回滚锚点 | `backups/RESTORE.md`，最新是 `repo-v0.9.72.bundle`（43 MB，含全部历史与标签；源码的唯一异地副本） |
| 内置固件 | `app/firmware/*.bin` + `manifest.json`（sha256 在里面） |
| 板子 | `HID Bridge C784`（`192.168.31.25`）、`HID Bridge 4F7C`（`.143`），固件 0.7.0 |

## 8. 边界（不要对用户承诺）

- **iPhone 没有 ⌘Tab**（iOS 无应用切换；`⌘H` + Spotlight 可用）；iPad 有。
- **BLE HID 触发不了 iOS 快捷指令**；右键是「应用相关」的，部分第三方列表无反应。
- **只支持 16 MB 板**：8/4 MB 板刷写前会被拒（不校验 flash 大小的老版本才危险）。
- **非 Apple 平台没有 AirPlay**，只能走 UVC 采集卡。
- **iPad 最底部约 13% 是钳位区**；底部目标多花约 1 s（等程序坞收起）。
- 校准**不是必选项**：没有表也能点（`positioning=visual`，10–40 px、每动作多 2–6 s）。

## 9. 文档地图

| 什么时候读 | 文件 |
|---|---|
| 接手 / 现在什么状态 | **本文** |
| 要操作 iPhone | [AI_GUIDE.md](AI_GUIDE.md)（工具语义、任务配方、排障、安全边界） |
| 踩坑 / 不要重蹈 | [PITFALLS.md](PITFALLS.md)（§2 输入、§3 坐标、§4 校准与发布、§6 兼容矩阵、§9 便宜板） |
| 哪版改了什么 | [CHANGELOG.md](CHANGELOG.md) |
| 客户交付与验收 | [DELIVERY.md](DELIVERY.md)、[新板安装SOP.md](新板安装SOP.md) |
| 风险清单 | [RISKS.md](RISKS.md) |
| 维护 / 归档规矩 | [docs/MAINTENANCE.md](docs/MAINTENANCE.md) |
| 历史（不要主动读） | [docs/archive/](docs/archive/)（有索引 `README.md`） |

> ⚠️ **随包文档是 0.9.70 构建时的快照**：`app_docs("PITFALLS.md")` 拿到的是 1 642 行那版旧的
> （里面的 `docs/pointer-tester/…` 之类路径已经归档）。2026-10-29 的重写只在仓库里——
> **一切都以仓库根的这份为准**；下次发版（0.9.71）会自动把新文档打进包。
