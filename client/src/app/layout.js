import { AuthProvider } from '@/context/AuthContext';
import Navigation from '@/components/common/Navigation';
import RouteTransition from '@/components/common/RouteTransition';
import './globals.css';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Navigation />
          <RouteTransition>
            {children}
          </RouteTransition>
        </AuthProvider>
      </body>
    </html>
  );
}