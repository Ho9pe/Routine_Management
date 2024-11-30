const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const Course = require('../models/Course');
const roleCheck = require('../middleware/roleCheck');

// Get all courses
router.get('/', auth, async (req, res) => {
    try {
        const courses = await Course.find();
        res.json(courses);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Add course (admin only)
router.post('/', auth, roleCheck(['admin']), async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }
        const course = new Course(req.body);
        await course.save();
        res.status(201).json(course);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Update course (admin only)
router.put('/:id', auth, roleCheck(['admin']), async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }
        const course = await Course.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        res.json(course);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete course (admin only)
router.delete('/:id', auth, roleCheck(['admin']), async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }
        await Course.findByIdAndDelete(req.params.id);
        res.json({ message: 'Course deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;