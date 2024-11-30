# University Routine Manager

## Project Overview
A web application for managing university class routines with separate panels for students and teachers. Teachers can input their preferences and schedules, while students can view their class routines. The system automatically generates routines based on academic rank priorities.

## System Architecture
- **Frontend:** React.js/Next.js - Vanilla JS, CSS
- **Backend:** Node.js with Express.js - Vanilla JS
- **Database:** MongoDB
- **Authentication:** JWT/OAuth

## Database Schema

### Students
- student_roll (PK)
- username
- password (hashed)
- email
- department
- created_at

### Teachers
- teacher_id (PK)
- full_name
- academic_rank
- department
- contact_info

### Courses
- course_id (PK)
- course_code
- course_name
- credit_hours
- department

### Teacher_Preferences
- preference_id (PK)
- teacher_id (FK)
- day_of_week
- preferred_time_slot
- course_id (FK)

### Class_Schedule
- schedule_id (PK)
- course_id (FK)
- teacher_id (FK)
- room_number
- day_of_week
- time_slot
- semester

## Features Breakdown

### Authentication System
- User registration
- Login/Logout
- Role-based access control
- Password recovery

### Teacher Panel
1. **Profile Management**
   - Personal information
   - Academic credentials
   - Contact details
2. **Course Management**
   - Assign courses
   - View assigned courses
   - Course history
3. **Schedule Preferences**
   - Set preferred time slots
   - Set preferred days
   - Mark unavailable times

### Student Panel
1. **View Features**
   - Weekly class routine
   - Course schedule
   - Teacher information
   - Room allocation
2. **Filter Options**
   - By day
   - By course
   - By teacher

### Admin Panel
1. **Management Features**
   - User management
   - Course management
   - Room allocation
   - Schedule generation
2. **Schedule Generator Algorithm**
   - Priority based on academic rank
   - Conflict resolution
   - Room availability check
   - Time slot optimization

## Technical Implementation Steps

### Phase 1: Setup & Basic Structure
- Project initialization
- Database setup
- Basic authentication
- User management

### Phase 2: Core Features
- Teacher profile system
- Preference management
- Basic routine display
- Course management

### Phase 3: Schedule Generator
- Algorithm development
- Priority queue implementation
- Conflict resolution logic
- Optimization rules

### Phase 4: UI/UX Development
- Responsive design
- Interactive calendar
- Filter implementations
- Schedule visualization




## Implementation Status

### Phase 1: Setup & Basic Structure ✅

#### 1. Project Setup ✅
- Next.js frontend configured
- Express.js backend configured
- MongoDB connection established
- Project structure organized

#### 2. Database Models ✅
- User model
- Teacher model
- Student model
- Course model
- TeacherPreference model
- ClassSchedule model

#### 3. Authentication System ✅
- JWT implementation
- Login/Logout functionality
- Registration system
- Password hashing
- Token management
- Protected routes

#### 4. Authorization ✅
- Role-based access control
- Admin routes protection
- Teacher routes protection
- Student routes protection

### Phase 2: Core Features

#### 1. Course Management ✅
- Course listing
- Course creation (admin)
- Course editing (admin)
- Course deletion (admin)
- Course viewing (all users)

#### 2. Teacher Profile System ✅
- Profile viewing
- Profile editing
- Academic details
- Contact information

#### 3. Admin Dashboard ✅
- Statistics overview
- Quick actions
- Management links
- Admin-only access

#### 4. Navigation System ✅
- Role-based navigation
- Protected routes
- Active route highlighting
- Responsive design

### Partially Implemented Features 🔄

#### 1. Preference Management
- ✅ Model and routes created
- ✅ Basic UI implemented
- ❌ Validation for conflicting preferences
- ❌ Advanced preference rules

#### 2. Routine Display
- ✅ Basic schedule display
- ✅ Filtering options
- ❌ Print functionality
- ❌ Export options

#### 3. Admin Features
- ✅ Basic dashboard
- ✅ Course management
- ❌ Room management
- ❌ Department management

### Pending Features ❌

#### 1. Schedule Generation
- Automatic routine generation
- Conflict resolution
- Priority-based scheduling
- Room allocation

#### 2. Advanced Management
- Room management system
- Department management
- Semester management
- Batch management

#### 3. Additional Features
- Email notifications
- Schedule export
- Batch operations
- Advanced search
- Reports generation


## Next Steps

### 1. Complete Phase 2
- Implement login/logout, register ✅
- Implement database connection, fetch, insert, update, delete ✅
- Implement Teacher Profile System
- Implement full preference management
- Enhance routine display
- Complete admin features

### 2. Start Phase 3
- Schedule generator algorithm
- Room allocation system
- Department management
- Advanced features
