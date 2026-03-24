
import { Metadata } from 'next';
import { ShoppingBag } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { APP_NAME } from '@/lib/config';
import { getOrders } from '@/app/checkout/actions';
import { cn } from '@/lib/utils';
import OrdersTableActions from './OrdersTableActions';

export const metadata: Metadata = {
  title: `Orders | ${APP_NAME}`,
  robots: {
    index: false,
    follow: false,
  },
};

export default async function OrdersPage() {
  const orders = await getOrders();

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Orders</h1>
        <p className="text-muted-foreground">Here are all the successful payments from your customers.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Orders</CardTitle>
          <CardDescription>
            {orders.length > 0
              ? `You have received ${orders.length} order(s).`
              : 'You have no orders yet.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead className="hidden md:table-cell">Status</TableHead>
                <TableHead className="hidden md:table-cell">
                  Date
                </TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">
                    <div className="font-bold">{order.customer_name}</div>
                    <div className="text-sm text-muted-foreground">{order.customer_email}</div>
                  </TableCell>
                  <TableCell>
                    {order.plan_title}
                  </TableCell>
                  <TableCell>
                    ₹{Number(order.amount).toLocaleString()}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant={order.status === 'completed' ? 'default' : 'destructive'}>
                        {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {order.created_at}
                  </TableCell>
                   <TableCell>
                    <OrdersTableActions order={order} />
                  </TableCell>
                </TableRow>
              ))}
              {orders.length === 0 && (
                <TableRow>
                    <TableCell colSpan={7} className="text-center h-24">No orders yet.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
