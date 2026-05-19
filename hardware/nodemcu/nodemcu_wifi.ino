/*
 * SENTINEL — WiFi Bridge
 * NodeMCU (ESP8266) — receives accident data from Arduino via SoftwareSerial
 * and POSTs to the SENTINEL backend which dispatches WhatsApp via CallMeBot/Twilio.
 *
 * Wiring to Arduino:
 *   NodeMCU D5 (GPIO14) → Arduino pin 5 (mcuSerial TX on Arduino side)
 *   NodeMCU D6 (GPIO12) → Arduino pin 4 (mcuSerial RX on Arduino side)
 *   NodeMCU GND         → Arduino GND (common ground REQUIRED)
 *
 * Libraries needed:
 *   ESP8266WiFi, ESP8266HTTPClient (built into ESP8266 board package)
 *   SoftwareSerial (built-in)
 *
 * Board: NodeMCU 1.0 (ESP-12E Module)  — select in Arduino IDE
 */

#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>
#include <SoftwareSerial.h>

// ─── Configuration — fill these before flashing ──────────────────────────────
const char* WIFI_SSID   = "YOUR_WIFI_SSID";
const char* WIFI_PASS   = "YOUR_WIFI_PASSWORD";

// Backend URL — use your machine's LAN IP while testing locally
// e.g. "http://192.168.1.100:5000/api/telemetry"
// For production replace with your hosted domain
const char* API_URL     = "http://192.168.1.100:5000/api/telemetry";

// Register this device in SENTINEL dashboard first, then copy its API key here
const char* DEVICE_ID   = "HW-UNIT-01";
const char* DEVICE_KEY  = "YOUR_DEVICE_API_KEY";

// ─── Hardware serial bridge from Arduino ─────────────────────────────────────
// D5=GPIO14 (RX from Arduino TX pin 5),  D6=GPIO12 (TX to Arduino RX pin 4)
SoftwareSerial arduinoSerial(D5, D6);

String rxBuffer = "";

// ─── LED feedback (built-in LED on NodeMCU = GPIO2, active LOW) ──────────────
void blink(int times, int ms = 100) {
  for (int i = 0; i < times; i++) {
    digitalWrite(LED_BUILTIN, LOW);  delay(ms);
    digitalWrite(LED_BUILTIN, HIGH); delay(ms);
  }
}

// ─── WiFi reconnect helper ────────────────────────────────────────────────────
void ensureWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;
  Serial.print("[WiFi] Reconnecting");
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  int tries = 0;
  while (WiFi.status() != WL_CONNECTED && tries < 20) {
    delay(500); Serial.print("."); tries++;
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println(" OK — " + WiFi.localIP().toString());
  } else {
    Serial.println(" FAILED");
  }
}

// ─── POST telemetry to SENTINEL backend ──────────────────────────────────────
void postTelemetry(float lat, float lng, float mag) {
  ensureWiFi();
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[HTTP] No WiFi — skipping POST");
    return;
  }

  WiFiClient client;
  HTTPClient http;
  http.begin(client, API_URL);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(10000);

  // Derive plausible individual axis values from magnitude
  // (Arduino averages multiple samples; we approximate axes for the backend)
  float ax = mag * 0.70f;
  float ay = mag * 0.80f;
  float az = 1.0f;

  String body = "{";
  body += "\"device_id\":\"" + String(DEVICE_ID) + "\",";
  body += "\"api_key\":\""   + String(DEVICE_KEY) + "\",";
  body += "\"latitude\":"    + String(lat, 6)     + ",";
  body += "\"longitude\":"   + String(lng, 6)     + ",";
  body += "\"magnitude\":"   + String(mag, 3)     + ",";
  body += "\"ax\":"          + String(ax,  3)     + ",";
  body += "\"ay\":"          + String(ay,  3)     + ",";
  body += "\"az\":"          + String(az,  3);
  body += "}";

  Serial.println("[HTTP] POST → " + body);
  int code = http.POST(body);
  Serial.println("[HTTP] Response: " + String(code));

  if (code == 200 || code == 201) {
    blink(3, 80);   // triple blink = success
  } else {
    blink(6, 50);   // rapid blink = error
  }

  http.end();
}

// ─── Parse incoming line from Arduino ────────────────────────────────────────
// Format: ALERT:<lat>,<lng>,<mag>;\n
void parseLine(String& line) {
  line.trim();
  if (!line.startsWith("ALERT:")) return;

  String data = line.substring(6);
  if (data.endsWith(";")) data = data.substring(0, data.length() - 1);

  int c1 = data.indexOf(',');
  int c2 = data.indexOf(',', c1 + 1);
  if (c1 < 0 || c2 < 0) {
    Serial.println("[PARSE] Bad format: " + data);
    return;
  }

  float lat = data.substring(0,      c1).toFloat();
  float lng = data.substring(c1 + 1, c2).toFloat();
  float mag = data.substring(c2 + 1).toFloat();

  Serial.printf("[ALERT] lat=%.6f  lng=%.6f  mag=%.3fg\n", lat, lng, mag);
  postTelemetry(lat, lng, mag);
}

// ─── Setup ────────────────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  pinMode(LED_BUILTIN, OUTPUT);
  digitalWrite(LED_BUILTIN, HIGH);  // off

  arduinoSerial.begin(9600);

  Serial.println("\n[SENTINEL] NodeMCU WiFi Bridge starting");

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  Serial.print("[WiFi] Connecting");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500); Serial.print(".");
  }
  Serial.println(" Connected!");
  Serial.println("[WiFi] IP: " + WiFi.localIP().toString());
  blink(2, 200);
}

// ─── Loop ─────────────────────────────────────────────────────────────────────
void loop() {
  while (arduinoSerial.available()) {
    char c = (char)arduinoSerial.read();
    if (c == '\n') {
      parseLine(rxBuffer);
      rxBuffer = "";
    } else if (c != '\r') {
      rxBuffer += c;
    }
  }
}
