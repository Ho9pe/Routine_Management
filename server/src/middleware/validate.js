const { body, validationResult } = require('express-validator');

// Validate registration data
const validateRegistration = [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('role').isIn(['student', 'teacher']),
    body('department').notEmpty(),
    body('student_roll').if(body('role').equals('student')).notEmpty(),
    body('teacher_id').if(body('role').equals('teacher')).notEmpty(),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

module.exports = { validateRegistration };