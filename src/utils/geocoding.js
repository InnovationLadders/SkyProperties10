const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const respectRateLimit = async () => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await delay(MIN_REQUEST_INTERVAL - timeSinceLastRequest);
  }

  lastRequestTime = Date.now();
};

export const geocodeAddress = async (address) => {
  if (!address || address.trim() === '') {
    return null;
  }

  try {
    await respectRateLimit();

    const params = new URLSearchParams({
      q: address,
      format: 'json',
      limit: '1',
      addressdetails: '1',
    });

    const response = await fetch(`${NOMINATIM_BASE_URL}/search?${params}`, {
      headers: {
        'User-Agent': 'SkyProperties10/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`Geocoding request failed: ${response.status}`);
    }

    const data = await response.json();

    if (data && data.length > 0) {
      const result = data[0];
      return {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        displayName: result.display_name,
      };
    }

    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
};

export const reverseGeocode = async (lat, lng) => {
  try {
    await respectRateLimit();

    const params = new URLSearchParams({
      lat: lat.toString(),
      lon: lng.toString(),
      format: 'json',
      addressdetails: '1',
    });

    const response = await fetch(`${NOMINATIM_BASE_URL}/reverse?${params}`, {
      headers: {
        'User-Agent': 'SkyProperties10/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`Reverse geocoding request failed: ${response.status}`);
    }

    const data = await response.json();

    if (data && data.display_name) {
      return {
        address: data.display_name,
        city: data.address?.city || data.address?.town || data.address?.village,
        country: data.address?.country,
      };
    }

    return null;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
};
