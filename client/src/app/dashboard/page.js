import Dashboard from '@/components/Dashboard';
import AuthLayout from '@/components/AuthLayout';
import Navigation from '@/components/Navigation';

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