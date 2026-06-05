import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Body parser
app.use(express.json({ limit: '10mb' }));

// Safe Gemini SDK Client initialization
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
};

/* ==========================================================================
   API ENDPOINTS
   ========================================================================== */

// 1. GET /api/trends - Detect upcoming POD trends based on current season/market
app.get("/api/trends", async (req, res) => {
  const ai = getGeminiClient();
  const currentDateStr = "2026-05-21"; // Preserving sandbox time context
  const locales = (req.query.locales as string) || "US, UK, CA";

  try {
    if (!ai) {
      // Return creative pre-loaded trends if API key is not configured yet
      const fallbackTrends = [
        {
          id: "trend-4th-july",
          title: "Patriots Camping & 4th of July Dads",
          category: "Holiday Apparel",
          targetAudience: `Dads, Mothers & Camping Enthusiasts in ${locales}`,
          sellingPoint: "Distressed retro US flag designs with funny camping quotes ('Star Spangled S'mores')",
          hotSellReason: `Upcoming summer peaks (July) in ${locales} with peak outdoors travel, highly emotional theme on family gatherings.`,
          colorPalette: ["#B22234", "#FFFFFF", "#3C3B6E", "#2B2B2B"],
          tags: ["July 4th", "Camping Dad", "Retro American flag", "Outdoor BBQ"],
          marketingAngle: "Emphasize rugged luxury, cozy fire pits, and humor 'Firecrackers and Campfire Smoke: A Dad's Happy Hour'.",
          coreValues: ["Family togetherness", "Rugged self-reliance", "Lighthearted nostalgia", "Love of the great outdoors"],
          colorMixSuggestion: "We suggest blending 60% of the brand neutral warm base (Oats/Sand) with 30% deep trend crimson (#B22234) and 10% active brand charcoal accents for clean distressed text rendering."
        },
        {
          id: "trend-summer-retro",
          title: "Salty Hair & Cozy Coastal Grandma Aesthetics",
          category: "Home & Beach Accessories",
          targetAudience: `Millennial women & beachgoers in ${locales}`,
          sellingPoint: "Elegant vector line drawings of seashells, soft pastel wave crests, and vintage minimal typography.",
          hotSellReason: "Coastal cottagecore guidelines remain a dominant trend on Pinterest for home decor, canvas tote bags, and summer mugs.",
          colorPalette: ["#F9F6F0", "#D0E1D4", "#C19A6B", "#85A3B2"],
          tags: ["Coastal Grandma", "Minimalist Beach", "Vintage Aesthetic", "Tote Bags"],
          marketingAngle: "Focus on relaxed, stress-free morning walks, slow living, and sandy toes.",
          coreValues: ["Slow-paced mindfulness", "Eco-friendly canvas structures", "Understated elegant textures", "Simplicity and wellness"],
          colorMixSuggestion: "Ideal balance is a 70% soft beach pastel background paired with 20% brand primary color highlights, leaving 10% for crisp custom line-art details."
        },
        {
          id: "trend-back-to-school-teachers",
          title: "Post-Summer Teacher Fuel (Coffee & Crayons)",
          category: "Mugs & Tote bags",
          targetAudience: `Elementary & High School Teachers in ${locales}`,
          sellingPoint: "Retro bold groovy bubble lettering with phrases like 'Fueled by iced lattes and lesson plans'",
          hotSellReason: `Teachers and parents start prepping school schedules as early as late June in ${locales}. Easy gift categories.`,
          colorPalette: ["#FFC107", "#E91E63", "#03A9F4", "#4CAF50"],
          tags: ["Teacher Mug", "Back to school", "Groovy Letters", "Teacher Gift"],
          marketingAngle: "A gift of sanity for the tireless educator preparing for another classroom season.",
          coreValues: ["Resilience and support", "Vibrant playground playfulness", "Caffeine-fueled productivity", "Appreciation and giftability"],
          colorMixSuggestion: "Match a 50% warm brand core canvas with 40% retro groovy primary trend tones, popping a rich 10% contrast border outline for max sticker readability."
        }
      ];

      return res.json({
        trends: fallbackTrends,
        explanation: `I am going to work on POD designs for the 4th of July and Summer Outing themes targeted specifically at ${locales} markets because they are entering peak sales velocity among outdoorsy parents planning family campouts.`,
        isUsingFallback: true
      });
    }

    // Call Gemini 3.5 Flash for the trend and agenda analysis
    const systemPrompt = `You are an elite Print on Demand (POD) designer and market strategist. Analyze upcoming seasonal opportunities (starting around June/July/August 2026 based on current date May 2026) and generate 3 extremely specific high-converting design product trends. Output in JSON format.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Analyze upcoming summer-autumn 2026 seasonal niches specifically targeted for the geographical locales: "${locales}". Output exactly three top-selling POD trend models in a JSON list. Provide a structured response with trends list and an overall action agenda explaining 'What we are going to design today'. The target output schema should include: \`trends\` (array of objects: id, title, category, targetAudience, sellingPoint, hotSellReason, colorPalette as array of hex codes, tags, marketingAngle, coreValues as array of strings representing cultural/sub-niche values, colorMixSuggestion as a description of how to blend design colors with brand colors) and \`explanation\` (string summarizing today's active work path).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            trends: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  category: { type: Type.STRING },
                  targetAudience: { type: Type.STRING },
                  sellingPoint: { type: Type.STRING },
                  hotSellReason: { type: Type.STRING },
                  colorPalette: { type: Type.ARRAY, items: { type: Type.STRING } },
                  tags: { type: Type.ARRAY, items: { type: Type.STRING } },
                  marketingAngle: { type: Type.STRING },
                  coreValues: { type: Type.ARRAY, items: { type: Type.STRING } },
                  colorMixSuggestion: { type: Type.STRING, description: "Detailed strategy on how to blend these trend colors with current brand styles, detailing ratios/percentages." }
                },
                required: ["id", "title", "category", "targetAudience", "sellingPoint", "hotSellReason", "colorPalette", "tags", "marketingAngle", "coreValues", "colorMixSuggestion"]
              }
            },
            explanation: { type: Type.STRING, description: "A conversational daily statement of what niche we are targeting today and why." }
          },
          required: ["trends", "explanation"]
        }
      }
    });

    const parsedData = JSON.parse(response.text.trim());
    return res.json({
      trends: parsedData.trends,
      explanation: parsedData.explanation,
      isUsingFallback: false
    });

  } catch (error: any) {
    console.error("Error generating trends:", error);
    res.status(500).json({ error: error.message || "Failed to analyze trends." });
  }
});


// 2. POST /api/analyze-prompt - Incorporates user's rough idea & brand rules into an exact daily design objective
app.post("/api/analyze-prompt", async (req, res) => {
  const { userIdea, brandName, brandAudience, brandVoice, brandKeywords, brandMemory } = req.body;
  const ai = getGeminiClient();

  try {
    if (!ai) {
      // Rich default outline
      const mockAnalysisPrompt = `${userIdea || "a retro patriotic design"} for ${brandName}. Featuring cozy aesthetics targeted at ${brandAudience}. Styling keywords: ${brandKeywords || "cozy, clean, graphic"}`;
      const introMessage = `I am going to work on custom-designed POD overlays incorporating: "${userIdea || 'your patriotic summer idea'}" matched perfectly against ${brandName}'s target guidelines. It will capture a refined mood to appeal to ${brandAudience || 'your target base'} using a ${brandVoice || 'warm and direct'} brand voice.`;

      return res.json({
        finalRefinedPrompt: mockAnalysisPrompt,
        introMessage,
        isUsingFallback: true
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `We want to create a high-selling print-on-demand (POD) design overlay prompt. 
      User's seed idea is: "${userIdea}". 
      The current brand profile is "${brandName}" targeting demographic: "${brandAudience}" with voice style "${brandVoice}" and default guidelines: "${brandKeywords}". 
      
      CRITICAL: We must isolate brand contexts so future designs match the specific demographic and avoid generic templates. 
      Apply these dynamic brand memory guidelines learned from previous merchant preferences:
      - Enforce/Incorporate Preferred Themes: ${JSON.stringify(brandMemory?.likedThemes || [])}
      - Strictly avoid Blacklisted Themes: ${JSON.stringify(brandMemory?.dislikedThemes || [])}
      - Apply Layout Guidelines: ${JSON.stringify(brandMemory?.designStyleLearnings || [])}

      Create:
      1. An incredibly descriptive illustration style prompt for an AI Image Generator. It should describe clear flat vector overlays, decals, crisp edges with transparent backgrounds, optimized for t-shirts, mugs, totes, and hoodies, adhering perfectly to the brand's layout learnings and omitting disliked themes.
      2. A custom status statement in first person ('I am going to target...') introducing today's work line to the brand owner in a motivating style.
      Output as raw JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            finalRefinedPrompt: { type: Type.STRING, description: "An asset generation prompt detailing transparent background vector, graphic design, clear outlines, distressed typography." },
            introMessage: { type: Type.STRING, description: "Highly humanized and motivating introduction of today's work scope." }
          },
          required: ["finalRefinedPrompt", "introMessage"]
        }
      }
    });

    const parsed = JSON.parse(response.text.trim());
    res.json(parsed);

  } catch (error: any) {
    console.error("Error in prompt analysis:", error);
    res.status(500).json({ error: error.message || "Prompt formulation failed." });
  }
});


// 3. POST /api/generate-design - Generate Image using premium Nano Banana (Gemini 2.5 Flash Image) or fallback
app.post("/api/generate-design", async (req, res) => {
  const { prompt, colorPalette, customKeywords, activeBrandId } = req.body;
  const ai = getGeminiClient();

  // Create clean prompts suited for high-quality apparel decals
  const paletteString = colorPalette && colorPalette.length ? `Colors: ${colorPalette.join(", ")}` : "colors suited for vector merchandise";
  const cleanIllustrationPrompt = `Flat print-on-demand vector illustration decal graphic. ${prompt}. ${paletteString}. Beautiful crisp outlines, transparent solid background, high-contrast, trendy digital design, ready to print decals, flat vector sticker look, ${customKeywords || 'vintage vibe'}. (Strictly no realism/photos, clean logo-style vectors only).`;

  try {
    if (!ai) {
      // 100% functional fallback using beautiful Pollinations.ai API
      // Since Pollinations.ai generates fully dynamic images from free parameters, we construct a gorgeous prompt URL
      const encodedPrompt = encodeURIComponent(cleanIllustrationPrompt);
      const randomSeed = Math.floor(Math.random() * 1000000);
      const mockResultUrl = `https://image.pollinations.ai/p/${encodedPrompt}?width=512&height=512&seed=${randomSeed}&nologo=true`;

      return res.json({
        imageUrl: mockResultUrl,
        promptUsed: cleanIllustrationPrompt,
        engineSelected: "Pollinations Free Core",
        wasKeyMissing: true
      });
    }

    // Call standard Nano Banana API ("gemini-2.5-flash-image") in full-stack server
    // Note from skill: Call generateContent to generate images with nano banana series models; do not use generateImages.
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [
          { text: cleanIllustrationPrompt }
        ]
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: "1K"
        }
      }
    });

    let generatedBase64 = "";
    // Iterate parts to find inlineData image
    if (response.candidates && response.candidates[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          generatedBase64 = part.inlineData.data;
          break;
        }
      }
    }

    if (generatedBase64) {
      const finalImageDataUrl = `data:image/png;base64,${generatedBase64}`;
      return res.json({
        imageUrl: finalImageDataUrl,
        promptUsed: cleanIllustrationPrompt,
        engineSelected: "Gemini 2.5 Nano Banana Image"
      });
    } else {
      // Fallback if no inline data is parsed
      const fallbackUrl = `https://image.pollinations.ai/p/${encodeURIComponent(cleanIllustrationPrompt)}?width=512&height=512&nologo=true`;
      return res.json({
        imageUrl: fallbackUrl,
        promptUsed: cleanIllustrationPrompt,
        engineSelected: "Pollinations Engine (No base64 stream returned)"
      });
    }

  } catch (error: any) {
    console.error("Gemini Nano Banana image generation failed:", error);
    // Gracefully fallback to Pollinations.ai so the user continues swiping without disruption
    const fallbackUrl = `https://image.pollinations.ai/p/${encodeURIComponent(cleanIllustrationPrompt)}?width=512&height=512&nologo=true`;
    return res.json({
      imageUrl: fallbackUrl,
      promptUsed: cleanIllustrationPrompt,
      engineSelected: "Pollinations Back-Up Bridge (Gemini Call Failed)",
      note: error.message || "An exception occurred during Gemini Image processing."
    });
  }
});


