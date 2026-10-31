# 交接：新对话从这里开始

> **本文只写「现在」。**
> **2026-10-31 收工**：今天发了 0.9.79（录制）/ 0.9.80（麦克风授权紧急修）/ 0.9.81（导出自适应窗口），
> 三轨录制在正式包里验过；下次开工看 §5 末尾的「下次开工第一件事」。
> 历史快照（0.0.13 之前共 8 代、1 906 行）**原样**在
> [docs/archive/HANDOVER-ARCHIVE.md](docs/archive/HANDOVER-ARCHIVE.md)；
> 逐版一句话在 [CHANGELOG.md](CHANGELOG.md)；
> 每一版当时的实测数字、根因分析去 archive 里 grep。

---

## 0. 一句话状态（2026-10-31 12:50）

| 项 | 值 |
|---|---|
| App | **0.9.81（Build 136）**，`/Applications/Quileg HID.app`，线上 **v0.9.81 = Latest**（双架构 DMG 均公证 + staple；0.9.78–0.9.80 已标 pre-release） |
| 固件 | **0.7.0**，`s3_16m_universal` 一份镜像带双板（XIAO + N16R8） |
| 探针 | **Pointer Tester 0.2.5 (13)**，TestFlight **Beta 审核已通过（2026-10-31）** → 外部测试者点公开链接即可装；网页版 **probe-web v6.3**（⌘I/⌘K/⌘B、读数默认关，导航走 network-first）；两边 **HUD 默认关** |
| 被控设备 | **iPhone SE 608×1080（直角屏）** 与 iPhone 500×1080（圆角）**两台并存**，`profiles` 里各一张表，按画面尺寸自动切换 |
| 校准表 | `airplay:608x1080`（SE，`stops=minimal`，10:56 校准）+ `airplay:500x1080`（圆角，`stops=full`，12:45 校准） |
| 校准质量 | **SE 1.0 px 中位**（120 点持出，最大 4.5）；**圆角 6.25 px 中位 / p90 39**（30 点持出）—— 圆角的瓶颈是曲线饱和，见 §3.4 |
| 源码 | `VERSION 0.9.78 / BUILD 133`，**工作区干净**（HEAD 以 `git log -1` 为准）。**git 推不上去**，远端只同步 `README/CHANGELOG/HANDOVER/PITFALLS` + `docs*/`（走 `gh api`），代码本身没推 |
| 录制 | **0.9.79 起已发布**：环形录制 + 按窗口导出 + 节目音（3 s 判定窗）+ 麦克风第二轨 = **三轨导出**，正式包里验过（见 §5、[docs/recording-design.md](docs/recording-design.md)） |
| 备份 | `backups/repo-v0.9.81.bundle`（43 MB，2026-10-31 收工快照，含到 `b164d91` 的历史；之后的提交只有文档），锚点见 `backups/RESTORE.md` |

## 1. 开工 30 秒

```bash
curl -s http://127.0.0.1:8890/api/status | head -c 200      # device/screen 都 true 才算能干活
.venv/bin/python -m unittest discover -s app/tests -q        # 797 条，应全绿（1 条真机 OCR 帧回归会 skip）
```

> 2026-10-29 之前这里挂着一条既有失败（`test_frame_freshness.ForceSystemZoneTest`）：它读本机的
> 「被控设备」设置，设成 iPhone 时会走闭环而报错。现在用例里把平台钉成 iPad，**应为 0 失败**。

```text
status()              → app.version=0.9.76、positioning=table、table=airplay:608x1080 或 500x1080
calibration_status()  → resume 为空 = 没有被打断的校准；calibrating=false
```

