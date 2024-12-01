const mongoose = require('mongoose');
const { TIME_SLOTS, WORKING_DAYS } = require('../constants/timeSlots');

const classScheduleSchema = new mongoose.Schema({
    course_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: [true, 'Course ID is required']
    },
    teacher_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher',
        required: [true, 'Teacher ID is required']
    },
    day_of_week: {
        type: String,
        enum: {
            values: WORKING_DAYS,
            message: '{VALUE} is not a valid working day'
        },
        required: [true, 'Day of week is required']
    },
    time_slot: {
        type: String,
        enum: {
            values: TIME_SLOTS.map(slot => slot.id),
            message: '{VALUE} is not a valid time slot'
        },
        required: [true, 'Time slot is required']
    },
    semester: {
        type: String,
        required: [true, 'Semester is required'],
        match: [
            /^[1-8]$/,
            'Semester must be between 1 and 8'
        ]
    },
    section: {
        type: String,
        required: [true, 'Section is required'],
        uppercase: true,
        match: [
            /^[A-C]$/,
            'Section must be A, B, or C'
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

// Compound index to prevent scheduling conflicts
classScheduleSchema.index(
    { 
        day_of_week: 1, 
        time_slot: 1, 
        semester: 1,
        section: 1
    }, 
    { unique: true }
);

// Compound index to prevent teacher double-booking
classScheduleSchema.index(
    {
        teacher_id: 1,
        day_of_week: 1,
        time_slot: 1
    },
    { unique: true }
);

classScheduleSchema.pre('save', function(next) {
    this.updated_at = new Date();
    next();
});

module.exports = mongoose.model('ClassSchedule', classScheduleSchema);