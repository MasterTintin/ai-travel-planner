import React, { useState } from "react";
import axios from "axios";

function App() {
  // 1. อัปเดต State เพิ่มฟิลด์เที่ยวบินและวันที่ออกเดินทาง
  const [formData, setFormData] = useState({
    destination: "Japan",
    departureDate: "",
    days: 1,
    budget: "Economy",
    airlinePreference: "Full Service",
    interests: ""
  });

  // 2. State เก็บผลลัพธ์และสถานะการทำงาน
  const [tripResult, setTripResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // รายชื่อประเทศยอดฮิตทั่วโลกเพื่อทำ Dropdown
  const countries = [
    "Japan",
    "South Korea",
    "Thailand",
    "Singapore",
    "Taiwan",
    "Hong Kong",
    "China",
    "Vietnam",
    "United Kingdom",
    "United States",
    "France",
    "Germany",
    "Switzerland",
    "Italy",
    "Australia"
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 3. ฟังก์ชันยิงข้ามท่อข้ามเซิร์ฟเวอร์
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setTripResult(null);

    try {
      const response = await axios.post(
        "http://127.0.0.1:5000/api/generate-trip",
        formData
      );
      setTripResult(response.data);
    } catch (err) {
      console.error("Frontend Fetch Error:", err);
      setError(
        err.response?.data?.error || "เกิดข้อผิดพลาดในการเชื่อมต่อหลังบ้าน"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: "800px",
        margin: "0 auto",
        padding: "20px",
        fontFamily: "sans-serif"
      }}
    >
      <h1 style={{ textAlign: "center" }}>
        🤖 AI Travel Planner & Flight Matcher 🚀
      </h1>

      {/* ส่วนของฟอร์มรับ Input */}
      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "15px",
          marginBottom: "30px"
        }}
      >
        {/* เลือกประเทศจุดหมายปลายทาง */}
        <div>
          <label style={{ fontWeight: "bold" }}>
            📍 จุดหมายปลายทาง (Destination Country):{" "}
          </label>
          <select
            name="destination"
            value={formData.destination}
            onChange={handleChange}
            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
          >
            {countries.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
        </div>

        {/* วันที่ออกเดินทาง */}
        <div>
          <label style={{ fontWeight: "bold" }}>
            📅 วันที่ออกเดินทาง (Departure Date):{" "}
          </label>
          <input
            type="date"
            name="departureDate"
            value={formData.departureDate}
            onChange={handleChange}
            required
            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
          />
        </div>

        {/* จำนวนวัน */}
        <div>
          <label style={{ fontWeight: "bold" }}>จำนวนวัน (Days): </label>
          <input
            type="number"
            name="days"
            min="1"
            max="7"
            value={formData.days}
            onChange={handleChange}
            required
            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
          />
        </div>

        {/* สไตล์เที่ยวบินตามงบประมาณ */}
        <div>
          <label style={{ fontWeight: "bold" }}>
            ✈️ รูปแบบสายการบิน (Flight Preference):{" "}
          </label>
          <select
            name="airlinePreference"
            value={formData.airlinePreference}
            onChange={handleChange}
            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
          >
            <option value="Low-cost">
              Low-cost (สายการบินประหยัด เช่น AirAsia, VietJet)
            </option>
            <option value="Full Service">
              Full Service (บริการเต็มรูปแบบ เช่น THAI AIRWAYS, ANA)
            </option>
            <option value="Luxury/First Class">
              Luxury/First Class (พรีเมียมหรูหรา เช่น Emirates, Singapore
              Airlines)
            </option>
          </select>
        </div>

        {/* งบประมาณรวม */}
        <div>
          <label style={{ fontWeight: "bold" }}>
            💰 งบประมาณรวม (Total Trip Budget):{" "}
          </label>
          <select
            name="budget"
            value={formData.budget}
            onChange={handleChange}
            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
          >
            <option value="Economy">Economy (ประหยัด)</option>
            <option value="Standard">Standard (ปานกลาง)</option>
            <option value="Luxury">Luxury (หรูหรา)</option>
          </select>
        </div>

        {/* ความสนใจ / ไลฟ์สไตล์ */}
        <div>
          <label style={{ fontWeight: "bold" }}>
            ความสนใจ / ไลฟ์สไตล์ (Interests):{" "}
          </label>
          <textarea
            name="interests"
            value={formData.interests}
            onChange={handleChange}
            placeholder="เช่น Anime, Local food, Photography, Shopping"
            style={{
              width: "100%",
              padding: "8px",
              height: "80px",
              marginTop: "5px"
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "12px",
            background: loading ? "#ccc" : "#ff5a5f",
            color: "white",
            border: "none",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: "bold"
          }}
        >
          {loading
            ? "กำลังให้ AI จัดแจงตั๋วเครื่องบินและปั้นตารางเที่ยว... 🧠✈️"
            : "ค้นหาเที่ยวบินและวางแผนเที่ยวได้เลย! 🔥"}
        </button>
      </form>

      {error && (
        <div
          style={{
            color: "red",
            padding: "10px",
            background: "#fde8e8",
            borderRadius: "5px",
            marginBottom: "20px"
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* 4. ส่วนแสดงผลลัพธ์ตารางเที่ยว */}
      {tripResult && (
        <div
          style={{
            background: "#f9f9f9",
            padding: "20px",
            borderRadius: "8px",
            border: "1px solid #ddd"
          }}
        >
          <h2>✨ ชื่อทริป: {tripResult.tripName}</h2>
          <p>
            📍 <b>ปลายทาง:</b> {tripResult.destination} | ⏳ <b>เวลา:</b>{" "}
            {tripResult.totalDays} วัน | 💰 <b>ระดับงบกิจกรรม:</b>{" "}
            {tripResult.budgetLevel}
          </p>

          {/* ส่วนแสดงผลเที่ยวบินแนะนำจาก AI */}
          {tripResult.recommendedFlight && (
            <div
              style={{
                background: "#e3f2fd",
                padding: "15px",
                borderRadius: "6px",
                marginBottom: "25px",
                borderLeft: "5px solid #2196f3",
                boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
              }}
            >
              <h3 style={{ margin: "0 0 10px 0", color: "#0d47a1" }}>
                ✈️ ข้อมูลตั๋วเครื่องบินตามงบ
              </h3>
              <p style={{ margin: "5px 0" }}>
                🛫 <b>ประเภทตั๋ว:</b> {tripResult.recommendedFlight.flightType}
              </p>
              <p style={{ margin: "5px 0" }}>
                🏢 <b>สายการบินที่แนะ:</b>{" "}
                {tripResult.recommendedFlight.suggestedAirlines}
              </p>
              <p style={{ margin: "5px 0" }}>
                💵 <b>ราคาไป-กลับโดยประมาณ:</b>{" "}
                <span style={{ color: "#2e7d32", fontWeight: "bold" }}>
                  {tripResult.recommendedFlight.estimatedFlightCost}
                </span>
              </p>
              <p style={{ margin: "5px 0", fontSize: "14px", color: "#555" }}>
                💡 <b>คำแนะนำเพิ่มเติม:</b>{" "}
                {tripResult.recommendedFlight.flightTips}
              </p>
            </div>
          )}

          <hr style={{ marginBottom: "20px" }} />

          {tripResult.itinerary?.map((item, idx) => (
            <div
              key={idx}
              style={{
                marginBottom: "20px",
                padding: "10px",
                background: "white",
                borderRadius: "5px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
              }}
            >
              <h3 style={{ color: "#ff5a5f" }}>
                📅 วันที่ {item.day} - {item.theme}
              </h3>

              <ul style={{ paddingLeft: "20px" }}>
                {item.activities?.map((act, actIdx) => (
                  <li key={actIdx} style={{ marginBottom: "10px" }}>
                    <b>⏰ {act.time}</b> -{" "}
                    <span style={{ color: "#333", fontWeight: "bold" }}>
                      {act.locationName}
                    </span>
                    <p
                      style={{
                        margin: "4px 0",
                        color: "#666",
                        fontSize: "14px"
                      }}
                    >
                      {act.description}
                    </p>
                    <small style={{ color: "#999" }}>
                      💵 คาดการณ์ค่าใช้จ่าย: {act.estimatedCost} | 🌐 พิกัด:{" "}
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${act.latitude},${act.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: "#2196f3",
                          textDecoration: "underline",
                          fontWeight: "bold",
                          marginLeft: "3px"
                        }}
                      >
                        {act.latitude}, {act.longitude} (คลิกเปิดแผนที่ 🗺️)
                      </a>
                    </small>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
