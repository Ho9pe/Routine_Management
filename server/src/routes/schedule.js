const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const ClassSchedule = require('../models/ClassSchedule');
const RoutineGenerator = require('../utils/routineGenerator');
const TeacherCourseAssignment = require('../models/TeacherCourseAssignment');
const TeacherPreference = require('../models/TeacherPreference');
const RoutineSession = require('../models/RoutineSession');
const Student = require('../models/Student');

// Get student routine
router.get('/student/routine', auth, roleCheck(['student']), async (req, res) => {
    try {
        // Always fetch fresh student data
        const student = await Student.findOne({ email: req.user.email });
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }
        // Use the fresh student data
        const semester = student.semester;
        const rollLastThree = parseInt(student.student_roll.slice(-3));
        let section;
        if (rollLastThree <= 60) section = 'A';
        else if (rollLastThree <= 120) section = 'B';
        else section = 'C';
        const currentYear = new Date().getFullYear().toString();
        const schedule = await ClassSchedule.find({
            semester: semester,
            section: section,
            academic_year: currentYear,
            is_active: true
        })
        .populate({
            path: 'course_id',
            select: 'course_code course_name credit_hours contact_hours course_type'
        })
        .populate({
            path: 'teacher_id',
            select: 'full_name academic_rank'
        })
        .sort({ day_of_week: 1, time_slot: 1 });
        res.json(schedule);
    } catch (error) {
        console.error('Error fetching routine:', error);
        res.status(500).json({ 
            message: 'Failed to fetch routine',
            error: error.message 
        });
    }
});
// Get teacher routine
router.get('/teacher/routine', auth, roleCheck(['teacher']), async (req, res) => {
    try {
        const currentYear = new Date().getFullYear().toString();        
        const schedule = await ClassSchedule.find({
            teacher_id: req.user.id,
            academic_year: currentYear,
            is_active: true
        })
        .populate({
            path: 'course_id',
            select: 'course_code course_name credit_hours contact_hours course_type'
        })
        .populate({
            path: 'teacher_id',
            select: 'full_name academic_rank'
        })
        .sort({ day_of_week: 1, time_slot: 1 });
        console.log('Teacher schedule data:', schedule.map(item => ({
            course: item.course_id.course_code,
            section: item.section,
            day: item.day_of_week,
            timeSlot: item.time_slot
        })));
        res.json(schedule);
    } catch (error) {
        console.error('Error fetching teacher routine:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
// Get current routine status
router.get('/admin/status', auth, roleCheck(['admin']), async (req, res) => {
    try {
        const currentYear = new Date().getFullYear().toString();
        // Check for existing routine
        const hasExistingRoutine = await ClassSchedule.exists({
            academic_year: currentYear,
            is_active: true
        });
        // Get latest session
        const latestSession = await RoutineSession
            .findOne({ 
                academic_year: currentYear 
            })
            .sort({ createdAt: -1 });
        console.log('Status Check:', { hasExistingRoutine, latestSession });
        res.json({
            hasRoutine: !!hasExistingRoutine,
            lastGeneration: latestSession
        });
    } catch (error) {
        console.error('Status check error:', error);
        res.status(500).json({ 
            message: 'Failed to check routine status',
            error: error.message 
        });
    }
});
// Get admin routine view
router.get('/admin/routine', auth, roleCheck(['admin']), async (req, res) => {
    try {
        const { semester, section } = req.query;
        if (!semester || !section) {
            return res.status(400).json({
                message: 'Both semester and section are required'
            });
        }
        const currentYear = new Date().getFullYear().toString();
        console.log('Fetching routine:', { semester, section, currentYear });
        const schedule = await ClassSchedule.find({
            semester: parseInt(semester),
            section: section,
            academic_year: currentYear,
            is_active: true
        })
        .populate({
            path: 'course_id',
            select: 'course_code course_name credit_hours contact_hours course_type'
        })
        .populate({
            path: 'teacher_id',
            select: 'full_name academic_rank'
        })
        .sort({ day_of_week: 1, time_slot: 1 });
        console.log(`Found ${schedule.length} schedule entries for section ${section}`);
        res.json(schedule);
    } catch (error) {
        console.error('Error fetching routine:', error);
        res.status(500).json({ 
            message: 'Failed to fetch routine',
            error: error.message 
        });
    }
});
// Generate routine (admin only)
router.post('/admin/generate', auth, roleCheck(['admin']), async (req, res) => {
    let session;
    try {
        const currentYear = new Date().getFullYear().toString();
        console.log('Starting routine generation process');
        // Create new session
        session = await RoutineSession.create({
            academic_year: currentYear,
            generated_by: req.user.id,
            status: 'processing'
        });
        // Clear existing routine
        await ClassSchedule.deleteMany({
            academic_year: currentYear
        });
        // Fetch and validate course assignments
        const courseAssignments = await TeacherCourseAssignment
            .find({ academic_year: currentYear })
            .populate('course_id')
            .populate('teacher_id');
        console.log('Fetched course assignments:', {
            count: courseAssignments.length,
            sampleAssignment: courseAssignments[0] ? {
                courseCode: courseAssignments[0].course_id?.course_code,
                teacherName: courseAssignments[0].teacher_id?.full_name,
                sections: courseAssignments[0].sections
            } : null
        });
        if (!courseAssignments.length) {
            throw new Error('No course assignments found');
        }
        // Fetch preferences
        const preferences = await TeacherPreference.find({
            academic_year: currentYear,
            is_active: true
        });
        console.log('Fetched preferences:', {
            count: preferences.length
        });
        // Initialize generator
        const generator = new RoutineGenerator(courseAssignments, preferences);
        // Generate routine
        const result = await generator.generateRoutine();
        // Update session
        session.status = 'completed';
        session.end_time = new Date();
        session.conflicts = result.conflicts;
        if (result.skippedCourses?.length) {
            session.error_log.push(`Skipped ${result.skippedCourses.length} courses`);
        }
        await session.save();
        res.json({
            success: true,
            scheduledCourses: result.scheduledCourses,
            skippedCourses: result.skippedCourses,
            conflicts: result.conflicts?.length || 0,
            sessionId: session._id
        });
    } catch (error) {
        console.error('Routine generation error:', {
            message: error.message,
            stack: error.stack
        });
        if (session) {
            session.status = 'failed';
            session.error_log.push(error.message);
            await session.save();
        }
        res.status(500).json({ 
            success: false,
            message: 'Failed to generate routine',
            error: error.message
        });
    }
});

module.exports = router;