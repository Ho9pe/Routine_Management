import RoutineDisplay from '@/components/routine/RoutineDisplay';
import AuthLayout from '@/components/common/AuthLayout';

export default function StudentRoutinePage() {
    return (
        <AuthLayout>
            <RoutineDisplay />
        </AuthLayout>
    );
}