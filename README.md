# XIAO ESP32S3 Plus — 硬件检测与交接文档

> **检测完成**：2026-10-18
> **结论**：板子完好可用，全部功能 PASS，无任何硬件故障
> **固件当前**：**0.7.0 模块化 BLE HID 固件 / 16M 通用镜像**（一份镜像支持 XIAO ESP32S3 Plus 与 ESP32-S3-N16R8，`board=s3-16m`）；源码在 [`firmware/`](firmware/README.md)，legacy 固件保留在 `esp32-iphone-agent-legacy/`。
> **App 当前**：**0.9.72 / Build 127**（线上 Latest 同版），**两个架构分开出包**：`-arm64`（Apple Silicon）与 `-intel`（Intel x86_64），均已公证 + staple。
> 版本历史见 [CHANGELOG.md](CHANGELOG.md)，当前状态见 [HANDOVER.md](HANDOVER.md)，Intel 构建见 [docs/INTEL-BUILD.md](docs/INTEL-BUILD.md)。

---

## 0. 给新对话的接手说明（先看这里）

> **新对话请先读 [HANDOVER.md](HANDOVER.md)**：当前进度、需求边界、怎么跑起来、下一步（UVC 采集 / 签名/公证）都在那里。
> **要让 AI 操作 iPhone，先读 [AI_GUIDE.md](AI_GUIDE.md)**：工具语义、坐标/校准、任务配方、故障排查与安全边界。
> 本文档是板子的**硬件档案**（§1–10）。复刻过程（§11–12）已归档到 [`docs/archive/replication-details.md`](docs/archive/replication-details.md)。

如果你是在新对话里接手，只需要知道这 7 件事：

1. **板子是好板子**，所有功能已验证通过，不用再怀疑硬件。
2. **BLE 固件用 `CDCOnBoot=cdc` 编译**，运行时会枚举 `/dev/cu.usbmodem*`（当前 `...AF641`，115200）并输出 `DEBUG_SERIAL`；诊断也可以走控制层 `Device.ble_state()` / GUI。
3. **测试固件编译必须加 `PSRAM=opi`**，否则 8MB PSRAM 用不了；BLE 固件（`hid_bridge`）不依赖 PSRAM，用通用 `esp32s3` FQBN 编译。
4. **外置天线必须插着**，空着的时候 Wi-Fi 几乎收不到信号。
5. **原厂固件已备份**在 `backup_original_flash.bin`，随时可还原。
6. **已完成 `esp32-iphone-agent` 复刻**（细节在归档的 `docs/archive/replication-details.md`），并做出了可用的设备控制层（`control/README.md`）。
7. **第三方代码有明确边界**：服务端基于 `esp32-iphone-agent`（MIT）改造，AirPlay 接收用 UxPlay（GPL-3.0）；
   声明与许可全文见 [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md) 与 `licenses/`，随 DMG 分发。
   **对外表述不要写「零第三方代码 / 全自研」**。

所有测试都已完成，**不需要重跑**。若只是想看板子活着没有：

```bash
# 服务端状态（需先按 HANDOVER §4 起服务端）
curl -s http://127.0.0.1:8890/api/status

# 或直接读 BLE 串口（当前端口；换口后以 ls /dev/cu.usbmodem* 为准）
cd "/Users/jianghui/Documents/XIAO ESP32S3 Plus"
.venv/bin/python -c "
import serial,time
s=serial.Serial('/dev/cu.usbmodem84C7BB70AF641',115200,timeout=1)
t=time.time()
while time.time()-t<10: print(s.read(4096).decode('utf8','replace'),end='')
"
```

---

## 1. 硬件识别

| 项目 | 读到的值 |
|---|---|
| 芯片 | ESP32-S3 (QFN56) rev **v0.2** |
| 核心 | 双核 Xtensa LX7 @ 240 MHz + LP 协处理器 |
| 无线 | Wi-Fi 2.4GHz + Bluetooth 5 (LE) |
| PSRAM | **8 MB**（板载 OPI） |
| Flash | **16 MB**（SPI quad，3.3V，厂商 ID 0x55 / 设备 0x2018） |
| 晶振 | 40 MHz |
| MAC (STA) | `84:C7:BB:70:AF:64` |
| USB | 原生 USB-Serial/JTAG（**不需要** CH340/CP2102 驱动） |
| 供电 | USB 总线供电，识别正常 |
| SDK | ESP-IDF v5.5-1-gb66b5448e0 |

