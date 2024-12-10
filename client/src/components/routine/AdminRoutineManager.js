'use client';
import { useEffect, useState } from 'react';
import RoutineDisplay from './RoutineDisplay';
import styles from './AdminRoutineManager.module.css';
import ErrorMessage from '../common/ErrorMessage';
import { semesterToYear } from '@/lib/semesterMapping';

export default function AdminRoutineManager() {
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [selectedSection, setSelectedSection] = useState('');
    const [selectedSemester, setSelectedSemester] = useState('');
    const [generationResult, setGenerationResult] = useState(null);
    const [showRoutine, setShowRoutine] = useState(false);
    const [showSkippedCourses, setShowSkippedCourses] = useState(false);
    const [routineStatus, setRoutineStatus] = useState(null);
    const [key, setKey] = useState(0);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [confirmSuccess, setConfirmSuccess] = useState(false);
    
    useEffect(() => {
        fetchRoutineStatus();
    }, []);

    useEffect(() => {
        if (routineStatus?.hasRoutine) {
            setShowRoutine(true);
        }
    }, [routineStatus]);

    useEffect(() => {
        if (selectedSection && selectedSemester) {
            setKey(prevKey => prevKey + 1);
        }
    }, [selectedSection, selectedSemester]);

    useEffect(() => {
        if (showConfirmDialog) {
            document.documentElement.classList.add('overlay-active');
            document.body.classList.add('overlay-active');
        } else {
            document.documentElement.classList.remove('overlay-active');
            document.body.classList.remove('overlay-active');
        }

        return () => {
            document.documentElement.classList.remove('overlay-active');
            document.body.classList.remove('overlay-active');
        };
    }, [showConfirmDialog]);

    const fetchRoutineStatus = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/schedule/admin/status', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                mode: 'cors',
                credentials: 'include'
            });
            const data = await response.json();
            if (response.ok) {
                setRoutineStatus(data);
            } else {
                setError(data.message || 'Failed to fetch routine status');
            }
        } catch (error) {
            console.error('Error fetching routine status:', error);
        }
    };
    
    const handleGenerateRoutine = async () => {
        if (routineStatus?.hasRoutine && !showConfirmDialog) {
            setShowConfirmDialog(true);
            return;
        }
    
        try {
            setGenerating(true);
            setError('');
            setSuccess('');
            setGenerationResult(null);
            setShowRoutine(false);
            
            // Make request directly to Express server
            const response = await fetch('http://localhost:5000/api/schedule/admin/generate', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                mode: 'cors',
                credentials: 'include'
            });

            const data = await response.json();
            
            if (response.ok && data.success) {
                setGenerationResult({
                    scheduledCourses: data.scheduledCourses,
                    skippedCourses: data.skippedCourses
                });
                setSuccess('Routine generated successfully!');
                
                await fetchRoutineStatus();
                setShowRoutine(true);
                setKey(prevKey => prevKey + 1);
                
                setConfirmSuccess(true);
                setTimeout(() => {
                    setShowConfirmDialog(false);
                    setConfirmSuccess(false);
                }, 2000);
            } else {
                throw new Error(data.message || 'Failed to generate routine');
            }
        } catch (error) {
            console.error('Generation error:', error);
            setError(error.message || 'Failed to generate routine. Please try again.');
            setShowConfirmDialog(false);
        } finally {
            setGenerating(false);
        }
    };
    
    const renderGenerationSummary = () => {
        if (!generationResult) return null;

        return (
            <div className={styles.generationSummary}>
                <h3>Generation Summary</h3>
                <div className={styles.summaryStats}>
                    <div className={styles.statItem}>
                        <span>Scheduled Courses:</span>
                        <span className={styles.statValue}>{generationResult.scheduledCourses}</span>
                    </div>
                    <div className={styles.statItem}>
                        <span>Skipped Courses:</span>
                        <span className={styles.statValue}>
                            {generationResult.skippedCourses?.length || 0}
                            {generationResult.skippedCourses?.length > 0 && (
                                <button
                                    onClick={() => setShowSkippedCourses(!showSkippedCourses)}
                                    className={styles.toggleDetailsButton}
                                >
                                    {showSkippedCourses ? 'Hide Details' : 'Show Details'}
                                </button>
                            )}
                        </span>
                    </div>
                </div>

                {showSkippedCourses && generationResult.skippedCourses?.length > 0 && (
                    <div className={`${styles.skippedCourses} ${styles.slideDown}`}>
                        <div className={styles.skippedCoursesHeader}>
                            <h4>Skipped Courses</h4>
                            <button
                                onClick={() => setShowSkippedCourses(false)}
                                className={styles.closeButton}
                                aria-label="Close details"
                            >
                                ×
                            </button>
                        </div>
                        <ul>
                            {generationResult.skippedCourses.map((course, index) => (
                                <li key={index}>
                                    {course.course_code} (Section {course.section}, Semester {course.semester})
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className={styles.adminRoutine}>
            <div className={styles.header}>
                <h2>Routine Management</h2>
                <div className={styles.generateSection}>
                    {routineStatus?.hasRoutine ? (
                        <div className={styles.existingRoutineInfo}>
                            <p>Existing routine found</p>
                            <p className={styles.lastGenerated}>
                                Last generated: {new Date(routineStatus.lastGeneration?.start_time).toLocaleDateString()}
                            </p>
                        </div>
                    ) : (
                        <p>No existing routine found</p>
                    )}
                    <button 
                        onClick={handleGenerateRoutine}
                        disabled={generating}
                        className={styles.generateButton}
                    >
                        {generating ? 'Generating...' : 
                            routineStatus?.hasRoutine ? 'Regenerate Routine' : 'Generate Routine'}
                    </button>
                </div>
            </div>
            {error && (
                <ErrorMessage 
                    message={error}
                    onDismiss={() => setError('')}
                />
            )}
            {generationResult && renderGenerationSummary()}
            {showRoutine && (
                <div className={styles.viewSection}>
                    <div className={styles.viewHeader}>
                        <h3>View Routine</h3>
                    </div>
                    <div className={styles.filters}>
                        <div className={styles.filterGroup}>
                            <label>Section:</label>
                            <select 
                                value={selectedSection}
                                onChange={(e) => setSelectedSection(e.target.value)}
                                className={styles.select}
                            >
                                <option value="">Select Section</option>
                                <option value="A">Section A</option>
                                <option value="B">Section B</option>
                                <option value="C">Section C</option>
                            </select>
                        </div>
                        <div className={styles.filterGroup}>
                            <label>Semester:</label>
                            <select
                                value={selectedSemester}
                                onChange={(e) => setSelectedSemester(e.target.value)}
                                className={styles.select}
                            >
                                <option value="">Select Semester</option>
                                {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                                    <option key={sem} value={sem}>
                                        {semesterToYear(sem)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    {(!selectedSection || !selectedSemester) ? (
                        <div className={styles.selectionPrompt}>
                            Please select both section and semester to view the routine
                        </div>
                    ) : (
                        <RoutineDisplay 
                            key={`${selectedSection}-${selectedSemester}-${key}`}
                            selectedSection={selectedSection}
                            selectedSemester={selectedSemester}
                        />
                    )}
                </div>
            )}

            {showConfirmDialog && (
                <div className={styles.confirmOverlay}>
                    <div className={styles.confirmDialog}>
                        {!confirmSuccess ? (
                            <>
                                <h4>Regenerate Routine</h4>
                                <p>This will overwrite the existing routine. Are you sure you want to continue?</p>
                                <div className={styles.confirmActions}>
                                    <button 
                                        onClick={handleGenerateRoutine}
                                        className={styles.submitButton}
                                        disabled={generating}
                                    >
                                        {generating ? 'Generating...' : 'Continue'}
                                    </button>
                                    <button 
                                        onClick={() => setShowConfirmDialog(false)}
                                        className={styles.cancelButton}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className={styles.successIcon}>✓</div>
                                <h4>Success!</h4>
                                <p>Routine has been regenerated successfully.</p>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}