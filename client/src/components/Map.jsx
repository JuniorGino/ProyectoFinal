/**
 * COMPONENTE DE MAPA INTERACTIVO - Map.jsx
 * 
 * Este archivo implementa el mapa interactivo utilizando la biblioteca Leaflet.js
 * adaptada para React mediante `react-leaflet`.
 * 
 * Funcionalidades clave:
 * 1. **MapController:** Controla la cámara y zoom del mapa en tiempo real, volando (`flyTo`) a la ubicación 
 *    del usuario o del recordatorio seleccionado de forma fluida. Corrige problemas de redimensionamiento de Leaflet.
 * 2. **MapEvents:** Escucha clics en cualquier punto del mapa y delega las coordenadas a `onMapClick` para la geocodificación.
 * 3. **Carga de Marcadores:**
 *    - Renderiza el marcador personalizado con animación de pulso para la ubicación del usuario (`userLocation`).
 *    - Renderiza marcadores clásicos para todos los recordatorios geolocalizados que estén activos.
 *    - Dibuja un círculo translúcido (`<Circle>`) que representa el radio de cobertura configurado por el usuario para disparar la alerta.
 */

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Solución al problema de carga de iconos por defecto de Leaflet al empaquetar con Vite
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

/**
 * Controlador de mapas interno: gestiona el centrado y redimensionamiento dinámico del mapa.
 */
function MapController({ center }) {
    const map = useMap();
    
    // Vuela la cámara hacia la nueva ubicación seleccionada de forma animada
    useEffect(() => {
        if (center) {
            map.flyTo(center, map.getZoom(), { duration: 2 });
        }
    }, [center, map]);

    // Corrige problemas visuales de carga inicial del mapa en contenedores flexibles invisibles
    useEffect(() => {
        const timeout = setTimeout(() => {
            map.invalidateSize();
        }, 100);
        return () => clearTimeout(timeout);
    }, [map]);

    return null;
}

/**
 * Escucha clics de usuario en el mapa y devuelve las coordenadas resultantes.
 */
function MapEvents({ onMapClick }) {
    useMapEvents({
        click: (e) => {
            onMapClick(e.latlng); // Ejecuta el callback pasando lat y lng
        },
    });
    return null;
}

/**
 * Componente principal que estructura y carga el mapa Leaflet.
 */
const MapView = ({ reminders, userLocation, onMapClick, onReminderClick }) => {
    // Madrid es el centro inicial por defecto si el navegador aún no geolocalizó al usuario
    const defaultCenter = [40.4168, -3.7038];
    const [center, setCenter] = useState(defaultCenter);

    // Ajusta el centro del mapa cuando se actualiza la posición del usuario
    useEffect(() => {
        if (userLocation) {
            setCenter([userLocation.latitude, userLocation.longitude]);
        }
    }, [userLocation]);

    // Diseña el icono personalizado animado para la ubicación del usuario
    const userIcon = L.divIcon({
        className: 'user-location-marker',
        html: '<div class="marker-pulse"></div><div class="custom-marker" style="background: var(--accent)"></div>',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    });

    return (
        <div className="map-container" style={{ height: '100%', width: '100%', background: '#1a1a1a' }}>
            <MapContainer
                center={defaultCenter}
                zoom={13}
                scrollWheelZoom={true}
                zoomControl={false}
                style={{ height: '100%', width: '100%' }}
            >
                {/* Capa de mosaicos gráficos de OpenStreetMap */}
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Registro de clics y posicionamiento dinámico */}
                <MapEvents onMapClick={onMapClick} />
                <MapController center={userLocation ? [userLocation.latitude, userLocation.longitude] : defaultCenter} />

                {/* Marcador de la ubicación del usuario actual (si no es una simulación de fallo) */}
                {userLocation && !userLocation.isFallback && (
                    <Marker position={[userLocation.latitude, userLocation.longitude]} icon={userIcon}>
                        <Popup>Tu ubicación actual</Popup>
                    </Marker>
                )}

                {/* Dibuja marcadores y áreas circulares para cada recordatorio activo geolocalizado */}
                {reminders.filter(r => r.status === 'active').map(reminder => (
                    <React.Fragment key={reminder._id || reminder.id}>
                        {/* Marcador del destino */}
                        <Marker
                            position={[reminder.location.coordinates[1], reminder.location.coordinates[0]]}
                            eventHandlers={{
                                click: () => onReminderClick(reminder),
                            }}
                        >
                            <Popup>
                                <strong>{reminder.title}</strong><br />
                                {reminder.address}<br />
                                <small>Radio: {reminder.radius || 1} km</small>
                            </Popup>
                        </Marker>
                        
                        {/* Círculo translúcido que delimita el radio de alerta en metros */}
                        <Circle
                            center={[reminder.location.coordinates[1], reminder.location.coordinates[0]]}
                            radius={(reminder.radius || 1) * 1000}
                            pathOptions={{
                                color: 'var(--primary)',
                                fillColor: 'var(--primary)',
                                fillOpacity: 0.1,
                                weight: 1,
                                dashArray: '5, 5'
                            }}
                        />
                    </React.Fragment>
                ))}
            </MapContainer>
        </div>
    );
};

export default MapView;
