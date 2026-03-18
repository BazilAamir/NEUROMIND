const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
    patientId: {
        type: String,
        unique: true,
        default: function() {
            return 'PAT-' + Math.floor(10000 + Math.random() * 90000);
        }
    },
    name: {
        type: String,
        required: [true, 'Patient name is required'],
        trim: true
    },
    age: {
        type: Number,
        required: [true, 'Age is required']
    },
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other'],
        required: [true, 'Gender is required']
    },
    phone: {
        type: String,
        default: ''
    },
    email: {
        type: String,
        lowercase: true,
        trim: true,
        default: ''
    },
    address: {
        type: String,
        default: ''
    },
    bloodGroup: {
        type: String,
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', ''],
        default: ''
    },
    medicalHistory: {
        type: String,
        default: ''
    },
    allergies: {
        type: String,
        default: ''
    },
    currentMedications: {
        type: String,
        default: ''
    },
    diagnosis: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['Active', 'Recovered', 'Under Treatment', 'Critical'],
        default: 'Active'
    },
    doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
        required: true
    },
    lastVisit: {
        type: Date,
        default: Date.now
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt field before saving
patientSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Patient', patientSchema);
