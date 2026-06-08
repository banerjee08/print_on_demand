import { NextResponse } from "next/server";
import { ai } from "@/lib/ai";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { brand, product, designPrompt } = body;

    const data = await ai.generateMarketing(brand, product, designPrompt);

    return NextResponse.json({
      title: data.title || `Custom ${product?.productType || "product"} Design`,
      description: data.description || "",
      hashtags: data.hashtags || ["printondemand", "custommerchandise"],
      instagramBriefs: data.instagramBriefs || [],
    });
  } catch (error: any) {
    console.error("Error in marketing generation:", error);
    return NextResponse.json(
      { error: "Failed to generate marketing assets" },
      { status: 500 }
    );
  }
}