与 XIAO ESP32S3 Plus 官方规格（ESP32-S3R8 + 8MB PSRAM + 16MB Flash）**完全一致**，无缩水、无错料。

> **为什么标配 16 MB Flash**（2026-10 决策）：不是当下功能需要，而是为将来的**板载摄像头兜底**
> （第三视频源）预留——摄像头驱动 + 帧缓冲需要 3 MB app 分区（`huge_app`），而当前分区表 app 只有
> 1.25 MB（固件已占 1.17 MB，余量约 10%），8 MB 板放不下。**现阶段**两块板的固件功能等价
> （同一张分区表），16 MB 的余量尚未兑现。分区、余量与实施清单见
> [firmware/docs/CAPACITY.md](firmware/docs/CAPACITY.md)。

---

## 2. 测试结果总览

| # | 测试项 | 方法 | 结果 |
|---|---|---|---|
| 1 | 芯片识别 | esptool `chip-id` / `flash-id` | ✅ PASS |
| 2 | Flash 擦除 | 全片 16MB 擦除 | ✅ 7.5 s |
| 3 | Flash 写入 | 写 870,688 B + hash 校验 | ✅ PASS（1159 kbit/s） |
| 4 | Flash 读取 | 全片 16MB 回读备份 | ✅ 16,777,216 B，66.5 s |
| 5 | PSRAM 读写 | 分配 4MB 写入回读比对 | ✅ **0 错误** |
| 6 | NVS 掉电保存 | 写启动计数，复位后读回 | ✅ PASS（1 → 2） |
| 7 | Wi-Fi 扫描（无天线） | 每 10 s 复扫 | ⚠️ 仅 1 AP（天线未接） |
| 8 | Wi-Fi 扫描（接天线） | 5 轮复扫 | ✅ **21~32 AP** |
| 9 | Wi-Fi 端到端 | 关联 + DHCP + TCP + DNS + HTTP | ✅ **全 PASS** |
| 10 | USB-CDC 串口 | `Serial` 双向输出 | ✅ PASS |
| 11 | 用户 LED | GPIO21 低电平有效，1 Hz | ✅ PASS |
| 12 | 复位电路 | RTS 硬复位重启 | ✅ PASS |
| 13 | 内存稳定性 | 7+ 轮压力复测 | ✅ heap 无变化，无泄漏 |

---

## 3. 详细测试记录

### 3.1 基础自检（`docs/archive/bring-up/selftest/selftest.ino`）

固件逐项验证并打印报告，实际输出见 `docs/archive/bring-up/serial_boot_log_selftest.txt`：

```
==================================================
  XIAO ESP32S3 Plus  |  hardware self test
==================================================
  Chip            : ESP32-S3 rev v0.2, 2 core(s)
  CPU frequency   : 240 MHz
  Crystal         : 40 MHz
  Flash size      : 16 MB
  PSRAM size      : 8.0 MB
  SDK             : v5.5-1-gb66b5448e0
  MAC (STA)       : 84:C7:BB:70:AF:64
  Reset reason    : 11  (USB reset)
--------------------------------------------------
  [PASS] PSRAM RW test   (4194304 bytes checked, 0 errors)
  [PASS] NVS/flash RW    (boot counter = 2, prev = 1)
  [PASS] Wi-Fi scan      (1 network(s) found)
  [ OK ] USB-CDC       (this text proves it works)
  [ ?? ] LED GPIO21     (should be blinking ~1 Hz)
--------------------------------------------------
  Free heap: 278384 B   Free PSRAM: 8376248 B
==================================================
```

> 注意：这里 Wi-Fi 只扫到 1 个 AP，是**天线未接**导致的，不是故障，详见 3.2。

**PSRAM 测试细节**：分配 4 MB（容量一半），逐字节写入 `(i*7+0xA5)` 再回读比对，0 错误 —— 这说明 8MB PSRAM 完全可用，不是"能识别但坏块"。

**NVS 测试细节**：写入启动计数器后复位，读回值从 1 变 2，证明 Flash 掉电保存正常。

### 3.2 天线对比测试（`docs/archive/bring-up/wifi_survey/wifi_survey.ino`）

