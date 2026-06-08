import { NextResponse } from "next/server";
import { ai } from "@/lib/ai";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userIdea, brandName, brandAudience, brandVoice, brandKeywords } = body;

    const data = await ai.analyzePrompt(userIdea, {
      name: brandName,
      audience: brandAudience,
      voice: brandVoice,
      keywords: brandKeywords,
    });

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error in prompt analysis:", error);
    return NextResponse.json({
      finalRefinedPrompt: "A beautiful custom POD design inspired by your idea.",
      introMessage: "I'm working on a custom design tailored for your brand.",
      isUsingFallback: true,
    });
  }
}
