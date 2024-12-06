const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
    admin_id: {
        type: String,
        required: [true, 'Admin ID is required'],
        unique: true,
        trim: true,
        match: [
            /^ADM\d{3}$/,
            'Admin ID must be in format: ADM001'
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
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters long'],
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    role: {
        type: String,
        default: 'admin',
        enum: {
            values: ['admin'],
            message: '{VALUE} is not a valid role'
        }
    },
    contact_info: {
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
    },
    last_login: {
        type: Date
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Admin', adminSchema);