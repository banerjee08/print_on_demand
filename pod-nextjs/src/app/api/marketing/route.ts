import { NextResponse } from "next/server";
import { ollama } from "@/lib/ollama";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { brand, product, designPrompt } = body;

    const data = await ollama.generateMarketing(brand, product, designPrompt);

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error in marketing generation:", error);
    return NextResponse.json({ error: "Failed to generate marketing assets" }, { status: 500 });
  }
}
