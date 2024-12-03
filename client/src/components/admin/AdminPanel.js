'use client';
import { useState, useEffect } from 'react';
import styles from './AdminPanel.module.css';
import ErrorMessage from '../common/ErrorMessage';
import { semesterToYear } from '@/lib/semesterMapping';
import StatsDisplay from './StatsDisplay';

export default function AdminPanel() {
    const [activeTab, setActiveTab] = useState('students');
    const [searchTerm, setSearchTerm] = useState('');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [sortConfig, setSortConfig] = useState({ 
        key: null, 
        direction: 'asc' 
    });

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        try {
            const response = await fetch(`/api/admin/${activeTab}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const result = await response.json();
            
            if (response.ok) {
                setData(result);
            } else {
                setError(result.message);
            }
        } catch (error) {
            setError('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this item?')) return;

        try {
            const response = await fetch(`/api/admin/${activeTab}/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                fetchData(); // Refresh the list
            } else {
                const result = await response.json();
                setError(result.message);
            }
        } catch (error) {
            setError('Failed to delete item');
        }
    };

    const filteredData = data.filter(item => {
        const searchString = searchTerm.toLowerCase();
        switch (activeTab) {
            case 'students':
                return (
                    item.full_name?.toLowerCase().includes(searchString) ||
                    item.student_roll?.toLowerCase().includes(searchString) ||
                    item.department?.toLowerCase().includes(searchString)
                );
            case 'teachers':
                return (
                    item.full_name?.toLowerCase().includes(searchString) ||
                    item.teacher_id?.toLowerCase().includes(searchString) ||
                    item.department?.toLowerCase().includes(searchString)
                );
            case 'courses':
                return (
                    item.course_name?.toLowerCase().includes(searchString) ||
                    item.course_code?.toLowerCase().includes(searchString) ||
                    item.department?.toLowerCase().includes(searchString)
                );
            default:
                return true;
        }
    });

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getSortedData = (data) => {
        if (!sortConfig.key) return data;
    
        return [...data].sort((a, b) => {
            let aValue = a[sortConfig.key];
            let bValue = b[sortConfig.key];
    
            // Handle nested properties
            if (sortConfig.key.includes('.')) {
                const [parent, child] = sortConfig.key.split('.');
                aValue = a[parent]?.[child];
                bValue = b[parent]?.[child];
            }
    
            // Handle null/undefined values
            if (aValue == null) return 1;
            if (bValue == null) return -1;
    
            // Special handling for course_code sorting
            if (sortConfig.key === 'course_code') {
                // Extract the numeric part after the hyphen
                const aNum = parseInt(aValue.split('-')[1]);
                const bNum = parseInt(bValue.split('-')[1]);
                
                if (aNum < bNum) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aNum > bNum) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            }
    
            // Default string comparison
            if (typeof aValue === 'string') {
                aValue = aValue.toLowerCase();
                bValue = bValue.toLowerCase();
            }
    
            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    };

    const SortableHeader = ({ label, sortKey }) => (
        <th 
            onClick={() => handleSort(sortKey)}
            className={styles.sortableHeader}
        >
            <div className={styles.headerContent}>
                {label}
                {sortConfig.key === sortKey && (
                    <span className={styles.sortIcon}>
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                    </span>
                )}
            </div>
        </th>
    );

    const renderStudentTable = () => (
        <table className={styles.table}>
            <thead>
                <tr>
                    <SortableHeader label="Roll No" sortKey="student_roll" />
                    <SortableHeader label="Name" sortKey="full_name" />
                    <SortableHeader label="Department" sortKey="department" />
                    <SortableHeader label="Year" sortKey="semester" />
                    <SortableHeader label="Email" sortKey="email" />
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {getSortedData(filteredData).map(student => (
                    <tr key={student._id}>
                        <td>{student.student_roll}</td>
                        <td>{student.full_name}</td>
                        <td>{student.department}</td>
                        <td>{semesterToYear(student.semester)}</td>
                        <td>{student.email}</td>
                        <td>
                            <button 
                                onClick={() => handleDelete(student._id)}
                                className={styles.deleteButton}
                            >
                                Delete
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );

    const renderTeacherTable = () => (
        <table className={styles.table}>
            <thead>
                <tr>
                    <SortableHeader label="ID" sortKey="teacher_id" />
                    <SortableHeader label="Name" sortKey="full_name" />
                    <SortableHeader label="Department" sortKey="department" />
                    <SortableHeader label="Rank" sortKey="academic_rank" />
                    <SortableHeader label="Email" sortKey="contact_info.email" />
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {getSortedData(filteredData).map(teacher => (
                    <tr key={teacher._id}>
                        <td>{teacher.teacher_id}</td>
                        <td>{teacher.full_name}</td>
                        <td>{teacher.department}</td>
                        <td>{teacher.academic_rank}</td>
                        <td>{teacher.contact_info?.email}</td>
                        <td>
                            <button 
                                onClick={() => handleDelete(teacher._id)}
                                className={styles.deleteButton}
                            >
                                Delete
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );

    const renderCourseTable = () => (
        <table className={styles.table}>
            <thead>
                <tr>
                    <SortableHeader label="Code" sortKey="course_code" />
                    <SortableHeader label="Name" sortKey="course_name" />
                    <SortableHeader label="Type" sortKey="course_type" />
                    <SortableHeader label="Credit Hours" sortKey="credit_hours" />
                    <SortableHeader label="Contact Hours" sortKey="contact_hours" />
                    <SortableHeader label="Department" sortKey="department" />
                    <SortableHeader label="Semester" sortKey="semester" />
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {getSortedData(filteredData).map(course => (
                    <tr key={course._id}>
                        <td>{course.course_code}</td>
                        <td>{course.course_name}</td>
                        <td>
                            <span className={`${styles.badge} ${styles[course.course_type]}`}>
                                {course.course_type}
                            </span>
                        </td>
                        <td>{course.credit_hours}</td>
                        <td>{course.contact_hours}</td>
                        <td>{course.department}</td>
                        <td>{semesterToYear(course.semester)}</td>
                        <td>
                            <button 
                                onClick={() => handleDelete(course._id)}
                                className={styles.deleteButton}
                            >
                                Delete
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );

    const renderTable = () => {
        if (loading) return <div className={styles.loading}>Loading...</div>;
        
        if (filteredData.length === 0) {
            return <div className={styles.noData}>No {activeTab} found</div>;
        }
    
        return (
            <>
                <StatsDisplay data={data} type={activeTab} />
                {activeTab === 'students' && renderStudentTable()}
                {activeTab === 'teachers' && renderTeacherTable()}
                {activeTab === 'courses' && renderCourseTable()}
            </>
        );
    };

    return (
        <div className={styles.adminPanel}>
            <div className={styles.header}>
                <h1>Admin Panel</h1>
                <div className={styles.searchBar}>
                    <input
                        type="text"
                        placeholder={`Search ${activeTab}...`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
            {error && (
                <ErrorMessage 
                    message={error}
                    onDismiss={() => setError('')}
                />
            )}
            <div className={styles.tabs}>
                <button
                    className={`${styles.tab} ${activeTab === 'students' ? styles.active : ''}`}
                    onClick={() => setActiveTab('students')}
                >
                    Students
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'teachers' ? styles.active : ''}`}
                    onClick={() => setActiveTab('teachers')}
                >
                    Teachers
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'courses' ? styles.active : ''}`}
                    onClick={() => setActiveTab('courses')}
                >
                    Courses
                </button>
            </div>
            <div className={styles.content}>
                {renderTable()}
            </div>
        </div>
    );
}