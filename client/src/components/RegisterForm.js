'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './RegisterForm.module.css';
import ErrorMessage from './ErrorMessage';

export default function RegisterForm() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        userType: 'student',
        student_roll: '',
        teacher_id: '',
        full_name: '',
        department: '',
        academic_rank: '',
        contact_info: {
            phone: '',
            office: ''
        }
    });
    const [error, setError] = useState('');

    useEffect(() => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }, [error]);

    const handleDismissError = () => {
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const apiData = {
                email: formData.email,
                password: formData.password,
                role: formData.userType,
                full_name: formData.full_name,
                department: formData.department,
                ...(formData.userType === 'student' 
                    ? { student_roll: formData.student_roll }
                    : { 
                        teacher_id: formData.teacher_id,
                        academic_rank: formData.academic_rank,
                        contact_info: formData.contact_info
                    }
                )
            };
    
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(apiData)
            });
            const data = await res.json();
            
            if (res.ok) {
                router.push('/login');
            } else {
                setError(data.message);
            }
        } catch (error) {
            setError('Registration failed, Please try again.');
        }
    };

    return (
        <form className={styles.form} onSubmit={handleSubmit}>
            <h2>Register</h2>
            {error && (
                <ErrorMessage 
                    message={error} 
                    onDismiss={handleDismissError}
                    duration={10000}
                />
            )}
            
            <div className={styles.formGroup}>
                <label>I am a</label>
                <select
                    value={formData.userType}
                    onChange={(e) => setFormData({...formData, userType: e.target.value})}
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
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    required
                />
            </div>

            <div className={styles.formGroup}>
                <label>Email</label>
                <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                />
            </div>

            <div className={styles.formGroup}>
                <label>Password</label>
                <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    required
                />
            </div>

            <div className={styles.formGroup}>
                <label>Department</label>
                <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                    required
                />
            </div>

            {formData.userType === 'student' && (
                <div className={styles.formGroup}>
                    <label>Student Roll</label>
                    <input
                        type="text"
                        value={formData.student_roll}
                        onChange={(e) => setFormData({...formData, student_roll: e.target.value})}
                        placeholder="Enter your student roll"
                        required
                    />
                </div>
            )}

            {formData.userType === 'teacher' && (
                <>
                    <div className={styles.formGroup}>
                        <label>Teacher ID</label>
                        <input
                            type="text"
                            value={formData.teacher_id}
                            onChange={(e) => setFormData({...formData, teacher_id: e.target.value})}
                            placeholder="Enter your teacher ID"
                            required
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label>Academic Rank</label>
                        <select
                            value={formData.academic_rank}
                            onChange={(e) => setFormData({...formData, academic_rank: e.target.value})}
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
                            type="text"
                            value={formData.contact_info.phone}
                            onChange={(e) => setFormData({
                                ...formData, 
                                contact_info: {...formData.contact_info, phone: e.target.value}
                            })}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label>Office</label>
                        <input
                            type="text"
                            value={formData.contact_info.office}
                            onChange={(e) => setFormData({
                                ...formData, 
                                contact_info: {...formData.contact_info, office: e.target.value}
                            })}
                        />
                    </div>
                </>
            )}

            <button type="submit">Register</button>
        </form>
    );
}