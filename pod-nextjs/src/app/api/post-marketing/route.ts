import { NextResponse } from "next/server";

/**
 * POST /api/post-marketing
 *
 * Simulates publishing a social asset to the target channel.
 * In a production app this would call the relevant social-platform API
 * (Instagram Graph API, Pinterest API, etc.) with the provided content.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { channel, productId, caption } = body;

    if (!channel || !productId) {
      return NextResponse.json(
        { error: "Missing required fields: channel, productId" },
        { status: 400 }
      );
    }

    // Simulate a short publishing delay (~platform API latency)
    await new Promise((resolve) => setTimeout(resolve, 300));

    const channelLabel =
      channel === "instagram-story"
        ? "Instagram Story"
        : channel === "instagram-reel"
        ? "Instagram Reel"
        : channel === "pinterest-pin"
        ? "Pinterest Pin"
        : channel;

    return NextResponse.json({
      success: true,
      message: `${channelLabel} published successfully! Your campaign is now live and synced with the e-commerce listing queue.`,
      publishedAt: new Date().toISOString(),
      channel,
      productId,
    });
  } catch (error: any) {
    console.error("Error in post-marketing:", error);
    return NextResponse.json(
      { error: "Failed to publish marketing asset" },
      { status: 500 }
    );
  }
}
