const PLACES_URL = "https://places.googleapis.com/v1/places:searchNearby";

async function fetchNearbyHospitals(lat, lng, radiusMeters = 25000) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    console.warn("GOOGLE_PLACES_API_KEY not set — skipping Places fallback.");
    return [];
  }

  const body = {
    includedTypes: ["hospital"],
    maxResultCount: 20,
    rankPreference: "DISTANCE",
    locationRestriction: {
      circle: {
        center: { latitude: lat, longitude: lng },
        radius: Math.min(radiusMeters, 50000), // API hard cap
      },
    },
  };

  const res = await fetch(PLACES_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.location,places.formattedAddress,places.businessStatus",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Places API error ${res.status}: ${text}`);
  }

  const data = await res.json();
  const places = data.places || [];

  return places
    .filter((p) => p.businessStatus !== "CLOSED_PERMANENTLY")
    .map((p) => ({
      id: p.id,
      name: p.displayName?.text || "Unnamed hospital",
      address: p.formattedAddress || null,
      location: {
        lat: p.location?.latitude,
        lng: p.location?.longitude,
      },
      source: "google_places",
    }));
}

module.exports = { fetchNearbyHospitals };