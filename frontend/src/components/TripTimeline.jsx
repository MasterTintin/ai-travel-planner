import React from "react";

// 🏷️ แปลงคะแนน priority เป็นป้ายสี (ข้อความ + สี)
function getPriorityLabel(score) {
  if (score >= 9)
    return {
      text: "🔥 Must Visit",
      color: "#dc2626"
    };

  if (score >= 7)
    return {
      text: "⭐ Recommended",
      color: "#f59e0b"
    };

  return {
    text: "📌 Optional",
    color: "#64748b"
  };
}

// 💰 เลือกสีตามระดับค่าใช้จ่าย (ถูก = เขียว, กลาง = ส้ม, แพง = แดง)
function getCostColor(cost) {
  if (cost <= 1000) return "#16a34a";

  if (cost <= 3000) return "#f59e0b";

  return "#dc2626";
}

function TripTimeline({ itinerary = [] }) {
  if (!itinerary.length) return null;

  return (
    <div
      style={{
        background: "#fff",
        padding: "24px",
        borderRadius: "12px",
        marginTop: "20px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
      }}
    >
      <h2>🕒 Trip Timeline</h2>

      {itinerary.map((day) => (
        <div
          key={day.day}
          style={{
            marginBottom: "30px"
          }}
        >
          <h3
            style={{
              borderLeft: "5px solid #1677ff",
              paddingLeft: "12px"
            }}
          >
            วันที่ {day.day} — {day.theme}
          </h3>

          {/* 📊 Day Summary — สรุปภาพรวมของวัน */}
          <div
            style={{
              display: "flex",
              gap: "12px",
              marginBottom: "15px",
              flexWrap: "wrap"
            }}
          >
            <div
              style={{
                background: "#f1f5f9",
                padding: "8px 12px",
                borderRadius: "8px"
              }}
            >
              💸 {day.estimatedDayCost || 0} JPY
            </div>

            <div
              style={{
                background: "#f1f5f9",
                padding: "8px 12px",
                borderRadius: "8px"
              }}
            >
              🚆 {day.estimatedTravelMinutes || 0} นาที
            </div>

            <div
              style={{
                background: "#f1f5f9",
                padding: "8px 12px",
                borderRadius: "8px"
              }}
            >
              📍 {day.totalActivities || 0} สถานที่
            </div>
          </div>

          {(day.activities || []).map((activity, index) => (
            <div key={index}>
              <div
                style={{
                  background: "#f8fafc",
                  padding: "16px",
                  marginBottom: "12px",
                  borderRadius: "10px"
                }}
              >
                <div
                  style={{
                    color: "#1677ff",
                    fontWeight: "bold"
                  }}
                >
                  ⏰ {activity.startTime || "-"} - {activity.endTime || "-"}
                </div>

                <div
                  style={{
                    fontSize: "18px",
                    fontWeight: "700",
                    marginTop: "5px"
                  }}
                >
                  📍 {activity.locationName}
                </div>

                {/* 🗺️ ปุ่มเปิด Google Maps (โชว์เมื่อมีพิกัด lat/lng) */}
                {activity.latitude && activity.longitude && (
                  <a
                    href={`https://www.google.com/maps?q=${activity.latitude},${activity.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: "inline-block",
                      marginTop: "8px",
                      color: "#1677ff",
                      textDecoration: "none",
                      fontSize: "14px"
                    }}
                  >
                    🗺️ Open in Google Maps
                  </a>
                )}

                <div
                  style={{
                    marginTop: "8px",
                    color: "#475569"
                  }}
                >
                  {activity.description}
                </div>

                {/* 💰 ค่าใช้จ่าย — สีเปลี่ยนตามระดับราคา (อิงจาก estimatedCost) */}
                <div
                  style={{
                    marginTop: "10px",
                    color: getCostColor(activity.estimatedCost || 0),
                    fontWeight: "bold"
                  }}
                >
                  💰 {activity.displayCost}
                </div>

                <div>⌛ {activity.durationMinutes || 0} นาที</div>

                {/* ⭐ Priority — ป้ายสีตามระดับความสำคัญ */}
                {activity.priorityScore && (
                  <div
                    style={{
                      marginTop: "10px"
                    }}
                  >
                    <span
                      style={{
                        background: getPriorityLabel(activity.priorityScore)
                          .color,
                        color: "white",
                        padding: "4px 10px",
                        borderRadius: "999px",
                        fontSize: "12px",
                        fontWeight: "bold"
                      }}
                    >
                      {getPriorityLabel(activity.priorityScore).text}
                    </span>
                  </div>
                )}

                {activity.highlight?.length > 0 && (
                  <div
                    style={{
                      marginTop: "10px"
                    }}
                  >
                    {activity.highlight.map((item, i) => (
                      <span
                        key={i}
                        style={{
                          display: "inline-block",
                          marginRight: "8px",
                          padding: "4px 8px",
                          background: "#e2e8f0",
                          borderRadius: "999px",
                          fontSize: "12px"
                        }}
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                )}

                {activity.rainyAlternative && (
                  <div
                    style={{
                      marginTop: "10px",
                      background: "#ecfeff",
                      padding: "10px",
                      borderRadius: "6px"
                    }}
                  >
                    ☔ Rainy Alternative: {activity.rainyAlternative}
                  </div>
                )}
              </div>

              {activity.transportType && (
                <div
                  style={{
                    marginLeft: "20px",
                    marginBottom: "15px",
                    color: "#64748b"
                  }}
                >
                  ↓ {activity.transportType}
                  {activity.travelMinutes
                    ? ` (${activity.travelMinutes} นาที)`
                    : ""}
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default TripTimeline;
