export function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function getDistanceToSession() {
  if (!activeSession || !userLocation) return null;

  const R = 6371e3;
  const φ1 = (userLocation.latitude * Math.PI) / 180;
  const φ2 = (activeSession.location.latitude * Math.PI) / 180;
  const Δφ =
    ((activeSession.location.latitude - userLocation.latitude) * Math.PI) / 180;
  const Δλ =
    ((activeSession.location.longitude - userLocation.longitude) * Math.PI) /
    180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}
