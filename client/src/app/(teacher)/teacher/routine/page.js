import RoutineDisplay from '@/components/routine/RoutineDisplay';
import AuthLayout from '@/components/common/AuthLayout';

export default function TeacherRoutinePage() {
    return (
        <AuthLayout>
            <RoutineDisplay />
        </AuthLayout>
    );
}