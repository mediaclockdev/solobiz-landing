"use client";
export interface GeolocationData {
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
  accuracy: number;
}

export function getCurrentLocation(): Promise<GeolocationData> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        
        try {
          // Use reverse geocoding to get city and country
          const locationData = await reverseGeocode(latitude, longitude);
          
          resolve({
            latitude,
            longitude,
            city: locationData.city,
            country: locationData.country,
            accuracy: Math.round(accuracy || 0)
          });
        } catch (error) {
          // Fallback: return coordinates without city/country
          resolve({
            latitude,
            longitude,
            accuracy: Math.round(accuracy || 0)
          });
        }
      },
      (error) => {
        reject(new Error(`Geolocation error: ${error.message}`));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  });
}

async function reverseGeocode(lat: number, lon: number): Promise<{ city?: string; country?: string }> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`
    );
    
    if (!response.ok) {
      throw new Error('Reverse geocoding failed');
    }
    
    const data = await response.json();
    const address = data.address || {};
    
    return {
      city: address.city || address.town || address.village || address.hamlet,
      country: address.country
    };
  } catch (error) {
    console.warn('Reverse geocoding failed:', error);
    return {};
  }
}

export function addLocationToContact(contactData: any): Promise<any> {
  return getCurrentLocation().then(location => ({
    ...contactData,
    location,
    dateAdded: new Date().toLocaleString()
  })).catch(error => {
    console.warn('Could not add location to contact:', error);
    return {
      ...contactData,
      dateAdded: new Date().toLocaleString()
    };
  });
}