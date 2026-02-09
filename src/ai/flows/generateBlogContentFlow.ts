'use server';
/**
 * @fileOverview An AI flow to generate comprehensive blog content and SEO metadata for home services in HTML format.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateBlogContentInputSchema = z.object({
  title: z.string().describe("The title of the blog post to generate content for."),
  categoryName: z.string().optional().describe("The optional category name for more specific SEO generation (e.g., Carpentry, Plumber, Electrician)."),
});
export type GenerateBlogContentInput = z.infer<typeof GenerateBlogContentInputSchema>;

const GenerateBlogContentOutputSchema = z.object({
  content: z.string().describe("The full blog post content, formatted in HTML with <h2>, <p>, <br>, and <ul> tags. Should be engaging, professional, and at least 400 words, aimed at homeowners. Include 5-7 sections with headers, benefits, service lists, tips, pricing estimates, and a footer with keywords."),
  h1_title: z.string().describe("An H1 title with the exact format: '{Title Name} Service Near You | Fixbro'"),
  meta_title: z.string().describe("A meta title with the format: '{Title Name} Near Me {Category Name} Near Me' or '{Title Name} | Home Services Near Me' if no category is provided."),
  meta_description: z.string().describe("An SEO-optimized meta description, under 160 characters, including relevant service keywords (e.g., Carpentry, Plumber, Electrician, Home Cleaning)."),
  meta_keywords: z.string().describe("A comma-separated string of SEO keywords, including the title, Bangalore, and service keywords like Carpentry near me, Plumber near me, etc."),
  imageHint: z.string().describe("One or two keywords for an AI image search for the blog's cover image. E.g., 'professional electrician' or 'home cleaning'. Max 50 characters."),
});
export type GenerateBlogContentOutput = z.infer<typeof GenerateBlogContentOutputSchema>;

export async function generateBlogContent(input: GenerateBlogContentInput): Promise<GenerateBlogContentOutput> {
  return generateBlogContentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateHomeServicesBlogPrompt',
  input: { schema: GenerateBlogContentInputSchema },
  output: { schema: GenerateBlogContentOutputSchema },
  prompt: `You are an expert SEO copywriter for a service-provider connection platform called "FixBro".

FixBro helps users discover and connect with local professionals across many service categories. The platform itself does NOT provide services — it enables direct communication between users and providers.

Your task is to generate an informative, engaging blog post with SEO metadata in HTML format based on a given title and optional category.

INPUT:
- Blog Post Title: {{title}}
- Category (optional): {{categoryName}}

INSTRUCTIONS:

1. **content**
Generate a blog post of at least 500 words using valid HTML tags:
<h2>, <p>, <br>, <ul>, <li>

Structure:

• Introduction explaining the topic importance (no claim FixBro performs services)

• Benefits of hiring experienced professionals
Use <p> with <strong> points separated by <br>

• Common services related to the topic
<ul><li> format starting with ✔️

• Tips for choosing the right provider
Mention checking reviews, experience, communication, etc.

• Typical price ranges (general guidance only)
Do NOT imply FixBro sets prices
Phrase as:
"Typical market ranges may vary by provider and location"

• DIY tips or common mistakes
<ul><li> ✔️ format

• Conclusion section encouraging readers to discover and connect with providers through FixBro
Mention multiple categories naturally
Do NOT say “book FixBro services”

• Final footer section:
<h2>Related Services and Keywords</h2>
<p>
Comma-separated keywords including:
{{title}}, service providers near me, connect professionals, carpentry, plumbing, electrician, cleaning services
</p>

Formatting Rules:
- No markdown
- Proper HTML closing
- Conversational professional tone
- City references optional and generic (avoid hardcoding Bangalore unless relevant)
- Never claim platform performs work
- Never mention competitors

---

2. **h1_title**
Format:
"{{title}} | Connect with Professionals via FixBro"

---

3. **meta_title**
Under 60 chars

If category exists:
"{{title}} | {{categoryName}} Near Me"

Else:
"{{title}} | Local Service Providers"

---

4. **meta_description**
Under 160 characters
Encourage discovery/connection
No booking language

---

5. **meta_keywords**
Comma-separated including:
{{title}}, service providers, connect professionals, local technicians, {{categoryName}} near me

---

6. **imageHint**
1–2 descriptive keywords under 50 characters

Return a valid JSON object matching the schema.
`,
});


const generateBlogContentFlow = ai.defineFlow(
  {
    name: 'generateHomeServicesBlogFlow',
    inputSchema: GenerateBlogContentInputSchema,
    outputSchema: GenerateBlogContentOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error("AI failed to generate a valid blog post response.");
    }
    return output;
  }
);