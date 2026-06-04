import React from "react";

function BudgetSummary({ tripResult, exchangeData, onBack }) {
  // === 1. ฟังก์ชันสกัดตัวเลขจาก String ===
  const extractNumber = (text) => {
    if (!text) return 0;
    // ดึงเฉพาะตัวเลขและเครื่องหมายจุลภาคมารวมกัน เช่น "15,000" -> "15000"
    const cleaned = text.replace(/,/g, "").match(/\d+/);
    return cleaned ? parseInt(cleaned[0], 10) : 0;
  };

  // === 2. ค้นหา Exchange Rateที่สอดคล้องกับปลายทาง ===
  const getCurrencyRate = (destination) => {
    if (!exchangeData || !exchangeData.rates) return 1;

    const dest = destination.toLowerCase();
    // ค้นหาโค้ดสกุลเงินให้ตรงกับประเทศปลายทาง
    let match = exchangeData.rates.find((r) => {
      if (dest.includes("japan") && r.code === "JPY") return true;
      if (dest.includes("korea") && r.code === "KRW") return true;
      if (dest.includes("singapore") && r.code === "SGD") return true;
      if (dest.includes("taiwan") && r.code === "TWD") return true;
      if (dest.includes("hong kong") && r.code === "HKD") return true;
      if (dest.includes("china") && r.code === "CNY") return true;
      if (dest.includes("vietnam") && r.code === "VND") return true;
      if (
        (dest.includes("uk") || dest.includes("united kingdom")) &&
        r.code === "GBP"
      )
        return true;
      if (
        (dest.includes("us") || dest.includes("united states")) &&
        r.code === "USD"
      )
        return true;
      if (dest.includes("australia") && r.code === "AUD") return true;
      if (
        (dest.includes("france") ||
          dest.includes("germany") ||
          dest.includes("italy") ||
          dest.includes("switzerland")) &&
        r.code === "EUR"
      )
        return true;
      return false;
    });

    return match ? match.rate : 1;
  };

  // === 3. คำนวณงบประมาณ ===
  const rate = getCurrencyRate(tripResult.destination);
  const isTHB = tripResult.destination.toLowerCase().includes("thailand");

  // 3.1 คำนวณค่าตั๋วเครื่องบิน
  const flightCostRaw = extractNumber(
    tripResult.recommendedFlight?.estimatedFlightCost
  );
  const flightCostTHB = flightCostRaw;

  // 3.2 คำนวณค่ากิจกรรมรายวัน
  let totalActivitiesCostForeign = 0;
  const dailyBreakdown =
    tripResult.itinerary?.map((dayData) => {
      let dayTotalForeign = 0;

      dayData.activities?.forEach((act) => {
        dayTotalForeign += extractNumber(act.estimatedCost);
      });

      totalActivitiesCostForeign += dayTotalForeign;

      return {
        day: dayData.day,
        theme: dayData.theme,
        costForeign: dayTotalForeign,
        costTHB: isTHB ? dayTotalForeign : Math.round(dayTotalForeign * rate)
      };
    }) || [];

  const totalActivitiesCostTHB = isTHB
    ? totalActivitiesCostForeign
    : Math.round(totalActivitiesCostForeign * rate);
  const grandTotalTHB = flightCostTHB + totalActivitiesCostTHB;

  return (
    <div
      style={{
        maxWidth: "1000px",
        margin: "0 auto",
        padding: "20px",
        fontFamily: "sans-serif",
        color: "#2c3e50"
      }}
    >
      {/* ส่วนหัวหน้าจอ */}
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
        <div>
          <button
            onClick={onBack}
            style={{
              background: "#7f8c8d",
              color: "white",
              border: "none",
              padding: "8px 16px",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "bold",
              marginRight: "15px"
            }}
          >
            ⬅️ กลับหน้าหลัก
          </button>
          <h1
            style={{
              display: "inline-block",
              margin: 0,
              fontSize: "24px",
              color: "#2f4f4f"
            }}
          >
            📊 สรุปงบประมาณทริปอย่างละเอียด
          </h1>
        </div>
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
          📍 {tripResult.destination} ({tripResult.totalDays} วัน)
        </span>
      </div>

      <div
        style={{
          background: "linear-gradient(135deg, #485563, #29323c)",
          color: "white",
          padding: "30px",
          borderRadius: "12px",
          boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
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
        {!isTHB && (
          <p
            style={{ margin: "10px 0 0 0", fontSize: "13px", color: "#94a3b8" }}
          >
            *คำนวณอ้างอิงจากอัตราแลกเปลี่ยนรายวันคงที่ ณ ปัจจุบัน
          </p>
        )}
      </div>

      {/* การ์ดแยกประเภท (ตั๋วเครื่องบิน vs กิจกรรม) */}
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
          <p
            style={{
              fontSize: "24px",
              fontWeight: "bold",
              margin: 0,
              color: "#2c3e50"
            }}
          >
            ฿{flightCostTHB.toLocaleString()}{" "}
            <span style={{ fontSize: "14px", color: "#7f8c8d" }}>THB</span>
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
            🎟️ ค่ากิจกรรมและการเดินทางในประเทศ
          </h3>
          <p
            style={{
              fontSize: "24px",
              fontWeight: "bold",
              margin: 0,
              color: "#2c3e50"
            }}
          >
            ฿{totalActivitiesCostTHB.toLocaleString()}{" "}
            <span style={{ fontSize: "14px", color: "#7f8c8d" }}>THB</span>
          </p>
          {!isTHB && (
            <small style={{ color: "#7f8c8d" }}>
              (ประมาณยอดเดิม: {totalActivitiesCostForeign.toLocaleString()}{" "}
              ยูนิตต่างประเทศ)
            </small>
          )}
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
              <th style={{ padding: "12px", color: "#475569" }}>วันเดินทาง</th>
              <th style={{ padding: "12px", color: "#475569" }}>
                ไฮไลท์ประจำวัน
              </th>
              {!isTHB && (
                <th
                  style={{
                    padding: "12px",
                    color: "#475569",
                    textAlign: "right"
                  }}
                >
                  ค่าใช้จ่ายต่างประเทศ
                </th>
              )}
              <th
                style={{
                  padding: "12px",
                  color: "#475569",
                  textAlign: "right"
                }}
              >
                แปลงเป็นเงินบาท (THB)
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
                  วันทีี่ {day.day}
                </td>
                <td style={{ padding: "12px", color: "#64748b" }}>
                  {day.theme}
                </td>
                {!isTHB && (
                  <td
                    style={{
                      padding: "12px",
                      textAlign: "right",
                      color: "#475569"
                    }}
                  >
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
  );
}

export default BudgetSummary;
