import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface MapPoint {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  priority: number;
}

interface MapComponentProps {
  points: MapPoint[];
  center: [number, number];
  zoom?: number;
}

// Створюємо кастомні іконки для різних типів точок
const createCustomIcon = (color: string, isWarehouse: boolean = false) => {
  const iconHtml = isWarehouse
    ? `<div style="background-color: ${color}; width: 35px; height: 35px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
         <span style="transform: rotate(45deg); color: white; font-weight: bold; font-size: 16px;">📦</span>
       </div>`
    : `<div style="background-color: ${color}; width: 32px; height: 32px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
         <span style="transform: rotate(45deg); color: white; font-weight: bold; font-size: 14px;">📍</span>
       </div>`;
  
  return L.divIcon({
    html: iconHtml,
    className: 'custom-marker',
    iconSize: [isWarehouse ? 35 : 32, isWarehouse ? 35 : 32],
    iconAnchor: [isWarehouse ? 17 : 16, isWarehouse ? 35 : 32],
    popupAnchor: [0, isWarehouse ? -35 : -32],
  });
};

// Функція для вибору кольору маркера за пріоритетом
const getMarkerColor = (priority: number, isWarehouse: boolean = false): string => {
  if (isWarehouse) return '#6366f1'; // indigo для складу
  if (priority >= 8) return '#ef4444'; // червоний
  if (priority >= 5) return '#f59e0b'; // помаранчевий
  return '#10b981'; // зелений
};

export function MapComponent({ points, center, zoom = 12 }: MapComponentProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const polylineRef = useRef<L.Polyline | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Ініціалізація карти
    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current).setView(center, zoom);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(mapRef.current);
    }

    // Очищення старих маркерів
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Очищення старої лінії
    if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }

    // Додавання нових маркерів
    points.forEach((point, index) => {
      const isWarehouse = point.id === 'warehouse';
      const color = getMarkerColor(point.priority, isWarehouse);
      const customIcon = createCustomIcon(color, isWarehouse);
      
      const marker = L.marker([point.lat, point.lng], { icon: customIcon })
        .addTo(mapRef.current!)
        .bindPopup(
          `<div style="min-width: 200px;">
            <p style="font-weight: 600; margin: 0 0 8px 0; font-size: 15px;">${isWarehouse ? '🏢 ' : ''}${point.name}</p>
            <p style="font-size: 13px; margin: 0 0 6px 0; color: #666;">${point.address}</p>
            ${!isWarehouse ? `<p style="font-size: 13px; margin: 0;"><strong>Порядок:</strong> ${index}</p>` : ''}
            ${!isWarehouse ? `<p style="font-size: 13px; margin: 0;"><strong>Терміновість:</strong> ${point.priority}/10</p>` : ''}
          </div>`
        );
      markersRef.current.push(marker);
    });

    // Додавання лінії маршруту
    if (points.length > 1) {
      const positions: L.LatLngExpression[] = points.map((p) => [p.lat, p.lng]);
      polylineRef.current = L.polyline(positions, { 
        color: "#3b82f6", 
        weight: 4,
        opacity: 0.7,
        dashArray: '10, 10'
      }).addTo(mapRef.current!);
      
      // Підлаштування zoom для відображення всіх точок
      const bounds = L.latLngBounds(positions);
      mapRef.current!.fitBounds(bounds, { padding: [50, 50] });
    } else if (points.length === 1) {
      mapRef.current!.setView([points[0].lat, points[0].lng], zoom);
    } else {
      mapRef.current!.setView(center, zoom);
    }

    // Cleanup
    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      if (polylineRef.current) {
        polylineRef.current.remove();
      }
    };
  }, [points, center, zoom]);

  // Cleanup при unmount
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return <div ref={mapContainerRef} style={{ height: "100%", width: "100%", zIndex: 1 }} />;
}