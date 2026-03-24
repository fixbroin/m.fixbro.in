
import { Metadata } from 'next';
import { APP_NAME } from '@/lib/config';
import AuthGuard from './AuthGuard';

export const metadata: Metadata = {
  title: `Admin | ${APP_NAME}`,
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      {children}
    </AuthGuard>
  );
}
