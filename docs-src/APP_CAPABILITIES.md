# Quileg HID 功能地图（给 AI）

> 目的：让 AI 知道 **Mac App 自己**能做什么、设置在哪、出问题先看什么。
> 操作 iPhone 的细节看 [AI_GUIDE.md](../AI_GUIDE.md)；踩坑看 [PITFALLS.md](../PITFALLS.md)。

## 1. 它是什么

一个 macOS 桌面 App，同时承担三件事：

```
iPhone ─AirPlay─▶ UxPlay ─────┐
iPhone ─HDMI───▶ UVC 采集卡 ──┴─▶ 帧（手动选源）─▶ App（控制台 + hidagent :8890）
                                                    ├─▶ MCP 工具（给 AI 宿主）
被控设备 ◀─ BLE HID ◀─ 板子 ◀─ Wi-Fi TCP 7300 ─────┘
（iPhone / iPad / Android / Mac / Windows）
```

- **眼睛**：AirPlay 接收端（UxPlay）**或** UVC 采集卡；两路同时跑，**手动选源**，也可并排监视；
- **手**：ESP32-S3 板子做 BLE 键鼠，Mac 通过 Wi-Fi TCP 发指令；键盘组合按「被控设备」白名单放行；
- **接口**：本机 `:8890` 同时服务 GUI、控制层和 MCP。

## 2. 三个入口

| 入口 | 命令 | 说明 |
|---|---|---|
| GUI | `Quileg HID.app` | 控制台 + 服务端（打包版由 launcher 起 hidagent） |
| MCP stdio | `HIDBridge --mcp` | 宿主拉起；`:8890` 已在跑就复用，否则自己起 |
| 后台启动 | `--background` | 登录自启用，不显示窗口 |

GUI 是常驻服务：**红叉只隐藏窗口，⌘Q 才退出**（见 [LIFECYCLE.md](LIFECYCLE.md)）。

## 3. 功能清单

