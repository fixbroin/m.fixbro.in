
'use server';

import db from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { revalidatePath, unstable_cache, revalidateTag } from 'next/cache';
import { cache } from 'react';
import * as z from 'zod';
import { notFound } from 'next/navigation';

// The schema is now defined in TestimonialForm.tsx
const testimonialSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  description: z.string().min(10, 'Review must be at least 10 characters.'),
  rating: z.coerce.number().min(1).max(5),
  image: z.string().url().optional().or(z.literal('')),
});

export type Testimonial = z.infer<typeof testimonialSchema> & {
  id: string;
  createdAt: string;
};
export type TestimonialFormData = z.infer<typeof testimonialSchema>;

export async function addTestimonial(data: TestimonialFormData) {
  const validated = testimonialSchema.safeParse(data);
  if (!validated.success) {
    return { success: false, error: 'Invalid data provided.' };
  }
  try {
    const id = uuidv4();
    await db.query(
      'INSERT INTO testimonials (id, clientName, content, rating, imageUrl) VALUES (?, ?, ?, ?, ?)',
      [id, validated.data.name, validated.data.description, validated.data.rating, validated.data.image || '']
    );
    revalidateTag('testimonials-list');
    revalidatePath('/admin/testimonials');
    revalidatePath('/'); // For home page
    return { success: true };
  } catch (error) {
    console.error('Failed to add testimonial:', error);
    return { success: false, error: 'Failed to add testimonial.' };
  }
}

export const getTestimonials = cache(async (): Promise<Testimonial[]> => {
    return await unstable_cache(
        async () => {
            try {
                const rows: any = await db.query('SELECT * FROM testimonials ORDER BY createdAt DESC');

                if (rows.length === 0) {
                    const id = uuidv4();
                    const defaultTestimonial = {
                        id,
                        clientName: 'Jane Doe',
                        content: 'This is a fantastic service! Highly recommended to everyone looking for a professional website.',
                        rating: 5,
                        imageUrl: ''
                    };
                    await db.query(
                      'INSERT INTO testimonials (id, clientName, content, rating, imageUrl) VALUES (?, ?, ?, ?, ?)',
                      [defaultTestimonial.id, defaultTestimonial.clientName, defaultTestimonial.content, defaultTestimonial.rating, defaultTestimonial.imageUrl]
                    );
                    const newRows: any = await db.query('SELECT * FROM testimonials ORDER BY createdAt DESC');
                    return newRows.map((row: any) => ({
                      id: row.id,
                      name: row.clientName,
                      description: row.content,
                      rating: Number(row.rating),
                      image: row.imageUrl || '',
                      createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : new Date(row.createdAt).toISOString(),
                    }));
                }
                
                return rows.map((row: any) => ({
                    id: row.id,
                    name: row.clientName,
                    description: row.content,
                    rating: Number(row.rating),
                    image: row.imageUrl || '',
                    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : new Date(row.createdAt).toISOString(),
                }));
            } catch (error) {
                console.error('Failed to fetch testimonials:', error);
                return [];
            }
        },
        ['testimonials-list'],
        { tags: ['settings', 'testimonials-list'], revalidate: 86400 }
    )();
});

export async function getTestimonial(id: string): Promise<TestimonialFormData | null> {
  try {
    const rows: any = await db.query('SELECT * FROM testimonials WHERE id = ?', [id]);
    if (rows.length === 0) {
      notFound();
    }
    const data = rows[0];
    return {
        name: data.clientName,
        description: data.content,
        rating: Number(data.rating),
        image: data.imageUrl || '',
    };
  } catch (error) {
    console.error('Failed to get testimonial:', error);
    return null;
  }
}

export async function updateTestimonial(id: string, data: TestimonialFormData) {
  const validated = testimonialSchema.safeParse(data);
  if (!validated.success) {
    return { success: false, error: 'Invalid data provided.' };
  }
  try {
    await db.query(
      'UPDATE testimonials SET clientName = ?, content = ?, rating = ?, imageUrl = ? WHERE id = ?',
      [validated.data.name, validated.data.description, validated.data.rating, validated.data.image || '', id]
    );
    revalidateTag('testimonials-list');
    revalidatePath('/admin/testimonials');
    revalidatePath(`/admin/testimonials/edit/${id}`);
    revalidatePath('/'); // For home page
    return { success: true };
  } catch (error) {
    console.error('Failed to update testimonial:', error);
    return { success: false, error: 'Failed to update testimonial.' };
  }
}

export async function deleteTestimonial(id: string) {
  try {
    await db.query('DELETE FROM testimonials WHERE id = ?', [id]);
    revalidateTag('testimonials-list');
    revalidatePath('/admin/testimonials');
    revalidatePath('/'); // For home page
    return { success: true };
  } catch (error) {
    console.error('Failed to delete testimonial:', error);
    return { success: false, error: 'Failed to delete testimonial.' };
  }
}
