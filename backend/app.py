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
สำหรับประเทศ {destination}

ข้อมูลผู้เดินทาง

- จำนวนวัน: {days} วัน
- จำนวนผู้เดินทาง: {travelers} คน
- งบประมาณ: {budget}
- รูปแบบการท่องเที่ยว: {travel_style}
- ความสนใจพิเศษ: {interests}
- วันเดินทาง: {departure_date}

ข้อกำหนดสำคัญมาก

1. ต้องสร้างกิจกรรม 3-4 กิจกรรมต่อวัน

2. ทุกกิจกรรมต้องมีเวลาแบบ HH:MM เท่านั้น

ตัวอย่าง

08:00
10:30
13:00
15:30
18:00
20:00

ห้ามใช้

- เช้า
- สาย
- บ่าย
- เย็น
- ค่ำ

เป็นค่า time เด็ดขาด

3. เวลาต้องเรียงลำดับ

เช่น

08:00
11:00
14:00
18:00

4. locationName ต้องเป็นสถานที่จริง

5. description ต้องเป็นภาษาไทย

ความยาวอย่างน้อย 80-150 คำ
หรือประมาณ 4-8 ประโยค

6. estimatedCost ให้ใช้รูปแบบ

ฟรี

หรือ

300 THB

หรือ

300 - 800 THB

7. latitude และ longitude ต้องเป็นค่าจริงของสถานที่นั้น

8. theme ต้องเป็นชื่อธีมของวัน

9. recommendedFlight ใช้ข้อมูลนี้

flightType:
{flight_recommendation["flightType"]}

suggestedAirlines:
{flight_recommendation["suggestedAirlines"]}

estimatedFlightCost:
{flight_recommendation["estimatedFlightCost"]}

flightTips:
{flight_recommendation["flightTips"]}

bookingUrl:
{flight_recommendation["bookingUrl"]}

10. ส่งกลับมาเป็น JSON เท่านั้น

