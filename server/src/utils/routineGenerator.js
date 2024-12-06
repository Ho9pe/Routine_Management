const { TIME_SLOTS, WORKING_DAYS } = require('../constants/timeSlots');
const { PREFERENCE_WEIGHTS, TIME_OF_DAY_WEIGHTS } = require('../constants/preferences');
const ClassSchedule = require('../models/ClassSchedule');
const Course = require('../models/Course');

class RoutineGenerator {
    constructor(courseAssignments, preferences) {
        if (!Array.isArray(courseAssignments) || !Array.isArray(preferences)) {
            throw new Error('Invalid input: courseAssignments and preferences must be arrays');
        }
        
        this.courseAssignments = courseAssignments;
        this.preferences = preferences;
        this.schedule = new Map();
        this.dailyClassCount = new Map();
        this.teacherSchedule = new Map();
        this.teacherClassCount = new Map();
        this.conflicts = [];
        this.preferenceWeights = PREFERENCE_WEIGHTS;
        this.timeOfDayWeights = TIME_OF_DAY_WEIGHTS;

        // Validate input data
        this.validateInputData();
    }

    validateInputData() {
        // Validate course assignments
        this.courseAssignments.forEach((assignment, index) => {
            if (!assignment.teacher_id || !assignment.course_id) {
                throw new Error(`Invalid course assignment at index ${index}: missing teacher_id or course_id`);
            }
            if (!assignment.sections || !Array.isArray(assignment.sections)) {
                throw new Error(`Invalid sections for assignment at index ${index}`);
            }
            // Validate that referenced objects are properly populated
            if (!assignment.teacher_id._id || !assignment.course_id._id) {
                throw new Error(`Course assignment at index ${index} has unpopulated references`);
            }
        });

        // Log initial state for debugging
        console.log('Initial state:', {
            totalAssignments: this.courseAssignments.length,
            totalPreferences: this.preferences.length,
            uniqueTeachers: new Set(this.courseAssignments.map(a => a.teacher_id._id.toString())).size,
            uniqueCourses: new Set(this.courseAssignments.map(a => a.course_id._id.toString())).size
        });
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

            // Check if course already exists on this day for this section
            const courseExistsOnDay = Array.from(this.schedule.entries())
                .filter(([key, value]) => 
                    key.startsWith(`${semester}-${section}-${day}-`) &&
                    value.courseId === courseId
                ).length > 0;

            if (courseExistsOnDay) {
                this.conflicts.push({
                    type: 'course_repeat',
                    description: 'Course already scheduled on this day for this section',
                    course_id: courseId,
                    semester,
                    section,
                    day
                });
                return false;
            }

            // Strongly discourage same time slots for different sections
            const otherSections = ['A', 'B', 'C'].filter(s => s !== section);
            for (const otherSection of otherSections) {
                const otherSectionKey = `${semester}-${otherSection}-${day}-${timeSlot}`;
                if (this.schedule.has(otherSectionKey)) {
                    // Allow parallel sections only for lab/sessional courses
                    const course = await Course.findById(courseId);
                    if (course && course.course_type === 'theory') {
                        this.conflicts.push({
                            type: 'parallel_section',
                            description: 'Theory course cannot be scheduled parallel with other sections',
                            course_id: courseId,
                            semester,
                            section,
                            day,
                            time_slot: timeSlot
                        });
                        return false;
                    }
                }
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

        // Randomize the order of days and time slots to increase variety
        const shuffledDays = [...WORKING_DAYS].sort(() => Math.random() - 0.5);
        const shuffledSlots = [...TIME_SLOTS].sort(() => Math.random() - 0.5);

        for (const day of shuffledDays) {
            for (const slot of shuffledSlots) {
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

                    // Factor 4: Section distribution (weight: 3)
                    // Discourage using same slots as other sections
                    const otherSections = ['A', 'B', 'C'].filter(s => s !== section);
                    let sectionScore = 3;
                    for (const otherSection of otherSections) {
                        const otherSectionKey = `${semester}-${otherSection}-${day}-${slot.id}`;
                        if (this.schedule.has(otherSectionKey)) {
                            sectionScore -= 1;
                        }
                    }
                    slotScore += sectionScore;

                    // Factor 5: Random factor to increase variety (weight: 1)
                    slotScore += Math.random();

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

            // Calculate initial loads
            this.calculateInitialTeacherLoads();
            const sortedAssignments = this.sortAssignmentsByPriority();
            
            console.log('Processing assignments:', {
                totalAssignments: sortedAssignments.length,
                uniqueTeachers: new Set(sortedAssignments.map(a => a.teacher_id._id.toString())).size
            });

            // Process each assignment
            for (const assignment of sortedAssignments) {
                const course = assignment.course_id;
                const teacher = assignment.teacher_id;
                const slotsNeeded = course.contact_hours;

                console.log(`\nProcessing assignment:`, {
                    courseCode: course.course_code,
                    teacherName: teacher.full_name,
                    sections: assignment.sections,
                    contactHours: slotsNeeded
                });

                try {
                    // Process each section
                    for (const section of assignment.sections) {
                        let slotsAssigned = 0;
                        let failedAttempts = 0;
                        const maxAttempts = 3;

                        while (slotsAssigned < slotsNeeded && failedAttempts < maxAttempts) {
                            const slot = await this.findBestTimeSlot(
                                teacher._id,
                                assignment.semester,
                                section,
                                course._id
                            );

                            if (!slot) {
                                failedAttempts++;
                                console.log(`Failed attempt ${failedAttempts} for:`, {
                                    course: course.course_code,
                                    section,
                                    teacher: teacher.full_name
                                });
                                continue;
                            }

                            try {
                                // Create schedule entry
                                const scheduleEntry = await this.createScheduleEntry(
                                    course._id,
                                    teacher._id,
                                    slot.day,
                                    slot.timeSlot,
                                    assignment.semester,
                                    section
                                );

                                if (scheduleEntry) {
                                    // Update tracking maps
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

                                    slotsAssigned++;
                                    scheduledCourses++;
                                    
                                    console.log(`Successfully scheduled:`, {
                                        course: course.course_code,
                                        section,
                                        day: slot.day,
                                        timeSlot: slot.timeSlot
                                    });
                                }
                            } catch (error) {
                                console.error('Error creating schedule entry:', {
                                    error: error.message,
                                    course: course.course_code,
                                    section,
                                    slot
                                });
                                continue;
                            }
                        }

                        if (slotsAssigned < slotsNeeded) {
                            const skipInfo = {
                                course_code: course.course_code,
                                section,
                                semester: assignment.semester,
                                assigned: slotsAssigned,
                                needed: slotsNeeded
                            };
                            console.log('Skipping course:', skipInfo);
                            skippedCourses.push(skipInfo);
                        }
                    }
                } catch (error) {
                    console.error('Error processing assignment:', {
                        error: error.message,
                        course: course.course_code,
                        teacher: teacher.full_name
                    });
                    continue;
                }
            }

            console.log('\nGeneration completed:', {
                scheduledCourses,
                skippedCourses: skippedCourses.length,
                conflicts: this.conflicts.length
            });

            return {
                success: true,
                scheduledCourses,
                skippedCourses,
                conflicts: this.conflicts
            };

        } catch (error) {
            console.error('Fatal error in routine generation:', error);
            throw error;
        }
    }

    getConflicts() {
        return this.conflicts;
    }
}

module.exports = RoutineGenerator;