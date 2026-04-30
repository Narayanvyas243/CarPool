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
  const straightDistance = R * c; // Distance in km
  
  // Apply a heuristic road multiplier based on region topography
  let multiplier = 1.35; // Default Dehradun winding factor
  
  // Mussoorie or high altitude areas (latitude > 30.43 approx)
  const isHillRoute = lat1 > 30.43 || lat2 > 30.43;
  
  if (isHillRoute) {
    multiplier = 2.5; // Mountain roads are very circuitous
  } else if (straightDistance < 5) {
    multiplier = 1.2; // Short local routes are more direct
  } else {
    multiplier = 1.4; // Cross-city routes
  }

  return straightDistance * multiplier;
};

/**
 * Estimates a "Fair Price" for the ride based on distance.
 * Uses a tiered structure for realistic carpool pricing.
 */
export const getFairPriceEstimate = (distanceKm: number): number => {
  let estimate = 0;
  
  if (distanceKm < 5) {
    // Short routes (e.g., Bidholi to Kandoli)
    estimate = 20 + (distanceKm * 10);
  } else if (distanceKm < 15) {
    // Medium routes (e.g., Bidholi to Prem Nagar)
    estimate = 30 + (distanceKm * 12);
  } else {
    // Long routes (e.g., Bidholi to Clock Tower, Railway Station, Mussoorie)
    estimate = 40 + (distanceKm * 12);
  }

  // Round to nearest 10 for cleaner numbers (e.g., 138 -> 140)
  const rounded = Math.round(estimate / 10) * 10;
  return Math.max(50, rounded); // Minimum fare of 50
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
