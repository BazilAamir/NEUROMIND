const express = require('express');
const router = express.Router();
const Doctor = require('../models/Doctor');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// @route   GET /api/doctors/me
// @desc    Get current doctor profile
// @access  Private
router.get('/me', async (req, res) => {
    try {
        const doctor = await Doctor.findById(req.doctor.id).select('-password');
        res.json(doctor);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   PUT /api/doctors/update
// @desc    Update doctor profile
// @access  Private
router.put('/update', async (req, res) => {
    try {
        const { name, specialization, hospital, phone } = req.body;

        const doctor = await Doctor.findByIdAndUpdate(
            req.doctor.id,
            { name, specialization, hospital, phone },
            { new: true, runValidators: true }
        ).select('-password');

        res.json(doctor);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   GET /api/doctors/stats
// @desc    Get doctor dashboard stats
// @access  Private
router.get('/stats', async (req, res) => {
    try {
        const Patient = require('../models/Patient');

        const totalPatients = await Patient.countDocuments({ doctor: req.doctor.id });
        const activePatients = await Patient.countDocuments({ doctor: req.doctor.id, status: 'Active' });
        const criticalPatients = await Patient.countDocuments({ doctor: req.doctor.id, status: 'Critical' });
        const recoveredPatients = await Patient.countDocuments({ doctor: req.doctor.id, status: 'Recovered' });

        res.json({
            totalPatients,
            activePatients,
            criticalPatients,
            recoveredPatients
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
