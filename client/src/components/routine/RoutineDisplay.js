'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

import { useAuth } from '@/context/AuthContext';
import { TIME_SLOTS, WORKING_DAYS } from '../../../../server/src/constants/timeSlots';
import ErrorMessage from '../common/ErrorMessage';
import { semesterOptions, semesterToYear } from '@/lib/semesterMapping';
import styles from './RoutineDisplay.module.css';

// Display the routine for the selected semester and section
export default function RoutineDisplay({ selectedSection: initialSection, selectedSemester }) {
    const { user, updateUserData } = useAuth();
    const [schedule, setSchedule] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedSection, setSelectedSection] = useState(initialSection);
    const [studentInfo, setStudentInfo] = useState(null);
    const [isUpdatingSemester, setIsUpdatingSemester] = useState(false);
    const [newSemester, setNewSemester] = useState('');
    const [success, setSuccess] = useState('');
    // Fetch student info only once when component mounts
    useEffect(() => {
        if (user?.role === 'student') {
            fetchStudentInfo();
        }
    }, []);
    // Fetch schedule when dependencies change
    useEffect(() => {
        const fetchData = async () => {
            if (user?.role === 'student' && studentInfo?.semester) {
                await fetchSchedule();
            } else if (user?.role === 'teacher') {
                await fetchSchedule();
            } else if (selectedSection && selectedSemester) {
                await fetchSchedule();
            }
        };
        fetchData();
    }, [studentInfo?.semester, selectedSemester, selectedSection, user?.role]);
    // Fetch student info
    const fetchStudentInfo = async () => {
        try {
            const response = await fetch('/api/students/profile', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();
            if (response.ok) {
                setStudentInfo(data);
                updateUserData({ semester: data.semester });
                const rollLastThree = parseInt(data.student_roll.slice(-3));
                if (rollLastThree <= 60) setSelectedSection('A');
                else if (rollLastThree <= 120) setSelectedSection('B');
                else setSelectedSection('C');
            }
        } catch (error) {
            console.error('Error fetching student info:', error);
            setError('Failed to fetch student info');
        }
    };
    // Update semester
    const handleUpdateSemester = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/students/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    semester: parseInt(newSemester)
                })
            });
            const data = await response.json();
            if (response.ok) {
                setStudentInfo(prev => ({
                    ...prev,
                    semester: parseInt(newSemester)
                }));
                updateUserData({ semester: parseInt(newSemester) });
                setSuccess('Semester updated successfully');
                setIsUpdatingSemester(false);
                setNewSemester('');
                
                await fetchSchedule();
                
                setTimeout(() => setSuccess(''), 3000);
            } else {
                setError(data.message || 'Failed to update semester');
            }
        } catch (error) {
            setError('Failed to update semester');
        } finally {
            setLoading(false);
        }
    };
    // Fetch schedule
    const fetchSchedule = async () => {
        try {
            setLoading(true);
            console.log('Fetching schedule with params:', {
                semester: studentInfo?.semester || selectedSemester,
                section: selectedSection,
                role: user?.role
            });
            let url = '/api/schedule/student/routine';
            if (user?.role === 'teacher') {
                url = '/api/schedule/teacher/routine';
            } else if (selectedSection && selectedSemester) {
                url = `/api/schedule/admin/routine?semester=${selectedSemester}&section=${selectedSection}`;
            }
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                },
                // Force fetch new data
                cache: 'no-store'
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch schedule');
            }
            setSchedule(data);
            setError('');
        } catch (error) {
            console.error('Schedule fetch error:', error);
            setError(error.message || 'Failed to fetch schedule');
        } finally {
            setLoading(false);
        }
    };
    // Get class session for a given time slot and day
    const getClassForSlot = (timeSlot, day) => {
        const classSession = schedule.find(s => 
            s.time_slot === timeSlot && 
            s.day_of_week === day
        );
        if (classSession) {
            console.log('Found class session:', {
                timeSlot,
                day,
                course: classSession.course_id.course_code,
                section: classSession.section
            });
        }
        return classSession;
    };
    // Render header cells
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
    // Render row cells
    const renderRowCells = (day) => {
        let cells = [];
        TIME_SLOTS.forEach(slot => {
            const classSession = getClassForSlot(slot.id, day);
            const cellContent = classSession ? (
                <div className={`${styles.classBlock} ${styles[classSession.course_id.course_type]}`}>
                    <div className={styles.courseCode}>
                        {classSession.course_id.course_code}
                    </div>
                    <div className={styles.courseDetails}>
                        <div className={styles.courseName}>
                            {classSession.course_id.course_name}
                        </div>
                        {classSession.teacher_id && (
                            <div className={styles.teacherInfo}>
                                {classSession.teacher_id.full_name}
                            </div>
                        )}
                        {(user?.role === 'teacher' || user?.role === 'admin') && classSession.section && (
                            <div className={styles.sectionInfo}>
                                <div>Section: {classSession.section}</div>
                            </div>
                        )}
                    </div>
                </div>
            ) : null;
            cells.push(
                <td key={`cell-${day}-${slot.id}`} className={styles.scheduleCell}>
                    {cellContent}
                </td>
            );
            if (slot.id === '3' || slot.id === '6') {
                cells.push(
                    <td key={`break-${day}-${slot.id}`} className={styles.breakCell}></td>
                );
            }
        });
        return cells;
    };
    if (loading && user?.role === 'student' && studentInfo?.semester) {
        return <div className={styles.loading}>Loading...</div>;
    }
    if (loading && user?.role === 'student' && !studentInfo?.semester) {
        return (
            <div className={styles.noSemesterContainer}>
                <div className={styles.noSemesterContent}>
                    <div className={styles.warningIcon}>⚠️</div>
                    <h3>Semester Not Set</h3>
                    <p>Please set your semester in your dashboard before viewing the routine.</p>
                    <Link href="/student/dashboard" className={styles.setupButton}>
                        Go to Dashboard
                    </Link>
                </div>
            </div>
        );
    }
    // Render routine
    return (
        <div className={styles.routineContainer}>
            {error && (
                <ErrorMessage 
                    message={error}
                    onDismiss={() => setError('')}
                />
            )}
            {success && (
                <div className={styles.successMessage}>
                    {success}
                </div>
            )}
            {user?.role === 'student' && studentInfo && (
                <div className={styles.studentInfo}>
                    <div className={styles.semesterInfo}>
                        {isUpdatingSemester ? (
                            <div className={styles.semesterUpdate}>
                                <select
                                    value={newSemester}
                                    onChange={(e) => setNewSemester(e.target.value)}
                                    className={styles.semesterSelect}
                                >
                                    <option value="">Select Semester</option>
                                    {semesterOptions.map(option => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                                <div className={styles.updateButtons}>
                                    <button 
                                        onClick={handleUpdateSemester}
                                        className={styles.updateButton}
                                        disabled={!newSemester}
                                    >
                                        Update
                                    </button>
                                    <button 
                                        onClick={() => {
                                            setIsUpdatingSemester(false);
                                            setNewSemester('');
                                        }}
                                        className={styles.cancelButton}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className={styles.currentSemester}>
                                <p>Current Semester: {semesterToYear(studentInfo.semester)}</p>
                                <button 
                                    onClick={() => {
                                        setIsUpdatingSemester(true);
                                        setNewSemester(studentInfo.semester.toString());
                                    }}
                                    className={styles.editButton}
                                >
                                    Change Semester
                                </button>
                            </div>
                        )}
                    </div>
                    <p>Section: {selectedSection}</p>
                </div>
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