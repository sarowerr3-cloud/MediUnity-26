// Uses the Haversine formula to calculate distance in km between two lat/lon points.
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) return null;
  if (lat1 === null || lon1 === null || lat2 === null || lon2 === null) return null;
  
  const R = 6371; // Radius of Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  return R * c; // Distance in kilometers
};

// Known coordinates for Bangladesh Districts & Major Cities
export const BANGLADESH_LOCATION_COORDS = {
  cumilla: { lat: 23.46, lng: 91.18 },
  comilla: { lat: 23.46, lng: 91.18 },
  dhaka: { lat: 23.8103, lng: 90.4125 },
  chattogram: { lat: 22.3569, lng: 91.7832 },
  chittagong: { lat: 22.3569, lng: 91.7832 },
  sylhet: { lat: 24.8949, lng: 91.8687 },
  rajshahi: { lat: 24.3745, lng: 88.6042 },
  khulna: { lat: 22.8456, lng: 89.5403 },
  barishal: { lat: 22.7010, lng: 90.3535 },
  barisal: { lat: 22.7010, lng: 90.3535 },
  rangpur: { lat: 25.7439, lng: 89.2752 },
  mymensingh: { lat: 24.7471, lng: 90.4203 },
  "cox's bazar": { lat: 21.4272, lng: 92.0058 },
  gazipur: { lat: 23.9999, lng: 90.4203 },
  narayanganj: { lat: 23.6238, lng: 90.5000 },
  bogra: { lat: 24.8481, lng: 89.3730 },
  bogura: { lat: 24.8481, lng: 89.3730 },
  pabna: { lat: 24.0064, lng: 89.2372 },
  feni: { lat: 23.0159, lng: 91.3976 },
  noakhali: { lat: 22.8696, lng: 91.0994 },
  brahmanbaria: { lat: 23.9571, lng: 91.1119 },
  chandpur: { lat: 23.2321, lng: 90.6631 },
};
