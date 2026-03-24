
import { Archive } from 'lucide-react';
import ImageBackupForm from './ImageBackupForm';

export default function ImageBackupPage() {
  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Archive className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight uppercase italic">
              Media <span className="text-primary">Backup</span>
            </h1>
            <p className="text-muted-foreground font-medium">
              Export and Restore all uploaded images and videos in your local storage.
            </p>
          </div>
        </div>
      </div>

      <ImageBackupForm />
    </div>
  );
}
