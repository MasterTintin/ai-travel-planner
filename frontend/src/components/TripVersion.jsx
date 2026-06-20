import React from "react";

function TripVersion({
  versions = [],
  currentVersion,
  onLoadVersion,
  onSaveVersion,
  onDeleteVersion
}) {
  return (
    <div
      style={{
        background: "#fff",
        padding: "20px",
        borderRadius: "12px",
        marginTop: "20px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px"
        }}
      >
        <div>
          <h2
            style={{
              margin: 0
            }}
          >
            🗂️ Trip Versions
          </h2>

          <p
            style={{
              margin: "4px 0 0",
              color: "#64748b",
              fontSize: "13px"
            }}
          >
            บันทึกและย้อนกลับแผนการเดินทางเวอร์ชันต่าง ๆ
          </p>
        </div>

        <button
          onClick={onSaveVersion}
          style={{
            background: "#1677ff",
            color: "white",
            border: "none",
            padding: "10px 16px",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold"
          }}
        >
          💾 Save Current Version
        </button>
      </div>

      {/* Empty State */}
      {versions.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "30px",
            color: "#64748b",
            border: "1px dashed #cbd5e1",
            borderRadius: "10px"
          }}
        >
          ยังไม่มี Version ที่บันทึกไว้
        </div>
      ) : (
        versions.map((version, index) => {
          const tripData = version.tripData || {};

          return (
            <div
              key={version.id}
              style={{
                border:
                  version.id === currentVersion
                    ? "2px solid #1677ff"
                    : "1px solid #ddd",

                borderRadius: "10px",

                padding: "15px",

                marginBottom: "12px",

                background: version.id === currentVersion ? "#eff6ff" : "#fff",

                transition: "all 0.2s ease"
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                {/* Left */}
                <div>
                  <div
                    style={{
                      fontWeight: "bold",
                      fontSize: "16px",
                      color: "#0f172a"
                    }}
                  >
                    {tripData.tripName || `Version ${index + 1}`}
                  </div>

                  <div
                    style={{
                      marginTop: "4px",
                      color: "#475569",
                      fontSize: "13px"
                    }}
                  >
                    📍 {tripData.destination || "Unknown Destination"}
                  </div>

                  <div
                    style={{
                      marginTop: "2px",
                      color: "#64748b",
                      fontSize: "13px"
                    }}
                  >
                    ⏳ {tripData.totalDays || 0} วัน
                  </div>

                  <div
                    style={{
                      marginTop: "6px",
                      color: "#94a3b8",
                      fontSize: "12px"
                    }}
                  >
                    🕒 {new Date(version.createdAt).toLocaleString()}
                  </div>
                </div>

                {/* Right */}
                <div
                  style={{
                    display: "flex",
                    gap: "8px"
                  }}
                >
                  <button
                    onClick={() => onLoadVersion(version)}
                    style={{
                      background: "#22c55e",
                      color: "white",
                      border: "none",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontWeight: "bold"
                    }}
                  >
                    📂 Load
                  </button>

                  <button
                    onClick={() => onDeleteVersion?.(version.id)}
                    style={{
                      background: "#ef4444",
                      color: "white",
                      border: "none",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontWeight: "bold"
                    }}
                  >
                    🗑 Delete
                  </button>
                </div>
              </div>

              {/* Current Badge */}
              {version.id === currentVersion && (
                <div
                  style={{
                    marginTop: "10px",
                    display: "inline-block",
                    background: "#1677ff",
                    color: "white",
                    fontSize: "12px",
                    padding: "4px 10px",
                    borderRadius: "999px"
                  }}
                >
                  Current Version
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

export default TripVersion;
