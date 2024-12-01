const mongoose = require('mongoose');

const ACADEMIC_RANKS = ['Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer'];

const teacherSchema = new mongoose.Schema({
    teacher_id: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
    },
    full_name: {
        type: String,
        required: true,
        trim: true,
        minlength: [2, 'Name must be at least 2 characters long'],
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    academic_rank: {
        type: String,
        required: true,
        enum: {
            values: ACADEMIC_RANKS,
            message: '{VALUE} is not a valid academic rank'
        }
    },
    department: {
        type: String,
        required: true,
        trim: true
    },
    contact_info: {
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
            match: [
                /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                'Please enter a valid email address'
            ]
        },
        phone: {
            type: String,
            trim: true,
            match: [
                /^[0-9]{10,}$/,
                'Please enter a valid phone number, 10 digits required'
            ]
        },
        office: {
            type: String,
            trim: true
        }
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
});

// Update the updated_at timestamp before saving
teacherSchema.pre('save', function(next) {
    this.updated_at = new Date();
    next();
});

module.exports = mongoose.model('Teacher', teacherSchema);