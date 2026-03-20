import "dotenv/config";
import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

const SECRET = "secret";

// store refresh tokens
let refreshTokens: string[] = [];

// Middleware
const auth = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token" });

  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};

//////////////////////////
// AUTH ROUTES
//////////////////////////

// Register
app.post("/auth/register", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ message: "Missing fields" });

  const hashed = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { email, password: hashed },
  });

  res.json({ id: user.id, email: user.email }); // password removed
});

// Login
app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ message: "Missing fields" });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(404).json({ message: "User not found" });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ message: "Wrong password" });

  const accessToken = jwt.sign({ userId: user.id }, SECRET, {
    expiresIn: "1h",
  });

  const refreshToken = jwt.sign({ userId: user.id }, SECRET);
  refreshTokens.push(refreshToken);

  res.json({ accessToken, refreshToken });
});

// Refresh
app.post("/auth/refresh", (req, res) => {
  const { token } = req.body;

  if (!token) return res.status(401).json({ message: "No token" });
  if (!refreshTokens.includes(token))
    return res.status(403).json({ message: "Invalid refresh token" });

  try {
    const user: any = jwt.verify(token, SECRET);

    const newAccessToken = jwt.sign(
      { userId: user.userId },
      SECRET,
      { expiresIn: "1h" }
    );

    res.json({ accessToken: newAccessToken });
  } catch {
    res.status(403).json({ message: "Expired refresh token" });
  }
});

// Logout
app.post("/auth/logout", (req, res) => {
  const { token } = req.body;
  refreshTokens = refreshTokens.filter(t => t !== token);
  res.json({ message: "Logged out" });
});

//////////////////////////
// TASK ROUTES
//////////////////////////

// Get tasks (pagination + search + filter)
app.get("/tasks", auth, async (req: any, res) => {
  const { page = 1, limit = 5, search = "", status } = req.query;

  const tasks = await prisma.task.findMany({
    where: {
      userId: req.user.userId,
      title: { contains: search },
      ...(status !== undefined && { completed: status === "true" }),
    },
    skip: (Number(page) - 1) * Number(limit),
    take: Number(limit),
  });

  res.json(tasks);
});

// Add task
app.post("/tasks", auth, async (req: any, res) => {
  if (!req.body.title)
    return res.status(400).json({ message: "Title required" });

  const task = await prisma.task.create({
    data: {
      title: req.body.title,
      userId: req.user.userId,
    },
  });

  res.json(task);
});

// Update task (secure)
app.patch("/tasks/:id", auth, async (req: any, res) => {
  const task = await prisma.task.findUnique({
    where: { id: Number(req.params.id) },
  });

  if (!task || task.userId !== req.user.userId)
    return res.status(404).json({ message: "Task not found" });

  const updated = await prisma.task.update({
    where: { id: task.id },
    data: { title: req.body.title },
  });

  res.json(updated);
});

// Delete task (secure)
app.delete("/tasks/:id", auth, async (req: any, res) => {
  const task = await prisma.task.findUnique({
    where: { id: Number(req.params.id) },
  });

  if (!task || task.userId !== req.user.userId)
    return res.status(404).json({ message: "Task not found" });

  await prisma.task.delete({
    where: { id: task.id },
  });

  res.json({ message: "Deleted" });
});

// Toggle
app.patch("/tasks/:id/toggle", auth, async (req: any, res) => {
  const task = await prisma.task.findUnique({
    where: { id: Number(req.params.id) },
  });

  if (!task || task.userId !== req.user.userId)
    return res.status(404).json({ message: "Task not found" });

  const updated = await prisma.task.update({
    where: { id: task.id },
    data: { completed: !task.completed },
  });

  res.json(updated);
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});