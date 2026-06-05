# 📘 E-Commerce POD Creator Studio: Production Backend Integration Guide

This handbook serves as the structural architectural layout and step-by-step instructions for turning this Print-on-Demand (POD) & Social Media Ad Campaign designer into a fully scaled, secure, production-ready product.

---

## 1. System Architecture Overview

The application is built on a high-performing full-stack framework leveraging **Express (v4/v5)** as the core API router and asset server, and **Vite** mounted inside Express via development middleware for high-comfort hot-swappable streaming. 

```
┌────────────────────────────────────────────────────────┐
│                   Vite SPA UI (React)                  │
└───────────────────────────┬────────────────────────────┘
                            │ API Requests (REST JSON)
                            ▼
┌────────────────────────────────────────────────────────┐
│                   Express Web Server                   │
└────┬──────────────────────┬──────────────────────┬─────┘
     │                      │                      │
     ▼ (GCP/Server Secret)  ▼ (Database Proxy)     ▼ (Real POD SDK)
┌───────────┐         ┌───────────┐         ┌────────────┐
│  Gemini   │         │ Persistent│         │  External  │
│  GenAI    │         │ Firestore │         │  Printify/ │
│  Gateway  │         │ Database  │         │  Etsy API  │
└───────────┘         └───────────┘         └────────────┘
```

### Core Stack Highlights
*   **API Framework**: Node.js + Express + TypeScript
*   **AI SDK**: Native `@google/genai` (Official Google Developer SDK)
*   **Development Runner**: `tsx`
*   **Production Bundler**: `esbuild` mapping bundled server files safely to CJS at `dist/server.cjs` for lightning-fast container startups (Docker, Cloud Run)
*   **Asset Handler**: Vite SPA routing fallback (`appType: "spa"`)

---

## 2. API Reference & Interface Contracts

The backend currently manages **six distinct endpoints** powering our AI and e-commerce workflows. For production, you will transition several in-memory local operations into a persistent data layer.

### ── Theme & Trend Discovery ──
#### `GET /api/trends`
Queries the market intelligence system for upcoming seasonal design opportunities.
*   **Query Parameters**:
    ```json
    {
      "locales": "US, UK, CA" // string (comma separated countries to localize results)
    }
    ```
*   **Under the Hood**: Connects to the robust `gemini-3.5-flash` model modeling real-time seasonal timing forecasts, audience alignment, aesthetic core value identifiers, customized color matrices, and marketing guidelines.
*   **Response Payload**:
    ```typescript
    interface TrendResponse {
      trends: Array<{
        id: string;
        title: string;
        category: string;
        targetAudience: string;
        sellingPoint: string;
        hotSellReason: string;
        colorPalette: string[];
        tags: string[];
        marketingAngle: string;
        coreValues: string[];
        colorMixSuggestion: string; // Dynamic instruction on branding integrations
      }>;
      explanation: string; // Work statement
      isUsingFallback: boolean;
    }
    ```

---

### ── Refined prompt Alignment ──
#### `POST /api/analyze-prompt`
Takes a merchant's basic design idea, incorporates their brand voice or style constraints, and aligns it with their historical client swipe memory (favorite design attributes vs themes blacklisted by the store owner).
*   **Request Body**:
    ```typescript
    interface AnalyzePromptRequest {
      userIdea: string;
      brandName: string;
      brandAudience: string;
      brandVoice: string;
      brandKeywords: string;
      brandMemory?: {
        likedThemes: string[];
        dislikedThemes: string[];
        designStyleLearnings: string[];
      };
    }
    ```
*   **Gemini Strategy**: Uses custom instructions to parse seed keywords and outputs a rich, high-fidelity transparent-background decal vector graphic prompt, leaving behind undesirable imagery.
*   **Response Payload**:
    ```json
    {
      "finalRefinedPrompt": "Flat print-on-demand vector illustration decal prompt...",
      "introMessage": "Conversational work commitment message displayed in UI..."
    }
    ```

---

### ── Vector Graphic Generator ──
#### `POST /api/generate-design`
Generates high-resolution apparel stickers.
*   **Request Body**:
    ```json
    {
      "prompt": "Distressed Americana 4th of July design structure...",
      "colorPalette": ["#B22234", "#FFFFFF"],
      "customKeywords": "vintage retro look",
      "activeBrandId": "brand-123"
    }
    ```
