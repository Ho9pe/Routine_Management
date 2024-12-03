import Dashboard from '@/components/dashboard/Dashboard';
import AuthLayout from '@/components/common/AuthLayout';

export default function StudentDashboardPage() {
    return (
        <AuthLayout>
            <Dashboard />
        </AuthLayout>
    );
}