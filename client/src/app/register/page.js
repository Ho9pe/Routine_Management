import RegisterForm from '@/components/RegisterForm';
import Navigation from '@/components/Navigation';

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