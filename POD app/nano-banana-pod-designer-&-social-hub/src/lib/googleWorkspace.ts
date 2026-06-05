// Google Workspace REST API Integration Helper
// Contains robust, zero-dependency REST integrations for Google Docs, Sheets, and Drive.

import { Brand, ProductMockup, CampaignMetrics } from "../types";

/**
 * Creates a beautiful, customized Google Doc from Brand memory structure.
 * Leverages Google Drive HTML-to-Doc translation capabilities.
 */
export async function exportBrandGuidelinesToDoc(brand: Brand, accessToken: string): Promise<string> {
  const title = `Brand Rules - ${brand.name}`;
  
  // Create stylized HTML with professional branding guidelines layout
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Arial', sans-serif; color: #1e293b; line-height: 1.6; }
        h1 { color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; font-size: 24px; }
        h2 { color: #1e3a8a; margin-top: 25px; font-size: 18px; border-bottom: 1px dashed #cbd5e1; padding-bottom: 5px; }
        p { margin: 8px 0; font-size: 11pt; }
        ul { margin-left: 20px; padding-left: 0; }
        li { margin-bottom: 5px; font-size: 11pt; }
        .badge { background-color: #f1f5f9; padding: 4px 8px; border-radius: 4px; font-family: monospace; font-size: 10pt; border: 1px solid #e2e8f0; display: inline-block; margin-right: 5px; }
        .palette-item { display: inline-block; width: 60px; height: 35px; border-radius: 4px; margin-right: 10px; border: 1px solid #cbd5e1; text-align: center; font-size: 8pt; line-height: 35px; color: #000; font-weight: bold; }
        .card { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 15px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <h1>Nano Banana Active Brand Memorandum</h1>
      <p><strong>Generated On:</strong> ${new Date().toLocaleDateString()} (Active UTC Sandbox Record)</p>
      
      <h2>1. Brand Basics</h2>
      <p><strong>Brand Name:</strong> ${brand.name}</p>
      <p><strong>Target Audience:</strong> ${brand.audience}</p>
      <p><strong>Brand Voice & Tone:</strong> ${brand.voice}</p>
      
      <h2>2. Visual Guidelines & Keywords</h2>
      <p><strong>Generative Imagery Key Phrases:</strong> <em>${brand.customKeywords || "None specified"}</em></p>
      <p><strong>Color Palette Guidelines:</strong></p>
      <div style="margin: 10px 0;">
        ${brand.colorGuidelines.map(color => `
          <span style="background-color: ${color}; color: ${isColorDark(color) ? '#ffffff' : '#000000'};" class="palette-item">
            ${color}
          </span>
        `).join("")}
      </div>

      <h2>3. Autonomous Learned Preferences (Tinder Deck Signal Memory)</h2>
      <div class="card">
        <p><strong>Liked Themes & Angles:</strong></p>
        <ul>
          ${(brand.memory.likedThemes && brand.memory.likedThemes.length > 0)
            ? brand.memory.likedThemes.map(t => `<li>${t}</li>`).join("")
            : "<li>No preferred themes recorded yet. Like items in the Tinder Deck to train.</li>"
          }
        </ul>
        
        <p><strong>Avoided / Disliked Themes:</strong></p>
        <ul>
          ${(brand.memory.dislikedThemes && brand.memory.dislikedThemes.length > 0)
            ? brand.memory.dislikedThemes.map(t => `<li>${t}</li>`).join("")
            : "<li>No avoided themes recorded yet. Dislike items in the Tinder Deck to train.</li>"
          }
        </ul>
        
        <p><strong>Stylistic & Technical Design Rules:</strong></p>
        <ul>
          ${(brand.memory.designStyleLearnings && brand.memory.designStyleLearnings.length > 0)
            ? brand.memory.designStyleLearnings.map(l => `<li>${l}</li>`).join("")
            : "<li>Guidelines engine is currently indexing design rules based on swipe likes.</li>"
          }
        </ul>
      </div>

      ${brand.guidelinesDocFile ? `
        <h2>4. Parsed Original Source Document</h2>
        <p><strong>Linked Source:</strong> ${brand.guidelinesDocFile}</p>
        <p class="card" style="font-style: italic;">${brand.guidelinesDocText || ""}</p>
      ` : ""}
      
      <p style="margin-top: 40px; font-size: 9pt; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 10px;">
        Designed and Exported via Google Workspace Connector.
      </p>
    </body>
    </html>
  `;

  // Standard multi-part body separator
  const boundary = "314159265358979323846";
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;
  
  const metadata = {
    name: title,
    mimeType: "application/vnd.google-apps.document", // Drive automatically parses HTML to Google Doc
  };

  const multipartBody = 
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: text/html; charset=UTF-8\r\n\r\n' +
    htmlContent +
    closeDelimiter;

  const response = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": `multipart/related; boundary=${boundary}`,
    },
    body: multipartBody
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Google Doc export failed: ${errText}`);
  }

  const result = await response.json();
  return result.id; // Returns drive file ID of new Google Doc
}

/**
 * Creates a Google Spreadsheet detailing POD mockups and calculated margins.
 */
export async function exportMockupsToSheet(brandName: string, mockups: ProductMockup[], accessToken: string): Promise<string> {
  const sheetTitle = `${brandName} - POD Product Catalog`;
  
  // 1. Create a blank spreadsheet
  const createRes = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      properties: { title: sheetTitle }
    })
  });

  if (!createRes.ok) {
    throw new Error(`Spreadsheet creation failed: ${await createRes.text()}`);
  }
  
  const sheetMeta = await createRes.json();
  const spreadsheetId = sheetMeta.spreadsheetId;

  // 2. Prepare grid rows
  const headers = ["ID", "Title", "Product Type", "Color", "Cost Price ($)", "Retail Price ($)", "Calculated Profit Margin ($)", "ROI (%)", "Tags"];
  const rows = mockups.map(m => {
    const cost = m.costPrice || 10.0;
    const price = m.suggestedPrice || 24.99;
    const profit = Math.max(0, parseFloat((price - cost).toFixed(2)));
    const roi = cost > 0 ? parseFloat(((profit / cost) * 100).toFixed(1)) : 0;
    
    return [
      m.id,
      m.title,
      m.productType.toUpperCase(),
      m.productColor,
      cost,
      price,
      profit,
      `${roi}%`,
      m.tags.join(", ")
    ];
  });

  // Append data values to Sheet1 starting at A1
  const updateRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1?valueInputOption=USER_ENTERED`, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      values: [headers, ...rows]
    })
  });

  if (!updateRes.ok) {
    throw new Error(`Failed to insert catalog rows: ${await updateRes.text()}`);
  }

  return spreadsheetId;
}

/**
 * Creates a Google Spreadsheet representing metrics dashboard performance logs.
 */
export async function exportCampaignMetricsToSheet(brandName: string, metrics: CampaignMetrics[], accessToken: string): Promise<string> {
  const sheetTitle = `${brandName} - Marketing Campaign Analytics`;

  const createRes = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      properties: { title: sheetTitle }
    })
  });

  if (!createRes.ok) {
    throw new Error(`Spreadsheet metric creation failed: ${await createRes.text()}`);
  }

  const sheetMeta = await createRes.json();
  const spreadsheetId = sheetMeta.spreadsheetId;

  // Setup row metrics
  const headers = ["Campaign Name", "Product Title", "Views", "Clicks", "Conversions", "Click-Through Rate (CTR %)", "Conversion Rate (%)", "Total Revenue ($)", "Net Estimated Margins ($)"];
  const rows = metrics.map(c => {
    return [
      c.campaignName,
      c.productTitle,
      c.views,
      c.clicks,
      c.conversions,
      `${c.ctr}%`,
      `${c.conversionRate}%`,
      c.revenue,
      parseFloat((c.revenue * 0.55).toFixed(2)) // Assume standard avg margin ratio of total revenue
    ];
  });

  const updateRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1?valueInputOption=USER_ENTERED`, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      values: [headers, ...rows]
    })
  });

  if (!updateRes.ok) {
    throw new Error(`Failed to insert metrics analytics rows: ${await updateRes.text()}`);
  }

  return spreadsheetId;
}

