import React, { useState } from "react";
import api from "../services/api.js";

// แปลงเมตร -> ข้อความ กม./เมตร
const formatDistance = (meters) => {
  if (!meters) return "";
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} กม.`;
  return `${meters} ม.`;
};

// หาเวลาออกเดินทางแบบ "อนาคต + ช่วงกลางวัน" (เที่ยง UTC = ช่วงที่รถสาธารณะวิ่งในเกือบทุกโซนเวลา)
const getDepartureTime = (departureDate) => {
  const now = new Date();
  if (departureDate) {
    const d = new Date(`${departureDate}T12:00:00Z`);
    if (d.getTime() > now.getTime()) return d.toISOString();
  }
  // ถ้าวันเดินทางผ่านไปแล้ว/ไม่มี → ใช้พรุ่งนี้เที่ยง UTC
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  tomorrow.setUTCHours(12, 0, 0, 0);
  return tomorrow.toISOString();
};

function TripTransitRoutes({ trip }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [daysLegs, setDaysLegs] = useState([]);
  const [hasFetched, setHasFetched] = useState(false);

  // สร้างรายการ "ช่วงเดินทาง" จาก activity ที่มีพิกัด ภายในแต่ละวัน
  const buildPlannedLegs = () => {
    const result = [];
    (trip.itinerary || []).forEach((day) => {
      const acts = (day.activities || []).filter(
        (a) => typeof a.latitude === "number" && typeof a.longitude === "number"
      );
      const legs = [];
      for (let i = 0; i < acts.length - 1; i++) {
        legs.push({ from: acts[i], to: acts[i + 1] });
      }
      if (legs.length > 0) {
        result.push({ day: day.day, theme: day.theme, legs });
      }
    });
    return result;
  };

  const handleToggle = async () => {
    // ถ้าเปิดอยู่ → ปิด
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);

    // โหลดครั้งเดียวพอ (กดเปิด-ปิดซ้ำไม่ยิงใหม่)
    if (hasFetched) return;

    const planned = buildPlannedLegs();
    if (planned.length === 0) {
      setError("ทริปนี้ยังไม่มีพิกัดสถานที่เพียงพอสำหรับคำนวณเส้นทาง");
      setHasFetched(true);
      return;
    }

    setLoading(true);
    setError("");
    const departureTime = getDepartureTime(trip.departureDate);

    try {
      // ยิงทุกช่วงพร้อมกัน
      const results = await Promise.all(
        planned.map(async (d) => {
          const legs = await Promise.all(
            d.legs.map(async (leg) => {
              try {
                const res = await api.post("/trips/transit", {
                  origin: { lat: leg.from.latitude, lng: leg.from.longitude },
                  destination: { lat: leg.to.latitude, lng: leg.to.longitude },
                  departureTime
                });
                return { from: leg.from, to: leg.to, data: res.data };
              } catch (err) {
                console.error("โหลด leg ไม่สำเร็จ:", err);
                return { from: leg.from, to: leg.to, data: null };
              }
            })
          );
          return { day: d.day, theme: d.theme, legs };
        })
      );
      setDaysLegs(results);
      setHasFetched(true);
    } catch (err) {
      console.error("โหลดเส้นทางไม่สำเร็จ:", err);
      setError("โหลดเส้นทางไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  // ลิงก์เปิด Google Maps
  const renderMapsLink = (url) => {
    if (!url) return null;
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "inline-block",
          marginTop: "6px",
          fontSize: "12px",
          color: "#1677ff",
          textDecoration: "none",
          fontWeight: "600"
        }}
      >
        🗺️ เปิดใน Google Maps
      </a>
    );
  };

  // แสดงผลของแต่ละช่วง ตาม mode ที่ backend ส่งมา (transit / driving / none / ล้มเหลว)
  const renderLegBody = (data) => {
    // ยิงไม่สำเร็จ
    if (!data) {
      return (
        <div style={{ color: "#ef4444", fontSize: "13px" }}>
          ⚠️ โหลดเส้นทางช่วงนี้ไม่สำเร็จ
        </div>
      );
    }

    // ขับรถ (fallback ตอนไม่มีข้อมูล transit)
    if (data.mode === "driving") {
      return (
        <div>
          <div style={{ fontSize: "14px", color: "#334155" }}>
            🚗 ขับรถประมาณ <strong>{data.totalDurationMinutes} นาที</strong>
            {data.distanceMeters
              ? ` (${formatDistance(data.distanceMeters)})`
              : ""}
          </div>
          {data.note && (
            <div
              style={{
                fontSize: "12px",
                color: "#94a3b8",
                marginTop: "2px"
              }}
            >
              {data.note}
            </div>
          )}
          {renderMapsLink(data.googleMapsUrl)}
        </div>
      );
    }

    // ❌ ไม่มีข้อมูลเส้นทางเลย
    if (data.mode === "none") {
      return (
        <div>
          <div style={{ fontSize: "13px", color: "#94a3b8" }}>{data.note}</div>
          {renderMapsLink(data.googleMapsUrl)}
        </div>
      );
    }

    // 🚆 transit — โชว์เฉพาะช่วงนั่งรถ (สรุปการเดินไว้บรรทัดเดียว)
    const transitSteps = (data.steps || []).filter((s) => s.type === "transit");
    const hasWalk = (data.steps || []).some((s) => s.type === "walk");

    return (
      <div>
        <div
          style={{ fontSize: "13px", color: "#64748b", marginBottom: "6px" }}
        >
          ⏱️ รวมประมาณ <strong>{data.totalDurationMinutes} นาที</strong>
        </div>

        {transitSteps.length === 0 ? (
          <div style={{ fontSize: "14px", color: "#334155" }}>
            🚶 เดินทั้งหมด
          </div>
        ) : (
          transitSteps.map((step, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "8px",
                padding: "8px 10px",
                background: "#f8fafc",
                borderRadius: "8px",
                borderLeft: `4px solid ${step.color || "#1677ff"}`,
                marginBottom: "6px"
              }}
            >
              <span style={{ fontSize: "18px" }}>{step.emoji}</span>
              <div style={{ fontSize: "13px" }}>
                <div style={{ fontWeight: "bold", color: "#0f172a" }}>
                  {step.vehicle}
                  {step.lineName ? ` สาย ${step.lineName}` : ""}
                </div>
                <div style={{ color: "#475569" }}>
                  {step.departureStop} → {step.arrivalStop}
                </div>
                <div style={{ color: "#0284c7", fontWeight: "600" }}>
                  🕐 ออก {step.departureTime} → ถึง {step.arrivalTime}
                  {step.numStops ? ` · ${step.numStops} ป้าย` : ""}
                </div>
              </div>
            </div>
          ))
        )}

        {hasWalk && (
          <div style={{ fontSize: "12px", color: "#94a3b8" }}>
            🚶 (รวมการเดินไป-กลับสถานี)
          </div>
        )}

        {renderMapsLink(data.googleMapsUrl)}
      </div>
    );
  };

  return (
    <div style={{ marginTop: "12px", width: "100%" }}>
      <button
        onClick={handleToggle}
        style={{
          width: "100%",
          padding: "10px",
          backgroundColor: open ? "#e0f2fe" : "#0284c7",
          color: open ? "#0369a1" : "white",
          border: open ? "1px solid #0284c7" : "none",
          borderRadius: "8px",
          cursor: "pointer",
          fontSize: "14px",
          fontWeight: "bold"
        }}
      >
        {open
          ? "🧭 ซ่อนเส้นทางการเดินทาง"
          : "🧭 ดูเส้นทางการเดินทาง (จุดต่อจุด)"}
      </button>

      {open && (
        <div style={{ marginTop: "12px" }}>
          {loading && (
            <div
              style={{
                textAlign: "center",
                color: "#0284c7",
                padding: "12px",
                fontWeight: "600"
              }}
            >
              ⏳ กำลังหาเส้นทางจาก Google...
            </div>
          )}

          {error && (
            <div
              style={{
                color: "#ef4444",
                fontSize: "13px",
                padding: "8px",
                background: "#fef2f2",
                borderRadius: "8px"
              }}
            >
              {error}
            </div>
          )}

          {!loading &&
            !error &&
            daysLegs.map((d) => (
              <div key={d.day} style={{ marginBottom: "16px" }}>
                <h4
                  style={{
                    margin: "0 0 8px 0",
                    color: "#0284c7",
                    fontSize: "15px"
                  }}
                >
                  📅 วันที่ {d.day}
                  {d.theme ? ` — ${d.theme}` : ""}
                </h4>

                {d.legs.map((leg, i) => (
                  <div
                    key={i}
                    style={{
                      border: "1px solid #e2e8f0",
                      borderRadius: "10px",
                      padding: "12px",
                      marginBottom: "10px",
                      background: "white"
                    }}
                  >
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: "bold",
                        color: "#0f172a",
                        marginBottom: "8px"
                      }}
                    >
                      📍 {leg.from.locationName}{" "}
                      <span style={{ color: "#94a3b8" }}>→</span>{" "}
                      {leg.to.locationName}
                    </div>
                    {renderLegBody(leg.data)}
                  </div>
                ))}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

export default TripTransitRoutes;
