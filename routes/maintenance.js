// ============================================================
//  routes/maintenance.js  —  Maintenance, Issues & System Routes
// ============================================================
const express = require("express");
const router  = express.Router();
const db      = require("../db");

// ── ISSUES ───────────────────────────────────────────────────

// GET /api/maintenance/issues
router.get("/issues", (req, res) => {
  res.json({ success: true, data: db.issues });
});

// POST /api/maintenance/issues
router.post("/issues", (req, res) => {
  const { module, type, desc, severity, cost } = req.body;

  if (!module || !desc) {
    return res.status(400).json({ success: false, message: "Module and description are required." });
  }

  const validTypes     = ["Corrective", "Adaptive", "Perfective", "Preventive"];
  const validSeverities = ["Critical", "High", "Medium", "Low"];

  const newIssue = {
    id:       db.issues.length + 1,
    module,
    type:     validTypes.includes(type)         ? type     : "Corrective",
    desc,
    severity: validSeverities.includes(severity) ? severity : "Medium",
    status:   "Open",
    cost:     parseInt(cost) || 0,
    date:     new Date().toISOString().split("T")[0],
  };

  db.issues.push(newIssue);
  db.addLog(`🔧 Issue logged: [${newIssue.type}] ${module} — ${desc}`, "warn");
  res.status(201).json({ success: true, data: newIssue });
});

// PATCH /api/maintenance/issues/:id/resolve
router.patch("/issues/:id/resolve", (req, res) => {
  const issue = db.issues.find((i) => i.id === parseInt(req.params.id));
  if (!issue) return res.status(404).json({ success: false, message: "Issue not found." });

  issue.status   = "Resolved";
  issue.resolved = new Date().toISOString().split("T")[0];

  db.addLog(`✅ Issue #${issue.id} resolved: ${issue.desc}`, "success");
  res.json({ success: true, data: issue });
});

// ── MAINTENANCE SIMULATION ───────────────────────────────────

// State for the 6-phase simulation
let maintState = {
  phase:   0,
  backup:  null,
  costs:   { corrective: 0, adaptive: 0, preventive: 0 },
  logs:    [],
  corrupted: false,
};

function maintLog(msg, type = "info") {
  maintState.logs.push({ msg, type, time: new Date().toLocaleTimeString() });
  db.addLog(msg, type);
}

// GET /api/maintenance/state
router.get("/state", (req, res) => {
  res.json({ success: true, data: maintState });
});

// POST /api/maintenance/phase/:n  — Run a specific phase
router.post("/phase/:n", (req, res) => {
  const n = parseInt(req.params.n);

  if (n !== maintState.phase) {
    return res.status(400).json({
      success: false,
      message: `Cannot run phase ${n}. Current phase is ${maintState.phase}. Complete steps in order.`,
    });
  }

  switch (n) {
    case 0: // Backup
      maintState.backup = {
        flights:  JSON.parse(JSON.stringify(db.flights)),
        bookings: JSON.parse(JSON.stringify(db.bookings)),
        users:    JSON.parse(JSON.stringify(db.users)),
        time:     new Date().toISOString(),
      };
      maintLog("💾 STEP 1: System backup created.", "success");
      maintLog(`Snapshot: ${db.flights.length} flights, ${db.bookings.length} bookings.`, "info");
      break;

    case 1: // Corrupt
      if (!maintState.backup) {
        return res.status(400).json({ success: false, message: "Create a backup first (Phase 0)." });
      }
      maintState.corrupted = true;
      db.flights.forEach((f) => (f.avail = -999));
      db.bookings.filter((b) => b.status === "Confirmed").forEach((b) => (b.status = "CORRUPT_ERR"));
      maintState.costs.corrective += 300000;
      maintState.costs.adaptive   += 50000;
      maintLog("💥 DATA CORRUPTION SIMULATED!", "error");
      maintLog("All availSeats → -999 | All booking statuses → CORRUPT_ERR", "error");
      maintLog("Estimated downtime loss: PKR 300,000/hr", "error");
      break;

    case 2: // Inspect
      maintLog("🔍 STEP 3: Inspecting damage...", "warn");
      maintLog("Flights table: availSeats = -999 on ALL records", "error");
      maintLog("Bookings table: status = CORRUPT_ERR on ALL confirmed", "error");
      maintLog("System INOPERABLE until fix is applied", "error");
      break;

    case 3: // Restore
      if (!maintState.backup) {
        return res.status(400).json({ success: false, message: "No backup to restore from." });
      }
      // Restore all data from backup
      maintState.backup.flights.forEach((bf) => {
        const f = db.flights.find((x) => x.id === bf.id);
        if (f) Object.assign(f, bf);
      });
      maintState.backup.bookings.forEach((bb) => {
        const b = db.bookings.find((x) => x.id === bb.id);
        if (b) Object.assign(b, bb);
      });
      maintState.corrupted = false;
      maintState.costs.corrective += 200000;
      maintLog("♻️ STEP 4: Corrective maintenance applied.", "success");
      maintLog("Restored from backup in < 1 second.", "success");
      maintLog(`Recovery cost incurred: PKR ${(maintState.costs.corrective + maintState.costs.adaptive).toLocaleString()}`, "warn");
      break;

    case 4: // Harden
      maintState.costs.preventive += 5000;
      maintLog("🛡️ STEP 5: Preventive hardening applied.", "success");
      maintLog("✅ Seat conflict detection: ENABLED", "success");
      maintLog("✅ Delete-flight protection: ENABLED", "success");
      maintLog("✅ Input validation layer: ACTIVE", "success");
      maintLog("✅ Audit logging: ACTIVE", "success");
      maintLog("✅ Auto backup schedule: CONFIGURED", "success");
      break;

    case 5: // Report
      const total = maintState.costs.corrective + maintState.costs.adaptive + maintState.costs.preventive;
      maintLog("📊 ══ MAINTENANCE COST REPORT ══", "info");
      maintLog(`Corrective: PKR ${maintState.costs.corrective.toLocaleString()}`, "warn");
      maintLog(`Adaptive:   PKR ${maintState.costs.adaptive.toLocaleString()}`, "warn");
      maintLog(`Preventive: PKR ${maintState.costs.preventive.toLocaleString()}`, "success");
      maintLog(`TOTAL COST: PKR ${total.toLocaleString()}`, "error");
      maintLog("Prevention (PKR 5K) vs Recovery (PKR 550K+) = 110:1 ratio!", "warn");
      maintLog("✅ Simulation complete.", "success");
      break;

    default:
      return res.status(400).json({ success: false, message: "Invalid phase number (0–5)." });
  }

  maintState.phase = n + 1;
  res.json({ success: true, data: maintState });
});

