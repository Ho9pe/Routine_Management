const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const connectDB = require('./src/config/database');
const errorHandler = require('./src/middleware/errorHandler');

// Import routes
const authRoutes = require('./src/routes/auth');
const courseRoutes = require('./src/routes/courses');
const teacherRoutes = require('./src/routes/teachers');
const preferenceRoutes = require('./src/routes/preferences');
const scheduleRoutes = require('./src/routes/schedule');
const adminRoutes = require('./src/routes/admin');
const studentRoutes = require('./src/routes/students');

const app = express();

// Middleware
const corsOptions = {
    origin: process.env.CLIENT_URL,
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(helmet());
app.use(morgan('dev'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/preferences', preferenceRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/students', studentRoutes);

// Error Handler
app.use(errorHandler);

// Connect to Database
connectDB();

// Basic route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to University Routine Manager API' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.log('UNHANDLED REJECTION! 💥 Shutting down...');
    console.log(err.name, err.message);
    process.exit(1);
});