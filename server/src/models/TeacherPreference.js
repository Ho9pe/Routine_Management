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
    course_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: [true, 'Course ID is required']
    },
    preference_level: {
        type: Number,
        min: [1, 'Preference level must be between 1 and 5'],
        max: [5, 'Preference level must be between 1 and 5'],
        default: 3
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

// Compound index to prevent duplicate preferences
teacherPreferenceSchema.index(
    { teacher_id: 1, day_of_week: 1, preferred_time_slot: 1 },
    { unique: true }
);

teacherPreferenceSchema.pre('save', function(next) {
    this.updated_at = new Date();
    next();
});

module.exports = mongoose.model('TeacherPreference', teacherPreferenceSchema);