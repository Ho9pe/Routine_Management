'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import styles from './CourseManagement.module.css';
import ErrorMessage from './ErrorMessage';
import { semesterToYear } from '@/utils/semesterMapping';

export default function CourseManagement() {
    const { user } = useAuth();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [studentProfile, setStudentProfile] = useState(null);

    useEffect(() => {
        fetchStudentProfile();
        fetchCourses();
    }, []);

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

    // Filter courses based on student's semester
    const filteredCourses = courses.filter(course => {
        if (!studentProfile?.semester) return true; // Show all courses if no semester is set
        return course.semester === studentProfile.semester;
    });

    if (loading) return <div className={styles.loading}>Loading...</div>;

    return (
        <div className={styles.courseManagement}>
            <div className={styles.header}>
                <h2>My Courses</h2>
                {studentProfile?.semester && (
                    <div className={styles.semesterBadge}>
                        Semester: {semesterToYear(studentProfile.semester)}
                    </div>
                )}
            </div>

            {error && (
                <ErrorMessage 
                    message={error}
                    onDismiss={() => setError('')}
                    duration={5000}
                />
            )}

            {filteredCourses.length > 0 ? (
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
            )}
        </div>
    );
}