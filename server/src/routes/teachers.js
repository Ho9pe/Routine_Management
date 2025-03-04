const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const Teacher = require('../models/Teacher');
const Course = require('../models/Course');
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
        // First get the teacher's full details including department
        const teacher = await Teacher.findById(req.user.id);
        if (!teacher) {
            return res.status(404).json({ message: 'Teacher not found' });
        }
        // Get teacher's current assignments
        const assignments = await TeacherCourseAssignment
            .find({ teacher_id: req.user.id })
            .populate({
                path: 'course_id',
                select: 'course_code course_name credit_hours contact_hours course_type department'
            })
            .sort({ semester: 1 });
        // Get all available courses for this teacher's department
        const availableCourses = await Course.find({ 
            department: teacher.department 
        });
        res.json({
            assignments,
            availableCourses
        });
    } catch (error) {
        console.error('Error fetching teacher courses:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
// Update the course assignment route
router.post('/courses/assign', auth, async (req, res) => {
    try {
        const { course_id, semester, academic_year, sections } = req.body;
        // Get teacher details
        const teacher = await Teacher.findById(req.user.id);
        if (!teacher) {
            return res.status(404).json({ message: 'Teacher not found' });
        }
        // Get course details and verify department
        const course = await Course.findById(course_id);
        if (!course) {
            return res.status(400).json({ message: 'Course not found' });
        }
        // Check if course belongs to teacher's department
        if (course.department !== teacher.department) {
            return res.status(403).json({ 
                message: `You can only be assigned to ${teacher.department} department courses` 
            });
        }
        // Find existing assignment for this course
        let existingAssignment = await TeacherCourseAssignment.findOne({
            teacher_id: req.user.id,
            course_id: course_id,
            academic_year: academic_year || new Date().getFullYear().toString()
        });
        if (existingAssignment) {
            // Check for section conflicts
            const newSections = sections.filter(section => 
                !existingAssignment.sections.includes(section)
            );
            if (newSections.length === 0) {
                return res.status(400).json({ 
                    message: 'All selected sections are already assigned to you for this course'
                });
            }
            // Add new sections to existing assignment
            existingAssignment.sections = [
                ...existingAssignment.sections,
                ...newSections
            ];
            await existingAssignment.save();
            // Populate the course details before sending response
            const populatedAssignment = await TeacherCourseAssignment
                .findById(existingAssignment._id)
                .populate({
                    path: 'course_id',
                    select: 'course_code course_name credit_hours contact_hours course_type department'
                });
            res.json(populatedAssignment);
        } else {
            // Create new assignment
            const assignment = new TeacherCourseAssignment({
                teacher_id: req.user.id,
                course_id,
                semester,
                academic_year: academic_year || new Date().getFullYear().toString(),
                sections
            });
            await assignment.save();
            // Populate the course details before sending response
            const populatedAssignment = await TeacherCourseAssignment
                .findById(assignment._id)
                .populate({
                    path: 'course_id',
                    select: 'course_code course_name credit_hours contact_hours course_type department'
                });
            res.status(201).json(populatedAssignment);
        }
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