/**
 * Downloads a composite design or sticker PNG from a url and uploads it directly as a physical asset inside Google Drive
 */
export async function saveMockupImageToDrive(title: string, imageUrl: string, accessToken: string): Promise<string> {
  let fileBlob: Blob;

  try {
    // 1. Fetch imagery directly across servers
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error("Image download failed");
    fileBlob = await response.blob();
  } catch (err) {
    // Fallback block - construct clean synthetic canvas badge blob if cross-origin image download is blocked
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(0, 0, 512, 512);
      ctx.fillStyle = "#facc15";
      ctx.font = "bold 24px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Nano Banana sticker design", 256, 180);
      ctx.fillStyle = "#ffffff";
      ctx.font = "italic 16px monospace";
      ctx.fillText(title, 256, 260);
      ctx.fillStyle = "#64748b";
      ctx.font = "12px sans-serif";
      ctx.fillText("Saved directly from POD Studio", 256, 450);
    }
    
    const blobPromise = new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b || new Blob()), "image/png");
    });
    fileBlob = await blobPromise;
  }

  // 2. Convert Blob to raw base64 data for multi-part file pipeline upload
  const base64Data = await readBlobAsBase64(fileBlob);

  const boundary = "sticker_upload_fence_314159";
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadata = {
    name: `${title.replace(/\s+/g, "_")}.png`,
    mimeType: "image/png"
  };

  const multipartBody = 
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: image/png\r\n' +
    'Content-Transfer-Encoding: base64\r\n\r\n' +
    base64Data +
    closeDelimiter;

  const uploadRes = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": `multipart/related; boundary=${boundary}`
    },
    body: multipartBody
  });

  if (!uploadRes.ok) {
    throw new Error(`Google Drive sticker file upload failed: ${await uploadRes.text()}`);
  }

  const result = await uploadRes.json();
  return result.id;
}

// Utility function helpers
function isColorDark(hex: string): boolean {
  const c = hex.substring(1);
  const rgb = parseInt(c, 16);
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >> 8) & 0xff;
  const b = (rgb >> 0) & 0xff;
  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b; // ITU-R BT.709
  return luma < 128;
}

function readBlobAsBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // strip standard header metadata prefixes (e.g., "data:image/png;base64,")
      const base64 = result.substring(result.indexOf(",") + 1);
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
