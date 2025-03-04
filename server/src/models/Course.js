const mongoose = require('mongoose');

// Schema for the Course model
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
    contact_hours: {
        type: Number,
        required: [true, 'Contact hours are required'],
        min: [0, 'Contact hours cannot be negative'],
        max: [6, 'Contact hours cannot exceed 6']
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
    }
}, {
    timestamps: true
});
// Compound indexes for efficient querying
courseSchema.index({ department: 1, semester: 1, course_type: 1 });
courseSchema.index({ course_code: 1, department: 1 }, { unique: true });
// Course type determination logic
courseSchema.pre('save', function(next) {
    const codeNumber = this.course_code.split('-')[1];
    const lastDigit = parseInt(codeNumber[3]);
    const isEven = lastDigit % 2 === 0;
    const endsWithZero = lastDigit === 0;
    const nameIncludes = (str) => this.course_name.toLowerCase().includes(str.toLowerCase());
    if (endsWithZero) {
        if (nameIncludes('thesis')) {
            this.course_type = 'thesis';
        } else if (nameIncludes('project')) {
            this.course_type = 'project';
        }
    } else if (isEven) {
        this.course_type = 'sessional';
    } else {
        this.course_type = 'theory';
    }
    next();
});

module.exports = mongoose.model('Course', courseSchema);