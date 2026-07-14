// routes/alerts.js
const express = require("express");
const router = express.Router();

let alerts = [];
let nextId = 1;

router.post("/", (req, res) => {
  const { hospitalId, injuries, eta, vitals } = req.body;

  if (!hospitalId || !injuries || eta === undefined) {
    return res.status(400).json({
      error: "Missing required fields: hospitalId, injuries, eta",
    });
  }

  const alert = {
    id: `alert_${nextId++}`,
    hospitalId,
    injuries,
    eta,
    
    vitals: vitals || {},
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  alerts.push(alert);

  const io = req.app.get("io");
  if (io) {
    io.emit("alert:new", alert);
  }

  res.status(201).json(alert);
});

// GET /api/alerts/:hospitalId
router.get("/:hospitalId", (req, res) => {
  const { hospitalId } = req.params;
  const hospitalAlerts = alerts.filter((a) => a.hospitalId === hospitalId);
  res.json(hospitalAlerts);
});

router.post("/:id/accept", (req, res) => {
  const { id } = req.params;
  const alert = alerts.find((a) => a.id === id);

  if (!alert) {
    return res.status(404).json({ error: "Alert not found" });
  }

  alert.status = "accepted";

  const io = req.app.get("io");
  if (io) {
    io.emit("alert:accepted", { alertId: alert.id, hospitalId: alert.hospitalId });
  }

  res.json(alert);
});

module.exports = router;