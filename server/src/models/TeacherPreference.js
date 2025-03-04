const mongoose = require('mongoose');

const { TIME_SLOTS, WORKING_DAYS } = require('../constants/timeSlots');

// Schema for the TeacherPreference model
const teacherPreferenceSchema = new mongoose.Schema({
    teacher_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher',
        required: [true, 'Teacher ID is required']
    },
    course_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: [true, 'Course ID is required']
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
// Remove any existing indexes
teacherPreferenceSchema.index({}, { unique: false });
// Add new compound index for unique preferences per time slot
teacherPreferenceSchema.index(
    { 
        teacher_id: 1,
        course_id: 1,
        day_of_week: 1, 
        preferred_time_slot: 1,
        academic_year: 1,
        is_active: 1
    },
    { 
        unique: true,
        name: 'unique_teacher_course_preference'
    }
);
// Add pre-save middleware for validation
teacherPreferenceSchema.pre('save', function(next) {
    console.log('Pre-save validation:', {
        teacher_id: this.teacher_id,
        course_id: this.course_id,
        day_of_week: this.day_of_week,
        preferred_time_slot: this.preferred_time_slot,
        preference_level: this.preference_level,
        academic_year: this.academic_year
    });
    next();
});

const TeacherPreference = mongoose.model('TeacherPreference', teacherPreferenceSchema);
module.exports = TeacherPreference;