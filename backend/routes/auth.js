const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const Doctor = require('../models/Doctor');

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
};

// @route   POST /api/auth/register
// @desc    Register a new doctor
// @access  Public
router.post('/register', [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, email, password, specialization, hospital, phone } = req.body;

        // Check if doctor already exists
        const doctorExists = await Doctor.findOne({ email });
        if (doctorExists) {
            return res.status(400).json({ message: 'Doctor with this email already exists' });
        }

        // Create new doctor
        const doctor = await Doctor.create({
            name,
            email,
            password,
            specialization,
            hospital,
            phone
        });

        if (doctor) {
            res.status(201).json({
                _id: doctor._id,
                name: doctor.name,
                email: doctor.email,
                doctorId: doctor.doctorId,
                specialization: doctor.specialization,
                hospital: doctor.hospital,
                token: generateToken(doctor._id)
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   POST /api/auth/login
// @desc    Login doctor
// @access  Public
router.post('/login', [
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        // Find doctor by email
        const doctor = await Doctor.findOne({ email });

        if (doctor && (await doctor.matchPassword(password))) {
            res.json({
                _id: doctor._id,
                name: doctor.name,
                email: doctor.email,
                doctorId: doctor.doctorId,
                specialization: doctor.specialization,
                hospital: doctor.hospital,
                token: generateToken(doctor._id)
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   GET /api/auth/profile
// @desc    Get doctor profile
// @access  Private
router.get('/profile', require('../middleware/auth'), async (req, res) => {
    try {
        const doctor = await Doctor.findById(req.doctor.id).select('-password');
        res.json(doctor);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
