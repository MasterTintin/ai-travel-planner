import React, { useState } from "react";
import axios from "axios";

function App() {
  // 1. สร้าง State สำหรับเก็บข้อมูลที่ผู้ใช้กรอกในฟอร์ม
  const [formData, setFormData] = useState({
    destination: "",
    days: 1,
    budget: "Economy",
    interests: ""
  });

  // 2. สร้าง State สำหรับเก็บผลลัพธ์ที่ได้มาจาก Gemini และเก็บสถานะการโหลด
  const [tripResult, setTripResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ฟังก์ชันอัปเดตค่าในฟอร์มเวลาพิมพ์
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 3. ฟังก์ชันตัวเด็ด: ยิงถล่มข้ามไปหา server
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
      setError(err.response?.data?.error || "เกิดข้อผิดพลาดในการเชื่อมต่อ");
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
      <h1 style={{ textAlign: "center" }}>🤖 AI Travel Planner 🚀</h1>

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
        <div>
          <label>จุดหมายปลายทาง (Destination): </label>
          <input
            type="text"
            name="destination"
            value={formData.destination}
            onChange={handleChange}
            placeholder="เช่น Tokyo, Japan หรือ Chiang Mai"
            required
            style={{ width: "100%", padding: "8px" }}
          />
        </div>

        <div>
          <label>จำนวนวัน (Days): </label>
          <input
            type="number"
            name="days"
            min="1"
            max="7"
            value={formData.days}
            onChange={handleChange}
            required
            style={{ width: "100%", padding: "8px" }}
          />
        </div>

        <div>
          <label>งบประมาณ (Budget Level): </label>
          <select
            name="budget"
            value={formData.budget}
            onChange={handleChange}
            style={{ width: "100%", padding: "8px" }}
          >
            <option value="Economy">Economy (ประหยัด)</option>
            <option value="Standard">Standard (ปานกลาง)</option>
            <option value="Luxury">Luxury (หรูหรา)</option>
          </select>
        </div>

        <div>
          <label>ความสนใจ / ไลฟ์สไตล์ (Interests): </label>
          <textarea
            name="interests"
            value={formData.interests}
            onChange={handleChange}
            placeholder="เช่น Anime, Local food, Photography, Shopping"
            style={{ width: "100%", padding: "8px", height: "80px" }}
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
            ? "กำลังให้ AI ปั้นตารางเที่ยว... 🧠"
            : "วางแผนเที่ยวให้ฉันเลย! 🔥"}
        </button>
      </form>

      {error && (
        <div
          style={{
            color: "red",
            padding: "10px",
            background: "#fde8e8",
            borderRadius: "5px"
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
            {tripResult.totalDays} วัน | 💰 <b>ระดับงบ:</b>{" "}
            {tripResult.budgetLevel}
          </p>
          <hr />

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
                      {act.latitude}, {act.longitude}
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
