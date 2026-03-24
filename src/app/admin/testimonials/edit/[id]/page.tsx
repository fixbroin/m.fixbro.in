
import { notFound, redirect } from "next/navigation";
import { getTestimonial, updateTestimonial } from "../../actions";
import TestimonialForm from "../../TestimonialForm";

export default async function EditTestimonialPage({ params }: { params: { id: string } }) {
  const testimonial = await getTestimonial(params.id);

  if (!testimonial) {
    notFound();
  }

  async function handleUpdate(data: any) {
    'use server'
    const result = await updateTestimonial(params.id, data);
    if (result.success) {
      redirect('/admin/testimonials');
    } else {
      return result;
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Edit Testimonial</h1>
        <p className="text-muted-foreground">Update the details for this review.</p>
      </div>
      <TestimonialForm
        onSave={handleUpdate}
        initialData={testimonial}
      />
    </div>
  );
}
