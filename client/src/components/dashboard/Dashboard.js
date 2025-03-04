'use client';
import { useState, useEffect } from 'react';

import { useAuth } from '@/context/AuthContext';
import ErrorMessage from '../common/ErrorMessage';
import { semesterToYear, semesterOptions } from '@/lib/semesterMapping';
import TeacherDashboardCourses from './TeacherDashboardCourses';
import styles from './Dashboard.module.css';

// Dashboard component
export default function Dashboard() {
    const { user } = useAuth();
    const [profileData, setProfileData] = useState(null);
    const [editFormData, setEditFormData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [isResettingPassword, setIsResettingPassword] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    // Fetch profile data on initial render
    useEffect(() => {
        if (user) {
            fetchProfileData();
        }
    }, [user]);
    // Fetch profile data based on user role
    const fetchProfileData = async () => {
        try {
            const endpoint = user?.role === 'teacher' 
                ? '/api/teachers/profile'
                : `/api/students/profile`;
            const response = await fetch(endpoint, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();
            if (response.ok) {
                // Transform teacher data to ensure contact_info exists
                if (user?.role === 'teacher') {
                    setProfileData({
                        ...data,
                        contact_info: {
                            email: data.contact_info?.email || '',
                            phone: data.contact_info?.phone || '',
                            office: data.contact_info?.office || ''
                        }
                    });
                } else {
                    setProfileData(data);
                }
            } else {
                setError(data.message || 'Failed to fetch profile data');
            }
        } catch (error) {
            setError('Failed to fetch profile data');
        } finally {
            setLoading(false);
        }
    };
    // Handle edit profile button click
    const handleStartEdit = () => {
        setEditFormData({ ...profileData });
        setIsEditing(true);
    };
    // Handle cancel button click
    const handleCancel = () => {
        setEditFormData(null);
        setIsEditing(false);
        setIsResettingPassword(false);
        setNewPassword('');
        setConfirmPassword('');
    };
    // Handle form input change
    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setEditFormData(prev => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: value
                }
            }));
        } else {
            setEditFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };
    // Handle password reset form submission
    const handlePasswordReset = async (e) => {
        e.preventDefault();
        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters long');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        try {
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ newPassword })
            });    
            const data = await response.json();
            if (response.ok) {
                setError('');
                setIsResettingPassword(false);
                setNewPassword('');
                setConfirmPassword('');
                alert('Password updated successfully!');
            } else {
                setError(data.message || 'Failed to reset password');
            }
        } catch (error) {
            setError('Failed to reset password. Please try again.');
        }
    };
    // Handle profile update form submission
    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const endpoint = user?.role === 'teacher' 
                ? '/api/teachers/profile'
                : `/api/students/profile`;
            // Transform data based on user role
            const updateData = user?.role === 'teacher' 
                ? {
                    ...editFormData,
                    contact_info: {
                        email: editFormData.contact_info?.email || '',
                        phone: editFormData.contact_info?.phone || '',
                        office: editFormData.contact_info?.office || ''
                    }
                }
                : editFormData;
            const response = await fetch(endpoint, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(updateData)
            });
            const data = await response.json();
            if (response.ok) {
                // Transform teacher data to ensure contact_info exists
                if (user?.role === 'teacher') {
                    setProfileData({
                        ...data,
                        contact_info: {
                            email: data.contact_info?.email || '',
                            phone: data.contact_info?.phone || '',
                            office: data.contact_info?.office || ''
                        }
                    });
                } else {
                    setProfileData(data);
                }
                setEditFormData(null);
                setIsEditing(false);
            } else {
                setError(data.message);
            }
        } catch (error) {
            setError('Failed to update profile');
        }
    };
    // Render teacher edit form
    const renderTeacherEditForm = () => (
        <>
            <div className={styles.formGroup}>
                <label>Full Name</label>
                <input
                    type="text"
                    name="full_name"
                    value={editFormData?.full_name || ''}
                    onChange={handleChange}
                    required
                />
            </div>
            <div className={styles.formGroup}>
                <label>Email</label>
                <input
                    type="email"
                    name="contact_info.email"
                    value={editFormData?.contact_info?.email || ''}
                    onChange={handleChange}
                    required
                />
            </div>
            <div className={styles.formGroup}>
                <label>Department</label>
                <input
                    type="text"
                    name="department"
                    value={editFormData?.department || ''}
                    onChange={handleChange}
                    required
                />
            </div>
            <div className={styles.formGroup}>
                <label>Academic Rank</label>
                <select
                    name="academic_rank"
                    value={editFormData?.academic_rank || ''}
                    onChange={handleChange}
                    required
                >
                    <option value="">Select Rank</option>
                    <option value="Professor">Professor</option>
                    <option value="Associate Professor">Associate Professor</option>
                    <option value="Assistant Professor">Assistant Professor</option>
                    <option value="Lecturer">Lecturer</option>
                </select>
            </div>
            <div className={styles.formGroup}>
                <label>Phone</label>
                <input
                    type="tel"
                    name="contact_info.phone"
                    value={editFormData?.contact_info?.phone || ''}
                    onChange={handleChange}
                />
            </div>
            <div className={styles.formGroup}>
                <label>Office</label>
                <input
                    type="text"
                    name="contact_info.office"
                    value={editFormData?.contact_info?.office || ''}
                    onChange={handleChange}
                />
            </div>
        </>
    );
    // Render teacher profile
    const renderTeacherProfile = () => {
        if(!profileData) return null;
        return (
            <>
                <p><strong>Full Name:</strong> {profileData.full_name}</p>
                <p><strong>Email:</strong> {profileData.contact_info?.email}</p>
                <p><strong>Department:</strong> {profileData.department}</p>
                <p><strong>Academic Rank:</strong> {profileData.academic_rank}</p>
                <p><strong>Teacher ID:</strong> {profileData.teacher_id}</p>
                <div className={styles.contactInfo}>
                <h4>Contact Information</h4>
                <p><strong>Phone:</strong> {profileData.contact_info?.phone || 'Not provided'}</p>
                <p><strong>Office:</strong> {profileData.contact_info?.office || 'Not provided'}</p>
                </div>
            </>
        );
    };
    // Render student edit form
    const renderStudentEditForm = () => (
        <>
            <div className={styles.formGroup}>
                <label>Full Name</label>
                <input
                    type="text"
                    name="full_name"
                    value={editFormData?.full_name || ''}
                    onChange={handleChange}
                    required
                />
            </div>
            <div className={styles.formGroup}>
                <label>Email</label>
                <input
                    type="email"
                    name="email"
                    value={editFormData?.email || ''}
                    onChange={handleChange}
                    required
                />
            </div>
            <div className={styles.formGroup}>
                <label>Department</label>
                <input
                    type="text"
                    name="department"
                    value={editFormData?.department || ''}
                    onChange={handleChange}
                    required
                />
            </div>
            <div className={styles.formGroup}>
                <label>Student Roll</label>
                <input
                    type="text"
                    name="student_roll"
                    value={editFormData?.student_roll || ''}
                    onChange={handleChange}
                    required
                />
            </div>
            <div className={styles.formGroup}>
                <label>Semester</label>
                <select
                    name="semester"
                    value={editFormData?.semester || ''}
                    onChange={handleChange}
                    required
                >
                    <option value="">Select Semester</option>
                    {semesterOptions.map(option => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </div>
        </>
    );
    // Render student profile
    const renderStudentProfile = () => {
        if(!profileData) return null;
        return (
            <>
                <p><strong>Full Name:</strong> {profileData.full_name}</p>
                <p><strong>Email:</strong> {profileData.email}</p>
                <p><strong>Department:</strong> {profileData.department}</p>
                <p><strong>Student Roll:</strong> {profileData.student_roll}</p>
                <p><strong>Semester:</strong> {semesterToYear(profileData.semester)}</p>
                {profileData?.batch && (
                    <p><strong>Batch:</strong> {profileData.batch}</p>
                )}
            </>
        );
    };
    if (loading) return <div className={styles.loading}>Loading...</div>;
    // Render dashboard
    return (
        <div className={styles.dashboard}>
            <h2 className={styles.title}>
                {user?.role === 'teacher' ? 'Teacher' : 'Student'} Dashboard
            </h2>
            {error && (
                <ErrorMessage 
                    message={error}
                    onDismiss={() => setError('')}
                    duration={10000}
                />
            )}
            <div className={styles.profileCard}>
                <h3 className={styles.subtitle}>Profile Information</h3>
                {isEditing ? (
                    <form onSubmit={handleUpdate} className={styles.form}>
                        {user?.role === 'teacher' ? renderTeacherEditForm() : renderStudentEditForm()}
                        <div className={styles.buttonGroup}>
                            <button type="submit" className={styles.saveButton}>
                                Save Changes
                            </button>
                            <button 
                                type="button" 
                                onClick={handleCancel}
                                className={styles.cancelButton}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className={styles.profileInfo}>
                        {user?.role === 'teacher' ? renderTeacherProfile() : renderStudentProfile()}
                        <div className={styles.actionButtons}>
                            <button 
                                onClick={handleStartEdit}
                                className={styles.editButton}
                            >
                                Edit Profile
                            </button>
                            <button 
                                onClick={() => setIsResettingPassword(true)}
                                className={styles.resetPasswordButton}
                            >
                                Reset Password
                            </button>
                        </div>
                    </div>
                )}
                {isResettingPassword && (
                    <form onSubmit={handlePasswordReset} className={styles.passwordResetForm}>
                        <div className={styles.formGroup}>
                            <label>New Password</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                minLength={6}
                                placeholder="Enter new password"
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Confirm Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                minLength={6}
                                placeholder="Confirm new password"
                            />
                        </div>
                        <div className={styles.buttonGroup}>
                            <button type="submit" className={styles.saveButton}>
                                Update Password
                            </button>
                            <button 
                                type="button" 
                                onClick={handleCancel}
                                className={styles.cancelButton}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                )}
            </div>
            {user?.role === 'teacher' && <TeacherDashboardCourses />}
        </div>
    );
}