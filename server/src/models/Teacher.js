const mongoose = require('mongoose');

// Academic ranks for teachers
const ACADEMIC_RANKS = ['Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer'];
// Teacher schema
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
                'Please enter a valid phone number'
            ]
        },
        office: {
            type: String,
            trim: true
        }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Teacher', teacherSchema);