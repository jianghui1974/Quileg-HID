# Quileg HID

让 AI 通过投屏看画面、通过蓝牙键鼠操作 iPhone / iPad 的 macOS 应用。
无需越狱、无需在手机上安装 App、无需开发者模式。

**[官网](https://jianghui1974.github.io/Quileg-HID/)** · **[下载最新版](https://github.com/jianghui1974/Quileg-HID/releases/latest)** · **[文档](https://jianghui1974.github.io/Quileg-HID/docs/)**

> 本仓库只存放官网与发布资产。Quileg HID 是闭源软件，App 源码不在本仓库。

## 要求

| 项 | 要求 |
|---|---|
| 系统 | macOS 13.0 及以上 |
| 处理器 | Apple Silicon（M 系列），暂不支持 Intel Mac |
| 硬件 | ESP32-S3 开发板，16MB Flash（XIAO ESP32S3 Plus、ESP32-S3-WROOM-1-N16R8 模组的第三方板已验证） |
| 被控设备 | iPhone / iPad（AirPlay 屏幕镜像）；Android / Windows / macOS 需 UVC 采集卡 |

## 安装

1. 从 [Releases](https://github.com/jianghui1974/Quileg-HID/releases/latest) 下载 DMG；
2. 把 `Quileg HID.app` 拖进「应用程序」；
3. 按 App 内引导刷固件、投屏、校准（约 13 分钟，之后只要不改手机、分辨率、指针大小、视频源和方向就不用再做）。

安装包已用 Developer ID 签名、经 Apple 公证，公证票据写入包内，首次启动无需联网验证。
下载后可用同 Release 中的 `.sha256` 文件核对完整性。

## 许可

App 免费下载、安装、运行；源码闭源，不随包提供。全文见 [LICENSE](LICENSE)。

第三方组件：**esp32-iphone-agent**（MIT）、**UxPlay**（GPL-3.0）。
声明与许可全文见官网[许可页](https://jianghui1974.github.io/Quileg-HID/docs/licenses.html)，或安装包内 `THIRD-PARTY-NOTICES.md` 与 `licenses/`。
每个版本对应的 UxPlay 源码随该版本 Release 一并提供。

## 反馈

- [提交 Issue](https://github.com/jianghui1974/Quileg-HID/issues)
- 邮件：contact@airdiode.com

---

Quileg 系列自 2024 年第一代起持续迭代，其他作品见 <https://www.godar.cn>。
