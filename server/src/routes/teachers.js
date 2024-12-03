const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Teacher = require('../models/Teacher');
const TeacherCourseAssignment = require('../models/TeacherCourseAssignment');

// Get teacher profile
router.get('/profile', auth, async (req, res) => {
    try {
        const teacher = await Teacher.findById(req.user.id).select('-password');
        
        if (!teacher) {
            return res.status(404).json({ message: 'Teacher not found' });
        }
        res.json(teacher);
    } catch (error) {
        console.error('Error fetching teacher profile:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update teacher profile
router.put('/profile', auth, async (req, res) => {
    try {
        const { full_name, academic_rank, department, contact_info } = req.body;
        const teacher = await Teacher.findOneAndUpdate(
            { teacher_id: req.user.id },
            { 
                full_name, 
                academic_rank, 
                department, 
                contact_info,
                updated_at: new Date()
            },
            { new: true }
        ).select('-password');

        if (!teacher) {
            return res.status(404).json({ message: 'Teacher not found' });
        }
        
        res.json(teacher);
    } catch (error) {
        console.error('Error updating teacher profile:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update the course fetching route
router.get('/courses', auth, async (req, res) => {
    try {
        const assignments = await TeacherCourseAssignment
            .find({ teacher_id: req.user.id })
            .populate({
                path: 'course_id',
                select: 'course_code course_name credit_hours contact_hours course_type' // Added contact_hours
            })
            .sort({ semester: 1 });

        if (!assignments) {
            return res.status(404).json({ message: 'No courses found' });
        }

        res.json(assignments);
    } catch (error) {
        console.error('Error fetching teacher courses:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update the course assignment route
router.post('/courses/assign', auth, async (req, res) => {
    try {
        const { course_id, semester, academic_year, sections } = req.body;
        
        // Check if any section of this course is already assigned
        const existingAssignment = await TeacherCourseAssignment.findOne({
            teacher_id: req.user.id,
            course_id: course_id,
            sections: { $in: sections }
        });

        if (existingAssignment) {
            return res.status(400).json({ 
                message: 'You have already been assigned to this course for one or more of these sections' 
            });
        }

        const assignment = new TeacherCourseAssignment({
            teacher_id: req.user.id,
            course_id,
            semester,
            academic_year,
            sections
        });

        await assignment.save();
        
        // Populate the course details before sending response
        const populatedAssignment = await TeacherCourseAssignment
            .findById(assignment._id)
            .populate({
                path: 'course_id',
                select: 'course_code course_name credit_hours contact_hours course_type'
            });

        res.status(201).json(populatedAssignment);
    } catch (error) {
        console.error('Error assigning course:', error);
        res.status(500).json({ message: error.message });
    }
});

// Add this route to handle course removal
router.delete('/courses/:id', auth, async (req, res) => {
    try {
        const assignment = await TeacherCourseAssignment.findOne({
            _id: req.params.id,
            teacher_id: req.user.id
        });

        if (!assignment) {
            return res.status(404).json({ message: 'Course assignment not found' });
        }

        await TeacherCourseAssignment.findByIdAndDelete(req.params.id);
        res.json({ message: 'Course removed successfully' });
    } catch (error) {
        console.error('Error removing course:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;