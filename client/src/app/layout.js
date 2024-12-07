import { AuthProvider } from '@/context/AuthContext';
import Navigation from '@/components/common/Navigation';
import PageTransition from '@/components/common/PageTransition';
import './globals.css';

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body>
                <AuthProvider>
                    <Navigation />
                    <PageTransition>
                        <main className="main-content">
                            {children}
                        </main>
                    </PageTransition>
                </AuthProvider>
            </body>
        </html>
    );
}