首次自检时**没插外置天线**，Wi-Fi 只扫到 1 个 AP。插上 IPEX 外置天线后重测，结果数量级变化：

| 指标 | 未接天线 | 接上天线 |
|---|---|---|
| 扫描到的 AP 数 | **1** | **21 ~ 32**（平均 27.4） |
| 最强信号 | — | **-44 ~ -47 dBm** |
| 最弱信号 | — | -92 ~ -95 dBm |
| 最强 AP 跨轮波动 | — | 仅 **3 dB** |

5 轮连续扫描：

```
轮次   AP数   最强    最弱    最强AP
1      23    -44     -95    Xiaomi_jianghui
2      21    -45     -92    Xiaomi_jianghui
3      32    -45     -94    Xiaomi_jianghui
4      30    -46     -94    Xiaomi_jianghui
5      31    -47     -95    Xiaomi_jianghui
```

**结论**：

- -44 dBm 属于近距离强信号，灵敏度毫无问题。
- 波动仅 3 dB，说明 IPEX 座子接触良好、无虚接。
- **这块板子的外置天线接口是必接的**：空着时射频基本断路，会伪装成"只能扫到 1 个网络"的假象，很有迷惑性。以后 Wi-Fi 搜不到网络，第一件事查天线。

原始日志见 `docs/archive/bring-up/wifi_antenna_log.txt`。

### 3.3 Wi-Fi 端到端联网（`docs/archive/bring-up/wifi_connect/wifi_connect.ino`）

连上真实路由器，完整走通 DHCP → TCP → DNS → HTTP：

```
*** WIFI END-TO-END TEST ***
  connecting...........
  [PASS] connected in 3300 ms
  SSID     : Xiaomi_jianghui
  BSSID    : 64:09:80:57:B3:3F
  RSSI     : -45 dBm
  channel  : 11
  IP       : 192.168.31.25      <- DHCP 正常
  gateway  : 192.168.31.1
  subnet   : 255.255.255.0
  DNS      : 192.168.31.1
  MAC(STA) : 84:C7:BB:70:AF:64
  [PASS] TCP 192.168.31.1:80  connect 13 ms
  [PASS] DNS www.baidu.com -> 183.240.99.224  (14 ms)
  [PASS] HTTP GET baidu  status=200  len=29506  40 ms
```

连续复测（跑到第 16 轮仍稳定）：

| 项目 | 结果 |
|---|---|
| 关联耗时 | 3.3 s（首次） |
| RSSI | -45 ~ -50 dBm |
| TCP 网关 :80 | 3 ~ 13 ms |
| DNS 解析 | 0 ~ 14 ms |
| HTTP GET baidu | status **200**，29506 B，40 ~ 74 ms |
| 掉线重连 | 未发生 |
| Free heap | 275728 B **全程一字未变**（无泄漏） |

**这证明收发双向链路、DHCP、ARP、DNS、TCP、HTTP 全链路正常**，Wi-Fi 可以放心用。

原始日志见 `wifi_connect_log.txt`。

---

## 4. 当前板子状态

| 项目 | 状态 |
|---|---|
| 当前固件 | `esp32-iphone-agent-legacy/hardware/hid_bridge` 的 **BLE HID 版**（`HID Bridge XXXX`） |
| 串口 | 正常运行时是 `/dev/cu.usbmodem*`（当前 `...AF641`，115200）；BLE 版用 `CDCOnBoot=cdc` 编译，`DEBUG_SERIAL` 走它 |
| 供电 | USB-C 接充电器或 Mac（供电/调试串口），不接 iPhone |
| 无线 | Wi-Fi 由 NVS 配置（app 写入；当前 `Xiaomi_jianghui`），命令连 Mac 的 `7300`；蓝牙同时作为 iPhone 的键鼠 |
| LED | GPIO21 用户 LED：**常亮** = Wi-Fi + BLE 都连上；**慢闪 1 Hz** = 只有 Wi-Fi；**快闪 4 Hz** = 只有 BLE；**灭** = 都没连。另一颗是充电指示灯，不受 GPIO 控制 |
| 上电输出延迟 | 测试固件实测约 2.5 s；BLE 版可从串口启动日志核对 |

