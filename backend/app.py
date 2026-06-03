import os
import requests
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# =====================================================================
# API 1: ดึงอัตราแลกเปลี่ยนรายวัน เทียบเงินบาทไทย
# =====================================================================
@app.route('/api/exchange-rates', methods=['GET'])
def get_exchange_rates():
    try:
        # ดึงข้อมูลจาก Open Exchange Rates API
        url = "https://open.er-api.com/v6/latest/THB"
        response = requests.get(url, timeout=5)
        data = response.json()
        
        if data.get("result") == "success":
            rates = data.get("rates", {})
            # ลิสต์สกุลเงินของประเทศใหญ่ๆ ในระบบ Dropdown 
            target_currencies = {
                "JPY": "ญี่ปุ่น (JPY)",
                "KRW": "เกาหลีใต้ (KRW)",
                "SGD": "สิงคโปร์ (SGD)",
                "USD": "สหรัฐฯ (USD)",
                "EUR": "ยุโรป (EUR)",
                "CNY": "จีน (CNY)",
                "VND": "เวียดนาม (VND)",
                "AUD": "ออสเตรเลีย (AUD)",
                "GBP": "อังกฤษ (GBP)"
            }
            
            formatted_rates = []
            for code, name in target_currencies.items():
                if code in rates:
                    # คำนวณกลับ
                    thb_per_unit = 1 / rates[code]
                    
                    # ถ้าเป็นเงินดองหรือเงินวอน ตัวเลขจะน้อย ให้ทศนิยม 6 ตำแหน่งเพื่อความแม่นยำ
                    if code in ["VND", "KRW"]:
                        rate_value = round(thb_per_unit, 6)
                    else:
                        rate_value = round(thb_per_unit, 4)
                        
                    formatted_rates.append({
                        "code": code,
                        "name": name,
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
# API 2: เจนทริปท่องเที่ยวและแมตช์เที่ยวบินผ่าน AI
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

        # คลังธีมกิจกรรมสำหรับทริปวันกลางๆ เพื่อให้ข้อมูลไม่ซ้ำกัน
        middle_day_themes = [
            {
                "theme": f"ตะลุยแลนด์มาร์กสายถ่ายภาพและสถาปัตยกรรมระดับโลก",
                "act1_name": "ย่านประวัติศาสตร์ และมุมถ่ายรูปมหาชน",
                "act1_desc": f"ชมสถาปัตยกรรมดั้งเดิมที่ผสมผสานความทันสมัย แวะถ่ายรูปเช็กอินทำคอนเทนต์ลง Social Media",
                "act2_name": "คาเฟ่ลับสไตล์ Minimal และจุดชมวิวเมือง",
                "act2_desc": "พักผ่อนจิบเครื่องดื่มในคาเฟ่ยอดฮิตตามรีวิว และขึ้นชมทัศนียภาพมุมสูงตอนเย็น"
            },
            {
                "theme": f"เปิดโลกการเรียนรู้และวัฒนธรรมท้องถิ่นแบบจัดเต็ม",
                "act1_name": "พิพิธภัณฑ์ศิลปะ/วิทยาศาสตร์ หรือศูนย์นวัตกรรม",
                "act1_desc": f"เข้าชมการจัดแสดงนิทรรศการสุดล้ำที่สะท้อนไอเดียและแรงบันดาลใจ เหมาะกับสาย {interests if interests else 'เรียนรู้โลกกว้าง'}",
                "act2_name": "ย่านอาหารพื้นเมืองเก่าแก่ และตลาดสตรีทฟู้ด",
                "act2_desc": "ตระเวนชิมเมนูเด็ดขึ้นชื่อที่เป็น Signature ของเมือง ลิ้มลองรสชาติออริจินัล"
            },
            {
                "theme": f"ผจญภัยในย่านวัยรุ่น แหล่งช้อปปิ้ง และสตรีทคัลเจอร์",
                "act1_name": "ย่านแฟชั่น ศูนย์รวมความบันเทิงและ Pop Culture",
                "act1_desc": f"เดินสำรวจร้านค้าอัปเดตเทรนด์ใหม่ล่าสุด ช้อปปิ้งของสะสมและสินค้า Limited Edition",
                "act2_name": "สวนสนุก สวนสาธารณะขนาดใหญ่ หรือจุดแฮงเอาท์ยามเย็น",
                "act2_desc": "เพลิดเพลินกับกิจกรรมกลางแจ้งสุดมันส์ สลัดความเหนื่อยล้าแล้วดื่มด่ำกับบรรยากาศสุดชิลล์"
            }
        ]

        generated_itinerary = []
        
        for d in range(1, days + 1):
            if d == 1:
                # วันแรกของการเดินทาง
                theme = "วันแรกเปิดทริป เดินทางเช็กอินและชมแสงสียามค่ำคืน"
                activities = [
                    {
                        "time": "10:00",
                        "locationName": f"สนามบินหลักแห่งเมือง {destination}",
                        "description": "เดินทางถึงจุดหมายปลายทางอย่างปลอดภัย ผ่านด่านตรวจคนเข้าเมืองและรับกระเป๋าสัมภาระ",
                        "estimatedCost": "ตามจริง",
                        "latitude": 35.7720 if destination == "Japan" else 31.2299,
                        "longitude": 140.3929 if destination == "Japan" else 121.4741
                    },
                    {
                        "time": "15:00",
                        "locationName": "โรงแรมที่พัก และย่านใจกลางเมืองใกล้เคียง",
                        "description": f"เช็กอินเก็บกระเป๋าพักผ่อนจากการเดินทาง ก่อนออกมาเดินเล่นสำรวจพื้นที่ใกล้โรงแรมในธีม {interests if interests else 'ชิลล์รอบเมือง'}",
                        "estimatedCost": "100 - 300 THB",
                        "latitude": 35.6585 if destination == "Japan" else 31.2330,
                        "longitude": 139.7454 if destination == "Japan" else 121.4787
                    }
                ]
            elif d == days and days > 1:
                # วันสุดท้ายของการเดินทาง (จะเกิดขึ้นเมื่อทริปมีมากกว่า 1 วัน)
                theme = "เก็บตกวันสุดท้าย ช้อปปิ้งของฝาก และเดินทางกลับประเทศไทย"
                activities = [
                    {
                        "time": "10:00",
                        "locationName": "ศูนย์การค้าและตลาดของที่ระลึกประจำเมือง",
                        "description": "เลือกซื้อขนม ของฝาก และสินค้าแฮนด์เมดท้องถิ่น เพื่อนำกลับไปฝากเพื่อน ๆ และครอบครัว",
                        "estimatedCost": "ตามงบประมาณ",
                        "latitude": 35.6895 if destination == "Japan" else 31.2215,
                        "longitude": 139.6917 if destination == "Japan" else 121.4442
                    },
                    {
                        "time": "16:00",
                        "locationName": f"สนามบินนานาชาติ เตรียมตัวเดินทางกลับ",
                        "description": "ทำการเช็กอินตั๋วเครื่องบิน โหลดกระเป๋าเดินทาง และบินกลับประเทศไทยโดยสวัสดิภาพ",
                        "estimatedCost": "-",
                        "latitude": 35.7720 if destination == "Japan" else 31.2299,
                        "longitude": 140.3929 if destination == "Japan" else 121.4741
                    }
                ]
            else:
                pool_index = (d - 2) % len(middle_day_themes)
                selected_pool = middle_day_themes[pool_index]
                
                theme = f"วันที่ {d}: {selected_pool['theme']}"
                activities = [
                    {
                        "time": "09:30",
                        "locationName": selected_pool['act1_name'],
                        "description": selected_pool['act1_desc'],
                        "estimatedCost": "150 - 400 THB",
                        "latitude": 35.7148 if destination == "Japan" else 31.2390,
                        "longitude": 139.7967 if destination == "Japan" else 121.4920
                    },
                    {
                        "time": "14:00",
                        "locationName": selected_pool['act2_name'],
                        "description": selected_pool['act2_desc'],
                        "estimatedCost": "400 - 1,200 THB",
                        "latitude": 35.6329 if destination == "Japan" else 31.1413,
                        "longitude": 139.8804 if destination == "Japan" else 121.6633
                    }
                ]

            generated_itinerary.append({
                "day": d,
                "theme": theme,
                "activities": activities
            })

        # โครงสร้างส่งกลับไปยัง Frontend
        mock_response = {
            "tripName": f"เปิดประสบการณ์ท่องเที่ยว {destination}: เต็มอิ่มแบบไร้ขีดจำกัด {days} วัน 🌍🌟",
            "destination": destination,
            "totalDays": days,
            "budgetLevel": budget,
            "recommendedFlight": {
                "flightType": f"{airline_preference} Airlines",
                "suggestedAirlines": "Thai Airways, Japan Airlines, ANA" if destination == "Japan" else "Thai Airways, Cathay Pacific, Singapore Airlines",
                "estimatedFlightCost": "20,000 - 35,000 THB" if budget == "Luxury" else "9,000 - 16,000 THB",
                "flightTips": f"จัดทริปยาว {days} วัน แนะนำเตรียมแผนประกันเดินทาง และจองตั๋วช่วงวันที่ {departure_date} ล่วงหน้ายาวๆ เพื่อเรทที่ดีที่สุด"
            },
            "itinerary": generated_itinerary
        }
        
        return jsonify(mock_response)

    except Exception as e:
        print("Generate Trip Error:", e)
        return jsonify({"error": f"หลังบ้านเกิดข้อผิดพลาด: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)