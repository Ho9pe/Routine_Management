const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ClassSchedule = require('../models/ClassSchedule');

// Get schedule
router.get('/', auth, async (req, res) => {
    try {
        const { day, course, teacher } = req.query;
        let query = {};

        if (day) query.day_of_week = day;
        if (course) query.course_id = course;
        if (teacher) query.teacher_id = teacher;

        const schedule = await ClassSchedule.find(query)
            .populate('course_id')
            .populate('teacher_id');
        res.json(schedule);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;