const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const TeacherPreference = require('../models/TeacherPreference');
const { PREFERENCE_LEVELS } = require('../constants/preferences');

// Get teacher preferences
router.get('/', auth, async (req, res) => {
    try {
        const preferences = await TeacherPreference.find({ teacher_id: req.user.id })
            .populate('course_id');
        res.json(preferences);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Add preference
router.post('/', auth, async (req, res) => {
    try {
        const { day_of_week, preferred_time_slot, preference_level } = req.body;

        // Validate preference level
        if (!Object.values(PREFERENCE_LEVELS).includes(preference_level)) {
            return res.status(400).json({ 
                message: 'Invalid preference level' 
            });
        }

        const preference = new TeacherPreference({
            teacher_id: req.user.id,
            day_of_week,
            preferred_time_slot,
            preference_level,
            academic_year: new Date().getFullYear().toString(),
            is_active: true
        });

        await preference.save();
        res.status(201).json(preference);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete preference
router.delete('/:id', auth, async (req, res) => {
    try {
        await TeacherPreference.findOneAndDelete({
            _id: req.params.id,
            teacher_id: req.user.id
        });
        res.json({ message: 'Preference removed' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;