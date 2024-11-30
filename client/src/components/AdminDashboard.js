'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import styles from './AdminDashboard.module.css';

export default function AdminDashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        totalCourses: 0,
        totalTeachers: 0,
        totalStudents: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchDashboardStats();
    }, []);

    const fetchDashboardStats = async () => {
        try {
            const response = await fetch('/api/admin/dashboard', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();
            if (response.ok) {
                setStats(data);
            } else {
                setError(data.message);
            }
        } catch (error) {
            setError('Failed to fetch dashboard statistics');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className={styles.loading}>Loading...</div>;
    }

    if (error) {
        return <div className={styles.error}>{error}</div>;
    }

    return (
        <div className={styles.dashboard}>
            <h1>Admin Dashboard</h1>
            
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <h3>Total Courses</h3>
                    <p className={styles.statNumber}>{stats.totalCourses}</p>
                    <Link href="/courses" className={styles.link}>
                        Manage Courses
                    </Link>
                </div>

                <div className={styles.statCard}>
                    <h3>Total Teachers</h3>
                    <p className={styles.statNumber}>{stats.totalTeachers}</p>
                    <Link href="/admin/teachers" className={styles.link}>
                        Manage Teachers
                    </Link>
                </div>

                <div className={styles.statCard}>
                    <h3>Total Students</h3>
                    <p className={styles.statNumber}>{stats.totalStudents}</p>
                    <Link href="/admin/students" className={styles.link}>
                        Manage Students
                    </Link>
                </div>
            </div>

            <div className={styles.actionGrid}>
                <div className={styles.actionCard}>
                    <h3>Quick Actions</h3>
                    <div className={styles.actionButtons}>
                        <Link href="/admin/schedule/generate" className={styles.button}>
                            Generate Routine
                        </Link>
                        <Link href="/admin/rooms" className={styles.button}>
                            Manage Rooms
                        </Link>
                        <Link href="/admin/departments" className={styles.button}>
                            Manage Departments
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}