*   **Under the Hood**: Uses `gemini-2.5-flash-image` (Nano Banana Series). It must use `generateContent` as outlined by developer design systems rather than legacy methods. Prints high-contrast logos on solid transparent backgrounds.
*   **Response Payload**:
    ```json
    {
      "imageUrl": "data:image/png;base64,...", // High quality base64 image data url
      "promptUsed": "Flat print-on-demand vector...",
      "engineSelected": "Gemini 2.5 Nano Banana Image"
    }
    ```

---

### ── Adaptive Brand Personalization ──
#### `POST /api/brand-learn` & `POST /api/feedback-learn`
These endpoints process interaction logs (such as swiped/liked design prompts, mockup placements, physical scale adjustments, or thumbs-up/down feedback markers on ad copies) and update the brand memory object.
*   **Request Body (`/api/feedback-learn`)**:
    ```typescript
    interface FeedbackLearnRequest {
      brandName: string;
      likedMockups: Array<{ productType: string, placementScale: number }>;
      dislikedMockups: Array<{ productType: string }>;
      likedSocials: Array<{ channel: string, caption: string }>;
      dislikedSocials: Array<{ channel: string }>;
      currentMemory: any;
    }
    ```
*   **AI Extraction Strategy**: Feeds parameters to the LLM to update dynamic brand characteristics. It extracts layout alignment indices, formatting parameters, and copywriting styles.
*   **Response Payload**:
    ```json
    {
      "updatedMemory": {
        "likedThemes": ["Camping Dad", "Pastel Sunrises"],
        "dislikedThemes": ["Corporate Minimalist"],
        "designStyleLearnings": ["Prefers boldoversized graphics", "Favors organic copywriting"],
        "likedMockupsCount": 12,
        "dislikedMockupsCount": 1,
        "mockupFeedbackLearnings": ["Optimizes hoodies matching full chest prints"],
        "socialFeedbackLearnings": ["Tones aligned to engaging lifestyle countdown stories"]
      },
      "hasLearnt": true
    }
    ```

---

### ── Copywriting & Social Campaign Scheduler ──
#### `POST /api/generate-marketing`
Generates fully SEO-optimized listing titles, high-converting product descriptions (materials, sizing, style keywords), targeted packaging retail pricing recommendations, target margins, high-density hashtags, and specific platform social campaigns (Stories, Reels, Pinterest Pins).
*   **Request Body**:
    ```json
    {
      "brand": { "name": "Apex", "audience": "Dads", "voice": "Action-oriented", "memory": {} },
      "product": { "productType": "t-shirt", "costPrice": 12.50 },
      "designPrompt": "Star Spangled S'mores Dad Camping Graphic"
    }
    ```
*   **Response Payload**:
    ```typescript
    interface MarketingResponse {
      title: string; // Etsy/Shopify SEO-optimized title
      description: string; // High-converting description
      hashtags: string[]; // Highly viral hashtag array
      pricing: {
        suggestedPrice: number;
        profitMargin: number;
        text: string; // Pricing strategy explanation text
      };
      instagramBriefs: Array<{
        channel: "instagram-post" | "instagram-story" | "instagram-reel" | "pinterest-pin";
        caption: string;
        visualBrief: string; // Instructions for staging campaign mockups
        sharesSuggested: string;
      }>;
    }
    ```

---

## 3. Persistent Database Architecture

Currently, local memory tracks transient changes during active UI sessions. For production, implement a robust cloud data layer.

### Option A: Firebase Firestore (Recommended)
Firestore is an excellent schemaless NoSQL document store that perfectly fits the scalable json-structured `Brand Memory` payload.

#### Suggested Collections Model:
1.  **`/merchants`**
    ```json
    {
      "uid": "user_id_xyz",
      "email": "user@example.com",
      "createdAt": "2026-05-22T10:10:00Z"
    }
    ```
