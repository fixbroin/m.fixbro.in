
'use server';
/**
 * @fileOverview An AI flow to generate SEO content for a specific service category within a city.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateCityCategorySeoInputSchema = z.object({
  cityName: z.string().describe("The name of the city, e.g., 'Bangalore'."),
  categoryName: z.string().describe("The name of the service category, e.g., 'Carpentry'."),
});
export type GenerateCityCategorySeoInput = z.infer<typeof GenerateCityCategorySeoInputSchema>;

const GenerateCityCategorySeoOutputSchema = z.object({
  h1_title: z.string().describe("An H1 title optimized for the city-category page. Format: 'Best {{categoryName}} Services Near You in {{cityName}} – Book Expert Technicians'"),
  meta_title: z.string().describe("An SEO-optimized meta title, under 60 characters. Format: '{{categoryName}} Services in {{cityName}} | {{categoryName}} Near Me'"),
  meta_description: z.string().describe("An SEO-optimized meta description, under 160 characters. Should be a compelling summary that encourages clicks, mentioning key services within the category and the city."),
  meta_keywords: z.string().describe("A comma-separated string of 10 relevant SEO keywords for the city-category combination. Must include variations like '{{categoryName}} services {{cityName}}', '{{categoryName}} in {{cityName}}', '{{categoryName}} near me', and specific services if applicable (e.g., 'furniture repair bangalore' for Carpentry)."),
});
export type GenerateCityCategorySeoOutput = z.infer<typeof GenerateCityCategorySeoOutputSchema>;

export async function generateCityCategorySeo(input: GenerateCityCategorySeoInput): Promise<GenerateCityCategorySeoOutput> {
  return generateCityCategorySeoFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateCityCategorySeoPrompt',
  input: { schema: GenerateCityCategorySeoInputSchema },
  output: { schema: GenerateCityCategorySeoOutputSchema },
  prompt: `You are an expert SEO copywriter for a service-provider connection platform called "FixBro".

FixBro helps users discover and connect with local professionals. The platform does NOT deliver services — it enables users to find and contact providers directly.

Generate optimized SEO content for a category page targeting a specific city.

City Name: {{cityName}}
Category Name: {{categoryName}}

Guidelines:
- Use clear local-search intent
- Focus on discovery and connection
- Avoid wording about booking, guarantees, or service delivery by the platform
- Keep content natural and SEO-friendly

Generate:

1. **h1_title**
Format:
"Find {{categoryName}} Professionals in {{cityName}}"

2. **meta_title**
- Under 60 characters
Format:
"{{categoryName}} in {{cityName}} | FixBro"

3. **meta_description**
- Under 160 characters
- Encourage users to discover and connect with providers
- Mention category + city
- No booking language

4. **meta_keywords**
- Comma-separated
- 10 keywords
- Must include:
  "{{categoryName}} {{cityName}}"
  "connect {{categoryName}} {{cityName}}"
  "{{categoryName}} near me"
  "local {{categoryName}} providers"

Return the entire response as a valid JSON object matching the schema.
`,
});


const generateCityCategorySeoFlow = ai.defineFlow(
  {
    name: 'generateCityCategorySeoFlow',
    inputSchema: GenerateCityCategorySeoInputSchema,
    outputSchema: GenerateCityCategorySeoOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error("AI failed to generate a valid SEO response for the city-category.");
    }
    return output;
  }
);
