
'use server';
/**
 * @fileOverview An AI flow to generate SEO content for a specific service category within a specific area of a city.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateAreaCategorySeoInputSchema = z.object({
  areaName: z.string().describe("The name of the specific area or locality, e.g., 'Whitefield'."),
  cityName: z.string().describe("The name of the parent city, e.g., 'Bangalore'."),
  categoryName: z.string().describe("The name of the service category, e.g., 'Carpentry'."),
});
export type GenerateAreaCategorySeoInput = z.infer<typeof GenerateAreaCategorySeoInputSchema>;

const GenerateAreaCategorySeoOutputSchema = z.object({
  h1_title: z.string().describe("An H1 title optimized for the area-category page. Format: '{{categoryName}} Services in {{areaName}} – Professional Technicians Near You'"),
  meta_title: z.string().describe("An SEO-optimized meta title, under 60 characters. Format: '{{categoryName}} Services in {{areaName}} | Book Local Experts Near Me'"),
  meta_description: z.string().describe("An SEO-optimized meta description, under 160 characters. Should be a compelling summary that encourages clicks, mentioning the area, category, and key services."),
  meta_keywords: z.string().describe("A comma-separated string of 10 relevant SEO keywords for the area-category combination. Must include variations like '{{categoryName}} services {{areaName}}', '{{areaName}} {{categoryName}}', '{{categoryName}} near me {{areaName}}', and specific services relevant to the category."),
});
export type GenerateAreaCategorySeoOutput = z.infer<typeof GenerateAreaCategorySeoOutputSchema>;

export async function generateAreaCategorySeo(input: GenerateAreaCategorySeoInput): Promise<GenerateAreaCategorySeoOutput> {
  return generateAreaCategorySeoFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateAreaCategorySeoPrompt',
  input: { schema: GenerateAreaCategorySeoInputSchema },
  output: { schema: GenerateAreaCategorySeoOutputSchema },
  prompt: `You are an expert SEO copywriter for a service-provider connection platform called "FixBro".

FixBro helps users discover and connect with local professionals across many service categories. The platform does NOT provide services — it enables direct communication between users and providers.

Generate hyper-local SEO content for a category page targeting a specific area within a city.

Area Name: {{areaName}}
City Name: {{cityName}}
Category Name: {{categoryName}}

Guidelines:
- Focus on discovery and connection intent
- Avoid wording about booking, guarantees, or service execution
- Keep titles concise and optimized for local search
- Mention area, city, and category naturally

Generate:

1. **h1_title**
Format:
"Connect with {{categoryName}} Professionals in {{areaName}}, {{cityName}}"

2. **meta_title**
- Under 60 characters
Format:
"{{categoryName}} in {{areaName}} | FixBro"

3. **meta_description**
- Under 160 characters
- Encourage discovery and connection
- Mention category + area + city
Example direction:
"Find and connect with {{categoryName}} professionals in {{areaName}}, {{cityName}}. Explore providers and contact directly through FixBro."

4. **meta_keywords**
- Comma-separated
- 10 keywords including:
  "{{categoryName}} {{areaName}}"
  "{{categoryName}} {{cityName}}"
  "connect {{categoryName}} {{areaName}}"
  "{{areaName}} {{categoryName}} providers"
  "{{categoryName}} near me"

Return the response as a valid JSON object matching the schema.
`,
});


const generateAreaCategorySeoFlow = ai.defineFlow(
  {
    name: 'generateAreaCategorySeoFlow',
    inputSchema: GenerateAreaCategorySeoInputSchema,
    outputSchema: GenerateAreaCategorySeoOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error("AI failed to generate a valid SEO response for the area-category.");
    }
    return output;
  }
);
