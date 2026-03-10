const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'El título es obligatorio'],
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            required: true
        }
    },
    address: {
        type: String
    },
    radius: {
        type: Number,
        default: 1 // Default 1km
    },
    status: {
        type: String,
        enum: ['active', 'completed'],
        default: 'active'
    },
    date: {
        type: Date,
        default: Date.now
    },
    isCompleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Índice geoespacial para búsquedas por cercanía
reminderSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Reminder', reminderSchema);
