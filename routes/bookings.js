// ============================================================
//  routes/bookings.js  —  Booking & Cancellation Routes
// ============================================================
const express = require("express");
const router  = express.Router();
const db      = require("../db");

// GET /api/bookings
router.get("/", (req, res) => {
  const { passId, status } = req.query;
  let result = [...db.bookings];

  if (passId)  result = result.filter((b) => b.passId === parseInt(passId));
  if (status)  result = result.filter((b) => b.status === status);

  res.json({ success: true, data: result });
});

// GET /api/bookings/:ref
router.get("/:ref", (req, res) => {
  const booking = db.bookings.find((b) => b.ref === req.params.ref);
  if (!booking) return res.status(404).json({ success: false, message: "Booking not found." });
  res.json({ success: true, data: booking });
});

// POST /api/bookings  —  Create a new booking
router.post("/", (req, res) => {
  const { passId, flightId, seat, cls } = req.body;

  if (!passId || !flightId) {
    return res.status(400).json({ success: false, message: "Passenger ID and Flight ID are required." });
  }

  // Find the flight
  const flight = db.flights.find((f) => f.id === parseInt(flightId));
  if (!flight) return res.status(404).json({ success: false, message: "Flight not found." });

  // ── MAINTENANCE-FIXED VALIDATION ──────────────────────────
  // BUG-001 FIX: Check seat availability
  if (flight.avail < 1) {
    return res.status(400).json({
      success: false,
      message: `Flight ${flight.number} is fully booked. No seats available.`,
    });
  }

  // BUG-004 FIX: Check for duplicate seat
  const seatToAssign = seat || db.autoSeat();
  const seatTaken = db.bookings.find(
    (b) => b.flightId === parseInt(flightId) && b.seat === seatToAssign && b.status === "Confirmed"
  );
  if (seatTaken) {
    return res.status(400).json({
      success: false,
      message: `Seat ${seatToAssign} is already taken on flight ${flight.number}.`,
    });
  }

  // Check duplicate passenger booking on same flight
  const alreadyBooked = db.bookings.find(
    (b) => b.passId === parseInt(passId) && b.flightId === parseInt(flightId) && b.status === "Confirmed"
  );
  if (alreadyBooked) {
    return res.status(400).json({
      success: false,
      message: "You already have an active booking on this flight.",
    });
  }

  const passenger = db.users.find((u) => u.id === parseInt(passId));
  if (!passenger) return res.status(404).json({ success: false, message: "Passenger not found." });

  const classType = cls || "Economy";
  const fare  = classType === "Business" ? flight.biz : flight.eco;
  const miles = classType === "Business"
    ? Math.round(fare / 1000 * 25)
    : Math.round(fare / 1000 * 10);

  const newBooking = {
    id:       Date.now(),
    ref:      db.generateRef(),
    passId:   parseInt(passId),
    flightId: parseInt(flightId),
    seat:     seatToAssign,
    cls:      classType,
    fare,
    miles,
    status:   "Confirmed",
    date:     new Date().toISOString().split("T")[0],
  };

  db.bookings.push(newBooking);

  // Decrement available seats
  flight.avail = Math.max(0, flight.avail - 1);

  // Award loyalty miles
  passenger.miles = (passenger.miles || 0) + miles;
  db.updateTier(passenger);

  db.addLog(`🎫 Booking confirmed: ${newBooking.ref} — ${classType} on ${flight.number}`, "success");

  res.status(201).json({ success: true, data: newBooking });
});

// PATCH /api/bookings/:ref/cancel  —  Cancel a booking
router.patch("/:ref/cancel", (req, res) => {
  const { reason } = req.body;
  const booking = db.bookings.find((b) => b.ref === req.params.ref);

  if (!booking) return res.status(404).json({ success: false, message: "Booking not found." });
  if (booking.status === "Cancelled") {
    return res.status(400).json({ success: false, message: "Booking is already cancelled." });
  }

  // Tiered refund policy
  const flight   = db.flights.find((f) => f.id === booking.flightId);
  const flightDate = flight ? new Date(flight.date) : new Date();
  const daysLeft = Math.max(0, Math.ceil((flightDate - new Date()) / (1000 * 60 * 60 * 24)));

  let pct = daysLeft >= 14 ? 100 : daysLeft >= 7 ? 75 : daysLeft >= 3 ? 50 : daysLeft >= 1 ? 25 : 0;
  if (booking.cls === "Business") pct = Math.min(100, pct + 10);
  const refund = Math.round(booking.fare * pct / 100);

  // BUG-003 FIX: Restore seat on cancellation
  booking.status = "Cancelled";
  if (flight) flight.avail++;

  // Log the cancellation
  db.cancellations.push({
    id:     db.cancellations.length + 1,
    ref:    booking.ref,
    reason: reason || "Not specified",
    refund,
    status: "Processed",
    date:   new Date().toISOString().split("T")[0],
  });

  db.addLog(`❌ Booking cancelled: ${booking.ref} — Refund: PKR ${refund.toLocaleString()}`, "warn");

  res.json({
    success: true,
    data: {
      booking,
      refund,
      refundPercent: pct,
      daysBeforeDeparture: daysLeft,
      message: `Booking cancelled. Refund of PKR ${refund.toLocaleString()} (${pct}%) will be processed in 3–5 business days.`,
    },
  });
});

// DELETE /api/bookings/:id  (admin hard delete)
router.delete("/:id", (req, res) => {
  const id  = parseInt(req.params.id);
  const idx = db.bookings.findIndex((b) => b.id === id);
  if (idx === -1) return res.status(404).json({ success: false, message: "Booking not found." });

  const ref = db.bookings[idx].ref;
  db.bookings.splice(idx, 1);
  db.addLog(`🗑 Booking deleted: ${ref}`, "warn");
  res.json({ success: true, message: `Booking ${ref} deleted.` });
});

module.exports = router;
