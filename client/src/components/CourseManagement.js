'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import styles from './CourseManagement.module.css';
import ErrorMessage from './ErrorMessage';
import { semesterToYear } from '@/utils/semesterMapping';
import { getSemesterFromCourseCode } from '@/utils/courseUtils';

export default function CourseManagement() {
    const { user } = useAuth();
    const [courses, setCourses] = useState([]);
    const [assignedCourses, setAssignedCourses] = useState([]);
    const [availableCourses, setAvailableCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [studentProfile, setStudentProfile] = useState(null);
    const [showAssignForm, setShowAssignForm] = useState(false);
    const [newAssignment, setNewAssignment] = useState({
        course_id: '',
        sections: []
    });
    const [confirmDelete, setConfirmDelete] = useState(null);

    useEffect(() => {
        if (user?.role === 'student') {
            fetchStudentProfile();
            fetchCourses();
        } else if (user?.role === 'teacher') {
            fetchAssignedCourses();
            fetchAvailableCourses();
        }
    }, [user]);

    const fetchStudentProfile = async () => {
        if (user?.role === 'student') {
            try {
                const response = await fetch('/api/students/profile', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                const data = await response.json();
                if (response.ok) {
                    setStudentProfile(data);
                }
            } catch (error) {
                console.error('Error fetching student profile:', error);
            }
        }
    };

    const fetchCourses = async () => {
        try {
            const response = await fetch('/api/courses', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();
            
            if (response.ok) {
                setCourses(data);
            } else {
                setError(data.message || 'Failed to fetch courses');
            }
        } catch (error) {
            setError('Failed to fetch courses');
        } finally {
            setLoading(false);
        }
    };

    const fetchAssignedCourses = async () => {
        try {
            const response = await fetch('/api/teachers/courses', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
    
            if (!response.ok) {
                throw new Error('Failed to fetch courses');
            }
    
            const data = await response.json();
            setAssignedCourses(data);
        } catch (error) {
            console.error('Error fetching assigned courses:', error);
            setError('Failed to fetch assigned courses');
        } finally {
            setLoading(false);
        }
    };

    const fetchAvailableCourses = async () => {
        try {
            const response = await fetch('/api/courses', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();
            if (response.ok) {
                setAvailableCourses(data);
            }
        } catch (error) {
            console.error('Failed to fetch available courses');
        }
    };

    const handleAssignCourse = async (e) => {
        e.preventDefault();
        
        if (!newAssignment.course_id || !newAssignment.sections.length) {
            setError('Please select a course and at least one section');
            setShowAssignForm(false); // Close dialog on validation error
            return;
        }
    
        // Check if course is already assigned with any of the selected sections
        const duplicateAssignment = assignedCourses.find(assignment => 
            assignment.course_id._id === newAssignment.course_id &&
            assignment.sections.some(section => 
                newAssignment.sections.includes(section)
            )
        );
    
        if (duplicateAssignment) {
            setError('You have already been assigned to this course for one or more of these sections');
            setShowAssignForm(false); // Close dialog on duplicate error
            return;
        }
    
        try {
            const response = await fetch('/api/teachers/courses/assign', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    ...newAssignment,
                    academic_year: new Date().getFullYear().toString()
                })
            });
            const data = await response.json();
            
            if (response.ok) {
                setAssignedCourses(prev => [...prev, data]);
                setShowAssignForm(false);
                setNewAssignment({
                    course_id: '',
                    sections: []
                });
                // Refresh the course list
                fetchAssignedCourses();
            } else {
                setError(data.message || 'Failed to assign course');
                setShowAssignForm(false); // Close dialog on API error
            }
        } catch (error) {
            console.error('Error assigning course:', error);
            setError('Failed to assign course');
            setShowAssignForm(false); // Close dialog on network error
        }
    };

    const handleCourseSelect = (e) => {
        const selectedCourse = availableCourses.find(
            course => course._id === e.target.value
        );
        
        if (selectedCourse) {
            const semester = getSemesterFromCourseCode(selectedCourse.course_code);
            setNewAssignment({
                ...newAssignment,
                course_id: selectedCourse._id,
                semester: semester // Automatically set the semester
            });
        }
    };

    const handleRemoveCourse = async (assignmentId) => {
        try {
            const response = await fetch(`/api/teachers/courses/${assignmentId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
    
            if (response.ok) {
                // Remove course from state
                setAssignedCourses(prev => 
                    prev.filter(course => course._id !== assignmentId)
                );
            } else {
                const data = await response.json();
                setError(data.message || 'Failed to remove course');
            }
        } catch (error) {
            console.error('Error removing course:', error);
            setError('Failed to remove course');
        }
    };

    const handleRemoveClick = (assignmentId) => {
        setConfirmDelete(assignmentId);
    };
    const handleConfirmRemove = async () => {
        if (confirmDelete) {
            await handleRemoveCourse(confirmDelete);
            setConfirmDelete(null);
        }
    };

    const isDuplicateAssignment = (courseId, sections) => {
        return assignedCourses.some(assignment => 
            assignment.course_id._id === courseId &&
            assignment.sections.some(existingSection => 
                sections.includes(existingSection)
            )
        );
    };

    const handleSectionChange = (section, isChecked) => {
        const updatedSections = isChecked
            ? [...newAssignment.sections, section]
            : newAssignment.sections.filter(s => s !== section);
    
        // Check for duplicates before updating state
        if (isChecked && isDuplicateAssignment(newAssignment.course_id, [section])) {
            setError(`Section ${section} is already assigned for this course`);
            setShowAssignForm(false); // Close dialog on duplicate section error
            return;
        }
    
        setNewAssignment({
            ...newAssignment,
            sections: updatedSections
        });
    };

    // Filter courses based on student's semester
    const filteredCourses = courses.filter(course => {
        if (!studentProfile?.semester) return true; // Show all courses if no semester is set
        return course.semester === studentProfile.semester;
    });

    if (loading) return <div className={styles.loading}>Loading...</div>;

    return (
        <div className={styles.courseManagement}>
            <div className={styles.header}>
                <h2>{user?.role === 'teacher' ? 'My Assigned Courses' : 'My Courses'}</h2>
                {user?.role === 'teacher' ? (
                    <button 
                        onClick={() => setShowAssignForm(true)}
                        className={styles.addButton}
                    >
                        Add Course
                    </button>
                ) : (
                    studentProfile?.semester && (
                        <div className={styles.semesterBadge}>
                            Semester: {semesterToYear(studentProfile.semester)}
                        </div>
                    )
                )}
            </div>
    
            {error && (
                <ErrorMessage 
                    message={error}
                    onDismiss={() => setError('')}
                    duration={5000}
                />
            )}
    
            {user?.role === 'teacher' ? (
                // Teacher View
                <div className={styles.courseGrid}>
                    {assignedCourses?.map(assignment => (
                        <div key={assignment._id} className={styles.courseCard}>
                            <div className={styles.courseHeader}>
                                <h4 className={styles.courseCode}>
                                    {assignment.course_id.course_code}
                                </h4>
                                <div className={styles.headerActions}>
                                    <span className={`${styles.courseType} ${styles[assignment.course_id.course_type]}`}>
                                        {assignment.course_id.course_type}
                                    </span>
                                    <button 
                                        onClick={() => handleRemoveClick(assignment._id)}
                                        className={styles.removeButton}
                                        title="Remove Course"
                                    >
                                        ×
                                    </button>
                                </div>
                            </div>
                            <h3 className={styles.courseName}>
                                {assignment.course_id.course_name}
                            </h3>
                            <div className={styles.courseDetails}>
                                <div className={styles.detailItem}>
                                    <span className={styles.label}>Semester:</span>
                                    <span className={styles.value}>{semesterToYear(assignment.semester)}</span>
                                </div>
                                <div className={styles.detailItem}>
                                    <span className={styles.label}>Sections:</span>
                                    <span className={styles.value}>{assignment.sections.join(', ')}</span>
                                </div>
                                <div className={styles.detailItem}>
                                    <span className={styles.label}>Credit Hours:</span>
                                    <span className={styles.value}>{assignment.course_id.credit_hours}</span>
                                </div>
                                <div className={styles.detailItem}>
                                    <span className={styles.label}>Theory Hours:</span>
                                    <span className={styles.value}>{assignment.course_id.theory_hours}</span>
                                </div>
                                <div className={styles.detailItem}>
                                    <span className={styles.label}>Practical Hours:</span>
                                    <span className={styles.value}>{assignment.course_id.practical_hours}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                // Student View
                filteredCourses.length > 0 ? (
                    <div className={styles.courseGrid}>
                        {filteredCourses.map(course => (
                            <div key={course._id} className={styles.courseCard}>
                                <div className={styles.courseHeader}>
                                    <h4 className={styles.courseCode}>{course.course_code}</h4>
                                    <span className={`${styles.courseType} ${styles[course.course_type]}`}>
                                        {course.course_type}
                                    </span>
                                </div>
                                <h3 className={styles.courseName}>{course.course_name}</h3>
                                <div className={styles.courseDetails}>
                                    <div className={styles.detailItem}>
                                        <span className={styles.label}>Credit Hours:</span>
                                        <span className={styles.value}>{course.credit_hours}</span>
                                    </div>
                                    <div className={styles.detailItem}>
                                        <span className={styles.label}>Theory Hours:</span>
                                        <span className={styles.value}>{course.theory_hours}</span>
                                    </div>
                                    <div className={styles.detailItem}>
                                        <span className={styles.label}>Practical Hours:</span>
                                        <span className={styles.value}>{course.practical_hours}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className={styles.noCourses}>
                        <div className={styles.noCoursesContent}>
                            <span className={styles.noCoursesIcon}>📚</span>
                            <p className={styles.noCoursesText}>
                                {studentProfile?.semester 
                                    ? `No courses found for semester ${semesterToYear(studentProfile.semester)}`
                                    : 'No courses available'}
                            </p>
                        </div>
                    </div>
                )
            )}
            {showAssignForm && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <h3>Assign New Course</h3>
                            <button 
                                className={styles.closeButton}
                                onClick={() => {
                                    setShowAssignForm(false);
                                    setNewAssignment({
                                        course_id: '',
                                        sections: []
                                    });
                                }}
                            >
                                ×
                            </button>
                        </div>
                        <form onSubmit={handleAssignCourse} className={styles.modalForm}>
                            <div className={styles.formGroup}>
                                <label>Select Course</label>
                                <select
                                    value={newAssignment.course_id}
                                    onChange={handleCourseSelect}
                                    required
                                >
                                    <option value="">Choose a course</option>
                                    {availableCourses?.map(course => (
                                        <option key={course._id} value={course._id}>
                                            {course.course_name} ({course.course_code})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className={styles.formGroup}>
                                <label>Select Sections</label>
                                <div className={styles.sectionGrid}>
                                    {['A', 'B', 'C'].map(section => (
                                        <label key={section} className={styles.sectionLabel}>
                                            <input
                                                type="checkbox"
                                                checked={newAssignment.sections.includes(section)}
                                                onChange={(e) => 
                                                    handleSectionChange(section, e.target.checked)
                                                }
                                            />
                                            <span className={styles.sectionText}>Section {section}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className={styles.modalActions}>
                                <button type="submit" className={styles.submitButton}>
                                    Assign Course
                                </button>
                                <button 
                                    type="button" 
                                    onClick={() => {
                                        setShowAssignForm(false);
                                        setNewAssignment({
                                            course_id: '',
                                            sections: []
                                        });
                                    }}
                                    className={styles.cancelButton}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {confirmDelete && (
                <div className={styles.confirmOverlay}>
                    <div className={styles.confirmDialog}>
                        <h4>Remove Course</h4>
                        <p>Are you sure you want to remove this course?</p>
                        <div className={styles.confirmActions}>
                            <button 
                                onClick={handleConfirmRemove}
                                className={styles.submitButton}
                            >
                                Remove
                            </button>
                            <button 
                                onClick={() => setConfirmDelete(null)}
                                className={styles.cancelButton}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}