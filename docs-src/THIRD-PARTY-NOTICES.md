# 第三方开源组件声明（Third-Party Notices）

> **产品**：Quileg HID（Mac 控制端 + ESP32-S3 BLE HID 板子）
> **最后更新**：2026-10-24
> **适用**：0.9.7 及以后的 DMG / App / 源码包
> **维护规则**：新增或升级任何第三方组件时，必须同步本文件与 `licenses/` 目录，否则打包脚本会拒绝出包。

---

## 0. 总览

| 组件 | 许可 | 在 Quileg HID 中的角色 | 是否修改 |
|---|---|---|---|
| [esp32-iphone-agent](https://github.com/onehumanbeing/esp32-iphone-agent) | **MIT** | 服务端 `hidagent` 的基础；固件协议参考 | 是（见 §1.2） |
| [UxPlay](https://github.com/FDH2/UxPlay) | **GPL-3.0** | AirPlay 接收器（随 App 分发的独立二进制） | 是（Intel 版仅两行构建补丁，见 §2.2） |
| GStreamer 及其插件 | LGPL-2.1 | UxPlay 的运行时依赖（动态链接的 dylib） | 否 |
| Python 运行时与依赖 | 各自许可（MIT/BSD/Apache-2.0/LGPL） | App 内置的 Python 解释器与库 | 否 |

**边界说明**：Quileg HID 的桌面控制端（`app/`）、校准与指针系统（`control/`）、板子固件（`firmware/`）、交互与视觉设计均为 Quileg 自有实现，不在上述任何开源许可的覆盖范围内。

---

## 1. esp32-iphone-agent（MIT）

### 1.1 来源

| 项 | 值 |
|---|---|
| 仓库 | https://github.com/onehumanbeing/esp32-iphone-agent |
| 快照提交 | `1315d5759a66fdaa392ce79ac780ec5fbafd9bac`（legacy 分支） |
| 快照日期 | 2026-10-13 |
| 许可 | MIT |
| 版权 | Copyright (c) 2026 Henry Yuan |

### 1.2 本项目使用了什么、改了什么

**复用（保留上游实现，做局部修改）**：

- `server/hidagent/app.py`：FastAPI 路由与应用装配 —— 改为 Quileg 首页、移除上游 Agent 路由、新增视频源/诊断接口（+104/−8）；
- `server/hidagent/screen.py`：AirPlay 取帧 —— 增加多源路由与录屏帧率处理（+42/−6）；
- `server/hidagent/` 下 `device.py`、`phone.py`、`vision.py`、`video.py`、`uvc.py`：板子 TCP 协议、指针闭环手势、视觉定位、视频源路由 —— **基本保持上游实现**；
- `hardware/hid_bridge/`：「板子零逻辑 + 行命令」的协议设计被沿用，固件在 `firmware/` 中重写；
- `control/pointer_calibrate.py`：指针检测算法移植自上游 `vision.py` 的 `pointer()`。

**不再使用（0.9.7 起已从运行路径与打包产物中移除）**：

- `server/hidagent/agent.py`（上游 LLM planner/actor）；
- `server/hidagent/llm.py`（OpenAI 兼容客户端）；
- `server/hidagent/static/`（上游网页 UI）。

这些文件仍保留在源码目录中，以满足 MIT 的完整性要求并便于追溯，但**不参与构建、不随 DMG 分发**。

### 1.3 MIT 许可全文

```
MIT License

Copyright (c) 2026 Henry Yuan

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

许可全文另存于 [`licenses/esp32-iphone-agent-LICENSE.txt`](licenses/esp32-iphone-agent-LICENSE.txt)。

---

## 2. UxPlay（GPL-3.0）

### 2.1 来源与版本

| 项 | 值 |
|---|---|
| 仓库 | https://github.com/FDH2/UxPlay |
| 版本 | UxPlay 1.74（构建于 2026-10，对应上游 `master`） |
| 许可 | GNU General Public License v3.0 |

### 2.2 分发形式

- Quileg HID 以**独立可执行文件**形式随 App 分发：`Quileg HID.app/Contents/Frameworks/airplay/uxplay`；
- **0.9.79 起两个架构都套用了 [`packaging/uxplay-record.patch`](packaging/uxplay-record.patch)**
  （`-mp4ctl` 命令文件驱动的录制：环形录制、断线 hold、AVCC→Annex-B 转换、分片 mp4）。
  该补丁**只在传入 `-mp4ctl <file>` 时生效**，命令行不带这个参数时 UxPlay 的行为与上游一致
  （Quileg HID 保留上游的 `-mp4` 语义，不改变其用法）。对应源码 = 上游源码 + 该补丁（见 §2.3）；
- **Intel 版**另加一个**只有两行的构建补丁**
  [`packaging/uxplay-build.patch`](packaging/uxplay-build.patch)：把 `PKG_CONFIG_PATH` 的赋值从「覆盖」改成「环境优先」，
  以便链接官方 universal GStreamer。该补丁不改变 UxPlay 的任何功能逻辑；
- Quileg HID 与 UxPlay 通过**进程边界**（命令行参数 + 标准输出管道）交互，两者是独立程序；GPL-3.0 的覆盖范围仅及 UxPlay 本身及其衍生作品，**不延伸到 Quileg HID 的自有代码**；
- 随包同时提供 GPL-3.0 全文：[`licenses/GPL-3.0.txt`](licenses/GPL-3.0.txt)。

### 2.3 对应源码（GPL-3.0 §6 履约）

按 GPL-3.0 的要求，我们向收到本产品的任何人提供 UxPlay 的**对应源码**：

1. **同一下载页提供源码包**：`uxplay-master-source.tar.gz`（与所分发二进制同版本的上游源码，
   包内已附带两个补丁与说明）以及单独的 `uxplay-record.patch`、`uxplay-build.patch`；
2. 或访问上游仓库对应版本：<https://github.com/FDH2/UxPlay>；
3. 若以上方式不可用，可书面请求 `quileg@airdiode.com`，我们在 **3 年内**免费提供完整源码（可选用物理介质，仅收取成本费）。

源码包的生成脚本见 `packaging/fetch_uxplay_source.sh`，发布时与 DMG 放在同一目录。

---

## 3. GStreamer 及其他随包原生库

UxPlay 依赖 GStreamer 及若干插件（LGPL-2.1）。这些库以**未修改的动态库**形式随 App 分发，位于 `Quileg HID.app/Contents/Frameworks/airplay/`：

- 源码可从 <https://gstreamer.freedesktop.org/source/> 与各插件上游获取；
- LGPL-2.1 允许动态链接使用；如需替换其中任何库，可用同版本 ABI 兼容的构建替换对应 `.dylib`；
- 完整的随包文件清单与版本，直接查看 App 包内的 `Contents/Frameworks/airplay/`。

---

## 4. Python 运行时与依赖

App 内置 Python 运行时及以下主要依赖（均为未修改的发行版）：

| 包 | 许可 |
|---|---|
| fastapi / starlette / pydantic / uvicorn | MIT / BSD-3-Clause |
| Pillow | MIT-CMU |
| numpy | BSD-3-Clause |
| mcp / mcp-types | MIT |
| esptool / pyserial | GPL-2.0（esptool）/ BSD-3-Clause（pyserial） |
| websockets / httpx / click | BSD-3-Clause / MIT |

每个包自带的许可全文随包保留在 `Contents/Resources/<包名>-<版本>.dist-info/licenses/` 下。

> esptool 为 GPL-2.0：它以独立 Python 包形式被调用（刷写固件时作为库导入），源码可从 <https://github.com/espressif/esptool> 获取；如对外分发，请同时遵守 GPL-2.0 的源码提供义务。

---

## 5. 商标与免责

**商标归属**

Apple、iPhone、iPad、iOS、iPadOS、macOS、AirPlay、Spotlight、Siri、iCloud、Finder、
App Store、Safari 是 Apple Inc. 在美国及其他国家和地区的商标或注册商标。
Windows 是 Microsoft Corporation 的商标；Android 是 Google LLC 的商标。
本文件、随包文档与软件界面中出现的其他产品名、公司名与服务名，
均为其各自所有者的商标或注册商标。

**无隶属关系**

Quileg HID 与上述公司**无任何隶属、合作、赞助、认证或认可关系**；提及这些名称
仅用于说明兼容性、操作路径或实测现象（nominative use），**不表示其对本产品背书**。
本产品不是 Apple 官方产品，也未获得 Apple Inc. 的认证或授权。

**第三方 App 示例**

文档中的第三方 App 仅作为操作示例，用于说明通用操作路径；不表示与这些 App 的开发者
存在合作、兼容性承诺或技术支持关系。对第三方 App 的具体操作，请自行确认符合其服务条款。

**开源组件担保**

上述开源项目的作者**未**对 Quileg HID 提供背书、担保或技术支持；
各组件均按「原样」提供，不附带任何明示或暗示的担保。

---

## 6. 联系方式

开源合规相关事宜：`quileg@airdiode.com`
