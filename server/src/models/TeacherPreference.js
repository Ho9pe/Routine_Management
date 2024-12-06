const mongoose = require('mongoose');
const { TIME_SLOTS, WORKING_DAYS } = require('../constants/timeSlots');

const teacherPreferenceSchema = new mongoose.Schema({
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
    preferred_time_slot: {
        type: String,
        enum: {
            values: TIME_SLOTS.map(slot => slot.id),
            message: '{VALUE} is not a valid time slot'
        },
        required: [true, 'Preferred time slot is required']
    },
    preference_level: {
        type: String,
        enum: {
            values: ['HIGH', 'MEDIUM', 'LOW', 'UNAVAILABLE'],
            message: '{VALUE} is not a valid preference level'
        },
        default: 'LOW'
    },
    academic_year: {
        type: String,
        required: [true, 'Academic year is required'],
        match: [/^20\d{2}$/, 'Academic year must be a valid year']
    },
    is_active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Prevent duplicate preferences
teacherPreferenceSchema.index(
    { 
        teacher_id: 1, 
        day_of_week: 1, 
        preferred_time_slot: 1,
        academic_year: 1,
        is_active: 1
    },
    { unique: true }
);

module.exports = mongoose.model('TeacherPreference', teacherPreferenceSchema);