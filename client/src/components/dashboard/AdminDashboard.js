'use client';
import { useState, useEffect } from 'react';

import { useAuth } from '@/context/AuthContext';
import styles from './AdminDashboard.module.css';
import ErrorMessage from '../common/ErrorMessage';

// AdminDashboard component
export default function AdminDashboard() {
    const { user } = useAuth();
    const [profileData, setProfileData] = useState(null);
    const [editFormData, setEditFormData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [isResettingPassword, setIsResettingPassword] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    // Fetch admin profile data on component mount
    useEffect(() => {
        if (user) {
            fetchAdminProfile();
        }
    }, [user]);
    // Fetch admin profile data
    const fetchAdminProfile = async () => {
        try {
            const response = await fetch('/api/admin/profile', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();
            if (response.ok) {
                setProfileData(data);
            } else {
                setError(data.message || 'Failed to fetch profile data');
            }
        } catch (error) {
            setError('Failed to fetch profile data');
        } finally {
            setLoading(false);
        }
    };
    // Handle edit profile
    const handleStartEdit = () => {
        setEditFormData({ ...profileData });
        setIsEditing(true);
    };
    // Handle cancel edit
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
    // Handle password reset
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
    // Handle profile update
    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('/api/admin/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(editFormData)
            });
            const data = await response.json();
            if (response.ok) {
                setProfileData(data);
                setEditFormData(null);
                setIsEditing(false);
            } else {
                setError(data.message);
            }
        } catch (error) {
            setError('Failed to update profile');
        }
    };
    if (loading) 
        return <div className={styles.loading}>Loading...</div>;
    // Render admin dashboard
    return (
        <div className={styles.dashboard}>
            <h2 className={styles.title}>Admin Dashboard</h2>
            {error && (
                <ErrorMessage 
                    message={error}
                    onDismiss={() => setError('')}
                    duration={10000}
                />
            )}
            <div className={styles.profileCard}>
                <h3 className={styles.subtitle}>Admin Profile</h3>
                {isEditing ? (
                    <form onSubmit={handleUpdate} className={styles.form}>
                        <div className={styles.formGroup}>
                            <label>Name</label>
                            <input
                                type="text"
                                name="name"
                                value={editFormData?.name || ''}
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
                        <p><strong>Admin ID:</strong> {profileData?.admin_id}</p>
                        <p><strong>Name:</strong> {profileData?.name}</p>
                        <p><strong>Email:</strong> {profileData?.email}</p>
                        <p><strong>Role:</strong> {profileData?.role}</p>
                        <div className={styles.contactInfo}>
                            <h4>Contact Information</h4>
                            <p><strong>Phone:</strong> {profileData?.contact_info?.phone || 'Not provided'}</p>
                            <p><strong>Office:</strong> {profileData?.contact_info?.office || 'Not provided'}</p>
                        </div>
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
        </div>
    );
}