const seedHospitals = require("./hospitals.json");

let hospitals = seedHospitals.map((h) => ({
  ...h,
  specialties: { ...h.specialties },
  resources: { ...h.resources },
}));

function getAllHospitals() {
  return hospitals;
}

function getHospitalById(id) {
  return hospitals.find((h) => h.id === id);
}

// Merges a partial update into a hospital's specialties/resources.
// payload shape: { hospitalId, specialties?: {...}, resources?: {...} }
function updateHospitalStatus(payload) {
  const hospital = getHospitalById(payload.hospitalId);
  if (!hospital) return null;

  if (payload.specialties) {
    for (const [key, value] of Object.entries(payload.specialties)) {
      // specialties now hold bed counts (numbers), not availability booleans.
      if (typeof value === "number") {
        hospital.specialties[key] = Math.max(0, value);
      }
    }
  }
  if (payload.resources) {
    for (const [key, value] of Object.entries(payload.resources)) {
      hospital.resources[key] = typeof value === "number" ? Math.max(0, value) : value;
    }
  }

  return hospital;
}

module.exports = { getAllHospitals, getHospitalById, updateHospitalStatus };