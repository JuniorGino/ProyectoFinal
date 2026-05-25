/**
 * PROTOTIPO LEGADO (HISTÓRICO) - app.js
 * 
 * Lógica en Vanilla JavaScript para la versión prototipo inicial de MemoryApp (Tisinapp).
 * Utiliza Leaflet.js para interacción de mapas directamente en el navegador, Nominatim
 * para geocodificación inversa, y el LocalStorage para persistencia local de recordatorios.
 * 
 * NOTA: La versión moderna modular está construida sobre React (dentro de la carpeta /client)
 * y una API Node.js/Express (en la carpeta /server).
 */

// Configuración y Estado Global
let map;
let userMarker;
let routeControl;
let reminders = JSON.parse(localStorage.getItem('memoryapp_reminders')) || [];
const ORS_API_KEY = ''; // El usuario debería poner su clave aquí

// Inicialización del Mapa
function initMap() {
    // Coordenadas por defecto (España por ejemplo)
    const defaultCoords = [40.416775, -3.70379];

    map = L.map('map', {
        zoomControl: false // Lo personalizaremos después
    }).setView(defaultCoords, 13);

    // Capa de OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Añadir controles de zoom en la esquina superior derecha
    L.control.zoom({
        position: 'topright'
    }).addTo(map);

    // Evento de clic en el mapa para añadir recordatorio
    map.on('click', onMapClick);

    // Cargar recordatorios guardados
    renderReminders();
}

// Función al hacer clic en el mapa
function onMapClick(e) {
    const { lat, lng } = e.latlng;

    // Obtener nombre de dirección usando Nominatim
    getAddressFromCoords(lat, lng).then(address => {
        const title = prompt("¿Qué quieres recordar aquí?", "Mi recordatorio");
        if (title) {
            addReminder(title, address, lat, lng);
        }
    });
}

// Geocodificación Inversa con Nominatim
async function getAddressFromCoords(lat, lng) {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
            headers: {
                'Accept-Language': 'es'
            }
        });
        const data = await response.json();
        return data.display_name || "Ubicación desconocida";
    } catch (error) {
        console.error("Error en Nominatim:", error);
        return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
}

// Gestión de Recordatorios
function addReminder(title, address, lat, lng) {
    const reminder = {
        id: Date.now(),
        title,
        address,
        lat,
        lng,
        date: new Date().toLocaleString()
    };

    reminders.push(reminder);
    localStorage.setItem('memoryapp_reminders', JSON.stringify(reminders));

    addMarkerToMap(reminder);
    renderReminders();
}

function addMarkerToMap(reminder) {
    const marker = L.marker([reminder.lat, reminder.lng]).addTo(map);
    marker.bindPopup(`<b>${reminder.title}</b><br>${reminder.address}`);
}

function renderReminders() {
    const list = document.getElementById('reminders-list');
    list.innerHTML = '';

    if (reminders.length === 0) {
        list.innerHTML = `
            <div class="reminder-card">
                <div class="reminder-info">No hay recordatorios registrados.</div>
            </div>
        `;
        return;
    }

    reminders.forEach(r => {
        const card = document.createElement('div');
        card.className = 'reminder-card';
        card.setAttribute('data-id', r.id);
        card.innerHTML = `
            <div class="reminder-title">${r.title}</div>
            <div class="reminder-info">${r.address}</div>
            <div class="distance-tag" style="font-size: 0.75rem; color: var(--accent); margin-top: 0.5rem; display: none;"></div>
            <div class="card-actions" style="margin-top: 1rem; display: flex; gap: 0.5rem;">
                <button onclick="event.stopPropagation(); drawRouteTo(${r.lat}, ${r.lng})" style="flex: 1; padding: 0.4rem; border-radius: 8px; border: 1px solid var(--primary); background: transparent; color: var(--primary); font-size: 0.7rem; cursor: pointer;">Ver Ruta</button>
            </div>
        `;
        card.onclick = () => {
            map.flyTo([r.lat, r.lng], 16);
        };
        list.appendChild(card);
        addMarkerToMap(r);
    });
}

// Simulación de ubicación del usuario (para pruebas web)
document.getElementById('btn-simulate-location').addEventListener('click', () => {
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(position => {
            const { latitude, longitude } = position.coords;
            updateUserPosition(latitude, longitude);
        }, error => {
            // Si falla la geolocalización real, simulamos una en Madrid para el ejemplo
            updateUserPosition(40.4167, -3.7033);
        });
    }
});

function updateUserPosition(lat, lng) {
    if (userMarker) map.removeLayer(userMarker);

    const userIcon = L.divIcon({
        className: 'user-location-icon',
        html: '<div class="marker-pulse"></div><div class="custom-marker" style="background: var(--accent)"></div>',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    });

    userMarker = L.marker([lat, lng], { icon: userIcon }).addTo(map);
    userMarker.bindPopup("Tu ubicación actual").openPopup();
    map.flyTo([lat, lng], 14);

    // Al actualizar posición, recalcular distancias si hay recordatorios
    calculateDistancesToReminders(lat, lng);
}

async function calculateDistancesToReminders(userLat, userLng) {
    for (let r of reminders) {
        try {
            // Usamos una fórmula simple de Haversine para distancia en línea recta si no hay API Key
            // O podemos intentar llamar a ORS si existe la clave
            const dist = getHaversineDistance(userLat, userLng, r.lat, r.lng);
            updateReminderDistanceUI(r.id, dist);

            if (dist < 0.5) { // Menos de 500 metros
                notifyProximity(r);
            }
        } catch (e) {
            console.error("Error calculando distancia", e);
        }
    }
}

function getHaversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function updateReminderDistanceUI(id, dist) {
    const card = document.querySelector(`[data-id="${id}"] .distance-tag`);
    if (card) {
        card.textContent = `${dist.toFixed(2)} km de distancia`;
        card.style.display = 'block';
    }
}

// Integración con OpenRouteService para la ruta visual
async function drawRouteTo(destLat, destLng) {
    if (!userMarker) {
        alert("Primero simula tu ubicación.");
        return;
    }

    if (routeControl) map.removeLayer(routeControl);

    const start = `${userMarker.getLatLng().lng},${userMarker.getLatLng().lat}`;
    const end = `${destLng},${destLat}`;

    // Como ORS requiere API Key, usaremos una alternativa visual con Leaflet Routing Machine 
    // o simplemente avisaremos al usuario.
    // Para una demo premium, dibujaremos una línea polilínea simple si no hay KEY.

    const polyline = L.polyline([
        [userMarker.getLatLng().lat, userMarker.getLatLng().lng],
        [destLat, destLng]
    ], { color: 'var(--primary)', weight: 4, dashArray: '10, 10' }).addTo(map);

    routeControl = polyline;
    map.fitBounds(polyline.getBounds(), { padding: [50, 50] });
}

function notifyProximity(reminder) {
    if ("Notification" in window) {
        if (Notification.permission === "granted") {
            new Notification(`¡Cerca de: ${reminder.title}!`, {
                body: `Estás llegando a ${reminder.address}`,
                icon: '/apple-touch-icon.png'
            });
        } else if (Notification.permission !== "denied") {
            Notification.requestPermission();
        }
    }
}

// Inicializar al cargar
document.addEventListener('DOMContentLoaded', initMap);
