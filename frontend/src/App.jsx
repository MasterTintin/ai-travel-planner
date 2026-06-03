import React, { useState, useEffect } from "react";
import axios from "axios";

function App() {
  const [formData, setFormData] = useState({
    destination: "Japan",
    departureDate: "",
    days: 1,
    budget: "Economy",
    airlinePreference: "Full Service",
    interests: ""
  });

  const [tripResult, setTripResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // State อัตราแลกเปลี่ยน
  const [exchangeData, setExchangeData] = useState(null);
  const [ratesLoading, setRatesLoading] = useState(true);

  // ดึงอัตราแลกเปลี่ยนจาก Backend Port 5000
  useEffect(() => {
    const fetchRates = async () => {
      try {
        const response = await axios.get(
          "http://127.0.0.1:5000/api/exchange-rates"
        );
        setExchangeData(response.data);
      } catch (err) {
        console.error("ไม่สามารถดึงข้อมูลอัตราแลกเปลี่ยนได้:", err);
      } finally {
        setRatesLoading(false);
      }
    };
    fetchRates();
  }, []);

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

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
        err.response?.data?.error ||
          "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์หลังบ้าน"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "20px",
        fontFamily: "sans-serif",
        color: "#333"
      }}
    >
      <h1 style={{ textAlign: "center", marginBottom: "30px" }}>
        🤖 AI Travel Planner & Flight Matcher 🚀
      </h1>

      <div
        style={{
          display: "flex",
          gap: "25px",
          alignItems: "flex-start",
          flexWrap: "wrap",
          marginBottom: "30px"
        }}
      >
        {/* === โซนกรอกข้อมูล (ซ้าย) === */}
        <div
          style={{
            flex: "2",
            minWidth: "350px",
            background: "#ffffff",
            padding: "20px",
            borderRadius: "10px",
            border: "1px solid #e0e0e0"
          }}
        >
          <h3 style={{ margin: "0 0 15px 0", color: "#ff5a5f" }}>
            📝 รายละเอียดการเดินทาง
          </h3>

          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "15px" }}
          >
            <div style={{ display: "flex", gap: "15px", flexWrap: "wrap" }}>
              <div style={{ flex: "1", minWidth: "180px" }}>
                <label style={{ fontWeight: "bold", fontSize: "14px" }}>
                  📍 จุดหมายปลายทาง:
                </label>
                <select
                  name="destination"
                  value={formData.destination}
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    padding: "10px",
                    marginTop: "5px",
                    borderRadius: "4px",
                    border: "1px solid #ccc"
                  }}
                >
                  {countries.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ flex: "1", minWidth: "180px" }}>
                <label style={{ fontWeight: "bold", fontSize: "14px" }}>
                  📅 วันที่ออกเดินทาง:
                </label>
                <input
                  type="date"
                  name="departureDate"
                  value={formData.departureDate}
                  onChange={handleChange}
                  required
                  style={{
                    width: "100%",
                    padding: "8px",
                    marginTop: "5px",
                    borderRadius: "4px",
                    border: "1px solid #ccc"
                  }}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: "15px", flexWrap: "wrap" }}>
              <div style={{ flex: "1", minWidth: "180px" }}>
                <label style={{ fontWeight: "bold", fontSize: "14px" }}>
                  ⏳ จำนวนวันเดินทาง (Days):
                </label>
                <input
                  type="number"
                  name="days"
                  min="1"
                  value={formData.days}
                  onChange={handleChange}
                  required
                  style={{
                    width: "100%",
                    padding: "8px",
                    marginTop: "5px",
                    borderRadius: "4px",
                    border: "1px solid #ccc"
                  }}
                />
              </div>

              <div style={{ flex: "1", minWidth: "180px" }}>
                <label style={{ fontWeight: "bold", fontSize: "14px" }}>
                  💰 งบประมาณรวม:
                </label>
                <select
                  name="budget"
                  value={formData.budget}
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    padding: "10px",
                    marginTop: "5px",
                    borderRadius: "4px",
                    border: "1px solid #ccc"
                  }}
                >
                  <option value="Economy">Economy (ประหยัด)</option>
                  <option value="Standard">Standard (ปานกลาง)</option>
                  <option value="Luxury">Luxury (หรูหรา)</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ fontWeight: "bold", fontSize: "14px" }}>
                ✈️ รูปแบบสายการบิน:
              </label>
              <select
                name="airlinePreference"
                value={formData.airlinePreference}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "10px",
                  marginTop: "5px",
                  borderRadius: "4px",
                  border: "1px solid #ccc"
                }}
              >
                <option value="Low-cost">
                  Low-cost (สายการบินประหยัด เช่น AirAsia , VietJet)
                </option>
                <option value="Full Service">
                  Full Service (บริการเต็มรูปแบบ เช่น THAI AIRWAYS , ANA)
                </option>
                <option value="Luxury/First Class">
                  Luxury/First Class (พรีเมียมหรูหรา เช่น Emirates , Singapore
                  Airlines)
                </option>
              </select>
            </div>

            <div>
              <label style={{ fontWeight: "bold", fontSize: "14px" }}>
                🎨 ความสนใจ / ไลฟ์สไตล์:
              </label>
              <textarea
                name="interests"
                value={formData.interests}
                onChange={handleChange}
                placeholder="เช่น Anime, Local food, Shopping"
                style={{
                  width: "100%",
                  padding: "10px",
                  height: "70px",
                  marginTop: "5px",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                  resize: "vertical"
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "14px",
                background: loading
                  ? "linear-gradient(90deg, #ccc 25%, #bbb 50%, #ccc 75%)"
                  : "#ff5a5f",
                backgroundSize: "200% 100%",
                animation: loading ? "shimmer 1.5s infinite linear" : "none",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: "16px",
                fontWeight: "bold",
                marginTop: "10px"
              }}
            >
              {loading
                ? "กำลังให้ AI จัดแจงตั๋วเครื่องบินและตารางเที่ยว... 🧠✈️"
                : "ค้นหาเที่ยวบินและวางแผนเที่ยวได้เลย! 🔥"}
            </button>
          </form>
        </div>

        {/* === โซนอัตราแลกเปลี่ยน === */}
        <div
          style={{
            flex: "1",
            minWidth: "300px",
            background: "#fff",
            padding: "20px",
            borderRadius: "10px",
            border: "1px solid #e0e0e0",
            boxShadow: "0 4px 12px rgba(0,0,0,0.03)"
          }}
        >
          <h3
            style={{
              margin: "0 0 5px 0",
              color: "#333",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            อัตราแลกเปลี่ยนรายวัน
          </h3>
          <p style={{ fontSize: "12px", color: "#666", margin: "0 0 15px 0" }}>
            ฐานเงินบาท (THB) | อัปเดต:{" "}
            {exchangeData ? exchangeData.date : "ตรวจเช็กเซิร์ฟเวอร์..."}
          </p>

          {ratesLoading ? (
            <div
              style={{
                textAlign: "center",
                padding: "30px",
                color: "#ff5a5f",
                fontSize: "14px",
                fontWeight: "500"
              }}
            >
              ⏳ รอการเชื่อมต่อจาก Port 5000...
            </div>
          ) : (
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "14px"
              }}
            >
              <thead>
                <tr
                  style={{ borderBottom: "2px solid #eee", textAlign: "left" }}
                >
                  <th style={{ padding: "8px 4px", color: "#555" }}>
                    สกุลเงิน
                  </th>
                  <th
                    style={{
                      padding: "8px 4px",
                      color: "#555",
                      textAlign: "right"
                    }}
                  >
                    Rate ราคา (THB)
                  </th>
                </tr>
              </thead>
              <tbody>
                {exchangeData?.rates?.map((item, index) => (
                  <tr
                    key={index}
                    style={{
                      borderBottom: "1px solid #f5f5f5",
                      backgroundColor: index % 2 === 0 ? "#fafafa" : "#fff"
                    }}
                  >
                    <td style={{ padding: "10px 4px", fontWeight: "500" }}>
                      {item.name}
                    </td>
                    <td
                      style={{
                        padding: "10px 4px",
                        textAlign: "right",
                        color: "#2e7d32",
                        fontWeight: "bold"
                      }}
                    >
                      {item.code === "VND" || item.code === "KRW"
                        ? `≈ ${item.rate} บาท / 1 หน่วย`
                        : `${item.rate} บาท`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* === โซนแสดงผลลัพธ์ === */}
      {error && (
        <div
          style={{
            color: "red",
            padding: "15px",
            background: "#fde8e8",
            borderRadius: "6px",
            marginBottom: "20px"
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {tripResult && (
        <div
          style={{
            background: "#f9f9f9",
            padding: "25px",
            borderRadius: "10px",
            border: "1px solid #ddd",
            marginTop: "20px"
          }}
        >
          <h2>✨ ชื่อทริป: {tripResult.tripName}</h2>
          <p style={{ fontSize: "15px", color: "#555" }}>
            📍 <b>ปลายทาง:</b> {tripResult.destination} | ⏳ <b>เวลา:</b>{" "}
            {tripResult.totalDays} วัน | 💰 <b>ระดับงบกิจกรรม:</b>{" "}
            {tripResult.budgetLevel}
          </p>

          {tripResult.recommendedFlight && (
            <div
              style={{
                background: "#e3f2fd",
                padding: "15px",
                borderRadius: "6px",
                marginBottom: "25px",
                borderLeft: "5px solid #2196f3"
              }}
            >
              <h3 style={{ margin: "0 0 10px 0", color: "#0d47a1" }}>
                ✈️ ข้อมูลตั๋วเครื่องบินแนะนำ
              </h3>
              <p style={{ margin: "5px 0" }}>
                🛫 <b>ประเภทตั๋ว:</b> {tripResult.recommendedFlight.flightType}
              </p>
              <p style={{ margin: "5px 0" }}>
                🏢 <b>สายการบิน:</b>{" "}
                {tripResult.recommendedFlight.suggestedAirlines}
              </p>
              <p style={{ margin: "5px 0" }}>
                💵 <b>ราคาไป-กลับโดยประมาณ:</b>{" "}
                <span style={{ color: "#2e7d32", fontWeight: "bold" }}>
                  {tripResult.recommendedFlight.estimatedFlightCost}
                </span>
              </p>
              <p style={{ margin: "5px 0", fontSize: "14px", color: "#555" }}>
                💡 <b>คำแนะนำ:</b> {tripResult.recommendedFlight.flightTips}
              </p>

              {/* 🛠️ เพิ่มปุ่มจองตั๋วข้ามไป Trip.com ตรงจุดนี้! */}
              {tripResult.recommendedFlight.bookingUrl && (
                <div style={{ marginTop: "15px" }}>
                  <a
                    href={tripResult.recommendedFlight.bookingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-block",
                      padding: "10px 20px",
                      backgroundColor: "#0064d2",
                      color: "white",
                      fontWeight: "bold",
                      textDecoration: "none",
                      borderRadius: "6px",
                      boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                      transition: "background-color 0.2s"
                    }}
                    onMouseOver={(e) =>
                      (e.target.style.backgroundColor = "#0053b3")
                    }
                    onMouseOut={(e) =>
                      (e.target.style.backgroundColor = "#0064d2")
                    }
                  >
                    ✈️ เช็กและจองตั๋วเครื่องบินจริงบน Trip.com 🌐
                  </a>
                </div>
              )}
            </div>
          )}

          <hr
            style={{
              margin: "25px 0",
              border: "0",
              borderTop: "1px solid #ddd"
            }}
          />

          {tripResult.itinerary?.map((item, idx) => (
            <div
              key={idx}
              style={{
                marginBottom: "20px",
                padding: "15px",
                background: "white",
                borderRadius: "6px",
                boxShadow: "0 2px 5px rgba(0,0,0,0.05)"
              }}
            >
              <h3 style={{ color: "#ff5a5f", marginTop: "0" }}>
                📅 วันที่ {item.day} - {item.theme}
              </h3>
              <ul style={{ paddingLeft: "20px", margin: "0" }}>
                {item.activities?.map((act, actIdx) => (
                  <li key={actIdx} style={{ marginBottom: "12px" }}>
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
                      💵 ค่าใช้จ่าย: {act.estimatedCost} | 🌐 พิกัด:
                      <a
                        href={`https://www.google.com/maps?q=${act.latitude},${act.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: "#2196f3",
                          fontWeight: "bold",
                          marginLeft: "4px"
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
