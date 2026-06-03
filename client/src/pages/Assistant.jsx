/**
 * GESTOR DE RECORDATORIOS (PÁGINA PRINCIPAL) - Assistant.jsx
 * 
 * Este componente es el núcleo interactivo de Tisinapp.
 * Contiene:
 * 1. **Gestión de Estados (React):** Recordatorios existentes, ubicación del usuario, filtros de visualización,
 *    modo de vista (lista/calendario), colapso de la barra lateral, datos del nuevo recordatorio en creación,
 *    y notificaciones ya disparadas para evitar alertas duplicadas.
 * 2. **Notificaciones y Geolocalización en Tiempo Real:** 
 *    - Rastrea la ubicación mediante la API nativa de Geolocalización.
 *    - Compara distancias en metros usando `geolib.getDistance`.
 *    - Envía alertas visuales y sonoras (notificaciones de navegador) si el usuario ingresa en el radio.
 *    - Compara el tiempo para alarmas horarias.
 * 3. **Interacción con Mapa (Leaflet):** Selecciona ubicaciones al hacer clic y las asigna al formulario.
 * 4. **CRUD completo con NeDB (Backend local):** Peticiones Axios para registrar, eliminar y completar recordatorios.
 */

import React, { useState, useEffect } from 'react';
import MapView from '../components/Map';
import axios from 'axios';
import { getReminders, createReminder, updateReminderStatus, deleteReminder as apiDeleteReminder } from '../services/api';
import {
    Bell, MapPin, Trash2, CheckCircle, Clock, LayoutGrid, CheckCircle2,
    Sparkles, ChevronLeft, ChevronRight, Calendar as CalendarIcon, AlarmClock, List, Plus
} from 'lucide-react';
import { getDistance } from 'geolib';
import { motion, AnimatePresence } from 'framer-motion';
import {
    format, addMonths, subMonths, startOfMonth, endOfMonth,
    startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays,
    eachDayOfInterval, parseISO
} from 'date-fns';
import { es } from 'date-fns/locale';

