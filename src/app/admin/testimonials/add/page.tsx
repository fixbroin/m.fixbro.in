
import TestimonialForm from "../TestimonialForm";
import { addTestimonial } from "../actions";
import { redirect } from 'next/navigation';

export default function AddTestimonialPage() {
    
  async function handleSave(data: any) {
    'use server'
    const result = await addTestimonial(data);
    if (result.success) {
      redirect('/admin/testimonials');
    } else {
      // The form will display the error
      return result;
    }
  }

  return (
    <div>
      <div className="mb-6">
          <h1 className="text-3xl font-bold">Add New Testimonial</h1>
          <p className="text-muted-foreground">Fill in the details below to add a new review to your website.</p>
      </div>
      <TestimonialForm
        onSave={handleSave}
        initialData={{ name: '', description: '', rating: 5, image: '' }}
      />
    </div>
  );
}
