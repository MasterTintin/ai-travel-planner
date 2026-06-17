import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function LoginPage() {
  const [isRegister, setIsRegister] = useState(false); // false = หน้า Login, true = หน้า Register
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async () => {
    setError("");

    if (!username || !password) {
      setError("กรุณากรอก Username และ Password ให้ครบ");
      return;
    }

    try {
      setLoading(true);

      if (isRegister) {
        // สมัครสมาชิก -> สำเร็จแล้วสลับกลับไปหน้า Login ให้ผู้ใช้ล็อกอินเอง
        await api.post("/auth/register", { username, password });
        alert("✅ สมัครสมาชิกสำเร็จ! เข้าสู่ระบบได้เลย");
        setIsRegister(false);
        setPassword("");
      } else {
        // เข้าสู่ระบบ -> เก็บ token + ข้อมูล user แล้วไปหน้าแอป
        const res = await api.post("/auth/login", { username, password });
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        navigate("/app");
      }
    } catch (err) {
      // โชว์ error ที่ backend ส่งมา เช่น "Invalid Credentials" / "Username already exists"
      const msg =
        err.response?.data?.error || "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // กด Enter เพื่อ submit ได้เลย
  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSubmit();
  };

  // สลับโหมด Login <-> Register แล้วล้าง error เก่า
  const toggleMode = () => {
    setIsRegister((prev) => !prev);
    setError("");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 100%)",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
        boxSizing: "border-box"
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "400px",
          backgroundColor: "white",
          padding: "35px 30px",
          borderRadius: "16px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)"
        }}
      >
        <h1
          style={{
            margin: "0 0 6px 0",
            fontSize: "26px",
            fontWeight: "800",
            color: "#0284c7",
            textAlign: "center"
          }}
        >
          🤖 AI Travel Planner
        </h1>
        <p
          style={{
            margin: "0 0 25px 0",
            fontSize: "14px",
            color: "#666",
            textAlign: "center"
          }}
        >
          {isRegister
            ? "สร้างบัญชีใหม่เพื่อเริ่มจัดทริป"
            : "บอกเราแค่ว่าคุณอยากไปไหน AI จะสร้างทริปที่ใช่สำหรับคุณ"}
        </p>

        <label
          style={{
            display: "block",
            fontSize: "14px",
            fontWeight: "600",
            color: "#0f172a",
            marginBottom: "6px"
          }}
        >
          👤 Username
        </label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="ชื่อผู้ใช้"
          style={{
            width: "100%",
            padding: "12px",
            marginBottom: "16px",
            border: "1px solid #ddd",
            borderRadius: "8px",
            fontSize: "15px",
            boxSizing: "border-box"
          }}
        />

        <label
          style={{
            display: "block",
            fontSize: "14px",
            fontWeight: "600",
            color: "#0f172a",
            marginBottom: "6px"
          }}
        >
          🔑 Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="รหัสผ่าน"
          style={{
            width: "100%",
            padding: "12px",
            marginBottom: "16px",
            border: "1px solid #ddd",
            borderRadius: "8px",
            fontSize: "15px",
            boxSizing: "border-box"
          }}
        />

        {/* กล่องแจ้ง error */}
        {error && (
          <div
            style={{
              backgroundColor: "#fef2f2",
              color: "#dc2626",
              padding: "10px 14px",
              borderRadius: "8px",
              fontSize: "14px",
              marginBottom: "16px",
              border: "1px solid #fecaca"
            }}
          >
            ⚠️ {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: "100%",
            padding: "13px",
            backgroundColor: loading ? "#94a3b8" : "#0284c7",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: loading ? "not-allowed" : "pointer",
            marginBottom: "18px"
          }}
        >
          {loading
            ? "⏳ กำลังดำเนินการ..."
            : isRegister
              ? "✨ สมัครสมาชิก"
              : "🚀 เข้าสู่ระบบ"}
        </button>

        <p
          style={{
            margin: "0",
            textAlign: "center",
            fontSize: "14px",
            color: "#666"
          }}
        >
          {isRegister ? "มีบัญชีอยู่แล้ว?" : "ยังไม่มีบัญชี?"}{" "}
          <span
            onClick={toggleMode}
            style={{
              color: "#0284c7",
              fontWeight: "bold",
              cursor: "pointer",
              textDecoration: "underline"
            }}
          >
            {isRegister ? "เข้าสู่ระบบ" : "สมัครสมาชิก"}
          </span>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
