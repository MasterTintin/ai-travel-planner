import React from "react";

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

// 🏅 แปลง route score เป็นสถานะ (ข้อความ + สี)
function getRouteStatus(score) {
  if (score >= 90)
    return {
      text: "Excellent",
      color: "#16a34a"
    };

  if (score >= 75)
    return {
      text: "Good",
      color: "#f59e0b"
    };

  return {
    text: "Needs Optimization",
    color: "#dc2626"
  };
}

function RouteSummary({ itinerary = [] }) {
  if (!itinerary.length) return null;

  let totalDistance = 0;
  let totalLocations = 0;
  let totalTransportCost = 0;

  const daySummaries = [];

  itinerary.forEach((day) => {
    const activities = day.activities || [];

    totalLocations += activities.length;

    // 💸 รวมค่าเดินทางของทุก activity ในวันนี้
    activities.forEach((activity) => {
      totalTransportCost += activity.transportCost || 0;
    });

    let dayDistance = 0;

    for (let i = 0; i < activities.length - 1; i++) {
      const current = activities[i];
      const next = activities[i + 1];

      if (
        current.latitude &&
        current.longitude &&
        next.latitude &&
        next.longitude
      ) {
        const distance = calculateDistance(
          current.latitude,
          current.longitude,
          next.latitude,
          next.longitude
        );

        dayDistance += distance;
        totalDistance += distance;
      }
    }

    daySummaries.push({
      day: day.day,
      theme: day.theme,
      distance: dayDistance
    });
  });

  const estimatedTravelTime = Math.round((totalDistance / 30) * 60);

  // 📊 ระยะทางเฉลี่ยต่อวัน
  const avgDistance = totalDistance / Math.max(daySummaries.length, 1);

  let routeScore = 100;

  if (totalDistance > 150) routeScore -= 20;
  if (totalDistance > 300) routeScore -= 20;
  if (totalLocations > 40) routeScore -= 10;

  routeScore = Math.max(routeScore, 50);

  // ⚠️ วันที่เดินทางไกลที่สุด
  const worstDay =
    daySummaries.length > 0
      ? [...daySummaries].sort((a, b) => b.distance - a.distance)[0]
      : null;

  // 🏆 จัดอันดับวัน (ระยะทางน้อย = ดีสุด)
  const rankedDays = [...daySummaries].sort((a, b) => a.distance - b.distance);

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
      <h2>🚆 Route Optimization Summary</h2>

      <div
        style={{
          display: "flex",
          gap: "16px",
          flexWrap: "wrap",
          marginTop: "20px"
        }}
      >
        <SummaryCard title="📍 จำนวนสถานที่" value={totalLocations} />

        <SummaryCard
          title="🛣️ ระยะทางรวม"
          value={`${totalDistance.toFixed(1)} km`}
        />

        <SummaryCard
          title="📊 ระยะทางเฉลี่ย"
          value={`${avgDistance.toFixed(1)} km/day`}
        />

        <SummaryCard
          title="⏱️ เวลาเดินทางรวม"
          value={`${estimatedTravelTime} นาที`}
        />

        <SummaryCard
          title="💸 ค่าเดินทางรวม"
          value={`${totalTransportCost.toLocaleString()} JPY`}
        />

        {/* ⭐ Route Score — มี badge สถานะ + progress bar */}
        <div
          style={{
            flex: 1,
            minWidth: "220px",
            background: "#f8fafc",
            padding: "15px",
            borderRadius: "8px"
          }}
        >
          <div>⭐ Route Score</div>

          <div
            style={{
              fontSize: "24px",
              fontWeight: "bold"
            }}
          >
            {routeScore}/100
          </div>

          {/* 🏅 Efficiency Badge */}
          <div
            style={{
              marginTop: "6px",
              fontWeight: "bold",
              color: getRouteStatus(routeScore).color
            }}
          >
            {routeScore >= 90 ? "🟢" : routeScore >= 75 ? "🟡" : "🔴"}{" "}
            {getRouteStatus(routeScore).text}
          </div>

          {/* 📶 Route Quality Progress Bar */}
          <div
            style={{
              width: "100%",
              height: "12px",
              background: "#e5e7eb",
              borderRadius: "999px",
              overflow: "hidden",
              marginTop: "8px"
            }}
          >
            <div
              style={{
                width: `${routeScore}%`,
                height: "100%",
                background:
                  routeScore >= 90
                    ? "#22c55e"
                    : routeScore >= 75
                      ? "#f59e0b"
                      : "#ef4444"
              }}
            />
          </div>
        </div>
      </div>

      {/* ⚠️ Worst Day Detection */}
      {worstDay && (
        <div
          style={{
            marginTop: "20px",
            background: "#fef2f2",
            border: "1px solid #fecaca",
            padding: "14px",
            borderRadius: "8px",
            color: "#b91c1c",
            fontWeight: "bold"
          }}
        >
          ⚠️ วันที่เดินทางหนักที่สุด: Day {worstDay.day} (
          {worstDay.distance.toFixed(1)} km)
        </div>
      )}

      <div
        style={{
          marginTop: "25px"
        }}
      >
        <h3>📅 Daily Route Analysis</h3>

        {/* 🏆 จัดอันดับวัน — ระยะทางน้อยสุดได้เหรียญทอง */}
        {rankedDays.map((day, index) => {
          const medal =
            index === 0
              ? "🥇"
              : index === 1
                ? "🥈"
                : index === 2
                  ? "🥉"
                  : `${index + 1}.`;

          return (
            <div
              key={day.day}
              style={{
                background: "#f8fafc",
                padding: "12px",
                marginBottom: "10px",
                borderRadius: "8px"
              }}
            >
              <strong>
                {medal} Day {day.day} — {day.distance.toFixed(1)} km
              </strong>

              <div
                style={{
                  color: "#64748b",
                  fontSize: "13px",
                  marginTop: "2px"
                }}
              >
                {day.theme}
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          marginTop: "20px",
          background: "#eff6ff",
          padding: "15px",
          borderRadius: "8px"
        }}
      >
        <strong>🤖 AI Recommendation</strong>

        <p>
          {routeScore >= 90
            ? "แผนการเดินทางมีประสิทธิภาพสูง สถานที่ส่วนใหญ่อยู่ใกล้กัน"
            : routeScore >= 75
              ? "สามารถลดระยะทางบางช่วงได้โดยจัดลำดับสถานที่ใหม่"
              : "ควรปรับลำดับการเที่ยวเพื่อลดเวลาเดินทาง"}
        </p>
      </div>
    </div>
  );
}

function SummaryCard({ title, value }) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: "220px",
        background: "#f8fafc",
        padding: "15px",
        borderRadius: "8px"
      }}
    >
      <div>{title}</div>

      <div
        style={{
          fontSize: "24px",
          fontWeight: "bold"
        }}
      >
        {value}
      </div>
    </div>
  );
}

export default RouteSummary;
