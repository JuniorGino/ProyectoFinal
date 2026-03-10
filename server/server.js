const express = require('express');
const cors = require('cors');
const Datastore = require('nedb-promises');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

const fs = require('fs').promises;

// Base de Datos Local (Archivo)
const db = Datastore.create({
    filename: path.join(__dirname, 'data', 'reminders.db'),
    autoload: true
});

const USERS_FILE = path.join(__dirname, 'data', 'users.json');

// Helper to ensure users.json exists
async function initUsersFile() {
    try {
        await fs.access(USERS_FILE);
    } catch {
        await fs.writeFile(USERS_FILE, JSON.stringify([]));
    }
}
initUsersFile();

// Rutas de API - Auth
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) return res.status(400).json({ message: 'Faltan campos' });

        const data = await fs.readFile(USERS_FILE, 'utf8');
        const users = JSON.parse(data);

        if (users.find(u => u.email === email)) {
            return res.status(400).json({ message: 'El usuario ya existe' });
        }

        const newUser = { id: Date.now().toString(), name, email, password };
        users.push(newUser);

        await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));

        // Return without password
        res.status(201).json({ id: newUser.id, name: newUser.name, email: newUser.email });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const data = await fs.readFile(USERS_FILE, 'utf8');
        const users = JSON.parse(data);

        const user = users.find(u => u.email === email && u.password === password);
        if (!user) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        res.json({ id: user.id, name: user.name, email: user.email });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Rutas de API - Reminders
app.get('/api/reminders', async (req, res) => {
    try {
        const reminders = await db.find({}).sort({ createdAt: -1 });
        res.json(reminders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.post('/api/reminders', async (req, res) => {
    const reminder = {
        title: req.body.title,
        description: req.body.description,
        location: req.body.coordinates ? {
            type: 'Point',
            coordinates: req.body.coordinates
        } : null,
        address: req.body.address,
        radius: req.body.radius || 1,
        date: req.body.date, // Formato YYYY-MM-DD
        time: req.body.time, // Formato HH:mm
        status: 'active',
        createdAt: new Date()
    };

    try {
        const newDoc = await db.insert(reminder);
        res.status(201).json(newDoc);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

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

app.delete('/api/reminders/:id', async (req, res) => {
    try {
        await db.remove({ _id: req.params.id });
        res.json({ message: 'Recordatorio eliminado' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor (Modo Local) ejecutándose en el puerto ${PORT}`);
});
