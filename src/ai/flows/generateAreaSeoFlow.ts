
'use server';
/**
 * @fileOverview An AI flow to generate SEO content for a specific service area within a city.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateAreaSeoInputSchema = z.object({
  areaName: z.string().describe("The name of the specific area or locality, e.g., 'Whitefield'."),
  cityName: z.string().describe("The name of the parent city, e.g., 'Bangalore'."),
});
export type GenerateAreaSeoInput = z.infer<typeof GenerateAreaSeoInputSchema>;

const GenerateAreaSeoOutputSchema = z.object({
  h1_title: z.string().describe("An H1 title optimized for the area page. Format: 'Top Home Services in {{areaName}} – Fixbro Near You'"),
  seo_title: z.string().describe("An SEO-optimized meta title, under 60 characters. Format: '{{areaName}} Home Services – Electrician, Plumber, Carpenter Near Me'"),
  seo_description: z.string().describe("An SEO-optimized meta description, under 160 characters. Should be a compelling summary that encourages clicks, mentioning the area, parent city, and key services."),
  seo_keywords: z.string().describe("A comma-separated string of 10 relevant SEO keywords for the area. Must include variations like '{{areaName}} home services', 'electrician in {{areaName}}', 'plumber near {{areaName}}', 'carpenter near me', and 'home repair {{areaName}}'."),
});
export type GenerateAreaSeoOutput = z.infer<typeof GenerateAreaSeoOutputSchema>;

export async function generateAreaSeo(input: GenerateAreaSeoInput): Promise<GenerateAreaSeoOutput> {
  return generateAreaSeoFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateAreaSeoPrompt',
  input: { schema: GenerateAreaSeoInputSchema },
  output: { schema: GenerateAreaSeoOutputSchema },
  prompt: `You are an expert SEO copywriter for a service-provider connection platform called "FixBro".

FixBro helps users discover and connect with local professionals across many service categories. The platform does NOT deliver services — it enables direct communication between users and providers.

Generate SEO content for a hyper-local area page.

Area Name: {{areaName}}
City Name: {{cityName}}

Guidelines:
- Focus on discovery and connection intent
- Avoid wording about booking, guarantees, or service execution
- Mention multiple categories naturally
- Be concise and optimized for search engines

Generate:

1. **h1_title**
Format:
"Connect with Service Providers in {{areaName}}, {{cityName}}"

2. **seo_title**
- Under 60 characters
Format:
"Providers in {{areaName}} | FixBro"

3. **seo_description**
- Under 160 characters
- Mention area + city + categories
- Encourage discovery and connection
Example direction:
"Find plumbers, electricians, carpenters and more in {{areaName}}, {{cityName}}. Discover professionals and connect directly through FixBro."

4. **seo_keywords**
- Comma-separated
- 10 keywords including:
  "{{areaName}} service providers"
  "connect professionals {{areaName}}"
  "home services {{areaName}}"
  "electrician {{areaName}}"
  "plumber {{areaName}}"
  "carpenter {{areaName}}"

Return the response as a valid JSON object matching the schema.
`,
});


const generateAreaSeoFlow = ai.defineFlow(
  {
    name: 'generateAreaSeoFlow',
    inputSchema: GenerateAreaSeoInputSchema,
    outputSchema: GenerateAreaSeoOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error("AI failed to generate a valid SEO response for the area.");
    }
    return output;
  }
);
