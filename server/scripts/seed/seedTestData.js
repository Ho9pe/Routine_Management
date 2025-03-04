require('dotenv').config();
const mongoose = require('mongoose');

const TeacherCourseAssignment = require('../../src/models/TeacherCourseAssignment');
const TeacherPreference = require('../../src/models/TeacherPreference');
const Teacher = require('../../src/models/Teacher');
const Course = require('../../src/models/Course');
const { TIME_SLOTS, WORKING_DAYS } = require('../../src/constants/timeSlots');

// Seed test data
async function seedTestData() {
    let connection;
    try {
        // Connect to MongoDB
        connection = await mongoose.connect(process.env.MONGODB_LOCAL_URL, {
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 10000
        });
        console.log('\n=== Starting Test Data Seeding ===');
        // Define current year at the top
        const currentYear = new Date().getFullYear().toString();
        // Clear existing data and indexes
        await TeacherPreference.collection.dropIndexes();
        await TeacherCourseAssignment.collection.dropIndexes();
        await TeacherPreference.deleteMany({});
        await TeacherCourseAssignment.deleteMany({});
        console.log('Cleared existing test data and indexes');
        // Fetch existing teachers and courses
        const teachers = await Teacher.find();
        if (teachers.length === 0) {
            throw new Error('No teachers found in database');
        }
        console.log(`Found ${teachers.length} teachers`);
        const courses = await Course.find();
        if (courses.length === 0) {
            throw new Error('No courses found in database');
        }
        console.log(`Found ${courses.length} courses`);
        // Group by department (add logging)
        const coursesByDept = courses.reduce((acc, course) => {
            acc[course.department] = (acc[course.department] || []).concat(course);
            return acc;
        }, {});
        const teachersByDept = teachers.reduce((acc, teacher) => {
            acc[teacher.department] = (acc[teacher.department] || []).concat(teacher);
            return acc;
        }, {});
        console.log('\n=== Department Distribution ===');
        Object.keys(coursesByDept).forEach(dept => {
            console.log(`${dept}:`);
            console.log(`  Courses: ${coursesByDept[dept].length}`);
            console.log(`  Teachers: ${(teachersByDept[dept] || []).length}`);
        });
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
        // Group courses by department
        const coursesByDepartment = courses.reduce((acc, course) => {
            if (!acc[course.department]) {
                acc[course.department] = [];
            }
            acc[course.department].push(course);
            return acc;
        }, {});
        // Group teachers by department
        const teachersByDepartment = teachers.reduce((acc, teacher) => {
            if (!acc[teacher.department]) {
                acc[teacher.department] = [];
            }
            acc[teacher.department].push(teacher);
            return acc;
        }, {});
        // Validate department coverage
        for (const dept in coursesByDepartment) {
            if (!teachersByDepartment[dept] || teachersByDepartment[dept].length === 0) {
                console.warn(`Warning: No teachers found for ${dept} department`);
            }
        }
        // Helper function to check if teacher is already assigned to specific sections
        const getTeacherExistingSections = (assignments, teacherId, courseId) => {
            const existingAssignments = assignments.filter(assignment => 
                assignment.teacher_id.toString() === teacherId.toString() &&
                assignment.course_id.toString() === courseId.toString()
            );
            
            return existingAssignments.reduce((sections, assignment) => 
                [...sections, ...assignment.sections], []);
        };
        // Helper function to get available teachers
        const getAvailableTeachers = (excludeTeacher = null, courseId = null, sections = []) => {
            return [...teachers]
                .filter(teacher => {
                    // Exclude specific teacher if provided
                    if (excludeTeacher && teacher._id.toString() === excludeTeacher.toString()) {
                        return false;
                    }
                    // Check teaching load
                    const load = teacherLoadMap.get(teacher._id.toString());
                    if (load.totalHours >= 20) {
                        return false;
                    }
                    // If courseId and sections provided, check for section conflicts
                    if (courseId && sections.length > 0) {
                        const existingSections = getTeacherExistingSections(assignments, teacher._id, courseId);
                        const hasConflict = sections.some(section => existingSections.includes(section));
                        if (hasConflict) {
                            return false;
                        }
                    }
                    return true;
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
        // Process courses and create assignments
        for (const department in coursesByDepartment) {
            const departmentCourses = coursesByDepartment[department];
            const departmentTeachers = teachersByDepartment[department] || [];
            if (departmentTeachers.length === 0) {
                console.warn(`Skipping ${department} courses - no teachers available`);
                continue;
            }
            // Sort courses by semester and credit hours
            const sortedCourses = [...departmentCourses].sort((a, b) => {
                if (a.semester !== b.semester) return a.semester - b.semester;
                return b.credit_hours - a.credit_hours;
            });
            for (const course of sortedCourses) {
                const sections = ['A', 'B', 'C'];
                const distribution = Math.random();
                console.log(`\nProcessing ${course.course_code} (${department})`);
                if (course.course_type === 'theory') {
                    if (distribution < 0.3) { // 30% chance: one teacher all sections
                        const availableTeacher = getAvailableTeachers(null, course._id, sections)
                            .find(t => t.department === department);
                        if (availableTeacher) {
                            assignments.push({
                                teacher_id: availableTeacher._id,
                                course_id: course._id,
                                semester: course.semester,
                                academic_year: currentYear,
                                sections: sections
                            });
                            updateTeacherLoad(availableTeacher._id, course.contact_hours, sections.length);
                            console.log(`Assigned all sections to ${availableTeacher.full_name}`);
                        }
                    } 
                    else if (distribution < 0.6) { // 30% chance: two teachers (2+1 sections)
                        const firstSections = sections.slice(0, 2);
                        const teacher1 = getAvailableTeachers(null, course._id, firstSections)
                            .find(t => t.department === department);
                        if (teacher1) {
                            assignments.push({
                                teacher_id: teacher1._id,
                                course_id: course._id,
                                semester: course.semester,
                                academic_year: currentYear,
                                sections: firstSections
                            });
                            updateTeacherLoad(teacher1._id, course.contact_hours, 2);
                            console.log(`Assigned sections ${firstSections.join(', ')} to ${teacher1.full_name}`);
                            const lastSection = [sections[2]];
                            const teacher2 = getAvailableTeachers(teacher1._id, course._id, lastSection)
                                .find(t => t.department === department);
                            if (teacher2) {
                                assignments.push({
                                    teacher_id: teacher2._id,
                                    course_id: course._id,
                                    semester: course.semester,
                                    academic_year: currentYear,
                                    sections: lastSection
                                });
                                updateTeacherLoad(teacher2._id, course.contact_hours, 1);
                                console.log(`Assigned section ${lastSection[0]} to ${teacher2.full_name}`);
                            }
                        }
                    }
                    else { // 40% chance: different teachers for each section
                        for (const section of sections) {
                            const availableTeacher = getAvailableTeachers(null, course._id, [section])
                                .find(t => t.department === department);
                            if (availableTeacher) {
                                assignments.push({
                                    teacher_id: availableTeacher._id,
                                    course_id: course._id,
                                    semester: course.semester,
                                    academic_year: currentYear,
                                    sections: [section]
                                });
                                updateTeacherLoad(availableTeacher._id, course.contact_hours, 1);
                                console.log(`Assigned section ${section} to ${availableTeacher.full_name}`);
                            }
                        }
                    }
                } 
                else { // Lab/Sessional courses: always different teachers
                    for (const section of sections) {
                        const availableTeacher = getAvailableTeachers(null, course._id, [section])
                            .find(t => t.department === department);
                        if (availableTeacher) {
                            assignments.push({
                                teacher_id: availableTeacher._id,
                                course_id: course._id,
                                semester: course.semester,
                                academic_year: currentYear,
                                sections: [section]
                            });
                            updateTeacherLoad(availableTeacher._id, course.contact_hours, 1);
                            console.log(`Assigned section ${section} to ${availableTeacher.full_name} (${course.course_type})`);
                        }
                    }
                }
            }
        }
        // Generate preferences for each teacher
        console.log('\nGenerating teacher preferences...');
        const preferences = [];
        const usedSlots = new Set();
        for (const teacher of teachers) {
            // Get all assignments for this teacher
            const teacherAssignments = assignments.filter(
                a => a.teacher_id.toString() === teacher._id.toString()
            );
            // Calculate total required preferences
            const totalSections = teacherAssignments.reduce(
                (sum, assignment) => sum + assignment.sections.length, 0
            );
            // Generate more preferences than required (1.5x to 2x)
            const numPreferences = Math.min(
                Math.ceil(totalSections * 2),
                WORKING_DAYS.length * 2 // Maximum 2 slots per day
            );
            console.log(`Generating ${numPreferences} preferences for ${teacher.full_name}`);
            for (let i = 0; i < numPreferences; i++) {
                const day = WORKING_DAYS[Math.floor(Math.random() * WORKING_DAYS.length)];
                const timeSlot = TIME_SLOTS[Math.floor(Math.random() * TIME_SLOTS.length)];
                const slotKey = `${teacher._id}-${day}-${timeSlot.id}`;
                // Avoid duplicate slots for the same teacher
                if (!usedSlots.has(slotKey)) {
                    usedSlots.add(slotKey);
                    let preferenceLevel;
                    const slotNumber = parseInt(timeSlot.id);
                    // Professors and Associate Professors prefer morning slots
                    if (teacher.academic_rank === 'Professor' || 
                        teacher.academic_rank === 'Associate Professor') {
                        preferenceLevel = slotNumber <= 3 ? 'HIGH' : 
                                        slotNumber <= 6 ? 'MEDIUM' : 'LOW';
                    } else {
                        preferenceLevel = ['HIGH', 'MEDIUM', 'LOW'][Math.floor(Math.random() * 3)];
                    }
                    // 10% chance of marking a slot as unavailable
                    if (Math.random() < 0.1) {
                        preferenceLevel = 'UNAVAILABLE';
                    }
                    // Randomly select one of teacher's courses for this preference
                    const randomAssignment = teacherAssignments[
                        Math.floor(Math.random() * teacherAssignments.length)
                    ];
                    if (randomAssignment) {
                        preferences.push({
                            teacher_id: teacher._id,
                            course_id: randomAssignment.course_id,
                            day_of_week: day,
                            preferred_time_slot: timeSlot.id,
                            preference_level: preferenceLevel,
                            academic_year: currentYear,
                            is_active: true
                        });
                    }
                }
            }
        }
        // Save assignments and preferences
        const createdAssignments = await TeacherCourseAssignment.insertMany(assignments);
        const createdPreferences = await TeacherPreference.insertMany(preferences);
        console.log('\n=== Seeding Results ===');
        console.log(`Created ${createdAssignments.length} course assignments`);
        console.log(`Created ${createdPreferences.length} teacher preferences`);
        // Print preference statistics
        const preferenceStats = preferences.reduce((stats, pref) => {
            stats.byLevel[pref.preference_level] = (stats.byLevel[pref.preference_level] || 0) + 1;
            stats.byDay[pref.day_of_week] = (stats.byDay[pref.day_of_week] || 0) + 1;
            return stats;
        }, { byLevel: {}, byDay: {} });
        console.log('\nPreference Statistics:');
        console.log('\nBy Level:');
        Object.entries(preferenceStats.byLevel).forEach(([level, count]) => {
            console.log(`${level}: ${count} preferences`);
        });
        console.log('\nBy Day:');
        Object.entries(preferenceStats.byDay).forEach(([day, count]) => {
            console.log(`${day}: ${count} preferences`);
        });
        // Validate preference distribution
        for (const teacher of teachers) {
            const teacherPrefs = preferences.filter(
                p => p.teacher_id.toString() === teacher._id.toString()
            );
            const teacherAssignments = assignments.filter(
                a => a.teacher_id.toString() === teacher._id.toString()
            );
            const totalSections = teacherAssignments.reduce(
                (sum, a) => sum + a.sections.length, 0
            );
            console.log(`\nTeacher: ${teacher.full_name}`);
            console.log(`Total sections: ${totalSections}`);
            console.log(`Total preferences: ${teacherPrefs.length}`);
            if (teacherPrefs.length < totalSections) {
                console.warn(`Warning: Teacher has fewer preferences than required`);
            }
        }
    } catch (error) {
        console.error('\n❌ Error seeding test data:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.disconnect();
            console.log('\nDisconnected from MongoDB');
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
// Run the seeding script
if (require.main === module) {
    seedTestData()
        .then(() => {
            console.log('\n=== Seeding Completed Successfully ===');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n=== Seeding Failed ===');
            console.error(error);
            process.exit(1);
        });
}