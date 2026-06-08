import Groq from "groq-sdk";

// Groq uses llama3-8b-8192 by default: fast, free-tier friendly (30K TPM)
const groqClient = new Groq({
  apiKey: process.env.GROQ_API_KEY || "",
});

const GROQ_MODEL = "llama3-8b-8192";

export class GroqService {
  async generate(prompt: string): Promise<string> {
    const completion = await groqClient.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are a helpful print-on-demand business assistant. Always respond with valid raw JSON only — no markdown fences, no explanations.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 1024,
    });

    return completion.choices[0]?.message?.content || "{}";
  }

  async analyzePrompt(userIdea: string, brand: any): Promise<any> {
    const prompt = `We want to create a high-selling print-on-demand (POD) design overlay prompt.
User seed idea: "${userIdea}".
Brand profile: "${brand.name}" targeting: "${brand.audience}" with voice: "${brand.voice}". Keywords: "${brand.keywords || ""}".

Output ONLY raw JSON:
{ "finalRefinedPrompt": "Detailed illustration prompt for AI image generator (flat vector, transparent bg)", "introMessage": "First-person 'I am going to...' status statement" }`;

    const response = await this.generate(prompt);
    return JSON.parse(response);
  }

  async generateSlogans(
    userIdea: string,
    brand: any,
    theme: string,
    textPreference: string
  ): Promise<any> {
    const prompt = `You are a print-on-demand brand copywriter. Generate 3 catchy merchandise slogans.
Concept idea: "${userIdea}". Theme: "${theme}". Brand: "${brand.name}", audience: "${brand.audience}", voice: "${brand.voice}". Text preference: "${textPreference}".

Output ONLY raw JSON:
{
  "suggestions": [
    { "slogan": "Short punchy slogan (max 6 words)", "oneLiner": "Social media pitch", "expression": "Style tag (e.g. Retro Badge)", "prompt": "Pollinations.ai illustration prompt for this slogan as a flat vector POD decal, transparent background" }
  ],
  "brandGuidelinesReflection": "Brief note on trademark safety and brand alignment"
}`;

    const response = await this.generate(prompt);
    return JSON.parse(response);
  }

  async generateMarketing(brand: any, product: any, designPrompt: string): Promise<any> {
    const prompt = `You are an e-commerce marketing expert for print-on-demand.
Product: "${product.productType}" — cost $${product.costPrice}. Brand: "${brand.name}", audience: "${brand.audience}", voice: "${brand.voice}". Design: "${designPrompt}".

Output ONLY raw JSON:
{
  "title": "SEO product title",
  "description": "2-3 sentence product description",
  "hashtags": ["tag1","tag2","tag3","tag4","tag5","tag6"],
  "instagramBriefs": [
    { "channel": "instagram-story", "caption": "Story caption with emojis", "visualBrief": "Visual direction", "sharesSuggested": "Instagram Story" },
    { "channel": "instagram-reel", "caption": "Reel caption with hooks", "visualBrief": "Visual direction", "sharesSuggested": "Instagram Reels" },
    { "channel": "pinterest-pin", "caption": "SEO-rich pin caption", "visualBrief": "Visual direction", "sharesSuggested": "Pinterest Board" }
  ]
}`;

    const response = await this.generate(prompt);
    return JSON.parse(response);
  }
}

export const groq = new GroqService();
