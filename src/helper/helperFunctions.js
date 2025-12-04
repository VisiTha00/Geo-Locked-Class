export function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function getDistanceToSession(activeSession, userLocation) {
  if (!activeSession || !userLocation) return null;

  const earthRadius = 6371e3;
  const userLatitudeInRadius = (userLoc.latitude * Math.PI) / 180;
  const sessionLatitudeInRadius = (sessionLoc.latitude * Math.PI) / 180;
  const deltaLatitudeInRadius =
    ((sessionLoc.latitude - userLoc.latitude) * Math.PI) / 180;
  const deltaLongitudeInRadius =
    ((sessionLoc.longitude - userLoc.longitude) * Math.PI) / 180;

  const a =
    Math.sin(deltaLatitudeInRadius / 2) * Math.sin(deltaLatitudeInRadius / 2) +
    Math.cos(userLatitudeInRadius) *
      Math.cos(sessionLatitudeInRadius) *
      Math.sin(deltaLongitudeInRadius / 2) *
      Math.sin(deltaLongitudeInRadius / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = earthRadius * c;

  return distance;
}
