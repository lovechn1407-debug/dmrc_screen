// Calculate distance between two lat/lng points in kilometers using Haversine formula
export function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Calculate distance in meters
export function haversineDistanceMeters(lat1, lon1, lat2, lon2) {
  return haversineDistanceKm(lat1, lon1, lat2, lon2) * 1000;
}

function toRad(degrees) {
  return (degrees * Math.PI) / 180;
}

// Calculate total length of a path (points array [{lat, lng}])
export function calculatePathLengthKm(points) {
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    total += haversineDistanceKm(points[i].lat, points[i].lng, points[i + 1].lat, points[i + 1].lng);
  }
  return total;
}

// Generate quadratic/cubic Bezier points between start point, control points, and end point
export function generateBezierPath(start, controlPoints, end, steps = 15) {
  const allPoints = [start, ...controlPoints, end];
  if (allPoints.length <= 2) return [start, end];

  const path = [];
  for (let t = 0; t <= 1; t += 1 / steps) {
    path.push(deCasteljau(allPoints, t));
  }
  return path;
}

function deCasteljau(points, t) {
  if (points.length === 1) return points[0];
  const nextStage = [];
  for (let i = 0; i < points.length - 1; i++) {
    nextStage.push({
      lat: (1 - t) * points[i].lat + t * points[i + 1].lat,
      lng: (1 - t) * points[i].lng + t * points[i + 1].lng
    });
  }
  return deCasteljau(nextStage, t);
}