// POST /api/maintenance/reset
router.post("/reset", (req, res) => {
  maintState = { phase: 0, backup: null, costs: { corrective: 0, adaptive: 0, preventive: 0 }, logs: [], corrupted: false };
  db.addLog("↩ Maintenance demo reset.", "info");
  res.json({ success: true, message: "Maintenance demo reset.", data: maintState });
});

// ── BACKUP & RESTORE ─────────────────────────────────────────

// POST /api/maintenance/backup
router.post("/backup", (req, res) => {
  const snap = {
    flights:  JSON.parse(JSON.stringify(db.flights)),
    bookings: JSON.parse(JSON.stringify(db.bookings)),
    users:    JSON.parse(JSON.stringify(db.users)),
    time:     new Date().toISOString(),
  };
  maintState.backup = snap;
  db.addLog("💾 System backup created.", "success");
  res.json({
    success: true,
    message: `Backup created at ${snap.time}`,
    data: { flights: snap.flights.length, bookings: snap.bookings.length, users: snap.users.length },
  });
});

// POST /api/maintenance/restore
router.post("/restore", (req, res) => {
  if (!maintState.backup) {
    return res.status(400).json({ success: false, message: "No backup available." });
  }
  // Restore
  db.flights.length  = 0; maintState.backup.flights.forEach((f)  => db.flights.push(f));
  db.bookings.length = 0; maintState.backup.bookings.forEach((b) => db.bookings.push(b));
  db.users.length    = 0; maintState.backup.users.forEach((u)    => db.users.push(u));

  db.addLog("♻️ System restored from backup.", "success");
  res.json({ success: true, message: "System restored from backup." });
});

// ── SYSTEM LOGS ──────────────────────────────────────────────

// GET /api/maintenance/logs
router.get("/logs", (req, res) => {
  res.json({ success: true, data: db.logs });
});

// DELETE /api/maintenance/logs
router.delete("/logs", (req, res) => {
  db.logs.length = 0;
  res.json({ success: true, message: "Logs cleared." });
});

// ── COCOMO II CALCULATOR ─────────────────────────────────────

// POST /api/maintenance/cocomo
router.post("/cocomo", (req, res) => {
  const {
    devCost = 2000000,
    kloc    = 1.072,
    act     = 25,
    life    = 10,
  } = req.body;

  const cf     = 2.5; // complexity factor
  const annual = devCost * (act / 100) * cf * Math.max(kloc, 0.1);
  const total  = annual * life;
  const ratio  = total / devCost;

  res.json({
    success: true,
    data: {
      annualMaintenanceCost: Math.round(annual),
      lifetimeTotalCost:     Math.round(total),
      maintDevRatio:         parseFloat(ratio.toFixed(1)),
      initialDevCost:        devCost,
      distribution: {
        corrective: Math.round(total * 0.21),
        adaptive:   Math.round(total * 0.25),
        perfective: Math.round(total * 0.50),
        preventive: Math.round(total * 0.04),
      },
    },
  });
});

module.exports = router;
