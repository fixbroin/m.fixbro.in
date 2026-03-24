
import { Metadata } from 'next';
import { APP_NAME } from '@/lib/config';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, IndianRupee, ShoppingBag } from 'lucide-react';
import { getSubmissions } from '@/app/contact/actions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import SubmissionsTableActions from '../submissions/SubmissionsTableActions';
import { getOrders } from '@/app/checkout/actions';

export const metadata: Metadata = {
  title: `Dashboard | Admin | ${APP_NAME}`,
};

export default async function AdminDashboardPage() {
  const submissions = await getSubmissions();
  const recentSubmissions = submissions.slice(0, 5);

  const orders = await getOrders();
  const successfulOrders = orders.filter(o => o.status === 'completed');
  const totalRevenue = successfulOrders.reduce((acc, order) => acc + Number(order.amount), 0);


  return (
    <div className="w-full space-y-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">Welcome to the admin panel. Here's a summary of your website.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalRevenue.toLocaleString()}</div>
             <p className="text-xs text-muted-foreground">
              From successful payments.
            </p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sales</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{successfulOrders.length}</div>
            <p className="text-xs text-muted-foreground">
              Total number of plans sold.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{submissions.length}</div>
            <p className="text-xs text-muted-foreground">
              Total contact form submissions received.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 grid-cols-1 xl:grid-cols-2">
        <Card className='xl:col-span-2'>
            <CardHeader>
                <CardTitle>Recent Enquiries</CardTitle>
                <CardDescription>
                    The last 5 messages received from the contact form.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Customer</TableHead>
                            <TableHead>Message</TableHead>
                            <TableHead className="hidden md:table-cell">Budget</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                    {recentSubmissions.map((submission) => (
                        <TableRow key={submission.id}>
                        <TableCell>
                            <div className="font-medium">{submission.name}</div>
                            <div className="hidden text-sm text-muted-foreground md:inline">
                            {submission.email}
                            </div>
                        </TableCell>
                        <TableCell>
                            <p className="max-w-xs truncate">{submission.message}</p>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                            <Badge variant="outline">{submission.budget || 'N/A'}</Badge>
                        </TableCell>
                         <TableCell>
                            <SubmissionsTableActions submission={submission} />
                        </TableCell>
                        </TableRow>
                    ))}
                    {recentSubmissions.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center h-24">No submissions yet.</TableCell>
                        </TableRow>
                    )}
                    </TableBody>
              </Table>
            </CardContent>
            <div className="p-6 pt-0 text-center">
                 <Button asChild variant="outline">
                    <Link href="/admin/submissions">View All Submissions</Link>
                </Button>
            </div>
        </Card>
      </div>
    </div>
  );
}
