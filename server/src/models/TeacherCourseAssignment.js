const mongoose = require('mongoose');

const teacherCourseAssignmentSchema = new mongoose.Schema({
    teacher_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher',
        required: [true, 'Teacher ID is required']
    },
    course_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: [true, 'Course ID is required']
    },
    semester: {
        type: Number,
        required: [true, 'Semester is required'],
        min: [1, 'Semester must be between 1 and 8'],
        max: [8, 'Semester must be between 1 and 8']
    },
    academic_year: {
        type: String,
        required: [true, 'Academic year is required'],
        match: [/^20\d{2}$/, 'Academic year must be a valid year']
    },
    sections: [{
        type: String,
        required: [true, 'Section is required'],
        uppercase: true,
        match: [/^[A-C]$/, 'Section must be A, B, or C']
    }]
}, {
    timestamps: true
});

// Prevent duplicate assignments
teacherCourseAssignmentSchema.index(
    {
        teacher_id: 1,
        course_id: 1,
        'sections': 1,
        academic_year: 1
    },
    {
        unique: true,
        partialFilterExpression: { sections: { $exists: true } }
    }
);

module.exports = mongoose.model('TeacherCourseAssignment', teacherCourseAssignmentSchema);