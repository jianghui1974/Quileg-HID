# Quileg HID

让 AI 真正**操作**你的 iPhone / iPad —— 投屏看画面，蓝牙键鼠动手，像人一样使用它，而不是隔着 API。

无需越狱、无需在手机上安装 App、无需开发者模式。

- 官网：[https://jianghui1974.github.io/Quileg-HID/](https://jianghui1974.github.io/Quileg-HID/)
- English：[https://jianghui1974.github.io/Quileg-HID/en/](https://jianghui1974.github.io/Quileg-HID/en/)
- 下载：[Releases](https://github.com/jianghui1974/Quileg-HID/releases)（免费）
- 文档：[jianghui1974.github.io/Quileg-HID/docs/](https://jianghui1974.github.io/Quileg-HID/docs/)

## 下载与安装

| 包 | 适用机器 |
|---|---|
| `Quileg-HID-<版本>-arm64.dmg` | Apple 芯片（M1–M4） |
| `Quileg-HID-<版本>-intel.dmg` | Intel Mac（macOS 13–26） |

- **两个包不通用**，装错会提示「需要 Apple 芯片」；下载时认准文件名后缀。
- 系统要求：macOS 13.0 及以上；两个包均已公证（notarized）。
- 每个版本都提供 SHA-256，可在 Releases 页核对。

## 你需要一块开发板

Quileg HID 通过一块 **ESP32-S3 开发板**（约 ¥30–60，**需 16 MB Flash**）伪装成蓝牙键盘和鼠标，替 AI 去「按」手机。
没有板子，App 能装能开，但无法控制手机。

已验证可用：Seeed XIAO ESP32S3 Plus，以及搭载 ESP32-S3-WROOM-1-N16R8 模组的第三方开发板。
固件随 App 内置，首次连接时自动刷写，不需要另装工具链。

## 快速上手

1. **安装**：把 `Quileg HID.app` 拖进 `/Applications`，首次启动允许「本地网络」。
2. **连板子**：USB 接上开发板，App 会自动识别并刷入配套固件。
3. **开投屏**：iPhone 控制中心 → 屏幕镜像 → 选这台 Mac。
4. **开两个开关**：设置 → 辅助功能 → 触控 → 辅助触控（开）；指针设备 → 鼠标键 → 使用主键盘（关）。
5. **接 AI**：按〈接入 AI（MCP）〉把 App 注册给 Claude、Codex 等宿主，之后直接说需求即可。

完整步骤见 [安装与首次使用](https://jianghui1974.github.io/Quileg-HID/docs/install.html)。

## 文档

| 文档 | 内容 |
|---|---|
| [安装与首次使用](https://jianghui1974.github.io/Quileg-HID/docs/install.html) | 从拿到安装包到手机能被操作 |
| [功能与设置](https://jianghui1974.github.io/Quileg-HID/docs/features.html) | App 能做什么、每个开关在哪 |
| [接入 AI（MCP）](https://jianghui1974.github.io/Quileg-HID/docs/mcp.html) | 让 AI 宿主真正调用这个 App |
| [给 AI 的操作手册](https://jianghui1974.github.io/Quileg-HID/docs/ai-guide.html) | 工具语义、坐标校准、任务配方、安全边界 |
| [排障与兼容性](https://jianghui1974.github.io/Quileg-HID/docs/troubleshooting.html) | 常见故障、设备兼容矩阵、已知问题 |
| [运行方式](https://jianghui1974.github.io/Quileg-HID/docs/lifecycle.html) | 关窗为什么不退出、自启动怎么工作 |
| [第三方声明与许可](https://jianghui1974.github.io/Quileg-HID/docs/licenses.html) | 开源组件、许可类型与合规说明 |

安装包里也带同一套 Markdown 原文，`app_docs()` 可让 AI 直接读取与当前版本同源的副本。

## 许可

Quileg HID 为**闭源软件，免费**提供下载与使用。第三方开源组件（esp32-iphone-agent / UxPlay 等）的声明与许可全文见
[THIRD-PARTY-NOTICES](https://jianghui1974.github.io/Quileg-HID/docs/licenses.html)。

与 Apple Inc. 无隶属关系。Apple、iPhone、iPad、macOS、AirPlay 等是 Apple Inc. 的商标。

## 反馈

问题、建议或合作：contact@airdiode.com
