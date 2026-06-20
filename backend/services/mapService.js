export function createGoogleMap(latitude, longitude) {
  return `https://www.google.com/maps?q=${latitude},${longitude}`;
}

export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export function estimateTravelTime(distanceKm) {
  const averageSpeedKmPerHour = 30;

  return Math.round((distanceKm / averageSpeedKmPerHour) * 60);
}

export function calculateTravelInfo(current, next) {
  if (
    !current?.latitude ||
    !current?.longitude ||
    !next?.latitude ||
    !next?.longitude
  ) {
    return {
      distanceKm: null,
      travelMinutes: null
    };
  }

  const distanceKm = calculateDistance(
    current.latitude,
    current.longitude,
    next.latitude,
    next.longitude
  );

  const travelMinutes = estimateTravelTime(distanceKm);

  return {
    distanceKm: Number(distanceKm.toFixed(2)),
    travelMinutes
  };
}

function toRadians(degree) {
  return (degree * Math.PI) / 180;
}
