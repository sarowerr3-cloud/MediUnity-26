import React, { useEffect, useRef, useState } from 'react';

export default function MapViewer({ locations, center = [23.4605, 91.1809], zoom = 12 }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const [leafletLoaded, setLeafletLoaded] = useState(!!window.L);

  useEffect(() => {
    if (!window.L) {
      // Load Leaflet CSS
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);

      // Load Leaflet JS
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.async = true;
      script.onload = () => {
        setLeafletLoaded(true);
      };
      document.body.appendChild(script);
      
      return () => {
        // Optional cleanup
      };
    }
  }, []);

  useEffect(() => {
    if (leafletLoaded && mapRef.current) {
      if (!mapInstance.current) {
        mapInstance.current = window.L.map(mapRef.current).setView(center, zoom);

        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(mapInstance.current);
      }

      // Clear existing markers
      mapInstance.current.eachLayer((layer) => {
        if (layer instanceof window.L.Marker) {
          mapInstance.current.removeLayer(layer);
        }
      });

      // Add new markers
      locations.forEach(loc => {
        if (loc.lat && loc.lng) {
          const marker = window.L.marker([loc.lat, loc.lng]).addTo(mapInstance.current);
          if (loc.popup) {
            marker.bindPopup(`<b>${loc.name || 'Location'}</b><br/>${loc.popup}`);
          }
        }
      });
    }
  }, [leafletLoaded, locations, center, zoom]);

  return (
    <div 
      ref={mapRef} 
      style={{ width: '100%', height: '100%', minHeight: '300px', borderRadius: '0.75rem', zIndex: 0 }} 
    />
  );
}
