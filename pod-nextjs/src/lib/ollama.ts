
export interface OllamaResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  eval_count?: number;
  eval_duration?: number;
}

export class OllamaService {
  private baseUrl: string;
  private model: string;

  constructor(baseUrl: string = "http://localhost:11434", model: string = "llama3") {
    this.baseUrl = baseUrl;
    this.model = model;
  }

  async generate(prompt: string, options: any = {}): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.model,
          prompt: prompt,
          stream: false,
          format: "json",
          ...options,
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama error: ${response.statusText}`);
      }

      const data: OllamaResponse = await response.json();
      return data.response;
    } catch (error) {
      console.error("Failed to generate with Ollama:", error);
      throw error;
    }
  }

  async analyzeTrends(locales: string): Promise<any> {
    const prompt = `Analyze upcoming summer-autumn 2026 seasonal niches specifically targeted for the geographical locales: "${locales}". 
    Output exactly three top-selling POD trend models in a JSON list. 
    The target output schema should include: \`trends\` (array of objects: id, title, category, targetAudience, sellingPoint, hotSellReason, colorPalette as array of hex codes, tags, marketingAngle, coreValues as array of strings, colorMixSuggestion as a description) and \`explanation\` (string summarizing today's active work path).
    Output strictly raw JSON.`;

    const response = await this.generate(prompt);
    return JSON.parse(response);
  }

  async analyzePrompt(userIdea: string, brand: any): Promise<any> {
    const prompt = `We want to create a high-selling print-on-demand (POD) design overlay prompt. 
    User's seed idea is: "${userIdea}". 
    The current brand profile is "${brand.name}" targeting: "${brand.audience}" with voice: "${brand.voice}".
    
    Create:
    1. A descriptive illustration style prompt for an AI Image Generator (flat vector, transparent background).
    2. A custom status statement in first person ('I am going to target...').
    Output as raw JSON with keys: finalRefinedPrompt, introMessage.`;

    const response = await this.generate(prompt);
    return JSON.parse(response);
  }

  async generateSlogans(userIdea: string, brand: any, theme: string, textPreference: string): Promise<any> {
    const prompt = `You are a print-on-demand brand copywriter. Generate 3 catchy merchandise slogans.
    Concept idea: "${userIdea}".
    Seasonal theme context: "${theme}".
    Brand: "${brand.name}", audience: "${brand.audience}", voice: "${brand.voice}".
    Text rendering preference: "${textPreference}" (with_text means include text on design, without_text means illustration only).
    Brand keywords: "${brand.customKeywords || ''}". Brand memory: ${JSON.stringify(brand.memory || {})}.
    
    Output ONLY raw JSON (no markdown, no explanation) with this exact structure:
    {
      "suggestions": [
        {
          "slogan": "Short punchy slogan or typographic text (max 6 words, ALL CAPS OK)",
          "oneLiner": "Social media one-liner pitch sentence for this slogan",
          "expression": "Merch expression style tag (e.g. 'Retro Badge', 'Varsity Text', 'Minimalist Quote')",
          "prompt": "Detailed Pollinations.ai illustration prompt for this slogan as a POD decal graphic, flat vector style, transparent background, print-ready"
        }
      ],
      "brandGuidelinesReflection": "Brief note on how these slogans align with the brand voice and are trademark-safe"
    }`;

    const response = await this.generate(prompt);
    return JSON.parse(response);
  }

  async generateMarketing(brand: any, product: any, designPrompt: string): Promise<any> {
    const prompt = `You are an e-commerce marketing expert. Generate social media marketing assets for a print-on-demand product.
    Product type: "${product.productType}" with cost price: "$${product.costPrice}".
    Brand: "${brand.name}", targeting: "${brand.audience}", voice: "${brand.voice}".
    Design aesthetic: "${designPrompt}".
    Brand memory notes: ${JSON.stringify(brand.memory || {})}.
    
    Output ONLY raw JSON (no markdown, no explanation) with this exact structure:
    {
      "title": "SEO-optimized product listing title",
      "description": "compelling product description (2-3 sentences)",
      "hashtags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6"],
      "instagramBriefs": [
        {
          "channel": "instagram-story",
          "caption": "high-energy story caption with emojis",
          "visualBrief": "visual direction for the story graphic",
          "sharesSuggested": "Instagram Story"
        },
        {
          "channel": "instagram-reel",
          "caption": "engaging reel caption with trend hooks",
          "visualBrief": "visual direction for the reel video",
          "sharesSuggested": "Instagram Reels"
        },
        {
          "channel": "pinterest-pin",
          "caption": "SEO-rich pinterest pin caption",
          "visualBrief": "visual direction for the tall pin graphic",
          "sharesSuggested": "Pinterest Board"
        }
      ]
    }`;

    const response = await this.generate(prompt);
    return JSON.parse(response);
  }
}

export const ollama = new OllamaService(
  process.env.OLLAMA_BASE_URL || "http://localhost:11434",
  process.env.OLLAMA_MODEL || "llama3"
);