**改了 `control/*.py` 必须重启 MCP**（DSH 跑的是源码目录那份，宿主拉起来后一直跑旧代码）——
2026-10-30 就因为没重启，真机验证拿到的是旧行为。

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
| 0.9.77 | **校准前自动收起探针读数**（OCR 确认可见才发 ⌘K，结束还原）；网页版探针补齐 ⌘I/⌘K/⌘B、读数默认关 |
| 0.9.78 | **文档版**：随包《第一天：从零到能用》上手手册；AI 手册补「先建立信任 / 键盘优先 / 等页面稳定」 |
| 0.9.79 | **录制版**：环形录制 + 按窗口导出（视频/节目音/麦克风三轨，节目音 3 s 判定窗）；iOS 截屏 `⇧⌘3` 放行 |
| 0.9.80 | **紧急**：打包版补 `audio-input` 授权（缺它时系统连麦克风弹窗都不给，带麦录制必失败） |
| 0.9.81 | **导出按已落盘画面自动收缩窗口**（静态屏「录最近 N 秒」不再整段失败）；修 Intel 构建脚本重复套补丁 |

## 3. 校准：现在这套口径

校准表是对「单位→像素」增益曲线的采样，**iOS 指针设置一改，旧表立即作废**
（增益由「初始延迟 / 最大速度 / 追踪灵敏度」决定）。

**别再拿「1100 单位 ≈ 一屏高」当判据**（2026-10-30 实测推翻了它）：两台机器的增益差 4 倍，
而且是**指针设置**给的，不是常数。

| 设备 | 实测增益 | 一屏高需要 | 形状 |
|---|---|---|---|
| iPhone SE 608×1080（直角） | **0.547 px/单位** | ≈1850 单位 | **一条直线** + 贴边夹取 |
| iPhone 500×1080（圆角） | **1.32 → 0.68 px/单位** | ≈450 单位 | **饱和型**：前快后慢（iOS 最大速度在限长位移） |

判据改成「量出来的」：`calibration_status` 的 `y_reach` + 校准后单点验证中位。

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

### 3.3 「固定锚点 + 网格打点」方向**已否**（2026-10-30 实测）

2026-10-29 定的主线是「用网格替换反解」。10-30 做前提测量后否掉，**不要重开**：

| 前提 | 实测 | 网格拿它怎么办 |
|---|---|---|
| 锚点可复现（推到底 10 次） | **0.00 px** | 没有要收敛的东西 |
| 落点可复现（同命令 20 次） | **0.00 px**（4 位小数相同） | 没有噪声要吃 |
| 路径依赖（一跳 vs 两跳） | **0.00 px** | 不必逐点归位，也就没有成本优势 |
| 分轴耦合 | **0.00 px** | 网格要吃的就是它 —— 它不存在 |

映射就是「增益恒定 0.547 px/单位 + 贴边夹取」一条直线，2-D 网格能建模的东西为 0。
外加 `median_T=1.79 px` 使预注册判据 `median_G9 ≤ median_T−3` **数学上不可达**（误差非负）。
详见 [experiments/exp-001/FINDINGS-2026-10-30.md](experiments/exp-001/FINDINGS-2026-10-30.md)；
装置留在 `tools/exp001_*.py`（网格反解、可分离残差、配对统计都在，可复用）。

### 3.4 精简档位与形态门控（0.9.75，2026-10-30）

直角屏的映射是直线，所以每角 **x 3 档 / y 4 档** 就够（原来 x 12 / y 11）：

| | 中位 | p90 | 最大 |
|---|---|---|---|
| 全档位（184 次采样） | 1.04 px | 2.8 | 4.5 |
| **精简档位（56 次）** | **1.02 px** | 2.8 | 4.5 |

60 个配对持出点，配对差中位 **+0.00 px**（EXP-002）。真校准 7.8 min（原来约 13 min）。

**判据（全自动，用户不用选）** —— 三条同时满足才精简：

1. 不是平板（`form` 字段）；
2. 没有圆角几何档案（`corner_profiles.json` 里查不到这个分辨率）；
3. **本次实测的停车点真的到了角**（两条轴离边 < 2%，`jam_reached_corner`）。

