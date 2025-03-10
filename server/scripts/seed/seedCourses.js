require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { parse } = require('@fast-csv/parse');

const Course = require('../../src/models/Course');
const { determineCourseType } = require('../../src/utils/courseTypeUtils');

// Validate course data
async function validateCourseData(data) {
    const errors = [];
    if (!data || !Array.isArray(data) || data.length === 0) {
        errors.push('Input data is empty or invalid');
        return errors;
    }
    data.forEach((row, index) => {
        // Validate Course Code
        if (!row['Course Code'] || !/^[A-Z]{2,4}-\d{4}$/.test(row['Course Code'].trim())) {
            errors.push(`Row ${index + 1}: Invalid course code format`);
        }
        // Validate Credit Hours
        const creditHours = parseFloat(row['Credit Hours']);
        if (isNaN(creditHours) || creditHours < 0.75 || creditHours > 4) {
            errors.push(`Row ${index + 1}: Invalid credit hours`);
        }
        // Validate Contact Hours
        const contactHours = parseFloat(row['Contact Hours']);
        if (isNaN(contactHours) || contactHours < 0 || contactHours > 6) {
            errors.push(`Row ${index + 1}: Invalid contact hours`);
        }
        // Validate Semester
        const semester = parseInt(row['Semester']);
        if (isNaN(semester) || semester < 1 || semester > 8) {
            errors.push(`Row ${index + 1}: Invalid semester`);
        }
    });
    return errors;
}
// Process course data from CSV file
async function processCourseData(filePath) {
    return new Promise((resolve, reject) => {
        const courses = [];
        const stream = fs.createReadStream(filePath)
            .pipe(parse({ headers: true, skipRows: 0 }));
        stream.on('error', error => reject(error));
        stream.on('data', row => courses.push(row));
        stream.on('end', () => resolve(courses));
    });
}
// Seed courses
async function seedCourses() {
    let connection;
    try {
        connection = await mongoose.connect(process.env.MONGODB_LOCAL_URL, {
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 10000
        });
        console.log('Connected to MongoDB');
        const csvFilePath = path.join(__dirname, '../../data/courses_final.csv');
        // Verify file exists and is accessible
        try {
            await fs.promises.access(csvFilePath, fs.constants.R_OK);
        } catch (error) {
            throw new Error(`Cannot access file at ${csvFilePath}`);
        }
        // Process CSV data
        const courseData = await processCourseData(csvFilePath);
        // Validate data
        const validationErrors = await validateCourseData(courseData);
        if (validationErrors.length > 0) {
            console.error('Validation errors:');
            validationErrors.forEach(error => console.error(`- ${error}`));
            throw new Error('Data validation failed');
        }
        // Clear existing courses
        await Course.deleteMany({});
        console.log('Cleared existing courses');
        // Transform and prepare course documents
        const courses = courseData.map(row => {
            const courseCode = row['Course Code'].trim();
            const courseName = row['Course Name'].trim();
            return {
                course_code: courseCode,
                course_name: courseName,
                contact_hours: parseFloat(row['Contact Hours']),
                credit_hours: parseFloat(row['Credit Hours']),
                department: courseCode.split('-')[0].trim(),
                semester: parseInt(row['Semester']),
                course_type: determineCourseType(courseCode, courseName)
            };
        });
        // Insert courses
        const result = await Course.insertMany(courses, {
            ordered: true,
            timeout: 30000
        });
        // Log results
        console.log(`\nSuccessfully seeded ${result.length} courses`);
        // Log statistics
        const stats = result.reduce((acc, course) => {
            acc.semesters = acc.semesters || {};
            acc.departments = acc.departments || {};
            acc.types = acc.types || {};
            acc.semesters[course.semester] = (acc.semesters[course.semester] || 0) + 1;
            acc.departments[course.department] = (acc.departments[course.department] || 0) + 1;
            acc.types[course.course_type] = (acc.types[course.course_type] || 0) + 1;
            return acc;
        }, {});
        console.log('\nCourse Statistics:');
        console.log('\nBy Semester:');
        Object.entries(stats.semesters)
            .sort(([a], [b]) => parseInt(a) - parseInt(b))
            .forEach(([semester, count]) => {
                console.log(`Semester ${semester}: ${count} courses`);
            });
        console.log('\nBy Department:');
        Object.entries(stats.departments)
            .forEach(([dept, count]) => {
                console.log(`${dept}: ${count} courses`);
            });
        console.log('\nBy Type:');
        Object.entries(stats.types)
            .forEach(([type, count]) => {
                console.log(`${type}: ${count} courses`);
            });
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.disconnect();
            console.log('Database connection closed');
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

seedCourses().catch(console.error);