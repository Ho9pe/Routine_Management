import Dashboard from '@/components/dashboard/Dashboard';
import AuthLayout from '@/components/common/AuthLayout';

export default function TeacherDashboardPage() {
    return (
        <AuthLayout>
            <Dashboard />
        </AuthLayout>
    );
}