import React, { useState } from "react";

const labelStyle = {
  display: "block",
  fontSize: "13px",
  fontWeight: "600",
  color: "#475569",
  marginTop: "10px",
  marginBottom: "4px"
};

const fieldStyle = {
  width: "100%",
  marginBottom: "10px"
};

function EditableActivityCard({ activity, onSave, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    ...activity
  });

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    onSave(formData);
    setEditing(false);
  };

  // 1. กด Cancel แล้ว reset ค่ากลับเป็นของเดิม
  const handleCancel = () => {
    setFormData(activity);
    setEditing(false);
  };

  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: "10px",
        padding: "16px",
        marginBottom: "12px",
        backgroundColor: "#fff"
      }}
    >
      {editing ? (
        <>
          <input
            value={formData.locationName}
            onChange={(e) => handleChange("locationName", e.target.value)}
            style={{
              width: "100%",
              marginBottom: "10px"
            }}
          />
          <textarea
            value={formData.description}
            onChange={(e) => handleChange("description", e.target.value)}
            rows={3}
            style={{
              width: "100%",
              marginBottom: "10px"
            }}
          />
          <div
            style={{
              display: "flex",
              gap: "10px"
            }}
          >
            <input
              type="time"
              value={formData.startTime}
              onChange={(e) => handleChange("startTime", e.target.value)}
            />
            <input
              type="time"
              value={formData.endTime}
              onChange={(e) => handleChange("endTime", e.target.value)}
            />
          </div>
          <br />

          {/* 2. estimatedCost เปลี่ยน -> อัปเดต displayCost ให้ตรงกันทันที */}
          <label style={labelStyle}>💰 ค่าใช้จ่าย (JPY)</label>
          <input
            type="number"
            value={formData.estimatedCost}
            onChange={(e) => {
              const cost = Number(e.target.value);
              handleChange("estimatedCost", cost);
              handleChange("displayCost", `${cost.toLocaleString()} JPY`);
            }}
            style={fieldStyle}
          />

          {/* 3. Priority Score */}
          <label style={labelStyle}>⭐ Priority Score (1-10)</label>
          <input
            type="number"
            min="1"
            max="10"
            value={formData.priorityScore || 5}
            onChange={(e) =>
              handleChange("priorityScore", Number(e.target.value))
            }
            style={fieldStyle}
          />

          {/* 4. Rainy Alternative */}
          <label style={labelStyle}>☔ Rainy Alternative</label>
          <input
            value={formData.rainyAlternative || ""}
            onChange={(e) => handleChange("rainyAlternative", e.target.value)}
            placeholder="ถ้าฝนตกไปไหนแทน..."
            style={fieldStyle}
          />

          {/* 5. Transport Type */}
          <label style={labelStyle}>🚆 Transport Type</label>
          <input
            value={formData.transportType || ""}
            onChange={(e) => handleChange("transportType", e.target.value)}
            placeholder="เช่น รถไฟ, เดิน, แท็กซี่"
            style={fieldStyle}
          />

          <div
            style={{
              marginTop: "12px",
              display: "flex",
              gap: "10px"
            }}
          >
            <button onClick={handleSave}>💾 Save</button>
            <button onClick={handleCancel}>Cancel</button>
          </div>
        </>
      ) : (
        <>
          <h4>📍 {activity.locationName}</h4>
          <p>
            ⏰ {activity.startTime} - {activity.endTime}
          </p>
          <p>{activity.description}</p>
          <p>💰 {activity.displayCost}</p>
          <div
            style={{
              display: "flex",
              gap: "10px"
            }}
          >
            <button onClick={() => setEditing(true)}>✏️ Edit</button>
            <button onClick={() => onDelete(activity)}>🗑 Delete</button>
          </div>
        </>
      )}
    </div>
  );
}

export default EditableActivityCard;