ห้ามเขียนคำอธิบาย
ห้ามเขียน markdown
ห้ามใส่ ```json

11. estimatedCost ต้องสอดคล้องกับกิจกรรม

- ถ้าเป็นร้านอาหาร ต้องมีค่าใช้จ่ายเสมอ
- ถ้าเป็นตลาด แหล่งช้อปปิ้ง ถนนคนเดิน หรือย่านการค้า
  ห้ามกำหนดเป็น "ฟรี"
  ให้ประมาณค่าใช้จ่ายสำหรับการซื้อของหรือของฝาก เช่น
  300 - 1,000 THB
  หรือ
  500 - 2,000 THB

- ถ้าเป็นพิพิธภัณฑ์หรือสถานที่มีค่าเข้า
  ต้องมีค่าเข้าชมจริงหรือโดยประมาณ

- ถ้าเป็นสวนสาธารณะ ศาลเจ้า วัด หรือจุดชมวิวฟรี
  สามารถใช้คำว่า "ฟรี" ได้

- ถ้าเป็นการเดินทาง
  ต้องมีค่าเดินทางโดยประมาณ

ห้ามใช้ estimatedCost = "ฟรี"
สำหรับสถานที่ประเภท

- Market
- Shopping
- Restaurant
- Cafe
- Department Store
- Anime Store
- Outlet

กิจกรรมต้องคำนึงถึงเวลาเดินทางจริง

- หลังสนามบินควรมีเวลาเดินทางเข้าเมือง 1-2 ชั่วโมง
- หลังเช็คอินไม่ควรไปสถานที่ไกลเกินไป
- กิจกรรมกลางคืนควรอยู่ในย่านเดียวกัน

12. estimatedCost ต้องสะท้อนพฤติกรรมนักท่องเที่ยวจริง

ห้ามกำหนดเป็น "ฟรี"
หากกิจกรรมมีวัตถุประสงค์เพื่อการกิน ดื่ม ช้อปปิ้ง หรือซื้อของฝาก

ให้ประเมินค่าใช้จ่ายขั้นต่ำที่นักท่องเที่ยวทั่วไปมักใช้

13. description ต้องมีคุณภาพเหมือนแอปท่องเที่ยวระดับพรีเมียม

แต่ละกิจกรรมต้องมีรายละเอียด 4-7 ประโยค

โดยควรประกอบด้วย

- สถานที่นี้มีชื่อเสียงเรื่องอะไร
- ทำไมจึงควรไป
- นักท่องเที่ยวควรทำกิจกรรมอะไรที่นี่
- มีจุดถ่ายรูป อาหาร หรือของขึ้นชื่ออะไร
- บรรยากาศเป็นอย่างไร
- หากเหมาะสมให้แนะนำสิ่งที่ไม่ควรพลาด

ห้ามเขียนเพียงคำอธิบายสั้นๆ
ให้เขียนเหมือนนายกำลังแนะนำสถานที่ท่องเที่ยวจริง

14. แต่ละสถานที่ควรมี Recommendation พิเศษ

เช่น

- เมนูอาหารที่ไม่ควรพลาด
- จุดถ่ายรูปยอดนิยม
- ร้านอนิเมะหรือร้านของฝากแนะนำ
- จุดชมวิว
- เคล็ดลับสำหรับนักท่องเที่ยว

15. AI ต้องทำหน้าที่เหมือนไกด์ท่องเที่ยวส่วนตัว

อธิบายสถานที่ด้วยภาษาที่น่าเที่ยว
สร้างแรงจูงใจให้นักท่องเที่ยวอยากไป
แนะนำจุดเด่น อาหาร ของฝาก จุดถ่ายรูป และกิจกรรมที่ไม่ควรพลาด

16. ทุก activity ต้องอธิบายว่า

- สถานที่นี้คืออะไร
- ทำไมสถานที่นี้ถึงน่าสนใจ
- นักท่องเที่ยวจะได้ประสบการณ์อะไร
- มีจุดเด่นหรือไฮไลต์อะไร
- คำแนะนำพิเศษในการเที่ยว

17. เพิ่ม field ใหม่ชื่อ

"travelTip"

เช่น

"travelTip":"ควรมาในช่วงเย็นเพื่อชมแสงไฟและหลีกเลี่ยงช่วงคนเยอะ"

18. เพิ่ม field ใหม่ชื่อ

"highlight"

เป็น array

่เช่น

"highlight":[
  "Animate Akihabara",
  "Mandarake Complex",
  "Gachapon Hall"
]

19. นายต้องเลือกสถานที่ให้สอดคล้องกับ travelStyle และ interests ของผู้ใช้อย่างชัดเจน พร้อมอธิบายเหตุผลใน description

20. ทุก activity ต้องระบุ latitude และ longitude ที่ถูกต้องของสถานที่จริง

21. ทุก activity ต้องมี googleMapsUrl

รูปแบบต้องเป็น

https://www.google.com/maps?q=latitude,longitude

ตัวอย่าง

latitude: 35.6586
longitude: 139.7454

googleMapsUrl:
https://www.google.com/maps?q=35.6586,139.7454

ห้ามเว้น field นี้เด็ดขาด

22. ห้ามเว้นว่าง latitude, longitude และ googleMapsUrl

23. พิกัดต้องสอดคล้องกับ locationName จริงเท่านั้น

24. ทุก activity ต้องมี nearestStation

25. nearestStation ต้องเป็นสถานีรถไฟหรือสถานีรถไฟใต้ดินที่ใกล้ที่สุด

26. ถ้าสถานที่ไม่มีสถานีรถไฟใกล้เคียง ให้ระบุเป็น "N/A"

27. ห้ามละเว้น field ใด ๆ ที่ปรากฏใน JSON Schema

28. ทุก activity ต้องมี field ต่อไปนี้ครบถ้วน

time
locationName
description
estimatedCost
latitude
longitude
googleMapsUrl
nearestStation
travelTip
highlight

29. ก่อนส่ง JSON ให้ตรวจสอบอีกครั้งว่า

* latitude ไม่เป็น 0
* longitude ไม่เป็น 0
* googleMapsUrl สร้างจาก latitude และ longitude
* nearestStation ไม่เว้นว่าง
* highlight มีอย่างน้อย 3 รายการ
* travelTip มีอย่างน้อย 1 ประโยค

30. JSON ต้องสอดคล้องกับ Schema 100%

ห้ามละเว้น field ใดๆ
ห้ามเปลี่ยนชื่อ field
ห้ามส่ง field ไม่ครบ

31. หากไม่ทราบพิกัดจริง ห้ามสร้างข้อมูลขึ้นมาเอง
ให้เลือกสถานที่อื่นแทน


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
# 3. API อัตราแลกเปลี่ยนเงินด่วนทั่วโลก Real-time (ExchangeRate-API)
# =====================================================================
@app.route("/api/exchange-rates", methods=["GET"])
def get_exchange_rates():
    try:
        url = f"https://v6.exchangerate-api.com/v6/{EXCHANGE_API_KEY}/latest/THB"
        response = requests.get(url, timeout=10)
        data = response.json()
        
        if data.get("result") == "success":
            raw_rates = data["conversion_rates"]
            formatted_rates = []
            
            for currency_code, currency_rate in raw_rates.items():
                thb_rate = 1 / currency_rate if currency_rate != 0 else 0
                formatted_rates.append({
                    "code": currency_code,
                    "name": currency_code,
                    "rate": thb_rate
                })
            
            return jsonify({
                "date": data.get("time_last_update_utc", "Real-time")[:16],
                "rates": formatted_rates
            })
        else:
            return jsonify({
                "error": "Failed to fetch from ExchangeRate-API",
                "details": data.get("error-type", "Unknown error")
            }), 500
            
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