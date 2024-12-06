const { TIME_SLOTS, WORKING_DAYS } = require('../constants/timeSlots');
const { PREFERENCE_WEIGHTS, TIME_OF_DAY_WEIGHTS } = require('../constants/preferences');
const ClassSchedule = require('../models/ClassSchedule');

class RoutineGenerator {
    constructor(courseAssignments, preferences) {
        this.courseAssignments = courseAssignments;
        this.preferences = preferences;
        this.schedule = new Map();
        this.dailyClassCount = new Map();
        this.teacherSchedule = new Map();
        this.teacherClassCount = new Map();
        this.conflicts = [];
        this.preferenceWeights = PREFERENCE_WEIGHTS;
        this.timeOfDayWeights = TIME_OF_DAY_WEIGHTS;
    }

    calculateInitialTeacherLoads() {
        this.courseAssignments.forEach(assignment => {
            const teacherId = assignment.teacher_id._id.toString();
            const classesForCourse = 
                assignment.course_id.contact_hours * assignment.sections.length;
            this.teacherClassCount.set(
                teacherId,
                (this.teacherClassCount.get(teacherId) || 0) + classesForCourse
            );
        });

        // Log initial teaching loads
        console.log('\nInitial Teaching Loads:');
        for (const [teacherId, count] of this.teacherClassCount) {
            const teacher = this.courseAssignments.find(
                a => a.teacher_id._id.toString() === teacherId
            )?.teacher_id;
            if (teacher) {
                console.log(`${teacher.full_name} (${teacher.academic_rank}): ${count} classes`);
            }
        }
    }

    getTeacherPreference(teacherId, timeSlot, day) {
        const preference = this.preferences.find(p => 
            p.teacher_id.toString() === teacherId.toString() &&
            p.preferred_time_slot === timeSlot &&
            p.day_of_week === day
        );

        if (!preference) return this.preferenceWeights.LOW;
        return this.preferenceWeights[preference.preference_level] || this.preferenceWeights.LOW;
    }

    getTimeOfDayWeight(timeSlot) {
        const slotNumber = parseInt(timeSlot);
        if (slotNumber <= 3) return this.timeOfDayWeights.MORNING;
        if (slotNumber <= 6) return this.timeOfDayWeights.MIDDAY;
        return this.timeOfDayWeights.AFTERNOON;
    }

    async isSlotAvailable(timeSlot, day, teacherId, semester, section, courseId) {
        try {
            // Check teacher's availability preference
            const preferenceLevel = this.getTeacherPreference(teacherId, timeSlot, day);
            if (preferenceLevel === this.preferenceWeights.UNAVAILABLE) {
                this.conflicts.push({
                    type: 'preference',
                    description: 'Teacher marked as unavailable for this slot',
                    teacher_id: teacherId,
                    day,
                    time_slot: timeSlot
                });
                return false;
            }
    
            // Check if teacher is already occupied
            const teacherKey = `${teacherId}-${day}-${timeSlot}`;
            if (this.teacherSchedule.has(teacherKey)) {
                this.conflicts.push({
                    type: 'teacher',
                    description: 'Teacher already has a class in this slot',
                    teacher_id: teacherId,
                    day,
                    time_slot: timeSlot
                });
                return false;
            }
    
            // Check if section already has a class
            const sectionKey = `${semester}-${section}-${day}-${timeSlot}`;
            if (this.schedule.has(sectionKey)) {
                this.conflicts.push({
                    type: 'section',
                    description: 'Section already has a class in this slot',
                    semester,
                    section,
                    day,
                    time_slot: timeSlot
                });
                return false;
            }
    
            // Check daily class limit
            const dailyKey = `${semester}-${section}-${day}`;
            const dailyCount = this.dailyClassCount.get(dailyKey) || 0;
            if (dailyCount >= 5) {
                this.conflicts.push({
                    type: 'daily_limit',
                    description: 'Section has reached maximum daily classes',
                    semester,
                    section,
                    day
                });
                return false;
            }
    
            // NEW: Check if course already exists on this day for this section
            const courseExistsOnDay = Array.from(this.schedule.keys())
                .filter(key => key.startsWith(`${semester}-${section}-${day}-`))
                .some(key => {
                    const existingSlot = this.schedule.get(key);
                    return existingSlot && existingSlot.courseId === courseId;
                });
    
            if (courseExistsOnDay) {
                this.conflicts.push({
                    type: 'course_repeat',
                    description: 'Course already scheduled on this day',
                    course_id: courseId,
                    semester,
                    section,
                    day
                });
                return false;
            }
    
            return true;
        } catch (error) {
            console.error('Error checking slot availability:', error);
            return false;
        }
    }

    sortAssignmentsByPriority() {
        return [...this.courseAssignments].sort((a, b) => {
            // First priority: Academic rank
            const rankPriority = {
                'Professor': 4,
                'Associate Professor': 3,
                'Assistant Professor': 2,
                'Lecturer': 1
            };
            const rankDiff = rankPriority[b.teacher_id.academic_rank] - 
                                rankPriority[a.teacher_id.academic_rank];
            if (rankDiff !== 0) return rankDiff;

            // Second priority: Total assigned classes
            const teacherAId = a.teacher_id._id.toString();
            const teacherBId = b.teacher_id._id.toString();
            
            const teacherAClasses = this.teacherClassCount.get(teacherAId) || 0;
            const teacherBClasses = this.teacherClassCount.get(teacherBId) || 0;
            
            return teacherAClasses - teacherBClasses;
        });
    }

