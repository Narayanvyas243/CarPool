/**
 * Utility to calculate fare estimates and comparisons for campus carpooling.
 */

/**
 * Calculates the Haversine distance between two points in kilometers.
 */
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
};

/**
 * Estimates a "Fair Price" for the ride based on distance.
 * This is used for comparison with the driver's set price.
 */
export const getFairPriceEstimate = (distanceKm: number): number => {
  const baseFare = 30;
  const perKmFare = 8; // Student-friendly rate
  const estimate = baseFare + (distanceKm * perKmFare);
  return Math.max(50, Math.round(estimate));
};

/**
 * Determines the price status based on the driver's price vs the estimate.
 */
export const getPriceStatus = (driverPrice: number, fairPrice: number) => {
  const ratio = driverPrice / fairPrice;
  
  if (ratio < 0.8) return { label: "Budget Friendly", color: "text-emerald-500", bg: "bg-emerald-50", type: "cheap" };
  if (ratio > 1.3) return { label: "Premium Rate", color: "text-amber-600", bg: "bg-amber-50", type: "premium" };
  return { label: "Fair Price", color: "text-blue-500", bg: "bg-blue-50", type: "fair" };
};
