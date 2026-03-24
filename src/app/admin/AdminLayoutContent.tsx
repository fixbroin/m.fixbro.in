
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';

export default function AdminLayoutContent({ children, user }: { children: React.ReactNode, user: any }) {
  return (
    <div className="flex min-h-screen w-full bg-background text-foreground transition-colors duration-300">
      <AdminSidebar className="hidden md:flex w-[260px] lg:w-[280px] shrink-0" />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <AdminHeader user={user} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 custom-scrollbar relative">
          {/* Subtle background gradient for depth */}
          <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none opacity-50 dark:opacity-20 transition-opacity" />
          
          <div className="relative z-10 max-w-[1600px] mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
