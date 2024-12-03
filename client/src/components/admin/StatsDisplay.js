import styles from './StatsDisplay.module.css';

const StatsDisplay = ({ data, type }) => {
    const getStats = () => {
        switch(type) {
            case 'students':
                return [{
                    title: 'Total Students',
                    value: data.length,
                    color: 'blue'
                }];

            case 'teachers':
                const teacherRanks = data.reduce((acc, teacher) => {
                    acc[teacher.academic_rank] = (acc[teacher.academic_rank] || 0) + 1;
                    return acc;
                }, {});

                return [
                    {
                        title: 'Total Teachers',
                        value: data.length,
                        color: 'blue'
                    },
                    ...Object.entries(teacherRanks).map(([rank, count]) => ({
                        title: rank,
                        value: count,
                        color: 'purple'
                    }))
                ];

            case 'courses':
                const courseTypes = data.reduce((acc, course) => {
                    acc[course.course_type] = (acc[course.course_type] || 0) + 1;
                    return acc;
                }, {});
                
                const totalCreditHours = data.reduce((sum, course) => 
                    sum + course.credit_hours, 0
                );
                
                return [
                    {
                        title: 'Total Courses',
                        value: data.length,
                        color: 'blue'
                    },
                    {
                        title: 'Total Credit Hours',
                        value: totalCreditHours.toFixed(2),
                        color: 'green'
                    },
                    ...Object.entries(courseTypes).map(([type, count]) => ({
                        title: type.charAt(0).toUpperCase() + type.slice(1),
                        value: count,
                        color: type
                    }))
                ];

            default:
                return [];
        }
    };

    return (
        <div className={styles.statsGrid}>
            {getStats().map((stat, index) => (
                <div key={index} className={styles.statCard}>
                    <h3 className={styles.statTitle}>{stat.title}</h3>
                    <div className={`${styles.statValue} ${styles[stat.color]}`}>
                        {stat.value}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default StatsDisplay;