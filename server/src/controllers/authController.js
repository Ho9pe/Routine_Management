const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Admin = require('../models/Admin');

const register = async (req, res) => {
    try {
        const { 
            email, 
            password, 
            role, 
            department,
            student_roll,
            full_name,
            teacher_id,
            academic_rank,
            contact_info
        } = req.body;

        console.log('Registration request:', req.body);

        // Check if email already exists in either collection
        const studentExists = await Student.findOne({ email });
        const teacherExists = await Teacher.findOne({ 'contact_info.email': email });

        if (studentExists || teacherExists) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user based on role
        if (role === 'student') {
            // Check if student ID already exists
            const studentIdExists = await Student.findOne({ student_roll });
            if (studentIdExists) {
                return res.status(400).json({ message: 'Student ID already exists' });
            }

            const student = new Student({
                full_name,
                student_roll,
                email,
                password: hashedPassword,
                department,
                batch: `20${student_roll.substring(0, 2)}`
            });
            await student.save();
            console.log('Student saved:', student);
        } else if (role === 'teacher') {
            // Check if teacher ID already exists
            const teacherIdExists = await Teacher.findOne({ teacher_id });
            if (teacherIdExists) {
                return res.status(400).json({ message: 'Teacher ID already exists' });
            }

            const teacher = new Teacher({
                teacher_id,
                full_name,
                password: hashedPassword,
                academic_rank,
                department,
                contact_info: {
                    email,
                    phone: contact_info?.phone || '',
                    office: contact_info?.office || ''
                }
            });
            await teacher.save();
            console.log('Teacher saved:', teacher);
        }

        res.status(201).json({ message: 'Registration successful! Please login.' });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const login = async (req, res) => {
    try {
        const { email, password, role } = req.body;
        
        let user;
        // Check based on requested role
        switch(role) {
            case 'student':
                user = await Student.findOne({ email });
                break;
            case 'teacher':
                user = await Teacher.findOne({ 'contact_info.email': email });
                break;
            case 'admin':
                user = await Admin.findOne({ email });
                break;
            default:
                return res.status(400).json({ message: 'Invalid role' });
        }

        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Validate password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { 
                id: user._id,
                role,
                email: role === 'teacher' ? user.contact_info.email : user.email,
                ...(role === 'student' && {
                    student_roll: user.student_roll,
                    semester: user.semester
                })
            },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        // Return user data based on role
        if (role === 'admin') {
            res.json({
                token,
                user: {
                    id: user._id,
                    email: user.email,
                    role: 'admin',
                    name: user.name,
                    admin_id: user.admin_id,
                    contact_info: user.contact_info
                }
            });
        } else if (role === 'teacher') {
            res.json({
                token,
                user: {
                    id: user._id,
                    email: user.contact_info.email,
                    role,
                    department: user.department,
                    full_name: user.full_name,
                    teacher_id: user.teacher_id,
                    academic_rank: user.academic_rank,
                    contact_info: user.contact_info
                }
            });
        } else {
            res.json({
                token,
                user: {
                    id: user._id,
                    email: user.email,
                    role,
                    department: user.department,
                    full_name: user.full_name,
                    student_roll: user.student_roll,
                    semester: user.semester,
                    batch: user.batch
                }
            });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    register,
    login
};