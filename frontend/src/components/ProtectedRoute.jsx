import React from "react";
import { Navigate } from "react-router-dom";

// ตัวกั้น: ถ้าไม่มี token (ยังไม่ล็อกอิน) ให้เด้งไปหน้า /login
// ถ้ามี token ก็ปล่อยให้เข้าหน้าที่ห่อไว้ได้ปกติ
function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user");

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