// 4. POST /api/brand-learn - Lets the LLM extract stylistic rules from user's loved vs disliked list
app.post("/api/brand-learn", async (req, res) => {
  const { brandName, likedDesigns, dislikedDesigns, currentMemory } = req.body;
  const ai = getGeminiClient();

  try {
    if (!ai) {
      // Manual simple extraction logic fallback
      const mockLearnings = [
        `Prefers designs suited for outdoorsy contexts under ${brandName}.`,
        `Thrives on clean color grids rather than dark cluttered textures.`,
        `Fascinated by hand-drawn typographic elements.`
      ];
      return res.json({
        updatedMemory: {
          likedThemes: [...new Set([...(currentMemory?.likedThemes || []), "Outdoor Camper", "Retro Patriotic"])],
          dislikedThemes: [...new Set([...(currentMemory?.dislikedThemes || []), "Hyper Minimalist", "Corporate Grids"])],
          designStyleLearnings: mockLearnings
        },
        hasLearnt: true
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `You are a machine learning model personalization expert. Analyze the swiped design choices of a POD owner for brand "${brandName}".
      Liked designs prompts: ${JSON.stringify(likedDesigns || [])}
      Disliked designs prompts: ${JSON.stringify(dislikedDesigns || [])}
      Current consolidated guidelines memory: ${JSON.stringify(currentMemory || {})}
      Consolidate guidelines under 3 headings:
      1. Refined likedThemes (list of 3 topics)
      2. Refined dislikedThemes (list of 3 topics)
      3. Precise designStyleLearnings (3 concise observations in bullet point form like: 'Enjoys distressed Americana retro lettering', 'Dislikes flat modern corporate outlines').
      Output strictly in JSON structure.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            likedThemes: { type: Type.ARRAY, items: { type: Type.STRING } },
            dislikedThemes: { type: Type.ARRAY, items: { type: Type.STRING } },
            designStyleLearnings: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["likedThemes", "dislikedThemes", "designStyleLearnings"]
        }
      }
    });

    const parsedMemory = JSON.parse(response.text.trim());
    res.json({ updatedMemory: parsedMemory, hasLearnt: true });

  } catch (error: any) {
    console.error("Failed learning brand guidelines characteristics:", error);
    res.status(500).json({ error: "Memory integration errored." });
  }
});


// 4b. POST /api/feedback-learn - Personalized model learning from mockup / social likes/dislikes
app.post("/api/feedback-learn", async (req, res) => {
  const { brandName, likedMockups, dislikedMockups, likedSocials, dislikedSocials, currentMemory } = req.body;
  const ai = getGeminiClient();

  try {
    if (!ai) {
      // Deterministic expert feedback distiller fallback
      const mockMockupLearnings: string[] = [];
      const mockSocialLearnings: string[] = [];

      if (likedMockups && likedMockups.length > 0) {
        const types = [...new Set(likedMockups.map((m: any) => m.productType))];
        mockMockupLearnings.push(`Favoring mockups built with "${types.join(', ')}" substrates.`);
        
        // check scales
        const avgScale = likedMockups.reduce((sum: number, m: any) => sum + m.placementScale, 0) / likedMockups.length;
        if (avgScale > 50) {
          mockMockupLearnings.push("Learned placement rule: Prefer bold, oversized, full chest/surface decal alignments.");
        } else {
          mockMockupLearnings.push("Learned placement rule: Prefer subtle, medium-to-compact centered alignments.");
        }
      } else {
        mockMockupLearnings.push("Awaiting mockup sizing & selection feedback patterns...");
      }

      if (likedSocials && likedSocials.length > 0) {
        const channels = [...new Set(likedSocials.map((s: any) => s.channel))];
        mockSocialLearnings.push(`Recognizing strong click affinity on ${channels.join(' and ')} organic channels.`);
        mockSocialLearnings.push("Ad copy preset: Tone aligned towards converting lifestyle storytelling templates.");
      } else {
        mockSocialLearnings.push("Awaiting social content copywriting thumbs-up interactions...");
      }

      const consolidatedMemory = {
        likedThemes: currentMemory?.likedThemes || [],
        dislikedThemes: currentMemory?.dislikedThemes || [],
        designStyleLearnings: currentMemory?.designStyleLearnings || [],
        likedMockupsCount: (currentMemory?.likedMockupsCount || 0) + (likedMockups?.length || 0),
        dislikedMockupsCount: (currentMemory?.dislikedMockupsCount || 0) + (dislikedMockups?.length || 0),
        mockupFeedbackLearnings: [...new Set([...(currentMemory?.mockupFeedbackLearnings || []), ...mockMockupLearnings])],
        socialFeedbackLearnings: [...new Set([...(currentMemory?.socialFeedbackLearnings || []), ...mockSocialLearnings])]
      };

      return res.json({
        updatedMemory: consolidatedMemory,
        hasLearnt: true
      });
    }

    // Call real Gemini model to formulate high-fidelity merchant guidelines based on specific preferences
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `You are an AI brand strategist. Consolidate design placement, substrate choices, and marketing feedback for brand "${brandName}".
      Liked mockup assets: ${JSON.stringify(likedMockups || [])}
      Disliked mockup assets: ${JSON.stringify(dislikedMockups || [])}
      Liked social media briefs: ${JSON.stringify(likedSocials || [])}
      Disliked social media briefs: ${JSON.stringify(dislikedSocials || [])}
      Current consolidated brand memory: ${JSON.stringify(currentMemory || {})}
      
      Synthesize 2 distinct lists:
      1. mockupFeedbackLearnings: 3 expert-level layout & sizing preferences consolidated from positive markup responses (e.g. 'Optimizes Hoodie graphic prints to larger scaling indices', 'Prefers dark neutral apparel backdrops').
      2. socialFeedbackLearnings: 3 copywriting guidelines distilled from positive social narrative tags (e.g. 'Responsive to energetic lifestyle countdown layouts', 'Approves Pinterest pins focusing on minimal typography styling').
      
      Output strictly in JSON structure.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            mockupFeedbackLearnings: { type: Type.ARRAY, items: { type: Type.STRING } },
            socialFeedbackLearnings: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["mockupFeedbackLearnings", "socialFeedbackLearnings"]
        }
      }
    });

    const parsedFeedback = JSON.parse(response.text.trim());
    const consolidated = {
      likedThemes: currentMemory?.likedThemes || [],
      dislikedThemes: currentMemory?.dislikedThemes || [],
      designStyleLearnings: currentMemory?.designStyleLearnings || [],
      likedMockupsCount: (currentMemory?.likedMockupsCount || 0) + (likedMockups?.length || 0),
      dislikedMockupsCount: (currentMemory?.dislikedMockupsCount || 0) + (dislikedMockups?.length || 0),
      mockupFeedbackLearnings: [...new Set([...(currentMemory?.mockupFeedbackLearnings || []), ...(parsedFeedback.mockupFeedbackLearnings || [])])],
      socialFeedbackLearnings: [...new Set([...(currentMemory?.socialFeedbackLearnings || []), ...(parsedFeedback.socialFeedbackLearnings || [])])]
    };

    res.json({ updatedMemory: consolidated, hasLearnt: true });

  } catch (error) {
    console.error("Failed learning product feedback:", error);
    res.status(500).json({ error: "Adaptive feedback engine exception." });
  }
});


