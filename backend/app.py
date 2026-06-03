import os
import json
import requests
from flask import Flask, jsonify, request
from flask_cors import CORS
import google.generativeai as genai

app = Flask(__name__)
CORS(app)

GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY", "AIzaSyD440glFatTkx7bTTfcuG24HZqIWvZajl0")
genai.configure(api_key=GOOGLE_API_KEY)

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
            target_currencies = {
                "JPY": "ญี่ปุ่น (JPY)", "KRW": "เกาหลีใต้ (KRW)", "SGD": "สิงคโปร์ (SGD)",
                "USD": "สหรัฐฯ (USD)", "EUR": "ยุโรป (EUR)", "CNY": "จีน (CNY)",
                "VND": "เวียดนาม (VND)", "AUD": "ออสเตรเลีย (AUD)", "GBP": "อังกฤษ (GBP)"
            }
            formatted_rates = []
            for code, name in target_currencies.items():
                if code in rates:
                    thb_per_unit = 1 / rates[code]
                    rate_value = round(thb_per_unit, 6) if code in ["VND", "KRW"] else round(thb_per_unit, 4)
                    formatted_rates.append({"code": code, "name": name, "rate": rate_value})
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
# API 2: ต่อท่อหา AI ของจริง ดึงแผนเที่ยวแบบละเอียด
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

        # 1. เขียนข้อความสั่งBot (Prompt Engineering) ให้คุม JSON Format 
        system_instruction = f"""
        คุณคือผู้เชี่ยวชาญด้านการจัดทริปท่องเที่ยวระดับโลก หน้าที่ของคุณคือสร้างแผนการเดินทางแบบเจาะลึก 
        โดยอ้างอิงจากข้อมูลจริง สถานที่จริงที่มีอยู่จริงบนแผนที่ตามเงื่อนไขของผู้ใช้
        
        ข้อมูลเงื่อนไขของผู้ใช้:
        - ประเทศจุดหมายปลายทาง: {destination}
        - จำนวนวันเดินทาง: {days} วัน
        - วันที่ออกเดินทาง: {departure_date}
        - ระดับงบประมาณ: {budget}
        - สไตล์สายการบิน: {airline_preference}
        - ความสนใจพิเศษ/ไลฟ์สไตล์: {interests}

        กฎในการสร้างเนื้อหา:
        1. ห้ามเขียนคำบรรยายสั้นๆ ห้วนๆ หรือใช้คำนามทั่วไป (เช่น ห้ามใช้คำว่า 'ย่านประวัติศาสตร์', 'ร้านอาหารยอดฮิต') ต้องระบุชื่อจริงเสมอ (เช่น 'วัดเซนโซจิ ย่านอาซากุสะ', 'ร้าน Ichiran Ramen')
        2. ในแต่ละวัน จะต้องจัดทริปให้ละเอียดแบ่งออกเป็น 4 ช่วงเวลาเสมอ ได้แก่ '09:30' (เช้า), '12:00' (มื้อเที่ยงฟินๆ), '14:30' (บ่ายแก่ๆ/คาเฟ่/ช้อปปิ้ง), และ '18:30' (มื้อเย็น/ชมวิวค่ำคืน)
        3. ในฟิลด์ 'description' ให้เขียนอธิบายเจาะลึก 3-4 ประโยค บรรยายบรรยากาศ ไฮไลท์ห้ามพลาด และกิจกรรมที่แนะนำตามสไตล์ของผู้ใช้
        4. กิจกรรมในวันเดียวกันต้องอยู่ในพื้นที่ใกล้เคียงกัน ไม่จัดทริปข้ามเมืองไปมาจนเหนื่อยเกินไป
        5. แนะนำเที่ยวบินและสายการบินจริงที่บินจากประเทศไทยไปยังประเทศนั้นๆ ให้สอดคล้องกับระดับงบประมาณที่ระบุ

        คุณต้องตอบกลับมาเป็นข้อมูลรูปแบบ JSON เท่านั้น ห้ามมีข้อความเกริ่นนำ หรือปิดท้าย ห้ามใส่เครื่องหมาย ```json ครอบ โครงสร้าง JSON ต้องเป็นดังนี้:
        {{
          "tripName": "ชื่อทริปภาษาไทยที่ตั้งให้ดูน่าตื่นเต้นและสร้างสรรค์",
          "destination": "{destination}",
          "totalDays": {days},
          "budgetLevel": "{budget}",
          "recommendedFlight": {{
            "flightType": "ประเภทตั๋วหรือสายการบิน",
            "suggestedAirlines": "ชื่อสายการบินที่แนะนำ (คั่นด้วยคอมมา)",
            "estimatedFlightCost": "ช่วงราคาประมาณการ เช่น 15,000 - 22,000 THB",
            "flightTips": "คำแนะนำสั้นๆ ในการเดินทาง"
          }},
          "itinerary": [
            {{
              "day": 1,
              "theme": "ชื่อธีมของวันนั้นๆ เช่น ตะลุยความฟินย่านการ์ตูนและของอร่อยชินจูกุ",
              "activities": [
                {{
                  "time": "09:30",
                  "locationName": "ชื่อสถานที่และย่านจริงในภาษานั้นๆ หรือสากล",
                  "description": "คำบรรยายเนื้อหาแผนการท่องเที่ยวแบบละเอียด 3-4 ประโยคชวนน่าติดตาม",
                  "estimatedCost": "งบประมาณค่าวัด/ค่ากิน เช่น 150 - 300 THB หรือ ฟรี",
                  "latitude": 35.xxxxxx,
                  "longitude": 139.xxxxxx
                }}
              ]
            }}
          ]
        }}
        """

        # 2. เรียกใช้โมเดล Gemini
        model = genai.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content(system_instruction)
        
        # 3. แปลง Text ลิปซิงค์ที่ได้กลับมาเป็น JSON Object ส่งคืนหน้าบ้าน
        response_text = response.text.strip()
        
        # ป้องกันกรณี AI ใส่เครื่องหมาย markdown
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