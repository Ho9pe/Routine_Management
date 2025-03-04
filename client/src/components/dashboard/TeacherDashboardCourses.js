'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

import styles from './TeacherDashboardCourses.module.css';

// TeacherDashboardCourses component
export default function TeacherDashboardCourses() {
    const [assignedCourses, setAssignedCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    // Fetch assigned courses on component mount
    useEffect(() => {
        fetchAssignedCourses();
    }, []);
    // Fetch assigned courses from the server
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
            setAssignedCourses(data.assignments || []);
        } catch (error) {
            console.error('Error fetching courses:', error);
            setError('Failed to fetch assigned courses');
        } finally {
            setLoading(false);
        }
    };
    // Group assignments by course
    const groupAssignmentsByCourse = (assignments) => {
        if (!Array.isArray(assignments)) {
            return [];
        }
        return assignments.reduce((acc, curr) => {
            const existingCourse = acc.find(item => 
                item.course_id._id === curr.course_id._id
            );
            if (existingCourse) {
                existingCourse.sections = [...new Set([
                    ...existingCourse.sections,
                    ...curr.sections
                ])].sort();
            } else {
                acc.push({
                    ...curr,
                    sections: [...curr.sections]
                });
            }
            return acc;
        }, []);
    };
    // Render component
    if (loading) return <div className={styles.loading}>Loading...</div>;
    if (error) return <div className={styles.error}>{error}</div>;
    const groupedAssignments = groupAssignmentsByCourse(assignedCourses);
    // Render component
    return (
        <div className={styles.dashboardCourses}>
            <div className={styles.header}>
                <div>
                    <h3>Assigned Courses</h3>
                    <p className={styles.courseCount}>
                        Total Courses: {groupedAssignments.length}
                    </p>
                </div>
                <Link href="/teacher/courses" className={styles.viewAllButton}>
                    View All Courses
                </Link>
            </div>
            <div className={styles.courseList}>
                {groupedAssignments.length > 0 ? (
                    groupedAssignments.map(assignment => (
                        <div key={assignment._id} className={styles.courseItem}>
                            <div className={styles.courseCode}>
                                {assignment.course_id?.course_code || 'N/A'}
                            </div>
                            <div className={styles.courseDetails}>
                                <p className={styles.courseName}>
                                    {assignment.course_id?.course_name || 'N/A'}
                                </p>
                                <div className={styles.courseInfo}>
                                    <p>Credit Hours: {assignment.course_id?.credit_hours}</p>
                                    <p>Contact Hours: {assignment.course_id?.contact_hours}</p>
                                    <p>Type: <span className={`${styles.courseType} ${styles[assignment.course_id?.course_type]}`}>
                                        {assignment.course_id?.course_type}
                                    </span></p>
                                    <p>Sections: {assignment.sections.join(', ')}</p>
                                </div>
                                <div className={styles.departmentBadge}>
                                    {assignment.course_id?.department}
                                </div>
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