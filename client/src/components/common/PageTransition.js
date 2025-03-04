'use client';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

import styles from './PageTransition.module.css';

// PageTransition component
export default function PageTransition({ children }) {
    const pathname = usePathname();
    const [isTransitioning, setIsTransitioning] = useState(false);
    useEffect(() => {
        setIsTransitioning(true);
        const timer = setTimeout(() => {
            setIsTransitioning(false);
        }, 10);
        return () => clearTimeout(timer);
    }, [pathname]);
    return (
        <div className={`${styles.pageTransition} ${isTransitioning ? styles.transitioning : ''}`}>
            {children}
        </div>
    );
}