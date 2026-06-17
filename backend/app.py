import os
import json
import requests
from flask import Flask, jsonify, request
from flask_cors import CORS
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app, origins="*", methods=["GET","POST","PUT","DELETE","OPTIONS"], allow_headers=["Content-Type","Authorization"])

@app.after_request
def after_request(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization"
    response.headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,DELETE,OPTIONS"
    return response

# 1. ตั้งค่า API Keys ผ่านตัวแปรระบบอย่างปลอดภัย
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
FLIGHT_API_KEY = os.getenv("FLIGHT_API_KEY")
EXCHANGE_API_KEY = "3c7ee6e5eb71e0112850066e"

# รีเทิร์น Error เตือนล่วงหน้าหากลืมใส่ Key ในไฟล์ .env
if not GEMINI_API_KEY:
    print("❌ ไม่พบ GEMINI_API_KEY")
else:
    genai.configure(api_key=GEMINI_API_KEY)

def get_destination_iata(destination_name):
    """แปลงชื่อประเทศ/เมืองจากหน้าบ้าน ให้เป็นรหัสสนามบินหลัก IATA 3 ตัว"""
    mapping = {
        "japan": "NRT",          # โตเกียว นาริตะ
        "ญี่ปุ่น": "NRT",
        "taiwan": "TPE",         # ไทเป เถาหยวน
        "ไต้หวัน": "TPE",
        "south korea": "ICN",    # โซล อินชอน
        "เกาหลีใต้": "ICN",
        "singapore": "SIN",      # สิงคโปร์
        "สิงคโปร์": "SIN",
        "hong kong": "HKG",      # ฮ่องกง
        "ฮ่องกง": "HKG",
        "china": "PEK",          # ปักกิ่ง
        "จีน": "PEK",
        "vietnam": "SGN",        # โฮจิมินห์
        "เวียดนาม": "SGN",
        "united kingdom": "LHR", # ลอนดอน ฮีทโธรว์
        "อังกฤษ": "LHR",
        "united states": "JFK",  # นิวยอร์ก JFK
        "อเมริกา": "JFK",
        "france": "CDG",         # ปารีส ชาร์ลเดอโกล
        "ฝรั่งเศส": "CDG",
        "germany": "FRA",        # แฟรงก์เฟิร์ต
        "เยอรมนี": "FRA",
        "switzerland": "ZRH",    # ซูริค
        "สวิตเซอร์แลนด์": "ZRH",
        "italy": "FCO",          # โรม ฟิวมิชิโน
        "อิตาลี": "FCO",
        "australia": "SYD",      # ซิดนีย์
        "ออสเตรเลีย": "SYD"
    }
    return mapping.get(destination_name.lower().strip(), "NRT")

# =====================================================================
# 1. API ดึงข้อมูลเที่ยวบินและราคาแนะนำ (Flight Matcher)
# =====================================================================
def get_mock_flight_recommendation(destination, airline_preference):
    """ฟังก์ชัน Fallback ในกรณีที่ไม่ได้ใส่ FLIGHT_API_KEY หรือยิง API ไม่ผ่าน"""
    return {
        "flightType": f"{airline_preference} Round-trip Flight",
        "suggestedAirlines": "ANA Airways / Japan Airlines (สายการบินบริการเต็มรูปแบบชั้นนำ)" if airline_preference == "Full Service" else "AirAsia X / Thai VietJet (สายการบินประหยัดเน้นคุ้มค่า)",
        "estimatedFlightCost": "18,500 THB (ราคาไป-กลับโดยประมาณรวมภาษีแล้ว)" if airline_preference == "Full Service" else "9,800 THB (ราคาไป-กลับเริ่มต้นไม่รวมบริการเสริม)",
        "flightTips": "ช่วงเวลาแนะนำ: ควรจองล่วงหน้าอย่างน้อย 6-8 สัปดาห์ เพื่อให้ได้เรทราคาที่ดีที่สุด สถิติระบุว่าเที่ยวบินเที่ยวกลางคืน (Red-eye flight) จะช่วยประหยัดค่าที่พักคืนแรกได้",
        "bookingUrl": f"https://th.trip.com/flights/bangkok-to-{destination.lower()}/tickets-bkk-{get_destination_iata(destination).lower()}/?allianceid=3853112&sid=22421360"
    }

@app.route("/api/flight-recommendation", methods=["POST"])
def get_flight_recommendation():
    try:
        req_data = request.get_json() or {}
        destination = req_data.get("destination", "Japan")
        airline_preference = req_data.get("airlinePreference", "Full Service")
        
        dest_iata = get_destination_iata(destination)
        
        if not FLIGHT_API_KEY or FLIGHT_API_KEY == "YOUR_FLIGHT_API_KEY":
            mock_data = get_mock_flight_recommendation(destination, airline_preference)
            return jsonify(mock_data)

        url = "https://api.flightapi.io/onewaytrip"
        params = {
            "token": FLIGHT_API_KEY,
            "from": "BKK",
            "to": dest_iata,
            "date": "2026-04-10",
            "adults": 1,
            "children": 0,
            "infants": 0,
            "cabin": "economy",
            "currency": "THB"
        }
        
        response = requests.get(url, params=params, timeout=10)
        
        if response.status_code == 200:
            flight_data = response.json()
            fares = flight_data.get("fares", [])
            if fares:
                cheapest_fare = min(fares, key=lambda x: x.get("price", float('inf')))
                price = cheapest_fare.get("price")
                return jsonify({
                    "flightType": f"{airline_preference} Flight (Real-time data)",
                    "suggestedAirlines": f"เที่ยวบินรหัส {cheapest_fare.get('tripId', 'แนะนำ')} ค้นพบราคาพิเศษบนระบบ",
                    "estimatedFlightCost": f"{price:,.2f} THB",
                    "flightTips": "ราคานี้เป็นราคา Real-time ตรวจสอบสดใหม่จากระบบจองตั๋วเครื่องบินโลก",
                    "bookingUrl": f"https://th.trip.com/flights/bangkok-to-{destination.lower()}/tickets-bkk-{dest_iata.lower()}/"
                })
        
        return jsonify(get_mock_flight_recommendation(destination, airline_preference))

    except Exception as e:
        print(f"⚠️ Flight API Connection Failed: {str(e)}")
        return jsonify(get_mock_flight_recommendation(request.get_json().get("destination", "Japan"), request.get_json().get("airlinePreference", "Full Service")))

# =====================================================================
# 2. API สร้างตารางท่องเที่ยวรายวันด้วย AI (Gemini Planner)
# =====================================================================
@app.route("/api/generate-trip", methods=["POST"])
def generate_trip():
    try:
        req_data = request.get_json() or {}
        
        destination = req_data.get("destination", "Japan")
        departure_date = req_data.get("departureDate", "")
        days = int(req_data.get("days", 3))
        travelers = int(req_data.get("travelers", 1))
        budget = req_data.get("budget", "Standard")
        airline_preference = req_data.get("airlinePreference", "Full Service")
        travel_style = req_data.get("travelStyle", "Sightseeing")
        interests = req_data.get("interests", "")

        flight_recommendation = get_mock_flight_recommendation(destination, airline_preference)
        if FLIGHT_API_KEY and FLIGHT_API_KEY != "YOUR_FLIGHT_API_KEY":
            try:
                dest_iata = get_destination_iata(destination)
                url = f"https://api.flightapi.io/onewaytrip?token={FLIGHT_API_KEY}&from=BKK&to={dest_iata}&date=2026-04-10&adults=1&children=0&infants=0&cabin=economy&currency=THB"
                f_res = requests.get(url, timeout=5)
                if f_res.status_code == 200:
                    fares = f_res.json().get("fares", [])
                    if fares:
                        cheapest = min(fares, key=lambda x: x.get("price", float('inf')))
                        flight_recommendation["estimatedFlightCost"] = f"{cheapest.get('price'):,.2f} THB (อัปเดตสดจริง)"
                        flight_recommendation["flightType"] = f"{airline_preference} Flight (Live Rate)"
            except Exception:
                pass

        system_instruction = f"""
คุณคือผู้เชี่ยวชาญด้านการวางแผนท่องเที่ยวระดับโลกและนักออกแบบแอป Travel Planner

ภารกิจของคุณคือสร้างแผนการเดินทางที่เหมือนแอปท่องเที่ยวจริง
สร้างแผนท่องเที่ยวสำหรับ {destination}

ข้อมูลผู้เดินทาง
- จำนวนวัน: {days}
- จำนวนผู้เดินทาง: {travelers}
- งบประมาณ: {budget}
- รูปแบบการเที่ยว: {travel_style}
- ความสนใจ: {interests}
- วันเดินทาง: {departure_date}

ข้อมูลเที่ยวบินแนะนำ

flightType: {flight_recommendation["flightType"]}
suggestedAirlines: {flight_recommendation["suggestedAirlines"]}
estimatedFlightCost: {flight_recommendation["estimatedFlightCost"]}
flightTips: {flight_recommendation["flightTips"]}
bookingUrl: {flight_recommendation["bookingUrl"]}

กฎการสร้างแผน

1. สร้างกิจกรรม 3-4 กิจกรรมต่อวัน

2. ใช้เวลาแบบ HH:MM เท่านั้น
ตัวอย่าง:
08:00
11:00
14:00
18:00

3. เวลาในแต่ละวันต้องเรียงตามลำดับจริง

4. เลือกเฉพาะสถานที่จริงที่มีอยู่จริง

5. กิจกรรมต้องสอดคล้องกับ travelStyle และ interests ของผู้ใช้

6. description ต้องเป็นภาษาไทย 4-7 ประโยค
อธิบาย:
- สถานที่คืออะไร
- จุดเด่นคืออะไร
- ควรทำอะไรที่นี่
- มีอาหาร ของฝาก หรือจุดถ่ายรูปอะไรน่าสนใจ
- คำแนะนำพิเศษสำหรับนักท่องเที่ยว

7. estimatedCost ต้องสมจริง

ตัวอย่าง:
ฟรี
300 THB
300 - 800 THB

ห้ามใช้ "ฟรี" สำหรับ:
Restaurant
Cafe
Market
Shopping
Department Store
Outlet
Anime Store

8. ทุก activity ต้องมีข้อมูลครบ:

time
locationName
description
estimatedCost
travelTip
highlight
nearestStation
latitude
longitude
googleMapsUrl

9. latitude และ longitude ต้องเป็นพิกัดจริงของสถานที่นั้น

googleMapsUrl ต้องอยู่ในรูปแบบ:

https://www.google.com/maps?q=latitude,longitude

10. highlight ต้องมีอย่างน้อย 3 รายการ

11. travelTip ต้องมีอย่างน้อย 1 ประโยค

12. ส่งกลับเป็น JSON เท่านั้น
ห้ามใช้ Markdown
ห้ามใช้ ```json
ห้ามมีข้อความอื่นนอก JSON

JSON ต้องตรงตาม Schema ด้านล่าง 100%



```python
JSON Schema

{{
    "tripName":"ชื่อทริป",
    "destination":"Japan",
    "totalDays":5,
    "budgetLevel":"Standard",

    "recommendedFlight":
    {{
        "flightType":"Full Service Flight",
        "suggestedAirlines":"ANA / JAL",
        "estimatedFlightCost":"18,500 THB",
        "flightTips":"จองล่วงหน้า 6-8 สัปดาห์",
        "bookingUrl":"https://..."
    }},

    "itinerary":
    [
        {{
            "day":1,
            "theme":"Anime & Tokyo City",

            "activities":
            [
                {{
                    "time":"09:00",

                    "locationName":"Akihabara Electric Town",

                    "description":"รายละเอียดสถานที่",

                    "estimatedCost":"500 - 2,000 THB",

                    "travelTip":"ควรมาในช่วงเย็นเพื่อชมแสงไฟ",

                    "highlight":[
                        "Animate",
                        "Mandarake",
                        "Gachapon Hall"
                    ],

                    "nearestStation":"Akihabara Station",

                    "latitude":35.6984,

                    "longitude":139.7730,

                    "googleMapsUrl":"https://www.google.com/maps?q=35.6984,139.7730"
                }}
            ]
        }}
    ]
}}
```
        """

                # 2. เรียกใช้ Gemini
        model = genai.GenerativeModel(
            model_name="gemini-2.5-flash"
        )

        response = model.generate_content(
            system_instruction,
            generation_config={
                "temperature": 0.7,
                "response_mime_type": "application/json"
            }
        )
        
        # 3. ป้องกันข้อผิดพลาดหาก API ตอบกลับมาว่างเปล่า
        if not response or not response.text:
            return jsonify({"error": "Gemini AI ไม่มีการตอบกลับข้อมูล"}), 500

        response_text = response.text.strip()
        
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
            
        trip_data = json.loads(response_text.strip())
        return jsonify(trip_data)

    except json.JSONDecodeError as je:
        print("❌ JSON Decode Error from Gemini:", str(je))
        return jsonify({"error": "AI สร้างฟอร์แมตข้อมูลผิดพลาดกรุณากดลองอีกครั้ง"}), 500
    except Exception as e:
        print("❌ General Error:", str(e))
        return jsonify({"error": str(e)}), 500

# =====================================================================
# 3. API อัตราแลกเปลี่ยนเงินด่วนทั่วโลก (Mocked ชั่วคราวเพื่อประหยัด Quota)
# =====================================================================
@app.route("/api/exchange-rates", methods=["GET"])
def get_exchange_rates():
    try:
        # บันทึก log บอกตัวเองใน Terminal สักหน่อยว่าตอนนี้กำลังใช้ Mock อยู่นะ
        print("ℹ️ Exchange Rate: ใช้ข้อมูลจำลอง (Mock Data) เพื่อเซฟโควตา API")
        
        # สร้างข้อมูลอัตราแลกเปลี่ยนจำลองนิ่ง ๆ ไว้ (1 Foreign Currency = X THB)
        # นายสามารถปรับตัวเลขเรตตรงนี้ให้ใกล้เคียงความจริงตามใจชอบได้เลยครับ
        mock_rates = [
            {"code": "THB", "name": "THB", "rate": 1.0},
            {"code": "USD", "name": "USD", "rate": 36.50},  # 1 USD = 36.50 THB
            {"code": "JPY", "name": "JPY", "rate": 0.23},   # 1 JPY = 0.23 THB
            {"code": "KRW", "name": "KRW", "rate": 0.026},  # 1 KRW = 0.026 THB
            {"code": "EUR", "name": "EUR", "rate": 39.20},  # 1 EUR = 39.20 THB
            {"code": "SGD", "name": "SGD", "rate": 27.00},  # 1 SGD = 27.00 THB
            {"code": "TPE", "name": "TWD", "rate": 1.13}    # 1 TWD = 1.13 THB
        ]
        
        # รีเทิร์นโครงสร้าง JSON รูปแบบเดิมเป๊ะ ๆ กลับไป เพื่อไม่ให้หน้าบ้าน React พัง
        return jsonify({
            "date": "Mocked (Saved Quota)",
            "rates": mock_rates
        })
            
    except Exception as e:
        print(f"❌ Exchange Rate Error: {str(e)}")
        return jsonify({"error": str(e)}), 500

# =====================================================================
# 4. API ระบบบันทึกและดึงข้อมูลทริป (Save & Load Trips Local JSON)
# =====================================================================
TRIPS_FILE = os.path.join(os.path.dirname(__file__), "trips.json")

def load_trips_from_file():
    """ฟังก์ชันช่วยดึงข้อมูลทริปทั้งหมดจากไฟล์ JSON ล่าสุด"""
    if not os.path.exists(TRIPS_FILE):
        return []
    try:
        with open(TRIPS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"⚠️ ไม่สามารถอ่านไฟล์ทริปได้: {str(e)}")
        return []

def save_trips_to_file(trips):
    """ฟังก์ชันช่วยบันทึกข้อมูลทริปทั้งหมดลงไฟล์ JSON"""
    try:
        with open(TRIPS_FILE, "w", encoding="utf-8") as f:
            json.dump(trips, f, ensure_ascii=False, indent=4)
        return True
    except Exception as e:
        print(f"⚠️ ไม่สามารถเขียนไฟล์ทริปได้: {str(e)}")
        return False

@app.route("/api/trips", methods=["POST"])
def save_user_trip():
    """Endpoint สำหรับรับข้อมูลทริปจากหน้าบ้านมาบันทึกเก็บไว้"""
    try:
        trip_data = request.get_json()
        if not trip_data:
            return jsonify({"error": "ไม่พบข้อมูลทริปที่ต้องการบันทึก"}), 400
        
        all_trips = load_trips_from_file()
        
        # เพิ่มข้อมูลเวลาที่กดบันทึกเข้าไป
        import datetime
        trip_data["savedAt"] = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        all_trips.append(trip_data)
        
        if save_trips_to_file(all_trips):
            return jsonify({"message": "บันทึกทริปของคุณเรียบร้อยแล้ว!", "status": "success"}), 201
        else:
            return jsonify({"error": "เกิดข้อผิดพลาดหลังบ้านในการเขียนไฟล์"}), 500
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/trips", methods=["GET"])
def get_user_trips():
    """Endpoint สำหรับส่งรายชื่อทริปทั้งหมดที่เคยเซฟไว้กลับไปโชว์ที่หน้าบ้าน"""
    try:
        all_trips = load_trips_from_file()
        return jsonify(all_trips[::-1])
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ✅ /api/save-trip alias
@app.route("/api/save-trip", methods=["POST", "OPTIONS"])
def save_trip_alias():
    if request.method == "OPTIONS":
        return jsonify({}), 200
    return save_user_trip()

if __name__ == "__main__":
    app.run(port=5000, debug=True)