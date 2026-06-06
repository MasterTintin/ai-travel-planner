import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import BudgetSummary from "./BudgetSummary";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import planeBg from "./assets/plane.jpg";
import cloudsBg from "./assets/cloud.jpg";

function App() {
  const [formData, setFormData] = useState({
    destination: "Japan",
    departureDate: "",
    days: 1,
    budget: "Economy",
    airlinePreference: "Full Service",
    travelStyle: "Sightseeing",
    interests: ""
  });
  const [tripResult, setTripResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [exchangeData, setExchangeData] = useState(null);
  const [ratesLoading, setRatesLoading] = useState(true);
  const [activePage, setActivePage] = useState("home");
  const [converterCurrency, setConverterCurrency] = useState("JPY");
  const [foreignAmount, setForeignAmount] = useState("25000");
  const itineraryContainerRef = useRef(null);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

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

  const handleExportItineraryPDF = async () => {
    const element = itineraryContainerRef.current;
    if (!element) return;

    try {
      setIsExportingPDF(true);
      const canvas = await html2canvas(element, {
        scale: 1.8,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false
      });
      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const destinationName =
        tripResult?.destination?.replace(/[^a-zA-Z0-9]/g, "_") || "Trip";
      pdf.save(`Itinerary_${destinationName}.pdf`);
    } catch (pdfError) {
      console.error(" เกิดข้อผิดพลาดในการสร้างไฟล์ :", pdfError);
      alert("ไม่สามารถสร้างไฟล์ตารางการเดินทาง ได้ในขณะนี้");
    } finally {
      setIsExportingPDF(false);
    }
  };

  const calculateToTHB = () => {
    if (!exchangeData?.rates || !foreignAmount || isNaN(foreignAmount))
      return "0.00";

    const targetRateObj = exchangeData.rates.find(
      (item) => item.code === converterCurrency
    );
    if (!targetRateObj) return "0.00";

    let baseDivider = 1;
    if (converterCurrency === "JPY" || converterCurrency === "KRW") {
      baseDivider = 100;
    } else if (converterCurrency === "VND") {
      baseDivider = 1000;
    }

    const result =
      (parseFloat(foreignAmount) / baseDivider) * targetRateObj.rate;
    return result.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

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
    setActivePage("home");

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
      {activePage === "budget" ? (
        tripResult ? (
          <BudgetSummary
            tripResult={tripResult}
            exchangeData={exchangeData}
            onBack={() => setActivePage("home")}
          />
        ) : (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <h3>⚠️ ยังไม่มีข้อมูลทริป กรุณากรอกข้อมูลและกดสร้างทริปก่อน </h3>
            <button
              onClick={() => setActivePage("home")}
              style={{ padding: "10px 20px", cursor: "pointer" }}
            >
              กลับหน้าหลัก
            </button>
          </div>
        )
      ) : (
        <>
          {/* ==================== กล่อง Hero Banner แบบต่อรูปซ้ายขวา ==================== */}
          <div
            style={{
              position: "relative",
              height: "280px",
              borderRadius: "12px",
              overflow: "hidden",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: "35px",
              boxShadow: "0 4px 15px rgba(0,0,0,0.15)",
              backgroundColor: "#0b1526"
            }}
          >
            {/* รูปฝั่งซ้าย */}
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: "60%",
                height: "100%",
                backgroundImage: `url(${planeBg})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                WebkitMaskImage:
                  "linear-gradient(to right, rgba(0,0,0,1) 65%, rgba(0,0,0,0) 100%)",
                maskImage:
                  "linear-gradient(to right, rgba(0,0,0,1) 65%, rgba(0,0,0,0) 100%)"
              }}
            />

            {/* รูปฝั่งขวา */}
            <div
              style={{
                position: "absolute",
                right: 0,
                top: 0,
                width: "55%",
                height: "100%",
                backgroundImage: `url(${cloudsBg})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                WebkitMaskImage:
                  "linear-gradient(to left, rgba(0,0,0,1) 60%, rgba(0,0,0,0) 100%)",
                maskImage:
                  "linear-gradient(to left, rgba(0,0,0,1) 60%, rgba(0,0,0,0) 100%)"
              }}
            />

            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(rgba(0, 0, 0, 0.35), rgba(0, 0, 0, 0.5))",
                zIndex: 1
              }}
            />

            {/* โซนเนื้อหาหัวเว็บ */}
            <div
              style={{
                zIndex: 2,
                color: "white",
                textAlign: "center",
                padding: "20px"
              }}
            >
              <h1
                style={{
                  margin: 0,
                  fontSize: "2.6rem",
                  fontWeight: "bold",
                  textShadow: "3px 3px 12px rgba(0, 0, 0, 0.85)",
                  letterSpacing: "1px"
                }}
              >
                🤖 AI Travel Planner & Flight Matcher 🚀
              </h1>
              <p
                style={{
                  margin: "12px 0 0 0",
                  fontSize: "1.15rem",
                  opacity: 0.95,
                  fontWeight: "500",
                  textShadow: "2px 2px 6px rgba(0, 0, 0, 0.85)"
                }}
              >
                ค้นหาเที่ยวบินที่ใช่ จัดแจงทริปที่ชอบในไม่กี่วินาที
              </p>
            </div>
          </div>
          {/* =================================================================================== */}

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
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "15px"
                }}
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
                      Full Service (บริการเต็มรูปแบบ เช่น Thai Airways , ANA)
                    </option>
                    <option value="Luxury/First Class">
                      Luxury/First Class (พรีเมียมหรูหรา เช่น Emirates ,
                      Singapore Airlines)
                    </option>
                  </select>
                </div>

                <div>
                  <label style={{ fontWeight: "bold", fontSize: "14px" }}>
                    🎭 สไตล์การเดินทางหลัก (Travel Vibe):
                  </label>
                  <select
                    name="travelStyle"
                    value={formData.travelStyle}
                    onChange={handleChange}
                    style={{
                      width: "100%",
                      padding: "10px",
                      marginTop: "5px",
                      borderRadius: "4px",
                      border: "1px solid #ccc",
                      backgroundColor: "#fff"
                    }}
                  >
                    <option value="Sightseeing">Sightseeing & Culture</option>
                    <option value="Foodie">Culinary & Local Food</option>
                    <option value="Nature & Adventure">Nature & Outdoor</option>
                    <option value="Shopping & Lifestyle">
                      Shopping & Urban Life
                    </option>
                    <option value="Relaxation & Wellness">
                      Relaxation & Leisure
                    </option>
                    <option value="Arts & Entertainment">
                      Arts, Nightlife & Entertainment
                    </option>
                  </select>
                </div>

                <div>
                  <label style={{ fontWeight: "bold", fontSize: "14px" }}>
                    🎨 ความสนใจเพิ่มเติม / ไลฟ์สไตล์:
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
                    animation: loading
                      ? "shimmer 1.5s infinite linear"
                      : "none",
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

            {/* === พื้นที่อัตราแลกเปลี่ยน (ขวา) === */}
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
              <h3 style={{ margin: "0 0 5px 0", color: "#333" }}>
                อัตราแลกเปลี่ยนรายวัน
              </h3>
              <p
                style={{
                  fontSize: "12px",
                  color: "#666",
                  margin: "0 0 15px 0"
                }}
              >
                ฐานเงินบาท (THB) | อัปเดต:{" "}
                {exchangeData ? exchangeData.date : "ตรวจเช็กเซิร์ฟเวอร์..."}
              </p>

              {ratesLoading ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "30px",
                    color: "#ff5a5f",
                    fontSize: "14px"
                  }}
                >
                  ⏳ รอการเชื่อมต่อจาก Port 5000...
                </div>
              ) : (
                <>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      fontSize: "14px"
                    }}
                  >
                    <thead>
                      <tr style={{ borderBottom: "2px solid #eee" }}>
                        <th
                          style={{
                            padding: "10px 8px",
                            textAlign: "left",
                            color: "#666"
                          }}
                        >
                          สกุลเงิน
                        </th>
                        <th style={{ padding: "10px 0", width: "10%" }}></th>
                        <th
                          style={{
                            padding: "10px 8px",
                            textAlign: "right",
                            color: "#666"
                          }}
                        >
                          Rate ราคา (THB)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {exchangeData?.rates?.map((item, index) => {
                        let displayRate = item.rate;
                        if (item.code === "JPY" || item.code === "KRW") {
                          displayRate = (item.rate / 100).toFixed(6);
                        } else if (item.code === "VND") {
                          displayRate = (item.rate / 1000).toFixed(6);
                        } else {
                          displayRate = Number(item.rate).toFixed(4);
                        }

                        return (
                          <tr
                            key={index}
                            style={{
                              borderBottom: "1px solid #f5f5f5",
                              backgroundColor:
                                index % 2 === 0 ? "#fafafa" : "#fff"
                            }}
                          >
                            <td
                              style={{
                                padding: "12px 8px",
                                fontWeight: "500",
                                color: "#333",
                                width: "40%"
                              }}
                            >
                              1 {item.code}{" "}
                              <span style={{ color: "#666", fontSize: "13px" }}>
                                ({item.name.replace(` (${item.code})`, "")})
                              </span>
                            </td>
                            <td
                              style={{
                                padding: "12px 0",
                                textAlign: "center",
                                color: "#999",
                                fontWeight: "500"
                              }}
                            >
                              =
                            </td>
                            <td
                              style={{
                                padding: "12px 8px",
                                textAlign: "right",
                                color: "#2e7d32",
                                fontWeight: "bold"
                              }}
                            >
                              {displayRate} THB
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  <hr
                    style={{
                      margin: "20px 0",
                      border: "0",
                      borderTop: "1px dashed #e0e0e0"
                    }}
                  />

                  <div style={{ padding: "5px 0" }}>
                    <h4
                      style={{
                        margin: "0 0 12px 0",
                        color: "#333",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px"
                      }}
                    >
                      🧮 เครื่องคำนวณเงิน
                    </h4>

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        gap: "10px",
                        marginBottom: "12px"
                      }}
                    >
                      <input
                        type="number"
                        value={foreignAmount}
                        onChange={(e) => setForeignAmount(e.target.value)}
                        placeholder="ใส่จำนวนเงิน เช่น 25000"
                        min="0"
                        style={{
                          flex: "2",
                          padding: "10px",
                          borderRadius: "6px",
                          border: "1px solid #ccc",
                          fontSize: "14px"
                        }}
                      />

                      <select
                        value={converterCurrency}
                        onChange={(e) => setConverterCurrency(e.target.value)}
                        style={{
                          flex: "1",
                          padding: "10px",
                          borderRadius: "6px",
                          border: "1px solid #ccc",
                          background: "#fff",
                          fontSize: "14px",
                          cursor: "pointer"
                        }}
                      >
                        {exchangeData?.rates?.map((item) => (
                          <option key={item.code} value={item.code}>
                            {item.code}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div
                      style={{
                        background: "#f1f8e9",
                        padding: "15px",
                        borderRadius: "8px",
                        border: "1px solid #dcedc8",
                        textAlign: "center"
                      }}
                    >
                      <span
                        style={{
                          fontSize: "13px",
                          color: "#558b2f",
                          display: "block",
                          marginBottom: "4px",
                          fontWeight: "500"
                        }}
                      >
                        คิดเป็นเงินไทยประมาณ
                      </span>
                      <strong style={{ fontSize: "22px", color: "#2e7d32" }}>
                        {calculateToTHB()}{" "}
                        <span
                          style={{
                            fontSize: "16px",
                            fontWeight: "bold",
                            color: "#2e7d32",
                            marginLeft: "4px"
                          }}
                        >
                          THB
                        </span>
                      </strong>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* === พื้นที่แสดงผลลัพธ์ === */}
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
                    ... 🛫 <b>ประเภทตั๋ว:</b>{" "}
                    {tripResult.recommendedFlight.flightType}
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
                  <p
                    style={{ margin: "5px 0", fontSize: "14px", color: "#555" }}
                  >
                    💡 <b>คำแนะนำ:</b> {tripResult.recommendedFlight.flightTips}
                  </p>

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
                          boxShadow: "0 2px 5px rgba(0,0,0,0.1)"
                        }}
                      >
                        ✈️ เช็กและจองตั๋วเครื่องบินจริงบน Trip.com 🌐
                      </a>
                    </div>
                  )}
                </div>
              )}

              <div style={{ marginTop: "25px", marginBottom: "25px" }}>
                <button
                  onClick={() => setActivePage("budget")}
                  style={{
                    width: "100%",
                    padding: "15px",
                    backgroundColor: "#2e7d32",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "16px",
                    fontWeight: "bold",
                    boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
                  }}
                >
                  📊 ดูสรุปงบประมาณและ Breakdown ค่าใช้จ่ายในทริป (THB) 💸
                </button>
              </div>

              <hr
                style={{
                  margin: "25px 0",
                  border: "0",
                  borderTop: "1px solid #ddd"
                }}
              />

              <div
                ref={itineraryContainerRef}
                style={{
                  background: "#ffffff",
                  padding: "15px",
                  borderRadius: "8px"
                }}
              >
                {tripResult.itinerary?.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      marginBottom: "20px",
                      padding: "15px",
                      background: "white",
                      borderRadius: "6px",
                      boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
                      pageBreakInside: "avoid",
                      breakInside: "avoid"
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
                              href={`http://googleusercontent.com/maps.google.com/?q=${act.latitude},${act.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                color: "#2196f3",
                                fontWeight: "bold",
                                marginLeft: "4px"
                              }}
                            >
                              {act.latitude}, {act.longitude} (คลิกเปิดแผนที่
                              🗺️)
                            </a>
                          </small>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div
                style={{
                  marginTop: "30px",
                  textAlign: "center",
                  borderTop: "2px dashed #e0e0e0",
                  paddingTop: "20px"
                }}
              >
                <button
                  onClick={handleExportItineraryPDF}
                  disabled={isExportingPDF}
                  style={{
                    width: "100%",
                    padding: "15px",
                    backgroundColor: isExportingPDF ? "#bdc3c7" : "#0284c7",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: isExportingPDF ? "not-allowed" : "pointer",
                    fontSize: "16px",
                    fontWeight: "bold",
                    boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
                  }}
                >
                  {isExportingPDF
                    ? "⏳ กำลังแปลงตารางเดินทาง..."
                    : "📄 ดาวน์โหลดแผนการเดินทางรายวันทั้งหมด (PDF)"}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default App;