> 历史记录：刷 BLE 之前，板子跑 `wifi_connect` 测试固件，串口为 `/dev/cu.usbmodem2101`。那段流程见 §7 与 §11。

---

## 5. 环境与工具链

| 工具 | 版本 / 位置 |
|---|---|
| 主机 | macOS 27.0.1，arm64（Apple Silicon） |
| Python | 3.13.14（工作区内 `.venv`） |
| esptool | **v5.6.0**（装在 `.venv`，用 `.venv/bin/python -m esptool`） |
| arduino-cli | **1.5.1**（Homebrew，`/opt/homebrew/bin/arduino-cli`） |
| esp32 core | **3.3.0**（已装好，可离线编译） |
| PlatformIO | 6.1.19（已装，但本次未使用） |
| FQBN | `esp32:esp32:XIAO_ESP32S3_Plus`（测试固件；BLE 固件用 `esp32:esp32:esp32s3:...`，见 HANDOVER §4） |
| 编译选项 | `PSRAM=opi`（**测试固件必须**；BLE 固件不用 PSRAM） |

核心板参数（来自 boards.txt）：`usb_mode=0`、`cdc_on_boot=1`、`flash_size=16MB`、`partitions=ffat`、`psram_type=qspi`（选 `PSRAM=opi` 时覆盖为 opi 并定义 `BOARD_HAS_PSRAM`）。

---

## 6. 文件清单

> 只列**现在还在用**的。装机期的固件 sketch、编译产物、串口日志都在
> [`docs/archive/bring-up/`](docs/archive/bring-up/)；完整文档地图见 [HANDOVER.md](HANDOVER.md) §9。

| 文件 / 目录 | 说明 |
|---|---|
| `backup_original_flash.bin` | **原厂固件完整备份**，16,777,216 B（要还原见 §9） |
| `Seeed Studio XIAO ESP32-S3 Plus.pdf` | 官方数据手册（SKU 102010671，2026-09-20 版），Plus 版参数以此为准 |
| `VERSION` / `BUILD_NUMBER` | 版本号唯一来源（出包脚本与 App 都读它） |
| `HANDOVER.md` | **新对话入口**：当前状态、下一步、发版流程、边界 |
| `CHANGELOG.md` | 哪版改了什么（0.9.27–0.9.72） |
| `PITFALLS.md` | 踩坑与经验库（按屏幕/输入/坐标/校准/发布分类） |
| `AI_GUIDE.md` | **给 AI 的操作手册**：工具语义、坐标/校准、任务配方、排障、安全边界 |
| `MCP-SETUP.md` | **客户可见**的 MCP 接入说明（随 DMG 分发） |
| `DELIVERY.md` / `新板安装SOP.md` | 客户交付验收 / 新板批量装机 |
| `firmware/` | 固件源码与构建（`firmware/build.sh s3_16m_universal`） |
| `esp32-iphone-agent-legacy/` | legacy 架构（Mac 端服务 + 板子 **BLE HID**），控制层的底座 |
| `control/` | **设备控制层**：`device.py`（点击/键盘/校验/恢复）、`calibration.py`（校准）、`mcp_server.py`（MCP 工具）；说明见 `control/README.md` |
| `app/` | **Mac 控制端**：实时镜像 + 点击/输入/自愈 + 配网 + 校准向导；见 `app/README.md` |
| `app/firmware/` | **内置固件镜像**（`factory-16m.bin` / `app-16m.bin`）+ `manifest.json`（含 sha256） |
| `pointer-tester/` | **校准探针**：`probe/`（可装到 iPhone/iPad，把指针真值打在屏幕上）+ `web/`（网页版）；定位与实测见归档的 `docs/archive/pointer-tester/` |
| `packaging/` | 出包脚本（`build_release.sh` / `HIDBridge.spec` / UxPlay 打包） |
| `tools/` | 辅助脚本：`ui_check.py`（界面检查）、`calib_check.py`（免 GUI 跑校准）、`feedback_mail.py`（反馈邮箱） |
| `artifacts/` | 实测截图：校准画布、各角停车点、计算器演示、键盘输入验证 |
| `.venv/` | Python 虚拟环境（含 esptool + pyserial） |

---

## 7. 常用操作

### 7.1 读串口

