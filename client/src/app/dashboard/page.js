import Dashboard from '@/components/dashboard/Dashboard';
import AuthLayout from '@/components/common/AuthLayout';
import Navigation from '@/components/common/Navigation';

export default function DashboardPage() {
    return (
        <>
            <Navigation />
            <AuthLayout>
                <Dashboard />
            </AuthLayout>
        </>
    );
}