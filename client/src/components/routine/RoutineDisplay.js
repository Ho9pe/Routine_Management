'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { TIME_SLOTS, WORKING_DAYS } from '../../../../server/src/constants/timeSlots';
import styles from './RoutineDisplay.module.css';
import ErrorMessage from '../common/ErrorMessage';

export default function RoutineDisplay({ selectedSection: initialSection, selectedSemester }) {
    const { user } = useAuth();
    const [schedule, setSchedule] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedSection, setSelectedSection] = useState(initialSection);

    useEffect(() => {
        if (user?.role === 'student') {
            // Determine student's section from roll number
            const rollLastThree = parseInt(user.student_roll.slice(-3));
            if (rollLastThree <= 60) setSelectedSection('A');
            else if (rollLastThree <= 120) setSelectedSection('B');
            else setSelectedSection('C');
        }
        fetchSchedule();
    }, [selectedSection, selectedSemester, user]);

    const fetchSchedule = async () => {
        try {
            let url = '/api/schedule/';
            if (user?.role === 'admin') {
                if (!selectedSection || !selectedSemester) return;
                url += `admin/routine?section=${selectedSection}&semester=${selectedSemester}`;
            } else if (user?.role === 'student') {
                url += 'student/routine';
            } else {
                url += 'teacher/routine';
            }

            // Debug logging
            console.log('Fetching schedule with:', {
                url,
                user: {
                    role: user?.role,
                    id: user?.id,
                    student_roll: user?.student_roll,
                    semester: user?.semester
                },
                token: localStorage.getItem('token')?.substring(0, 20) + '...' // Show first 20 chars of token
            });

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch schedule');
            }

            console.log('Schedule data received:', data);
            setSchedule(data);
            setError('');
        } catch (error) {
            console.error('Schedule fetch error:', error);
            setError(error.message || 'Failed to fetch schedule');
        } finally {
            setLoading(false);
        }
    };

    const getClassForSlot = (timeSlot, day) => {
        return schedule.find(s => 
            s.time_slot === timeSlot && 
            s.day_of_week === day
        );
    };

    const renderHeaderCells = () => {
        let cells = [];
        
        TIME_SLOTS.forEach(slot => {
            if (slot.id === '3' || slot.id === '6') {
                cells.push(
                    <th key={`period-${slot.id}`} className={styles.timeHeader}>
                        <div className={styles.periodInfo}>
                            <div className={styles.periodNumber}>{slot.period}</div>
                            <div className={styles.periodTime}>{slot.time}</div>
                        </div>
                    </th>
                );
                cells.push(
                    <th key={`break-${slot.id}`} className={styles.breakHeader}>
                        <div className={styles.breakInfo}>
                            Break
                        </div>
                    </th>
                );
            } else {
                cells.push(
                    <th key={`period-${slot.id}`} className={styles.timeHeader}>
                        <div className={styles.periodInfo}>
                            <div className={styles.periodNumber}>{slot.period}</div>
                            <div className={styles.periodTime}>{slot.time}</div>
                        </div>
                    </th>
                );
            }
        });
        
        return cells;
    };

    const renderRowCells = (day) => {
        let cells = [];
        
        TIME_SLOTS.forEach(slot => {
            if (slot.id === '3' || slot.id === '6') {
                const classSession = getClassForSlot(slot.id, day);
                cells.push(
                    <td key={`cell-${day}-${slot.id}`} className={styles.scheduleCell}>
                        {classSession && (
                            <div className={`${styles.classBlock} ${styles[classSession.course_id.course_type]}`}>
                                <div className={styles.courseCode}>
                                    {classSession.course_id.course_code}
                                </div>
                                <div className={styles.courseDetails}>
                                    <div className={styles.courseName}>
                                        {classSession.course_id.course_name}
                                    </div>
                                    <div className={styles.teacherName}>
                                        {classSession.teacher_id.full_name}
                                    </div>
                                </div>
                            </div>
                        )}
                    </td>
                );
                cells.push(
                    <td key={`break-${day}-${slot.id}`} className={styles.breakCell}></td>
                );
            } else {
                const classSession = getClassForSlot(slot.id, day);
                cells.push(
                    <td key={`cell-${day}-${slot.id}`} className={styles.scheduleCell}>
                        {classSession && (
                            <div className={`${styles.classBlock} ${styles[classSession.course_id.course_type]}`}>
                                <div className={styles.courseCode}>
                                    {classSession.course_id.course_code}
                                </div>
                                <div className={styles.courseDetails}>
                                    <div className={styles.courseName}>
                                        {classSession.course_id.course_name}
                                    </div>
                                    <div className={styles.teacherName}>
                                        {classSession.teacher_id.full_name}
                                    </div>
                                </div>
                            </div>
                        )}
                    </td>
                );
            }
        });
        
        return cells;
    };

    if (loading) {
        return <div className={styles.loading}>Loading...</div>;
    }

    return (
        <div className={styles.routineContainer}>
            {error && (
                <ErrorMessage 
                    message={error}
                    onDismiss={() => setError('')}
                />
            )}

            <div className={styles.tableWrapper}>
                <table className={styles.routineTable}>
                    <thead>
                        <tr>
                            <th className={styles.dayHeader}>Day</th>
                            {renderHeaderCells()}
                        </tr>
                    </thead>
                    <tbody>
                        {WORKING_DAYS.map(day => (
                            <tr key={day}>
                                <td className={styles.dayCell}>{day}</td>
                                {renderRowCells(day)}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}