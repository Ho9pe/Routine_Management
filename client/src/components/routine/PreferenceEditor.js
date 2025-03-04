'use client';
import { useState, useEffect } from 'react';

import { TIME_SLOTS, WORKING_DAYS } from '../../../../server/src/constants/timeSlots';
import styles from './PreferenceEditor.module.css';

// PreferenceEditor component to manage time preferences for a course
export default function PreferenceEditor({ courseAssignment }) {
    const [preferences, setPreferences] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        course_id: courseAssignment.course_id._id,
        day_of_week: '',
        preferred_time_slot: '',
        preference_level: 'LOW'
    });
    // Calculate required preferences based on sections
    const requiredPreferences = courseAssignment.sections.length;
    const currentPreferences = preferences.length;
    // Fetch preferences on course change
    useEffect(() => {
        fetchPreferences();
    }, [courseAssignment.course_id._id]);
    // Add message timeout cleanup
    useEffect(() => {
        let messageTimeout;
        if (error || success) {
            messageTimeout = setTimeout(() => {
                setError('');
                setSuccess('');
            }, 10000);
        }
        return () => {
            if (messageTimeout) clearTimeout(messageTimeout);
        };
    }, [error, success]);
    // Fetch preferences for the selected course
    const fetchPreferences = async () => {
        try {
            const response = await fetch('/api/preferences', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch preferences');
            }
            const data = await response.json();
            const coursePreferences = data.preferences.filter(p => 
                p.course_id?._id === courseAssignment.course_id._id
            );
            setPreferences(coursePreferences);
        } catch (error) {
            console.error('Error fetching preferences:', error);
            setError(error.message || 'Failed to fetch preferences');
        } finally {
            setLoading(false);
        }
    };
    // Handle form submission to save preference
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
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
            if (!response.ok) {
                throw new Error(data.message || 'Failed to save preference');
            }
            setSuccess('Preference saved successfully');
            await fetchPreferences();
            setShowForm(false);
            setFormData({
                course_id: courseAssignment.course_id._id,
                day_of_week: '',
                preferred_time_slot: '',
                preference_level: 'LOW'
            });
        } catch (error) {
            setError(error.message || 'Failed to save preference');
        }
    };
    // Handle delete preference
    const handleDelete = async (preferenceId) => {
        if (!confirm('Are you sure you want to delete this preference?')) return;
        try {
            const response = await fetch(`/api/preferences/${preferenceId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (response.ok) {
                setSuccess('Preference deleted successfully');
                fetchPreferences();
            } else {
                const data = await response.json();
                setError(data.message);
            }
        } catch (error) {
            setError('Failed to delete preference');
        }
    };
    // Render component
    if (loading) return <div className={styles.loading}>Loading...</div>;
    return (
        <div className={styles.preferenceEditor}>
            {(error || success) && (
                <div className={`${styles.message} ${error ? styles.error : styles.success}`}>
                    <div className={styles.messageContent}>
                        <span className={styles.messageIcon}>
                            {error ? '⚠️' : '✓'}
                        </span>
                        <p className={styles.messageText}>{error || success}</p>
                    </div>
                    <button 
                        onClick={() => error ? setError('') : setSuccess('')}
                        className={styles.dismissButton}
                        aria-label="Dismiss message"
                    >
                        ×
                    </button>
                </div>
            )}
            <div className={styles.header}>
                <div className={styles.headerInfo}>
                    <h3>Time Preferences</h3>
                    <div className={styles.preferenceCount}>
                        <span className={currentPreferences >= requiredPreferences ? styles.complete : styles.incomplete}>
                            {currentPreferences} / {requiredPreferences} required preferences set
                        </span>
                    </div>
                </div>
                <button 
                    onClick={() => setShowForm(!showForm)}
                    className={styles.addButton}
                >
                    {showForm ? 'Cancel' : 'Add Preference'}
                </button>
            </div>
            {showForm && (
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
                        <label>Preference Level</label>
                        <select
                            value={formData.preference_level}
                            onChange={(e) => setFormData({
                                ...formData,
                                preference_level: e.target.value
                            })}
                            required
                        >
                            <option value="HIGH">High</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="LOW">Low</option>
                            <option value="UNAVAILABLE">Unavailable</option>
                        </select>
                    </div>
                    <button type="submit" className={styles.submitButton}>
                        Save Preference
                    </button>
                </form>
            )}
            <div className={styles.preferenceList}>
                {preferences.length > 0 ? (
                    preferences.map(pref => (
                        <div key={pref._id} className={styles.preferenceCard}>
                            <div className={styles.preferenceInfo}>
                                <div className={styles.preferenceHeader}>
                                    <span className={styles.day}>{pref.day_of_week}</span>
                                    <span className={`${styles.level} ${styles[pref.preference_level.toLowerCase()]}`}>
                                        {pref.preference_level}
                                    </span>
                                </div>
                                <div className={styles.timeSlot}>
                                    {TIME_SLOTS.find(slot => slot.id === pref.preferred_time_slot)?.time}
                                </div>
                            </div>
                            <button
                                onClick={() => handleDelete(pref._id)}
                                className={styles.deleteButton}
                                title="Delete preference"
                            >
                                ×
                            </button>
                        </div>
                    ))
                ) : (
                    <div className={styles.noPreferences}>
                        No preferences set for this course
                    </div>
                )}
            </div>
        </div>
    );
}