| 功能 | 在哪里 | 说明 |
|---|---|---|
| 屏幕镜像 | 主窗口左侧 | AirPlay：选 `Quileg - <机器名>`；UVC：插采集卡即出帧 |
| 视频源 | 舞台工具条「源 / 双路」；MCP `select_video` / `monitor_videos` | **手动**切 AirPlay/UVC（不自动切换）；双路并排监视；无信号/冻结会标注 |
| 被控设备切换 | 舞台工具条最左「被控 XXX ▾」（视频正上方） | 点一下就能换 iPhone / iPad / Android / Windows / Mac，不用进设置；它同时决定键盘策略与校准形态。当前校准表与选择矛盾时铭牌标 **⚠**，并在切换时提示重校 |
| AI 活动条 | 舞台底部 | 实时显示当前 MCP 工具/耗时、最近调用、`CALL / AVG / ERR` 统计；忙时琥珀动效，待命呼吸灯。数据来自 MCP 中间件上报（`mcp_server.py` 0.4.0），不影响工具本身 |
| 语音桥 / 音效 | MCP `speak` / `play_audio`；活动条点击或 ⌘. 停止 | 系统 `say` 朗读（中文自动 Tingting），让手机输入法听写转写，解决中文点选慢；`afplay` 播本地音频/音效（aiff/wav/mp3/m4a…，≤8 MB）；同一时刻一条，可打断 |
| 网格叠加 | 舞台工具条「网格」；设置 → 交互 → 网格线 | 开关立即生效并记住（`grid_overlay`）；线型可选三分线 / 中心十字 / 安全框（10% 边距）/ 十等分（`grid_style`），双路时每格各画一份 |
| 键盘策略 | 设置 → 被控设备；`control/keymap_default.json` | 按 iPhone / iPad / Android / Windows / macOS 区分 allow/confirm/deny（iPad 才允许 ⌘Tab）；审批 token；`keyboard_shortcuts` 查询 |
| 设备称呼 | 同一处设置；`app/core/device_noun.py` | 界面里的「iPhone」改为随被控设备变化（iPhone / iPad / 安卓手机 / Windows 电脑 / Mac）；非 Apple 平台的投屏步骤改为采集卡（UVC）指引 |
| 选择被控设备 | **设备初始化第 2 步**；设置 → 被控设备 | 引导里就能选（不必先跳去设置），选完后续步骤的称呼/配对/投屏/校准文案立即跟着变；设置里保留同样选项。0.9.47 起 iPhone 与 iPad 是**两项**（键盘策略、校准形态都不同） |
| 白/黑名单 | 设置 → 被控设备 → 编辑白名单 / 黑名单… | 逐条屏蔽或放开；放开黑名单需二次确认，绝对黑名单锁定 |
| 反馈 | 邮件 `quileg@airdiode.com` | AI 发现问题可建议用户发信反馈（先征得同意） |
| 点击 / 输入 | 控制、输入面板；MCP | 归一化坐标；动作后返回截图与 `changed` |
| 右侧检查器 | 右栏三个页签 | **服务端**（服务状态 / 动作队列）、**控制**（软鼠标 / 软键盘；软键盘按键名称**跟随被控设备**——Windows 显示 Win/Ctrl，其余显示 ⌘/⌥，不再单独设开关；文本输入与最近输入已在 0.9.20 移除，文本请走 MCP 的 `type_text`）、**板子**（初始化 / 固件 / 校准 / 网络 / 诊断）；⌘1–3 切换 |
| 软鼠标 | 控制 → 01 软鼠标 | 方向键 + 指针步长、**左键 / 右键**、滚轮 ↑↓ + 滚轮步长；**镜像区点击只移动指针、不点击**；右键是应用相关的（原生列表可用，部分第三方列表不响应） |
| 滚动 | 右侧「控制」面板的 **滚轮 ↑ / ↓** 按钮 | 一次点击发 `scroll_step` 份滚轮（3/6/8/12/20/30）；**镜像区滚轮与触控板手势已关闭**（命令有可见延迟，跟手感差） |
| OCR | MCP `ocr` / `click_text` | Apple Vision，返回 bbox/center |
| 校准 | 恢复/身份 → 校准向导；`python control/calibrate.py setup` | **可选**：有表时一次开出（5–30 px），没表时 AI 走视觉闭环（10–40 px、每动作多 2–6 s）。15–30 分钟（视设备）；按 **视频源 + 分辨率** 各存一份 |
| AI 请求校准 | MCP `calibration_request` | 只弹确认，用户点开始；AI 不自己跑 |
| 动作队列 | 主窗口底部 | 串行执行，支持取消 |
| 设备诊断 | 设备面板 | BLE 五项、端口、固件版本、链路 |
| 日志 | 显示 → 显示日志；`app-ui.log` | 可筛选/搜索/复制/打开 Finder |
| 固件升级 | 设备 → 固件升级… | USB 整包/仅升级；日志中文；成功后可进初始化 |
| 配网 | 网络 → Wi-Fi / 服务器配置… | USB 写 NVS；默认本机 Wi-Fi，密码手输 |
| 设备初始化 | 设备 → 设备初始化… | 9 步：被控设备→自检→板子→Wi-Fi→配对→投屏→校准→完成 |
| 运行方式 | 设置 → 运行方式 | 自启动、启动模式、关窗行为、退出确认 |
| 诊断导出 | 帮助 → 复制诊断信息；MCP `app_diagnostics` | 版本/端口/日志/设置摘要 |
| 开源许可 | 帮助 → 开源许可；关于窗口内同入口 | 读 `THIRD-PARTY-NOTICES.md`（MIT / GPL-3.0），可复制全文 |
| 检查更新 | 帮助 → 检查更新…；启动 5 s 后静默检查 | 读 GitHub Releases（或 `QUILEG_UPDATE_FEED` 指定的 JSON）；有新版本弹「发现新版本」对话框：前往下载 / 稍后 / 跳过此版本（`update_skipped`）；设置 → 首启引导 → 「启动时检查更新」可关（`update_check`）。只发一个 GET，不上传数据 |

## 4. 设置项（`app-settings.json`）

