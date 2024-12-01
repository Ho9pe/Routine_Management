'use client';
import { useState, useEffect } from 'react';
import styles from './TeacherProfile.module.css';

export default function TeacherProfile() {
    const [profile, setProfile] = useState({
        full_name: '',
        academic_rank: '',
        department: '',
        contact_info: {
            phone: '',
            office: '',
            email: ''
        }
    });
    const [isEditing, setIsEditing] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await fetch('/api/teachers/profile', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();
            if (response.ok) {
                setProfile(data);
            } else {
                setError(data.message);
            }
        } catch (error) {
            setError('Failed to fetch profile');
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('/api/teachers/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(profile)
            });
            const data = await response.json();
            if (response.ok) {
                setProfile(data);
                setIsEditing(false);
            } else {
                setError(data.message);
            }
        } catch (error) {
            setError('Failed to update profile');
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setProfile(prev => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: value
                }
            }));
        } else {
            setProfile(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    return (
        <div className={styles.profile}>
            <h2>Teacher Profile</h2>
            {error && <div className={styles.error}>{error}</div>}
            
            <form onSubmit={handleUpdate} className={styles.form}>
                <div className={styles.formGroup}>
                    <label>Full Name</label>
                    <input
                        type="text"
                        name="full_name"
                        value={profile.full_name}
                        onChange={handleChange}
                        disabled={!isEditing}
                    />
                </div>

                <div className={styles.formGroup}>
                    <label>Academic Rank</label>
                    <select
                        name="academic_rank"
                        value={profile.academic_rank}
                        onChange={handleChange}
                        disabled={!isEditing}
                    >
                        <option value="">Select Rank</option>
                        <option value="Professor">Professor</option>
                        <option value="Associate Professor">Associate Professor</option>
                        <option value="Assistant Professor">Assistant Professor</option>
                        <option value="Lecturer">Lecturer</option>
                    </select>
                </div>

                <div className={styles.formGroup}>
                    <label>Department</label>
                    <input
                        type="text"
                        name="department"
                        value={profile.department}
                        onChange={handleChange}
                        disabled={!isEditing}
                    />
                </div>

                <div className={styles.contactInfo}>
                    <h3>Contact Information</h3>
                    <div className={styles.formGroup}>
                        <label>Phone</label>
                        <input
                            type="tel"
                            name="contact_info.phone"
                            value={profile.contact_info.phone}
                            onChange={handleChange}
                            disabled={!isEditing}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Office</label>
                        <input
                            type="text"
                            name="contact_info.office"
                            value={profile.contact_info.office}
                            onChange={handleChange}
                            disabled={!isEditing}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Email</label>
                        <input
                            type="email"
                            name="contact_info.email"
                            value={profile.contact_info.email}
                            onChange={handleChange}
                            disabled={!isEditing}
                        />
                    </div>
                </div>

                <div className={styles.actions}>
                    {isEditing ? (
                        <>
                            <button type="submit" className={styles.saveBtn}>Save</button>
                            <button 
                                type="button" 
                                onClick={() => setIsEditing(false)}
                                className={styles.cancelBtn}
                            >
                                Cancel
                            </button>
                        </>
                    ) : (
                        <button 
                            type="button" 
                            onClick={() => setIsEditing(true)}
                            className={styles.editBtn}
                        >
                            Edit Profile
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}