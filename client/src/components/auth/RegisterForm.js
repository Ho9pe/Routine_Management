'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './RegisterForm.module.css';
import ErrorMessage from '../common/ErrorMessage';

const initialStudentData = {
    userType: 'student',
    full_name: '',
    student_roll: '',
    department: '',
    email: '',
    password: '',
    confirmPassword: ''
};

const initialTeacherData = {
    userType: 'teacher',
    full_name: '',
    teacher_id: '',
    academic_rank: '',
    department: '',
    email: '',
    password: '',
    confirmPassword: '',
    contact_info: {
        phone: '',
        office: ''
    }
};

export default function RegisterForm() {
    const router = useRouter();
    const [stage, setStage] = useState(1);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState(initialStudentData);
    const [success, setSuccess] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        // Handle role switch
        if (name === 'userType') {
            // Reset form data based on selected role
            setFormData(value === 'student' ? initialStudentData : initialTeacherData);
            return;
        }
        // Handle nested contact_info for teachers
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData(prev => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: value
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const validateStage = () => {
        switch(stage) {
            case 1:
                if (!formData.full_name.trim()) {
                    setError('Please enter your full name');
                    return false;
                }
                break;
            case 2:
                if (formData.userType === 'student') {
                    if (!formData.student_roll) {
                        setError('Please enter your student roll');
                        return false;
                    }
                    if (!formData.department) {
                        setError('Please select your department');
                        return false;
                    }
                    // Validate student roll format (assuming 7 digits)
                    if (!/^\d{7}$/.test(formData.student_roll)) {
                        setError('Student roll must be 7 digits');
                        return false;
                    }
                } else {
                    if (!formData.teacher_id) {
                        setError('Please enter your teacher ID');
                        return false;
                    }
                    if (!formData.academic_rank) {
                        setError('Please select your academic rank');
                        return false;
                    }
                    if (!formData.department) {
                        setError('Please select your department');
                        return false;
                    }
                    // Validate teacher ID format (if needed)
                    if (!/^[A-Z0-9-]+$/.test(formData.teacher_id)) {
                        setError('Invalid teacher ID format');
                        return false;
                    }
                }
                break;
            case 3:
                if (!formData.email) {
                    setError('Please enter your email');
                    return false;
                }
                if (!formData.password) {
                    setError('Please enter a password');
                    return false;
                }
                if (formData.password !== formData.confirmPassword) {
                    setError('Passwords do not match');
                    return false;
                }
                // Validate email format
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
                    setError('Please enter a valid email address');
                    return false;
                }
                // Validate password strength
                if (formData.password.length < 6) {
                    setError('Password must be at least 6 characters long');
                    return false;
                }
                break;
        }
        return true;
    };

    const handleNext = () => {
        if (validateStage()) {
            setError('');
            setStage(prev => prev + 1);
        }
    };

    const handleBack = () => {
        setError('');
        setStage(prev => prev - 1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateStage()) return;
        try {
            // Prepare API data based on user type
            const apiData = {
                email: formData.email,
                password: formData.password,
                role: formData.userType,
                full_name: formData.full_name,
                department: formData.department
            };

            // Add role-specific data
            if (formData.userType === 'student') {
                apiData.student_roll = formData.student_roll;
                apiData.batch = `20${formData.student_roll.substring(0, 2)}`;
            } else {
                apiData.teacher_id = formData.teacher_id;
                apiData.academic_rank = formData.academic_rank;
                apiData.contact_info = formData.contact_info;
            }

            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(apiData)
            });
            
            const data = await res.json();
            
            if (res.ok) {
                setSuccess(true);
                setTimeout(() => {
                    router.push('/login');
                }, 5000);
            } else {
                setError(data.message);
            }
        } catch (error) {
            setError('Registration failed. Please try again.');
        }
    };

    const renderStage1 = () => (
        <>
            <div className={styles.formGroup}>
                <label>I am a</label>
                <select
                    name="userType"
                    value={formData.userType}
                    onChange={handleChange}
                    required
                >
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                </select>
            </div>

            <div className={styles.formGroup}>
                <label>Full Name</label>
                <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    required
                />
            </div>
        </>
    );

    const renderStage2 = () => (
        formData.userType === 'student' ? (
            <>
                <div className={styles.formGroup}>
                    <label>Student Roll</label>
                    <input
                        type="text"
                        name="student_roll"
                        value={formData.student_roll}
                        onChange={handleChange}
                        placeholder="Enter your student roll (7 digits)"
                        maxLength={7}
                        pattern="\d{7}"
                        required
                    />
                </div>
                <div className={styles.formGroup}>
                    <label>Department</label>
                    <select
                        name="department"
                        value={formData.department}
                        onChange={handleChange}
                        required
                    >
                        <option value="">Select Department</option>
                        <option value="CSE">CSE</option>
                        <option value="EEE">EEE</option>
                        <option value="ME">ME</option>
                    </select>
                </div>
            </>
        ) : (
            <>
                <div className={styles.formGroup}>
                    <label>Teacher ID</label>
                    <input
                        type="text"
                        name="teacher_id"
                        value={formData.teacher_id}
                        onChange={handleChange}
                        placeholder="Enter your teacher ID"
                        required
                    />
                </div>
                <div className={styles.formGroup}>
                    <label>Academic Rank</label>
                    <select
                        name="academic_rank"
                        value={formData.academic_rank}
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
                    <label>Department</label>
                    <select
                        name="department"
                        value={formData.department}
                        onChange={handleChange}
                        required
                    >
                        <option value="">Select Department</option>
                        <option value="CSE">CSE</option>
                        <option value="EEE">EEE</option>
                        <option value="ME">ME</option>
                    </select>
                </div>
            </>
        )
    );

    const renderStage3 = () => (
        <>
            <div className={styles.formGroup}>
                <label>Email</label>
                <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    required
                />
            </div>
            <div className={styles.formGroup}>
                <label>Password</label>
                <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter password (min. 6 characters)"
                    minLength={6}
                    required
                />
            </div>
            <div className={styles.formGroup}>
                <label>Confirm Password</label>
                <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm password"
                    minLength={6}
                    required
                />
            </div>
        </>
    );

    // Add a success message component
    const SuccessMessage = () => (
        <div className={styles.successOverlay}>
            <div className={styles.successCard}>
                <div className={styles.successIcon}>✓</div>
                <h3>Registration Successful!</h3>
                <p>Your account has been created successfully.</p>
                <p className={styles.redirectText}>
                    Redirecting to login page in 5 seconds...
                </p>
                <div className={styles.progressBar}>
                    <div className={styles.progress}></div>
                </div>
                <button 
                    onClick={() => router.push('/login')}
                    className={styles.loginButton}
                >
                    Login Now
                </button>
            </div>
        </div>
    );

    return (
        <div className={styles.registerContainer}>
            {success ? (
                <SuccessMessage />
            ) : (
                <div className={styles.registerCard}>
                <h2>Register</h2>
                
                {error && (
                    <ErrorMessage 
                        message={error} 
                        onDismiss={() => setError('')}
                    />
                )}

                <div className={styles.stageIndicator}>
                    <div className={`${styles.stage} ${stage >= 1 ? styles.active : ''}`}>1</div>
                    <div className={styles.line}></div>
                    <div className={`${styles.stage} ${stage >= 2 ? styles.active : ''}`}>2</div>
                    <div className={styles.line}></div>
                    <div className={`${styles.stage} ${stage >= 3 ? styles.active : ''}`}>3</div>
                </div>

                <form onSubmit={stage === 3 ? handleSubmit : (e) => e.preventDefault()}>
                    {stage === 1 && renderStage1()}
                    {stage === 2 && renderStage2()}
                    {stage === 3 && renderStage3()}
                    <div className={styles.buttonGroup}>
                        {stage > 1 && (
                            <button 
                                type="button" 
                                onClick={handleBack}
                                className={styles.backButton}
                            >
                                Back
                            </button>
                        )}
                        {stage < 3 ? (
                            <button 
                                type="button" 
                                onClick={handleNext}
                                className={styles.nextButton}
                            >
                                Next
                            </button>
                        ) : (
                            <button 
                                type="submit"
                                className={styles.submitButton}
                            >
                                Register
                            </button>
                        )}
                    </div>
                </form>
                </div>
            )}
        </div>
    );
}