| 键 | 默认 | 生效 |
|---|---|---|
| `server_url` | `http://127.0.0.1:8890` | 立即重连 |
| `appearance` | `system` | 立即 |
| `text_scale` | `system`（跟随 macOS 文字大小） | 重启；旧 `ui_scale` 自动迁移 |
| `pointer_step` / `scroll_step` | 40 / 6 | 立即；`scroll_step` 1..30 = 每次点滚轮按钮发的份数 |
| `wheel_direction` | `normal` | 立即（每次 `scroll(fine=…)` 重新读）；`inverted` = 滚轮方向反转 |
| `controlled_platform` | `iphone` | 立即；`iphone / ipad / android / windows / macos`，决定键盘策略（allow/confirm/deny）、界面称呼、软键盘按键名称，以及**校准形态**（手机 / 平板）；引导第 2 步也可选。旧值 `ios` 自动迁移为 `iphone` |
| `grid_overlay` / `grid_style` | `false` / `thirds` | 立即；工具条「网格」开关状态会被记住 |
| 键盘白名单/黑名单 | 设置 → 被控设备 → 编辑 | 立即；逐条屏蔽或放开，写入 `keymap.json` |
| `log_level` | `info` | 立即 |
| `close_action` | `hide`（隐藏窗口） | 立即 |
| `quit_confirm` | `busy`（忙时确认） | 立即 |
| `startup_mode` | `window` | 下次启动 |
| `autostart` | `false`（仅安装版） | 保存时写 LaunchAgent |

## 5. 出问题先看什么

> **iPhone 三个总开关**：`辅助触控` 不开 → 没有鼠标指针（click/move 全像没反应）；
> `鼠标键 → 使用主键盘` 开着 → 键盘变鼠标（`i j k l m o u 7 8 9 .` 不落屏、回车弹菜单）；
> `自动锁定` 不是「永不」→ 锁屏后投屏停住、校准跑到一半整轮作废。
> 路径：设置 → 辅助功能 → 触控 → 辅助触控（→ 指针设备 → 鼠标键）；自动锁定在设置 → 显示与亮度。
> 详见 PITFALLS §0/§2.1。


按顺序，不要凭感觉重装：

1. **`app_status`**：App 版本/模式、板子是否连、投屏是否在、固件版本、端口；
2. **`app_logs`**：最近 10 分钟的错误（`level=ERROR` 或 `grep` 关键字）；
3. **`app_diagnostics`**：一份可直接贴给用户的报告（版本、USB 端口、设置、日志尾巴）；
4. **`status`**（iPhone 工具）：`device/screen/calibrated/ble`；
5. 再决定：重投屏、重配网、重启 App，还是刷固件。

常见判断：

| 现象 | 先看 | 结论 |
|---|---|---|
| 所有工具 `connection refused` | Dock 图标 / `:8890` | App 被 ⌘Q 退出或服务没起 |
| `device=false` | `app_status` 的 USB/板子 | 板子没上电/没连 Wi-Fi/端口被占 |
| `screen=false` | 手机控制中心 | 没选投屏，或接收端没起 |
| 点击偏 | `calibrated` + 设备基线 | 校准表不是这台设备的 |
| 固件升级失败 | `app_status` 的 app/firmware | 版本、stub、端口占用 |
| 配网后离线 | `app_logs` grep Wi-Fi | 5 GHz/密码错/天线没接 |
| 打字时个别字符不出现（如 `i j k l m o u 7 8 9 .`）/ 回车弹菜单 | 检查 `辅助功能 → 触控 → 辅助触控 → 指针设备 → 鼠标键 → 使用主键盘` | 该开关开着时键盘被当成鼠标，**不是固件**；关掉即恢复，辅助触控要保持开 |
| `⌘Tab` 没反应 | — | iPhone 没有这个系统快捷键；用 `⌘H` + `⌘Space` 切 App |

## 6. AI 的边界

**可以做**：读状态/日志/诊断、操作 iPhone、建议改设置、把用户带到正确的对话框。

**要先问用户**：改 Wi-Fi/服务器地址、重启板子、重装/升级固件、退出 App、取消校准。

**不要做**：无人值守刷固件、输入密码/验证码、替用户发消息或支付、修改账号安全设置。

> 诊断工具全部只读，且日志已脱敏（密码/token 不会出现在结果里）。
