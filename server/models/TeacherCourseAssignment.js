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
        match: [
            /^20\d{2}$/,
            'Academic year must be a valid year (e.g., 2024)'
        ]
    },
    sections: [{
        type: String,
        required: [true, 'Section is required'],
        uppercase: true,
        match: [
            /^[A-D]$/,
            'Section must be A, B, C, or D'
        ]
    }],
    status: {
        type: String,
        enum: {
            values: ['active', 'completed', 'cancelled'],
            message: '{VALUE} is not a valid status'
        },
        default: 'active'
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
});

// Compound index to prevent duplicate assignments
teacherCourseAssignmentSchema.index(
    { 
        teacher_id: 1, 
        course_id: 1, 
        semester: 1, 
        academic_year: 1,
        'sections': 1 
    }, 
    { unique: true }
);

// Update timestamp on save
teacherCourseAssignmentSchema.pre('save', function(next) {
    this.updated_at = new Date();
    next();
});

// Validate that a teacher isn't overloaded
teacherCourseAssignmentSchema.pre('save', async function(next) {
    if (this.isNew || this.isModified('teacher_id')) {
        const assignmentCount = await this.constructor.countDocuments({
            teacher_id: this.teacher_id,
            semester: this.semester,
            academic_year: this.academic_year,
            status: 'active'
        });
        
        if (assignmentCount >= 6) {
            throw new Error('Teacher cannot be assigned more than 6 courses per semester');
        }
    }
    next();
});

// Add a method to check if a teacher is available for a course
teacherCourseAssignmentSchema.statics.isTeacherAvailable = async function(
    teacherId, 
    semester, 
    academicYear
) {
    const assignmentCount = await this.countDocuments({
        teacher_id: teacherId,
        semester: semester,
        academic_year: academicYear,
        status: 'active'
    });
    
    return assignmentCount < 6;
};

module.exports = mongoose.model('TeacherCourseAssignment', teacherCourseAssignmentSchema);