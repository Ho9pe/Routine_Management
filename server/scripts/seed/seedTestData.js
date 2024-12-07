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
        console.log('\n=== Starting Test Data Seeding ===');

        // Define current year at the top
        const currentYear = new Date().getFullYear().toString();

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

        // Clear existing test data
        await TeacherPreference.deleteMany({});
        await TeacherCourseAssignment.deleteMany({});
        console.log('Cleared existing test data');

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

        // Replace the existing course processing loop with this:
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

        // Add this to your seedTestData.js before creating new assignments
        await mongoose.connection.collection('teachercourseassignments').dropIndexes();

        // Save to database
        const createdAssignments = await TeacherCourseAssignment.insertMany(assignments);
        const createdPreferences = await TeacherPreference.insertMany(preferences);

        // Print statistics
        console.log('\n=== Assignment Statistics ===');
        console.log(`Total Assignments Created: ${createdAssignments.length}`);

        // Group assignments by department for better visibility
        const departmentStats = {};
        const teacherStats = {};

        // Populate assignments with course and teacher details
        const populatedAssignments = await TeacherCourseAssignment.find()
            .populate('course_id', 'course_code department course_type')
            .populate('teacher_id', 'full_name department academic_rank');

        // Calculate statistics
        populatedAssignments.forEach(assignment => {
            const dept = assignment.course_id.department;
            const teacherId = assignment.teacher_id._id.toString();
            
            // Initialize department stats
            if (!departmentStats[dept]) {
                departmentStats[dept] = {
                    totalAssignments: 0,
                    courseTypes: {},
                    teacherCount: new Set()
                };
            }
            
            // Update department stats
            departmentStats[dept].totalAssignments++;
            departmentStats[dept].teacherCount.add(teacherId);
            
            const courseType = assignment.course_id.course_type;
            departmentStats[dept].courseTypes[courseType] = 
                (departmentStats[dept].courseTypes[courseType] || 0) + 1;
            
            // Update teacher stats
            if (!teacherStats[teacherId]) {
                teacherStats[teacherId] = {
                    name: assignment.teacher_id.full_name,
                    department: assignment.teacher_id.department,
                    rank: assignment.teacher_id.academic_rank,
                    assignmentCount: 0,
                    courses: new Set()
                };
            }
            teacherStats[teacherId].assignmentCount++;
            teacherStats[teacherId].courses.add(assignment.course_id.course_code);
        });

        // Print Department Statistics
        console.log('\n=== Department-wise Statistics ===');
        Object.entries(departmentStats).forEach(([dept, stats]) => {
            console.log(`\n${dept} Department:`);
            console.log(`  Total Assignments: ${stats.totalAssignments}`);
            console.log(`  Unique Teachers: ${stats.teacherCount.size}`);
            console.log('  Course Types:');
            Object.entries(stats.courseTypes).forEach(([type, count]) => {
                console.log(`    - ${type}: ${count}`);
            });
        });

        // Print Teacher Statistics
        console.log('\n=== Teacher Assignment Statistics ===');
        Object.entries(teacherStats)
            .sort((a, b) => b[1].assignmentCount - a[1].assignmentCount)
            .forEach(([_, stats]) => {
                console.log(`\n${stats.name} (${stats.department} - ${stats.rank}):`);
                console.log(`  Assignments: ${stats.assignmentCount}`);
                console.log(`  Unique Courses: ${stats.courses.size}`);
            });

        // Print any department mismatches (validation)
        console.log('\n=== Department Alignment Validation ===');
        let mismatchFound = false;
        populatedAssignments.forEach(assignment => {
            if (assignment.teacher_id.department !== assignment.course_id.department) {
                mismatchFound = true;
                console.log(`WARNING: Mismatch found:`);
                console.log(`  Course: ${assignment.course_id.course_code} (${assignment.course_id.department})`);
                console.log(`  Teacher: ${assignment.teacher_id.full_name} (${assignment.teacher_id.department})`);
            }
        });

        if (!mismatchFound) {
            console.log('✅ All assignments are properly aligned by department');
        }

        // After creating assignments, fetch and display statistics
        const finalAssignments = await TeacherCourseAssignment.find()
            .populate('course_id', 'course_code department course_type')
            .populate('teacher_id', 'full_name department academic_rank');

        console.log('\n=== Assignment Results ===');
        const stats = {
            totalAssignments: finalAssignments.length,
            byDepartment: {},
            mismatches: 0
        };

        finalAssignments.forEach(assignment => {
            const dept = assignment.course_id.department;
            stats.byDepartment[dept] = (stats.byDepartment[dept] || 0) + 1;
            
            if (assignment.teacher_id.department !== dept) {
                stats.mismatches++;
                console.log(`WARNING: Department mismatch:`);
                console.log(`  Course: ${assignment.course_id.course_code} (${dept})`);
                console.log(`  Teacher: ${assignment.teacher_id.full_name} (${assignment.teacher_id.department})`);
            }
        });

        console.log('\nTotal Assignments:', stats.totalAssignments);
        console.log('\nAssignments by Department:');
        Object.entries(stats.byDepartment).forEach(([dept, count]) => {
            console.log(`${dept}: ${count} assignments`);
        });
        console.log('\nDepartment Mismatches:', stats.mismatches);

        if (stats.mismatches === 0) {
            console.log('✅ All assignments are properly aligned by department');
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