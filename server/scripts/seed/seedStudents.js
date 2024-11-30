require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const { parse } = require('@fast-csv/parse');
const Student = require('../../models/Student');

async function validateStudentData(data) {
    const errors = [];
    
    // Check if data is empty
    if (!data || !Array.isArray(data) || data.length === 0) {
        errors.push('Input data is empty or invalid');
        return errors;
    }

    // Validate each row
    data.forEach((row, index) => {
        // Sanitize and validate Roll No.
        const rollNo = String(row['Roll No.']).trim();
        if (!rollNo) {
            errors.push(`Row ${index + 1}: Missing Roll No.`);
        } else if (!/^\d{7}$/.test(rollNo)) {
            errors.push(`Row ${index + 1}: Invalid Roll No. format (should be 7 digits)`);
        }

        // Sanitize and validate Student Name
        const studentName = String(row['Student Name'] || '').trim();
        if (!studentName) {
            errors.push(`Row ${index + 1}: Missing Student Name`);
        } else if (studentName.length > 100) {
            errors.push(`Row ${index + 1}: Student Name too long (max 100 characters)`);
        } else if (!/^[a-zA-Z\s.'-]+$/.test(studentName)) {
            errors.push(`Row ${index + 1}: Student Name contains invalid characters`);
        }

        // Validate Batch (derived from roll number)
        const batchYear = `20${rollNo.substring(0, 2)}`;
        if (!/^20\d{2}$/.test(batchYear)) {
            errors.push(`Row ${index + 1}: Invalid batch year`);
        }

        // Validate Semester (optional)
        if (row['Semester']) {
            const semester = parseInt(row['Semester']);
            if (isNaN(semester) || semester < 1 || semester > 8) {
                errors.push(`Row ${index + 1}: Invalid semester (must be between 1 and 8)`);
            }
        }
    });

    return errors;
}

async function processStudentData(filePath) {
    return new Promise((resolve, reject) => {
        const students = [];
        const stream = fs.createReadStream(filePath)
            .pipe(parse({ headers: true, skipRows: 0 }));

        stream.on('error', error => reject(error));
        stream.on('data', row => students.push(row));
        stream.on('end', () => resolve(students));
    });
}

async function seedStudents() {
    let connection;
    try {
        // Connect to MongoDB with timeout
        connection = await mongoose.connect(process.env.MONGODB_LOCAL_URL, {
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 10000
        });
        console.log('Connected to MongoDB');

        const csvFilePath = path.join(__dirname, '../../data/students.csv');
        
        // Verify file exists and is accessible
        try {
            await fs.promises.access(csvFilePath, fs.constants.R_OK);
        } catch (error) {
            throw new Error(`Cannot access file at ${csvFilePath}`);
        }

        // Process CSV data
        const studentData = await processStudentData(csvFilePath);

        // Validate data
        const validationErrors = await validateStudentData(studentData);
        if (validationErrors.length > 0) {
            console.error('Validation errors:');
            validationErrors.forEach(error => console.error(`- ${error}`));
            throw new Error('Data validation failed');
        }

        // Check for duplicate rolls before processing
        const rolls = studentData.map(s => String(s['Roll No.']).trim());
        const uniqueRolls = new Set(rolls);
        if (uniqueRolls.size !== rolls.length) {
            throw new Error('Duplicate Roll Numbers found in input data');
        }

        // Clear existing students
        await Student.deleteMany({});
        console.log('Cleared existing students');

        // Transform and sanitize data
        const students = studentData.map(row => ({
            full_name: String(row['Student Name']).trim(),
            student_roll: String(row['Roll No.']).trim(),
            email: `${String(row['Roll No.']).trim()}@student.ruet.ac.bd`,
            password: 'password123', // This will be hashed
            department: 'CSE',
            batch: `20${String(row['Roll No.']).substring(0, 2)}`,
            semester: row['Semester'] ? parseInt(row['Semester']) : null
        }));

        // Hash passwords with appropriate cost factor
        const hashedStudents = await Promise.all(
            students.map(async (student) => {
                const salt = await bcrypt.genSalt(12);
                const hashedPassword = await bcrypt.hash(student.password, salt);
                return { ...student, password: hashedPassword };
            })
        );

        // Insert students with proper error handling
        const result = await Student.insertMany(hashedStudents, { 
            ordered: true,
            timeout: 30000
        });

        // Log results securely
        console.log(`\nSuccessfully seeded ${result.length} students`);
        console.log('\nBatch Statistics:');
        
        // Compute batch statistics safely
        const batchStats = result.reduce((acc, student) => {
            const batchYear = student.batch;
            acc[batchYear] = (acc[batchYear] || 0) + 1;
            return acc;
        }, {});

        Object.entries(batchStats)
            .sort(([a], [b]) => b.localeCompare(a))
            .forEach(([batch, count]) => {
                console.log(`${batch} batch: ${count} students`);
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

seedStudents().catch(console.error);