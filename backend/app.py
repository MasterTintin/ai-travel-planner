import os
import json
import requests
from flask import Flask, jsonify, request
from flask_cors import CORS
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# 1. ตั้งค่า API Keys ผ่านตัวแปรระบบอย่างปลอดภัย
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
FLIGHT_API_KEY = os.getenv("FLIGHT_API_KEY")
EXCHANGE_API_KEY = os.getenv("EXCHANGE_API_KEY")

# รีเทิร์น Error เตือนล่วงหน้าหากลืมใส่ Key ในไฟล์ .env
if not GOOGLE_API_KEY:
    print("❌ เตือน: ไม่พบ API KEY ในไฟล์ .env กรุณาตรวจสอบใหม่")
else:
    genai.configure(api_key=GOOGLE_API_KEY)

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
        "flightTips": "แนะนำให้จองล่วงหน้าอย่างน้อย 6-8 สัปดาห์ เพื่อให้ได้เรตราคานี้ และควรเลือกบินไฟลท์ดึกถึงเช้าเพื่อประหยัดค่าโรงแรมไปได้ 1 คืน",
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
        req_data = request.get_json()
        
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
        คุณคือผู้เชี่ยวชาญด้านการวางแผนท่องเที่ยวระดับโลก หน้าที่ของคุณคือการจัดตารางการเดินทางท่องเที่ยวในประเทศ {destination} 
        จำนวนทั้งหมด {days} วัน สำหรับผู้เดินทางจำนวน {travelers} คน 
        ระดับงบประมาณโดยรวมคือ: {budget} วางแผนในสไตล์: {travel_style} และมีความสนใจพิเศษเพิ่มคือ: {interests}
        
        กรุณาสร้างแผนการเดินทางที่เจาะลึก สนุกสนาน คุ้มค่า และส่งผลลัพธ์กลับมาในรูปแบบ 'JSON Object บริสุทธิ์เท่านั้น' ห้ามมีคำเกริ่นนำใดๆ ทั้งสิ้น 
        โครงสร้างของ JSON Object ที่ต้องการส่งกลับไปให้ Frontend ต้องเป็นไปตาม Pattern นี้เป๊ะๆ:
        {{
          "tripName": "ตั้งชื่อทริปภาษาไทยให้ดูตื่นตาตื่นใจและสร้างสรรค์เข้ากับไลฟ์สไตล์",
          "destination": "{destination}",
          "totalDays": {days},
          "budgetLevel": "{budget}",
          "recommendedFlight": {{
            "flightType": "{flight_recommendation['flightType']}",
            "suggestedAirlines": "{flight_recommendation['suggestedAirlines']}",
            "estimatedFlightCost": "{flight_recommendation['estimatedFlightCost']}",
            "flightTips": "{flight_recommendation['flightTips']}",
            "bookingUrl": "{flight_recommendation['bookingUrl']}"
          }},
          "itinerary": [
            {{
              "day": 1,
              "theme": "ชื่อธีมของวันนั้นๆ",
              "activities": [
                {{
                  "time": "09:30",
                  "locationName": "ชื่อสถานที่และย่านจริงในประเทศนั้นๆ",
                  "description": "คำบรรยายแผนการท่องเที่ยวแบบละเอียด 3-4 ประโยคชวนน่าติดตาม",
                  "estimatedCost": "150 - 300 THB หรือ ฟรี",
                  "latitude": 25.0330,
                  "longitude": 121.5654
                }}
              ]
            }}
          ]
        }}
        """

        # 2. เรียกใช้ Gemini
        model = genai.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content(system_instruction)
        
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
        # 1. ยิงไปขอเรตเงินแบบ Real-time ทั่วโลก โดยใช้เงินบาท (THB) เป็นฐานหลัก
        url = f"https://v6.exchangerate-api.com/v6/{EXCHANGE_API_KEY}/latest/THB"
        response = requests.get(url, timeout=10)
        data = response.json()
        
        # ตรวจสอบว่า API ภายนอกส่งข้อมูลสำเร็จหรือไม่
        if data.get("result") == "success":
            raw_rates = data["conversion_rates"]
            formatted_rates = []
            
            for currency_code, currency_rate in raw_rates.items():
                # ใช้สูตรกลับด้าน: เอา 1 ไปหาร เพื่อให้ได้ค่า 1 Foreign Currency = X THB
                thb_rate = 1 / currency_rate if currency_rate != 0 else 0
                
                formatted_rates.append({
                    "code": currency_code,
                    "name": currency_code,
                    "rate": thb_rate
                })
            
            # 3. รีเทิร์นข้อมูลชุดใหญ่ระดับโลกส่งต่อให้หน้าบ้าน React ทันที
            return jsonify({
                "date": data.get("time_last_update_utc", "Real-time")[:16], # วันเวลาที่อัปเดตเรตล่าสุด
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


if __name__ == "__main__":
    app.run(port=5000, debug=True)