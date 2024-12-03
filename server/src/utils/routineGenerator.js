const { TIME_SLOTS, WORKING_DAYS } = require('../constants/timeSlots');
const ClassSchedule = require('../models/ClassSchedule');
const TeacherPreference = require('../models/TeacherPreference');

class RoutineGenerator {
    constructor(courseAssignments, preferences) {
        this.courseAssignments = courseAssignments; // TeacherCourseAssignment documents
        this.preferences = preferences;
        this.schedule = new Map();
    }

    async isSlotAvailable(timeSlot, day, teacherId, semester, section) {
        // Check if teacher is already occupied in this slot
        const teacherConflict = await ClassSchedule.findOne({
            teacher_id: teacherId,
            day_of_week: day,
            time_slot: timeSlot
        });

        if (teacherConflict) return false;

        // Check if section already has a class in this slot
        const sectionConflict = await ClassSchedule.findOne({
            day_of_week: day,
            time_slot: timeSlot,
            semester: semester,
            section: section
        });

        return !sectionConflict;
    }

    getTeacherPreference(teacherId, timeSlot, day) {
        const preference = this.preferences.find(p => 
            p.teacher_id.toString() === teacherId.toString() &&
            p.preferred_time_slot === timeSlot &&
            p.day_of_week === day
        );
        return preference ? preference.preference_level : 1;
    }

    async generateRoutine() {
        // Clear existing schedule
        await ClassSchedule.deleteMany({});

        for (const assignment of this.courseAssignments) {
            const course = assignment.course_id;
            const teacher = assignment.teacher_id;
            
            // Handle each section separately
            for (const section of assignment.sections) {
                // Calculate required slots based on course type
                const slotsNeeded = this.getRequiredSlots(course);
                let slotsAssigned = 0;

                // Try to assign all required slots
                while (slotsAssigned < slotsNeeded) {
                    const slot = await this.findBestTimeSlot(
                        teacher._id,
                        course.semester,
                        section
                    );

                    if (!slot) {
                        console.log(`Could not find slot for ${course.course_code} Section ${section}`);
                        break;
                    }

                    // Create schedule entry
                    await this.createScheduleEntry(
                        course._id,
                        teacher._id,
                        slot.day,
                        slot.timeSlot,
                        course.semester,
                        section
                    );

                    slotsAssigned++;
                }
            }
        }
    }

    getRequiredSlots(course) {
        // Calculate total slots needed based on course type
        if (course.course_type === 'theory') {
            return course.theory_hours;
        } else if (course.course_type === 'sessional') {
            return course.practical_hours;
        }
        return 1; // Default for other types
    }

    async findBestTimeSlot(teacherId, semester, section) {
        let bestSlot = null;
        let highestPreference = -1;

        // Try each day and time slot combination
        for (const day of WORKING_DAYS) {
            for (const slot of TIME_SLOTS) {
                const isAvailable = await this.isSlotAvailable(
                    slot.id,
                    day,
                    teacherId,
                    semester,
                    section
                );

                if (isAvailable) {
                    const preference = this.getTeacherPreference(teacherId, slot.id, day);
                    if (preference > highestPreference) {
                        highestPreference = preference;
                        bestSlot = { day, timeSlot: slot.id };
                    }
                }
            }
        }

        return bestSlot;
    }

    async createScheduleEntry(courseId, teacherId, day, timeSlot, semester, section) {
        const scheduleEntry = new ClassSchedule({
            course_id: courseId,
            teacher_id: teacherId,
            day_of_week: day,
            time_slot: timeSlot,
            semester: semester,
            section: section
        });

        await scheduleEntry.save();
    }
}

module.exports = RoutineGenerator;