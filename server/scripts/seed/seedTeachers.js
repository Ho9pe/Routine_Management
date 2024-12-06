require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const { parse } = require('@fast-csv/parse');
const Teacher = require('../../src/models/Teacher');

async function validateTeacherData(data) {
    const errors = [];
    
    if (!data || !Array.isArray(data) || data.length === 0) {
        errors.push('Input data is empty or invalid');
        return errors;
    }

    const VALID_RANKS = ['Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer'];

    data.forEach((row, index) => {
        // Validate Name
        if (!row.Name || row.Name.trim().length < 2) {
            errors.push(`Row ${index + 1}: Invalid or missing name`);
        }

        // Validate Designation (Academic Rank)
        if (!row.Designation || !VALID_RANKS.includes(row.Designation.trim())) {
            errors.push(`Row ${index + 1}: Invalid or missing academic rank`);
        }

        // Validate Department
        if (!row.Department) {
            errors.push(`Row ${index + 1}: Missing department`);
        }

        // Validate Email
        const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
        if (!row.Email || !emailRegex.test(row.Email.trim())) {
            errors.push(`Row ${index + 1}: Invalid or missing email`);
        }

        // Validate Phone (optional but must be valid if provided)
        if (row.Phone && !/^\d{10,}$/.test(row.Phone.trim())) {
            errors.push(`Row ${index + 1}: Invalid phone number format`);
        }
    });

    return errors;
}

function generateTeacherId() {
    return `TCSE-${Math.floor(1000 + Math.random() * 9000)}`; // Generates TCSE-XXXX
}

async function processTeacherData(filePath) {
    return new Promise((resolve, reject) => {
        const teachers = [];
        const stream = fs.createReadStream(filePath)
            .pipe(parse({ headers: true, skipRows: 0 }));

        stream.on('error', error => reject(error));
        stream.on('data', row => teachers.push(row));
        stream.on('end', () => resolve(teachers));
    });
}

async function seedTeachers() {
    let connection;
    try {
        connection = await mongoose.connect(process.env.MONGODB_LOCAL_URL, {
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 10000
        });
        console.log('Connected to MongoDB');

        const csvFilePath = path.join(__dirname, '../../data/teachers.csv');
        
        // Verify file exists and is accessible
        try {
            await fs.promises.access(csvFilePath, fs.constants.R_OK);
        } catch (error) {
            throw new Error(`Cannot access file at ${csvFilePath}`);
        }

        // Process CSV data
        const teacherData = await processTeacherData(csvFilePath);

        // Validate data
        const validationErrors = await validateTeacherData(teacherData);
        if (validationErrors.length > 0) {
            console.error('Validation errors:');
            validationErrors.forEach(error => console.error(`- ${error}`));
            throw new Error('Data validation failed');
        }

        // Clear existing teachers
        await Teacher.deleteMany({});
        console.log('Cleared existing teachers');

        // Transform and prepare teacher documents
        const teachers = teacherData.map(row => ({
            teacher_id: generateTeacherId(),
            full_name: row.Name.trim(),
            academic_rank: row.Designation.trim(),
            department: row.Department.trim(),
            contact_info: {
                email: row.Email.trim(),
                phone: row.Phone ? row.Phone.trim() : '',
                office: row['Office Contact'] ? row['Office Contact'].trim() : ''
            },
            password: process.env.DEFAULT_TEACHER_PASSWORD // Will be hashed
        }));

        // Hash passwords
        const hashedTeachers = await Promise.all(
            teachers.map(async (teacher) => {
                const salt = await bcrypt.genSalt(12);
                const hashedPassword = await bcrypt.hash(teacher.password, salt);
                return { ...teacher, password: hashedPassword };
            })
        );

        // Insert teachers with proper error handling
        const result = await Teacher.insertMany(hashedTeachers, {
            ordered: true,
            timeout: 30000
        });

        // Log results
        console.log(`\nSuccessfully seeded ${result.length} teachers`);
        console.log('\nRank Statistics:');
        
        const rankStats = result.reduce((acc, teacher) => {
            acc[teacher.academic_rank] = (acc[teacher.academic_rank] || 0) + 1;
            return acc;
        }, {});

        Object.entries(rankStats)
            .sort((a, b) => {
                const rankOrder = {
                    'Professor': 1,
                    'Associate Professor': 2,
                    'Assistant Professor': 3,
                    'Lecturer': 4
                };
                return rankOrder[a[0]] - rankOrder[b[0]];
            })
            .forEach(([rank, count]) => {
                console.log(`${rank}: ${count} teachers`);
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

seedTeachers().catch(console.error);