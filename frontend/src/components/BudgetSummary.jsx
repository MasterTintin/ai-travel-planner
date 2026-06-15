import React, { useRef, useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

function BudgetSummary({ tripResult = {}, exchangeData, onBack }) {
  // สร้าง Ref ไปครอบส่วน Content ที่เราต้องการจะ Render ลง PDF
  const printRef = useRef(null);
  const [isExporting, setIsExporting] = useState(false);

  // === ฟังก์ชันสกัดตัวเลขจาก String ===
  const extractNumber = (text) => {
    if (!text) return 0;

    const cleaned = text.toString().replace(/,/g, "");

    const numbers = cleaned.match(/\d+(\.\d+)?/g);

    if (!numbers) return 0;

    if (numbers.length === 1) {
      return parseFloat(numbers[0]);
    }

    return numbers.reduce((sum, n) => sum + parseFloat(n), 0);
  };

  // === ค้นหา สกุลเงิน และ Exchange Rate ===
  const getCurrencyInfo = (destination) => {
    if (!destination || !exchangeData || !exchangeData.rates) {
      return { code: "THB", rate: 1 };
    }
    const dest = destination.toLowerCase();
    let match = exchangeData.rates.find((r) => {
      if (dest.includes("japan") && r.code === "JPY") return true;
      if (dest.includes("korea") && r.code === "KRW") return true;
      return false;
    });

    if (match) {
      let rawRate = parseFloat(match.rate);
      if ((match.code === "JPY" || match.code === "KRW") && rawRate > 1) {
        rawRate = rawRate / 100;
      }
      return { code: match.code, rate: rawRate };
    }
    return { code: "THB", rate: 1 };
  };

  const calculateTHB = (foreignCost, currencyCode, rate) => {
    if (currencyCode === "THB" || !currencyCode) return foreignCost;
    return Math.round(foreignCost * rate);
  };

  // === ฟังก์ชันสำหรับการเปลี่ยน DOM เป็น PDF ===
  const handleExportPDF = async () => {
    const element = printRef.current;
    if (!element) return;

    try {
      setIsExporting(true); // เปิดสถานะกำลังประมวลผล

      // ตั้งค่าเพิ่มความเร็วในการ Render ภาพ และป้องกันการ Timeout ค้าง
      const canvas = await html2canvas(element, {
        scale: 1.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false
      });

      // ดึงภาพออกแบบสไตล์ JPEG ความคมชัด 90%
      const imgData = canvas.toDataURL("image/jpeg", 0.9);

      // สร้างเอกสาร PDF ขนาด A4 แนวตั้ง
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // ลูปสไลด์ตัดหน้ากรณีทริปยาวจนตารางล้นไปหน้า 2, 3
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // ปรับปรุงชื่อไฟล์
      const cleanDest = destinationName.replace(/[^a-zA-Z0-9]/g, "_");
      const fileName = `Trip_Plan_${cleanDest}.pdf`;

      pdf.save(fileName);
    } catch (error) {
      console.error("❌ PDF Export Error:", error);
      alert("ไม่สามารถสร้างไฟล์ PDF ได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsExporting(false);
    }
  };

  // ประมวลผลคำนวณงบประมาณ
  const destinationName = tripResult?.destination || "ไม่ระบุปลายทาง";
  const { code: currencyCode, rate } = getCurrencyInfo(destinationName);
  const isTHB =
    destinationName.toLowerCase().includes("thailand") ||
    currencyCode === "THB";

  const flightCostRaw = extractNumber(
    tripResult?.recommendedFlight?.estimatedFlightCost
  );
  const flightCostTHB = tripResult?.budgetSummary?.flightCost || flightCostRaw;

  let totalActivitiesCostForeign = 0;
  let totalActivitiesCostTHB = 0;

  const dailyBreakdown =
    tripResult?.itinerary?.map((dayData) => {
      let dayTotalForeign = 0;
      dayData.activities?.forEach((act) => {
        dayTotalForeign += extractNumber(act.estimatedCost);
      });
      totalActivitiesCostForeign += dayTotalForeign;
      const dayTotalTHB = isTHB
        ? dayTotalForeign
        : calculateTHB(dayTotalForeign, currencyCode, rate);
      totalActivitiesCostTHB += dayTotalTHB;

      return {
        day: dayData.day,
        theme: dayData.theme || "ไม่มีไฮไลท์ประจำวัน",
        costForeign: dayTotalForeign,
        costTHB: dayTotalTHB
      };
    }) || [];

  const grandTotalTHB =
    tripResult?.budgetSummary?.grandTotal ||
    flightCostTHB + totalActivitiesCostTHB;

  console.log("========== DEBUG ==========");
  console.log(JSON.stringify(tripResult, null, 2));

  console.log(
    "estimatedFlightCost =",
    tripResult?.recommendedFlight?.estimatedFlightCost
  );

  console.log("budgetSummary =", tripResult?.budgetSummary);

  console.log("flightCostTHB =", flightCostTHB);

  console.log("totalActivitiesCostTHB =", totalActivitiesCostTHB);

  console.log("grandTotalTHB =", grandTotalTHB);

  console.log("===========================");

  return (
    <div
      style={{
        maxWidth: "1000px",
        margin: "0 auto",
        padding: "20px",
        fontFamily: "sans-serif"
      }}
    >
      {/* ส่วน Action Bar บนสุด */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px"
        }}
      >
        {/* ปุ่มดาวน์โหลด PDF เวอร์ชันอัปเกรดความเร็ว */}
        <button
          onClick={handleExportPDF}
          disabled={isExporting}
          style={{
            background: isExporting ? "#bdc3c7" : "#1890ff",
            color: "white",
            border: "none",
            padding: "8px 20px",
            borderRadius: "4px",
            cursor: isExporting ? "not-allowed" : "pointer",
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            boxShadow: "0 2px 5px rgba(0,0,0,0.1)"
          }}
        >
          {isExporting ? "กำลังสร้าง..." : "📄 ดาวน์โหลดแผนการเดินทาง (PDF)"}
        </button>
      </div>

      {/* 4. แปะ ref ครอบ Content ทั้งหมด เพื่อสั่งพิมพ์ลง PDF */}
      <div
        ref={printRef}
        style={{ padding: "15px", background: "white", borderRadius: "8px" }}
      >
        {/* ส่วนหัวแสดงชื่อประเทศ */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "30px",
            borderBottom: "2px solid #bdc3c7",
            paddingBottom: "15px"
          }}
        >
          <h1 style={{ margin: 0, fontSize: "24px", color: "#2f4f4f" }}>
            📊 สรุปงบประมาณทริปทั้งหมด
          </h1>
          <span
            style={{
              background: "#e2e8f0",
              padding: "6px 12px",
              borderRadius: "20px",
              fontSize: "14px",
              fontWeight: "bold",
              color: "#4a5568"
            }}
          >
            📍 {destinationName} ({tripResult?.totalDays || 0} วัน)
          </span>
        </div>

        {/* Banner ยอดรวม */}
        <div
          style={{
            background: "linear-gradient(135deg, #485563, #29323c)",
            color: "white",
            padding: "30px",
            borderRadius: "12px",
            marginBottom: "30px",
            textAlign: "center"
          }}
        >
          <p
            style={{
              margin: "0 0 10px 0",
              fontSize: "16px",
              textTransform: "uppercase",
              letterSpacing: "1px",
              color: "#cbd5e1"
            }}
          >
            ประมาณการค่าใช้จ่ายทั้งหมด (Grand Total)
          </p>
          <h2
            style={{
              margin: 0,
              fontSize: "42px",
              fontWeight: "bold",
              color: "#52c41a"
            }}
          >
            ฿{grandTotalTHB.toLocaleString()}
          </h2>
        </div>

        {/* การ์ดแยกประเภท */}
        <div
          style={{
            display: "flex",
            gap: "20px",
            flexWrap: "wrap",
            marginBottom: "30px"
          }}
        >
          <div
            style={{
              flex: 1,
              minWidth: "280px",
              background: "#f4f6f6",
              padding: "20px",
              borderRadius: "8px",
              borderLeft: "5px solid #7f8c8d"
            }}
          >
            <h3 style={{ margin: "0 0 10px 0", color: "#34495e" }}>
              ✈️ ค่าตั๋วเครื่องบินรวม
            </h3>
            <p style={{ fontSize: "24px", fontWeight: "bold", margin: 0 }}>
              ฿{flightCostTHB.toLocaleString()}
            </p>
          </div>
          <div
            style={{
              flex: 1,
              minWidth: "280px",
              background: "#f4f6f6",
              padding: "20px",
              borderRadius: "8px",
              borderLeft: "5px solid #52c41a"
            }}
          >
            <h3 style={{ margin: "0 0 10px 0", color: "#34495e" }}>
              🎟️ ค่ากิจกรรมและการเดินทาง
            </h3>
            <p style={{ fontSize: "24px", fontWeight: "bold", margin: 0 }}>
              ฿
              {(
                (tripResult?.budgetSummary?.activityCost || 0) +
                  (tripResult?.budgetSummary?.transportCost || 0) ||
                totalActivitiesCostTHB
              ).toLocaleString()}
            </p>
          </div>
        </div>

        {/* ตาราง Breakdown รายวัน */}
        <div
          style={{
            background: "white",
            padding: "20px",
            borderRadius: "8px",
            border: "1px solid #e2e8f0"
          }}
        >
          <h3 style={{ margin: "0 0 15px 0", color: "#2f4f4f" }}>
            📅 รายละเอียดค่าใช้จ่ายแยกตามรายวัน
          </h3>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              textAlign: "left"
            }}
          >
            <thead>
              <tr
                style={{
                  background: "#ebedef",
                  borderBottom: "2px solid #cbd5e1"
                }}
              >
                <th style={{ padding: "12px" }}>วันเดินทาง</th>
                <th style={{ padding: "12px" }}>แผนการเที่ยวประจำวัน</th>
                {!isTHB && (
                  <th style={{ padding: "12px", textAlign: "right" }}>
                    ต่างประเทศ ({currencyCode})
                  </th>
                )}
                <th style={{ padding: "12px", textAlign: "right" }}>
                  เงินบาท (THB)
                </th>
              </tr>
            </thead>
            <tbody>
              {dailyBreakdown.map((day, idx) => (
                <tr
                  key={idx}
                  style={{
                    borderBottom: "1px solid #e2e8f0",
                    backgroundColor: idx % 2 === 0 ? "#fafbfc" : "#ffffff"
                  }}
                >
                  <td style={{ padding: "12px", fontWeight: "bold" }}>
                    วันที่ {day.day}
                  </td>
                  <td style={{ padding: "12px", color: "#64748b" }}>
                    🗺️ {day.theme}
                  </td>
                  {!isTHB && (
                    <td style={{ padding: "12px", textAlign: "right" }}>
                      {day.costForeign.toLocaleString()}
                    </td>
                  )}
                  <td
                    style={{
                      padding: "12px",
                      textAlign: "right",
                      fontWeight: "bold",
                      color: "#2e7d32"
                    }}
                  >
                    ฿{day.costTHB.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* ✅ ปุ่มจองเครื่องบิน Trip.com — ใต้ตารางรายวัน */}
        {(() => {
          const dest = (tripResult?.destination || "")
            .toLowerCase()
            .replace(/\s+/g, "-");
          const iataMap = {
            japan: "nrt",
            ญี่ปุ่น: "nrt",
            taiwan: "tpe",
            ไต้หวัน: "tpe",
            "south korea": "icn",
            korea: "icn",
            เกาหลีใต้: "icn",
            singapore: "sin",
            สิงคโปร์: "sin",
            "hong kong": "hkg",
            ฮ่องกง: "hkg",
            china: "pek",
            จีน: "pek",
            vietnam: "sgn",
            เวียดนาม: "sgn",
            "united kingdom": "lhr",
            อังกฤษ: "lhr",
            "united states": "jfk",
            อเมริกา: "jfk",
            france: "cdg",
            ฝรั่งเศส: "cdg",
            germany: "fra",
            เยอรมนี: "fra",
            australia: "syd",
            ออสเตรเลีย: "syd",
            italy: "fco",
            อิตาลี: "fco",
            switzerland: "zrh",
            สวิตเซอร์แลนด์: "zrh"
          };

          // หา IATA code
          const destKey = (tripResult?.destination || "").toLowerCase().trim();
          const iata = iataMap[destKey] || "nrt";

          // แปลงวันที่จาก tripResult.departureDate → YYYYMMDD สำหรับ Trip.com
          let dateParam = "";
          const rawDate = tripResult?.departureDate || "";
          if (rawDate) {
            dateParam = rawDate.replace(/-/g, "");
          }

          const bookingUrl =
            tripResult?.recommendedFlight?.bookingUrl ||
            `https://th.trip.com/flights/bangkok-to-${dest}/tickets-bkk-${iata}/${dateParam ? `?depdate=${dateParam}&` : "?"}allianceid=3853112&sid=22421360`;

          return (
            <div style={{ marginTop: "24px", textAlign: "center" }}>
              <a
                href={bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "14px 32px",
                  backgroundColor: "#1677ff",
                  color: "white",
                  borderRadius: "8px",
                  textDecoration: "none",
                  fontWeight: "bold",
                  fontSize: "16px",
                  boxShadow: "0 4px 12px rgba(22,119,255,0.35)",
                  transition: "background 0.2s"
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#0958d9")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "#1677ff")
                }
              >
                🛫 ค้นหาและจองเที่ยวบินไป {tripResult?.destination} — Trip.com
                {rawDate && (
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: "normal",
                      opacity: 0.85
                    }}
                  >
                    (
                    {new Date(rawDate).toLocaleDateString("th-TH", {
                      day: "numeric",
                      month: "long",
                      year: "numeric"
                    })}
                    )
                  </span>
                )}
              </a>
              <p
                style={{
                  margin: "8px 0 0 0",
                  fontSize: "12px",
                  color: "#94a3b8"
                }}
              >
                เปรียบเทียบราคาทุกสายการบิน และจองได้ในคลิกเดียวบน Trip.com
              </p>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

export default BudgetSummary;
