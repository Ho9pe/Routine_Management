require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Admin = require('../src/models/Admin');

// Create default admin
async function createDefaultAdmin() {
    let connection;
    try {
        connection = await mongoose.connect(process.env.MONGODB_LOCAL_URL, {
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 10000
        });
        console.log('Connected to MongoDB');
        // Check if admin already exists
        const adminExists = await Admin.findOne({ email: 'admin@ruet.ac.bd' });
        if (adminExists) {
            console.log('Admin already exists');
            console.log('\nRemoving existing admin...');
            await Admin.deleteOne({ email: 'admin@ruet.ac.bd' });
        }
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(process.env.DEFAULT_ADMIN_PASSWORD, salt);
        const admin = new Admin({
            admin_id: 'ADM001',
            email: 'admin@ruet.ac.bd',
            password: hashedPassword,
            name: 'System Administrator',
            role: 'admin',
            contact_info: {
                phone: '1234567890',
                office: 'Admin Building, Room 101'
            }
        });
        await admin.save();
        console.log('Default admin created successfully');
        console.log('\nAdmin Details:');
        console.log('Admin ID:', admin.admin_id);
        console.log('Email:', admin.email);
        console.log('Role:', admin.role);
    } catch (error) {
        console.error('Error creating admin:', error);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.disconnect();
            console.log('\nDatabase connection closed');
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

createDefaultAdmin().catch(console.error);