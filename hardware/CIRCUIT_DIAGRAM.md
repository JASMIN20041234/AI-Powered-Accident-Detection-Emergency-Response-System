# SENTINEL — Circuit Diagram & Wiring Guide

## Component List

| # | Component | Qty | Notes |
|---|-----------|-----|-------|
| 1 | Arduino Uno R3 | 1 | Main controller |
| 2 | NodeMCU (ESP8266) | 1 | WiFi bridge to backend |
| 3 | Neo-7M GPS Module | 1 | 9600 baud, 3.3V |
| 4 | SIM900A GSM Module | 1 | 5V, needs 2A peak |
| 5 | LCD 16×2 (HD44780) | 1 | 4-bit parallel mode |
| 6 | ADXL335 Accelerometer | 1 | Analog 3-axis |
| 7 | 10K Potentiometer | 1 | LCD contrast |
| 8 | TP4056 Charger Module | 1 | LiPo charging |
| 9 | 18650 Battery + holder | 1 | 3.7V LiPo |
| 10 | Jumper wires | — | M-M, M-F |

---

## ASCII Circuit Diagram

```
                        ┌─────────────────────────────────┐
                        │         ARDUINO UNO R3           │
                        │                                  │
  ADXL335               │  A0 ◄──── X-out                 │
 ┌──────────┐           │  A1 ◄──── Y-out                 │
 │ VCC ─────┼───────────┤  3.3V                           │
 │ GND ─────┼───────────┤  GND                            │
 │ X-out ───┼───────────┤  A0                             │
 │ Y-out ───┼───────────┤  A1                             │
 │ Z-out ───┼───────────┤  A2                             │
 └──────────┘           │                                  │
                        │  2 (RX) ◄──── GPS TX            │
  Neo-7M GPS            │  3 (TX) ────► GPS RX (opt)      │
 ┌──────────┐           │  4 (RX) ◄──── MCU D6            │
 │ VCC ─────┼───────────┤  5V                             │
 │ GND ─────┼───────────┤  GND                            │
 │ TX  ─────┼───────────┤  Pin 2                          │
 │ RX  ─────┼───────────┤  Pin 3                          │
 └──────────┘           │  5 (TX) ────► MCU D5            │
                        │                                  │
  NodeMCU               │  6 (RX) ◄──── GSM TX            │
 ┌──────────┐           │  7 (TX) ────► GSM RX            │
 │ D5(GPIO14)┼───────────┤  Pin 5 (TX to MCU)             │
 │ D6(GPIO12)┼───────────┤  Pin 4 (RX from MCU)           │
 │ GND ─────┼───────────┤  GND  ← COMMON GROUND          │
 │ VIN ─────┼── 5V supply (USB or regulator)              │
 └──────────┘           │                                  │
                        │  8  ────► LCD RS                 │
  LCD 16×2              │  9  ────► LCD E                  │
 ┌──────────┐           │  10 ────► LCD D4                 │
 │ VSS ─────┼───────────┤  GND                            │
 │ VDD ─────┼───────────┤  5V                             │
 │ VO  ─────┼── Pot wiper                                 │
 │ RS  ─────┼───────────┤  Pin 8                          │
 │ RW  ─────┼───────────┤  GND  (always write)            │
 │ E   ─────┼───────────┤  Pin 9                          │
 │ D4  ─────┼───────────┤  Pin 10                         │
 │ D5  ─────┼───────────┤  Pin 11                         │
 │ D6  ─────┼───────────┤  Pin 12                         │
 │ D7  ─────┼───────────┤  Pin 13                         │
 │ A   ─────┼──[220Ω]───┤  5V   (backlight +)            │
 │ K   ─────┼───────────┤  GND  (backlight −)            │
 └──────────┘           └─────────────────────────────────┘
       │
  10K Potentiometer
 ┌─────┴─────┐
 Pin1─GND  Pin3─5V   Pin2(wiper)─LCD VO


  SIM900A GSM                    Power section
 ┌──────────┐              ┌──────────────────────┐
 │ VCC ─────┼──────────────┤  5V / 2A supply      │
 │ GND ─────┼──────────────┤  GND                 │
 │ TX  ─────┼──────────────┤  Arduino Pin 6        │
 │ RX  ─────┼──────────────┤  Arduino Pin 7        │
 │ SIM ─────┼── Insert active SIM (GPRS data plan) │
 └──────────┘              │                      │
                           │  18650 battery        │
                     ┌─────┴──────────────┐        │
                     │  TP4056 Charger    │        │
                     │  BAT+ ── Cell +   │        │
                     │  BAT− ── Cell −   │        │
                     │  OUT+ ── 5V reg ──┼────────┘
                     │  USB ─ charging   │
                     └───────────────────┘
```

