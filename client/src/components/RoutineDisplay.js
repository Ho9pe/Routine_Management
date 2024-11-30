'use client';
import { useState, useEffect } from 'react';
import { TIME_SLOTS, WORKING_DAYS } from '../../../server/constants/timeSlots';
import styles from './RoutineDisplay.module.css';

export default function RoutineDisplay() {
    const [schedule, setSchedule] = useState([]);
    const [filters, setFilters] = useState({
        day: '',
        course: '',
        teacher: ''
    });
    const [courses, setCourses] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchSchedule();
        fetchCourses();
        fetchTeachers();
    }, [filters]);

    const fetchSchedule = async () => {
        try {
            const queryParams = new URLSearchParams(filters).toString();
            const response = await fetch(`/api/schedule?${queryParams}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();
            if (response.ok) {
                setSchedule(data);
            } else {
                setError(data.message);
            }
        } catch (error) {
            setError('Failed to fetch schedule');
        } finally {
            setLoading(false);
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
            }
        } catch (error) {
            setError('Failed to fetch courses');
        }
    };

    const fetchTeachers = async () => {
        try {
            const response = await fetch('/api/teachers', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();
            if (response.ok) {
                setTeachers(data);
            }
        } catch (error) {
            setError('Failed to fetch teachers');
        }
    };

    const handleFilterChange = (name, value) => {
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
    };

    if (loading) return <div className={styles.loading}>Loading...</div>;

    return (
        <div className={styles.routineDisplay}>
            <h2>Class Routine</h2>
            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.filters}>
                <div className={styles.filterGroup}>
                    <label>Day</label>
                    <select
                        value={filters.day}
                        onChange={(e) => handleFilterChange('day', e.target.value)}
                    >
                        <option value="">All Days</option>
                        {WORKING_DAYS.map(day => (
                            <option key={day} value={day}>{day}</option>
                        ))}
                    </select>
                </div>

                <div className={styles.filterGroup}>
                    <label>Course</label>
                    <select
                        value={filters.course}
                        onChange={(e) => handleFilterChange('course', e.target.value)}
                    >
                        <option value="">All Courses</option>
                        {courses.map(course => (
                            <option key={course._id} value={course._id}>
                                {course.course_code}
                            </option>
                        ))}
                    </select>
                </div>

                <div className={styles.filterGroup}>
                    <label>Teacher</label>
                    <select
                        value={filters.teacher}
                        onChange={(e) => handleFilterChange('teacher', e.target.value)}
                    >
                        <option value="">All Teachers</option>
                        {teachers.map(teacher => (
                            <option key={teacher._id} value={teacher._id}>
                                {teacher.full_name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className={styles.routineGrid}>
                <div className={styles.timeColumn}>
                    <div className={styles.headerCell}>Time</div>
                    {TIME_SLOTS.map(slot => (
                        <div key={slot.id} className={styles.timeCell}>
                            {slot.time}
                        </div>
                    ))}
                </div>

                {WORKING_DAYS.map(day => (
                    <div key={day} className={styles.dayColumn}>
                        <div className={styles.headerCell}>{day}</div>
                        {TIME_SLOTS.map(slot => {
                            const classSession = schedule.find(s => 
                                s.day_of_week === day && 
                                s.time_slot === slot.id
                            );

                            return (
                                <div key={slot.id} className={styles.scheduleCell}>
                                    {classSession && (
                                        <>
                                            <div className={styles.courseCode}>
                                                {classSession.course_id.course_code}
                                            </div>
                                            <div className={styles.room}>
                                                Room: {classSession.room_number}
                                            </div>
                                            <div className={styles.teacher}>
                                                {classSession.teacher_id.full_name}
                                            </div>
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
}