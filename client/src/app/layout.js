import { AuthProvider } from '@/context/AuthContext';
import Navigation from '@/components/common/Navigation';
import PageTransition from '@/components/common/PageTransition';
import './globals.css';

// Metadata for the app
export const metadata = {
    title: 'University Routine Manager',
    description: 'Manage your university routine efficiently',
    icons: {
        icon: '/favicon.ico'
    },
};
// Layout component
export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <head>
                <link rel="icon" href="/favicon.ico" sizes="any" />
            </head>
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