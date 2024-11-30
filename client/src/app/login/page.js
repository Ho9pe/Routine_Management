import LoginForm from '@/components/LoginForm';
import Navigation from '@/components/Navigation';

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