import fs from "fs";
import path from "path";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const FILE_PATH = "./data/users.json";

// สร้างโฟลเดอร์ ./data ถ้ายังไม่มี (กัน writeFileSync พังตอน register ครั้งแรก)
const ensureDataDir = () => {
  const dir = path.dirname(FILE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// อ่านรายชื่อ user จากไฟล์ (ใช้ซ้ำทั้ง register และ login)
const readUsers = () => {
  if (!fs.existsSync(FILE_PATH)) return [];
  const fileData = fs.readFileSync(FILE_PATH, "utf8");
  return fileData ? JSON.parse(fileData) : [];
};

// REGISTER
export const register = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: "Username and Password required"
      });
    }

    const users = readUsers();

    const existingUser = users.find((user) => user.username === username);
    if (existingUser) {
      return res.status(400).json({
        error: "Username already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      id: Date.now(),
      username,
      password: hashedPassword,
      role: "user",
      createdAt: new Date().toISOString()
    };

    users.push(newUser);

    ensureDataDir();
    fs.writeFileSync(FILE_PATH, JSON.stringify(users, null, 2));

    res.status(201).json({
      success: true,
      message: "Register Success"
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: "Register Failed"
    });
  }
};

// LOGIN
export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: "Username and Password required"
      });
    }

    const users = readUsers();

    const user = users.find((u) => u.username === username);

    if (!user) {
      return res.status(401).json({
        error: "Invalid Credentials"
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        error: "Invalid Credentials"
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d"
      }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: "Login Failed"
    });
  }
};
