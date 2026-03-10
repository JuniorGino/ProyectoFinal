import React, { useState, useEffect, useRef } from 'react';
import MapView from '../components/Map';
import axios from 'axios';
import {
    Bell, MapPin, Trash2, CheckCircle, Clock, LayoutGrid, CheckCircle2,
    Navigation, Send, MessageSquare, Loader2, Sparkles, ChevronLeft,
    ChevronRight, Calendar as CalendarIcon, AlarmClock, List
} from 'lucide-react';
import { getDistance } from 'geolib';
import { motion, AnimatePresence } from 'framer-motion';
import {
    format, addMonths, subMonths, startOfMonth, endOfMonth,
    startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays,
    eachDayOfInterval, parseISO
} from 'date-fns';
import { es } from 'date-fns/locale';

const API_URL = 'http://localhost:5000/api/reminders';

function Assistant() {
    const [reminders, setReminders] = useState([]);
    const [userLocation, setUserLocation] = useState(null);
    const [isAdding, setIsAdding] = useState(false);
    const [filter, setFilter] = useState('active');
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [selectedReminder, setSelectedReminder] = useState(null);

    const [newReminder, setNewReminder] = useState({
        title: '',
        description: '',
        address: '',
        coordinates: null,
        radius: 1,
        date: format(new Date(), 'yyyy-MM-dd'),
        time: ''
    });

    const [notifiedIds, setNotifiedIds] = useState(new Set());
    const [currentMonth, setCurrentMonth] = useState(new Date());

    // Asistente Chat States
    const [chatInput, setChatInput] = useState('');
    const [chatHistory, setChatHistory] = useState([
        { role: 'assistant', content: '¡Hola! Soy la IA de Tisinapp. 👋 ¿Quieres configurar un recordatorio por ubicación o una alarma para un día específico?' }
    ]);
    const [isTyping, setIsTyping] = useState(false);
    const chatEndRef = useRef(null);

    useEffect(() => {
        fetchReminders();
        trackLocation();

        // Timer for Time Alarms
        const timer = setInterval(checkTimeAlarms, 30000); // Check every 30 seconds

        if ("Notification" in window && Notification.permission !== "granted") {
            Notification.requestPermission();
        }

        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory, isTyping]);

    const fetchReminders = async () => {
        try {
            const resp = await axios.get(API_URL);
            setReminders(resp.data);
        } catch (err) {
            console.error('Error fetching reminders', err);
        }
    };

    const trackLocation = () => {
        if ("geolocation" in navigator) {
            navigator.geolocation.watchPosition(
                (pos) => {
                    const newPos = {
                        latitude: pos.coords.latitude,
                        longitude: pos.coords.longitude
                    };
                    setUserLocation(newPos);
                    checkProximity(newPos);
                },
                (err) => {
                    console.warn("Geolocation error:", err.message);
                    if (!userLocation) {
                        setUserLocation({ latitude: 40.4168, longitude: -3.7038, isFallback: true });
                    }
                },
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
            );
        }
    };

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
                setNotifiedIds(prev => new Set(prev).add(r._id));
            } else if (distance > radiusInMeters && notifiedIds.has(r._id)) {
                setNotifiedIds(prev => {
                    const next = new Set(prev);
                    next.delete(r._id);
                    return next;
                });
            }
        });
    };

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

    const sendNotification = (reminder, type) => {
        const title = type === 'time' ? `¡Alarma Tisinapp! ⏰` : `¡Tisinapp Alerta! 📍`;
        const body = type === 'time'
            ? `Es hora de: ${reminder.title}`
            : `Estás cerca de: ${reminder.title}. ¡No te olvides!`;

        if ("Notification" in window && Notification.permission === "granted") {
            new Notification(title, { body, icon: '/favicon.ico' });
        }
    };

    const handleMapClick = async (latlng) => {
        const { lat, lng } = latlng;
        try {
            const resp = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
                headers: { 'Accept-Language': 'es' }
            });
            const address = resp.data.display_name || 'Ubicación seleccionada';
            setNewReminder({ ...newReminder, address, coordinates: [lng, lat] });
            setIsAdding(true);
            setSidebarCollapsed(false);
            addMessage('assistant', `He marcado este punto: "${address.split(',')[0]}". ¿Qué día y qué quieres recordar aquí?`);
        } catch (err) {
            console.error("Geocoding error", err);
        }
    };

    const saveReminder = async () => {
        if (!newReminder.title) return;
        try {
            await axios.post(API_URL, newReminder);
            setIsAdding(false);
            const title = newReminder.title;
            setNewReminder({
                title: '', description: '', address: '', coordinates: null, radius: 1,
                date: format(new Date(), 'yyyy-MM-dd'), time: ''
            });
            fetchReminders();
            addMessage('assistant', `¡Configurado! He guardado "${title}". Estaré atento para avisarte. ✨`);
        } catch (err) {
            console.error("Error saving reminder", err);
        }
    };

    const addMessage = (role, content) => {
        setChatHistory(prev => [...prev, { role, content }]);
    };

    const [conversationState, setConversationState] = useState({ stage: 'idle', data: {} });

    // Helper para detectar similitud de palabras (manejo de errores ortográficos)
    const matchesKeyword = (input, keywords) => {
        const words = input.toLowerCase().split(/\s+/);
        return keywords.some(k =>
            words.some(w => {
                if (w.includes(k) || k.includes(w)) return true;
                // Similitud básica por longitud y caracteres comunes
                if (Math.abs(w.length - k.length) <= 2) {
                    let common = 0;
                    for (let char of k) if (w.includes(char)) common++;
                    return common >= k.length - 1;
                }
                return false;
            })
        );
    };

    const processChatCommand = async (e) => {
        e.preventDefault();
        if (!chatInput.trim()) return;

        const input = chatInput;
        addMessage('user', input);
        setChatInput('');
        setIsTyping(true);

        const lowerInput = input.toLowerCase().trim();

        setTimeout(async () => {
            try {
                // DICCIONARIOS AMPLIADOS
                const triggers = ['recuerdame', 'recuerda', 'recuernm', 'recuérdame', 'recuerden', 'reuerda', 'recuardame', 'recuerdamen'];
                const geoKeywords = ['geo', 'lugar', 'sitio', 'ubicacion', 'ubicasion', 'mapa', 'gps', 'donde', 'direcion', 'cerca', 'distancia'];
                const alarmKeywords = ['alarma', 'reloj', 'hora', 'pitar', 'avisame', 'solo hora', 'sin mapa'];
                const todayKeywords = ['hoy', 'oi', 'oy', 'ahora', 'mismo', 'esta mañana'];
                const tomorrowKeywords = ['mañana', 'manyana', 'mañaa', 'otro dia'];
                const periodKeywords = {
                    morning: ['mañana', 'am', 'temprano', 'madrugada'],
                    afternoon: ['tarde', 'pm', 'sobre las', 'merienda'],
                    night: ['noche', 'noce', 'cena', 'tardecita']
                };

                // --- MÁQUINA DE ESTADOS ---

                if (conversationState.stage === 'awaiting_type') {
                    const isGeo = matchesKeyword(lowerInput, geoKeywords);
                    const type = isGeo ? 'geo' : 'alarm';
                    setIsTyping(false);
                    addMessage('assistant', `Vale, ${type === 'geo' ? 'lo buscaremos en el mapa' : 'será una alarma sencilla'}. ¿Qué es lo que quieres que te recuerde exactamente?`);
                    setConversationState({ stage: 'awaiting_title', data: { ...conversationState.data, type } });
                    return;
                }

                if (conversationState.stage === 'awaiting_title') {
                    setIsTyping(false);
                    addMessage('assistant', `Anotado: "${input}". ¿Para qué día lo preparamos? (Hoy, mañana, o dime una fecha).`);
                    setConversationState({ stage: 'awaiting_day', data: { ...conversationState.data, title: input } });
                    return;
                }

                if (conversationState.stage === 'awaiting_day') {
                    const getAdvancedDate = (text) => {
                        const now = new Date();
                        let target = new Date();
                        if (text.match(/(\d{1,2})\s*del\s*mes\s*que\s*viene/i)) {
                            target = addMonths(startOfMonth(now), 1);
                            target.setDate(parseInt(text.match(/(\d{1,2})/)[0]));
                        } else if (text.match(/(\d{1,2})\s*de\s*(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/i)) {
                            const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
                            const mMatch = text.match(/(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/i);
                            const mIdx = monthNames.indexOf(mMatch[0].toLowerCase());
                            target.setMonth(mIdx);
                            target.setDate(parseInt(text.match(/(\d{1,2})/)[0]));
                        } else if (text.match(/dia\s*(\d{1,2})|día\s*(\d{1,2})|el\s*(\d{1,2})/i)) {
                            const day = parseInt(text.match(/(\d{1,2})/)[0]);
                            target.setDate(day);
                            if (target < now) target = addMonths(target, 1);
                        } else if (matchesKeyword(text, tomorrowKeywords)) {
                            target = addDays(now, 1);
                        } else if (matchesKeyword(text, todayKeywords)) {
                            target = now;
                        } else if (text.includes("no") || text.includes("paso") || text.includes("nada")) {
                            target = now;
                        } else {
                            const dm = text.match(/(\d{1,2})[/-](\d{1,2})/);
                            if (dm) {
                                target.setMonth(parseInt(dm[2]) - 1);
                                target.setDate(parseInt(dm[1]));
                            }
                        }
                        return format(target, 'yyyy-MM-dd');
                    };

                    const dateStr = getAdvancedDate(lowerInput);

                    // EXTRA: Detectar si también puso la hora aquí
                    const timeRegex = /(\d{1,2})[:h](\d{2})|(?<=las|la|a las|a la|las\s|la\s|a\slas\s|a\sla\s|^)(\d{1,2})\b/gi;
                    const tMatch = lowerInput.match(timeRegex);
                    let detectedTime = null;
                    let isAmbig = false;
                    let ambigH, ambigM;

                    if (tMatch) {
                        let h = tMatch[0].replace(/[:h]/g, ":").split(":")[0].trim();
                        let m = tMatch[0].includes(":") ? tMatch[0].split(":")[1] : "00";
                        let hourInt = parseInt(h);
                        
                        const hasPeriod = (lowerInput.includes("tarde") || lowerInput.includes("noche") || lowerInput.includes("pm") || lowerInput.includes("mañana") || lowerInput.includes("am"));
                        if (hourInt <= 12 && !hasPeriod && !tMatch[0].includes(":")) {
                            isAmbig = true;
                            ambigH = hourInt;
                            ambigM = m;
                        }

                        const isPm = matchesKeyword(lowerInput, periodKeywords.afternoon) || matchesKeyword(lowerInput, periodKeywords.night);
                        if (isPm && hourInt < 12) hourInt += 12;
                        detectedTime = `${hourInt.toString().padStart(2, '0')}:${m.padStart(2, '0')}`;
                    }

                    setIsTyping(false);
                    if (isAmbig) {
                        addMessage('assistant', `¿A las ${ambigH} de la mañana o de la tarde?`);
                        setConversationState({ stage: 'awaiting_time_period', data: { ...conversationState.data, date: dateStr, tempHour: ambigH, tempMin: ambigM } });
                    } else if (detectedTime) {
                        if (conversationState.data.type === 'geo') {
                            addMessage('assistant', `Entendido, el ${format(parseISO(dateStr), 'dd [de] MMMM', { locale: es })} a las ${detectedTime}. ¿En qué sitio quieres que te avise?`);
                            setConversationState({ stage: 'awaiting_place', data: { ...conversationState.data, date: dateStr, time: detectedTime } });
                        } else {
                            const finalData = { ...conversationState.data, date: dateStr, time: detectedTime };
                            setNewReminder(finalData); setIsAdding(true);
                            addMessage('assistant', `¡Lo tengo todo! Alarma para el ${format(parseISO(dateStr), 'dd [de] MMMM', { locale: es })} a las ${detectedTime}. ¿Confirmamos?`);
                            setConversationState({ stage: 'idle', data: {} });
                        }
                    } else {
                        addMessage('assistant', `Vale, anotado para el ${format(parseISO(dateStr), 'dd [de] MMMM', { locale: es })}. ¿A qué hora quieres que suene?`);
                        setConversationState({ stage: 'awaiting_time', data: { ...conversationState.data, date: dateStr } });
                    }
                    return;
                }

                if (conversationState.stage === 'awaiting_time') {
                    const isNoTime = lowerInput.includes("no") || lowerInput.includes("sin") || lowerInput.includes("luego");

                    // CORRECCIÓN DE FECHA EN EL TIEMPO
                    const dateCorrection = lowerInput.match(/(\d{1,2})\s*del\s*mes\s*que\s*viene/i) || lowerInput.match(/dia\s*(\d{1,2})|día\s*(\d{1,2})/i);
                    let finalDate = conversationState.data.date;
                    if (dateCorrection) {
                        const now = new Date();
                        let target = new Date();
                        if (lowerInput.includes("mes que viene")) {
                            target = addMonths(startOfMonth(now), 1);
                            target.setDate(parseInt(lowerInput.match(/\d+/)[0]));
                        } else {
                            target.setDate(parseInt(lowerInput.match(/\d+/)[0]));
                            if (target < now) target = addMonths(target, 1);
                        }
                        finalDate = format(target, 'yyyy-MM-dd');
                        addMessage('assistant', `Vale, cambiamos el día al ${format(target, 'dd [de] MMMM', { locale: es })}.`);
                    }

                    if (isNoTime && conversationState.data.type === 'geo') {
                        setIsTyping(false);
                        addMessage('assistant', "Sin hora fija. ¿En qué lugar quieres que me active?");
                        setConversationState({ stage: 'awaiting_place', data: { ...conversationState.data, date: finalDate, time: "" } });
                        return;
                    }

                    const timeRegex = /(\d{1,2})[:h](\d{2})|(?<=las|la|a las|a la|las\s|la\s|a\slas\s|a\sla\s|^)(\d{1,2})\b/gi;
                    const timeMatch = lowerInput.match(timeRegex);

                    if (timeMatch) {
                        let raw = timeMatch[0].replace(/[:h]/g, ":");
                        let h = raw.split(":")[0].trim();
                        let m = raw.includes(":") ? raw.split(":")[1] : "00";
                        let hourInt = parseInt(h);

                        const isPm = matchesKeyword(lowerInput, periodKeywords.afternoon) || matchesKeyword(lowerInput, periodKeywords.night);
                        const isAm = matchesKeyword(lowerInput, periodKeywords.morning);

                        if (hourInt > 12 || isPm || isAm) {
                            if (isPm && hourInt < 12) hourInt += 12;
                            if (isAm && hourInt === 12) hourInt = 0;
                            const timeStr = `${hourInt.toString().padStart(2, '0')}:${m.padStart(2, '0')}`;

                            setIsTyping(false);
                            if (conversationState.data.type === 'geo') {
                                addMessage('assistant', `A las ${timeStr}. ¿En qué sitio quieres que te avise?`);
                                setConversationState({ stage: 'awaiting_place', data: { ...conversationState.data, date: finalDate, time: timeStr } });
                            } else {
                                const finalData = { ...conversationState.data, date: finalDate, time: timeStr };
                                setNewReminder(finalData); setIsAdding(true);
                                addMessage('assistant', `¡Listo! Alarma el ${format(parseISO(finalDate), 'dd [de] MMMM', { locale: es })} a las ${timeStr}. ¿Confirmamos?`);
                                setConversationState({ stage: 'idle', data: {} });
                            }
                        } else {
                            setIsTyping(false);
                            addMessage('assistant', `¿A las ${hourInt} de la mañana o de la tarde?`);
                            setConversationState({ stage: 'awaiting_time_period', data: { ...conversationState.data, date: finalDate, tempHour: hourInt, tempMin: m } });
                        }
                    } else {
                        addMessage('assistant', "No he pillado bien la hora. Prueba con 'las 5' o '15:30'.");
                        setIsTyping(false);
                    }
                    return;
                }

                if (conversationState.stage === 'awaiting_time_period') {
                    let h = conversationState.data.tempHour;
                    const m = conversationState.data.tempMin || "00";
                    if (matchesKeyword(lowerInput, periodKeywords.afternoon) || matchesKeyword(lowerInput, periodKeywords.night)) {
                        if (h < 12) h += 12;
                    } else if (matchesKeyword(lowerInput, periodKeywords.morning)) {
                        if (h === 12) h = 0;
                    }
                    const timeStr = `${h.toString().padStart(2, '0')}:${m}`;
                    setIsTyping(false);
                    if (conversationState.data.type === 'geo') {
                        addMessage('assistant', `¡Perfecto! A las ${timeStr}. ¿En qué lugar quieres que me active?`);
                        setConversationState({ stage: 'awaiting_place', data: { ...conversationState.data, time: timeStr } });
                    } else {
                        const finalData = { ...conversationState.data, time: timeStr };
                        setNewReminder(finalData); setIsAdding(true);
                        addMessage('assistant', `Anotado para las ${timeStr}. ¿Confirmamos la alarma?`);
                        setConversationState({ stage: 'idle', data: {} });
                    }
                    return;
                }

                if (conversationState.stage === 'awaiting_place') {
                    const searchResp = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${input}&limit=1&addressdetails=1`, {
                        headers: { 'Accept-Language': 'es' }
                    });
                    if (searchResp.data.length > 0) {
                        const loc = searchResp.data[0];
                        const finalData = { ...conversationState.data, address: loc.display_name, coordinates: [parseFloat(loc.lon), parseFloat(loc.lat)] };
                        setNewReminder(finalData); setIsAdding(true); setIsTyping(false);
                        addMessage('assistant', `¡Encontrado! Todo listo para "${finalData.title}". ¿Te parece bien?`);
                        setConversationState({ stage: 'idle', data: {} });
                    } else {
                        setIsTyping(false);
                        addMessage('assistant', `No encuentro "${input}". ¿Podrías decirme el sitio de nuevo o marcarlo en el mapa?`);
                    }
                    return;
                }

                // --- INICIO DE CONVERSACIÓN (Advanced Reasoning & Extraction) ---
                if (matchesKeyword(lowerInput, triggers) && conversationState.stage === 'idle') {
                    let processingText = lowerInput;

                    // 1. Identificar y eliminar disparadores
                    triggers.forEach(t => processingText = processingText.replace(t, ""));

                    // 2. Extracción de HORA con formatos variados (Detección de Ambivalencia)
                    let extractedTime = "";
                    let isAmbig = false;
                    let ambigH, ambigM;
                    const timeRegex = /(\d{1,2})[:h](\d{2})|(?<=las|la|a las|a la|las\s|la\s|a\slas\s|a\sla\s)(\d{1,2})|(?<=\s)(\d{1,2})(?=\s*(am|pm|tarde|mañana|noche))/gi;
                    const timeMatch = processingText.match(timeRegex);

                    if (timeMatch) {
                        let h = timeMatch[0].replace(/[:h]/g, ":").split(":")[0].trim();
                        let m = timeMatch[0].includes(":") || timeMatch[0].includes("h") ? timeMatch[0].split(/[:h]/)[1] : "00";
                        let hourInt = parseInt(h);
                        
                        const hasPeriod = (processingText.includes("tarde") || processingText.includes("noche") || processingText.includes("pm") || processingText.includes("mañana") || processingText.includes("am"));
                        if (hourInt <= 12 && !hasPeriod && !timeMatch[0].includes(":")) {
                            isAmbig = true;
                            ambigH = hourInt;
                            ambigM = m;
                        }

                        if ((processingText.includes("tarde") || processingText.includes("noche") || processingText.includes("pm")) && hourInt < 12) hourInt += 12;
                        if ((processingText.includes("mañana") || processingText.includes("am")) && hourInt === 12) hourInt = 0;

                        extractedTime = `${hourInt.toString().padStart(2, '0')}:${m.padStart(2, '0')}`;
                        processingText = processingText.replace(timeMatch[0], "");
                    }

                    // 3. Extracción de FECHA avanzada
                    const getInitDate = (text) => {
                        const now = new Date();
                        let target = new Date();
                        const nextMonthMatch = text.match(/(\d{1,2})\s*del\s*mes\s*que\s*viene/i);
                        if (nextMonthMatch) {
                            target = addMonths(startOfMonth(now), 1);
                            target.setDate(parseInt(nextMonthMatch[1]));
                            return { date: format(target, 'yyyy-MM-dd'), mentioned: true };
                        }
                        const dayOnlyMatch = text.match(/dia\s*(\d{1,2})|día\s*(\d{1,2})|el\s*(\d{1,2})/i);
                        if (dayOnlyMatch) {
                            target.setDate(parseInt(dayOnlyMatch[0].match(/\d+/)[0]));
                            if (target < now) target = addMonths(target, 1);
                            return { date: format(target, 'yyyy-MM-dd'), mentioned: true };
                        }
                        if (matchesKeyword(text, tomorrowKeywords)) return { date: format(addDays(now, 1), 'yyyy-MM-dd'), mentioned: true };
                        if (matchesKeyword(text, todayKeywords)) return { date: format(now, 'yyyy-MM-dd'), mentioned: true };

                        const daysMap = { 'lunes': 1, 'martes': 2, 'miercoles': 3, 'miércoles': 3, 'jueves': 4, 'viernes': 5, 'sabado': 6, 'sábado': 6, 'domingo': 0 };
                        for (let day in daysMap) {
                            if (text.includes(day)) {
                                const diff = (daysMap[day] + 7 - now.getDay()) % 7;
                                return { date: format(addDays(now, diff === 0 ? 7 : diff), 'yyyy-MM-dd'), mentioned: true };
                            }
                        }
                        return { date: format(now, 'yyyy-MM-dd'), mentioned: false };
                    };
                    const dateInfo = getInitDate(processingText);
                    const extractedDate = dateInfo.date;
                    const dateMentioned = dateInfo.mentioned;

                    // 4. Extracción de LUGAR (en [lugar])
                    let extractedPlace = "";
                    const placeMatch = processingText.match(/ en (.*?)(?= hoy| mañana| a las| las| para| de|$)/);
                    if (placeMatch) {
                        extractedPlace = placeMatch[1].trim();
                        processingText = processingText.replace(placeMatch[0], "");
                    }

                    // 5. Limpieza final del TÍTULO
                    let finalTitle = processingText
                        .replace(/\b(en|el|la|a|para|de|que|con|un|una)\b/gi, "")
                        .replace(/\s+/g, " ")
                        .trim();
                    finalTitle = finalTitle.charAt(0).toUpperCase() + finalTitle.slice(1);

                    // 6. Determinar Tipo
                    let extractedType = null;
                    if (matchesKeyword(lowerInput, geoKeywords) || extractedPlace) extractedType = 'geo';
                    if (matchesKeyword(lowerInput, alarmKeywords) && !extractedPlace) extractedType = 'alarm';

                    const data = {
                        title: finalTitle || "",
                        date: extractedDate,
                        time: extractedTime,
                        type: extractedType || (extractedPlace ? 'geo' : null),
                        address: extractedPlace,
                        radius: 1
                    };

                    setIsTyping(false);

                    if (!data.title) {
                        addMessage('assistant', "¡Claro! Yo te aviso. ¿Qué objetivo o tarea quieres recordar?");
                        setConversationState({ stage: 'awaiting_title', data });
                    } else if (isAmbig) {
                        addMessage('assistant', `Entendido: "${data.title}". ¿A las ${ambigH} de la mañana o de la tarde?`);
                        setConversationState({ stage: 'awaiting_time_period', data: { ...data, time: "", tempHour: ambigH, tempMin: ambigM } });
                    } else if (!data.type) {
                        addMessage('assistant', `Entendido: "${data.title}". ¿Quieres que sea un recordatorio por GPS o simplemente una alarma?`);
                        setConversationState({ stage: 'awaiting_type', data });
                    } else if (data.type === 'geo' && !data.address) {
                        addMessage('assistant', `Vale, recordatorio por GPS para "${data.title}". ¿Dónde quieres que me active?`);
                        setConversationState({ stage: 'awaiting_place', data });
                    } else if (!dateMentioned && data.type === 'alarm') {
                        addMessage('assistant', `Perfecto para "${data.title}". ¿Para qué día?`);
                        setConversationState({ stage: 'awaiting_day', data });
                    } else if (!data.time && data.type === 'alarm') {
                        addMessage('assistant', `¿A qué hora pongo la alarma para "${data.title}"?`);
                        setConversationState({ stage: 'awaiting_time', data });
                    } else if (data.type === 'geo') {
                        addMessage('assistant', `¡Lo tengo! Preparamos la alerta en "${data.address}" para "${data.title}". ¿Confirmamos?`);
                        setConversationState({ stage: 'awaiting_place', data });
                        // Trigger place search for the extracted place
                        setChatInput(data.address);
                        const fakeE = { preventDefault: () => { } };
                        setTimeout(() => processChatCommand(fakeE), 50);
                    } else {
                        setNewReminder(data);
                        setIsAdding(true);
                        addMessage('assistant', `¡Listo! Alarma para "${data.title}" el ${format(parseISO(data.date), 'dd MMMM', { locale: es })} a las ${data.time}. ¿Ok?`);
                        setConversationState({ stage: 'idle', data: {} });
                    }
                    return;
                }

                setIsTyping(false);
                if (lowerInput.includes("hola") || lowerInput.includes("buenas")) {
                    addMessage('assistant', "¡Hola! 👋 Soy Tisinapp. Tu asistente inteligente. Dime algo como: 'Recuérdame comprar pan en el Mercadona mañana a las 10'.");
                } else if (lowerInput.includes("gracias") || lowerInput.includes("vale") || lowerInput.includes("perfecto")) {
                    addMessage('assistant', "¡A ti! Estaré listo para avisarte. ✨");
                } else {
                    addMessage('assistant', "No estoy muy seguro de qué necesitas. Recuerda empezar con 'Recuérdame...' para crear una alerta.");
                }

            } catch (err) {
                setIsTyping(false);
                addMessage('assistant', "Vaya, parece que he tenido un pequeño error lógico. ¿Me lo podrías repetir de otra forma?");
            }
        }, 800);
    };

    const toggleComplete = async (reminder) => {
        const newStatus = reminder.status === 'active' ? 'completed' : 'active';
        try {
            await axios.patch(`${API_URL}/${reminder._id}`, { status: newStatus });
            fetchReminders();
        } catch (err) {
            console.error("Error updating status", err);
        }
    };

    const deleteReminder = async (id) => {
        try {
            await axios.delete(`${API_URL}/${id}`);
            fetchReminders();
        } catch (err) {
            console.error("Error deleting reminder", err);
        }
    };

    // Calendar logic
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
                                    setNewReminder({ ...newReminder, date: dayStr });
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

    const filteredReminders = reminders.filter(r => {
        if (filter === 'all') return true;
        return r.status === filter;
    });

    return (
        <div className="app-container">
            {/* Sidebar Toggle Button */}
            <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className={`sidebar-toggle ${sidebarCollapsed ? 'collapsed' : ''}`}
            >
                {sidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>

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

                {/* AI Chat History Container - NOW AT THE TOP */}
                <div className="chat-area" style={{ flexShrink: 0, background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--glass-border)', borderRadius: '20px', padding: '1rem', marginBottom: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>
                    <div style={{ height: '140px', overflowY: 'auto', marginBottom: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', paddingRight: '5px' }}>
                        {chatHistory.map((msg, i) => (
                            <div key={i} style={{
                                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                background: msg.role === 'user' ? 'var(--primary)' : 'rgba(255,255,255,0.08)',
                                color: 'white',
                                padding: '0.6rem 0.9rem', borderRadius: '14px', fontSize: '0.75rem', maxWidth: '85%',
                                boxShadow: msg.role === 'user' ? '0 4px 12px rgba(99, 102, 241, 0.3)' : 'none'
                            }}>
                                {msg.content}
                            </div>
                        ))}
                        {isTyping && <div className="typing-dots">...</div>}
                        <div ref={chatEndRef} />
                    </div>

                    <form onSubmit={processChatCommand} style={{ display: 'flex', gap: '0.5rem' }}>
                        <input type="text" placeholder="¿Qué quieres recordar?" value={chatInput} onChange={(e) => setChatInput(e.target.value)}
                            style={{ flex: 1, background: 'rgba(0,0,0,0.4)', border: '1px solid var(--glass-border)', color: 'white', padding: '0.6rem 1rem', borderRadius: '12px', outline: 'none', fontSize: '0.8rem' }}
                        />
                        <button type="submit" style={{ background: 'var(--primary)', border: 'none', borderRadius: '12px', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer', transition: 'var(--transition)' }}>
                            <Send size={16} />
                        </button>
                    </form>
                </div>

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

                {/* Adding Popup / Editor */}
                <AnimatePresence>
                    {isAdding && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                            style={{ position: 'absolute', top: '240px', left: '1rem', right: '1rem', background: '#1e293b', border: '1px solid var(--primary)', padding: '1.2rem', borderRadius: '24px', zIndex: 100, boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                <h3 style={{ fontSize: '1rem', color: 'white', marginBottom: '0.2rem' }}>Nueva Alerta</h3>
                                <input type="text" placeholder="¿Qué quieres recordar?" value={newReminder.title} onChange={(e) => setNewReminder({ ...newReminder, title: e.target.value })}
                                    style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', background: 'var(--glass)', border: '1px solid var(--glass-border)', color: 'white', fontSize: '0.85rem' }}
                                />
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input type="date" value={newReminder.date} onChange={(e) => setNewReminder({ ...newReminder, date: e.target.value })}
                                        style={{ flex: 2, padding: '0.6rem', borderRadius: '10px', background: 'var(--glass)', border: '1px solid var(--glass-border)', color: 'white', fontSize: '0.8rem' }}
                                    />
                                    <input type="time" value={newReminder.time} onChange={(e) => setNewReminder({ ...newReminder, time: e.target.value })}
                                        style={{ flex: 1, padding: '0.6rem', borderRadius: '10px', background: 'var(--glass)', border: '1px solid var(--glass-border)', color: 'white', fontSize: '0.8rem' }}
                                    />
                                </div>
                                {newReminder.coordinates &&
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.5rem 0' }}>
                                        <input type="range" min="0.1" max="10" step="0.1" value={newReminder.radius} onChange={(e) => setNewReminder({ ...newReminder, radius: parseFloat(e.target.value) })}
                                            style={{ flex: 1, accentColor: 'var(--primary)' }}
                                        />
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', minWidth: '45px' }}>{newReminder.radius} km</span>
                                    </div>
                                }
                                <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.5rem' }}>
                                    <button onClick={saveReminder} style={{ flex: 2, padding: '0.8rem', borderRadius: '12px', background: 'var(--primary)', color: 'white', border: 'none', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer' }}>Confirmar Recordatorio</button>
                                    <button onClick={() => setIsAdding(false)} style={{ flex: 1, padding: '0.8rem', borderRadius: '12px', background: 'transparent', color: 'white', border: '1px solid var(--glass-border)', fontSize: '0.85rem', cursor: 'pointer' }}>No</button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {selectedReminder && (
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                            style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '90%', maxWidth: '340px', background: '#0f172a', border: '1px solid var(--glass-border)', padding: '1.5rem', borderRadius: '24px', zIndex: 1100, boxShadow: '0 30px 60px rgba(0,0,0,0.8)' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase' }}>
                                        {selectedReminder.location ? <MapPin size={16} /> : <AlarmClock size={16} />}
                                        {selectedReminder.type === 'geo' ? 'Geo-Alerta' : 'Alarma'}
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

            <MapView
                reminders={reminders.filter(r => r.location)}
                userLocation={userLocation}
                onMapClick={handleMapClick}
                onReminderClick={(r) => {
                    setSidebarCollapsed(false);
                    setViewMode('list');
                    setFilter('all');
                }}
            />
        </div>
    );
}

export default Assistant;
