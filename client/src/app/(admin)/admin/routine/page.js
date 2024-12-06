import AdminRoutineManager from '@/components/routine/AdminRoutineManager';
import AuthLayout from '@/components/common/AuthLayout';

export default function AdminRoutinePage() {
    return (
        <AuthLayout>
            <AdminRoutineManager />
        </AuthLayout>
    );
}