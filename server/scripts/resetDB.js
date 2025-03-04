require('dotenv').config();
const mongoose = require('mongoose');

const Student = require('../src/models/Student');
const Teacher = require('../src/models/Teacher');
const Course = require('../src/models/Course');
const TeacherCourseAssignment = require('../src/models/TeacherCourseAssignment');
const TeacherPreference = require('../src/models/TeacherPreference');
const ClassSchedule = require('../src/models/ClassSchedule');
const RoutineSession = require('../src/models/RoutineSession');

// Reset the database
async function resetDatabase() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_LOCAL_URL, {
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 10000
        });
        console.log('Connected to MongoDB');
        // Drop all collections
        await Promise.all([
            Student.deleteMany({}),
            Teacher.deleteMany({}),
            Course.deleteMany({}),
            TeacherCourseAssignment.deleteMany({}),
            TeacherPreference.deleteMany({}),
            ClassSchedule.deleteMany({}),
            RoutineSession.deleteMany({})
        ]);
        console.log('Successfully reset all collections');
    } catch (error) {
    console.error('Error resetting database:', error);
    process.exit(1);
    } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
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
// Run if called directly
if (require.main === module) {
    resetDatabase()
        .then(() => {
            console.log('Database reset completed');
            process.exit(0);
        })
        .catch(console.error);
}

module.exports = resetDatabase;