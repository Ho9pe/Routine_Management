import LoginForm from '@/components/auth/LoginForm';
import Navigation from '@/components/common/Navigation';

export default function LoginPage() {
    return (
        <>
            <Navigation />
            <div className="container">
                <LoginForm />
            </div>
        </>
    );
}