---

## Pin Reference Table

### Arduino Uno R3

| Arduino Pin | Connected To | Direction | Notes |
|-------------|-------------|-----------|-------|
| 3.3V | ADXL335 VCC | OUT | Max 50 mA from this pin |
| 5V | LCD VDD, GPS VCC | OUT | |
| GND | All GND | — | Common ground for all modules |
| A0 | ADXL335 X-out | IN | Analog |
| A1 | ADXL335 Y-out | IN | Analog |
| A2 | ADXL335 Z-out | IN | Analog |
| 2 | GPS TX | IN | SoftwareSerial RX |
| 3 | GPS RX | OUT | SoftwareSerial TX (optional) |
| 4 | NodeMCU D6 | IN | SoftwareSerial RX |
| 5 | NodeMCU D5 | OUT | SoftwareSerial TX |
| 6 | SIM900A TX | IN | SoftwareSerial RX |
| 7 | SIM900A RX | OUT | SoftwareSerial TX |
| 8 | LCD RS | OUT | |
| 9 | LCD E | OUT | |
| 10 | LCD D4 | OUT | |
| 11 | LCD D5 | OUT | |
| 12 | LCD D6 | OUT | |
| 13 | LCD D7 | OUT | |

### NodeMCU (ESP8266)

| NodeMCU Pin | Connected To | Notes |
|-------------|-------------|-------|
| D5 (GPIO14) | Arduino Pin 5 | Receives data from Arduino |
| D6 (GPIO12) | Arduino Pin 4 | Sends data to Arduino |
| GND | Arduino GND | **Must share common ground** |
| VIN | 5V supply | Or power via USB |

### ADXL335

| ADXL335 Pin | Connected To | Notes |
|-------------|-------------|-------|
| VCC | Arduino 3.3V | Do NOT use 5V — max is 3.6V |
| GND | Arduino GND | |
| XOUT | Arduino A0 | |
| YOUT | Arduino A1 | |
| ZOUT | Arduino A2 | |
| ST (self-test) | Leave floating | |

### Neo-7M GPS

| GPS Pin | Connected To | Notes |
|---------|-------------|-------|
| VCC | Arduino 5V | Module has onboard 3.3V reg |
| GND | Arduino GND | |
| TX | Arduino Pin 2 | 9600 baud NMEA sentences |
| RX | Arduino Pin 3 | Only needed if sending UART commands |

### SIM900A GSM

| GSM Pin | Connected To | Notes |
|---------|-------------|-------|
| VCC | External 5V 2A | **NOT from Arduino 5V — too little current** |
| GND | Arduino GND + supply GND | Common ground |
| TX | Arduino Pin 6 | 9600 baud |
| RX | Arduino Pin 7 | |
| SIM | SIM card slot | Insert active SIM |

### LCD 16×2

| LCD Pin | Connected To | Notes |
|---------|-------------|-------|
| VSS (1) | GND | |
| VDD (2) | 5V | |
| VO (3) | Potentiometer wiper | Contrast — adjust until text is visible |
| RS (4) | Arduino Pin 8 | |
| RW (5) | GND | Always write mode |
| E (6) | Arduino Pin 9 | |
| D0–D3 (7–10) | Leave floating | Not used in 4-bit mode |
| D4 (11) | Arduino Pin 10 | |
| D5 (12) | Arduino Pin 11 | |
| D6 (13) | Arduino Pin 12 | |
| D7 (14) | Arduino Pin 13 | |
| A (15) | 5V via 220Ω resistor | Backlight anode |
| K (16) | GND | Backlight cathode |

### 10K Potentiometer (LCD contrast)

| Pot pin | Connected To |
|---------|-------------|
| Pin 1 (left) | GND |
| Pin 2 (middle / wiper) | LCD VO |
| Pin 3 (right) | 5V |

---

## Data Flow

