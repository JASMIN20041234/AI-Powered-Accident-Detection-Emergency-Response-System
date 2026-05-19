/*
 * SENTINEL — Accident Detection & Emergency Response
 * Arduino Uno R3 — Main Controller
 *
 * Sensors  : ADXL335 (A0/A1/A2), Neo-7M GPS (pins 2/3 SoftwareSerial)
 * Output   : SIM900A GSM (pins 6/7), NodeMCU WiFi bridge (pins 4/5), LCD 16x2 (pins 8-13)
 *
 * Libraries needed (install via Library Manager):
 *   TinyGPS++  by Mikal Hart
 *   LiquidCrystal (built-in)
 */

#include <SoftwareSerial.h>
#include <TinyGPS++.h>
#include <LiquidCrystal.h>

// ─── Pin map ──────────────────────────────────────────────────────────────────
#define ADXL_X  A0
#define ADXL_Y  A1
#define ADXL_Z  A2

// SoftwareSerial: only one can actively listen at a time — we switch with .listen()
SoftwareSerial gpsSerial  (2, 3);   // RX=2 ← GPS TX,  TX=3 → GPS RX (unused)
SoftwareSerial mcuSerial  (4, 5);   // RX=4 ← MCU TX,  TX=5 → MCU RX
SoftwareSerial gsmSerial  (6, 7);   // RX=6 ← GSM TX,  TX=7 → GSM RX

// LCD in 4-bit mode: RS, E, D4, D5, D6, D7
LiquidCrystal lcd(8, 9, 10, 11, 12, 13);

// ─── ADXL335 calibration ──────────────────────────────────────────────────────
// Powered from Arduino 3.3 V; ADC reference = default 5 V
// zero-g output = Vcc/2 = 1.65 V  →  ADC ≈ 338
// sensitivity   = 300 mV/g         →  ADC ≈ 61.4 counts/g
const float ZERO_G      = 338.0f;
const float SENSITIVITY =  61.4f;  // ADC counts per g

// ─── Detection settings ───────────────────────────────────────────────────────
const float          THRESHOLD_G    = 2.5f;   // g-force to declare accident
const int            SAMPLE_N       = 10;     // samples averaged per reading
const unsigned long  COOLDOWN_MS    = 30000UL;// min ms between consecutive alerts
const unsigned long  LCD_ALERT_MS   = 5000UL; // how long "ACCIDENT" stays on LCD

// Backup SMS number — include country code, no +
const char* SMS_NUMBER = "+919876543210";

// ─── Runtime state ────────────────────────────────────────────────────────────
TinyGPSPlus gps;
float  latitude  = 0.0f, longitude = 0.0f;
bool   gpsFixed  = false;
unsigned long lastAlertMs = 0;

// ─── Helpers ─────────────────────────────────────────────────────────────────

float readMagnitude() {
  long sumX = 0, sumY = 0, sumZ = 0;
  for (int i = 0; i < SAMPLE_N; i++) {
    sumX += analogRead(ADXL_X);
    sumY += analogRead(ADXL_Y);
    sumZ += analogRead(ADXL_Z);
    delay(5);
  }
  float ax = (sumX / SAMPLE_N - ZERO_G) / SENSITIVITY;
  float ay = (sumY / SAMPLE_N - ZERO_G) / SENSITIVITY;
  float az = (sumZ / SAMPLE_N - ZERO_G) / SENSITIVITY;
  return sqrt(ax * ax + ay * ay + az * az);
}

void drainGPS() {
  gpsSerial.listen();
  unsigned long deadline = millis() + 200;
  while (millis() < deadline) {
    if (gpsSerial.available() && gps.encode(gpsSerial.read())) {
      if (gps.location.isValid()) {
        latitude  = gps.location.lat();
        longitude = gps.location.lng();
        gpsFixed  = true;
      }
    }
  }
}

void lcdStatus(float mag, bool alert) {
  lcd.clear();
  if (alert) {
    lcd.setCursor(0, 0); lcd.print("!! ACCIDENT !!");
    lcd.setCursor(0, 1); lcd.print("Sending alert...");
  } else {
    lcd.setCursor(0, 0);
    lcd.print(gpsFixed ? "GPS: FIXED      " : "GPS: Searching  ");
    lcd.setCursor(0, 1);
    lcd.print("G: ");
    lcd.print(mag, 2);
    lcd.print("g         ");
  }
}

// ─── NodeMCU bridge ───────────────────────────────────────────────────────────
// Protocol: ALERT:<lat>,<lng>,<mag>;\n
void sendToNodeMCU(float mag) {
  mcuSerial.listen();
  mcuSerial.print("ALERT:");
  mcuSerial.print(latitude,  6);
  mcuSerial.print(",");
  mcuSerial.print(longitude, 6);
  mcuSerial.print(",");
  mcuSerial.print(mag, 3);
  mcuSerial.println(";");
}

// ─── GSM SMS backup ───────────────────────────────────────────────────────────
void waitGSM(unsigned long ms) { delay(ms); }

void sendSMS(float mag) {
  gsmSerial.listen();

  gsmSerial.println("AT");           waitGSM(500);
  gsmSerial.println("AT+CMGF=1");   waitGSM(500);  // text mode

  gsmSerial.print("AT+CMGS=\"");
  gsmSerial.print(SMS_NUMBER);
  gsmSerial.println("\"");
  waitGSM(500);

  gsmSerial.print("SENTINEL ALERT: Accident detected (");
  gsmSerial.print(mag, 2);
  gsmSerial.print("g). Location: https://maps.google.com/?q=");
  gsmSerial.print(latitude,  6);
  gsmSerial.print(",");
  gsmSerial.print(longitude, 6);
  gsmSerial.write(26);  // Ctrl+Z — sends the message
  waitGSM(2000);
}

// ─── Setup ────────────────────────────────────────────────────────────────────
void setup() {
  Serial.begin(9600);

  gpsSerial.begin(9600);
  mcuSerial.begin(9600);
  gsmSerial.begin(9600);

  lcd.begin(16, 2);
  lcd.print("SENTINEL SYSTEM");
  lcd.setCursor(0, 1);
  lcd.print("Booting...");
  delay(2000);
  lcd.clear();
  lcd.print("GPS: Searching");

  // Verify GSM module is alive
  gsmSerial.listen();
  gsmSerial.println("AT");
  delay(500);
}

// ─── Main loop ────────────────────────────────────────────────────────────────
void loop() {
  drainGPS();

  float mag = readMagnitude();
  unsigned long now = millis();
  bool cooled = (now - lastAlertMs) >= COOLDOWN_MS;

  if (mag > THRESHOLD_G && cooled) {
    lastAlertMs = now;

    lcdStatus(mag, true);

    // 1. WiFi path: NodeMCU POSTs to backend → backend dispatches WhatsApp
    sendToNodeMCU(mag);

    // 2. GSM path: direct SMS as fallback when no WiFi
    sendSMS(mag);

    delay(LCD_ALERT_MS);
  } else {
    lcdStatus(mag, false);
  }

  delay(100);
}
