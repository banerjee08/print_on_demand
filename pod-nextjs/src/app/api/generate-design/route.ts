import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { prompt, colorPalette, customKeywords } = await request.json();
    
    const paletteString = colorPalette && colorPalette.length ? `Colors: ${colorPalette.join(", ")}` : "colors suited for vector merchandise";
    const cleanIllustrationPrompt = `Flat print-on-demand vector illustration decal graphic. ${prompt}. ${paletteString}. Beautiful crisp outlines, transparent solid background, high-contrast, trendy digital design, ready to print decals, flat vector sticker look, ${customKeywords || 'vintage vibe'}. (Strictly no realism/photos, clean logo-style vectors only).`;

    // Using Pollinations.ai for design generation as requested for "creative work" fallback or main engine if image model not in Ollama
    const encodedPrompt = encodeURIComponent(cleanIllustrationPrompt);
    const randomSeed = Math.floor(Math.random() * 1000000);
    const imageUrl = `https://image.pollinations.ai/p/${encodedPrompt}?width=512&height=512&seed=${randomSeed}&nologo=true`;

    return NextResponse.json({
      imageUrl,
      promptUsed: cleanIllustrationPrompt,
      engineSelected: "Pollinations Free Core",
    });
  } catch (error: any) {
    console.error("Error in design generation:", error);
    return NextResponse.json({ error: "Failed to generate design" }, { status: 500 });
  }
}
