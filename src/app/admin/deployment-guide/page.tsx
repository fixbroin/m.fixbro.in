
import { Metadata } from 'next';
import { APP_NAME } from '@/lib/config';
import { Terminal, Globe, ShieldCheck, FolderSync, Info, Rocket, Server, HardDrive, AlertTriangle, Database, Archive, Lock, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export const metadata: Metadata = {
  title: `Deployment Guide | ${APP_NAME}`,
  robots: { index: false, follow: false },
};

export default function DeploymentGuidePage() {
  return (
    <div className="w-full pb-20 space-y-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl uppercase italic">
          Hosting & <span className="text-primary">Maintenance Guide</span>
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground font-medium">
          Complete instructions for deploying and maintaining your website, including database and image management.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-10">
        {/* Critical Info: Build vs Export */}
        <Alert variant="destructive" className="bg-destructive/5 border-destructive/20 p-6 rounded-2xl">
            <AlertTriangle className="h-6 w-6" />
            <AlertTitle className="font-black text-xl mb-2">CRITICAL: Deployment Mode</AlertTitle>
            <AlertDescription className="space-y-4">
                <p className="text-base">This website uses <strong>Server-Side Logic</strong> (MySQL Database, Admin Panel, and Local File Storage). It cannot be deployed as a static site.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="p-4 bg-destructive/10 rounded-xl border border-destructive/20">
                    <p className="font-bold text-destructive flex items-center gap-2"><Lock className="h-4 w-4" /> NOT SUPPORTED</p>
                    <p className="text-sm mt-1 opacity-80">Static Export (next export), GitHub Pages, Vercel (without external DB), Netlify.</p>
                  </div>
                  <div className="p-4 bg-green-500/10 rounded-xl border border-green-500/20">
                    <p className="font-bold text-green-600 dark:text-green-400 flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> SUPPORTED</p>
                    <p className="text-sm mt-1 opacity-80">VPS (Ubuntu/Nginx), Dedicated Servers, Shared Node.js Hosting (cPanel), Docker.</p>
                  </div>
                </div>
            </AlertDescription>
        </Alert>

        <Tabs defaultValue="vps" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8 h-14 bg-muted/50 p-1 rounded-2xl border border-border">
            <TabsTrigger value="vps" className="text-lg font-bold rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
              <Server className="mr-2 h-5 w-5" /> VPS
            </TabsTrigger>
            <TabsTrigger value="shared" className="text-lg font-bold rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
              <Globe className="mr-2 h-5 w-5" /> Shared
            </TabsTrigger>
            <TabsTrigger value="backup" className="text-lg font-bold rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
              <Database className="mr-2 h-5 w-5" /> Maintenance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="vps" className="space-y-6">
            <Card className="rounded-2xl border-border overflow-hidden shadow-sm">
                <CardHeader className="bg-muted/30 border-b">
                    <CardTitle className="flex items-center gap-2"><Rocket className="h-5 w-5 text-primary" /> Step-by-Step VPS Deployment</CardTitle>
                    <CardDescription>Recommended for Ubuntu/Debian with Nginx.</CardDescription>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                    <div className="space-y-6">
                        <Step number="1" title="Permissions (Crucial)" description="Grant the Node.js process permission to manage your uploads.">
                          <div className="mt-3 p-4 bg-slate-950 text-slate-50 rounded-xl font-mono text-xs leading-relaxed">
                              <p className="text-slate-500"># Run from project root</p>
                              <p>sudo chown -R $USER:www-data public/uploads</p>
                              <p>chmod -R 775 public/uploads</p>
                          </div>
                        </Step>
                        <Step number="2" title="Nginx Configuration" description="Increase upload limit for image restoration (Default is 1MB).">
                          <div className="mt-3 p-4 bg-slate-950 text-slate-50 rounded-xl font-mono text-xs leading-relaxed">
                              <p className="text-slate-500"># Edit /etc/nginx/nginx.conf or site config</p>
                              <p>client_max_body_size 100M;</p>
                              <p className="text-slate-500 mt-2"># Restart Nginx</p>
                              <p>sudo systemctl restart nginx</p>
                          </div>
                        </Step>
                        <Step number="3" title="Build & Start" description="Install, build, and run using PM2.">
                          <div className="mt-3 p-4 bg-slate-950 text-slate-50 rounded-xl font-mono text-xs leading-relaxed">
                              <p>npm install --production</p>
                              <p>npm run build</p>
                              <p>pm2 start npm --name "ads-site" -- start</p>
                          </div>
                        </Step>
                    </div>
                </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="shared" className="space-y-6">
            <Card className="rounded-2xl border-border overflow-hidden shadow-sm">
                <CardHeader className="bg-muted/30 border-b">
                    <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5 text-primary" /> Shared Node.js Deployment</CardTitle>
                    <CardDescription>For cPanel based hosting (Hostinger, A2, etc.).</CardDescription>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                    <div className="space-y-6">
                        <Step number="1" title="Upload & Extract" description="Upload the build files (.next, public, package.json, next.config.ts) using cPanel File Manager.">
                        </Step>
                        <Step number="2" title="Folder Permissions" description="Ensure the 'public/uploads' folder has permission 755 or 775 via File Manager.">
                          <p className="text-xs text-muted-foreground mt-2 italic font-bold">Right-click folder → Permissions → Set to 775</p>
                        </Step>
                        <Step number="3" title="Node.js Setup" description="Go to 'Setup Node.js App' in cPanel.">
                           <ul className="list-disc ml-5 text-sm space-y-1 mt-2 text-muted-foreground">
                             <li>Application mode: <strong>Production</strong></li>
                             <li>Application startup file: <strong>node_modules/next/dist/bin/next</strong></li>
                             <li>Add Environment Variable: <strong>NODE_ENV = production</strong></li>
                           </ul>
                        </Step>
                    </div>
                </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="backup" className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="rounded-2xl border-primary/20 bg-primary/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-primary"><Database className="h-5 w-5" /> Database Backup</CardTitle>
                        <CardDescription>Located in System → Maintenance</CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm space-y-4">
                        <div className="p-3 bg-white dark:bg-black/20 rounded-xl border border-primary/10">
                          <p className="font-bold mb-1">How to Backup:</p>
                          <p className="text-xs text-muted-foreground">Click 'Download Full Backup' to get a .json file of all your website data (pages, settings, orders).</p>
                        </div>
                        <div className="p-3 bg-white dark:bg-black/20 rounded-xl border border-primary/10">
                          <p className="font-bold mb-1">How to Restore:</p>
                          <p className="text-xs text-muted-foreground">Select your .json file and click 'Restore Database'. This will overwrite current data. <span className="text-destructive font-bold underline">Danger!</span></p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl border-blue-500/20 bg-blue-500/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-blue-600"><Archive className="h-5 w-5" /> Image Backup</CardTitle>
                        <CardDescription>Located in System → Image Backup</CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm space-y-4">
                        <div className="p-3 bg-white dark:bg-black/20 rounded-xl border border-blue-500/10">
                          <p className="font-bold mb-1">How to Backup:</p>
                          <p className="text-xs text-muted-foreground">Click 'Download Images ZIP' to archive all uploaded photos (logos, service images, portfolio).</p>
                        </div>
                        <div className="p-3 bg-white dark:bg-black/20 rounded-xl border border-blue-500/10">
                          <p className="font-bold mb-1">How to Restore:</p>
                          <p className="text-xs text-muted-foreground">Upload your ZIP. The system safely backups old images before extracting. If it fails, it rolls back automatically.</p>
                        </div>
                    </CardContent>
                </Card>
             </div>
          </TabsContent>
        </Tabs>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="rounded-2xl">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><HardDrive className="h-5 w-5 text-primary" /> Folder Structure</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="font-mono text-sm space-y-1 text-primary p-4 bg-muted/30 rounded-xl">
                        <p>public/</p>
                        <p>└── uploads/ <span className="text-slate-500">(MUST exist & be 775)</span></p>
                        <p className="ml-8 text-xs text-slate-400">├── site/ <span className="text-[10px]">(Logos/Favicons)</span></p>
                        <p className="ml-8 text-xs text-slate-400">├── services/ <span className="text-[10px]">(Service Icons)</span></p>
                        <p className="ml-8 text-xs text-slate-400">└── portfolio/ <span className="text-[10px]">(Work images)</span></p>
                    </div>
                </CardContent>
            </Card>

            <Card className="rounded-2xl">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" /> Production .env</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="p-4 bg-slate-100 dark:bg-white/5 rounded-xl font-mono text-[10px] space-y-2">
                        <div className="flex justify-between border-b pb-1 border-black/5"><span>MYSQL_HOST</span><span className="text-primary font-bold">localhost</span></div>
                        <div className="flex justify-between border-b pb-1 border-black/5"><span>MYSQL_USER</span><span className="text-primary font-bold">your_db_user</span></div>
                        <div className="flex justify-between border-b pb-1 border-black/5"><span>MYSQL_PASSWORD</span><span className="text-primary font-bold">your_db_pass</span></div>
                        <div className="flex justify-between border-b pb-1 border-black/5"><span>MYSQL_DATABASE</span><span className="text-primary font-bold">your_db_name</span></div>
                        <div className="flex justify-between"><span>AUTH_SECRET</span><span className="text-primary font-bold">random_long_string</span></div>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}

function Step({ number, title, description, children }: { number: string; title: string; description: string; children?: React.ReactNode }) {
  return (
    <div className="flex gap-6">
      <div className="h-10 w-10 rounded-2xl bg-primary text-white flex items-center justify-center flex-shrink-0 font-black text-lg shadow-lg shadow-primary/20 italic">
        {number}
      </div>
      <div className="flex-1 pt-1">
        <p className="font-black text-lg tracking-tight uppercase italic">{title}</p>
        <p className="text-sm text-muted-foreground font-medium">{description}</p>
        {children}
      </div>
    </div>
  );
}