> 适用于当前 BLE 固件（`CDCOnBoot=cdc`）和自检/`wifi_connect` 等测试固件。只有构建时关掉 CDC，才会没有串口。

```bash
cd "/Users/jianghui/Documents/XIAO ESP32S3 Plus"
.venv/bin/python -c "
import serial,time
s=serial.Serial('/dev/cu.usbmodem2101',115200,timeout=1)
t=time.time()
while time.time()-t<15: print(s.read(4096).decode('utf8','replace'),end='')
"
```

### 7.2 硬复位并抓启动日志（能抓到开头的自检报告）

> BLE 固件同样有串口输出（`DEBUG_SERIAL`）；本脚本用于测试固件时能抓到完整自检报告。

```bash
.venv/bin/python boot_capture.py 30
```

### 7.3 编译 + 烧录

```bash
# 以归档里的 selftest 为例（docs/archive/bring-up/selftest），换成 wifi_survey / wifi_connect 同理
arduino-cli compile -b esp32:esp32:XIAO_ESP32S3_Plus:PSRAM=opi \
  --output-dir .tmp/build-selftest docs/archive/bring-up/selftest
arduino-cli upload  -b esp32:esp32:XIAO_ESP32S3_Plus:PSRAM=opi -p /dev/cu.usbmodem2101 \
  --input-dir .tmp/build-selftest docs/archive/bring-up/selftest
```

### 7.4 手动进入下载模式（烧录失败时用）

```bash
.venv/bin/python -c "
import serial,time
s=serial.Serial('/dev/cu.usbmodem2101',115200,timeout=0.2)
s.setDTR(False); s.setRTS(True); time.sleep(0.3); s.setRTS(False); s.setDTR(False)
time.sleep(0.3); s.close()
"
```

或者最原始的办法：**按住 BOOT 键，重新插拔 USB-C 线**。

### 7.5 读芯片信息

```bash
.venv/bin/python -m esptool -p /dev/cu.usbmodem2101 --before no-reset chip-id
.venv/bin/python -m esptool -p /dev/cu.usbmodem2101 --before no-reset flash-id
```

---

## 8. 踩坑清单（重要，能省很多时间）

1. **PSRAM 必须选 OPI**
   编译要加 `PSRAM=opi`，否则 8MB PSRAM 用不了（板子是 ESP32-S3R8， Octal PSRAM）。

2. **原生 USB 的 DTR/RTS 极性与 UART 桥反相**
   用 pyserial 复位时：`DTR=False` → 进**下载模式**；`DTR=True` → 正常启动。
   这和 CH340/CP2102 的习惯是反的，很容易踩。

3. **不要只看 PID 判断是否在下载模式**
   ROM 下载模式是 `303A:1001`，但 app 以「硬件 CDC」模式运行时**也是** `303A:1001`。
   唯一可靠的判据是：**看有没有串口输出**。

4. **外置天线必接**
   不接天线时 Wi-Fi 只扫到 1 个 AP，会严重误导判断。

5. **烧录后偶尔要拔插一次 USB**
   RTS 软复位不一定能让 app 跑起来；用 `boot_capture.py` 里的 esptool 硬复位更可靠。

6. **端口名可能变**
   目前是 `/dev/cu.usbmodem2101`，重新枚举后可能是别的编号，用 `ls /dev/cu.usbmodem*` 确认。

7. **首次插上电脑可能完全看不到设备**
   这是**正常的** —— 原厂固件没启用 USB-CDC。按住 BOOT+RST 进下载模式就能看到。

---

## 9. 恢复原厂固件

擦除前已备份完整 16 MB 镜像。原分区布局（标准 ESP-IDF 风格）：

```
0x00009000    20 KB   nvs
0x0000e000     8 KB   otadata
0x00010000  3264 KB   app0
0x00340000  3264 KB   app1
0x00670000  1536 KB   spiffs
0x007f0000    64 KB   coredump
```

恢复步骤：

```bash
# 1. 进下载模式（按住 BOOT 拔插 USB，或用 7.4 的脉冲）
# 2. 整片写回
.venv/bin/python -m esptool -p /dev/cu.usbmodem2101 write-flash 0 backup_original_flash.bin
```

---

## 10. 注意事项与待办

