# University Routine Manager

## Project Overview
A web application for managing university class routines with role-based access for students, teachers, and administrators. The system features course management, schedule preferences, and automated routine generation.

## Current Implementation Status

### ✅ Completed Features

[Previous completed features remain the same...]

#### Schedule Generation System
- Automated routine generation algorithm
- Academic rank-based priority system
- Conflict detection and resolution
- Section-wise schedule distribution
- Teacher workload balancing

#### Admin Management
- Complete admin dashboard
- User management interface
- Course management system
- Statistics and analytics
- System-wide controls

#### Advanced Preference Management
- Teacher preference system
- Priority-based scheduling
- Workload distribution
- Time slot optimization
- Conflict handling

### ❌ Pending Implementation

#### 1. Department Management
- Department-wise course organization
- Faculty assignment
- Resource allocation
- Semester management

#### 2. Enhanced Features
- Schedule export functionality
- Print optimization
- Email notifications
- Batch operations
- Advanced search capabilities
- Report generation

#### 1. Admin Management
- Admin Dashboard
- Admin Management Interface

#### 2. Schedule Generation System
- Automated routine generation algorithm
- Academic rank-based priority system
- Conflict detection and resolution
- Room allocation optimization
- Section-wise schedule distribution

#### 3. Advanced Preference Management
- Conflict validation
- Priority-based preference handling
- Time slot optimization
- Workload distribution

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

#### Student (`server/src/models/Student.js`)
- `full_name`: String (required, 2-100 chars)
- `student_roll`: String (required, unique, 7 digits)
- `email`: String (required, unique, valid email format)
- `password`: String (hashed, min 6 chars)
- `department`: String (required, uppercase)
- `semester`: Number (1-8)
- `batch`: String (format: "20XX")
- Timestamps: true

#### Teacher (`server/src/models/Teacher.js`)
- `teacher_id`: String (required, unique)
- `password`: String (required)
- `full_name`: String (required, 2-100 chars)
- `academic_rank`: String (enum: Professor, Associate Professor, Assistant Professor, Lecturer)
- `department`: String (required)
- `contact_info`:
  - `email`: String (required, unique, valid email format)
  - `phone`: String (optional, valid phone format)
  - `office`: String (optional)
- Timestamps: true

#### Admin (`server/src/models/Admin.js`)
- `admin_id`: String (required, unique, format: ADM001)
- `email`: String (required, unique, valid email format)
- `password`: String (required, min 6 chars)
- `name`: String (required, 2-100 chars)
- `role`: String (enum: ['admin'])
- `contact_info`:
  - `phone`: String (valid phone format)
  - `office`: String
- `last_login`: Date
- Timestamps: true

### Academic Models

#### Course (`server/src/models/Course.js`)
- `course_code`: String (required, unique, format: CSE-1101)
- `course_name`: String (required, 3-100 chars)
- `course_type`: String (enum: theory, sessional, project, thesis)
- `contact_hours`: Number (0-6)
- `credit_hours`: Number (0.75-4)
- `department`: String (required, enum: ['CSE', 'EEE', 'MATH', 'PHY', 'CHEM', 'HUM'])
- `semester`: Number (1-8)
- Timestamps: true
- Indexes: 
  - Compound: { department: 1, semester: 1, course_type: 1 }
  - Unique: { course_code: 1, department: 1 }

#### TeacherCourseAssignment (`server/src/models/TeacherCourseAssignment.js`)
- `teacher_id`: ObjectId (ref: Teacher)
- `course_id`: ObjectId (ref: Course)
- `semester`: Number (1-8)
- `academic_year`: String (format: "20XX")
- `sections`: Array of String (enum: ['A', 'B', 'C'])
- Timestamps: true
- Unique Index: { teacher_id, course_id, sections, academic_year }

#### TeacherPreference (`server/src/models/TeacherPreference.js`)
- `teacher_id`: ObjectId (ref: Teacher)
- `day_of_week`: String (enum: Working Days)
- `preferred_time_slot`: String (ref: Time Slots)
- `preference_level`: String (enum: ['HIGH', 'MEDIUM', 'LOW', 'UNAVAILABLE'])
- `academic_year`: String (format: "20XX")
- `is_active`: Boolean
- Timestamps: true
- Unique Index: { teacher_id, day_of_week, preferred_time_slot, academic_year, is_active }

#### ClassSchedule (`server/src/models/ClassSchedule.js`)
- `course_id`: ObjectId (ref: Course)
- `teacher_id`: ObjectId (ref: Teacher)
- `day_of_week`: String (enum: Working Days)
- `time_slot`: String (ref: Time Slots)
- `semester`: Number (1-8)
- `section`: String (enum: ['A', 'B', 'C'])
- `academic_year`: String (format: "20XX")
- `is_active`: Boolean
- Timestamps: true
- Unique Indexes:
  - Teacher availability: { teacher_id, day_of_week, time_slot, academic_year, is_active }
  - Section availability: { semester, section, day_of_week, time_slot, academic_year, is_active }

#### RoutineSession (`server/src/models/RoutineSession.js`)
- `academic_year`: String (format: "20XX")
- `status`: String (enum: ['pending', 'processing', 'completed', 'failed'])
- `generated_by`: ObjectId (ref: Admin)
- `start_time`: Date
- `end_time`: Date
- `error_log`: [String]
- `success_log`: [String]
- `conflicts`: [{
    type: String (enum: ['teacher', 'section', 'preference', 'daily_limit', 'course_repeat', 'scheduling']),
    description: String,
    course_id: ObjectId,
    teacher_id: ObjectId,
    semester: Number,
    section: String,
    day: String,
    time_slot: String
  }]
- Timestamps: true

### Constants

#### Time Slots (`server/src/constants/timeSlots.js`)
- 9 periods per day
- Working Days: Saturday through Wednesday
- Format: { id, period, time }
- Example: { id: '1', period: '1st', time: '8:00-8:50 AM' }

#### Preferences (`server/src/constants/preferences.js`)
- Preference Weights: HIGH (3), MEDIUM (2), LOW (1), UNAVAILABLE (0)
- Time of Day Weights: MORNING (3), MIDDAY (2), AFTERNOON (1)