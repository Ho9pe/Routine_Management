const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    full_name: {
        type: String,
        required: [true, 'Full name is required'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters long'],
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    student_roll: {
        type: String,
        required: [true, 'Student roll number is required'],
        unique: true,
        trim: true,
        match: [
            /^\d{7}$/,
            'Student roll must be exactly 7 digits'
        ]
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            'Please enter a valid email address'
        ]
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters long']
    },
    department: {
        type: String,
        required: [true, 'Department is required'],
        trim: true,
        uppercase: true
    },
    semester: {
        type: Number,
        min: [1, 'Semester must be between 1 and 8'],
        max: [8, 'Semester must be between 1 and 8']
    },
    batch: {
        type: String,
        required: true,
        match: [
            /^20\d{2}$/,
            'Batch must be a valid year (e.g., 2023)'
        ]
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

studentSchema.pre('save', function(next) {
    this.updated_at = new Date();
    next();
});

module.exports = mongoose.model('Student', studentSchema);