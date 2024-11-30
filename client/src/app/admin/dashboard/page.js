import AdminDashboard from '@/components/AdminDashboard';
import AuthLayout from '@/components/AuthLayout';

export default function AdminDashboardPage() {
    return (
        <AuthLayout>
            <AdminDashboard />
        </AuthLayout>
    );
}