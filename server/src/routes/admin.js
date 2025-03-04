const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const Admin = require('../models/Admin');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Course = require('../models/Course');

// Get dashboard stats (admin only)
router.get('/dashboard', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }
        const totalCourses = await Course.countDocuments();
        const totalTeachers = await Teacher.countDocuments();
        const totalStudents = await Student.countDocuments();
        res.json({
            totalCourses,
            totalTeachers,
            totalStudents
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});
// Get all students (admin only)
router.get('/students', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }
        const students = await Student.find().select('-password');
        res.json(students);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});
// Get all teachers (admin only)
router.get('/teachers', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }
        const teachers = await Teacher.find().select('-password');
        res.json(teachers);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});
// Get all courses (admin only)
router.get('/courses', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }
        const courses = await Course.find().sort({ 
            department: 1, 
            semester: 1, 
            course_code: 1 
        });
        res.json(courses);
    } catch (error) {
        console.error('Error fetching courses:', error);
        res.status(500).json({ message: 'Failed to fetch courses' });
    }
});
// Delete course (admin only)
router.delete('/courses/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }
        const course = await Course.findByIdAndDelete(req.params.id);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }
        res.json({ message: 'Course deleted successfully' });
    } catch (error) {
        console.error('Error deleting course:', error);
        res.status(500).json({ message: 'Failed to delete course' });
    }
});
// Get admin profile
router.get('/profile', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }    
        const admin = await Admin.findById(req.user.id).select('-password');
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }
        res.json(admin);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});
// Update admin profile
router.put('/profile', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }
        const { name, email, contact_info } = req.body;
        const admin = await Admin.findByIdAndUpdate(
            req.user.id,
            { 
                name,
                email,
                contact_info,
                updated_at: new Date()
            },
            { new: true }
        ).select('-password');
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }
        res.json(admin);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});
// Delete student (admin only)
router.delete('/students/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }
        await Student.findByIdAndDelete(req.params.id);
        res.json({ message: 'Student deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});
// Delete teacher (admin only)
router.delete('/teachers/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }
        await Teacher.findByIdAndDelete(req.params.id);
        res.json({ message: 'Teacher deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;