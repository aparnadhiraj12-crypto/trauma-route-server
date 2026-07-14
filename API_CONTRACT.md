// matchEngine.js
const requirementRules = require("../data/requirementRules.json");

function getDistanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function getCombinedRequirements(injuryTags) {
  const specialties = new Set();
  const resources = new Set();
  let maxPriorityWeight = 0;

  injuryTags.forEach((tag) => {
    const rule = requirementRules[tag];
    if (!rule) return;

    rule.requiredSpecialties.forEach((s) => specialties.add(s));
    rule.requiredResources.forEach((r) => resources.add(r));

    const weight = requirementRules.priorityWeights[rule.priority] || 1;
    if (weight > maxPriorityWeight) maxPriorityWeight = weight;
  });

  return {
    specialties: Array.from(specialties),
    resources: Array.from(resources),
    priorityWeight: maxPriorityWeight,
  };
}

function scoreHospital(hospital, combinedReq) {
  const totalRequirements =
    combinedReq.specialties.length + combinedReq.resources.length;

  if (totalRequirements === 0) {
    return { score: 100, missing: [] };
  }

  let satisfied = 0;
  const missing = [];

  combinedReq.specialties.forEach((spec) => {
    const beds = hospital.specialties ? hospital.specialties[spec] : undefined;
    if (typeof beds === "number" && beds > 0) {
      satisfied += 1;
    } else {
      missing.push(spec);
    }
  });

  combinedReq.resources.forEach((res) => {
    const value = hospital.resources ? hospital.resources[res] : undefined;
    const ok =
      typeof value === "boolean" ? value === true : typeof value === "number" && value > 0;
    if (ok) {
      satisfied += 1;
    } else {
      missing.push(res);
    }
  });

  const score = Math.round((satisfied / totalRequirements) * 100);
  return { score, missing };
}

function getRankedHospitals(injuryTags, patientLocation, hospitals) {
  const combinedReq = getCombinedRequirements(injuryTags);

  const ranked = hospitals.map((hospital) => {
    const { score, missing } = scoreHospital(hospital, combinedReq);
    const distanceKm = getDistanceKm(
      patientLocation.lat,
      patientLocation.lng,
      hospital.location.lat,
      hospital.location.lng
    );

    const rankingValue = score - distanceKm * 0.5;

    return {
      hospitalId: hospital.id,
      name: hospital.name,
      matchScore: score,
      missingCapabilities: missing,
      distanceKm: Math.round(distanceKm * 10) / 10,
      rankingValue,
      location: hospital.location,
      // Included so the frontend can show open beds per specialty / OT slots
      // without a second request.
      specialties: hospital.specialties,
      resources: hospital.resources,
    };
  });

  ranked.sort((a, b) => b.rankingValue - a.rankingValue);

  return ranked;
}

function rankPlacesHospitals(placesHospitals, patientLocation) {
  const ranked = placesHospitals.map((hospital) => {
    const distanceKm = getDistanceKm(
      patientLocation.lat,
      patientLocation.lng,
      hospital.location.lat,
      hospital.location.lng
    );

    return {
      hospitalId: hospital.id,
      name: hospital.name,
      address: hospital.address,
      matchScore: null,
      missingCapabilities: [],
      capabilitiesUnknown: true,
      distanceKm: Math.round(distanceKm * 10) / 10,
      rankingValue: -distanceKm,
      location: hospital.location,
      source: "google_places",
    };
  });

  ranked.sort((a, b) => b.rankingValue - a.rankingValue);
  return ranked;
}

module.exports = {
  getRankedHospitals,
  getCombinedRequirements,
  scoreHospital,
  getDistanceKm,
  rankPlacesHospitals,
};