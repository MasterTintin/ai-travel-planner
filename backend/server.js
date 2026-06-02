import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import tripRoutes from "./routes/tripRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Base Route สำหรับเช็ก Server ว่ายังทำงานอยู่ไหม
app.get("/", (req, res) => {
  res.send("AI Travel Planner Backend is running beautifully! 🚀");
});

app.use("/api", tripRoutes);

app.listen(PORT, () => {
  console.log(`Server is pumping cleanly on port ${PORT} 🔥`);
});
