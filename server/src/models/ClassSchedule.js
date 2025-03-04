const mongoose = require('mongoose');

const { TIME_SLOTS, WORKING_DAYS } = require('../constants/timeSlots');

// Schema for the ClassSchedule model
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
        type: Number,
        required: [true, 'Semester is required'],
        min: [1, 'Semester must be between 1 and 8'],
        max: [8, 'Semester must be between 1 and 8']
    },
    section: {
        type: String,
        required: [true, 'Section is required'],
        uppercase: true,
        match: [/^[A-C]$/, 'Section must be A, B, or C']
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
// Index to prevent teacher double-booking
classScheduleSchema.index(
    {
        teacher_id: 1,
        day_of_week: 1,
        time_slot: 1,
        academic_year: 1,
        is_active: 1
    },
    { unique: true }
);
// Index to prevent section double-booking
classScheduleSchema.index(
    {
        semester: 1,
        section: 1,
        day_of_week: 1,
        time_slot: 1,
        academic_year: 1,
        is_active: 1
    },
    { unique: true }
);

module.exports = mongoose.model('ClassSchedule', classScheduleSchema);