'use server';
/**
 * @fileOverview An AI flow to generate SEO content for a main service category page.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateCategorySeoInputSchema = z.object({
  categoryName: z.string().describe("The name of the service category, e.g., 'Carpentry' or 'AC Repair'."),
});
export type GenerateCategorySeoInput = z.infer<typeof GenerateCategorySeoInputSchema>;

const GenerateCategorySeoOutputSchema = z.object({
  h1_title: z.string().describe("An H1 title optimized for the category page. Format: '{{categoryName}} Services Near You – Professional Technicians'"),
  seo_title: z.string().describe("An SEO-optimized meta title, under 60 characters. Format: '{{categoryName}} Services | Find Local Experts Near You'"),
  meta_description: z.string().describe("An SEO-optimized meta description, under 160 characters. Should be a compelling summary that encourages clicks, mentioning the category and the benefit of finding local pros."),
  meta_keywords: z.string().describe("A comma-separated string of 10 relevant SEO keywords for the category. Must include variations like '{{categoryName}} services', '{{categoryName}} near me', 'local {{categoryName}} pros', and specific services relevant to the category."),
  imageHint: z.string().describe("One or two keywords for an AI image search for the category's main image. E.g., 'carpentry tools' or 'clean living room'. Max 50 characters."),
});
export type GenerateCategorySeoOutput = z.infer<typeof GenerateCategorySeoOutputSchema>;

export async function generateCategorySeo(input: GenerateCategorySeoInput): Promise<GenerateCategorySeoOutput> {
  return generateCategorySeoFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateCategorySeoPrompt',
  input: { schema: GenerateCategorySeoInputSchema },
  output: { schema: GenerateCategorySeoOutputSchema },
  prompt: `You are an expert SEO copywriter for a service-provider connection platform called "FixBro".

FixBro helps users discover and connect with local professionals. The platform does NOT deliver services — it enables users to find and contact providers directly.

Generate optimized SEO content for a general category page (not specific to any city).

Category Name: {{categoryName}}

Guidelines:
- Focus on discovery and connection intent.
- Avoid any mention of specific cities or locations.
- The content should be generic and applicable nationwide.
- Avoid wording about booking, guarantees, or service delivery by the platform.
- Keep content natural and SEO-friendly.

Generate:

1. **h1_title**
Format:
"Find {{categoryName}} Professionals Near You"

2. **seo_title**
- Under 60 characters
Format:
"{{categoryName}} Services | Find Local Pros | FixBro"

3. **seo_description**
- Under 160 characters
- Encourage discovery and connection.
- No booking language.
Example direction:
"Looking for {{categoryName}} services? Find and connect with skilled, local professionals for your project on FixBro. Browse profiles and contact them directly."

4. **seo_keywords**
- Comma-separated
- 10 keywords
- Must include:
  "{{categoryName}} services"
  "{{categoryName}} near me"
  "local {{categoryName}} providers"
  "connect with {{categoryName}} professionals"
  "best {{categoryName}} experts"

5. **imageHint**
- One or two keywords for an AI image search.
- Should visually represent the "{{categoryName}}" category.
- Example for "Carpentry": "carpentry tools"
- Example for "Home Cleaning": "clean living room"

Return the entire response as a valid JSON object matching the schema.
`,
});


const generateCategorySeoFlow = ai.defineFlow(
  {
    name: 'generateCategorySeoFlow',
    inputSchema: GenerateCategorySeoInputSchema,
    outputSchema: GenerateCategorySeoOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error("AI failed to generate a valid SEO response for the category.");
    }
    return output;
  }
);
