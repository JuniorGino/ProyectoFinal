import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

// Determina si el error es debido a que el backend no está corriendo/es inalcanzable
const isNetworkError = (error) => {
    return !error.response && (error.code === 'ERR_NETWORK' || error.message === 'Network Error');
};

// --- AUTENTICACIÓN (LOGIN Y REGISTRO) ---

export const login = async (email, password) => {
    try {
        const resp = await axios.post(`${API_BASE}/auth/login`, { email, password });
        return resp.data;
    } catch (err) {
        if (isNetworkError(err)) {
            console.log('Servidor backend offline. Usando almacenamiento local (localStorage)...');
            const users = JSON.parse(localStorage.getItem('tisinapp_users') || '[]');
            const user = users.find(u => u.email === email && u.password === password);
            if (!user) {
                throw new Error('Credenciales inválidas (modo sin servidor)');
            }
            return { id: user.id, name: user.name, email: user.email };
        }
        throw err;
    }
};

export const register = async (name, email, password) => {
    try {
        const resp = await axios.post(`${API_BASE}/auth/register`, { name, email, password });
        return resp.data;
    } catch (err) {
        if (isNetworkError(err)) {
            console.log('Servidor backend offline. Registrando en almacenamiento local (localStorage)...');
            const users = JSON.parse(localStorage.getItem('tisinapp_users') || '[]');
            if (users.find(u => u.email === email)) {
                throw new Error('El usuario ya existe con este correo electrónico (modo sin servidor)');
            }
            const newUser = { id: Date.now().toString(), name, email, password };
            users.push(newUser);
            localStorage.setItem('tisinapp_users', JSON.stringify(users));
            return { id: newUser.id, name: newUser.name, email: newUser.email };
        }
        throw err;
    }
};

// --- GESTIÓN DE RECORDATORIOS (CRUD) ---

export const getReminders = async () => {
    try {
        const resp = await axios.get(`${API_BASE}/reminders`);
        return resp.data;
    } catch (err) {
        if (isNetworkError(err)) {
            console.log('Servidor backend offline. Cargando recordatorios de localStorage...');
            return JSON.parse(localStorage.getItem('tisinapp_reminders') || '[]');
        }
        throw err;
    }
};

export const createReminder = async (reminderData) => {
    try {
        const resp = await axios.post(`${API_BASE}/reminders`, reminderData);
        return resp.data;
    } catch (err) {
        if (isNetworkError(err)) {
            console.log('Servidor backend offline. Guardando recordatorio en localStorage...');
            const reminders = JSON.parse(localStorage.getItem('tisinapp_reminders') || '[]');
            
            const newReminder = {
                _id: Date.now().toString(),
                ...reminderData,
                location: reminderData.coordinates ? {
                    type: 'Point',
                    coordinates: reminderData.coordinates
                } : null,
                status: 'active',
                createdAt: new Date().toISOString()
            };
            
            reminders.unshift(newReminder); // Añade al inicio
            localStorage.setItem('tisinapp_reminders', JSON.stringify(reminders));
            return newReminder;
        }
        throw err;
    }
};

export const updateReminderStatus = async (id, status) => {
    try {
        const resp = await axios.patch(`${API_BASE}/reminders/${id}`, { status });
        return resp.data;
    } catch (err) {
        if (isNetworkError(err)) {
            console.log('Servidor backend offline. Actualizando estado en localStorage...');
            const reminders = JSON.parse(localStorage.getItem('tisinapp_reminders') || '[]');
            const updatedReminders = reminders.map(r => 
                r._id === id ? { ...r, status } : r
            );
            localStorage.setItem('tisinapp_reminders', JSON.stringify(updatedReminders));
            return { _id: id, status };
        }
        throw err;
    }
};

export const deleteReminder = async (id) => {
    try {
        const resp = await axios.delete(`${API_BASE}/reminders/${id}`);
        return resp.data;
    } catch (err) {
        if (isNetworkError(err)) {
            console.log('Servidor backend offline. Eliminando recordatorio de localStorage...');
            const reminders = JSON.parse(localStorage.getItem('tisinapp_reminders') || '[]');
            const updatedReminders = reminders.filter(r => r._id !== id);
            localStorage.setItem('tisinapp_reminders', JSON.stringify(updatedReminders));
            return { message: 'Recordatorio eliminado' };
        }
        throw err;
    }
};
