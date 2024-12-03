import AdminDashboard from '@/components/dashboard/AdminDashboard';
import AuthLayout from '@/components/common/AuthLayout';

export default function AdminDashboardPage() {
    return (
        <AuthLayout>
            <AdminDashboard />
        </AuthLayout>
    );
}