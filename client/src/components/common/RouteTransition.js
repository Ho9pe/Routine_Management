'use client';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import styles from './RouteTransition.module.css';

export default function RouteTransition({ children }) {
    const pathname = usePathname();
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        setIsAnimating(true);
        const timer = setTimeout(() => {
            setIsAnimating(false);
        }, 300); // Match this with CSS animation duration

        return () => clearTimeout(timer);
    }, [pathname]);

    return (
        <div className={`${styles.pageWrapper} ${isAnimating ? styles.animating : ''}`}>
            {children}
        </div>
    );
}