
import { Metadata } from 'next';
import { APP_NAME } from '@/lib/config';
import { Terminal, Globe, ShieldCheck, FolderSync, Info, Rocket, Server, HardDrive, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export const metadata: Metadata = {
  title: `Deployment Guide | ${APP_NAME}`,
  robots: { index: false, follow: false },
};

export default function DeploymentGuidePage() {
  return (
    <div className="w-full pb-20">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl">Hosting & Deployment Guide</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Instructions for deploying your Next.js project with MySQL and Local Storage.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Critical Info: Build vs Export */}
        <Alert variant="destructive" className="bg-destructive/5 border-destructive/20">
            <AlertTriangle className="h-5 w-5" />
            <AlertTitle className="font-black text-lg">Important: Supported Build Mode</AlertTitle>
            <AlertDescription className="mt-2 space-y-2">
                <p>This website uses <strong>Server-Side Logic</strong> (MySQL Database, Admin Panel, and Local File Uploads).</p>
                <ul className="list-disc ml-6">
                    <li><span className="font-bold">❌ Static Export (next export) is NOT supported:</span> Because the site needs a real-time database and file system.</li>
                    <li><span className="font-bold text-green-600 dark:text-green-400">✅ Standard Build (next build) IS REQUIRED:</span> You must run the project as a Node.js application.</li>
                </ul>
            </AlertDescription>
        </Alert>

        <Tabs defaultValue="vps" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8 h-12">
            <TabsTrigger value="vps" className="text-lg font-bold"><Server className="mr-2 h-5 w-5" /> VPS Hosting (Recommended)</TabsTrigger>
            <TabsTrigger value="shared" className="text-lg font-bold"><Globe className="mr-2 h-5 w-5" /> Shared Node.js Hosting</TabsTrigger>
          </TabsList>

          <TabsContent value="vps" className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Rocket className="h-5 w-5 text-primary" /> Step-by-Step VPS Deployment</CardTitle>
                    <CardDescription>Best for performance and full control (Ubuntu/Debian).</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4">
                        <div className="flex gap-4">
                            <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0 font-bold">1</div>
                            <div>
                                <p className="font-bold">Prepare Server</p>
                                <p className="text-sm text-muted-foreground">Install Node.js (v18+), MySQL, and Nginx.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0 font-bold">2</div>
                            <div>
                                <p className="font-bold">Upload Code</p>
                                <p className="text-sm text-muted-foreground">Use <code>git clone</code> or SFTP to move your project to <code>/var/www/your-site</code>.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0 font-bold">3</div>
                            <div className="flex-1">
                                <p className="font-bold">Build the Project</p>
                                <div className="mt-2 p-3 bg-slate-950 text-slate-50 rounded-lg font-mono text-xs">
                                    <p>npm install</p>
                                    <p>npm run build</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0 font-bold">4</div>
                            <div className="flex-1">
                                <p className="font-bold">Set Permissions & Run (PM2)</p>
                                <div className="mt-2 p-3 bg-slate-950 text-slate-50 rounded-lg font-mono text-xs">
                                    <p># Grant storage access</p>
                                    <p>chmod -R 755 public/uploads</p>
                                    <p># Start with Process Manager</p>
                                    <p>pm2 start npm --name "cineelite" -- start</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="shared" className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5 text-primary" /> Shared Node.js Deployment</CardTitle>
                    <CardDescription>Common for Hostinger, A2Hosting, etc. (Must support Node.js).</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4">
                        <div className="flex gap-4">
                            <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0 font-bold">1</div>
                            <div>
                                <p className="font-bold">Locally Build First</p>
                                <p className="text-sm text-muted-foreground">Run <code>npm run build</code> on your computer before uploading.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0 font-bold">2</div>
                            <div>
                                <p className="font-bold">Upload Essential Files</p>
                                <p className="text-sm text-muted-foreground">Upload these folders/files: <code>.next</code>, <code>public</code>, <code>package.json</code>, <code>next.config.ts</code>.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0 font-bold">3</div>
                            <div>
                                <p className="font-bold">Setup Node.js App</p>
                                <p className="text-sm text-muted-foreground">In cPanel, use "Setup Node.js App". Select the path and "Application startup file" as <code>server.js</code> (if provided) or set script to <code>start</code>.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0 font-bold">4</div>
                            <div>
                                <p className="font-bold">Set Permissions</p>
                                <p className="text-sm text-muted-foreground">Use File Manager to set <code>public/uploads</code> to <strong>755</strong>.</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><HardDrive className="h-5 w-5 text-primary" /> Required Folders</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="font-mono text-sm space-y-1 text-primary">
                        <p>public/</p>
                        <p>└── uploads/ <span className="text-slate-500">(MUST exist & be writable)</span></p>
                        <p className="ml-8 text-xs text-slate-400">├── home/</p>
                        <p className="ml-8 text-xs text-slate-400">├── services/</p>
                        <p className="ml-8 text-xs text-slate-400">└── portfolio/</p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" /> Production .env</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="p-4 bg-slate-100 dark:bg-white/5 rounded-lg font-mono text-[10px] space-y-1">
                        <p>MYSQL_HOST=...</p>
                        <p>MYSQL_USER=...</p>
                        <p>MYSQL_PASSWORD=...</p>
                        <p>MYSQL_DATABASE=...</p>
                        <p>AUTH_SECRET=...</p>
                        <p>NEXT_PUBLIC_APP_NAME=CineElite ADS</p>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
