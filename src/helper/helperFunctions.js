export function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function getDistanceToSession(activeSession, userLocation) {
  if (!activeSession || !userLocation) return null;
  if (
    !activeSession.location ||
    !activeSession.location.latitude ||
    !activeSession.location.longitude
  )
    return null;

  const earthRadius = 6371e3;
  const sessionLat = activeSession.location.latitude;
  const sessionLon = activeSession.location.longitude;

  const userLatitudeInRadius = (userLocation.latitude * Math.PI) / 180;
  const sessionLatitudeInRadius = (sessionLat * Math.PI) / 180;
  const deltaLatitudeInRadius =
    ((sessionLat - userLocation.latitude) * Math.PI) / 180;
  const deltaLongitudeInRadius =
    ((sessionLon - userLocation.longitude) * Math.PI) / 180;

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
