'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './TeacherDashboardCourses.module.css';

export default function TeacherDashboardCourses() {
    const [assignedCourses, setAssignedCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchAssignedCourses();
    }, []);

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
            console.error('Error fetching courses:', error);
            setError('Failed to fetch assigned courses');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className={styles.loading}>Loading...</div>;
    if (error) return <div className={styles.error}>{error}</div>;

    return (
        <div className={styles.dashboardCourses}>
            <div className={styles.header}>
                <div>
                    <h3>Assigned Courses</h3>
                    <p className={styles.courseCount}>
                        Total Courses: {assignedCourses.length}
                    </p>
                </div>
                <Link href="/teacher/courses" className={styles.viewAllButton}>
                    View All Courses
                </Link>
            </div>

            <div className={styles.courseList}>
                {assignedCourses.length > 0 ? (
                    assignedCourses.map(assignment => (
                        <div key={assignment._id} className={styles.courseItem}>
                            <div className={styles.courseCode}>
                                {assignment.course_id?.course_code || 'N/A'}
                            </div>
                            <div className={styles.courseDetails}>
                                <p>{assignment.course_id?.course_name || 'N/A'}</p>
                                <p>Credit Hours: {assignment.course_id?.credit_hours}</p>
                                <p>Contact Hours: {assignment.course_id?.contact_hours}</p>
                                <p>Type: {assignment.course_id?.course_type}</p>
                                <p>Sections: {assignment.sections.join(', ')}</p>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className={styles.noCourses}>
                        No courses assigned yet
                    </div>
                )}
            </div>
        </div>
    );
}