第 3 条是关键：圆角机四角停车点是 `(0.19, 0.97)` / `(0.11, 0.05)` 这种，判不出「直角」，
于是一律全档位。**未知机型也按全档位**（最坏是慢一点，不会更差）。

⚠️ 精简档位**不参与贴边续延**：续延补出来的那档往往已饱和，末段斜率被压缩、插值会过头
（实测 +24 px）。首档取 100 单位而不是 200 —— 底角覆盖率闸门看的是「表里最大的 y」，
200 档只到 0.885 < 0.90 会被判废。

⚠️ 圆角机**不能精简**：EXP-004 实测 7.56 vs 6.25 px，更差。

### 3.5 覆盖边界定点检查（0.9.76，2026-10-30）

`validate()` 只抽 0.15–0.95，**边缘从来不测** —— 所以「整条顶带打高 50 px」能在随机
16 点验证报 0.75 px 的情况下潜伏好几天（0.9.74 才查出来）。

现在每角加 2 点 `band_check()`：测「表第一档 → 停车点」那段**外推区**的中点
（坏档出事的地方，且天然可达，不会把「不可达」记成误差），阈值 **25 px**。
圆角机实测 8 点 3.5–9.4 px 全过。

### 3.6 实验装置在哪（下次别从零写）

| 目录 | 内容 |
|---|---|
| `experiments/exp-001/` | 网格 vs 现表的对照：PROTOCOL、prereg（判据写死）、目标集（`--form square/round`）、FINDINGS |
| `experiments/exp-002/` | 精简档位对照（含圆角目标集与逐轮数据） |
| `experiments/exp-004-round/` | 圆角机精简档位（更差） |
| `experiments/exp-005-adaptive/` | 圆角机加密/按曲率摆点（更差）+ 落点可复现性实测 |
| `tools/exp001_*.py` | Runner（按本机尺寸算误差）、网格反解、配对统计、设置截图比对、顶带回归 |
| `tools/exp002_min_table.py` | 精简档位测绘 + 配对对照（`--targets/--out` 可换机型） |
| `tools/exp005_adaptive.py` | 密曲线测量 + 自适应摆点（含离线评分） |

### 3.7 读数来源：验证通过 ≠ 读数纯（0.9.79，2026-10-31）

`validate()` / `band_check()` 在探针读不到时**也会回落帧差** —— 所以「表验证过了」只说明
**能用**，不说明**是按真值量的**。没有探针时校准照样跑完、照样过验证，落点却差一档；
以前这件事完全不可见（RISKS A1 那条「静默回落」）。

现在同一件事有三个出口：

| 出口 | 字段 | 谁看 |
|---|---|---|
| `status.measurement` | `source`：`probe`／`frame`／`null`，`probe_age_ms`，`note`（可直接念给用户） | AI，每次操作 |
| `calibration_status.measure` | `source`：`probe`／`mixed`／`frame`／`model`／`unknown` + 计数 | AI 判断这张表的质量 |
| 读数条「定位」 | 「定位 表（帧差）」+ 警告色 | 用户 |

写表时 `calib.json` 每个档案带 `measure`；续校把 wip 里前面几个角的计数接上（否则一张
半帧差半探针的表会自称全真值）。**老表没有这个字段 = 不知道**，界面按纯表显示，不吓人。

判据代码：`Calibrator._measure_summary()`、`Device.measurement_state()`、
`app/core/positioning.py`；单测 `app/tests/test_measure_source.py`（20 条）+
`test_positioning_hud.py`（4 条，真 Tk 渲染接线）。真机实测（2026-10-31 10:1x）：
探针在前台 → `source=probe`；把 `probe.read_state` 打桩成 None → `source=frame` +
`note`，`aim` 回执也报 `source=frame`。

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

2026-10-30 一天发了 **0.9.74 → 0.9.78 五版**：精简档位、`aim` 纠偏、HUD 自动收起、
网页版探针补齐键位、随包上手手册，外加一轮过期口径清扫。

