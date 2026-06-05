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

# รีเทิร์น Error เตือนล่วงหน้าหากลืมใส่ Key ในไฟล์ .env
if not GOOGLE_API_KEY:
    print("❌ เตือน: ไม่พบ API KEY ในไฟล์ .env กรุณาตรวจสอบ!")
else:
    genai.configure(api_key=GOOGLE_API_KEY)

# =====================================================================
# ฟังก์ชันช่วยเหลือ สำหรับระบบตั๋วเครื่องบิน
# =====================================================================
def get_destination_iata(destination_name):
    """แปลงชื่อประเทศ/เมืองจากหน้าบ้าน ให้เป็นรหัสสนามบินหลัก IATA 3 ตัว"""
    mapping = {
        "japan": "NRT",          # โตเกียว นาริตะ
        "ญี่ปุ่น": "NRT",
        "south korea": "ICN",    # โซล อินชอน
        "เกาหลีใต้": "ICN",
        "singapore": "SIN",      # สิงคโปร์
        "สิงคโปร์": "SIN",
        "china": "PVG",          # เซี่ยงไฮ้ พูตง
        "จีน": "PVG",
        "vietnam": "SGN",        # โฮจิมินห์
        "เวียดนาม": "SGN",
        "australia": "SYD",      # ซิดนีย์
        "ออสเตรเลีย": "SYD",
        "united kingdom": "LHR", # ลอนดอน
        "อังกฤษ": "LHR",
        "usa": "LAX",            # ลอสแอนเจลิส
        "สหรัฐฯ": "LAX"
    }
    return mapping.get(destination_name.lower().strip(), "NRT")

def get_realtime_flight_data(destination_code, departure_date):
    """ยิงดึงข้อมูลราคาตั๋วเครื่องบินที่ถูกที่สุดขาเดียวจากกรุงเทพฯ (BKK)"""
    try:
        if not FLIGHT_API_KEY or "YOUR_FLIGHTAPI_KEY" in FLIGHT_API_KEY:
            return None
            
        # ยิงดึงไฟล์บินตั๋วประหยัด (Economy) หน่วยเงินบาทไทย (THB)
        url = f"https://api.flightapi.io/onewaytrip/{FLIGHT_API_KEY}/BKK/{destination_code}/{departure_date}/1/0/0/Economy/THB"
        
        response = requests.get(url, timeout=7)
        data = response.json()
        
        if data and "fares" in data and len(data["fares"]) > 0:
            best_fare = data["fares"][0]
            price_thb = float(best_fare.get("price", {}).get("amount", 0))
            provider = best_fare.get("provider", "สายการบินชั้นนำ")
            
            return {
                "price": round(price_thb),
                "airline": provider
            }
        return None
    except Exception as e:
        print("FlightAPI Fetch Error (Skipping to fallback):", e)
        return None

# =====================================================================
# API 1: ดึงอัตราแลกเปลี่ยนรายวัน เทียบเงินบาทไทย
# =====================================================================
@app.route('/api/exchange-rates', methods=['GET'])
def get_exchange_rates():
    try:
        url = "https://open.er-api.com/v6/latest/THB"
        response = requests.get(url, timeout=5)
        data = response.json()
        
        if data.get("result") == "success":
            rates = data.get("rates", {})
            
            # โครงสร้าง Mapping
            target_currencies = {
                "JPY": {"name": "ญี่ปุ่น (JPY)", "base": 100},       
                "KRW": {"name": "เกาหลีใต้ (KRW)", "base": 100},     
                "VND": {"name": "เวียดนาม (VND)", "base": 1000},    
                "SGD": {"name": "สิงคโปร์ (SGD)", "base": 1},
                "USD": {"name": "สหรัฐฯ (USD)", "base": 1},
                "EUR": {"name": "ยุโรป (EUR)", "base": 1},
                "CNY": {"name": "จีน (CNY)", "base": 1},
                "AUD": {"name": "ออสเตรเลีย (AUD)", "base": 1},
                "GBP": {"name": "อังกฤษ (GBP)", "base": 1}
            }
            
            formatted_rates = []
            for code, config in target_currencies.items():
                if code in rates:
                    # คำนวณหาค่าเงินบาทต่อ 1 หน่วยก่อน
                    thb_per_unit = 1 / rates[code]
                    
                    # คูณด้วยฐานหน่วย (base)
                    final_rate = thb_per_unit * config["base"]
                    
                    # ปรับทศนิยมให้เหมาะสม
                    rate_value = round(final_rate, 4)
                    
                    # ส่งรายละเอียดโครงสร้างชัดเจนกลับไปให้หน้าบ้าน
                    formatted_rates.append({
                        "code": code,
                        "name": config["name"],
                        "baseUnit": f"{config['base']:,} {code}", 
                        "rate": rate_value                        
                    })
                    
            return jsonify({
                "base": "THB",
                "date": data.get("time_last_update_utc", "")[:16] + " UTC",
                "rates": formatted_rates
            })
        else:
            return jsonify({"error": "ไม่สามารถดึงข้อมูลอัตราแลกเปลี่ยนจาก API ต้นทางได้"}), 500
    except Exception as e:
        print("Exchange Rate Fetch Error:", e)
        return jsonify({"error": f"Backend Error: {str(e)}"}), 500

