import RegisterForm from '@/components/auth/RegisterForm';
import Navigation from '@/components/common/Navigation';

export default function RegisterPage() {
    return (
        <>
            <Navigation />
            <div className="container">
                <RegisterForm />
            </div>
        </>
    );
}