import styles from './page.module.css';
import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <div className={styles.heroSection}>
          <div className={styles.logoWrapper}>
            <Image
              src="/images/ruet-logo.png"
              alt="University Routine Manager"
              width={120}
              height={120}
              className={styles.heroLogo}
              priority
            />
          </div>
          <div className={styles.heroContent}>
            <h1 className={styles.title}>
              Welcome to University Routine Manager
            </h1>
            <p className={styles.subtitle}>
              Streamline your academic scheduling with our modern management system
            </p>
          </div>
          <div className={styles.ctaButtons}>
            <Link href="/register" className={`${styles.ctaButton} ${styles.primary}`}>
              Get Started
            </Link>
            <Link href="/login" className={`${styles.ctaButton} ${styles.secondary}`}>
              Sign In
            </Link>
          </div>
        </div>
        
        <div className={styles.features}>
          <div className={styles.feature}>
            <div className={styles.featureIcon}>👨‍🎓</div>
            <h2>For Students</h2>
            <ul className={styles.featureList}>
              <li>Access your class schedule anytime, anywhere</li>
              <li>View detailed course information</li>
              <li>Get real-time updates on schedule changes</li>
              <li>Track your semester-wise courses</li>
            </ul>
            <Link href="/register?role=student" className={styles.featureLink}>
              Register as Student →
            </Link>
          </div>

          <div className={styles.feature}>
            <div className={styles.featureIcon}>👨‍🏫</div>
            <h2>For Teachers</h2>
            <ul className={styles.featureList}>
              <li>Manage your teaching schedule efficiently</li>
              <li>Set your preferred time slots</li>
              <li>Track your course assignments</li>
              <li>View department-wise course allocation</li>
            </ul>
            <Link href="/register?role=teacher" className={styles.featureLink}>
              Register as Teacher →
            </Link>
          </div>

          <div className={styles.feature}>
            <div className={styles.featureIcon}>⚡</div>
            <h2>Quick Access</h2>
            <ul className={styles.featureList}>
              <li>Intuitive and modern interface</li>
              <li>Mobile-friendly design</li>
              <li>Real-time schedule updates</li>
              <li>Smart conflict resolution</li>
            </ul>
          </div>
        </div>

        <div className={styles.statsSection}>
          <h2>Platform Statistics</h2>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statValue}>6160</div>
              <div className={styles.statLabel}>Students</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>475</div>
              <div className={styles.statLabel}>Teachers</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>18</div>
              <div className={styles.statLabel}>Departments</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>1440+</div>
              <div className={styles.statLabel}>Courses Managed</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>24/7</div>
              <div className={styles.statLabel}>System Availability</div>
            </div>
          </div>
        </div>

        <div className={styles.infoSection}>
          <div className={styles.infoCard}>
            <h3>Departments</h3>
            <ul className={styles.departmentList}>
              <li>Computer Science & Engineering (CSE)</li>
              <li>Electrical & Electronic Engineering (EEE)</li>
              <li>Mathematics (MATH)</li>
              <li>Physics (PHY)</li>
              <li>Chemistry (CHEM)</li>
              <li>Humanities (HUM)</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}