    async findBestTimeSlot(teacherId, semester, section, courseId) {
        let bestSlot = null;
        let highestScore = -1;
    
        for (const day of WORKING_DAYS) {
            for (const slot of TIME_SLOTS) {
                const isAvailable = await this.isSlotAvailable(
                    slot.id,
                    day,
                    teacherId,
                    semester,
                    section,
                    courseId
                );
    
                if (isAvailable) {
                    let slotScore = 0;
                    
                    // Factor 1: Teacher's preference (weight: 3)
                    const preferenceLevel = this.getTeacherPreference(teacherId, slot.id, day);
                    slotScore += preferenceLevel * 3;
                    
                    // Factor 2: Daily distribution (weight: 2)
                    const dailyKey = `${semester}-${section}-${day}`;
                    const dailyCount = this.dailyClassCount.get(dailyKey) || 0;
                    slotScore += (5 - dailyCount) * 2;
                    
                    // Factor 3: Time of day preference (weight: 1)
                    const timeWeight = this.getTimeOfDayWeight(slot.id);
                    slotScore += timeWeight;
    
                    if (slotScore > highestScore) {
                        highestScore = slotScore;
                        bestSlot = { day, timeSlot: slot.id };
                    }
                }
            }
        }
    
        return bestSlot;
    }

    async createScheduleEntry(courseId, teacherId, day, timeSlot, semester, section) {
        try {
            const scheduleEntry = new ClassSchedule({
                course_id: courseId,
                teacher_id: teacherId,
                day_of_week: day,
                time_slot: timeSlot,
                semester: semester,
                section: section,
                academic_year: new Date().getFullYear().toString(),
                is_active: true
            });

            await scheduleEntry.save();
            return scheduleEntry;
        } catch (error) {
            console.error('Error creating schedule entry:', error);
            throw error;
        }
    }

    async generateRoutine() {
        try {
            console.log('Starting routine generation...');
            this.conflicts = [];
            let scheduledCourses = 0;
            let skippedCourses = [];
    
            // Log initial state and calculate loads (existing code)...
            this.calculateInitialTeacherLoads();
            const sortedAssignments = this.sortAssignmentsByPriority();
            
            // Process each assignment
            for (const assignment of sortedAssignments) {
                const course = assignment.course_id;
                const teacher = assignment.teacher_id;
                const slotsNeeded = course.contact_hours;
    
                console.log(`\nProcessing ${course.course_code} - ${teacher.full_name}`);
                console.log(`Sections: ${assignment.sections.join(', ')}`);
                console.log(`Contact hours needed: ${slotsNeeded}`);
    
                try {
                    // Process each section
                    for (const section of assignment.sections) {
                        let slotsAssigned = 0;
                        let failedAttempts = 0;
                        const maxAttempts = 3; // Try 3 times before skipping
    
                        while (slotsAssigned < slotsNeeded && failedAttempts < maxAttempts) {
                            const slot = await this.findBestTimeSlot(
                                teacher._id,
                                assignment.semester,
                                section,
                                course._id
                            );
    
                            if (!slot) {
                                failedAttempts++;
                                if (failedAttempts >= maxAttempts) {
                                    const error = `Could not find slot for ${course.course_code} Section ${section} Semester ${assignment.semester}`;
                                    console.warn(error);
                                    this.conflicts.push({
                                        type: 'scheduling',
                                        description: error,
                                        course_id: course._id,
                                        teacher_id: teacher._id,
                                        section,
                                        semester: assignment.semester
                                    });
                                    skippedCourses.push({
                                        course_code: course.course_code,
                                        section,
                                        semester: assignment.semester
                                    });
                                    break; // Skip this section
                                }
                                continue; // Try again
                            }
    
                            // Update tracking maps and create entry (existing code)...
                            const teacherKey = `${teacher._id}-${slot.day}-${slot.timeSlot}`;
                            const sectionKey = `${assignment.semester}-${section}-${slot.day}-${slot.timeSlot}`;
                            const dailyKey = `${assignment.semester}-${section}-${slot.day}`;
    
                            this.teacherSchedule.set(teacherKey, true);
                            this.schedule.set(sectionKey, {
                                courseId: course._id,
                                teacherId: teacher._id,
                            });
                            this.dailyClassCount.set(dailyKey, 
                                (this.dailyClassCount.get(dailyKey) || 0) + 1
                            );
    
                            try {
                                await this.createScheduleEntry(
                                    course._id,
                                    teacher._id,
                                    slot.day,
                                    slot.timeSlot,
                                    assignment.semester,
                                    section
                                );
                                console.log(`Successfully assigned: ${slot.day} - Period ${slot.timeSlot}`);
                                slotsAssigned++;
                                scheduledCourses++;
                            } catch (error) {
                                console.error('Failed to create schedule entry:', error);
                                // Continue with next slot instead of throwing
                                continue;
                            }
                        }
                    }
                } catch (error) {
                    console.error(`Error processing course ${course.course_code}:`, error);
                    // Continue with next assignment instead of throwing
                    continue;
                }
            }
    
            // Log final state
            console.log('\nRoutine Generation Summary:');
            console.log(`Successfully scheduled courses: ${scheduledCourses}`);
            console.log(`Skipped courses: ${skippedCourses.length}`);
            if (skippedCourses.length > 0) {
                console.log('\nSkipped Courses:');
                skippedCourses.forEach(course => {
                    console.log(`- ${course.course_code} (Section ${course.section}, Semester ${course.semester})`);
                });
            }
    
            if (this.conflicts.length > 0) {
                console.log('\nConflicts encountered:', this.conflicts);
            }
    
            return {
                success: true,
                scheduledCourses,
                skippedCourses,
                conflicts: this.conflicts
            };
    
        } catch (error) {
            console.error('Routine generation encountered errors:', error);
            return {
                success: false,
                error: error.message,
                conflicts: this.conflicts
            };
        }
    }

    getConflicts() {
        return this.conflicts;
    }
}

module.exports = RoutineGenerator;