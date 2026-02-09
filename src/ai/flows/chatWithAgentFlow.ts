'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { db } from '@/lib/firebase';
import { getBaseUrl } from '@/lib/config';
import { collection, getDocs } from 'firebase/firestore';
import type { FirestoreCategory } from '@/types/firestore';

/* ---------------- Schemas ---------------- */

const ChatHistoryItemSchema = z.object({
  role: z.enum(['user','model','system']),
  content: z.array(z.object({ text:z.string() }))
});

const ChatAgentInputSchema = z.object({
  history:z.array(ChatHistoryItemSchema),
  message:z.string(),
});

const ChatAgentOutputSchema = z.object({
  response:z.string()
});

export async function chatWithAgent(input:any){
  return chatAgentFlow(input);
}

/* ---------------- Helpers ---------------- */

function normalize(s:string){
  return s.toLowerCase().trim();
}

function tokenize(s:string){
  return normalize(s).split(/\W+/).filter(Boolean);
}

function isGreeting(msg:string){
  return ['hi','hello','hey','namaste'].includes(normalize(msg));
}

function isContactIntent(msg:string){
  return /\b(call|contact|number|connect|reach)\b/i.test(msg);
}

function isRefundIntent(msg:string){
  return /\b(refund|money back|return payment|cancel payment|chargeback)\b/i.test(msg);
}

function isUnrelated(msg:string){
  return /\b(joke|song|love|recipe|biryani)\b/i.test(msg);
}

/* Category Match */

function findCategory(message:string,categories:FirestoreCategory[]){
  const tokens = new Set(tokenize(message));

  for(const c of categories){
    const nameTokens = tokenize(c.name || '');
    const overlap = nameTokens.filter(t=>tokens.has(t)).length;
    if(overlap>0) return c;
  }

  return null;
}

/* Load Categories */

async function loadCategories(){
  const baseUrl = getBaseUrl().replace(/\/$/,'');
  const snap = await getDocs(collection(db,'adminCategories'));

  const categories:FirestoreCategory[] =
    snap.docs.map(d=>({ id:d.id,...d.data()} as any));

  return {categories,baseUrl};
}

/* System Prompt for AI Fallback */

function buildPrompt(categories:FirestoreCategory[], baseUrl:string){

const list = categories.map(c=>`${c.name} -> ${baseUrl}/category/${c.slug}`).join('\n');

return `
You are FixBro assistant.

FixBro connects users with independent service providers.
FixBro does NOT perform services and does NOT handle service payments.

Refund Policy:
- Platform connection fees are non-refundable
- Payments between user and provider are outside FixBro responsibility

Available Categories:
${list}

Rules:
1. Direct users to category links
2. Do NOT mention subcategories/services
3. Keep replies concise
`;
}

/* ---------------- MAIN FLOW ---------------- */

const chatAgentFlow = ai.defineFlow(
{
name:'chatAgentFlow',
inputSchema:ChatAgentInputSchema,
outputSchema:ChatAgentOutputSchema
},
async(input)=>{

const {message,history} = input;
const {categories,baseUrl} = await loadCategories();

/* Greeting */
if(isGreeting(message)){
return {response:`Hi 👋  
Tell me what type of service you're looking for.`};
}

/* Refund Questions */
if(isRefundIntent(message)){
return {
response:`FixBro platform fees are non-refundable.

FixBro only connects users with independent providers.  
Any payments made directly to providers are handled between you and them.

If you need help, our support team can assist you.`
};
}

/* Contact Guidance */
if(isContactIntent(message)){
return {
response:`You can connect with providers from the category pages.

Browse categories here:
${baseUrl}/categories`
};
}

/* Category Match */
const cat = findCategory(message,categories);
if(cat){
return {
response:`You can explore ${cat.name} providers here:

${baseUrl}/category/${cat.slug}`
};
}

/* Unrelated */
if(isUnrelated(message)){
return {
response:`I'm here to help you find service providers 🙂  
Tell me what service you need.`
};
}

/* Gemini Fallback */
const prompt = buildPrompt(categories,baseUrl);

let convo = prompt+"\n";
history.slice(-8).forEach((h:any)=>{
convo += `${h.role}:${h.content.map((c:any)=>c.text).join(' ')}\n`;
});
convo += `user:${message}\nmodel:`;

const aiResp = await ai.generate({
model:'googleai/gemini-2.0-flash',
prompt:convo,
config:{temperature:0.3}
});

return {response:aiResp.text};

});

export { chatAgentFlow };
