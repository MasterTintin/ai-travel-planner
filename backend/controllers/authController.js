import fs from "fs";
import jwt from "jsonwebtoken";

const FILE_PATH = "./data/users.json";

// REGISTER
export const register = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: "Username and Password required"
      });
    }

    let users = [];

    if (fs.existsSync(FILE_PATH)) {
      users = JSON.parse(fs.readFileSync(FILE_PATH, "utf8"));
    }

    const existingUser = users.find((user) => user.username === username);

    if (existingUser) {
      return res.status(400).json({
        error: "Username already exists"
      });
    }

    const newUser = {
      id: Date.now(),
      username,
      password,
      role: "user",
      createdAt: new Date()
    };

    users.push(newUser);

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

    let users = [];

    if (fs.existsSync(FILE_PATH)) {
      users = JSON.parse(fs.readFileSync(FILE_PATH, "utf8"));
    }

    const user = users.find(
      (u) => u.username === username && u.password === password
    );

    if (!user) {
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