- ⚠️ **`docs/archive/bring-up/wifi_connect/wifi_connect.ino` 里有明文 Wi-Fi 密码**。如果这个目录要进 git 或分享给别人，务必先清掉密码（或改成从宏/外部文件读取）。
- ⚠️ **外置天线务必保持连接**，拔掉后 Wi-Fi 基本不可用。
- ℹ️ 板子可以放心当开发板用，随时可以擦除重刷。
- ℹ️ 若不需要备份，`backup_original_flash.bin` 可删除以省 16 MB。
- ℹ️ 板子当前占用路由器一个 DHCP 地址（`192.168.31.25`），刷自己的固件后会自动释放。
- ℹ️ 换 Wi-Fi 不用重刷固件：板子 USB 连 Mac → app「网络 → Wi-Fi / 服务器配置…」→ 写入并应用。
- ℹ️ 下一步计划：UVC 采集后端、DMG 签名/公证、闭环纠偏（见 `HANDOVER.md` §6）。

---

## 11. 复刻记录（已归档）

早期为了验证「Plus 版能不能跑 `esp32-iphone-agent`」做了完整复刻：兼容性核对、刷写命令、
上游已知限制、AP/STA 网络模式、设备验证矩阵、设备控制层的由来 —— **原样**归档在
[`docs/archive/replication-details.md`](docs/archive/replication-details.md)。
结论只有一句：**Plus 版可用**，复刻成果就是今天的 `control/` 与 `esp32-iphone-agent-legacy/`。

---

## 13. MCP / AI 接入

把控制层暴露成 MCP tools，AI 宿主（DSH、Claude Desktop、Cursor 等）可以直接"看屏幕 + 点 + 验证"：

| 工具 | 作用 |
|---|---|
| `app_status` | Mac App 自身状态（版本/模式/固件/设置/日志路径） |
| `app_logs` | 读 App 运行日志（脱敏，支持级别/时间/关键字） |
| `app_diagnostics` | 一键诊断报告，可直接贴给用户 |
| `app_docs` | 这一版的随包文档（手册/踩坑/发行说明），AI 升级后自动跟上 |
| `app_update` | 有没有新版 + 这版改了什么 + 下载页（AI 只提醒，下载/安装由用户点浏览器） |
| `calibration_status` | 当前校准表（profile/时间/延迟/refs；`resume` = 未完成的校准进度） |
| `calibration_request` | 请求用户打开校准向导（人工确认） |
| `calibration_reload` | 用户校准完后重载新表 |
| `status` | 板子 / 投屏 / 校准 / BLE 状态 |
| `screenshot` | 500×1080 JPEG，可选 10×10 网格 |
| `ocr` | 识别屏幕文字，返回每块文字 + 归一化坐标，可直接点 |
| `click_text` | OCR 找到文字并点击，自动处理图标标签偏移 |
| `click(x,y)` | 归一化坐标点击，返回 `changed` + 新截图 |
| `move(x,y)` | 只移动不点击 |
| `type_text(text)` | 仅 ASCII；中文用拼音 + OCR/视觉点选 |
| `key(combo)` | ⌘H、⌘Space、Esc、方向键等白名单 |
| `scroll(dy)` | 垂直滚动 |

- 源码：`control/mcp_server.py`；stdio 直接 `python control/mcp_server.py`；
- DSH 已接入 `~/.dsh/profiles/desktop/cordis.patch.yml`，工具名是 `mcp__iphone__*`；
- 打包版：`HIDBridge.app/Contents/MacOS/HIDBridge --mcp`，已实测可被 MCP client 拉起，**不需要外部 Python/MCP SDK**；
- 详细设计、DSH 配置、安全边界与打包说明见 [`docs/archive/MCP.md`](docs/archive/MCP.md)（内部研究稿，已归档）。

> 校准以 `control/calib.json` 的 `profiles` 为准；换 iPhone / 指针大小 / 分辨率后要重测。
> 诊断类工具（`app_*`）只读且日志已脱敏，可作为排障第一步。

---

## 附录：关键原始日志位置

| 日志 | 文件 |
|---|---|
| 自检报告（完整格式化输出） | `docs/archive/bring-up/serial_boot_log_selftest.txt` |
| 天线对比（5 轮扫描，含每个 AP 的 RSSI） | `wifi_antenna_log.txt` |
| 联网测试（含 7 轮复测明细） | `wifi_connect_log.txt` |
