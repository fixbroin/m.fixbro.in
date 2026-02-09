'use server';
/**
 * @fileOverview An AI flow to generate a batch of realistic reviews for a service provider.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Input schema for generating reviews
const GenerateBulkReviewsInputSchema = z.object({
  providerName: z.string().describe("The name of the provider to generate reviews for."),
  categoryName: z.string().describe("The main service category the provider works in (e.g., Plumbing)."),
  numberOfReviews: z.coerce.number().int().min(1).max(20).describe("The number of reviews to generate (1-20)."),
});
export type GenerateBulkReviewsInput = z.infer<typeof GenerateBulkReviewsInputSchema>;

// Schema for a single generated review
const GeneratedReviewSchema = z.object({
  userName: z.string().describe("A realistic, common Indian name (e.g.,Srikanth Sachin Priya Sharma, Rohan Kumar)."),
  rating: z.number().min(3).max(5).describe("A rating between 3 and 5."),
  comment: z.string().describe("A realistic, concise review comment (10-80 words). Comments should be a mix of very positive, moderately positive, and neutral tones. They should sound natural and authentic."),
});

// Output schema for the flow
const GenerateBulkReviewsOutputSchema = z.object({
  reviews: z.array(GeneratedReviewSchema).describe("An array of generated reviews."),
});
export type GenerateBulkReviewsOutput = z.infer<typeof GenerateBulkReviewsOutputSchema>;


// The main function to be called from the frontend
export async function generateBulkReviews(input: GenerateBulkReviewsInput): Promise<GenerateBulkReviewsOutput> {
  return generateBulkReviewsFlow(input);
}


const generateReviewsPrompt = ai.definePrompt({
  name: 'generateBulkReviewsPrompt',
  input: { schema: GenerateBulkReviewsInputSchema },
  output: { schema: GenerateBulkReviewsOutputSchema },
  prompt: `You are an expert content generator for a service-provider connection platform called "FixBro".

FixBro helps users discover and connect with local professionals. The platform itself does NOT provide services — reviews reflect the user's experience interacting directly with a provider.

Your task is to generate realistic, natural customer reviews for a specific provider listed on the platform.

Provider Name: {{providerName}}
Service Category: {{categoryName}}

Generate exactly {{numberOfReviews}} unique reviews.

For each review provide:

1. **userName**
   - A realistic common Indian name
   - Mix male and female names

2. **rating**
   - Integer between 3 and 5
   - Distribution:
     - Mostly 4 and 5
     - Some 3s

3. **comment**
   - 10–80 words
   - Natural conversational tone
   - Variety of sentiments:
     - Very positive
     - Moderately positive
     - Neutral
   - Focus on:
     - Communication
     - Professional behavior
     - Skill level
     - Punctuality
     - Overall experience
   - DO NOT mention FixBro responsibility or guarantees
   - DO NOT sound marketing/promotional

Return the response as a single valid JSON object matching the schema.
`,
});


const generateBulkReviewsFlow = ai.defineFlow(
  {
    name: 'generateBulkReviewsFlow',
    inputSchema: GenerateBulkReviewsInputSchema,
    outputSchema: GenerateBulkReviewsOutputSchema,
  },
  async (input) => {
    const { output } = await generateReviewsPrompt(input);
    if (!output || !output.reviews) {
      throw new Error("AI failed to generate a valid review list.");
    }
    return output;
  }
);

    