function Assistant() {
    // ==========================================
    // ESTADOS GLOBALES DE LA PÁGINA
    // ==========================================
    const [reminders, setReminders] = useState([]); // Arreglo con todos los recordatorios
    const [userLocation, setUserLocation] = useState(null); // Ubicación [lat, lng] actual del usuario
    const [filter, setFilter] = useState('active'); // Filtro de lista: 'active' (Libres), 'completed' (Hechos), 'all' (Todos)
    const [viewMode, setViewMode] = useState('list'); // Vista de la barra lateral: 'list' (Lista) o 'calendar' (Calendario)
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false); // Alterna colapso de barra lateral
    const [selectedReminder, setSelectedReminder] = useState(null); // Recordatorio seleccionado para popup detallado
    
    // ==========================================
    // ESTADOS DEL FORMULARIO DE CREACIÓN
    // ==========================================
    const [reminderType, setReminderType] = useState('alarm'); // Tipo seleccionado: 'alarm' (alarma horaria) o 'gps' (geo-alerta)
    const [newReminder, setNewReminder] = useState({
        title: '',
        description: '',
        address: '',
        coordinates: null, // [lng, lat] obtenidos del clic en mapa
        radius: 1, // Radio inicial por defecto en 1km
        date: format(new Date(), 'yyyy-MM-dd'), // Fecha inicial hoy
        time: ''
    });

    // Control para evitar la repetición constante de notificaciones push
    const [notifiedIds, setNotifiedIds] = useState(new Set());
    // Control de mes mostrado en la vista de Calendario
    const [currentMonth, setCurrentMonth] = useState(new Date());

    // ==========================================
    // EFECTOS (USEEFFECT)
    // ==========================================
    useEffect(() => {
        // Carga los recordatorios y rastrea la ubicación del usuario al montar el componente
        fetchReminders();
        trackLocation();

        // Configura un temporizador para comprobar alarmas de reloj cada 30 segundos
        const timer = setInterval(checkTimeAlarms, 30000);

        // Solicita permisos para notificaciones push en el navegador
        if ("Notification" in window && Notification.permission !== "granted") {
            Notification.requestPermission();
        }

        return () => clearInterval(timer); // Limpieza al desmontar
    }, []);

    // ==========================================
    // OPERACIONES CRUD (CONEXIÓN CON API REST O LOCALSTORAGE)
    // ==========================================

    /**
     * Obtiene los recordatorios de la base de datos local (NeDB) o LocalStorage mediante GET.
     */
    const fetchReminders = async () => {
        try {
            const data = await getReminders();
            setReminders(data);
        } catch (err) {
            console.error('Error fetching reminders', err);
        }
    };

    /**
     * Guarda el recordatorio (Alarma o Geo-Alerta) llamando al servicio.
     */
    const saveReminder = async () => {
        if (!newReminder.title) {
            alert('Introduce un título para el recordatorio');
            return;
        }

        // Formatea la solicitud según el tipo de recordatorio
        const reminderData = {
            title: newReminder.title,
            description: newReminder.description,
            address: reminderType === 'gps' ? newReminder.address : '',
            coordinates: reminderType === 'gps' ? newReminder.coordinates : null,
            radius: reminderType === 'gps' ? newReminder.radius : 1,
            date: newReminder.date,
            time: newReminder.time
        };

        try {
            await createReminder(reminderData);
            // Reinicia los campos del formulario tras guardar con éxito
            setNewReminder({
                title: '',
                description: '',
                address: '',
                coordinates: null,
                radius: 1,
                date: format(new Date(), 'yyyy-MM-dd'),
                time: ''
            });
            fetchReminders(); // Refresca el listado de recordatorios
        } catch (err) {
            console.error("Error saving reminder", err);
        }
    };

    /**
     * Cambia el estado del recordatorio entre 'active' y 'completed'.
     */
    const toggleComplete = async (reminder) => {
        const newStatus = reminder.status === 'active' ? 'completed' : 'active';
        try {
            await updateReminderStatus(reminder._id, newStatus);
            fetchReminders();
        } catch (err) {
            console.error("Error updating status", err);
        }
    };

    /**
     * Elimina el recordatorio de forma permanente.
     */
    const deleteReminder = async (id) => {
        try {
            await apiDeleteReminder(id);
            fetchReminders();
        } catch (err) {
            console.error("Error deleting reminder", err);
        }
    };

    // ==========================================
    // GEOLOCALIZACIÓN Y ALERTAS EN TIEMPO REAL
    // ==========================================

    /**
     * Inicia el rastreo de ubicación mediante watchPosition.
     */
    const trackLocation = () => {
        if ("geolocation" in navigator) {
            navigator.geolocation.watchPosition(
                (pos) => {
                    const newPos = {
                        latitude: pos.coords.latitude,
                        longitude: pos.coords.longitude
                    };
                    setUserLocation(newPos);
                    checkProximity(newPos); // Comprueba si se activan alertas
                },
                (err) => {
                    console.warn("Geolocation error:", err.message);
                    // Caída por defecto en Madrid si se rechaza el permiso de ubicación
                    if (!userLocation) {
                        setUserLocation({ latitude: 40.4168, longitude: -3.7038, isFallback: true });
                    }
                },
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
            );
        }
    };

    /**
     * Compara la distancia a cada geo-alerta. Lanza notificaciones si el usuario ingresa en el radio.
     */
    const checkProximity = (currentPos) => {
        reminders.forEach(r => {
            if (r.status !== 'active' || !r.location) return;
            const distance = getDistance(
                { latitude: currentPos.latitude, longitude: currentPos.longitude },
                { latitude: r.location.coordinates[1], longitude: r.location.coordinates[0] }
            );
            const radiusInMeters = (r.radius || 1) * 1000;
            
            if (distance <= radiusInMeters && !notifiedIds.has(r._id)) {
                sendNotification(r, 'proximity');
                setNotifiedIds(prev => new Set(prev).add(r._id)); // Evita bucle de alertas
            } else if (distance > radiusInMeters && notifiedIds.has(r._id)) {
                setNotifiedIds(prev => {
                    const next = new Set(prev);
                    next.delete(r._id);
                    return next;
                });
            }
        });
    };

    /**
     * Compara la fecha y hora actuales para disparar alarmas clásicas de reloj.
     */
    const checkTimeAlarms = () => {
        const now = new Date();
        const currentDate = format(now, 'yyyy-MM-dd');
        const currentTime = format(now, 'HH:mm');

        reminders.forEach(r => {
            if (r.status !== 'active') return;
            if (r.date === currentDate && r.time === currentTime && !notifiedIds.has(r._id + '_time')) {
                sendNotification(r, 'time');
                setNotifiedIds(prev => new Set(prev).add(r._id + '_time'));
            }
        });
    };

    /**
     * Utiliza la API nativa de notificaciones de navegador para alertar al usuario.
     */
    const sendNotification = (reminder, type) => {
        const title = type === 'time' ? `¡Alarma Tisinapp! ⏰` : `¡Tisinapp Alerta! 📍`;
        const body = type === 'time'
            ? `Es hora de: ${reminder.title}`
            : `Estás cerca de: ${reminder.title}. ¡No te olvides!`;

        if ("Notification" in window && Notification.permission === "granted") {
            new Notification(title, { body, icon: '/favicon.ico' });
        }
    };

    /**
     * Captura el clic del usuario en el mapa, obtiene la dirección postal mediante geocodificación inversa
     * con Nominatim y la asigna al formulario.
     */
    const handleMapClick = async (latlng) => {
        const { lat, lng } = latlng;
        try {
            const resp = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
                headers: { 'Accept-Language': 'es' }
            });
            const address = resp.data.display_name || 'Ubicación seleccionada';
            
            // Llena la sección de GPS del formulario
            setNewReminder(prev => ({
                ...prev,
                address,
                coordinates: [lng, lat]
            }));
            setReminderType('gps'); // Alterna automáticamente al modo GPS
            setSidebarCollapsed(false); // Expande la barra lateral para permitir edición
        } catch (err) {
            console.error("Geocoding error", err);
        }
    };

    // ==========================================
    // VISTA DE CALENDARIO (DATE-FNS)
    // ==========================================
    const renderCalendar = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart, { locale: es });
        const endDate = endOfWeek(monthEnd, { locale: es });
        const days = eachDayOfInterval({ start: startDate, end: endDate });

        return (
            <div className="calendar-view">
                <div className="calendar-header">
                    <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="icon-btn"><ChevronLeft size={18} /></button>
                    <span style={{ fontWeight: '700', textTransform: 'capitalize' }}>{format(currentMonth, 'MMMM yyyy', { locale: es })}</span>
                    <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="icon-btn"><ChevronRight size={18} /></button>
                </div>
                <div className="calendar-grid">
                    {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => (
                        <div key={d} style={{ textAlign: 'center', fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 'bold', paddingBottom: '5px' }}>{d}</div>
                    ))}
                    {days.map(day => {
                        const dayStr = format(day, 'yyyy-MM-dd');
                        const hasReminder = reminders.some(r => r.date === dayStr && r.status === 'active');
                        return (
                            <div
                                key={dayStr}
                                onClick={() => {
                                    setNewReminder(prev => ({ ...prev, date: dayStr }));
                                    setFilter('all');
                                    setViewMode('list');
                                }}
                                className={`calendar-day ${!isSameMonth(day, monthStart) ? 'dimmed' : ''} ${isSameDay(day, new Date()) ? 'current' : ''} ${hasReminder ? 'has-reminder' : ''}`}
                            >
                                {format(day, 'd')}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    // Filtra los recordatorios en la lista según la pestaña seleccionada ('active', 'completed', 'all')
    const filteredReminders = reminders.filter(r => {
        if (filter === 'all') return true;
        return r.status === filter;
    });

    return (
        <div className="app-container">
            {/* Botón de Colapso de la Barra Lateral */}
            <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className={`sidebar-toggle ${sidebarCollapsed ? 'collapsed' : ''}`}
            >
                {sidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>

            {/* Barra lateral flotante con efecto Vidrio (Glassmorphism) */}
            <div className={`ui-overlay sidebar glass-panel ${sidebarCollapsed ? 'collapsed' : ''}`}>
                <header style={{ marginBottom: '1.2rem', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1.3rem', color: 'white' }}>
                            <Sparkles className="text-primary" size={24} />
                            Tisinapp
                        </h1>
                        <div style={{ display: 'flex', gap: '0.3rem' }}>
                            <button onClick={() => setViewMode('list')} className={`icon-btn small ${viewMode === 'list' ? 'active' : ''}`} title="Lista"><List size={14} /></button>
                            <button onClick={() => setViewMode('calendar')} className={`icon-btn small ${viewMode === 'calendar' ? 'active' : ''}`} title="Calendario"><CalendarIcon size={14} /></button>
                        </div>
                    </div>
                </header>

                {/* Formulario Directo de Recordatorio */}
                <div className="creation-form" style={{
                    flexShrink: 0,
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '20px',
                    padding: '1rem',
                    marginBottom: '1.5rem',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.8rem'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'white', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Bell size={16} className="text-primary" /> Nuevo Recordatorio
                        </span>
                        
                        {/* Selector de Tipo (Alarma vs GPS) */}
                        <div style={{ display: 'flex', gap: '0.2rem', background: 'rgba(0,0,0,0.3)', padding: '2px', borderRadius: '8px' }}>
                            <button
                                onClick={() => setReminderType('alarm')}
                                style={{
                                    border: 'none',
                                    borderRadius: '6px',
                                    padding: '0.3rem 0.6rem',
                                    fontSize: '0.65rem',
                                    cursor: 'pointer',
                                    background: reminderType === 'alarm' ? 'var(--primary)' : 'transparent',
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    transition: 'var(--transition)'
                                }}
                            >
                                <AlarmClock size={12} /> Alarma
                            </button>
                            <button
                                onClick={() => setReminderType('gps')}
                                style={{
                                    border: 'none',
                                    borderRadius: '6px',
                                    padding: '0.3rem 0.6rem',
                                    fontSize: '0.65rem',
                                    cursor: 'pointer',
                                    background: reminderType === 'gps' ? 'var(--primary)' : 'transparent',
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    transition: 'var(--transition)'
                                }}
                            >
                                <MapPin size={12} /> GPS
                            </button>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <input
                            type="text"
                            placeholder="¿Qué quieres recordar?"
                            value={newReminder.title}
                            onChange={(e) => setNewReminder({ ...newReminder, title: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '0.6rem 0.8rem',
                                borderRadius: '10px',
                                background: 'rgba(0,0,0,0.4)',
                                border: '1px solid var(--glass-border)',
                                color: 'white',
                                fontSize: '0.8rem',
                                outline: 'none'
                            }}
                        />
                        <textarea
                            placeholder="Descripción (opcional)"
                            value={newReminder.description}
                            onChange={(e) => setNewReminder({ ...newReminder, description: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '0.6rem 0.8rem',
                                borderRadius: '10px',
                                background: 'rgba(0,0,0,0.4)',
                                border: '1px solid var(--glass-border)',
                                color: 'white',
                                fontSize: '0.8rem',
                                height: '50px',
                                resize: 'none',
                                outline: 'none'
                            }}
                        />
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input
                                type="date"
                                value={newReminder.date}
                                onChange={(e) => setNewReminder({ ...newReminder, date: e.target.value })}
                                style={{
                                    flex: 1,
                                    padding: '0.5rem 0.6rem',
                                    borderRadius: '8px',
                                    background: 'rgba(0,0,0,0.4)',
                                    border: '1px solid var(--glass-border)',
                                    color: 'white',
                                    fontSize: '0.75rem',
                                    outline: 'none'
                                }}
                            />
                            <input
                                type="time"
                                value={newReminder.time}
                                onChange={(e) => setNewReminder({ ...newReminder, time: e.target.value })}
                                style={{
                                    width: '100px',
                                    padding: '0.5rem 0.6rem',
                                    borderRadius: '8px',
                                    background: 'rgba(0,0,0,0.4)',
                                    border: '1px solid var(--glass-border)',
                                    color: 'white',
                                    fontSize: '0.75rem',
                                    outline: 'none'
                                }}
                            />
                        </div>

                        {/* Campos condicionales para Alertas GPS */}
                        {reminderType === 'gps' && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.2rem' }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0.5rem', background: 'rgba(99, 102, 241, 0.05)', border: '1px dashed rgba(99, 102, 241, 0.3)', borderRadius: '8px' }}>
                                    <MapPin size={14} className="text-primary" />
                                    <span style={{ fontSize: '0.7rem', color: '#cbd5e1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '240px' }}>
                                        {newReminder.address || 'Haz clic en el mapa para marcar ubicación'}
                                    </span>
                                </div>
                                
                                {newReminder.coordinates && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Radio de Alerta:</span>
                                            <span style={{ fontSize: '0.65rem', fontWeight: 'bold', color: 'var(--accent)' }}>{newReminder.radius} km</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0.1"
                                            max="10"
                                            step="0.1"
                                            value={newReminder.radius}
                                            onChange={(e) => setNewReminder({ ...newReminder, radius: parseFloat(e.target.value) })}
                                            style={{
                                                width: '100%',
                                                accentColor: 'var(--primary)',
                                                cursor: 'pointer'
                                            }}
                                        />
                                    </div>
                                )}
                            </motion.div>
                        )}

                        <button
                            onClick={saveReminder}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                background: 'var(--primary)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '10px',
                                padding: '0.6rem',
                                fontSize: '0.8rem',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                transition: 'var(--transition)',
                                marginTop: '0.2rem'
                            }}
                            onMouseEnter={(e) => e.target.style.background = 'var(--primary-dark)'}
                            onMouseLeave={(e) => e.target.style.background = 'var(--primary)'}
                        >
                            <Plus size={16} /> Guardar Recordatorio
                        </button>
                    </div>
                </div>

                {/* Filtro de Listado (Libres / Hechos / Todos) */}
                <div className="filter-tabs" style={{ display: 'flex', gap: '0.3rem', marginBottom: '1rem', background: 'var(--glass)', padding: '0.2rem', borderRadius: '10px', flexShrink: 0 }}>
                    {[{ id: 'active', label: 'Libres', icon: Clock }, { id: 'completed', label: 'Hechos', icon: CheckCircle2 }, { id: 'all', label: 'Todos', icon: LayoutGrid }].map(tab => (
                        <button key={tab.id} onClick={() => setFilter(tab.id)} style={{
                            flex: 1, padding: '0.5rem 0.2rem', borderRadius: '8px', border: 'none', fontSize: '0.65rem',
                            cursor: 'pointer', background: filter === tab.id ? 'var(--primary)' : 'transparent',
                            color: filter === tab.id ? 'white' : 'var(--text-muted)', transition: 'var(--transition)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem'
                        }}>
                            <tab.icon size={12} /> {tab.label}
                        </button>
                    ))}
                </div>

                {/* Listado Principal de Recordatorios */}
                <div className="reminders-list" style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }}>
                    <AnimatePresence mode="wait">
                        {viewMode === 'calendar' ? (
                            <motion.div key="cal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                {renderCalendar()}
                            </motion.div>
                        ) : (
                            <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                {filteredReminders.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
                                        <Bell size={24} style={{ marginBottom: '0.5rem', opacity: 0.2, margin: '0 auto' }} />
                                        <p style={{ fontSize: '0.75rem' }}>Tus notas aparecerán aquí abajo conforme las crees.</p>
                                    </div>
                                ) : (
                                    filteredReminders.map(r => (
                                        <motion.div
                                            layout
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            key={r._id}
                                            onClick={() => setSelectedReminder(r)}
                                            className={`reminder-card ${r.status === 'completed' ? 'completed' : ''}`}
                                            style={{
                                                marginBottom: '0.8rem',
                                                background: r.status === 'completed' ? 'rgba(16, 185, 129, 0.05)' : 'rgba(30, 41, 59, 0.8)',
                                                border: r.status === 'completed' ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid var(--glass-border)'
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <div style={{ flex: 1 }}>
                                                    <div className="reminder-title" style={{ fontSize: '0.95rem', fontWeight: '600', color: '#fff', marginBottom: '0.3rem' }}>{r.title}</div>
                                                    <div style={{ fontSize: '0.7rem', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        {r.location ? <MapPin size={12} className="text-primary" /> : <AlarmClock size={12} className="text-accent" />}
                                                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>
                                                            {r.address ? r.address.split(',')[0] : (r.type === 'geo' ? 'Cerca de ti' : 'Alarma horaria')}
                                                        </span>
                                                    </div>
                                                    {r.date && (
                                                        <div style={{ fontSize: '0.7rem', color: 'var(--primary)', marginTop: '0.4rem', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                            <CalendarIcon size={12} />
                                                            {format(parseISO(r.date), 'dd MMMM', { locale: es })} {r.time && `• ${r.time}`}
                                                        </div>
                                                    )}
                                                </div>
                                                <div style={{ display: 'flex', gap: '0.4rem' }}>
                                                    <button onClick={(e) => { e.stopPropagation(); toggleComplete(r); }} className="icon-btn small" style={{ background: r.status === 'completed' ? 'var(--accent)' : 'rgba(255,255,255,0.05)' }}>
                                                        <CheckCircle size={14} color={r.status === 'completed' ? 'white' : '#64748b'} />
                                                    </button>
                                                    <button onClick={(e) => { e.stopPropagation(); deleteReminder(r._id); }} className="icon-btn small">
                                                        <Trash2 size={14} color="#ef4444" />
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Vista Detallada Popup del Recordatorio Seleccionado */}
                <AnimatePresence>
                    {selectedReminder && (
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                            style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '90%', maxWidth: '340px', background: '#0f172a', border: '1px solid var(--glass-border)', padding: '1.5rem', borderRadius: '24px', zIndex: 1100, boxShadow: '0 30px 60px rgba(0,0,0,0.8)' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase' }}>
                                        {selectedReminder.location ? <MapPin size={16} /> : <AlarmClock size={16} />}
                                        {selectedReminder.location ? 'Geo-Alerta' : 'Alarma'}
                                    </div>
                                    <button onClick={() => setSelectedReminder(null)} className="icon-btn small"><ChevronLeft size={16} /></button>
                                </div>

                                <div>
                                    <h2 style={{ fontSize: '1.4rem', color: 'white', marginBottom: '0.5rem', lineHeight: '1.2' }}>{selectedReminder.title}</h2>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.5' }}>{selectedReminder.description || 'Sin descripción adicional.'}</p>
                                </div>

                                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <CalendarIcon size={18} className="text-primary" />
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Fecha y Hora</span>
                                            <span style={{ fontSize: '0.9rem', color: 'white' }}>{format(parseISO(selectedReminder.date), 'EEEE, dd [de] MMMM', { locale: es })} • {selectedReminder.time || 'Cualquier hora'}</span>
                                        </div>
                                    </div>
                                    {selectedReminder.address && (
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                            <MapPin size={18} className="text-accent" />
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Ubicación</span>
                                                <span style={{ fontSize: '0.8rem', color: 'white', lineHeight: '1.4' }}>{selectedReminder.address}</span>
                                                {selectedReminder.radius && <span style={{ fontSize: '0.65rem', color: 'var(--accent)', marginTop: '2px' }}>Radio: {selectedReminder.radius} km</span>}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: 'flex', gap: '0.8rem' }}>
                                    <button onClick={() => { toggleComplete(selectedReminder); setSelectedReminder(null); }} style={{ flex: 1, padding: '0.8rem', borderRadius: '12px', background: selectedReminder.status === 'completed' ? '#64748b' : 'var(--accent)', color: 'white', border: 'none', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer' }}>
                                        {selectedReminder.status === 'completed' ? 'Reactivar' : 'Marcar como Hecho'}
                                    </button>
                                    <button onClick={() => { deleteReminder(selectedReminder._id); setSelectedReminder(null); }} style={{ padding: '0.8rem', borderRadius: '12px', background: 'rgba(239, 44, 44, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 44, 44, 0.2)', cursor: 'pointer' }}>
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Mapa Interactivo (Capa de Leaflet) */}
            <MapView
                reminders={reminders.filter(r => r.location)}
                userLocation={userLocation}
                onMapClick={handleMapClick}
                onReminderClick={(r) => {
                    setSidebarCollapsed(false);
                    setViewMode('list');
                    setFilter('all');
                    setSelectedReminder(r);
                }}
            />
        </div>
    );
}

export default Assistant;
