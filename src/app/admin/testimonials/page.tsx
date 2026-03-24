
import { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { APP_NAME } from '@/lib/config';
import { getTestimonials, Testimonial } from './actions';
import Link from 'next/link';
import { Edit, PlusCircle, Star } from 'lucide-react';
import DeleteTestimonialButton from './DeleteTestimonialButton';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export const metadata: Metadata = {
  title: `Testimonials | ${APP_NAME}`,
  robots: { index: false, follow: false },
};

function StarRating({ rating }: { rating: number }) {
    return (
        <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
            <Star
            key={i}
            className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
            />
        ))}
        </div>
    );
}


export default async function TestimonialsPage() {
  const testimonials = await getTestimonials();

  return (
    <div className="w-full">
        <div className="flex justify-between items-center mb-6">
            <div>
                <h1 className="text-3xl font-bold">Testimonials</h1>
                <p className="text-muted-foreground">Manage customer reviews for your website.</p>
            </div>
            <Button asChild>
                <Link href="/admin/testimonials/add">
                    <PlusCircle className="mr-2 h-4 w-4" /> Add New
                </Link>
            </Button>
        </div>

      <Card>
        <CardHeader>
          <CardTitle>All Reviews</CardTitle>
          <CardDescription>
            {testimonials.length > 0 ? `You have ${testimonials.length} testimonial(s).` : 'You have no testimonials yet.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {testimonials.map((testimonial) => (
                <TableRow key={testimonial.id}>
                  <TableCell>
                    <Avatar>
                        <AvatarImage src={testimonial.image || undefined} alt={testimonial.name} />
                        <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell className="font-medium">{testimonial.name}</TableCell>
                  <TableCell>
                    <StarRating rating={testimonial.rating} />
                  </TableCell>
                  <TableCell className='max-w-sm truncate'>{testimonial.description}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                        <Button asChild variant="outline" size="sm">
                            <Link href={`/admin/testimonials/edit/${testimonial.id}`}>
                                <Edit className="mr-2 h-4 w-4" /> Edit
                            </Link>
                        </Button>
                        <DeleteTestimonialButton id={testimonial.id} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {testimonials.length === 0 && (
                <TableRow>
                    <TableCell colSpan={5} className="text-center h-24">No testimonials yet.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
