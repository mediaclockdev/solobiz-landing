"use client";

import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface Contact {
  name: string;
  location?: {
    latitude: number;
    longitude: number;
    city?: string;
    country?: string;
  };
}

interface WorldMapProps {
  className?: string;
  contacts?: Contact[];
}

//export function WorldMap({ className, contacts = [] }: WorldMapProps) {
export default function WorldMap({
  className = "",
  contacts = [],
}: WorldMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Initialize map
    map.current = L.map(mapContainer.current, {
      center: [20, 0], // Center on world view
      zoom: 2,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      dragging: true,
    });

    // Add OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 18,
    }).addTo(map.current);

    // Add markers for actual contact locations
    contacts.forEach((contact) => {
      if (contact.location) {
        const { latitude, longitude, city, country } = contact.location;
        const locationName =
          city && country ? `${city}, ${country}` : "Unknown Location";

        // Create custom icon with profile image
        const profileIcon = L.divIcon({
          className: "custom-profile-marker",
          html: `
            <div style="
              width: 40px; 
              height: 40px; 
              border-radius: 50%; 
              border: 3px solid white; 
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              overflow: hidden;
              background: white;
            ">
              <img 
                src="${
                  (contact as any).avatar ||
                  "/lovable-uploads/logo_color_correct.png"
                }" 
                alt="${contact.name}"
                style="
                  width: 100%; 
                  height: 100%; 
                  background-color: rgba(128, 128, 128, 0.86);
                  object-fit: cover;
                "
                onerror="this.src='/lovable-uploads/logo_color_correct.png'"
              />
            </div>
          `,
          iconSize: [40, 40],
          iconAnchor: [20, 20],
          popupAnchor: [0, -20],
        });

        const marker = L.marker([latitude, longitude], {
          icon: profileIcon,
        }).addTo(map.current!).bindPopup(`
            <div style="text-align: center;">
              <img 
                src="${
                  (contact as any).avatar ||
                  "/lovable-uploads/logo_color_correct.png"
                }" 
                alt="${contact.name}"
                style="
                background-color: rgba(128, 128, 128, 0.86);
                  width: 60px; 
                  height: 60px; 
                  border-radius: 50%; 
                  border: 2px solid white;
                  margin-bottom: 8px;
                  object-fit: cover;
                  margin-left: auto;
                  margin-right: auto;
                "
                onerror="this.src='/lovable-uploads/logo_color_correct.png'"
              />
              <div>
                <b>${contact.name}</b><br>
                <small>${locationName}</small><br>
                <small>Lat: ${Number(latitude).toFixed(4)}, Lng: ${Number(longitude).toFixed(
          4
        )}</small>
              </div>
            </div>
          `);
      }
    });

    // Cleanup function
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [mapContainer]);

  return (
    <div
      ref={mapContainer}
      className={`w-full h-full min-h-[400px] rounded-lg ${className}`}
    />
  );
}
