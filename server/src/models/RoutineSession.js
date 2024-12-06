const mongoose = require('mongoose');

const routineSessionSchema = new mongoose.Schema({
    academic_year: {
        type: String,
        required: true,
        match: [/^20\d{2}$/, 'Academic year must be a valid year']
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed'],
        default: 'pending'
    },
    generated_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        required: true
    },
    start_time: {
        type: Date,
        default: Date.now
    },
    end_time: Date,
    error_log: [String],
    success_log: [String],
    conflicts: [{
        type: {
            type: String,
            enum: [
                'teacher',
                'section', 
                'preference', 
                'daily_limit', 
                'course_repeat',
                'parallel_section',  // Added this
                'scheduling'
            ]
        },
        description: String,
        course_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course'
        },
        teacher_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Teacher'
        },
        semester: Number,
        section: String,
        day: String,
        time_slot: String
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('RoutineSession', routineSessionSchema);