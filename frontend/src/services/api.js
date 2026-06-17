import axios from "axios";

// ตัวกลางเรียก Backend — กำหนด baseURL ที่เดียว ที่อื่นเรียกสั้นๆ ได้เลย เช่น api.get("/trips")
const api = axios.create({
  baseURL: "http://127.0.0.1:5000/api"
});

// 🔑 ก่อนยิงทุก request: แนบ token จาก localStorage ใส่ header ให้อัตโนมัติ
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 🚪 หลังได้ response: ถ้าโดน 401 (token หมดอายุ/ไม่ถูกต้อง) ให้เคลียร์แล้วเด้งไปหน้า login
//    ยกเว้น request ของ login/register เอง (พวกนั้นต้องโชว์ error ในฟอร์ม ไม่ใช่เด้งหน้า)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || "";
    const isAuthRoute = url.includes("/login") || url.includes("/register");

    if (error.response?.status === 401 && !isAuthRoute) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