// 5. POST /api/generate-marketing - Write listing descriptions, social strategies, hashtags & pricing rules
app.post("/api/generate-marketing", async (req, res) => {
  const { brand, product, designPrompt } = req.body;
  const ai = getGeminiClient();

  try {
    if (!ai) {
      // Custom crafted pre-built high-quality marketing copy optimized by brand profile
      const isRugged = brand.name.toLowerCase().includes("apex") || brand.audience.toLowerCase().includes("dad");
      
      const title = isRugged 
        ? `Apex Retro Custom ${product.productType.toUpperCase()} - Rugged Trail Edition` 
        : `Coastal Grandma Pastel Custom ${product.productType.toUpperCase()} - Chill Breeze Edition`;
        
      const description = isRugged
        ? `Durable, heavy-duty premium custom ${product.productType} made for rugged campouts, weekend BBQs, and family laughter under the stars. Adorned with your gorgeous custom "${designPrompt}" vector decal, matching weathered retro styles flawlessly. Specially crafted for outdoorsy dads, hiking enthusiasts, and lovers of a good dad joke.`
        : `Soft-spun, ultra-cozy custom ${product.productType} matching the relaxed aesthetic of slow morning sunset strolls, beach reading, and seaside cottage strolls. Beautiful clean illustration of "${designPrompt}" blended onto durable eco-friendly structures. Tailored for seaside living, slow-living millennials, and beach lovers.`;

      const hashtags = isRugged
        ? ["#outdoorsydad", "#campinghacks", "#trailadventure", "#gildanhoodies", `#${brand.name.toLowerCase().replace(/\s+/g, '')}`, "#hikinggear"]
        : ["#coastalgrandma", "#slowliving", "#beachpastels", "#ecocanvas", `#${brand.name.toLowerCase().replace(/\s+/g, '')}`, "#cottagecore"];

      const suggestedPrice = product.productType === 't-shirt' ? 24.99 : product.productType === 'mug' ? 14.99 : product.productType === 'hoodie' ? 44.99 : 19.99;
      const margin = suggestedPrice - product.costPrice;

      const postCaption = isRugged
        ? `Gear up for the next sunset campout! 🌲🔥 Specially built for our rugged hiking community, this legendary custom piece blends custom designs onto heavy fabrics. Grab your gear via the link in our bio! ${hashtags.join(" ")}`
        : `Slow mornings just got a whole lot cozier... ☕✨ Tailored to match your slow coastal奶奶 aesthetic. Sustainable fabrics, pastel-soft construction, and beautiful hand-drawn accents. Link in bio! ${hashtags.join(" ")}`;

      const storyCaption = isRugged
        ? `🔥 Trail countdown active! Snag your rugged outdoor ${product.productType} before sizes run out! Only a few printing sets left today. Swipe up!`
        : `🌸 Beach walks require cozy fits. Snatch this limited-supply pastel ${product.productType} and embrace the cottagecore chill. Tap shop!`;

      return res.json({
        title,
        description,
        hashtags,
        pricing: {
          suggestedPrice,
          profitMargin: margin,
          text: `Suggested selling point of $${suggestedPrice} gives a solid profit margin of $${margin.toFixed(2)} (${Math.round((margin/suggestedPrice)*100)}%). Easy standard pricing matched to medium-tier Etsy guidelines.`
        },
        instagramBriefs: [
          {
            channel: "instagram-post",
            caption: postCaption,
            visualBrief: isRugged 
              ? "Close up lifestyle shot of a smiling father holding his rugged gear sitting beside a crackling campfire in the pine woods at dusk."
              : "Soft vintage polaroid of a person cozying up in a pastel cardigan holding a beach tote/mug at a rustic sunlit window.",
            sharesSuggested: "Feed Carousel grid item"
          },
          {
            channel: "instagram-story",
            caption: storyCaption,
            visualBrief: isRugged
              ? "High-impact close-up detailing the heavy textured decal with an active 24-hr shipping countdown sticker overlay."
              : "Warm aesthetic video of soft waves rolling onto sand, overlayed with the custom design sticker and a link sticker.",
            sharesSuggested: "Interactive link story"
          }
        ]
      });
    }

    const systemPrompt = `You are an elite Etsy SEO and e-commerce copywriter specialized in Printify marketing. Analyze the design and craft premium descriptions and social creative campaign briefs. Output in JSON format.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Construct e-commerce listings & social marketing strategy assets:
      Product type: "${product.productType}" with white-label wholesale cost: "$${product.costPrice}".
      Brand context: "${brand.name}", targeting demographic: "${brand.audience}", voice tone of: "${brand.voice}".
      Design aesthetic concept: "${designPrompt}".
      
      CRITICAL: We must align our marketing copy directly to the isolated target demographic and dynamic guidelines learned so far. 
      Apply and incorporate the following brand memory settings:
      - Preferred themes/keywords: ${JSON.stringify(brand.memory?.likedThemes || [])}
      - Avoided blacklisted words/topics: ${JSON.stringify(brand.memory?.dislikedThemes || [])}
      - Extra layout styling notes: ${JSON.stringify(brand.memory?.designStyleLearnings || [])}

      Generate:
      1. A highly clickable, SEO-optimized title for Etsy/Shopify that targets the specific demographic.
      2. A converting Printify/Etsy product description highlighting materials, lifestyle context, custom styling and core brand values.
      3. A list of 6 highly viral niche hashtags related to the brand's target audience and loved theme.
      4. Pricing analysis: suggest retail price, calculate dollar margin, and justify why this holds best value.
      5. Two distinct social campaign template briefs (one "instagram-post" and one "instagram-story" or "instagram-reel") including exact caption, visual mockup description, and channel placement recommendation.
      Output strictly in JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
            pricing: {
              type: Type.OBJECT,
              properties: {
                suggestedPrice: { type: Type.NUMBER },
                profitMargin: { type: Type.NUMBER },
                text: { type: Type.STRING }
              },
              required: ["suggestedPrice", "profitMargin", "text"]
            },
            instagramBriefs: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  channel: { type: Type.STRING },
                  caption: { type: Type.STRING },
                  visualBrief: { type: Type.STRING },
                  sharesSuggested: { type: Type.STRING }
                },
                required: ["channel", "caption", "visualBrief", "sharesSuggested"]
              }
            }
          },
          required: ["title", "description", "hashtags", "pricing", "instagramBriefs"]
        }
      }
    });

    const parsedMarketing = JSON.parse(response.text.trim());
    res.json(parsedMarketing);

  } catch (error: any) {
    console.error("E-commerce copywriting generation errored:", error);
    res.status(500).json({ error: "Failed to compile assets." });
  }
});


// 6. POST /api/post-marketing - Mimics real one-click deployment & schedules social posts
app.post("/api/post-marketing", (req, res) => {
  const { channel, productId, caption } = req.body;
  // Simulates integration verification with Shopify, Etsy API, and Social Meta Graph
  const randId = "pub-" + Math.floor(Math.random() * 100000);
  res.json({
    success: true,
    postId: randId,
    status: "published",
    message: `Successfully generated social mock post and scheduled asset to Etsy shop queue. ID: ${randId}. Direct upload completed.`,
    statsEstimate: {
      expectedCTR: "4.2%",
      estimatedNicheReach: "12,000 users",
      approvedChannel: channel
    }
  });
});


// 7. POST /api/generate-prompts - Draft slogans, expressions, and safe graphic prompts in a single request
app.post("/api/generate-prompts", async (req, res) => {
  const { userIdea, theme, brandName, brandAudience, brandVoice, brandKeywords, brandMemory, textPreference } = req.body;
  const ai = getGeminiClient();

  try {
    if (!ai) {
      // High-fidelity fallback logic matching brand style & custom idea & no theme request
      const isRugged = brandName.toLowerCase().includes("apex") || brandAudience.toLowerCase().includes("dad");
      const cleanIdea = userIdea?.trim() || "all year long awesome adventure";
      const themeLabel = theme === "No theme" ? "Evergreen All-Year" : theme;

      const suggestions = isRugged ? [
        {
          slogan: `Fueled by ${cleanIdea}`,
          oneLiner: `Never look back, especially when there's ${cleanIdea} ahead.`,
          expression: `${cleanIdea.toUpperCase()} DAD STATE OF MIND`,
          prompt: `Vintage distressed vector logo badge with typography text "Fueled by ${cleanIdea}", rugged camp setting with mountains, pines, warm amber and charcoal. No trademark infringement, clean outdoor motif.`
        },
        {
          slogan: `Keep It Wild: ${cleanIdea}`,
          oneLiner: `If it doesn't involve ${cleanIdea}, count me out.`,
          expression: `ESTABLISHED IN THE GREAT OUTDOORS`,
          prompt: `Bold weathered round decal of a campfire, stars, and rugged pine silhouettes, integrating custom typography elements for "${cleanIdea.toUpperCase()}". Safe non-copyright stamp style.`
        },
        {
          slogan: `Born to ${cleanIdea}`,
          oneLiner: `${cleanIdea} is my happy hour.`,
          expression: `ROUGH & READY CAMPING CLUB`,
          prompt: `Hand-drawn distressed badge style t-shirt design, a camping mug and pine background, incorporating the expression "Born to ${cleanIdea}". Highly safe, non-infringing typography decals.`
        }
      ] : [
        {
          slogan: `Cozy ${cleanIdea} Vibes`,
          oneLiner: `Meet me where the ${cleanIdea} is soft and warm.`,
          expression: `SLOW SUNSET LIVING`,
          prompt: `Minimalist pastel wave line art decal, integrating cute script typography reading "Cozy ${cleanIdea} Vibes", beach sunset backdrop with calm sand tones. Safe elegant aesthetic.`
        },
        {
          slogan: `Salty Air & ${cleanIdea}`,
          oneLiner: `Less noise, more ${cleanIdea}.`,
          expression: `KINDNESS & SEASHELLS`,
          prompt: `Crayon stroke line illustration of sea shells and soft waves, pastel cream and dusty violet, featuring cursive words "Salty Air & ${cleanIdea}". Free from copyright issues.`
        },
        {
          slogan: `Dreaming of ${cleanIdea}`,
          oneLiner: `A pocketful of shells and a heart full of ${cleanIdea}.`,
          expression: `COASTAL HERITAGE COLLECTIVE`,
          prompt: `Retro 70s-style organic curves stickers, showing a warm mug or tote contour with minimal flower elements, styled text "Dreaming of ${cleanIdea}".`
        }
      ];

      return res.json({
        suggestions,
        brandGuidelinesReflection: `Synthesized evergreen branding slogans for ${brandName}'s TG (${brandAudience}) using a ${brandVoice} voice. Safe for commercial publishing.`,
        isUsingFallback: true
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `You are an elite POD catalog designer and brand copywriter. We want to generate slogan / text options and corresponding image prompts.
      User Seed Concept: "${userIdea || 'Evergreen active lifestyle design'}"
      Selected Target Seasonal Theme: "${theme || 'No theme'}"
      Brand Context Profile: "${brandName}", targeting TG: "${brandAudience}" with voice: "${brandVoice}" and style guidelines: "${brandKeywords}".
      
      Apply these historical style memories:
      - Preferred themes/keywords: ${JSON.stringify(brandMemory?.likedThemes || [])}
      - Avoided blacklisted words/topics: ${JSON.stringify(brandMemory?.dislikedThemes || [])}
      - Extra layout styling notes: ${JSON.stringify(brandMemory?.designStyleLearnings || [])}

      Text Placement Preference: "${textPreference}" (Options are: 'with_text' means output text clearly styled on decal, 'without_text' means pure illustrations, 'no_preference' means you choose the best fit).

      CRITICAL SAFETY & BRAND POLICIES:
      - Ensure absolutely NO trademark, copyright, or intellectual property rights infringement (do not refer to movies, brands, music, or corporate assets).
      - Maintain pristine sentiments: strictly NO off-color remarks, racist, political, offensive, or sentiment-hurting slogans. All ideas must be family-friendly and legally compliant.
      - Ensure the ideas are starkly different for different brands (e.g. customized for a rugged outdoorsy persona versus a cozy sea pastel aesthetic).
      - The slogans, one-liners, and expressions must feel native, clever, and high-converting for this brand's voice and TG.

      Provide exactly 3 custom suggestions. Each suggestion must include:
      1. slogan: Short catchy phrase.
      2. oneLiner: Relaxed or funny social-friendly slogan.
      3. expression: A bold, stylized text/typography expression.
      4. prompt: The exact AI image generation prompt to draw the typography and/or physical vector logo matching the brand's layout style and guidelines.

      Output in JSON structure.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  slogan: { type: Type.STRING, description: "Catchy print slogan" },
                  oneLiner: { type: Type.STRING, description: "A witty one-liner" },
                  expression: { type: Type.STRING, description: "Bold phrase to render on merchandise" },
                  prompt: { type: Type.STRING, description: "Highly safe e-commerce flat vector decal prompt incorporating the slogan text if applicable." }
                },
                required: ["slogan", "oneLiner", "expression", "prompt"]
              }
            },
            brandGuidelinesReflection: { type: Type.STRING, description: "Reflection on how this aligns to the brand voice and TM protection." }
          },
          required: ["suggestions", "brandGuidelinesReflection"]
        }
      }
    });

    const parsed = JSON.parse(response.text.trim());
    res.json(parsed);

  } catch (error: any) {
    console.error("Failed to generate custom slogans and prompts:", error);
    res.status(500).json({ error: error.message || "Failed to formulate brand slogan set." });
  }
});


/* ==========================================================================
   VITE DEV ENVIRONMENT AND MIDDLEWARE WRAPPER
   ========================================================================== */

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    // Use vite's connect instance as middleware
    app.use(vite.middlewares);
  } else {
    // Production serving
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`POD Marketing server active on http://0.0.0.0:${PORT}`);
    console.log(`Vite development middleware configured successfully.`);
  });
}

startServer();
