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
        // Debug logging
        console.log('Student routine request:', {
            userId: req.user.id,
            userRole: req.user.role,
            email: req.user.email
        });

        // First, fetch the student's data if not in token
        if (!req.user.student_roll || !req.user.semester) {
            const student = await Student.findOne({ email: req.user.email });
            if (!student) {
                return res.status(404).json({ message: 'Student not found' });
            }
            req.user.student_roll = student.student_roll;
            req.user.semester = student.semester;
        }

        // Now proceed with the routine fetch
        const rollLastThree = parseInt(req.user.student_roll.slice(-3));
        let section;
        if (rollLastThree <= 60) section = 'A';
        else if (rollLastThree <= 120) section = 'B';
        else section = 'C';

        const currentYear = new Date().getFullYear().toString();

        console.log('Fetching schedule with params:', {
            semester: req.user.semester,
            section,
            academic_year: currentYear
        });

        const schedule = await ClassSchedule.find({
            semester: req.user.semester,
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
        console.error('Error fetching student routine:', error);
        res.status(500).json({ 
            message: 'Failed to fetch schedule',
            error: error.message 
        });
    }
});

// Get teacher routine
router.get('/teacher/routine', auth, roleCheck(['teacher']), async (req, res) => {
    try {
        const schedule = await ClassSchedule.find({
            teacher_id: req.user.id,
            academic_year: new Date().getFullYear().toString(),
            is_active: true
        })
        .populate('course_id')
        .sort({ day_of_week: 1, time_slot: 1 });
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

        console.log(`Found ${schedule.length} schedule entries`);

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
        
        console.log('Starting routine generation...');

        // Create new session
        session = await RoutineSession.create({
            academic_year: currentYear,
            generated_by: req.user.id,
            status: 'processing'
        });

        console.log('Created session:', session._id);

        // Clear existing routine
        await ClassSchedule.deleteMany({
            academic_year: currentYear
        });

        console.log('Cleared existing routine');

        // Get course assignments
        const courseAssignments = await TeacherCourseAssignment
            .find({ academic_year: currentYear })
            .populate('course_id')
            .populate('teacher_id');

        console.log(`Found ${courseAssignments.length} course assignments`);

        if (!courseAssignments.length) {
            session.status = 'failed';
            session.error_log.push('No course assignments found');
            await session.save();
            return res.status(400).json({ message: 'No course assignments found' });
        }

        // Get preferences
        const preferences = await TeacherPreference.find({
            academic_year: currentYear,
            is_active: true
        });

        console.log(`Found ${preferences.length} teacher preferences`);

        // Generate routine
        const generator = new RoutineGenerator(courseAssignments, preferences);
        const result = await generator.generateRoutine();

        console.log('Generation result:', result);

        // Sanitize conflicts before saving
        const sanitizedConflicts = result.conflicts.map(conflict => ({
            type: conflict.type,
            description: conflict.description,
            course_id: conflict.course_id,
            teacher_id: conflict.teacher_id,
            semester: conflict.semester,
            section: conflict.section,
            day: conflict.day,
            time_slot: conflict.time_slot
        }));

        // Update session
        session.status = result.success ? 'completed' : 'failed';
        session.end_time = new Date();
        session.conflicts = sanitizedConflicts;
        
        if (result.success) {
            session.success_log.push(`Generated ${result.scheduledCourses} courses`);
        }
        if (result.skippedCourses?.length) {
            session.error_log.push(`Skipped ${result.skippedCourses.length} courses`);
        }
        
        await session.save();

        res.json({
            message: result.success ? 'Routine generated successfully' : 'Routine generation failed',
            success: result.success,
            scheduledCourses: result.scheduledCourses,
            skippedCourses: result.skippedCourses,
            conflicts: sanitizedConflicts,
            sessionId: session._id
        });
    } catch (error) {
        console.error('Routine generation error:', error);
        
        // Update session with error if it exists
        if (session) {
            try {
                session.status = 'failed';
                session.error_log.push(error.message);
                await session.save();
            } catch (sessionError) {
                console.error('Error updating session:', sessionError);
            }
        }

        res.status(500).json({ 
            message: 'Failed to generate routine',
            error: error.message,
            details: error.errors ? Object.values(error.errors).map(e => e.message) : undefined
        });
    }
});

// Add this debug endpoint
router.get('/debug/schedule', auth, async (req, res) => {
    try {
        const count = await ClassSchedule.countDocuments();
        const sample = await ClassSchedule.findOne().populate('course_id teacher_id');
        
        res.json({
            totalSchedules: count,
            sampleSchedule: sample,
            currentUser: req.user
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;