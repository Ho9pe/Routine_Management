# University Routine Manager

## Project Overview
A web application for managing university class routines with role-based access for students, teachers, and administrators. The system features course management, schedule preferences, and automated routine generation.

## Current Implementation Status

### ✅ Completed Features

#### Authentication & Authorization
- JWT-based authentication system
- Role-based access control (Student/Teacher/Admin)
- Protected routes and middleware
- User registration and login
- Password reset functionality

#### User Management
- Student profile management
- Teacher profile system
- Academic credentials handling
- Contact information management

#### Course Management
- Course listing and filtering
- Course assignment system
- Section-based course allocation
- Credit hour tracking
- Course type categorization (Theory/Sessional/Project)

#### Teacher Features
- Course assignment management
- Multiple section handling
- Academic rank-based privileges
- Basic preference setting

#### UI/UX
- Responsive design implementation
- Role-based navigation
- Dark theme interface
- Interactive components
- Error handling and notifications



#### Schedule Management
- Basic routine display
- Time slot management
- Day-wise scheduling
- Basic filtering options

#### Preference System
- Basic preference setting
- Time slot selection
- Day preference options

#### Admin Controls
- Basic dashboard statistics
- Course management interface
- User overview system

### ❌ Pending Implementation

#### 1. Schedule Generation System
- Automated routine generation algorithm
- Academic rank-based priority system
- Conflict detection and resolution
- Room allocation optimization
- Section-wise schedule distribution

#### 2. Advanced Preference Management
- Conflict validation
- Priority-based preference handling
- Time slot optimization
- Workload distribution

#### 3. Room Management
- Room inventory system
- Capacity management
- Type-based allocation (Lab/Theory)
- Availability tracking

#### 4. Department Management
- Department-wise course organization
- Faculty assignment
- Resource allocation
- Semester management

#### 5. Enhanced Features
- Schedule export functionality
- Print optimization
- Email notifications
- Batch operations
- Advanced search capabilities
- Report generation

## Technical Stack
- Frontend: Next.js 13+ with App Router
- Backend: Express.js
- Database: MongoDB
- Authentication: JWT
- Styling: CSS Modules

## Database Models

### User Models

#### Student
- `full_name`: String (required)
- `student_roll`: String (required, unique, 7 digits)
- `email`: String (required, unique)
- `password`: String (hashed)
- `department`: String (required)
- `semester`: Number (1-8)
- `batch`: String (e.g., "2023")
- `created_at`: Date
- `updated_at`: Date

#### Teacher
- `teacher_id`: String (required, unique)
- `password`: String (hashed)
- `full_name`: String (required)
- `academic_rank`: String (enum: Professor, Associate Professor, Assistant Professor, Lecturer)
- `department`: String (required)
- `contact_info`:
  - `email`: String (required, unique)
  - `phone`: String
  - `office`: String
- `created_at`: Date
- `updated_at`: Date

#### Admin
- `admin_id`: String (required, unique, format: ADM001)
- `email`: String (required, unique)
- `password`: String (hashed)
- `name`: String (required)
- `role`: String (enum: admin, super_admin)
- `department`: String (required)
- `contact_info`:
  - `phone`: String
  - `office`: String
- `last_login`: Date
- `created_at`: Date
- `updated_at`: Date

### Academic Models

#### Course
- `course_code`: String (required, unique, format: CSE-1101)
- `course_name`: String (required)
- `course_type`: String (enum: theory, sessional, project, thesis)
- `theory_hours`: Number (0-6)
- `practical_hours`: Number (0-6)
- `credit_hours`: Number (0.75-4)
- `department`: String (required)
- `semester`: Number (1-8)
- `created_at`: Date
- `updated_at`: Date

#### TeacherCourseAssignment
- `teacher_id`: ObjectId (ref: Teacher)
- `course_id`: ObjectId (ref: Course)
- `semester`: Number (1-8)
- `academic_year`: String
- `sections`: Array of String (A, B, C)
- Timestamps: true

#### TeacherPreference
- `teacher_id`: ObjectId (ref: Teacher)
- `day_of_week`: String (enum: Working Days)
- `preferred_time_slot`: String (ref: Time Slots)
- `course_id`: ObjectId (ref: Course)
- `preference_level`: Number (1-5)
- `created_at`: Date
- `updated_at`: Date

#### ClassSchedule
- `course_id`: ObjectId (ref: Course)
- `teacher_id`: ObjectId (ref: Teacher)
- `day_of_week`: String (enum: Working Days)
- `time_slot`: String (ref: Time Slots)
- `semester`: String (1-8)
- `section`: String (A, B, C)
- `created_at`: Date
- `updated_at`: Date

### Constants

#### Time Slots
- 9 periods per day
- Format: { id, period, time }
- Example: { id: '1', period: '1st', time: '8:00-8:50 AM' }

#### Working Days
- Saturday through Wednesday

### Database Indexes
- Compound indexes for preventing scheduling conflicts
- Indexes for efficient course and teacher queries
- Unique constraints on critical fields

### Data Validation
- Input validation using Mongoose schemas
- Custom validation middleware
- Error handling for duplicate entries