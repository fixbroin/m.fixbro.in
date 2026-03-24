
import { Metadata } from 'next';
import { APP_NAME } from '@/lib/config';
import { User } from 'lucide-react';
import ProfileForm from './ProfileForm';

export const metadata: Metadata = {
  title: `Admin Profile | ${APP_NAME}`,
  robots: {
    index: false,
    follow: false,
  },
};

export default function ProfilePage() {
  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl">Admin Profile</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Manage your account details, profile picture, and password.
        </p>
      </div>
      <div className="mx-auto max-w-3xl">
         <div className="rounded-lg border bg-card text-card-foreground p-6 mb-8 flex items-start gap-4">
          <User className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-headline text-lg font-semibold">Account Information</h3>
            <p className="text-sm text-muted-foreground mt-1">
                Update your personal information and change your password here. For security, you'll need to re-authenticate for some actions.
            </p>
          </div>
        </div>
        <ProfileForm />
      </div>
    </div>
  );
}
