import AuthLayout from '@/components/common/AuthLayout';
import CourseManagement from '@/components/routine/CourseManagement';
import Navigation from '@/components/common/Navigation';

export default function CoursesPage() {
    return (
        <>
            <Navigation />
            <AuthLayout>
                <CourseManagement />
            </AuthLayout>
        </>
    );
}