import AdminPanel from '@/components/admin/AdminPanel';
import AuthLayout from '@/components/common/AuthLayout';

export default function AdminPanelPage() {
    return (
        <AuthLayout>
            <AdminPanel />
        </AuthLayout>
    );
}