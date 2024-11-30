'use client';
import { useEffect } from 'react';
import styles from './ErrorMessage.module.css';

export default function ErrorMessage({ message, onDismiss, duration = 5000 }) {
    useEffect(() => {
        if (message) {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });

            const timer = setTimeout(() => {
                onDismiss();
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [message, duration, onDismiss]);

    if (!message) return null;

    return (
        <div className={styles.errorContainer}>
            <div className={styles.errorContent}>
                <div className={styles.messageWrapper}>
                    <span className={styles.errorIcon}>⚠️</span>
                    <p className={styles.errorText}>{message}</p>
                </div>
                <button 
                    onClick={onDismiss} 
                    className={styles.dismissButton}
                    aria-label="Dismiss error"
                >
                    X
                </button>
            </div>
            <div 
                className={styles.progressBar} 
                style={{ animationDuration: `${duration}ms` }} 
            />
        </div>
    );
}