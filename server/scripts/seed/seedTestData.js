const mongoose = require('mongoose');
const TeacherCourseAssignment = require('../../src/models/TeacherCourseAssignment');
const TeacherPreference = require('../../src/models/TeacherPreference');
const Teacher = require('../../src/models/Teacher');
const Course = require('../../src/models/Course');
const { TIME_SLOTS, WORKING_DAYS } = require('../../src/constants/timeSlots');
require('dotenv').config();

async function seedTestData() {
    let connection;
    try {
        // Connect to MongoDB
        connection = await mongoose.connect(process.env.MONGODB_LOCAL_URL, {
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 10000
        });
        console.log('Connected to MongoDB');

        // Define current year at the top
        const currentYear = new Date().getFullYear().toString();

        // Fetch existing teachers and courses
        const teachers = await Teacher.find();
        if (teachers.length === 0) {
            throw new Error('No teachers found in database');
        }

        const courses = await Course.find();
        if (courses.length === 0) {
            throw new Error('No courses found in database');
        }

        // Clear existing test data
        await TeacherPreference.deleteMany({});
        await TeacherCourseAssignment.deleteMany({});
        console.log('Cleared existing test data');

        // Initialize tracking maps
        const assignments = [];
        const teacherLoadMap = new Map();

        // Initialize teacher load map
        teachers.forEach(teacher => {
            teacherLoadMap.set(teacher._id.toString(), {
                totalHours: 0,
                courseCount: 0,
                rank: teacher.academic_rank
            });
        });

        // Sort courses by semester and credit hours
        const sortedCourses = [...courses].sort((a, b) => {
            if (a.semester !== b.semester) return a.semester - b.semester;
            return b.credit_hours - a.credit_hours;
        });

        // Helper function to get available teachers
        const getAvailableTeachers = (excludeTeacher = null) => {
            return [...teachers]
                .filter(teacher => {
                    if (excludeTeacher && teacher._id.toString() === excludeTeacher.toString()) {
                        return false;
                    }
                    const load = teacherLoadMap.get(teacher._id.toString());
                    return load.totalHours < 20; // Maximum 20 hours per teacher
                })
                .sort((a, b) => {
                    const loadA = teacherLoadMap.get(a._id.toString());
                    const loadB = teacherLoadMap.get(b._id.toString());
                    
                    // Sort by current load first
                    if (loadA.totalHours !== loadB.totalHours) {
                        return loadA.totalHours - loadB.totalHours;
                    }
                    
                    // Then by academic rank
                    const rankPriority = {
                        'Professor': 4,
                        'Associate Professor': 3,
                        'Assistant Professor': 2,
                        'Lecturer': 1
                    };
                    return rankPriority[b.academic_rank] - rankPriority[a.academic_rank];
                });
        };

        // Helper function to update teacher load
        const updateTeacherLoad = (teacherId, contactHours, sectionCount = 1) => {
            const load = teacherLoadMap.get(teacherId.toString());
            load.totalHours += contactHours * sectionCount;
            load.courseCount += 1;
            teacherLoadMap.set(teacherId.toString(), load);
        };

        // Process each course
        for (const course of sortedCourses) {
            const sections = ['A', 'B', 'C'];

            if (course.course_type === 'theory') {
                const distribution = Math.random();

                if (distribution < 0.3) { // 30% chance: one teacher all sections
                    const teacher = getAvailableTeachers()[0];
                    if (teacher) {
                        assignments.push({
                            teacher_id: teacher._id,
                            course_id: course._id,
                            semester: course.semester,
                            academic_year: currentYear,
                            sections: sections
                        });
                        updateTeacherLoad(teacher._id, course.contact_hours, sections.length);
                    }
                } 
                else if (distribution < 0.6) { // 30% chance: two teachers (2+1 sections)
                    const teacher1 = getAvailableTeachers()[0];
                    if (teacher1) {
                        assignments.push({
                            teacher_id: teacher1._id,
                            course_id: course._id,
                            semester: course.semester,
                            academic_year: currentYear,
                            sections: sections.slice(0, 2)
                        });
                        updateTeacherLoad(teacher1._id, course.contact_hours, 2);

                        const teacher2 = getAvailableTeachers(teacher1._id)[0];
                        if (teacher2) {
                            assignments.push({
                                teacher_id: teacher2._id,
                                course_id: course._id,
                                semester: course.semester,
                                academic_year: currentYear,
                                sections: [sections[2]]
                            });
                            updateTeacherLoad(teacher2._id, course.contact_hours, 1);
                        }
                    }
                }
                else { // 40% chance: different teachers for each section
                    for (const section of sections) {
                        const teacher = getAvailableTeachers()[0];
                        if (teacher) {
                            assignments.push({
                                teacher_id: teacher._id,
                                course_id: course._id,
                                semester: course.semester,
                                academic_year: currentYear,
                                sections: [section]
                            });
                            updateTeacherLoad(teacher._id, course.contact_hours, 1);
                        }
                    }
                }
            } 
            else { // Lab/Sessional courses: always different teachers
                for (const section of sections) {
                    const teacher = getAvailableTeachers()[0];
                    if (teacher) {
                        assignments.push({
                            teacher_id: teacher._id,
                            course_id: course._id,
                            semester: course.semester,
                            academic_year: currentYear,
                            sections: [section]
                        });
                        updateTeacherLoad(teacher._id, course.contact_hours, 1);
                    }
                }
            }
        }

        // Generate teacher preferences
        const preferences = [];
        const usedSlots = new Set();

        for (const teacher of teachers) {
            const teacherLoad = teacherLoadMap.get(teacher._id.toString());
            const numPreferences = Math.min(
                Math.ceil(teacherLoad.totalHours / 2),
                WORKING_DAYS.length * 2
            );

            for (let i = 0; i < numPreferences; i++) {
                const day = WORKING_DAYS[Math.floor(Math.random() * WORKING_DAYS.length)];
                const timeSlot = TIME_SLOTS[Math.floor(Math.random() * TIME_SLOTS.length)];
                const slotKey = `${teacher._id}-${day}-${timeSlot.id}`;

                if (!usedSlots.has(slotKey)) {
                    usedSlots.add(slotKey);

                    let preferenceLevel;
                    const slotNumber = parseInt(timeSlot.id);
                    
                    if (teacher.academic_rank === 'Professor' || 
                        teacher.academic_rank === 'Associate Professor') {
                        preferenceLevel = slotNumber <= 3 ? 'HIGH' : 
                                        slotNumber <= 6 ? 'MEDIUM' : 'LOW';
                    } else {
                        preferenceLevel = ['HIGH', 'MEDIUM', 'LOW'][Math.floor(Math.random() * 3)];
                    }

                    if (Math.random() < 0.1) {
                        preferenceLevel = 'UNAVAILABLE';
                    }

                    preferences.push({
                        teacher_id: teacher._id,
                        day_of_week: day,
                        preferred_time_slot: timeSlot.id,
                        preference_level: preferenceLevel,
                        academic_year: currentYear,
                        is_active: true
                    });
                }
            }
        }

        // Save to database
        const createdAssignments = await TeacherCourseAssignment.insertMany(assignments);
        const createdPreferences = await TeacherPreference.insertMany(preferences);

        // Print statistics
        console.log('\nAssignment Statistics:');
        console.log(`Total Assignments Created: ${createdAssignments.length}`);

        const courseStats = {};
        createdAssignments.forEach(assignment => {
            const courseCode = assignment.course_id.course_code;
            if (!courseStats[courseCode]) {
                courseStats[courseCode] = {
                    teachers: new Set(),
                    sections: new Set(),
                    type: assignment.course_id.course_type
                };
            }
            courseStats[courseCode].teachers.add(assignment.teacher_id.full_name);
            assignment.sections.forEach(s => courseStats[courseCode].sections.add(s));
        });

        console.log('\nCourse Distribution:');
        Object.entries(courseStats).forEach(([courseCode, stats]) => {
            console.log(`${courseCode} (${stats.type}):`);
            console.log(`  Teachers: ${Array.from(stats.teachers).join(', ')}`);
            console.log(`  Sections: ${Array.from(stats.sections).join(', ')}`);
        });

        console.log('\nTeacher Load Distribution:');
        for (const [teacherId, load] of teacherLoadMap) {
            const teacher = teachers.find(t => t._id.toString() === teacherId);
            console.log(
                `${teacher.full_name} (${teacher.academic_rank}): ` +
                `${load.totalHours} hours, ${load.courseCount} courses`
            );
        }

        console.log('\nPreference Statistics:');
        const prefStats = preferences.reduce((acc, pref) => {
            acc[pref.preference_level] = (acc[pref.preference_level] || 0) + 1;
            return acc;
        }, {});
        
        Object.entries(prefStats).forEach(([level, count]) => {
            console.log(`${level}: ${count} preferences`);
        });

    } catch (error) {
        console.error('Error seeding test data:', error);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.disconnect();
            console.log('Disconnected from MongoDB');
        }
    }
}

// Error handlers
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (error) => {
    console.error('Unhandled Rejection:', error);
    process.exit(1);
});

seedTestData().catch(console.error);