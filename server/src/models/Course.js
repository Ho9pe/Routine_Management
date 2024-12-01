const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
    course_code: {
        type: String,
        required: [true, 'Course code is required'],
        unique: true,
        uppercase: true,
        trim: true,
        match: [
            /^[A-Z]{2,4}-\d{4}$/,
            'Course code must be in format: CSE-1101'
        ]
    },
    course_name: {
        type: String,
        required: [true, 'Course name is required'],
        trim: true,
        minlength: [3, 'Course name must be at least 3 characters long'],
        maxlength: [100, 'Course name cannot exceed 100 characters']
    },
    course_type: {
        type: String,
        required: true,
        enum: {
            values: ['theory', 'sessional', 'project', 'thesis'],
            message: '{VALUE} is not a valid course type'
        }
    },
    theory_hours: {
        type: Number,
        default: 0,
        min: [0, 'Theory hours cannot be negative'],
        max: [6, 'Theory hours cannot exceed 6']
    },
    practical_hours: {
        type: Number,
        default: 0,
        min: [0, 'Practical hours cannot be negative'],
        max: [6, 'Practical hours cannot exceed 6']
    },
    credit_hours: {
        type: Number,
        required: [true, 'Credit hours are required'],
        min: [0.75, 'Credit hours must be at least 0.75'],
        max: [4, 'Credit hours cannot exceed 4']
    },
    department: {
        type: String,
        required: [true, 'Department is required'],
        trim: true,
        uppercase: true,
        enum: {
            values: ['CSE', 'EEE', 'MATH', 'PHY', 'CHEM', 'HUM'],
            message: '{VALUE} is not a valid department'
        }
    },
    semester: {
        type: Number,
        required: [true, 'Semester is required'],
        min: [1, 'Semester must be between 1 and 8'],
        max: [8, 'Semester must be between 1 and 8']
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

// Compound index for efficient querying
courseSchema.index({ department: 1, semester: 1, course_type: 1 });
courseSchema.index({ course_code: 1, department: 1 }, { unique: true });

// Update timestamp on save
courseSchema.pre('save', function(next) {
    this.updated_at = new Date();
    next();
});

// Automatically determine course type based on hours
courseSchema.pre('save', function(next) {
    if (this.theory_hours > 0 && this.practical_hours === 0) {
        this.course_type = 'theory';
    } else if (this.theory_hours === 0 && this.practical_hours > 0) {
        if (this.course_code.includes('4000')) {
            this.course_type = 'thesis';
        } else {
            this.course_type = 'sessional';
        }
    }
    next();
});

// Virtual for full course name
courseSchema.virtual('full_course_name').get(function() {
    return `${this.course_code} - ${this.course_name}`;
});

// Method to get total hours per week
courseSchema.methods.getTotalHoursPerWeek = function() {
    return this.theory_hours + this.practical_hours;
};

module.exports = mongoose.model('Course', courseSchema);