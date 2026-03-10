const express = require('express');
const router = express.Router();
const Reminder = require('../models/Reminder');

// Obtener todos los recordatorios
router.get('/', async (req, res) => {
    try {
        const reminders = await Reminder.find().sort({ createdAt: -1 });
        res.json(reminders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Crear un nuevo recordatorio
router.post('/', async (req, res) => {
    const reminder = new Reminder({
        title: req.body.title,
        description: req.body.description,
        location: {
            type: 'Point',
            coordinates: req.body.coordinates // [lng, lat]
        },
        address: req.body.address,
        radius: req.body.radius || 1,
        date: req.body.date
    });

    try {
        const newReminder = await reminder.save();
        res.status(201).json(newReminder);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Eliminar un recordatorio
router.delete('/:id', async (req, res) => {
    try {
        const reminder = await Reminder.findByIdAndDelete(req.params.id);
        if (!reminder) return res.status(404).json({ message: 'Recordatorio no encontrado' });
        res.json({ message: 'Recordatorio eliminado' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Actualizar estado de un recordatorio (completar)
router.patch('/:id', async (req, res) => {
    try {
        const reminder = await Reminder.findByIdAndUpdate(
            req.params.id,
            { status: req.body.status },
            { new: true }
        );
        if (!reminder) return res.status(404).json({ message: 'Recordatorio no encontrado' });
        res.json(reminder);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