2.  **`/brands`** (Sub-collection or rooted collection)
    ```json
    {
      "id": "brand-abc",
      "merchantId": "user_id_xyz",
      "name": "Apex Trail Co",
      "audience": "Rugged outdoor campers & hiking fathers",
      "voice": "High energy, authentic, slightly humorous",
      "keywords": "rustic, distress patterns, outdoor",
      "memory": {
        "likedThemes": ["Camping Dad", "Retro Patriotic"],
        "dislikedThemes": ["Corporate Minimal", "Fluorescent Neons"],
        "designStyleLearnings": [
          "Prefers vintage distressed prints with thick outlines",
          "Thrives on neutral warm backing substrates (Oat, Mustard)"
        ],
        "mockupFeedbackLearnings": [
          "Optimizes standard t-shirt sizes mapping 45% scaling index"
        ],
        "socialFeedbackLearnings": [
          "Responsive to action-driven countdown captions"
        ]
      }
    }
    ```
3.  **`/mockups`**: Holds generated vector PNG designs, canvas placements, dimensions, cost metrics, and likes.
4.  **`/social_campaigns`**: Holds written Instagram content, Pin layouts, and scheduler queues.

---

## 4. Real Print-on-Demand & Sales Integration

To fulfill real product purchases, connect directly to Print-on-Demand providers and e-commerce platforms.

### Step 1: Printify API Integration
Deploy your generated transparent PNGs directly onto physical fabric substrates using Printify's developer API.

1.  **Authorize API Token**: Obtain a developer API Key from your Printify Settings tab.
2.  **Get print templates and locations**:
    *   Endpoint: `GET https://api.printify.com/v1/shops/{shop_id}/products.json`
3.  **Deploy Transparent Visual Layer**:
    When the merchant approves a creation in your studio, upload the PNG asset directly to Printify's media vault and bind its structural coordinates (x, y, scale factor) matching your React canvas layout metrics.
    ```javascript
    // Example Node.js Controller Integration
    const uploadPrintifyAsset = async (imageUrl, prodName) => {
      const response = await fetch("https://api.printify.com/v1/uploads/images.json", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.PRINTIFY_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          file_name: `${prodName}-printify-overlay.png`,
          url: imageUrl // Public Cloud Storage URL containing PNG decal
        })
      });
      return await response.json(); // Returns Printify Image ID
    };
    ```

### Step 2: Etsy / Shopify Oauth and Auto-Publishing
1.  Configure OAuth credentials in Shopify Dev Portal or Etsy Developer space. Set the redirect routes safely using secure HTTPS callback urls back to your web server.
2.  **Sync Listings**: Transform `/api/generate-marketing` response schemas into Etsy Listing creation parameters:
    *   **Etsy Endpoint**: `POST https://openapi.etsy.com/v3/application/shops/{shop_id}/listings`
    *   **Shopify Endpoint**: `POST /admin/api/2026-04/products.json`

---

## 5. Security & Keys Management Program

Your production deployment must secure API keys on the server to prevent browser leaks.

### Rules of Engagement
1.  **No Client-Side Secrets**: Never prefix sensitive keys (like `GEMINI_API_KEY`, `PRINTIFY_API_KEY`, or database credentials) with `VITE_` in React. Doing so exposes secrets directly to the client's web browser console.
2.  **Secure Proxy Handlers**: Keep API route parameters locked safely inside `server.ts` or distinct server-side route files under `/api/*`.

### Production `.env` Guidelines
Ensure these details exist inside your production deployment console. Add variables to `.env` using this standard sequence:

```env
# Server Framework Settings
NODE_ENV=production
PORT=3000

# Google Gemini Credentials
GEMINI_API_KEY=your_secured_gcp_gemini_api_key_here

# E-Commerce Fulfillment Bridges (Store Securely)
PRINTIFY_API_KEY=pr_developer_key_abc123...
ETSY_API_KEY=etsy_client_secret_xyz...
SHOPIFY_ACCESS_TOKEN=shpat_storefront_integration_token...

# Production Database Credentials
DATABASE_URL=postgresql://db_user:password@cloud_sql_ip/pod_studio
```

---

## 6. Docker Container Production Deployment

Package the Node + Express server using a multi-stage Docker deployment optimized for Cloud Run or Kubernetes.

```dockerfile
# Multi-stage Dockerfile setup
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
# If server compiles files directly into bundler output:
EXPOSE 3000
CMD ["node", "dist/server.cjs"]
```

Following this guide, your application's robust, client-adaptable UI will integrate smoothly with scalable server processes, secure database frameworks, and actual POD logistics channels!
