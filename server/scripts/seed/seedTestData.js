const mongoose = require('mongoose');
const TeacherCourseAssignment = require('../../src/models/TeacherCourseAssignment');
const TeacherPreference = require('../../src/models/TeacherPreference');
const Teacher = require('../../src/models/Teacher');
const Course = require('../../src/models/Course');
const { TIME_SLOTS, WORKING_DAYS } = require('../../src/constants/timeSlots');
const { PREFERENCE_LEVELS } = require('../../src/constants/preferences');
require('dotenv').config();

async function seedTestData() {
    let connection;
    try {
        // Validate environment variables
        if (!process.env.MONGODB_LOCAL_URL) {
            throw new Error('MONGODB_LOCAL_URL environment variable is not defined');
        }

        // Connect to MongoDB with timeout
        connection = await mongoose.connect(process.env.MONGODB_LOCAL_URL, {
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 10000
        });
        console.log('Connected to MongoDB');

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

        // Create course assignments with balanced distribution
        const assignments = [];
        const teacherLoadMap = new Map(); // Track teacher loads
        const possibleSections = ['A', 'B', 'C'];

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
            if (a.semester !== b.semester) {
                return a.semester - b.semester;
            }
            return b.credit_hours - a.credit_hours;
        });

        // Assign courses to teachers based on rank and load
        for (const course of sortedCourses) {
            // For each course, we need to create assignments for all sections
            const sections = ['A', 'B', 'C']; // All sections should get the same course
            
            // Sort teachers by rank and current load
            const availableTeachers = [...teachers]
                .sort((a, b) => {
                    const loadA = teacherLoadMap.get(a._id.toString());
                    const loadB = teacherLoadMap.get(b._id.toString());
                    
                    // First priority: Current load (changed from academic rank)
                    if (loadA.totalHours !== loadB.totalHours) {
                        return loadA.totalHours - loadB.totalHours; // Lower load gets priority
                    }
        
                    // Second priority: Academic rank (as tiebreaker)
                    const rankPriority = {
                        'Professor': 4,
                        'Associate Professor': 3,
                        'Assistant Professor': 2,
                        'Lecturer': 1
                    };
                    return rankPriority[b.academic_rank] - rankPriority[a.academic_rank];
                });
        
            // Select teacher with lowest load
            const selectedTeacher = availableTeachers[0];
            const teacherLoad = teacherLoadMap.get(selectedTeacher._id.toString());
        
            // Create assignment for all sections if theory course
            if (course.course_type === 'theory') {
                assignments.push({
                    teacher_id: selectedTeacher._id,
                    course_id: course._id,
                    semester: course.semester,
                    academic_year: new Date().getFullYear().toString(),
                    sections: sections // All sections get the same theory course
                });
        
                // Update teacher load
                teacherLoad.totalHours += course.contact_hours * sections.length;
                teacherLoad.courseCount += 1;
            } 
            // For lab/sessional courses, create separate assignments for each section
            else {
                sections.forEach(section => {
                    // Find teacher with lowest load for each section
                    const sectionTeacher = [...teachers]
                        .sort((a, b) => {
                            const loadA = teacherLoadMap.get(a._id.toString()).totalHours;
                            const loadB = teacherLoadMap.get(b._id.toString()).totalHours;
                            return loadA - loadB;
                        })[0];
        
                    assignments.push({
                        teacher_id: sectionTeacher._id,
                        course_id: course._id,
                        semester: course.semester,
                        academic_year: new Date().getFullYear().toString(),
                        sections: [section]
                    });
        
                    // Update teacher load
                    const sectionTeacherLoad = teacherLoadMap.get(sectionTeacher._id.toString());
                    sectionTeacherLoad.totalHours += course.contact_hours;
                    sectionTeacherLoad.courseCount += 1;
                    teacherLoadMap.set(sectionTeacher._id.toString(), sectionTeacherLoad);
                });
            }
        
            teacherLoadMap.set(selectedTeacher._id.toString(), teacherLoad);
        }

        // Create preferences with intelligent distribution
        const preferences = [];
        const usedSlots = new Set();

        for (const teacher of teachers) {
            const teacherLoad = teacherLoadMap.get(teacher._id.toString());
            const numPreferences = Math.min(
                Math.ceil(teacherLoad.totalHours / 2), // One preference per 2 hours of teaching
                WORKING_DAYS.length * 2 // Maximum 2 preferences per day
            );

            let attempts = 0;
            const teacherPreferences = [];

            while (teacherPreferences.length < numPreferences && attempts < 30) {
                const day = WORKING_DAYS[Math.floor(Math.random() * WORKING_DAYS.length)];
                const timeSlot = TIME_SLOTS[Math.floor(Math.random() * TIME_SLOTS.length)];
                const slotKey = `${teacher._id}-${day}-${timeSlot.id}`;

                if (!usedSlots.has(slotKey)) {
                    usedSlots.add(slotKey);

                    // Determine preference level based on academic rank and time slot
                    let preferenceLevel;
                    const slotNumber = parseInt(timeSlot.id);
                    
                    if (teacher.academic_rank === 'Professor' || 
                        teacher.academic_rank === 'Associate Professor') {
                        // Senior faculty prefer morning slots
                        preferenceLevel = slotNumber <= 3 ? 'HIGH' : 
                                        slotNumber <= 6 ? 'MEDIUM' : 'LOW';
                    } else {
                        // Junior faculty get more varied preferences
                        preferenceLevel = ['HIGH', 'MEDIUM', 'LOW'][Math.floor(Math.random() * 3)];
                    }

                    // Occasionally mark slots as unavailable
                    if (Math.random() < 0.1) { // 10% chance
                        preferenceLevel = 'UNAVAILABLE';
                    }

                    teacherPreferences.push({
                        teacher_id: teacher._id,
                        day_of_week: day,
                        preferred_time_slot: timeSlot.id,
                        preference_level: preferenceLevel,
                        academic_year: new Date().getFullYear().toString(),
                        is_active: true
                    });
                }
                attempts++;
            }
            preferences.push(...teacherPreferences);
        }

        // Insert course assignments and preferences
        const createdAssignments = await TeacherCourseAssignment.insertMany(assignments);
        const createdPreferences = await TeacherPreference.insertMany(preferences);

        // Print statistics
        console.log('\nAssignment Statistics:');
        console.log(`Total Assignments Created: ${createdAssignments.length}`);
        
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

        console.log('\nSection Distribution:');
        const sectionStats = assignments.reduce((acc, assignment) => {
            assignment.sections.forEach(section => {
                acc[section] = (acc[section] || 0) + 1;
            });
            return acc;
        }, {});

        Object.entries(sectionStats).forEach(([section, count]) => {
            console.log(`Section ${section}: ${count} courses`);
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

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
    console.error('Unhandled Rejection:', error);
    process.exit(1);
});

seedTestData().catch(console.error);