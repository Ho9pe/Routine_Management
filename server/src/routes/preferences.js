const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const TeacherPreference = require('../models/TeacherPreference');
const TeacherCourseAssignment = require('../models/TeacherCourseAssignment');
const { TIME_SLOTS } = require('../constants/timeSlots');

// Get teacher preferences with course details
router.get('/', auth, async (req, res) => {
    try {
        console.log('Fetching preferences for teacher:', req.user.id);
        
        const preferences = await TeacherPreference.find({ 
            teacher_id: req.user.id,
            is_active: true 
        }).populate({
            path: 'course_id',
            select: 'course_code course_name credit_hours contact_hours course_type'
        });
        
        console.log('Found preferences:', preferences.length);

        // Get assigned courses
        const assignments = await TeacherCourseAssignment.find({
            teacher_id: req.user.id
        }).populate({
            path: 'course_id',
            select: 'course_code course_name credit_hours contact_hours course_type'
        });

        console.log('Found assignments:', assignments.length);

        res.json({
            preferences,
            assignments
        });
    } catch (error) {
        console.error('Error fetching preferences:', error);
        res.status(500).json({ 
            message: 'Failed to fetch preferences',
            error: error.message 
        });
    }
});

// Add or update preference
router.post('/', auth, async (req, res) => {
    try {
        console.log('Creating preference:', req.body);
        
        const { 
            course_id,
            day_of_week, 
            preferred_time_slot, 
            preference_level
        } = req.body;

        // Validate required fields
        if (!course_id || !day_of_week || !preferred_time_slot) {
            return res.status(400).json({ 
                message: 'Missing required fields',
                required: ['course_id', 'day_of_week', 'preferred_time_slot'],
                received: { course_id, day_of_week, preferred_time_slot }
            });
        }

        // Validate preference level
        if (!['HIGH', 'MEDIUM', 'LOW', 'UNAVAILABLE'].includes(preference_level)) {
            return res.status(400).json({ 
                message: 'Invalid preference level',
                allowed: ['HIGH', 'MEDIUM', 'LOW', 'UNAVAILABLE'],
                received: preference_level
            });
        }

        // Check if teacher is assigned to this course
        const assignment = await TeacherCourseAssignment.findOne({
            teacher_id: req.user.id,
            course_id
        });

        if (!assignment) {
            return res.status(403).json({ 
                message: 'You are not assigned to this course',
                details: {
                    teacher_id: req.user.id,
                    course_id
                }
            });
        }

        // Check for existing preference for same day and time slot
        const existingPreference = await TeacherPreference.findOne({
            teacher_id: req.user.id,
            course_id,
            day_of_week,
            preferred_time_slot,
            academic_year: new Date().getFullYear().toString(),
            is_active: true
        });

        if (existingPreference) {
            return res.status(409).json({ 
                message: `You already have a preference set for ${day_of_week} at ${
                    TIME_SLOTS.find(slot => slot.id === preferred_time_slot)?.time
                }. Please choose a different time slot.`,
                type: 'duplicate_slot'
            });
        }

        let preference;
        if (existingPreference) {
            // Update existing preference
            existingPreference.preference_level = preference_level;
            preference = await existingPreference.save();
        } else {
            // Create new preference
            const newPreference = new TeacherPreference({
                teacher_id: req.user.id,
                course_id,
                day_of_week,
                preferred_time_slot,
                preference_level,
                academic_year: new Date().getFullYear().toString(),
                is_active: true
            });

            preference = await newPreference.save();
        }

        if (!preference) {
            throw new Error('Failed to save preference to database');
        }

        // Populate course details
        await preference.populate({
            path: 'course_id',
            select: 'course_code course_name credit_hours contact_hours course_type'
        });
        
        console.log('Saved preference:', {
            id: preference._id,
            course: preference.course_id.course_code,
            day: preference.day_of_week,
            timeSlot: preference.preferred_time_slot,
            level: preference.preference_level
        });
        
        res.status(201).json(preference);
    } catch (error) {
        console.error('Error saving preference:', {
            error: error.message,
            stack: error.stack,
            body: req.body
        });
        res.status(500).json({ 
            message: 'Failed to save preference',
            error: error.message,
            details: process.env.NODE_ENV === 'development' ? {
                stack: error.stack,
                body: req.body
            } : undefined
        });
    }
});

// Delete preference
router.delete('/:id', auth, async (req, res) => {
    try {
        const preference = await TeacherPreference.findOne({
            _id: req.params.id,
            teacher_id: req.user.id
        });

        if (!preference) {
            return res.status(404).json({ message: 'Preference not found' });
        }

        await preference.deleteOne();
        res.json({ message: 'Preference removed' });
    } catch (error) {
        console.error('Error deleting preference:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;