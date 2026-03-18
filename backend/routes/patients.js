const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Patient = require('../models/Patient');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// @route   GET /api/patients
// @desc    Get all patients for logged in doctor
// @access  Private
router.get('/', async (req, res) => {
    try {
        const patients = await Patient.find({ doctor: req.doctor.id })
            .sort({ createdAt: -1 });
        res.json(patients);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   GET /api/patients/:id
// @desc    Get single patient by ID
// @access  Private
router.get('/:id', async (req, res) => {
    try {
        const patient = await Patient.findOne({
            _id: req.params.id,
            doctor: req.doctor.id
        });

        if (!patient) {
            return res.status(404).json({ message: 'Patient not found' });
        }

        res.json(patient);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   POST /api/patients
// @desc    Add new patient
// @access  Private
router.post('/', [
    body('name').notEmpty().withMessage('Patient name is required'),
    body('age').isNumeric().withMessage('Age must be a number'),
    body('gender').isIn(['Male', 'Female', 'Other']).withMessage('Invalid gender')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const patientData = {
            ...req.body,
            doctor: req.doctor.id
        };

        const patient = await Patient.create(patientData);
        res.status(201).json(patient);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   PUT /api/patients/:id
// @desc    Update patient
// @access  Private
router.put('/:id', async (req, res) => {
    try {
        let patient = await Patient.findOne({
            _id: req.params.id,
            doctor: req.doctor.id
        });

        if (!patient) {
            return res.status(404).json({ message: 'Patient not found' });
        }

        patient = await Patient.findByIdAndUpdate(
            req.params.id,
            { ...req.body, updatedAt: Date.now() },
            { new: true, runValidators: true }
        );

        res.json(patient);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   DELETE /api/patients/:id
// @desc    Delete patient
// @access  Private
router.delete('/:id', async (req, res) => {
    try {
        const patient = await Patient.findOne({
            _id: req.params.id,
            doctor: req.doctor.id
        });

        if (!patient) {
            return res.status(404).json({ message: 'Patient not found' });
        }

        await Patient.findByIdAndDelete(req.params.id);
        res.json({ message: 'Patient removed successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   GET /api/patients/search/:query
// @desc    Search patients by name or ID
// @access  Private
router.get('/search/:query', async (req, res) => {
    try {
        const searchQuery = req.params.query;
        const patients = await Patient.find({
            doctor: req.doctor.id,
            $or: [
                { name: { $regex: searchQuery, $options: 'i' } },
                { patientId: { $regex: searchQuery, $options: 'i' } }
            ]
        });
        res.json(patients);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