```
┌────────────┐  G-force > 2.5g   ┌───────────────────────┐
│  ADXL335   │ ─────────────────► │                       │
└────────────┘                    │     Arduino Uno        │
┌────────────┐  NMEA sentences    │                       │
│  Neo-7M    │ ─────────────────► │  Computes magnitude   │
│  GPS       │                    │  Reads lat/lng         │
└────────────┘                    │  Shows on LCD          │
                                  └──────────┬────────────┘
                                             │ ALERT:<lat>,<lng>,<mag>;
                          ┌──────────────────┼──────────────────────┐
                          │                  │                      │
                   SoftwareSerial      SoftwareSerial               │
                     (pins 6/7)          (pins 4/5)                 │
                          │                  │                      │
                   ┌──────┴──────┐    ┌──────┴──────┐             │
                   │  SIM900A   │    │   NodeMCU    │             │
                   │   GSM       │    │  (ESP8266)   │             │
                   └──────┬──────┘    └──────┬───────┘             │
                          │                  │                      │
                    SMS to phone       HTTP POST to                 │
                    (backup path)      /api/telemetry               │
                                             │                      │
                                      ┌──────┴───────┐             │
                                      │   SENTINEL   │             │
                                      │   Backend    │             │
                                      │  (Node.js)   │             │
                                      └──────┬───────┘             │
                                             │                      │
                                   CallMeBot / Twilio               │
                                             │                      │
                                      WhatsApp Alert ───────────────┘
                                      sent to contacts
```

---

## Power Budget

| Module | Current (typical) | Current (peak) |
|--------|------------------|----------------|
| Arduino Uno | 50 mA | 200 mA |
| NodeMCU | 80 mA | 400 mA (TX burst) |
| Neo-7M GPS | 45 mA | 67 mA |
| LCD (backlight on) | 20 mA | 20 mA |
| ADXL335 | 0.35 mA | 0.35 mA |
| SIM900A | 250 mA | 2000 mA (call/SMS) |
| **Total** | **~450 mA** | **~2.7 A** |

> **Important:** Power SIM900A from a dedicated 5V 2A supply. Never from Arduino's 5V pin (max 500 mA from USB). A 18650 cell through a TP4056 + boost converter module works well.

---

## Arduino IDE Setup

1. Install board: **Tools → Board → Boards Manager** → search `esp8266` → install  
2. Select for Arduino sketch: **Tools → Board → Arduino Uno**  
3. Select for NodeMCU sketch: **Tools → Board → NodeMCU 1.0 (ESP-12E Module)**  
4. Install libraries via **Sketch → Include Library → Manage Libraries**:
   - `TinyGPS++` by Mikal Hart  
   - `LiquidCrystal` (built-in, no install needed)  
   - ESP8266 libraries are included with the board package  

---

## First-Time Configuration

### arduino_main.ino
```cpp
// Line 27 — change to the number that should receive SMS backup
const char* SMS_NUMBER = "+919876543210";
```

### nodemcu_wifi.ino
```cpp
const char* WIFI_SSID  = "YOUR_WIFI_SSID";
const char* WIFI_PASS  = "YOUR_WIFI_PASSWORD";
const char* API_URL    = "http://192.168.1.100:5000/api/telemetry"; // your server LAN IP
const char* DEVICE_ID  = "HW-UNIT-01";
const char* DEVICE_KEY = "YOUR_DEVICE_API_KEY"; // from SENTINEL dashboard → Devices
```

### Calibrate ADXL335 threshold
Place the device flat and note the Serial Monitor magnitude reading. It should be close to `1.0g` (gravity). Adjust `THRESHOLD_G` in `arduino_main.ino` — `2.5` is a good starting value for vehicle accidents.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| LCD blank / solid rectangles | Contrast too low | Turn potentiometer slowly |
| GPS no fix indoors | Needs open sky | Move near window or outside |
| GSM not sending | Wrong phone number format or SIM not registered | Check `SMS_NUMBER` includes country code; verify SIM has credit |
| NodeMCU not connecting | Wrong SSID/password or 5GHz-only router | Check credentials; use 2.4 GHz band |
| Magnitude always 0 | ADXL335 on wrong voltage | Confirm VCC → Arduino 3.3V, NOT 5V |
| `AT` commands echo garbage | Wrong baud rate | SIM900A default is 9600; confirm with AT command test sketch |
