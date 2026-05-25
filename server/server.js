/**
 * BACKEND ACTIVO - Tisinapp Server
 * 
 * Este archivo configura un servidor Node.js con Express para gestionar la API REST.
 * Utiliza:
 * - CORS para permitir solicitudes del cliente React (puerto 5173).
 * - nedb-promises como base de datos local ligera y rápida en un archivo (reminders.db).
 * - El sistema de archivos (fs) para almacenar usuarios de forma local en formato JSON (users.json).
 * 
 * Proporciona endpoints para registro/inicio de sesión de usuarios y operaciones completas (CRUD) de recordatorios.
 */

const express = require('express');
const cors = require('cors');
const Datastore = require('nedb-promises');
const path = require('path');
const fs = require('fs').promises;
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// ==========================================
// MIDDLEWARES DE EXPRESS
// ==========================================
app.use(cors()); // Habilita Cross-Origin Resource Sharing para conectar con el frontend
app.use(express.json()); // Permite al servidor entender solicitudes en formato JSON

// ==========================================
// CONFIGURACIÓN DE LA BASE DE DATOS LOCAL
// ==========================================
// NeDB crea un archivo local en la carpeta 'data' para almacenar los recordatorios de manera persistente.
const db = Datastore.create({
    filename: path.join(__dirname, 'data', 'reminders.db'),
    autoload: true
});

// Ruta al archivo de almacenamiento local de usuarios en JSON
const USERS_FILE = path.join(__dirname, 'data', 'users.json');

/**
 * Inicialización asíncrona: asegura la existencia del archivo users.json
 * Si el archivo no existe, lo crea con un arreglo vacío.
 */
async function initUsersFile() {
    try {
        await fs.access(USERS_FILE);
    } catch {
        await fs.writeFile(USERS_FILE, JSON.stringify([]));
    }
}
initUsersFile();

// ==========================================
// RUTAS DE LA API - AUTENTICACIÓN (AUTH)
// ==========================================

/**
 * REGISTRO DE USUARIO: POST /api/auth/register
 * Crea un nuevo usuario y lo guarda en el archivo local 'users.json'.
 */
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        // Validación de campos obligatorios
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Faltan campos obligatorios' });
        }

        // Lee los usuarios existentes
        const data = await fs.readFile(USERS_FILE, 'utf8');
        const users = JSON.parse(data);

        // Verifica si el correo ya está registrado
        if (users.find(u => u.email === email)) {
            return res.status(400).json({ message: 'El usuario ya existe con este correo electrónico' });
        }

        // Crea el nuevo usuario con un ID único basado en la fecha actual
        const newUser = { id: Date.now().toString(), name, email, password };
        users.push(newUser);

        // Guarda el arreglo actualizado de usuarios
        await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));

        // Retorna el usuario registrado (sin contraseña por seguridad)
        res.status(201).json({ id: newUser.id, name: newUser.name, email: newUser.email });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

/**
 * INICIO DE SESIÓN (LOGIN): POST /api/auth/login
 * Verifica las credenciales de correo y contraseña contra los usuarios en 'users.json'.
 */
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Lee los usuarios guardados
        const data = await fs.readFile(USERS_FILE, 'utf8');
        const users = JSON.parse(data);

        // Busca el usuario que coincida exactamente con las credenciales
        const user = users.find(u => u.email === email && u.password === password);
        if (!user) {
            return res.status(401).json({ message: 'Credenciales inválidas (correo o contraseña incorrectos)' });
        }

        // Retorna los datos del usuario logueado exitosamente
        res.json({ id: user.id, name: user.name, email: user.email });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ==========================================
// RUTAS DE LA API - GESTIÓN DE RECORDATORIOS
// ==========================================

/**
 * OBTENER RECORDATORIOS: GET /api/reminders
 * Devuelve todos los recordatorios creados ordenados por fecha de creación descendente.
 */
app.get('/api/reminders', async (req, res) => {
    try {
        const reminders = await db.find({}).sort({ createdAt: -1 });
        res.json(reminders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

/**
 * CREAR RECORDATORIO: POST /api/reminders
 * Añade un nuevo recordatorio (Alarma o Geo-Alerta) a la base de datos local NeDB.
 */
app.post('/api/reminders', async (req, res) => {
    // Estructura el objeto de recordatorio
    const reminder = {
        title: req.body.title,
        description: req.body.description,
        // Si tiene coordenadas, se formatea como un objeto GeoJSON tipo "Point"
        location: req.body.coordinates ? {
            type: 'Point',
            coordinates: req.body.coordinates
        } : null,
        address: req.body.address,
        radius: req.body.radius || 1, // Radio en km para alertas GPS
        date: req.body.date, // Formato YYYY-MM-DD
        time: req.body.time, // Formato HH:mm (Opcional)
        status: 'active', // Estado inicial 'active' (no completado)
        createdAt: new Date()
    };

    try {
        const newDoc = await db.insert(reminder);
        res.status(201).json(newDoc); // Retorna el recordatorio creado
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

/**
 * ACTUALIZAR ESTADO DEL RECORDATORIO: PATCH /api/reminders/:id
 * Modifica el estado del recordatorio (por ejemplo: de 'active' a 'completed').
 */
app.patch('/api/reminders/:id', async (req, res) => {
    try {
        const updated = await db.update(
            { _id: req.params.id },
            { $set: { status: req.body.status } },
            { returnUpdatedDocs: true }
        );
        res.json(updated);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

/**
 * ELIMINAR RECORDATORIO: DELETE /api/reminders/:id
 * Borra permanentemente un recordatorio según su ID.
 */
app.delete('/api/reminders/:id', async (req, res) => {
    try {
        await db.remove({ _id: req.params.id });
        res.json({ message: 'Recordatorio eliminado correctamente' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ==========================================
// INICIO DEL SERVIDOR
// ==========================================
app.listen(PORT, () => {
    console.log(`Servidor de Tisinapp ejecutándose en el puerto ${PORT}`);
});