# =====================================================================
# API 2: สร้างทริปละเอียด + ผสมข้อมูลตั๋วเครื่องบิน Real-time จาก API
# =====================================================================
@app.route('/api/generate-trip', methods=['POST'])
def generate_trip():
    try:
        user_input = request.json
        destination = user_input.get("destination", "Japan")
        departure_date = user_input.get("departureDate", "")
        days = int(user_input.get("days", 1))
        budget = user_input.get("budget", "Economy")
        airline_preference = user_input.get("airlinePreference", "Full Service")
        interests = user_input.get("interests", "")

        # ค้นหารหัสสนามบินปลายทาง
        dest_iata = get_destination_iata(destination)
        
        # สอยราคาตั๋วจริงจาก FlightAPI
        real_flight = get_realtime_flight_data(dest_iata, departure_date)
        
        if real_flight:
            flight_context = f"ตรวจพบราคาตั๋วจริง ณ วันนี้ สายการบิน: {real_flight['airline']} ราคา: {real_flight['price']:,} THB"
            suggested_cost_str = f"{real_flight['price']:,} THB (ราคา Real-time ล่าสุด)"
            suggested_airline_str = real_flight['airline']
        else:
            flight_context = "ไม่พบข้อมูลตั๋วแบบ Real-time ให้คุณสุ่มราคาจริงตามสไตล์ตลาดปัจจุบันมาแทน"
            suggested_cost_str = "12,000 - 22,000 THB (ราคาโดยประมาณ)"
            suggested_airline_str = "Thai Airways, Japan Airlines, AirAsia"

        # ดีไซน์ Deep Link ไปเว็บ Trip.com ขาเดียว
        trip_deep_link = f"https://th.trip.com/flights/bangkok-to-anywhere/tickets-bkk-{dest_iata.lower()}?dDate={departure_date}"

        # 1. เขียนข้อความสั่ง Bot พ่วงราคาตั๋วจริงเข้าไป
        system_instruction = f"""
        คุณคือผู้เชี่ยวชาญด้านการจัดทริปท่องเที่ยวระดับโลก หน้าที่ของคุณคือสร้างแผนการเดินทางแบบเจาะลึก 
        โดยอ้างอิงจากข้อมูลจริง สถานที่จริงที่มีอยู่จริงบนแผนที่ตามเงื่อนไขของผู้ใช้
        
        ข้อมูลเงื่อนไขของผู้ใช้:
        - ประเทศจุดหมายปลายทาง: {destination} (รหัสสนามบิน: {dest_iata})
        - จำนวนวันเดินทาง: {days} วัน
        - วันที่ออกเดินทาง: {departure_date}
        - ระดับงบประมาณ: {budget}
        - สไตล์สายการบิน: {airline_preference}
        - ความสนใจพิเศษ/ไลฟ์สไตล์: {interests}

        ข้อมูลตั๋วเครื่องบินดิบจากระบบภายนอก:
        - {flight_context}

        กฎในการสร้างเนื้อหา:
        1. ห้ามเขียนคำบรรยายสั้นๆ ห้วนๆ ต้องระบุชื่อสถานที่จริงเสมอ (เช่น 'วัดเซนโซจิ ย่านอาซากุสะ')
        2. ในแต่ละวัน จะต้องจัดทริปให้ละเอียดแบ่งออกเป็น 4 ช่วงเวลาเสมอ ได้แก่ '09:30' (เช้า), '12:00' (มื้อเที่ยง), '14:30' (บ่ายแก่ๆ), และ '18:30' (มื้อเย็น)
        3. ในฟิลด์ 'description' ให้เขียนอธิบายเจาะลึก 3-4 ประโยค บรรยายบรรยากาศและกิจกรรมให้สอดรับไลฟ์สไตล์ {interests} ของผู้ใช้
        4. แนะนำเที่ยวบินโดยอ้างอิงสายการบินและเรทราคาที่ส่งไปให้ในระบบดิบด้านบน และนำลิงก์จองนี้: '{trip_deep_link}' ยัดใส่ในฟิลด์ 'bookingUrl'

        คุณต้องตอบกลับมาเป็นข้อมูลรูปแบบ JSON เท่านั้น ห้ามมีข้อความเกริ่นนำ หรือปิดท้าย ห้ามใส่เครื่องหมาย ```json ครอบ โครงสร้าง JSON ต้องเป็นดังนี้:
        {{
          "tripName": "ชื่อทริปภาษาไทยที่ตั้งให้ดูน่าตื่นเต้นและสร้างสรรค์",
          "destination": "{destination}",
          "totalDays": {days},
          "budgetLevel": "{budget}",
          "recommendedFlight": {{
            "flightType": "{airline_preference} Airlines",
            "suggestedAirlines": "{suggested_airline_str}",
            "estimatedFlightCost": "{suggested_cost_str}",
            "bookingUrl": "{trip_deep_link}",
            "flightTips": "แนะนำตรวจสอบมาตรการกระเป๋า และกดจองผ่านลิงก์ Trip.com ที่เตรียมไว้ให้เพื่อตรวจสอบเวลาบินจริงล่วงหน้า"
          }},
          "itinerary": [
            {{
              "day": 1,
              "theme": "ชื่อธีมของวันนั้นๆ",
              "activities": [
                {{
                  "time": "09:30",
                  "locationName": "ชื่อสถานที่และย่านจริง",
                  "description": "คำบรรยายแผนการท่องเที่ยวแบบละเอียด 3-4 ประโยคชวนน่าติดตาม",
                  "estimatedCost": "150 - 300 THB หรือ ฟรี",
                  "latitude": 35.123456,
                  "longitude": 139.123456
                }}
              ]
            }}
          ]
        }}
        """

        # 2. เรียกใช้โมเดล Gemini
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

    except Exception as e:
        print("Generate Trip AI Error:", e)
        return jsonify({"error": f"หลังบ้านเกิดข้อผิดพลาดในการประมวลผล AI: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)