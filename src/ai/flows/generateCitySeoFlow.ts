
'use server';
/**
 * @fileOverview An AI flow to generate SEO content for a city page.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateCitySeoInputSchema = z.object({
  cityName: z.string().describe("The name of the city, e.g., 'Bangalore' or 'Whitefield'."),
});
export type GenerateCitySeoInput = z.infer<typeof GenerateCitySeoInputSchema>;

const GenerateCitySeoOutputSchema = z.object({
  h1_title: z.string().describe("An H1 title optimized for the city page. Format: 'Best Home Services in {{cityName}} – Expert Technicians Near You'"),
  seo_title: z.string().describe("An SEO-optimized meta title, under 60 characters. Format: 'Home Services in {{cityName}} | Carpentry, Plumbing, Electricians Near Me'"),
  seo_description: z.string().describe("An SEO-optimized meta description, under 160 characters. Should be a compelling summary that encourages clicks, mentioning key services and the city name."),
  seo_keywords: z.string().describe("A comma-separated string of 10 relevant SEO keywords for the city. Must include variations like '{{cityName}} home services', 'home repair {{cityName}}', 'carpentry near me', 'electricians in {{cityName}}', and 'plumbers near you'."),
});
export type GenerateCitySeoOutput = z.infer<typeof GenerateCitySeoOutputSchema>;

export async function generateCitySeo(input: GenerateCitySeoInput): Promise<GenerateCitySeoOutput> {
  return generateCitySeoFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateCitySeoPrompt',
  input: { schema: GenerateCitySeoInputSchema },
  output: { schema: GenerateCitySeoOutputSchema },
  prompt: `You are an expert SEO copywriter for a service-provider connection platform called "FixBro".

FixBro helps users discover and connect with local professionals across multiple service categories. The platform does NOT deliver services — it enables direct contact between users and providers.

Generate SEO content for a city landing page.

City Name: {{cityName}}

Guidelines:
- Focus on discovery and connection intent
- Mention multiple service categories naturally
- Avoid wording about booking or service guarantees
- Keep titles concise and SEO-friendly

Generate:

1. **h1_title**
Format:
"Connect with Local Service Providers in {{cityName}}"

2. **seo_title**
- Under 60 characters
Format:
"Service Providers in {{cityName}} | FixBro"

3. **seo_description**
- Under 160 characters
- Mention multiple categories
- Encourage discovery and connection
Example direction:
"Find carpenters, plumbers, electricians and more in {{cityName}}. Discover professionals and connect directly through FixBro."

4. **seo_keywords**
- Comma-separated
- 10 keywords
- Must include:
  "{{cityName}} service providers"
  "connect professionals {{cityName}}"
  "home services {{cityName}}"
  "carpenters {{cityName}}"
  "electricians {{cityName}}"
  "plumbers {{cityName}}"

Return the response as a valid JSON object matching the schema.
`,
});


const generateCitySeoFlow = ai.defineFlow(
  {
    name: 'generateCitySeoFlow',
    inputSchema: GenerateCitySeoInputSchema,
    outputSchema: GenerateCitySeoOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error("AI failed to generate a valid SEO response for the city.");
    }
    return output;
  }
);
