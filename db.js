// ============================================================
//  db.js  —  In-Memory Database for SKYLINE ARS
//  (Replaces localStorage on the server side)
//  In production you would swap this for MongoDB / PostgreSQL
// ============================================================
const { v4: uuidv4 } = require("uuid");

// ── USERS ────────────────────────────────────────────────────
const users = [
  {
    id: 1,
    username: "admin",
    password: "admin123",
    role: "admin",
    name: "System Administrator",
    email: "admin@skyline.pk",
    phone: "0300-0000000",
  },
  {
    id: 2,
    username: "passenger1",
    password: "pass123",
    role: "passenger",
    name: "Ahmed Hassan",
    email: "ahmed@email.com",
    phone: "0301-1234567",
    passport: "AA1234567",
    nationality: "Pakistani",
    dob: "1995-05-15",
    miles: 12450,
    tier: "Silver",
  },
  {
    id: 3,
    username: "passenger2",
    password: "pass123",
    role: "passenger",
    name: "Sara Ali",
    email: "sara@email.com",
    phone: "0302-7654321",
    passport: "BB9876543",
    nationality: "Pakistani",
    dob: "1998-08-22",
    miles: 3200,
    tier: "Bronze",
  },
  {
    id: 4,
    username: "passenger3",
    password: "pass123",
    role: "passenger",
    name: "Usman Tariq",
    email: "usman@email.com",
    phone: "0303-1112223",
    passport: "CC5551234",
    nationality: "Pakistani",
    dob: "1990-03-10",
    miles: 52400,
    tier: "Gold",
  },
];

// ── FLIGHTS ──────────────────────────────────────────────────
const flights = [
  { id: 1, number: "SK-101", from: "Karachi",   to: "Dubai",      dep: "08:30", arr: "10:45", date: "2026-05-15", seats: 60, avail: 48, eco: 12500,  biz: 35000,  status: "Scheduled" },
  { id: 2, number: "SK-205", from: "Karachi",   to: "London",     dep: "14:15", arr: "20:30", date: "2026-05-15", seats: 60, avail: 55, eco: 85000,  biz: 180000, status: "Scheduled" },
  { id: 3, number: "SK-310", from: "Islamabad", to: "Dubai",      dep: "16:00", arr: "18:20", date: "2026-05-16", seats: 60, avail: 60, eco: 11000,  biz: 30000,  status: "Scheduled" },
  { id: 4, number: "SK-422", from: "Lahore",    to: "New York",   dep: "22:45", arr: "14:15", date: "2026-05-16", seats: 60, avail: 40, eco: 120000, biz: 250000, status: "Scheduled" },
  { id: 5, number: "SK-518", from: "Karachi",   to: "Bangkok",    dep: "06:10", arr: "13:40", date: "2026-05-17", seats: 60, avail: 52, eco: 45000,  biz: 95000,  status: "Scheduled" },
  { id: 6, number: "SK-620", from: "Islamabad", to: "Manchester", dep: "11:30", arr: "18:00", date: "2026-05-17", seats: 60, avail: 60, eco: 82000,  biz: 175000, status: "Delayed"   },
  { id: 7, number: "SK-701", from: "Karachi",   to: "Riyadh",     dep: "09:00", arr: "11:30", date: "2026-05-18", seats: 60, avail: 35, eco: 18000,  biz: 45000,  status: "Scheduled" },
];

// ── BOOKINGS ─────────────────────────────────────────────────
const bookings = [
  { id: 1, ref: "SK-DEMO0001", passId: 2, flightId: 1, seat: "3A", cls: "Economy",  fare: 12500,  miles: 125,  status: "Confirmed", date: "2026-04-01" },
  { id: 2, ref: "SK-DEMO0002", passId: 3, flightId: 2, seat: "5C", cls: "Business", fare: 180000, miles: 4500, status: "Confirmed", date: "2026-04-02" },
  { id: 3, ref: "SK-DEMO0003", passId: 4, flightId: 4, seat: "1A", cls: "Business", fare: 250000, miles: 6250, status: "Cancelled", date: "2026-04-03" },
];

// ── CANCELLATIONS ────────────────────────────────────────────
const cancellations = [
  { id: 1, ref: "SK-DEMO0003", reason: "Change of plans", refund: 187500, status: "Processed", date: "2026-04-04" },
];

// ── MAINTENANCE ISSUES ───────────────────────────────────────
const issues = [
  { id: 1, module: "Booking Module",   type: "Corrective", desc: "Double-booking bug — seat lock missing",         severity: "Critical", status: "Resolved",    cost: 45000, date: "2026-03-01" },
  { id: 2, module: "Payment Module",   type: "Corrective", desc: "Negative fare accepted without validation",      severity: "High",     status: "Resolved",    cost: 28000, date: "2026-03-10" },
  { id: 3, module: "Flight Module",    type: "Adaptive",   desc: "New IATA flight code format support",            severity: "Medium",   status: "Resolved",    cost: 15000, date: "2026-03-15" },
  { id: 4, module: "Booking Module",   type: "Perfective", desc: "Add seat class upgrade feature",                 severity: "Low",      status: "In Progress", cost: 32000, date: "2026-04-01" },
  { id: 5, module: "Passenger Module", type: "Preventive", desc: "Refactor passport validation for edge cases",    severity: "Medium",   status: "Open",        cost: 8000,  date: "2026-04-10" },
  { id: 6, module: "Payment Module",   type: "Adaptive",   desc: "Integrate JazzCash / EasyPaisa gateway",         severity: "High",     status: "In Progress", cost: 55000, date: "2026-04-15" },
  { id: 7, module: "Reports Module",   type: "Perfective", desc: "Add PDF export for booking receipts",            severity: "Low",      status: "Open",        cost: 12000, date: "2026-04-20" },
  { id: 8, module: "Login Module",     type: "Preventive", desc: "Implement 2FA for admin accounts",               severity: "High",     status: "Open",        cost: 20000, date: "2026-05-01" },
];

// ── SYSTEM LOGS ──────────────────────────────────────────────
const logs = [];

// ── HELPERS ──────────────────────────────────────────────────
function addLog(message, type = "info") {
  logs.unshift({
    id: logs.length + 1,
    message,
    type,
    timestamp: new Date().toISOString(),
  });
  if (logs.length > 100) logs.pop(); // keep last 100 only
}

function generateRef() {
  return "SK-" + Math.random().toString(36).slice(2, 10).toUpperCase();
}

function autoSeat() {
  const letters = ["A", "B", "C", "D", "E", "F"];
  return (Math.floor(Math.random() * 30) + 1) + letters[Math.floor(Math.random() * 6)];
}

function updateTier(user) {
  const m = user.miles || 0;
  user.tier = m >= 50000 ? "Gold" : m >= 10000 ? "Silver" : "Bronze";
}

module.exports = {
  users,
  flights,
  bookings,
  cancellations,
  issues,
  logs,
  addLog,
  generateRef,
  autoSeat,
  updateTier,
};
