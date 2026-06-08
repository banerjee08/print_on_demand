import { NextResponse } from "next/server";
import { ai } from "@/lib/ai";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      userIdea,
      theme,
      brandName,
      brandAudience,
      brandVoice,
      brandKeywords,
      brandMemory,
      textPreference,
    } = body;

    const brand = {
      name: brandName || "My Brand",
      audience: brandAudience || "General",
      voice: brandVoice || "Friendly",
      customKeywords: brandKeywords || "",
      memory: brandMemory || {},
    };

    const data = await ai.generateSlogans(
      userIdea,
      brand,
      theme || "No theme",
      textPreference || "with_text"
    );

    return NextResponse.json({
      suggestions: data.suggestions || [],
      brandGuidelinesReflection: data.brandGuidelinesReflection || "",
    });
  } catch (error: any) {
    console.error("Error generating prompts/slogans:", error);
    return NextResponse.json({
      suggestions: [
        {
          slogan: "STAY WILD",
          oneLiner: "For the adventurous soul who never settles.",
          expression: "Retro Badge",
          prompt:
            "Flat vector illustration, bold retro circular badge design reading 'STAY WILD', distressed texture, earthy tones, transparent background, print-ready POD sticker.",
        },
        {
          slogan: "GOOD VIBES ONLY",
          oneLiner: "Radiate positivity everywhere you go.",
          expression: "Groovy Script",
          prompt:
            "Flat vector illustration, groovy retro wavy text 'GOOD VIBES ONLY', 70s aesthetic, warm sunset palette, transparent background, print-ready POD decal.",
        },
        {
          slogan: "MADE WITH HEART",
          oneLiner: "Crafted for people who care deeply.",
          expression: "Minimalist Quote",
          prompt:
            "Flat vector minimalist design, centered typography 'MADE WITH HEART' with small heart icon accent, clean sans-serif font, black and white, transparent background, print-ready.",
        },
      ],
      brandGuidelinesReflection:
        "Fallback slogans — AI temporarily unavailable. These are trademark-safe evergreen options.",
    });
  }
}