**已完成（不再挂待办）**：探针 **0.2.5 (13) 的 Beta 审核已通过（2026-10-31）** —— 外部测试者
点公开链接就能装，探针分发这条风险（RISKS A1）闭环。下一个动作只是 90 天后按例行重新上传。

**同一天补上的**：**降级明示**（RISKS A1 的最后一条待办）—— `status.measurement` +
`calibration_status.measure` + 读数条「定位 表（帧差）」，见 §3.7。代码已进工作区，
**待随 0.9.79 发版**（`VERSION` 仍是 0.9.78，发版时才动）。

**录制功能（目标 0.9.79）** —— 设计与实测见 [docs/recording-design.md](docs/recording-design.md)

一句话：AirPlay 镜像会话**只有一个 IDR**（在会话起点，实测 1599 个 NAL 里仅 1 个），
所以「随时开录」在协议层不成立；改成**镜像一连上就环形录制**，MCP 的 `record_start`
= 导出某个时间窗口（可预约将来，也可补录环形范围内刚过去的时间）。

| 部分 | 状态 |
|---|---|
| 环形录制（`ring-*.mp4`）+ 窗口导出 | ✅ 真机 + **正式包**：5.00 s 精确，导出首帧与环形同一时点**逐像素相同** |
| `record_start/status/stop` + `/api/record/*` + 单测 | ✅ 800 条全绿 |
| 读数条红点 `● REC mm:ss` | ✅ |
| **节目音**（3 s 判定窗 + 静态音轨） | ✅ 静音会话出纯视频（`audio=0`）、有声会话出节目音（−14.6 dB） |
| 麦克风第二音轨（`video_mic` / `audio_mic`） | ✅ 正式包三轨（视频 + 节目音立体声 −14.3 dB + 麦克风单声道 −43.7 dB） |
| 打包 / 公证 / Intel / GPL 源码 | ✅ 0.9.79 / 0.9.80 / 0.9.81 三连发；`uxplay-record.patch` 已随包 |

工程上的三条（都已实测，别重犯，细节见 PITFALLS §2.46/§2.47）：
1. **音频 pad 没数据 = `mp4mux` 0 字节**，而且不能事后 `request_pad` → 形状必须开流前定死
   （现在的做法：先缓存画面，3 s 内等到第一个节目音包就带音轨，等不到就纯视频）；
2. **分片模式必须 `dash-or-mss`**：`first-moov-then-finalise` 的文件 AVFoundation 只能
   导开头几秒（`-11800`），ffprobe 却完全正常 —— 属于「安静的坏」；
3. 建管道就 **PLAYING**，别再玩「第一帧到了才 PLAYING」（那才会不写 moov）。

`tools/rec_mux_probe.c` 是本地复现装置（不需要手机，几秒出结果）：改任何录制参数前先在那里跑。

**当天三连发的教训（都已修进代码，别再重犯）**：

1. **0.9.80 紧急**：hardened runtime 少了 `com.apple.security.device.audio-input`，
   打包版**连麦克风授权弹窗都不出现**（TCC 列表里根本没有这个 App），带麦录制必然失败。
   PITFALLS §4.7；
2. **0.9.81**：环形文件「边写边读」，静态屏时请求窗口尾部可能还没样本，AVFoundation 报
   `-11880/-11800/-16364` 而**不会**给个短文件 → `clip` 改为按已落盘画面**自动缩短窗口**；
3. `packaging/build_uxplay.sh` 会把 `uxplay-build.patch` 套两遍（`UXPLAY_PATCH` + `uxplay-*.patch`
   循环），第二遍被认成「已套用」而**回滚**，构建补丁等于没打 → 已跳过重复文件。

