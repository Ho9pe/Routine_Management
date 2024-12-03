const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const ClassSchedule = require('../models/ClassSchedule');
const RoutineGenerator = require('../utils/routineGenerator');
const TeacherCourseAssignment = require('../models/TeacherCourseAssignment');
const TeacherPreference = require('../models/TeacherPreference');
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

router.post('/generate', auth, roleCheck(['admin']), async (req, res) => {
    try {
        // Get all course assignments with populated course and teacher data
        const courseAssignments = await TeacherCourseAssignment
            .find()
            .populate('course_id')
            .populate('teacher_id');

        // Get all teacher preferences
        const preferences = await TeacherPreference.find();

        // Initialize and run the generator
        const generator = new RoutineGenerator(courseAssignments, preferences);
        await generator.generateRoutine();

        res.json({ message: 'Routine generated successfully' });
    } catch (error) {
        console.error('Routine generation error:', error);
        res.status(500).json({ 
            message: 'Failed to generate routine',
            error: error.message 
        });
    }
});

module.exports = router;