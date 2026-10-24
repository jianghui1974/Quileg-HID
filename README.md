# Quileg HID

让 AI 通过投屏看画面、通过蓝牙键鼠操作 iPhone / iPad 的 macOS 应用。
无需越狱、无需在手机上安装 App、无需开发者模式。

**[官网](https://jianghui1974.github.io/Quileg-HID/)** · **[下载最新版](https://github.com/jianghui1974/Quileg-HID/releases/latest)** · **[文档](https://jianghui1974.github.io/Quileg-HID/docs/)**

> 本仓库只存放官网与发布资产。Quileg HID 是闭源软件，App 源码不在本仓库。

## 最新版本

**0.9.33（Build 88）** · 2026-10-24 · [Release 说明](https://github.com/jianghui1974/Quileg-HID/releases/tag/v0.9.33)

| 安装包 | 适用机器 | SHA-256 |
|---|---|---|
| `Quileg-HID-0.9.33-arm64.dmg` | Apple 芯片（M1–M4） | `a528efe624d9dc2b1e6c95b1d8ad6c127785b07762f55b746f950168d55f46f9` |
| `Quileg-HID-0.9.33-intel.dmg` | Intel Mac（macOS 13–26） | `639bbf5fbe48f685047222522417f2c0d7a00cfbeab09c77f60590a96d3d79fc` |

**两个包不通用**：装错会提示「需要 Apple 芯片」。包内 `VERSION.txt` 的 `Arch:` 行可以核对；
下载后可用同 Release 中的 `.sha256` 文件校验完整性。

## 要求

| 项 | 要求 |
|---|---|
| 系统 | macOS 13.0 及以上 |
| 处理器 | Apple Silicon（M1–M4）或 Intel Mac（macOS 13–26）；两个架构**分开下载、互不混装** |
| 硬件 | ESP32-S3 开发板，16MB Flash（XIAO ESP32S3 Plus、ESP32-S3-WROOM-1-N16R8 模组的第三方板已验证） |
| 被控设备 | iPhone / iPad（AirPlay 屏幕镜像）；Android / Windows / macOS 需 UVC 采集卡 |

## 安装

1. 按机器选包：Apple 芯片下载 `-arm64`，Intel Mac 下载 `-intel`；
2. 把 `Quileg HID.app` 拖进「应用程序」；
3. 按 App 内引导刷固件、投屏、校准（约 13 分钟，之后只要不改手机、分辨率、指针大小、视频源和方向就不用再做）。

安装包已用 Developer ID 签名、经 Apple 公证，公证票据写入包内，首次启动无需联网验证。

## 0.9.33 要点

- **新增 Intel（x86_64）版本**：与 Apple 芯片版功能一致，包含 AirPlay 无线投屏；
- **iPad「锁屏」修复**：iPadOS 26 上指针碰到屏幕顶边会拉下通知中心/控制中心（看起来像锁屏）。
  0.9.33 起归位改为**底部锚定**，不再碰顶边；旧版本升级后请**重新校准一次**；
- **按键安全**：归位前先松开所有鼠标键，长按/拖拽的松手放进 `finally`，不会再卡键；
- 其余功能与 0.9.30 相同：双板通用固件 0.7.0、语音桥、AI 活动条、视频网格等。

## 许可

App 免费下载、安装、运行；源码闭源，不随包提供。全文见 [LICENSE](LICENSE)。

第三方组件：**esp32-iphone-agent**（MIT）、**UxPlay**（GPL-3.0）。
声明与许可全文见官网[许可页](https://jianghui1974.github.io/Quileg-HID/docs/licenses.html)，或安装包内 `THIRD-PARTY-NOTICES.md` 与 `licenses/`。
每个版本对应的 UxPlay 源码随该版本 Release 一并提供（Intel 版另附 `uxplay-build.patch`）。

## 反馈

- [提交 Issue](https://github.com/jianghui1974/Quileg-HID/issues)
- 邮件：contact@airdiode.com

---

Quileg 系列自 2024 年第一代起持续迭代，其他作品见 <https://www.godar.cn>。
