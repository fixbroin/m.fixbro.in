
import { Metadata } from 'next';
import { Mail } from 'lucide-react';
import { getSubmissions } from '@/app/contact/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { APP_NAME } from '@/lib/config';
import SubmissionsTableActions from './SubmissionsTableActions';

export const metadata: Metadata = {
  title: `Contact Submissions | ${APP_NAME}`,
  robots: {
    index: false,
    follow: false,
  },
};

export default async function SubmissionsPage() {
  const submissions = await getSubmissions();

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Contact Form Submissions</h1>
        <p className="text-muted-foreground">Here are the messages you've received through your website's contact form.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inbox</CardTitle>
          <CardDescription>
            {submissions.length > 0
              ? `You have ${submissions.length} new message(s).`
              : 'You have no new messages.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden w-[100px] sm:table-cell">
                  <span className="sr-only"></span>
                </TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Message</TableHead>
                <TableHead className="hidden md:table-cell">Budget</TableHead>
                <TableHead className="hidden md:table-cell">
                  Submitted At
                </TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell className="hidden sm:table-cell">
                    <Mail className="h-6 w-6 text-muted-foreground" />
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="font-bold">{submission.name}</div>
                    <div className="text-sm text-muted-foreground">{submission.email}</div>
                    <div className="text-sm text-muted-foreground">{submission.phone}</div>
                  </TableCell>
                  <TableCell>
                    <p className="max-w-xs truncate">{submission.message}</p>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant="outline">{submission.budget || 'N/A'}</Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {submission.created_at}
                  </TableCell>
                  <TableCell>
                    <SubmissionsTableActions submission={submission} />
                  </TableCell>
                </TableRow>
              ))}
              {submissions.length === 0 && (
                <TableRow>
                    <TableCell colSpan={6} className="text-center h-24">No submissions yet.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