**下次开工第一件事**：0.9.82 的两件事 —— ①带盲区的机器上验 `run(scan=True)` 的
`skipped(blind)`；②Intel 真机冒烟（等客户反馈，别主动找机器）。发版流程照 §6。

**剩下的：**

1. **圆角机的开环精度（6 px 中位 / p90 39）—— 不要再投入**。
   一天里试了三种互不相同的思路（2-D 网格、精简档位、加密+按曲率摆点），真机全部没赢；
   残差是曲线饱和 + 偶发跳变，**不是表的形状问题**。真要动，动闭环（`aim` 已修好），别动表。
2. **盲区分支没验过**：`run(scan=True)` 的 `skipped(blind)` 还没在真有盲区的机器上跑过
   （现在两台都不盲）。要验就人为造盲区（把探针 HUD 打开）。
3. **Intel 真机冒烟**：0.9.78 只在 Rosetta 下验过架构 / 插件路径 / uxplay 管线；
   2026-10-30 决定**等客户反馈再说**，不再主动找机器。
4. **0.9.79 的收尾小事**：`ONBOARDING.md` 的口径行已改成「以 `VERSION.txt` 为准」
   （0.9.78 包里还是 0.9.77 的字样，随下个版本自然更新）。
5. `tools/exp001_verify.py` 的「修前/修后」对比已按机型 + 目标集门控，但圆角机还没有同源基线
   —— 要的话跑一次 `--targets experiments/exp-002/targets-round.json` 存一份。

**明确不要做**：换测绘器、调档位密度、调档位摆放（已被实验三次否掉，见 §3.3/§3.4）；
**也不要提议支持 8 MB 板** —— 16 MB 是产品决定（后续摄像头方案要大分区，见 §8）。

## 6. 发版流程（一次完整发版）

1. `CHANGELOG.md` 加**一行**（版本 / Build / 日期 / 一句话）—— 随包的 `RELEASE-NOTES.md` 由它生成；
2. `VERSION` / `BUILD_NUMBER` 递增（唯一来源）；
3. `packaging/build_release.sh`（arm64）与 `ARCH=intel …`（Intel）→ 两个 DMG，均已公证 + staple；
4. 生成 `.sha256`（`shasum -a 256 "$f" | awk '{print $1"  "$2}' > "${f%.dmg}.sha256"`）；
5. `packaging/fetch_uxplay_source.sh` 出 GPL 对应源码（包里已带 `uxplay-record.patch` 与
   `uxplay-build.patch`，两个 patch 也作为单独资产）；
6. `gh release create vX.Y.Z -R jianghui1974/Quileg-HID --notes-file <(从 CHANGELOG 抽这一行) <8 个资产>`
   （两个 dmg + 两个 sha256 + 两个 patch + 源码 tar.gz + 源码 .txt）；
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
| 实验装置 | `experiments/`（PROTOCOL/prereg/目标集/FINDINGS，按编号）+ `tools/exp00*.py`（可复用脚本，见 §3.6） |
| 粗测地图 | `control/scanmap.py`（纯逻辑）+ `Calibrator.coarse_scan()`；落在 `calib.wip.json` 的 `_wip.visibility` |
| 录制本地复现 | `tools/rec_mux_probe.c`（`mp4mux` 行为探针：0 字节/moov/分片/丢帧，几秒出结果） |
| 回滚锚点 | `backups/RESTORE.md`，最新是 `repo-v0.9.81.bundle`（43 MB，含全部历史与标签；源码的唯一异地副本） |
| Intel 的 uxplay | **自编** x86_64（`packaging/build_uxplay.sh`，framework GStreamer + 静态 libplist、**动态** libcrypto.3.dylib 随包）；arm64 也换成打过录制补丁的构建（不再用 Homebrew 的原版） |
| 内置固件 | `app/firmware/*.bin` + `manifest.json`（sha256 在里面） |
| 板子 | `HID Bridge C784`（`192.168.31.25`）、`HID Bridge 4F7C`（`.143`），固件 0.7.0 |

