// ============================================================
//  routes/auth.js  —  Authentication Routes
// ============================================================
const express = require("express");
const router  = express.Router();
const db      = require("../db");

// POST /api/auth/login
router.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: "Username and password are required." });
  }

  const user = db.users.find(
    (u) => u.username === username && u.password === password
  );

  if (!user) {
    return res.status(401).json({ success: false, message: "Invalid credentials." });
  }

  // Return user without password
  const { password: _pw, ...safeUser } = user;

  db.addLog(`✈ ${user.name} signed in (${user.role}).`, "success");

  res.json({ success: true, user: safeUser });
});

// GET /api/auth/users  (admin only in real app — simplified here)
router.get("/users", (req, res) => {
  const passengers = db.users
    .filter((u) => u.role === "passenger")
    .map(({ password: _pw, ...u }) => u);
  res.json({ success: true, data: passengers });
});

// POST /api/auth/register  (admin registers a new passenger)
router.post("/register", (req, res) => {
  const { username, password, name, email, phone, passport, nationality, dob } = req.body;

  if (!username || !password || !name) {
    return res.status(400).json({ success: false, message: "Name, username and password are required." });
  }

  if (db.users.find((u) => u.username === username)) {
    return res.status(409).json({ success: false, message: "Username already taken." });
  }

  const newUser = {
    id: Date.now(),
    username,
    password,
    role: "passenger",
    name,
    email:       email       || "",
    phone:       phone       || "",
    passport:    passport    || "",
    nationality: nationality || "",
    dob:         dob         || "",
    miles: 0,
    tier: "Bronze",
  };

  db.users.push(newUser);
  db.addLog(`👤 Passenger registered: ${name} (${username})`, "success");

  const { password: _pw, ...safeUser } = newUser;
  res.status(201).json({ success: true, user: safeUser });
});

// DELETE /api/auth/users/:id
router.delete("/users/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const idx = db.users.findIndex((u) => u.id === id);
  if (idx === -1) return res.status(404).json({ success: false, message: "User not found." });

  const name = db.users[idx].name;
  db.users.splice(idx, 1);
  db.addLog(`🗑 Passenger deleted: ${name}`, "warn");
  res.json({ success: true, message: "Passenger removed." });
});

module.exports = router;
