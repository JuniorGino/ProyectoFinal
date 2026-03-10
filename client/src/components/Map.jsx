import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon in React-Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Component to handle map center and sizing
function MapController({ center, userLocation }) {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo(center, map.getZoom(), { duration: 2 });
        }
    }, [center, map]);

    useEffect(() => {
        // Fix Leaflet sizing issues on initial load within flex containers
        const timeout = setTimeout(() => {
            map.invalidateSize();
        }, 100);
        return () => clearTimeout(timeout);
    }, [map]);

    return null;
}

// Component to handle map clicks
function MapEvents({ onMapClick }) {
    useMapEvents({
        click: (e) => {
            onMapClick(e.latlng);
        },
    });
    return null;
}

const MapView = ({ reminders, userLocation, onMapClick, onReminderClick }) => {
    // Madrid por defecto si no hay ubicación del usuario todavía
    const defaultCenter = [40.4168, -3.7038];
    const [center, setCenter] = useState(defaultCenter);

    useEffect(() => {
        if (userLocation) {
            setCenter([userLocation.latitude, userLocation.longitude]);
        }
    }, [userLocation]);

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
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <MapEvents onMapClick={onMapClick} />
                <MapController center={userLocation ? [userLocation.latitude, userLocation.longitude] : defaultCenter} userLocation={userLocation} />

                {userLocation && !userLocation.isFallback && (
                    <Marker position={[userLocation.latitude, userLocation.longitude]} icon={userIcon}>
                        <Popup>Tu ubicación actual</Popup>
                    </Marker>
                )}

                {reminders.filter(r => r.status === 'active').map(reminder => (
                    <React.Fragment key={reminder._id || reminder.id}>
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
