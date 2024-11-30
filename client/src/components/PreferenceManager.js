'use client';
import { useState, useEffect } from 'react';
import { TIME_SLOTS, WORKING_DAYS } from '../../../server/constants/timeSlots';
import styles from './PreferenceManager.module.css';

export default function PreferenceManager() {
    const [preferences, setPreferences] = useState([]);
    const [courses, setCourses] = useState([]);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        day_of_week: '',
        preferred_time_slot: '',
        course_id: ''
    });

    useEffect(() => {
        fetchPreferences();
        fetchCourses();
    }, []);

    const fetchPreferences = async () => {
        try {
            const response = await fetch('/api/preferences', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();
            if (response.ok) {
                setPreferences(data);
            } else {
                setError(data.message);
            }
        } catch (error) {
            setError('Failed to fetch preferences');
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('/api/preferences', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(formData)
            });
            const data = await response.json();
            if (response.ok) {
                fetchPreferences();
                setFormData({
                    day_of_week: '',
                    preferred_time_slot: '',
                    course_id: ''
                });
            } else {
                setError(data.message);
            }
        } catch (error) {
            setError('Failed to save preference');
        }
    };

    const handleDelete = async (preferenceId) => {
        try {
            const response = await fetch(`/api/preferences/${preferenceId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (response.ok) {
                fetchPreferences();
            }
        } catch (error) {
            setError('Failed to delete preference');
        }
    };

    return (
        <div className={styles.preferenceManager}>
            <h2>Schedule Preferences</h2>
            {error && <div className={styles.error}>{error}</div>}

            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formGroup}>
                    <label>Day</label>
                    <select
                        value={formData.day_of_week}
                        onChange={(e) => setFormData({
                            ...formData,
                            day_of_week: e.target.value
                        })}
                        required
                    >
                        <option value="">Select Day</option>
                        {WORKING_DAYS.map(day => (
                            <option key={day} value={day}>{day}</option>
                        ))}
                    </select>
                </div>

                <div className={styles.formGroup}>
                    <label>Time Slot</label>
                    <select
                        value={formData.preferred_time_slot}
                        onChange={(e) => setFormData({
                            ...formData,
                            preferred_time_slot: e.target.value
                        })}
                        required
                    >
                        <option value="">Select Time Slot</option>
                        {TIME_SLOTS.map(slot => (
                            <option key={slot.id} value={slot.id}>
                                {slot.time} ({slot.period})
                            </option>
                        ))}
                    </select>
                </div>

                <div className={styles.formGroup}>
                    <label>Course</label>
                    <select
                        value={formData.course_id}
                        onChange={(e) => setFormData({
                            ...formData,
                            course_id: e.target.value
                        })}
                        required
                    >
                        <option value="">Select Course</option>
                        {courses.map(course => (
                            <option key={course._id} value={course._id}>
                                {course.course_code} - {course.course_name}
                            </option>
                        ))}
                    </select>
                </div>

                <button type="submit" className={styles.submitBtn}>
                    Add Preference
                </button>
            </form>

            <div className={styles.preferenceList}>
                <h3>Current Preferences</h3>
                <div className={styles.preferences}>
                    {preferences.map(pref => (
                        <div key={pref._id} className={styles.preferenceCard}>
                            <div className={styles.preferenceInfo}>
                                <p><strong>Day:</strong> {pref.day_of_week}</p>
                                <p><strong>Time:</strong> {
                                    TIME_SLOTS.find(slot => slot.id === pref.preferred_time_slot)?.time
                                }</p>
                                <p><strong>Course:</strong> {pref.course_id.course_code}</p>
                            </div>
                            <button
                                onClick={() => handleDelete(pref._id)}
                                className={styles.deleteBtn}
                            >
                                Remove
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}