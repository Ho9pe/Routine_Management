import AuthLayout from '@/components/AuthLayout';
import CourseManagement from '@/components/CourseManagement';
import Navigation from '@/components/Navigation';

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