// routes/hospitals.js
const express = require("express");
const router = express.Router();
const { getAllHospitals: getHospitals } = require("../data/hospitalStore");
const { getRankedHospitals, getDistanceKm, rankPlacesHospitals } = require("../services/matchEngine");
const { fetchNearbyHospitals } = require("../services/placesService");

const CURATED_COVERAGE_RADIUS_KM = 60;

router.get("/", (req, res) => {
  res.json(getHospitals());
});

router.get("/match", async (req, res) => {
  const { injuries, lat, lng } = req.query;

  if (!injuries || !lat || !lng) {
    return res.status(400).json({
      error: "Missing required query params: injuries, lat, lng",
    });
  }

  const injuryTags = injuries.split(",").map((s) => s.trim());
  const patientLocation = { lat: parseFloat(lat), lng: parseFloat(lng) };
  const hospitals = getHospitals(); // always the current live-updated list

  const nearestCuratedKm = Math.min(
    ...hospitals.map((h) =>
      getDistanceKm(patientLocation.lat, patientLocation.lng, h.location.lat, h.location.lng)
    )
  );

  if (nearestCuratedKm <= CURATED_COVERAGE_RADIUS_KM) {
    const ranked = getRankedHospitals(injuryTags, patientLocation, hospitals);
    return res.json(ranked);
  }

  try {
    const nearby = await fetchNearbyHospitals(patientLocation.lat, patientLocation.lng);
    if (nearby.length === 0) {
      const ranked = getRankedHospitals(injuryTags, patientLocation, hospitals);
      return res.json(ranked);
    }
    const ranked = rankPlacesHospitals(nearby, patientLocation);
    return res.json(ranked);
  } catch (err) {
    console.error("Places fallback failed:", err.message);
    const ranked = getRankedHospitals(injuryTags, patientLocation, hospitals);
    return res.json(ranked);
  }
});

module.exports = router;