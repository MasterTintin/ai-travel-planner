import jwt from "jsonwebtoken";

// 🔐 ด่านตรวจ token — เอาไว้คั่นหน้า route ที่ต้องล็อกอินก่อนถึงจะเข้าได้
export const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // ต้องมี header และต้องขึ้นต้นด้วย "Bearer " เท่านั้น
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No token provided"
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid Token"
    });
  }
};