## 8. 边界（不要对用户承诺）

- **iPhone 没有 ⌘Tab**（iOS 无应用切换快捷键；`⌘H` + Spotlight 可用）。（0.9.77 / iOS 26 实测仍成立）
  iPadOS 系统有 `⌘Tab`，但**我们的键位白名单没放行 `gui+tab`**，所以 AI 两台都走 `⌘H` + Spotlight；
  要放行是「改 keymap + 一次真机验证」，别顺手开。
- **iOS 快捷指令的键盘快捷键可以用**（2026-10-30 实测：`⌘1/⌘2/⌘3` 打开了用户设的三个快捷指令；
  归档里「BLE HID 触发不了」的旧结论已作废）；但**映射是用户自己设的**，宿主不知道，用前确认一次。
- **iOS/iPadOS 截屏 = `⇧⌘3`（与 Mac 一致）**，2026-10-31 真机验过（出现系统截图预览），
  0.9.79 起白名单直接放行（`key(action="screenshot")`）；`⇧⌘4` 仍是实验，别开。
  截图是相册里的真文件，所以**能接用户自建的快捷指令做端侧 OCR**（这条路成立，说明见
  AI_GUIDE §4.14；映射与结果去向都由用户定，AI 只确认、预设和代配都不要做）。
- 右键是「应用相关」的，部分第三方列表无反应。
- **只支持 16 MB 板，这是产品决定，不是待办**：后续要上板载摄像头，分区需要 16 MB 的余量，
  所以硬件统一锁死 16 MB、避免多版本。8/4 MB 板刷写前会被拒（不校验 flash 大小的老版本才危险）。
  **不要提议「顺手支持 8 MB 板」**——那会让我们维护两套分区表和两套固件。
- **非 Apple 平台没有 AirPlay**，只能走 UVC 采集卡。（0.9.77 仍成立）
- **iPad 最底部约 13% 是钳位区**；底部目标多花约 1 s（等程序坞收起）。
- **滚轮方向看界面**：同一台设备上，原生列表与网页/内嵌视图可能相反，用户可在设置里翻转；
  别据此判断固件坏了。
- 校准**不是必选项**：没有表也能点（`positioning=visual`，10–40 px、每动作多 2–6 s）。

## 9. 文档地图

| 什么时候读 | 文件 |
|---|---|
| 接手 / 现在什么状态 | **本文** |
| 第一次装 / 教用户跑通 | [ONBOARDING.md](ONBOARDING.md)（安装、四个开关、两根探针、校准口径） |
| 要操作 iPhone | [AI_GUIDE.md](AI_GUIDE.md)（工具语义、任务配方、排障、安全边界） |
| 踩坑 / 不要重蹈 | [PITFALLS.md](PITFALLS.md)（§2 输入、§3 坐标、§4 校准与发布、§6 兼容矩阵、§9 便宜板） |
| 哪版改了什么 | [CHANGELOG.md](CHANGELOG.md) |
| 客户交付与验收 | [DELIVERY.md](DELIVERY.md)、[新板安装SOP.md](新板安装SOP.md) |
| 风险清单 | [RISKS.md](RISKS.md) |
| 录制功能（现状 / 协议坑 / 下一步） | [docs/recording-design.md](docs/recording-design.md) |
| 维护 / 归档规矩 | [docs/MAINTENANCE.md](docs/MAINTENANCE.md) |
| 当天做过什么实验、为什么否掉 | [experiments/](experiments/)（每条都有 FINDINGS，附实测数字） |
| 历史（不要主动读） | [docs/archive/](docs/archive/)（有索引 `README.md`） |

> ✅ **随包文档现在跟版本走**：`app_docs()` 报的是「已安装 App 的 Resources/docs」，
> 与运行版本同源（`match: true`）。仓库根这份**仍然是权威**（发版时才打进包），
> 两者不一致时以仓库为准。
