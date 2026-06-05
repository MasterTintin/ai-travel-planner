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
    const cleanedText = text.toString().replace(/,/g, "");
    const match = cleanedText.match(/\d+(\.\d+)?/);
    return match ? parseFloat(match[0]) : 0;
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
  const flightCostTHB = flightCostRaw;

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

  const grandTotalTHB = flightCostTHB + totalActivitiesCostTHB;

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
        <button
          onClick={onBack}
          style={{
            background: "#7f8c8d",
            color: "white",
            border: "none",
            padding: "8px 16px",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "bold"
          }}
        >
          ⬅️ กลับหน้าหลัก
        </button>

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
            📊 สรุปงบประมาณทริปอย่างละเอียด
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
            ฿{grandTotalTHB.toLocaleString()}{" "}
            <span style={{ fontSize: "20px", color: "#fff" }}>THB</span>
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
              ฿{flightCostTHB.toLocaleString()} THB
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
              ฿{totalActivitiesCostTHB.toLocaleString()} THB
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
                <th style={{ padding: "12px" }}>ไฮไลท์ประจำวัน</th>
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
                    {day.theme}
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
      </div>
    </div>
  );
}

export default BudgetSummary;
