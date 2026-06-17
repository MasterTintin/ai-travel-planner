import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import tripRoutes from "./routes/tripRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import exchangeRoutes from "./routes/exchangeRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

app.use(express.json());

// Base Route สำหรับเช็ก Server ว่ายังทำงานอยู่ไหม
app.get("/", (req, res) => {
  res.send("AI Travel Planner Backend is running beautifully! 🚀");
});

app.use("/api/auth", authRoutes);
app.use("/api/trips", tripRoutes);
app.use("/api/exchange-rates", exchangeRoutes);

app.listen(PORT, () => {
  console.log(`Server is pumping cleanly on port ${PORT} 🔥`);
});
