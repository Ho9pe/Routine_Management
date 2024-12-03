import CourseManagement from '@/components/routine/CourseManagement';
import AuthLayout from '@/components/common/AuthLayout';

export default function TeacherCoursesPage() {
    return (
        <AuthLayout>
            <CourseManagement />
        </AuthLayout>
    );
}