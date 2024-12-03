import styles from './page.module.css';
import Link from 'next/link';

export default function Home() {
  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <h1>Welcome to University Routine Manager</h1>
        <p className={styles.subtitle}>
          Streamline your academic scheduling with our modern management system
        </p>
        
        <div className={styles.features}>
          <div className={styles.feature}>
            <div className={styles.featureIcon}>👨‍🎓</div>
            <h2>For Students</h2>
            <p>Access your class schedule anytime, anywhere</p>
            <p>View detailed course information</p>
            <p>Get real-time updates on schedule changes</p>
          </div>

          <div className={styles.feature}>
            <div className={styles.featureIcon}>👨‍🏫</div>
            <h2>For Teachers</h2>
            <p>Manage your teaching schedule efficiently</p>
            <p>Set your preferred time slots</p>
            <p>Track your course assignments</p>
          </div>

          <div className={styles.feature}>
            <div className={styles.featureIcon}>⚡</div>
            <h2>Quick Access</h2>
            <p>Easy-to-use interface</p>
            <p>Mobile-friendly design</p>
            <p>Instant schedule updates</p>
          </div>
        </div>

        <Link href="/register" className={styles.ctaButton}>
          Get Started
        </Link>
      </main>
    </div>
  );
}