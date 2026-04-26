// ============================================================
//  routes/flights.js  —  Flight Management Routes
// ============================================================
const express = require("express");
const router  = express.Router();
const db      = require("../db");

// GET /api/flights
router.get("/", (req, res) => {
  res.json({ success: true, data: db.flights });
});

// GET /api/flights/:id
router.get("/:id", (req, res) => {
  const flight = db.flights.find((f) => f.id === parseInt(req.params.id));
  if (!flight) return res.status(404).json({ success: false, message: "Flight not found." });
  res.json({ success: true, data: flight });
});

// POST /api/flights  (admin)
router.post("/", (req, res) => {
  const { number, from, to, dep, arr, date, seats, eco, biz, status } = req.body;

  if (!number || !from || !to || !dep || !arr || !date || !seats) {
    return res.status(400).json({ success: false, message: "All flight fields are required." });
  }

  if (parseInt(seats) < 1) {
    return res.status(400).json({ success: false, message: "Seat capacity must be at least 1." });
  }

  if (db.flights.find((f) => f.number === number)) {
    return res.status(409).json({ success: false, message: `Flight number ${number} already exists.` });
  }

  const newFlight = {
    id:     Date.now(),
    number,
    from,
    to,
    dep,
    arr,
    date,
    seats:  parseInt(seats),
    avail:  parseInt(seats),
    eco:    parseInt(eco)  || 0,
    biz:    parseInt(biz)  || 0,
    status: status || "Scheduled",
  };

  db.flights.push(newFlight);
  db.addLog(`✈ Flight added: ${number} (${from} → ${to})`, "success");
  res.status(201).json({ success: true, data: newFlight });
});

// DELETE /api/flights/:id  (admin)
router.delete("/:id", (req, res) => {
  const id  = parseInt(req.params.id);
  const hasActiveBookings = db.bookings.some(
    (b) => b.flightId === id && b.status === "Confirmed"
  );

  if (hasActiveBookings) {
    return res.status(400).json({
      success: false,
      message: "Cannot delete flight with active bookings. Cancel all bookings first.",
    });
  }

  const idx = db.flights.findIndex((f) => f.id === id);
  if (idx === -1) return res.status(404).json({ success: false, message: "Flight not found." });

  const number = db.flights[idx].number;
  db.flights.splice(idx, 1);
  db.addLog(`🗑 Flight deleted: ${number}`, "warn");
  res.json({ success: true, message: `Flight ${number} deleted.` });
});

// PATCH /api/flights/:id/status  (admin update status)
router.patch("/:id/status", (req, res) => {
  const { status } = req.body;
  const validStatuses = ["Scheduled", "On Time", "Boarding", "Delayed", "Cancelled"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid status value." });
  }

  const flight = db.flights.find((f) => f.id === parseInt(req.params.id));
  if (!flight) return res.status(404).json({ success: false, message: "Flight not found." });

  flight.status = status;
  db.addLog(`✈ Flight ${flight.number} status updated to ${status}`, "info");
  res.json({ success: true, data: flight });
});

module.exports = router;
