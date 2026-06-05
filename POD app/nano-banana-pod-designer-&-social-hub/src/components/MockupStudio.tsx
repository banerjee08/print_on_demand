import React, { useState } from "react";
import { 
  ShoppingCart, Layout, Sliders, ChevronRight, Check, AlertCircle, ShoppingBag, Eye, RefreshCw, 
  Layers, Sparkles, Building, BarChart2, TrendingUp, DollarSign, Truck, Landmark, Info, Percent,
  Download, Square, CheckSquare, Megaphone, ArrowUpRight, ThumbsUp, ThumbsDown
} from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";
import { DesignCard, ProductMockup, ProductType, Brand, SocialAsset } from "../types";
import { getGoogleAccessToken, isGoogleAuthenticated } from "../lib/googleAuth";
import { exportMockupsToSheet, saveMockupImageToDrive } from "../lib/googleWorkspace";

interface MockupStudioProps {
  likedDesigns: DesignCard[];
  activeBrand: Brand;
  onMockupCreated: (mockup: ProductMockup) => void;
  createdMockups: ProductMockup[];
  onUpdateMockupPrices?: (updatedMockups: ProductMockup[]) => void;
  onSocialAssetCreated?: (asset: SocialAsset) => void;
  onMockupLike?: (mockupId: string, status: 'liked' | 'disliked' | 'none') => void;
}

interface SubstrateSpec {
  name: string;
  provider: "Printify" | "Printful";
  manufacturer: string;
  wholesaleCost: number;
  printSize: string;
  printPixels: string;
  dpiRequired: number;
  material: string;
  defaultPlacement: string;
  presets: { name: string; scale: number; x: number; y: number }[];
}

const substrateSpecifications: Record<ProductType, { Printify: SubstrateSpec; Printful: SubstrateSpec }> = {
  "t-shirt": {
    "Printify": {
      name: "Unisex Ultra Cotton Tee (Gildan 5000)",
      provider: "Printify",
      manufacturer: "Monster Digital",
      wholesaleCost: 11.50,
      printSize: "12.0 in x 16.0 in",
      printPixels: "3600 x 4800 px",
      dpiRequired: 300,
      material: "100% Preshrunk Jersey Cotton, 5.3 oz/yd²",
      defaultPlacement: "Front Chest Center",
      presets: [
        { name: "Chest Standard", scale: 48, x: 0, y: -10 },
        { name: "Oversized Streetwear", scale: 70, x: 0, y: 5 },
        { name: "Left Chest Pocket", scale: 22, x: -25, y: -25 },
        { name: "High Collar Banner", scale: 51, x: 0, y: -45 }
      ]
    },
    "Printful": {
      name: "Unisex Staple Tee (Bella+Canvas 3001)",
      provider: "Printful",
      manufacturer: "Printful USA",
      wholesaleCost: 13.20,
      printSize: "12.0 in x 16.0 in",
      printPixels: "3600 x 4800 px",
      dpiRequired: 300,
      material: "100% Combed & Ring-Spun Cotton, 4.2 oz/yd²",
      defaultPlacement: "Center Chest High",
      presets: [
        { name: "Standard High Fit", scale: 44, x: 0, y: -12 },
        { name: "Vibrant Poster Print", scale: 66, x: 0, y: 0 },
        { name: "Pocket Sub-logo", scale: 20, x: -22, y: -22 },
        { name: "Collar Accent Emblem", scale: 40, x: 0, y: -40 }
      ]
    }
  },
  "hoodie": {
    "Printify": {
      name: "Unisex Heavy Blend Hoodie (Gildan 18500)",
      provider: "Printify",
      manufacturer: "SwiftPOD",
      wholesaleCost: 19.50,
      printSize: "14.0 in x 15.0 in",
      printPixels: "4200 x 4500 px",
      dpiRequired: 300,
      material: "50% Cotton / 50% Polyester fleece, 8.0 oz/yd²",
      defaultPlacement: "Front Pocket Center",
      presets: [
        { name: "Classic Cozy Center", scale: 45, x: 0, y: -5 },
        { name: "Street Heavy Oversized", scale: 68, x: 0, y: 10 },
        { name: "Left Breast Crest", scale: 22, x: -20, y: -15 },
        { name: "Upper Hood Collar Line", scale: 35, x: 0, y: -35 }
      ]
    },
    "Printful": {
      name: "Premium Soft Fleece Hoodie (Gildan 18500)",
      provider: "Printful",
      manufacturer: "Printful Logistics",
      wholesaleCost: 21.50,
      printSize: "12.0 in x 12.0 in",
      printPixels: "3600 x 3600 px",
      dpiRequired: 300,
      material: "65% Ring-spun cotton, 35% polyester, 8.5 oz/yd²",
      defaultPlacement: "Center Front Chest",
      presets: [
        { name: "Symmetric Chest Spot", scale: 40, x: 0, y: -8 },
        { name: "Comfort Loose Scale", scale: 55, x: 0, y: 5 },
        { name: "Minimal Left Label", scale: 18, x: -24, y: -10 },
        { name: "Midline Horizontal Banner", scale: 48, x: 0, y: -25 }
      ]
    }
  },
  "mug": {
    "Printify": {
      name: "High-Gloss Sublimation Ceramic Mug (11oz)",
      provider: "Printify",
      manufacturer: "District Photo",
      wholesaleCost: 4.80,
      printSize: "9.0 in x 3.5 in wrap",
      printPixels: "2700 x 1050 px",
      dpiRequired: 300,
      material: "100% Glossy Ceramic, Lead and BPA-free",
      defaultPlacement: "Center Mug Wrap",
      presets: [
        { name: "Left Hand View", scale: 35, x: -25, y: 0 },
        { name: "Mug Center Wrap", scale: 38, x: 0, y: 0 },
        { name: "Right Hand View", scale: 35, x: 25, y: 0 },
        { name: "Dual Emblem Print", scale: 30, x: 0, y: 5 }
      ]
    },
    "Printful": {
      name: "White Ceramic Mug (11oz)",
      provider: "Printful",
      manufacturer: "Printful Europe/US",
      wholesaleCost: 5.20,
      printSize: "9.0 in x 3.5 in wrap",
      printPixels: "2700 x 1050 px",
      dpiRequired: 300,
      material: "100% Glossy Ceramic, Dishwasher and microwave safe",
      defaultPlacement: "Front Mug Decal",
      presets: [
        { name: "Facing Viewer Right", scale: 36, x: 22, y: 0 },
        { name: "Bespoke Full Wrap", scale: 40, x: 0, y: 0 },
        { name: "Facing Viewer Left", scale: 36, x: -22, y: 0 },
        { name: "Minimal Upper Band", scale: 28, x: 0, y: -15 }
      ]
    }
  },
  "tote-bag": {
    "Printify": {
      name: "Cozy Canvas Eco Tote Bag",
      provider: "Printify",
      manufacturer: "Printed Mint",
      wholesaleCost: 8.00,
      printSize: "10.0 in x 12.0 in",
      printPixels: "3000 x 3600 px",
      dpiRequired: 300,
      material: "100% Natural Cotton Canvas, 8.0 oz/yd²",
      defaultPlacement: "Front Center Layout",
      presets: [
        { name: "Aesthetic Balanced", scale: 50, x: 0, y: 0 },
        { name: "AOP Look Fill-out", scale: 75, x: 0, y: 10 },
        { name: "Lower Right Corner", scale: 25, x: 20, y: 25 },
        { name: "Upper Minimal Banner", scale: 40, x: 0, y: -20 }
      ]
    },
    "Printful": {
      name: "Organic Eco Canvas Tote Bag",
      provider: "Printful",
      manufacturer: "Latvia Fulfillment",
      wholesaleCost: 9.50,
      printSize: "12.0 in x 12.0 in",
      printPixels: "3600 x 3600 px",
      dpiRequired: 300,
      material: "100% Certified Organic Cotton Canvas, 10.0 oz/yd²",
      defaultPlacement: "Center Front Square",
      presets: [
        { name: "Perfect Centered", scale: 45, x: 0, y: -5 },
        { name: "Max Coverage Spot", scale: 65, x: 0, y: 5 },
        { name: "Left Corner Accent", scale: 20, x: -25, y: 15 },
        { name: "Bottom Graphic Deck", scale: 38, x: 0, y: 25 }
      ]
    }
  },
  "phone-case": {
    "Printify": {
      name: "Tough Polycarbonate Armor Case",
      provider: "Printify",
      manufacturer: "Spoke Custom",
      wholesaleCost: 6.80,
      printSize: "3.25 in x 6.5 in wrap",
      printPixels: "975 x 1950 px",
      dpiRequired: 300,
      material: "Dual layer polycarbonate outer with shockproof TPU core",
      defaultPlacement: "Full Case Back Wrap",
      presets: [
        { name: "Full AOP Fit-out", scale: 80, x: 0, y: 0 },
        { name: "Standard Back Crest", scale: 55, x: 0, y: 0 },
        { name: "Lower Third Accent", scale: 35, x: 0, y: 20 },
        { name: "Upper Center Focus", scale: 40, x: 0, y: -15 }
      ]
    },
    "Printful": {
      name: "Clear TPU Protective Phone Case",
      provider: "Printful",
      manufacturer: "Charlotte Facility",
      wholesaleCost: 7.90,
      printSize: "2.75 in x 5.75 in",
      printPixels: "825 x 1725 px",
      dpiRequired: 300,
      material: "Thermoplastic Polyurethane (TPU) and Polycarbonate (PC)",
      defaultPlacement: "Back Only UV Print",
      presets: [
        { name: "Clear Back Accent", scale: 60, x: 0, y: -5 },
        { name: "Centered Artwork Base", scale: 50, x: 0, y: 0 },
        { name: "Lower Pocket Brand", scale: 30, x: 0, y: 25 },
        { name: "Split Screen Decal", scale: 45, x: 0, y: -20 }
      ]
    }
  }
};

const MARKET_RETAIL_RANGES: Record<ProductType, { min: number; max: number; average: number }> = {
  "t-shirt": { min: 18.00, max: 29.99, average: 24.50 },
  "hoodie": { min: 38.00, max: 69.99, average: 49.99 },
  "mug": { min: 12.00, max: 21.00, average: 15.99 },
  "tote-bag": { min: 14.00, max: 26.00, average: 19.50 },
  "phone-case": { min: 16.00, max: 34.00, average: 25.00 }
};

const DEFAULT_SHIPPING: Record<ProductType, number> = {
  "t-shirt": 4.75,
  "hoodie": 7.50,
  "mug": 5.99,
  "tote-bag": 4.50,
  "phone-case": 3.99
};

export default function MockupStudio({
  likedDesigns,
  activeBrand,
  onMockupCreated,
  createdMockups,
  onUpdateMockupPrices,
  onSocialAssetCreated,
  onMockupLike,
}: MockupStudioProps) {
  const [selectedDesign, setSelectedDesign] = useState<DesignCard | null>(likedDesigns[0] || null);
  const [productType, setProductType] = useState<ProductType>("t-shirt");
  const [productColor, setProductColor] = useState("#F8FAFC");
  const [scale, setScale] = useState(40); // 40%
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(-15);
  const [bypassedLimit, setBypassedLimit] = useState(false);
  const [loadingListing, setLoadingListing] = useState(false);

  // Active production provider toggle: Printify vs Printful
  const [activeProvider, setActiveProvider] = useState<"Printify" | "Printful">("Printify");
  // Catalog filter: all, liked, disliked
  const [catalogFilter, setCatalogFilter] = useState<'all' | 'liked' | 'disliked'>('all');

  // Dynamic pricing state variables
  const [shippingCost, setShippingCost] = useState<number>(4.75);
  const [listingFee, setListingFee] = useState<number>(0.20); // standard Etsy or Shopify listing expense
  const [transactionFeePercent, setTransactionFeePercent] = useState<number>(6.5); // standard channel cut
  const [adsBuffer, setAdsBuffer] = useState<number>(2.00); // customer acquisition margin
  const [targetMarginPercent, setTargetMarginPercent] = useState<number>(40); // target markup net margin
  const [overrideRetailPrice, setOverrideRetailPrice] = useState<string>("");

  // Catalog selection, export, and bulk price modifier states
  const [selectedCatalogIds, setSelectedCatalogIds] = useState<string[]>([]);
  const [bulkPercentModifier, setBulkPercentModifier] = useState<string>("10");
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);

  // Google Sync States
  const [exportingToSheets, setExportingToSheets] = useState(false);
  const [syncedSpreadsheetId, setSyncedSpreadsheetId] = useState<string | null>(null);
  const [googleSheetError, setGoogleSheetError] = useState<string | null>(null);

  // Google Drive states
  const [savingToDriveId, setSavingToDriveId] = useState<string | null>(null);
  const [driveSaveSuccess, setDriveSaveSuccess] = useState<string | null>(null);

  const handleExportToGoogleSheets = async () => {
    setIsExportDropdownOpen(false);
    const token = getGoogleAccessToken();
    if (!token) {
      setGoogleSheetError("Google Workspace Connection offline! Configure credentials in Sidebar menu first.");
      return;
    }
    setExportingToSheets(true);
    setGoogleSheetError(null);
    setSyncedSpreadsheetId(null);
    try {
      const sheetId = await exportMockupsToSheet(activeBrand.name, createdMockups, token);
      setSyncedSpreadsheetId(sheetId);
    } catch (err: any) {
      console.error(err);
      setGoogleSheetError(err.message || "Failed to sync catalog to Google Sheets.");
    } finally {
      setExportingToSheets(false);
    }
  };

  const handleSaveMockupToDrive = async (mock: ProductMockup) => {
    const token = getGoogleAccessToken();
    if (!token) {
      alert("Google Workspace Connection offline! Configure credentials in Sidebar/Connection panel first.");
      return;
    }
    setSavingToDriveId(mock.id);
    setDriveSaveSuccess(null);
    try {
      await saveMockupImageToDrive(mock.title, mock.mockupUrl, token);
      setDriveSaveSuccess(mock.id);
      setTimeout(() => setDriveSaveSuccess(null), 4000);
    } catch (err: any) {
      console.error(err);
      alert(`Failed to save design to Google Drive: ${err.message || err}`);
    } finally {
      setSavingToDriveId(null);
    }
  };

  // JSON Catalog Exporter
  const handleExportAsJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(createdMockups, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `catalog_export_${activeBrand.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setIsExportDropdownOpen(false);
  };

  // CSV Catalog Exporter
  const handleExportAsCSV = () => {
    const headers = ["ID", "Title", "Product Type", "Retail Price ($)", "Cost Price ($)", "Net Profit ($)", "Tags", "Primary Color", "Placement Scale", "Placement Offset X", "Placement Offset Y"];
    const rows = createdMockups.map(mock => {
      const netProfit = mock.suggestedPrice - mock.costPrice;
      return [
        mock.id,
        `"${mock.title.replace(/"/g, '""')}"`,
        mock.productType,
        mock.suggestedPrice.toFixed(2),
        mock.costPrice.toFixed(2),
        netProfit.toFixed(2),
        `"${mock.tags.join(', ')}"`,
        mock.productColor,
        mock.placementScale,
        mock.placementOffset.x,
        mock.placementOffset.y
      ];
    });
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", encodedUri);
    downloadAnchor.setAttribute("download", `catalog_export_${activeBrand.id}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setIsExportDropdownOpen(false);
  };

  // Bulk Price Modifier
  const handleBulkPriceModify = () => {
    const parsedPercent = parseFloat(bulkPercentModifier);
    if (isNaN(parsedPercent)) {
      alert("Please specify a valid numeric percentage change (e.g. 10 or -15).");
      return;
    }

    if (!onUpdateMockupPrices) {
      alert("Pricing update handler callback is not configured.");
      return;
    }

    // Adjust price by set percentage
    const updated = createdMockups.map(mock => {
      const multiplier = 1 + (parsedPercent / 100);
      const newPrice = Math.max(0.01, Math.round(mock.suggestedPrice * multiplier * 100) / 100);
      return {
        ...mock,
        suggestedPrice: newPrice
      };
    });

    onUpdateMockupPrices(updated);
    alert(`Success! Updated retail prices for all ${createdMockups.length} catalog mockups by ${parsedPercent > 0 ? '+' : ''}${parsedPercent}%.`);
  };

  // Bulk Publish / Move multiple to Marketing Hub
  const handlePublishSelectedToHub = () => {
    const targetsToPublish = selectedCatalogIds.length > 0 
      ? selectedCatalogIds 
      : createdMockups.map(m => m.id);

    if (targetsToPublish.length === 0) {
      alert("Please select at least one mockup first, or create some listings.");
      return;
    }

    if (!onSocialAssetCreated) {
      alert("Social creative syndication flow is not configured.");
      return;
    }

    let publishedCount = 0;
    targetsToPublish.forEach((mockId) => {
      const mock = createdMockups.find(m => m.id === mockId);
      if (!mock) return;

      const channels: ('instagram-story' | 'instagram-reel' | 'pinterest-pin')[] = [
        "instagram-story",
        "instagram-reel",
        "pinterest-pin"
      ];

      const copyBriefs = {
        "instagram-story": {
          caption: `🔥 HOT RUN! The verified premium ${mock.productType} design "${mock.title}" is officially live in our catalog! Highly requested by our active community. Grab yours today for only $${mock.suggestedPrice.toFixed(2)} with standard secure dispatch. Swipe up!`,
          brief: `Aesthetic instagram vertical overlay frame featuring high detail mockup rendering over sand color background with clean label tag`,
          placement: "Instagram Story Highlight Slot"
        },
        "instagram-reel": {
          caption: `POV: You styled the clean mockup of the season. 😮‍💨 Standard GILDAN build specs ensure absolute maximum daily breathing comfort. Premium typography and decals on point! Shop online for $${mock.suggestedPrice.toFixed(2)}. ✨`,
          brief: `Atmospheric micro cinematic panning movement showcasing the mockup textile overlays with relaxed organic beach sunset soundtrack`,
          placement: "Instagram Reels Feed"
        },
        "pinterest-pin": {
          caption: `How to build a clean lifestyle outfit collection around a cozy customizable ${mock.productType}. Distressed colors styled nicely with vintage aesthetic elements. Retails at $${mock.suggestedPrice.toFixed(2)}.`,
          brief: `Tall Pinterest board styling template showcasing outfit layouts and highlighted cost-benefit indicators`,
          placement: "Pinterest Editorial Focus Pin"
        }
      };

      channels.forEach((chan, index) => {
        const freshAsset: SocialAsset = {
          id: `social-${Date.now()}-${mock.id}-${index}-${index}`,
          productId: mock.id,
          productTitle: mock.title,
          brandId: mock.brandId,
          channel: chan,
          caption: copyBriefs[chan].caption,
          hashtags: mock.tags.concat(["etsy", "shopify", "printondemand", "newrelease"]),
          visualBrief: copyBriefs[chan].brief,
          status: "draft",
          sharesSuggested: copyBriefs[chan].placement,
        };
        onSocialAssetCreated(freshAsset);
      });
      publishedCount++;
    });

    alert(`Successfully bulk syndicated ${publishedCount} products to the Social Hub! Generated multi-channel Story, Reel, and Pinterest draft campaigns.`);
    setSelectedCatalogIds([]); // Clear selections
  };

  // Goal targets
  const currentCount = likedDesigns.length;
  const targetCount = 10;
  const isGoalReached = currentCount >= targetCount || bypassedLimit;

  const currentSpec = substrateSpecifications[productType][activeProvider];

  // Pricing calculations
  const vendorCost = currentSpec.wholesaleCost;
  const flatExpenses = listingFee + adsBuffer;
  const totalCostBase = vendorCost + shippingCost + flatExpenses;

  // Margin target math formula: Retail Price = totalCostBase / (1 - (margin% + transaction%))
  const sumPercents = (targetMarginPercent + transactionFeePercent) / 100;
  let calculatedRetail = 0;
  if (sumPercents < 1) {
    calculatedRetail = totalCostBase / (1 - sumPercents);
  } else {
    calculatedRetail = totalCostBase * (1 + targetMarginPercent / 100) * (1 + transactionFeePercent / 100);
  }

  const finalCalculatedPrice = Math.round(calculatedRetail * 100) / 100;
  const finalPriceToUse = overrideRetailPrice !== "" ? parseFloat(overrideRetailPrice) || finalCalculatedPrice : finalCalculatedPrice;

  // Exact profit breakdown values
  const platformFeeValue = Math.round((finalPriceToUse * (transactionFeePercent / 105)) * 100) / 100; // safe math bounds
  const rawProfitValue = Math.round((finalPriceToUse - totalCostBase - platformFeeValue) * 100) / 100;
  const netMarginCalculated = finalPriceToUse > 0 ? Math.round((rawProfitValue / finalPriceToUse) * 1000) / 10 : 0;

  // Handles generating print description/prices with Gemini
  const handleFinalizeProductListing = async () => {
    if (!selectedDesign) return;
    setLoadingListing(true);

    try {
      const res = await fetch("/api/generate-marketing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand: activeBrand,
          product: {
            productType,
            costPrice: currentSpec.wholesaleCost,
          },
          designPrompt: selectedDesign.prompt,
        }),
      });

      if (!res.ok) throw new Error("Marketing generation failed");
      const marketingData = await res.json();

      // Create physical mockup item state
      const newMockup: ProductMockup = {
        id: "mockup-" + Date.now(),
        designId: selectedDesign.id,
        designUrl: selectedDesign.imageUrl,
        brandId: activeBrand.id,
        productType,
        productColor,
        placementScale: scale / 100,
        placementOffset: { x: offsetX, y: offsetY },
        title: marketingData.title || `Custom ${productType.toUpperCase()} - ${selectedDesign.theme} Edition`,
        description: marketingData.description || `High-quality printed ${productType}. Beautiful custom graphics.`,
        suggestedPrice: finalPriceToUse, // Persisted fully with breakdown pricing
        costPrice: currentSpec.wholesaleCost,
        tags: marketingData.hashtags || ["printondemand"],
        mockupUrl: selectedDesign.imageUrl, // Kept for image referencing
      };

      onMockupCreated(newMockup);
      alert(`Success! "${newMockup.title}" has been mocked up. Dynamic copywriting lists, recommended pricing ($${finalPriceToUse.toFixed(2)}), and hashtags are populated based on the ${activeBrand.name} active guidelines.`);

    } catch (err: any) {
      console.error(err);
      alert("Failed to write copywriting data. Adding mockup with standard defaults.");
    } finally {
      setLoadingListing(false);
    }
  };

  return (
    <div id="mockup-studio" className="space-y-8">
      {/* Target Progress Bar */}
      <div className="bg-white p-6 rounded-3xl border-3 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2 uppercase tracking-wide">
              <ShoppingBag className="text-yellow-400 w-5 h-5 stroke-[2.5]" />
              E-commerce Inventory Hub
            </h3>
            <p className="text-slate-500 font-bold text-xs mt-1">
              We recommend saving at least <span className="font-black text-slate-800">10 loved designs</span> in your Tinder deck to generate full product listings and bulk-push to stores.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs font-black font-mono text-slate-900 bg-yellow-400 p-2 px-3 rounded-2xl border-2 border-slate-900 shadow-[1.5px_1.5px_0px_0px_rgba(15,23,42,1)]">
              {currentCount} / {targetCount} Likes
            </span>
            {!isGoalReached && (
              <button
                id="btn-bypass-studio-limit"
                onClick={() => setBypassedLimit(true)}
                className="text-xs bg-white hover:bg-slate-50 text-rose-500 font-black py-2 px-3.5 rounded-xl border-2 border-slate-900 shadow-[1.5px_1.5px_0px_0px_rgba(15,23,42,1)] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer uppercase tracking-tight"
              >
                Unlock Studio Now
              </button>
            )}
          </div>
        </div>

        {/* Progress Visual */}
        <div className="mt-4">
          <div className="w-full bg-slate-100 rounded-full h-4 border-2 border-slate-900 overflow-hidden">
            <div
              className="bg-yellow-400 h-full border-r-2 border-slate-900 transition-all duration-500"
              style={{ width: `${Math.min((currentCount / targetCount) * 100, 100)}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-1.5 text-right font-black uppercase tracking-wide">
            Goal: build premium merchandise and sell directly on Etsy, Shopify, Printify, or Printful
          </p>
        </div>
      </div>

      {/* Grid: Left Column selectors & Sliders, Right Mockup Render */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Options panel */}
        <div className="lg:col-span-12 xl:col-span-7 space-y-6">
          <div className="bg-white p-6 rounded-3xl border-3 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] space-y-5">
            <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5 uppercase tracking-wider pb-2 border-b-2 border-dashed border-slate-200">
              <Sliders className="w-5 h-5 text-slate-900 stroke-[2.5]" />
              Print-On-Demand Substrate Customizer
            </h4>

            {/* Design selector */}
            <div>
              <label className="text-[10px] font-black text-slate-400 block mb-2 font-mono uppercase tracking-wider">
                1. Select Liked Sandbox Graphics:
              </label>
              {likedDesigns.length === 0 ? (
                <div className="p-4 bg-slate-50 text-slate-500 rounded-2xl text-xs text-center border-2 border-slate-300 border-dashed font-bold">
                  No liked designs found! Go swipe some designs in Tinder Sandbox first.
                </div>
              ) : (
                <div className="flex gap-3.5 overflow-x-auto pb-3 scrollbar-thin">
                  {likedDesigns.map((d) => {
                    const isPicked = selectedDesign?.id === d.id;
                    return (
                      <div
                        id={`pick-design-${d.id}`}
                        key={d.id}
                        onClick={() => setSelectedDesign(d)}
                        className={`relative w-16 h-16 rounded-2xl border-2 overflow-hidden cursor-pointer shrink-0 transition-all ${
                          isPicked
                            ? "border-slate-900 ring-4 ring-yellow-400 scale-102 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]"
                            : "border-slate-300 hover:border-slate-900"
                        }`}
                      >
                        <img src={d.imageUrl} alt="" className="w-full h-full object-cover" />
                        {isPicked && (
                          <div className="absolute top-0.5 right-0.5 bg-yellow-400 border border-slate-900 text-slate-905 rounded-full p-0.5 shadow-sm">
                            <Check className="w-2.5 h-2.5 stroke-[4]" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Product format selector */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 block mb-2 font-mono uppercase tracking-wider">
                  2. Select Product Template:
                </label>
                <select
                  id="select-mockup-product-type"
                  value={productType}
                  onChange={(e) => {
                    const t = e.target.value as ProductType;
                    setProductType(t);
                    if (t === "mug") setProductColor("#FFFFFF");
                    // Sync default shipping automatically
                    setShippingCost(DEFAULT_SHIPPING[t]);
                    setOverrideRetailPrice("");
                  }}
                  className="w-full text-xs font-semibold border-2 border-slate-900 focus:outline-none p-2.5 rounded-xl bg-white shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] focus:ring-1 focus:ring-yellow-400 cursor-pointer"
                >
                  <option value="t-shirt">Unisex Short Sleeve Tee (Printify)</option>
                  <option value="hoodie">Cozy Heavyweight Hoodie (Printify)</option>
                  <option value="mug">11oz Sublimation Mug (Printful)</option>
                  <option value="tote-bag">Eco-Friendly Canvas Tote Bag (Printify)</option>
                  <option value="phone-case">Tough Polycarbonate Phone Case (Printify)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 block mb-2 font-mono uppercase tracking-wider">
                  3. Choose Substrate Colorway:
                </label>
                {productType === "mug" ? (
                  <div className="p-2.5 bg-slate-100 border-2 border-slate-900 rounded-xl text-xs text-slate-705 font-mono font-bold shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] text-center text-slate-700">
                    Classic White Sublimation Ceramic
                  </div>
                ) : (
                  <div className="flex gap-2.5 flex-wrap pt-1">
                    {[
                      { value: "#F8FAFC", label: "Sand White" },
                      { value: "#2D2D2D", label: "Charcoal" },
                      { value: "#3C4B6E", label: "Navy Blue" },
                      { value: "#8CA296", label: "Sage Green" },
                      { value: "#EEDAB2", label: "Warm Oats" },
                    ].map((col) => (
                      <button
                        key={col.value}
                        onClick={() => setProductColor(col.value)}
                        className={`w-6 h-6 rounded-full border-2 border-slate-900 shadow-inner transition-all relative cursor-pointer ${
                          productColor === col.value ? "scale-120 ring-4 ring-yellow-400" : "border-slate-900"
                        }`}
                        style={{ backgroundColor: col.value }}
                        title={col.label}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* E-Commerce Profit Optimizer & Retail Advisors */}
            <div className="bg-amber-50/40 p-5 rounded-2xl border-2 border-slate-900 space-y-4 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
              <div className="flex items-center justify-between">
                <h5 className="font-black text-slate-950 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  E-Commerce Pricing Optimizer & Retail Advisor
                </h5>
                <span className="text-[9px] bg-slate-900 text-yellow-450 text-yellow-400 font-mono font-black uppercase px-2 py-0.5 rounded">
                  Live Breakdowns
                </span>
              </div>

              {/* Grid: Adjustments left, breakdown outputs right */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
                {/* Adjustments inputs */}
                <div className="space-y-3 font-bold text-xs text-slate-700">
                  <div>
                    <label className="text-[10px] uppercase font-black text-slate-500 block mb-1">
                      Target Profit Margin: <span className="text-slate-900 font-mono font-black">{targetMarginPercent}%</span>
                    </label>
                    <input
                      id="pricing-input-margin"
                      type="range"
                      min="10"
                      max="150"
                      value={targetMarginPercent}
                      onChange={(e) => setTargetMarginPercent(Number(e.target.value))}
                      className="w-full accent-yellow-450 accent-yellow-400 cursor-ew-resize"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[10px] uppercase font-black text-slate-500">
                        Transportation / Shipping Cost:
                      </label>
                      <span className="text-[9px] font-mono font-black text-slate-400">Default: ${DEFAULT_SHIPPING[productType].toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-slate-500 font-black">$</span>
                      <input
                        id="pricing-input-shipping"
                        type="number"
                        step="0.01"
                        min="0"
                        value={shippingCost}
                        onChange={(e) => setShippingCost(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="w-full bg-white p-1.5 border-2 border-slate-900 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-yellow-400 block"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] uppercase font-black text-slate-500 block mb-1">
                        Listing Fee ($):
                      </label>
                      <input
                        id="pricing-input-listing-fee"
                        type="number"
                        step="0.01"
                        min="0"
                        value={listingFee}
                        onChange={(e) => setListingFee(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="w-full bg-white p-1.5 border-2 border-slate-900 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none block"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] uppercase font-black text-slate-500 block mb-1">
                        CAC/Ad Buffer ($):
                      </label>
                      <input
                        id="pricing-input-ads-buffer"
                        type="number"
                        step="0.01"
                        min="0"
                        value={adsBuffer}
                        onChange={(e) => setAdsBuffer(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="w-full bg-white p-1.5 border-2 border-slate-900 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none block"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-black text-slate-500 block mb-1">
                      Platform Rev-Share / Transaction Fee %:
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        id="pricing-input-transaction-fee-percent"
                        type="number"
                        step="0.1"
                        min="0"
                        max="30"
                        value={transactionFeePercent}
                        onChange={(e) => setTransactionFeePercent(Math.max(0, Math.min(30, parseFloat(e.target.value) || 0)))}
                        className="w-20 bg-white p-1.5 border-2 border-slate-900 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none block"
                      />
                      <span className="font-mono font-black text-[10px] text-slate-500">% (e.g. Etsy 6.5%, Shopify 2.9%)</span>
                    </div>
                  </div>
                </div>

                {/* Live Breakdown Output */}
                <div className="bg-white p-4 rounded-xl border-2 border-slate-900 space-y-3 flex flex-col justify-between shadow-sm">
                  <div className="space-y-2">
                    <span className="text-[9px] font-black font-mono text-slate-400 block uppercase tracking-wider">
                      Cost & Target Profit Breakdown:
                    </span>
                    
                    <div className="space-y-1.5 text-[11px] text-slate-700">
                      <div className="flex justify-between items-center bg-slate-50 p-1 px-2 rounded-md">
                        <span className="font-medium text-slate-500 flex items-center gap-1">
                          <Building className="w-3.5 h-3.5 shrink-0 text-slate-400" /> Vendor Wholesale:
                        </span>
                        <span className="font-mono font-extrabold text-slate-900">${vendorCost.toFixed(2)}</span>
                      </div>

                      <div className="flex justify-between items-center bg-slate-50 p-1 px-2 rounded-md">
                        <span className="font-medium text-slate-500 flex items-center gap-1">
                          <Truck className="w-3.5 h-3.5 shrink-0 text-slate-400" /> Transportation:
                        </span>
                        <span className="font-mono font-extrabold text-slate-900">${shippingCost.toFixed(2)}</span>
                      </div>

                      <div className="flex justify-between items-center bg-slate-50 p-1 px-2 rounded-md">
                        <span className="font-medium text-slate-500 flex items-center gap-1">
                          <Landmark className="w-3.5 h-3.5 shrink-0 text-slate-400" /> Listing + Ad Buf:
                        </span>
                        <span className="font-mono font-extrabold text-slate-900">${flatExpenses.toFixed(2)}</span>
                      </div>

                      <div className="flex justify-between items-center bg-yellow-400/10 p-1 px-2 rounded-md border border-dashed border-yellow-500">
                        <span className="font-bold text-slate-700 flex items-center gap-1 font-semibold">
                          <DollarSign className="w-3.5 h-3.5 shrink-0 text-slate-600" /> Total Base Cost:
                        </span>
                        <span className="font-mono font-black text-slate-950">${totalCostBase.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Profit Result Display badge */}
                  <div className="space-y-1 border-t border-dashed border-slate-200 pt-2 text-slate-800">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase text-slate-400">Suggested Retail:</span>
                      <span className="text-[10px] font-black uppercase text-emerald-600 font-mono font-black">Net Profit:</span>
                    </div>

                    <div className="flex justify-between items-end">
                      <div>
                        <span className="text-lg font-black text-slate-950">${finalCalculatedPrice.toFixed(2)}</span>
                        <span className="text-[8px] block text-slate-400 leading-none mt-0.5">Based on formula</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black text-emerald-600 block">
                          +${rawProfitValue.toFixed(2)}
                        </span>
                        <span className="text-[8px] block font-extrabold text-emerald-500 leading-none">
                          {netMarginCalculated}% net margin
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Manual Override Option */}
              <div className="pt-3 border-t border-dashed border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-black text-slate-900 block uppercase">Manual Quoted Price Override ($):</span>
                  <p className="text-[10px] text-slate-500 font-medium">Leave blank to default to calculated price quote recommending target metrics.</p>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-2 font-bold font-mono text-slate-400 text-xs">$</span>
                  <input
                    id="pricing-input-override-price"
                    type="text"
                    placeholder={finalCalculatedPrice.toFixed(2)}
                    value={overrideRetailPrice}
                    onChange={(e) => setOverrideRetailPrice(e.target.value.replace(/[^0-9.]/g, ""))}
                    className="pl-6 p-1.5 w-32 border-2 border-slate-900 rounded-xl font-mono text-xs font-black text-slate-900 bg-white focus:outline-none focus:ring-1 focus:ring-yellow-400 block text-right"
                  />
                </div>
              </div>

              {/* Market Range Benchmark Gauge */}
              <div className="pt-1.5 space-y-2">
                <div className="flex justify-between items-center text-[10px] text-slate-500 font-black uppercase">
                  <span>Market Rates Comparison Benchmark:</span>
                  <span className="font-mono text-slate-800">Typical POD Retail</span>
                </div>

                {/* Market range bar line layout */}
                <div className="space-y-1">
                  <div className="flex justify-between font-mono text-[9px] text-slate-400 font-extrabold">
                    <span>Low Tier: ${MARKET_RETAIL_RANGES[productType].min.toFixed(2)}</span>
                    <span className="text-slate-500">Average: ${MARKET_RETAIL_RANGES[productType].average.toFixed(2)}</span>
                    <span>Premium: ${MARKET_RETAIL_RANGES[productType].max.toFixed(2)}</span>
                  </div>

                  {/* Relative marker visual gauge bar */}
                  <div className="w-full bg-slate-200 h-2.5 rounded-full border border-slate-900 relative flex">
                    <div className="bg-rose-200 h-full w-[35%] border-r border-slate-900"></div>
                    <div className="bg-emerald-100 h-full w-[35%] border-r border-slate-900"></div>
                    <div className="bg-blue-100 h-full w-[30%]"></div>

                    {/* Calculated pointer pin */}
                    <div 
                      className="absolute top-0 bottom-0 w-2.5 bg-slate-950 border border-white rounded-full -ml-1 transition-all duration-300"
                      style={{
                        left: `${Math.min(
                          100, 
                          Math.max(
                            2, 
                            ((finalPriceToUse - MARKET_RETAIL_RANGES[productType].min * 0.6) / (MARKET_RETAIL_RANGES[productType].max * 1.3 - MARKET_RETAIL_RANGES[productType].min * 0.6)) * 105
                          )
                        )}%`
                      }}
                      title={`Active choice: $${finalPriceToUse.toFixed(2)}`}
                    ></div>
                  </div>
                </div>

                {/* Advice summary */}
                <div className="flex gap-2 p-2 bg-white rounded-lg border border-slate-200 text-[11px] leading-relaxed select-none">
                  <span className="bg-yellow-400 text-slate-950 rounded p-0.5 px-1.5 h-fit font-mono font-black text-[9px] uppercase border border-slate-900 shrink-0">
                    ADVISOR
                  </span>
                  <p className="font-bold text-slate-600">
                    {finalPriceToUse < MARKET_RETAIL_RANGES[productType].min ? (
                      <span className="text-rose-600">
                        ⚠️ **Pricing undercuts common market rates.** Your revenue margins may not support advertising costs. Consider adjusting your target profit margin slider.
                      </span>
                    ) : finalPriceToUse > MARKET_RETAIL_RANGES[productType].max ? (
                      <span className="text-blue-600 font-semibold">
                        ✨ **Boutique Premium markup pricing!** Best suited for high-impact social media aesthetics or unique artist-signed drops with an active community.
                      </span>
                    ) : (
                      <span className="text-emerald-700 font-semibold">
                        ✅ **Perfect Sweet Spot pricing!** Fits beautifully with average {productType} list prices on Etsy and Shopify. Ensures competitive click conversions.
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Production Provider Toggles & Dimensions Specification Guard */}
            <div className="space-y-3 pt-3 border-t-2 border-dashed border-slate-200">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-450 text-slate-405 text-slate-400 block font-mono uppercase tracking-contrast uppercase tracking-wider">
                  5. Active Provider Specifications (Printify vs Printful)
                </span>
                <span className="bg-slate-900 text-yellow-400 font-mono font-black text-[9px] px-1.5 py-0.5 rounded uppercase leading-none border border-slate-950">
                  Adaptive DPI Matcher
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveProvider("Printify");
                    // Snap scale and position of first standard layout
                    const firstPreset = substrateSpecifications[productType]["Printify"].presets[0];
                    setScale(firstPreset.scale);
                    setOffsetX(firstPreset.x);
                    setOffsetY(firstPreset.y);
                  }}
                  className={`py-2 px-3 rounded-xl border-2 font-black text-xs uppercase tracking-wider transition-all cursor-pointer text-center ${
                    activeProvider === "Printify"
                      ? "bg-slate-900 text-white border-slate-900 shadow-[2.5px_2.5px_0px_0px_rgba(250,204,21,1)]"
                      : "bg-white text-slate-700 border-slate-300 hover:border-slate-900"
                  }`}
                >
                  🟢 PRINTIFY SPEC ({substrateSpecifications[productType]["Printify"].printSize})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveProvider("Printful");
                    const firstPreset = substrateSpecifications[productType]["Printful"].presets[0];
                    setScale(firstPreset.scale);
                    setOffsetX(firstPreset.x);
                    setOffsetY(firstPreset.y);
                  }}
                  className={`py-2 px-3 rounded-xl border-2 font-black text-xs uppercase tracking-wider transition-all cursor-pointer text-center ${
                    activeProvider === "Printful"
                      ? "bg-slate-900 text-white border-slate-900 shadow-[2.5px_2.5px_0px_0px_rgba(250,204,21,1)]"
                      : "bg-white text-slate-700 border-slate-300 hover:border-slate-900"
                  }`}
                >
                  🔵 PRINTFUL SPEC ({substrateSpecifications[productType]["Printful"].printSize})
                </button>
              </div>

              {/* Specifications Box details */}
              <div className="p-3 bg-slate-50 border-2 border-slate-900 rounded-2xl grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-slate-800 font-bold select-none leading-tight">
                <div className="border-r-2 border-slate-200 uppercase">
                  <span className="text-[8px] font-mono text-slate-400 block tracking-widest leading-none">Canvas Dimension</span>
                  <span className="text-[11px] font-extrabold text-slate-800 font-mono block mt-1">{currentSpec.printSize}</span>
                </div>
                <div className="border-r-0 sm:border-r-2 border-slate-200 uppercase">
                  <span className="text-[8px] font-mono text-slate-400 block tracking-widest leading-none">Required Pixels</span>
                  <span className="text-[11px] font-extrabold text-slate-800 font-mono block mt-1">{currentSpec.printPixels}</span>
                </div>
                <div className="border-r-2 border-slate-200 uppercase">
                  <span className="text-[8px] font-mono text-slate-400 block tracking-widest leading-none">Required DPI</span>
                  <span className="text-[11px] font-black text-emerald-600 font-mono block mt-1">{currentSpec.dpiRequired} DPI</span>
                </div>
                <div className="uppercase">
                  <span className="text-[8px] font-mono text-slate-400 block tracking-widest leading-none">Substrate Material</span>
                  <span className="text-[9px] font-bold text-slate-500 block truncate mt-1" title={currentSpec.material}>{currentSpec.material}</span>
                </div>
              </div>

              <p className="text-[10px] text-slate-400 font-bold italic block leading-none select-none">
                📍 Provider alignment safe limit feedback: "{currentSpec.safeMargin}" from {currentSpec.manufacturer}.
              </p>
            </div>

            {/* Smart Presets Sizing and Positioning Deck */}
            <div className="space-y-3.5 pt-3 border-t-2 border-dashed border-slate-200">
              <div className="flex flex-col sm:flex-row gap-2 justify-between">
                <span className="text-[10px] font-black text-slate-400 font-mono uppercase tracking-wider block leading-snug">
                  6. Coordinate Layout Alignment:
                </span>
                
                {/* Auto Best Size button */}
                <button
                  type="button"
                  onClick={() => {
                    // Set auto-fit parameters based on current specs
                    const firstPreset = currentSpec.presets[0];
                    setScale(firstPreset.scale);
                    setOffsetX(firstPreset.x);
                    setOffsetY(firstPreset.y);
                    alert(`⚡ Auto-Calculate Best Fit complete! Re-positioned sticker overlay to ${firstPreset.scale}% centered index based on official ${activeProvider} dimension coordinates.`);
                  }}
                  className="bg-yellow-450 bg-yellow-405 bg-yellow-400 hover:bg-yellow-350 hover:bg-yellow-300 text-slate-900 border-2 border-slate-900 shadow-[1.5px_1.5px_0px_0px_rgba(15,23,42,1)] font-extrabold py-1 px-2.5 rounded-lg active:translate-y-0.5 active:shadow-none transition-all cursor-pointer text-[10px] uppercase leading-none tracking-tight flex items-center justify-center gap-1 shrink-0"
                >
                  ⚡ Auto-Calculate Best Size
                </button>
              </div>

              {/* Dynamic shortcut placement buttons */}
              <div className="flex flex-wrap gap-1.5">
                {currentSpec.presets.map((preset, pIdx) => (
                  <button
                    key={pIdx}
                    type="button"
                    onClick={() => {
                      setScale(preset.scale);
                      setOffsetX(preset.x);
                      setOffsetY(preset.y);
                    }}
                    className={`p-1.5 px-2.5 rounded-lg border text-[10px] font-extrabold uppercase transition-all cursor-pointer leading-none ${
                      scale === preset.scale && offsetX === preset.x && offsetY === preset.y
                        ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                        : "bg-slate-100 text-slate-700 border-slate-300 hover:border-slate-900"
                    }`}
                  >
                    🎯 {preset.name}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-600 mb-1 leading-none">
                    <span>Manual Decal Size</span>
                    <span className="font-mono">{scale}%</span>
                  </div>
                  <input
                    id="slider-mockup-scale"
                    type="range"
                    min="10"
                    max="90"
                    value={scale}
                    onChange={(e) => setScale(Number(e.target.value))}
                    className="w-full accent-yellow-450 accent-yellow-400 cursor-ew-resize opacity-90 hover:opacity-100"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-600 mb-1 leading-none">
                    <span>Manual Horiz Pos</span>
                    <span className="font-mono">{offsetX}px</span>
                  </div>
                  <input
                    id="slider-mockup-offset-x"
                    type="range"
                    min="-80"
                    max="80"
                    value={offsetX}
                    onChange={(e) => setOffsetX(Number(e.target.value))}
                    className="w-full accent-yellow-450 accent-yellow-400 cursor-ew-resize opacity-90 hover:opacity-100"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-600 mb-1 leading-none">
                    <span>Manual Vert Pos</span>
                    <span className="font-mono">{offsetY}px</span>
                  </div>
                  <input
                    id="slider-mockup-offset-y"
                    type="range"
                    min="-85"
                    max="85"
                    value={offsetY}
                    onChange={(e) => setOffsetY(Number(e.target.value))}
                    className="w-full accent-yellow-450 accent-yellow-400 cursor-ew-resize opacity-90 hover:opacity-100"
                  />
                </div>
              </div>
            </div>

            {/* Create Mockup action */}
            <div className="pt-4 border-t-2 border-dashed border-slate-200">
              {!isGoalReached ? (
                <div className="p-3.5 bg-yellow-50 rounded-2xl border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] flex gap-2 text-slate-950 text-xs mb-3">
                  <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                  <p className="font-bold leading-normal">
                    <strong>Inventory target locked!</strong> Take {targetCount} liked designs to fulfill optimal cataloging, or click <strong>"Unlock Studio Now"</strong> above to test with your current volume.
                  </p>
                </div>
              ) : (
                <button
                  id="btn-generate-mockup-listing"
                  onClick={handleFinalizeProductListing}
                  disabled={loadingListing || !selectedDesign}
                  className="w-full flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-extrabold py-3.5 px-4 rounded-xl border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer uppercase text-xs tracking-wider disabled:opacity-50"
                >
                  {loadingListing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-slate-900 stroke-[3.5]" /> COMPILING HIGH CONVERTING COPY...
                    </>
                  ) : (
                    <>
                      <Layers className="w-4 h-4 text-slate-900 stroke-[2.5]" /> Finalize Mockup & Write Listing Details
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right CSS-layered rendering section (5 columns) */}
        <div className="lg:col-span-12 xl:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl border-3 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] p-6 flex flex-col justify-between align-middle h-[410px]">
            <h5 className="font-mono text-[9px] font-black text-slate-400 uppercase text-center tracking-widest pb-2 border-b-2 border-slate-100">
              Virtual Substrate Blueprint
            </h5>

            {/* CSS Layered Mockup stage */}
            <div
              className="w-full max-w-[280px] mx-auto h-[260px] rounded-3xl border-3 border-slate-900 flex items-center justify-center relative overflow-hidden transition-all duration-300 shadow-inner"
              style={{ backgroundColor: productColor }}
            >
              {/* Product Background silhouette layer */}
              {productType === "t-shirt" && (
                <div className="absolute inset-0 flex items-center justify-center p-3 opacity-90 select-none pointer-events-none">
                  <svg className="w-full h-full text-slate-400" viewBox="0 0 100 100" fill="currentColor">
                    <path d="M 12 18 L 30 18 C 30 22 40 25 50 25 C 60 25 70 22 70 18 L 88 18 L 94 36 L 82 40 L 80 34 L 80 88 L 20 88 L 20 34 L 18 40 L 6 36 Z" opacity="0.12" fill="#000" />
                    <path d="M 12 18 L 30 18 C 30 22 40 25 50 25 C 60 25 70 22 70 18 L 88 18 L 94 36 L 82 40 L 80 34 L 80 88 L 20 88 L 20 34 L 18 40 L 6 36 Z" fill="none" stroke="currentColor" strokeWidth="1.8" />
                  </svg>
                </div>
              )}

              {productType === "hoodie" && (
                <div className="absolute inset-0 flex items-center justify-center p-2 opacity-90 select-none pointer-events-none">
                  <svg className="w-full h-full text-slate-400" viewBox="0 0 100 100" fill="currentColor">
                    <path d="M 12 18 L 26 14 C 36 28 40 22 50 22 C 60 22 64 28 74 14 L 88 18 L 94 38 L 84 42 L 80 36 L 80 88 L 20 88 L 20 36 L 16 42 L 6 38 Z M 35 12 L 50 16 L 65 12 L 50 21 Z" opacity="0.12" fill="#000" />
                    <path d="M 12 18 L 26 14 C 36 28 40 22 50 22 C 60 22 64 28 74 14 L 88 18 L 94 38 L 84 42 L 80 36 L 80 88 L 20 88 L 20 36 L 16 42 L 6 38 Z M 35 12 L 50 16 L 65 12 L 50 21 Z" fill="none" stroke="currentColor" strokeWidth="1.8" />
                  </svg>
                </div>
              )}

              {productType === "mug" && (
                <div className="absolute inset-0 flex items-center justify-center p-8 opacity-90 select-none pointer-events-none">
                  <svg className="w-full h-full text-slate-400" viewBox="0 0 100 100" fill="currentColor">
                    <path d="M 23 15 L 77 15 L 77 82 C 77 88 23 88 23 82 Z M 77 30 C 90 30 90 60 77 60" opacity="0.12" fill="#000" />
                    <path d="M 23 15 L 77 15 L 77 82 C 77 88 23 88 23 82 Z" fill="none" stroke="currentColor" strokeWidth="2" />
                    <path d="M 77 30 C 90 30 90 60 77 60" fill="none" stroke="currentColor" strokeWidth="2.5" />
                  </svg>
                </div>
              )}

              {productType === "tote-bag" && (
                <div className="absolute inset-0 flex items-center justify-center p-6 opacity-90 select-none pointer-events-none">
                  <svg className="w-full h-full text-slate-400" viewBox="0 0 100 100" fill="currentColor">
                    <path d="M 30 10 C 30 35 70 35 70 10 M 18 35 L 82 35 L 78 90 L 22 90 Z" opacity="0.12" fill="#000" />
                    <path d="M 30 10 C 30 35 70 35 70 10" fill="none" stroke="currentColor" strokeWidth="2.5" />
                    <path d="M 18 35 L 82 35 L 78 90 L 22 90 Z" fill="none" stroke="currentColor" strokeWidth="2" />
                  </svg>
                </div>
              )}

              {productType === "phone-case" && (
                <div className="absolute inset-0 flex items-center justify-center p-12 opacity-90 select-none pointer-events-none">
                  <svg className="w-full h-full text-slate-400" viewBox="0 0 100 100" fill="currentColor">
                    <rect x="25" y="10" width="50" height="80" rx="8" opacity="0.12" fill="#000" />
                    <rect x="25" y="10" width="50" height="80" rx="8" fill="none" stroke="currentColor" strokeWidth="2" />
                    <rect x="30" y="15" width="12" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                </div>
              )}

              {selectedDesign ? (
                <div
                  className="absolute transition-all duration-100 ease-out pointer-events-none"
                  style={{
                    width: `${scale}%`,
                    height: `${scale}%`,
                    transform: `translate(${offsetX}px, ${offsetY}px)`,
                  }}
                >
                  <img
                    src={selectedDesign.imageUrl}
                    className="w-full h-full object-contain drop-shadow"
                    alt="Active design sticker overlay"
                  />
                </div>
              ) : (
                <div className="absolute text-center p-4">
                  <span className="text-[10px] font-mono text-slate-400 font-extrabold block">NO TARGET DECAL</span>
                </div>
              )}
            </div>

            <p className="text-[10px] text-slate-400 text-center font-bold tracking-tight uppercase">
              Decal placement is rendered inside active print boundaries.
            </p>
          </div>

          {/* Substrate SPECIFICATIONS from Printify / Printful details card */}
          <div className="bg-slate-900 text-white rounded-3xl border-3 border-slate-900 p-5 space-y-3 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-[10px] bg-yellow-400 text-slate-900 px-2.5 py-1 rounded font-mono font-black uppercase tracking-tight">
                {currentSpec.provider} Integration Spec
              </span>
              <span className="text-[9px] font-mono text-slate-400 flex items-center gap-1">
                <Building className="w-3.5 h-3.5 text-slate-450" /> {currentSpec.manufacturer}
              </span>
            </div>

            <h5 className="font-extrabold text-sm uppercase tracking-tight text-yellow-400">
              {currentSpec.name}
            </h5>

            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[11px] font-mono pt-1 text-slate-350">
              <div>
                <span className="text-[9px] text-slate-500 block uppercase font-bold">Materials Base:</span>
                <span className="font-bold text-xs text-white leading-tight block">{currentSpec.material}</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 block uppercase font-bold">Print Area Frame:</span>
                <span className="font-bold text-xs text-white leading-tight block">{currentSpec.printSize}</span>
              </div>
              <div className="pt-1.5">
                <span className="text-[9px] text-slate-500 block uppercase font-bold">Base Cost Price:</span>
                <span className="font-bold text-[13px] text-emerald-400 block">${currentSpec.wholesaleCost.toFixed(2)} USD</span>
              </div>
              <div className="pt-1.5">
                <span className="text-[9px] text-slate-500 block uppercase font-bold">Standard Align:</span>
                <span className="font-bold text-xs text-white block">{currentSpec.defaultPlacement}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Created mockups listing library */}
      {createdMockups.length > 0 && (
        <div id="created-mockups-list" className="space-y-6 pt-6 border-t-4 border-slate-900 mt-6">
          
          {/* Brand Learning Guidelines Status Panel */}
          {activeBrand.memory && (
            <div className="p-5 rounded-3xl bg-white border-3 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] space-y-3 shrink-0">
              <div className="flex justify-between items-center pb-2 border-b-2 border-slate-100">
                <span className="text-[10px] font-black text-slate-500 font-mono uppercase tracking-wider block">
                  🧠 Brain Learning status: ADAPTIVE GUIDELINES CORE
                </span>
                <span className="bg-emerald-105 bg-emerald-100 text-emerald-800 text-[9px] px-2.5 py-0.5 rounded-full border border-emerald-300 uppercase font-black leading-none flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                  ONLINE & OBSERVING
                </span>
              </div>
              <p className="text-[11px] font-bold text-slate-500 leading-normal select-none">
                Based on your swiped designs, merchandise customizations, likes, and dislikes on mockup specs, BananaPOD's Gemini adaptive guidelines core consolidates the following parameters inside memory:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                <div className="space-y-1.5">
                  <span className="text-[9px] font-black text-slate-400 uppercase font-mono block">Mockup & Placement Preferences:</span>
                  <ul className="text-[11px] font-extrabold text-slate-800 list-disc list-inside space-y-1">
                    {activeBrand.memory.mockupFeedbackLearnings && activeBrand.memory.mockupFeedbackLearnings.length > 0 ? (
                      activeBrand.memory.mockupFeedbackLearnings.map((item, key) => (
                        <li key={key} className="text-slate-700">{item}</li>
                      ))
                    ) : (
                      <li className="text-slate-400 font-bold italic list-none">No mockup preferences learned yet. Click Thumbs Up/Down on cards below to train.</li>
                    )}
                  </ul>
                </div>
                <div className="space-y-1.5">
                  <span className="text-[9px] font-black text-slate-400 uppercase font-mono block">Brand Design Style Theme Guidelines:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {activeBrand.memory.likedThemes && activeBrand.memory.likedThemes.length > 0 ? (
                      activeBrand.memory.likedThemes.map((item, key) => (
                        <span key={key} className="text-[9px] font-mono font-black uppercase bg-emerald-50 text-emerald-700 p-1 px-2 rounded-lg border border-emerald-250">
                          {item} Style
                        </span>
                      ))
                    ) : null}
                    {activeBrand.memory.designStyleLearnings && activeBrand.memory.designStyleLearnings.length > 0 ? (
                      activeBrand.memory.designStyleLearnings.map((item, key) => (
                        <span key={key} className="text-[9px] font-mono font-black uppercase bg-yellow-50 text-slate-800 p-1 px-2 rounded-lg border border-yellow-250">
                          {item}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-slate-400 font-bold italic block">Adjust preferences inside Tinder Deck swiping.</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Catalog Dashboard Actions Toolbar */}
          <div className="bg-slate-900 text-white p-5 rounded-3xl border-3 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h4 className="text-white font-black text-sm uppercase tracking-wider flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-yellow-400" />
                  Print-on-Demand E-commerce Catalog ({createdMockups.length})
                </h4>
                
                {/* Catalog filter buttons: All vs Liked vs Disliked */}
                <div className="flex gap-1.5 p-1 bg-slate-800 rounded-2xl w-fit border border-slate-700 mt-2.5">
                  <button
                    type="button"
                    onClick={() => setCatalogFilter('all')}
                    className={`p-1.5 px-3 text-[9px] font-black uppercase rounded-xl leading-none transition-all cursor-pointer ${
                      catalogFilter === 'all'
                        ? "bg-yellow-400 text-slate-900 shadow-sm"
                        : "text-slate-350 hover:text-white"
                    }`}
                  >
                    All Drafts ({createdMockups.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setCatalogFilter('liked')}
                    className={`p-1.5 px-3 text-[9px] font-black uppercase rounded-xl leading-none transition-all cursor-pointer flex items-center gap-1 ${
                      catalogFilter === 'liked'
                        ? "bg-emerald-500 text-white shadow-sm"
                        : "text-slate-350 hover:text-white"
                    }`}
                  >
                    <ThumbsUp className="w-2.5 h-2.5" /> Approved ({createdMockups.filter(m => m.likeStatus === 'liked').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setCatalogFilter('disliked')}
                    className={`p-1.5 px-3 text-[9px] font-black uppercase rounded-xl leading-none transition-all cursor-pointer flex items-center gap-1 ${
                      catalogFilter === 'disliked'
                        ? "bg-rose-500 text-white shadow-sm"
                        : "text-slate-350 hover:text-white"
                    }`}
                  >
                    <ThumbsDown className="w-2.5 h-2.5" /> Disliked ({createdMockups.filter(m => m.likeStatus === 'disliked').length})
                  </button>
                </div>
              </div>

              {/* Selection Summary and Move to Hub */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (selectedCatalogIds.length === createdMockups.length) {
                      setSelectedCatalogIds([]);
                    } else {
                      setSelectedCatalogIds(createdMockups.map(m => m.id));
                    }
                  }}
                  className="flex items-center gap-2 bg-slate-800 hover:bg-slate-705 text-slate-100 font-extrabold text-xs px-3.5 py-2 rounded-xl border-2 border-slate-700 cursor-pointer transition-all"
                >
                  {selectedCatalogIds.length === createdMockups.length ? (
                    <CheckSquare className="w-4 h-4 text-yellow-400 shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                  <span className="uppercase tracking-tight text-[10px]">
                    Select All ({selectedCatalogIds.length})
                  </span>
                </button>

                <button
                  id="btn-bulk-publish-hub"
                  onClick={handlePublishSelectedToHub}
                  className="flex items-center gap-1.5 bg-yellow-400 hover:bg-yellow-350 text-slate-950 font-extrabold text-xs px-4 py-2.5 rounded-xl border-2 border-slate-950 shadow-[2px_2px_0px_0px_rgba(251,200,20,1)] active:translate-y-0.5 active:shadow-none cursor-pointer transition-all"
                >
                  <Megaphone className="w-4 h-4 shrink-0 stroke-[2.5]" />
                  <span className="uppercase tracking-wider font-extrabold text-[10px]">
                    Publish {selectedCatalogIds.length > 0 ? `Selected (${selectedCatalogIds.length})` : "All"} to Social Hub
                  </span>
                </button>
              </div>
            </div>

            {/* Sub-toolbar: Bulk Modifier on Left, Export Catalog on Right */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-dashed border-slate-800">
              
              {/* Bulk Price Modifier input group */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-slate-800/60 p-3 rounded-2xl border border-slate-800">
                <div className="space-y-0.5 shrink-0">
                  <span className="text-[9px] font-black text-slate-350 block uppercase leading-tight">
                    Bulk Price Modifier:
                  </span>
                  <p className="text-[9px] text-slate-400 font-bold leading-none">Adjust overall list markup</p>
                </div>
                
                <div className="flex items-center gap-2 w-full">
                  <div className="relative w-24">
                    <input
                      id="bulk-pricing-percent-input"
                      type="text"
                      value={bulkPercentModifier}
                      onChange={(e) => setBulkPercentModifier(e.target.value.replace(/[^0-9.-]/g, ""))}
                      className="w-full bg-slate-900 border-2 border-slate-700 rounded-xl px-2.5 py-1 text-xs text-white font-mono font-black text-center focus:outline-none focus:border-yellow-400"
                      placeholder="+10"
                    />
                    <span className="absolute right-2 top-1.5 text-[10px] text-slate-500 font-mono font-black">%</span>
                  </div>

                  <button
                    id="btn-apply-bulk-price-adjustment"
                    onClick={handleBulkPriceModify}
                    className="flex-1 bg-white hover:bg-slate-50 text-slate-950 text-[10px] font-black py-1.5 px-3 rounded-xl border-2 border-slate-950 shadow-[1.5px_1.5px_0px_0px_rgba(255,255,255,1)] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer uppercase tracking-tight"
                  >
                    Apply Markup
                  </button>
                </div>
              </div>

              {/* Export Catalog dropdown actions */}
              <div className="flex flex-wrap items-center justify-end gap-3 p-3 bg-slate-800/60 rounded-2xl border border-slate-800 relative">
                
                {syncedSpreadsheetId && (
                  <a
                    href={`https://docs.google.com/spreadsheets/d/${syncedSpreadsheetId}/edit`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex bg-emerald-600 hover:bg-emerald-500 border-2 border-slate-900 py-2 px-3.5 rounded-xl text-[10px] font-black uppercase tracking-tight text-white gap-1 transition-all shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] active:translate-y-0.5 active:shadow-none cursor-pointer"
                  >
                    Open Google Sheet 📈
                  </a>
                )}

                {googleSheetError && (
                  <div className="absolute top-full mt-1.5 right-0 text-[9px] text-red-500 font-bold bg-white px-3 py-1 rounded-xl border-2 border-red-300 shadow-md z-50 font-mono max-w-[240px]">
                    {googleSheetError}
                  </div>
                )}

                <div className="text-right hidden sm:block shrink-0">
                  <span className="text-[9px] font-black text-slate-350 block uppercase leading-tight">Export Catalog Metadata:</span>
                  <p className="text-[9px] text-slate-400 font-bold leading-none">Download structured metadata</p>
                </div>

                <div className="relative">
                  <button
                    id="btn-toggle-export-catalog"
                    onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
                    className="flex items-center gap-2 bg-slate-950 hover:bg-slate-900 border-2 border-slate-700 py-2 px-4 rounded-xl text-xs font-black tracking-tight uppercase cursor-pointer transition-all"
                  >
                    <Download className="w-4 h-4 text-slate-400" />
                    <span>Download Options</span>
                  </button>

                  {isExportDropdownOpen && (
                    <div className="absolute right-0 bottom-full mb-2 w-48 bg-white text-slate-950 border-3 border-slate-950 rounded-2xl shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] z-50 overflow-hidden divide-y-2 divide-slate-150">
                      <div className="p-2 bg-yellow-450 bg-yellow-400 text-[9px] font-black uppercase text-center text-slate-900">
                        Select Protocol Format
                      </div>
                      <button
                        type="button"
                        onClick={handleExportAsCSV}
                        className="w-full text-left px-4 py-2 text-xs font-black uppercase tracking-tight text-slate-800 hover:bg-slate-50 flex items-center justify-between cursor-pointer"
                      >
                        <span>Export as CSV File</span>
                        <span className="text-[8px] bg-emerald-100 text-emerald-800 font-mono px-1.5 py-0.5 rounded font-black">.csv</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleExportAsJSON}
                        className="w-full text-left px-4 py-2 text-xs font-black uppercase tracking-tight text-slate-800 hover:bg-slate-50 flex items-center justify-between cursor-pointer"
                      >
                        <span>Export as JSON Object</span>
                        <span className="text-[8px] bg-purple-100 text-purple-800 font-mono px-1.5 py-0.5 rounded font-black">.json</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleExportToGoogleSheets}
                        disabled={exportingToSheets}
                        className={`w-full text-left px-4 py-2 text-xs font-black uppercase tracking-tight flex items-center justify-between cursor-pointer ${
                          isGoogleAuthenticated()
                            ? "text-slate-800 hover:bg-slate-50"
                            : "text-slate-300 bg-slate-50 cursor-not-allowed"
                        }`}
                        title={isGoogleAuthenticated() ? "Export this entire catalog directly to your Google Sheets spreadsheet" : "Connect Google Workspace first"}
                      >
                        <span>{exportingToSheets ? "Syncing..." : "Sync to Google Sheets"}</span>
                        <span className="text-[8px] bg-emerald-100 text-emerald-800 font-mono px-1.5 py-0.5 rounded font-black">Sheets</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Catalog Grid List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {createdMockups
              .filter((mock) => {
                if (catalogFilter === 'liked') return mock.likeStatus === 'liked';
                if (catalogFilter === 'disliked') return mock.likeStatus === 'disliked';
                return true;
              })
              .map((mock) => {
                const isSelected = selectedCatalogIds.includes(mock.id);
                const perUnitProfit = mock.suggestedPrice - mock.costPrice;

                return (
                  <div
                    id={`mockup-catalog-${mock.id}`}
                    key={mock.id}
                    className={`bg-white rounded-3xl border-3 border-slate-900 overflow-hidden shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex flex-col justify-between hover:scale-[1.01] transition-all relative ${
                      isSelected ? "ring-4 ring-yellow-450" : ""
                    }`}
                  >
                    
                    {/* Selector checkbox overlays */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isSelected) {
                          setSelectedCatalogIds(selectedCatalogIds.filter(id => id !== mock.id));
                        } else {
                          setSelectedCatalogIds([...selectedCatalogIds, mock.id]);
                        }
                      }}
                      className="absolute top-3 left-3 z-24 p-1 rounded-xl border-2 border-slate-900 bg-white hover:bg-slate-50 shadow-[1.5px_1.5px_0px_0px_rgba(15,23,42,1)] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer text-slate-900"
                      title={isSelected ? "Deselect item" : "Select item"}
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600 stroke-[3]" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-3505 text-slate-350" />
                      )}
                    </button>

                    {/* Thumbs Up / Thumbs Down feedback overlays */}
                    <div className="absolute top-3 right-3 z-24 flex gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onMockupLike) {
                            onMockupLike(mock.id, mock.likeStatus === "liked" ? "none" : "liked");
                          }
                        }}
                        className={`p-1.5 rounded-xl border-2 transition-all cursor-pointer shadow-[1.5px_1.5px_0px_0px_rgba(15,23,42,1)] active:translate-y-0.5 active:shadow-none ${
                          mock.likeStatus === "liked"
                            ? "bg-emerald-500 text-white border-slate-900"
                            : "bg-white text-slate-500 border-slate-900 hover:text-slate-900"
                        }`}
                        title="Approve / Like design"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onMockupLike) {
                            onMockupLike(mock.id, mock.likeStatus === "disliked" ? "none" : "disliked");
                          }
                        }}
                        className={`p-1.5 rounded-xl border-2 transition-all cursor-pointer shadow-[1.5px_1.5px_0px_0px_rgba(15,23,42,1)] active:translate-y-0.5 active:shadow-none ${
                          mock.likeStatus === "disliked"
                            ? "bg-rose-500 text-white border-slate-900"
                            : "bg-white text-slate-500 border-slate-900 hover:text-slate-900"
                        }`}
                        title="Archive / Dislike design"
                      >
                        <ThumbsDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  {/* Visual rendering slot */}
                  <div className="relative h-44 flex items-center justify-center p-3 border-b-3 border-slate-900 transition-all select-none" style={{ backgroundColor: mock.productColor }}>
                    <img
                      src={mock.designUrl}
                      alt=""
                      className="absolute max-w-[70px] max-h-[70px] drop-shadow"
                      style={{ transform: `scale(${mock.placementScale}) translate(${mock.placementOffset.x * 0.4}px, ${mock.placementOffset.y * 0.4}px)` }}
                    />
                    
                    {/* Watermark badge detailing provider */}
                    <span className="absolute bottom-2 right-2 text-[8px] font-black font-mono bg-yellow-400 text-slate-900 border-2 border-slate-900 py-1 px-2.5 rounded-lg shadow-[1.5px_1.5px_0px_0px_rgba(15,23,42,1)] uppercase tracking-tight">
                      {mock.productType.toUpperCase()} ({mock.productType === 'mug' ? 'PRINTFUL' : 'PRINTIFY'})
                    </span>
                  </div>

                  <div className="p-4 flex-1 space-y-3 bg-white">
                    <div>
                      <h5 className="font-extrabold text-slate-900 text-xs uppercase tracking-tight line-clamp-1">{mock.title}</h5>
                      <p className="text-slate-600 text-xs font-semibold leading-relaxed line-clamp-1">{mock.description}</p>
                    </div>

                    {/* Projected Profit Line Chart preview using Recharts */}
                    <div className="bg-slate-50 p-2.5 rounded-2xl border-2 border-slate-900 space-y-1.5 shadow-[1.5px_1.5px_0px_0px_rgba(15,23,42,1)]">
                      <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-wider text-slate-500">
                        <span className="flex items-center gap-1">
                          <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> Forecast Profits Curve:
                        </span>
                        <span className="font-mono text-emerald-600">Max: +${Math.round(100 * perUnitProfit)}</span>
                      </div>
                      
                      <div className="h-20 w-full pt-1">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={[
                              { units: 0, profit: 0 },
                              { units: 10, profit: Math.max(0, Math.round(10 * perUnitProfit)) },
                              { units: 50, profit: Math.max(0, Math.round(50 * perUnitProfit)) },
                              { units: 100, profit: Math.max(0, Math.round(100 * perUnitProfit)) }
                            ]}
                            margin={{ top: 2, right: 10, left: -32, bottom: 0 }}
                          >
                            <XAxis
                              dataKey="units"
                              tick={{ fontSize: 7, fontWeight: 800, fill: '#64748B' }}
                              axisLine={false}
                              tickLine={false}
                              unit="u"
                            />
                            <YAxis
                              tick={{ fontSize: 7, fontWeight: 800, fill: '#64748B' }}
                              axisLine={false}
                              tickLine={false}
                              tickFormatter={(v) => `$${v}`}
                            />
                            <Tooltip
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  const units = payload[0].payload.units;
                                  const profit = payload[0].payload.profit;
                                  return (
                                    <div className="bg-slate-950 text-white p-2 rounded-xl text-[9px] font-mono leading-none border border-slate-800 shadow-md">
                                      <p className="font-extrabold text-[10px] text-yellow-400 mb-0.5">{units} Units Sold</p>
                                      <p className="text-emerald-400 font-bold">+${profit} Profit</p>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Line
                              type="monotone"
                              dataKey="profit"
                              stroke="#10B981"
                              strokeWidth={2.5}
                              dot={{ r: 2.5, stroke: '#10B981', fill: '#FFFFFF', strokeWidth: 1.5 }}
                              activeDot={{ r: 4.5, stroke: '#10B981', strokeWidth: 2 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="flex justify-between items-center text-[7px] text-slate-400 font-bold font-mono uppercase tracking-tight">
                        <span>0 u</span>
                        <span>50 u sold</span>
                        <span>100u projection</span>
                      </div>
                    </div>
                    
                    {/* Cost & retail price tag footer breakdown */}
                    <div className="flex justify-between items-center pt-2 font-mono text-xs border-t border-dashed border-slate-200">
                      <div>
                        <span className="text-slate-400 block text-[9px] font-black tracking-normal uppercase leading-none">Your Base Cost:</span>
                        <span className="font-black text-slate-800">${mock.costPrice.toFixed(2)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400 block text-[9px] font-black tracking-normal uppercase leading-none">Suggested Retail:</span>
                        <span className="font-black text-emerald-600 text-sm">${mock.suggestedPrice.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Sub-tags */}
                  <div className="px-4 pb-4 bg-white flex flex-wrap items-center justify-between gap-1.5 pt-2 border-t border-dashed border-slate-150">
                    <div className="flex flex-wrap gap-1">
                      {mock.tags.slice(0, 2).map((tg, i) => (
                        <span
                          key={i}
                          className="text-[9px] bg-slate-105 bg-slate-100 text-slate-800 p-1 px-1.5 rounded-lg border border-slate-300 font-extrabold font-mono"
                        >
                          #{tg}
                        </span>
                      ))}
                    </div>

                    {/* Google Drive Export Button */}
                    <button
                      type="button"
                      onClick={() => handleSaveMockupToDrive(mock)}
                      disabled={savingToDriveId === mock.id}
                      className={`text-[8px] font-black uppercase p-1 px-2.5 rounded-lg border-2 font-mono flex items-center gap-1 cursor-pointer transition-all ${
                        isGoogleAuthenticated()
                          ? "bg-slate-900 border-slate-900 text-yellow-400 hover:bg-slate-800"
                          : "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed"
                      }`}
                      title={isGoogleAuthenticated() ? "Save design layout directly to your Google Drive" : "Connect Google Workspace in the connection panel"}
                    >
                      <span>
                        {savingToDriveId === mock.id
                          ? "Saving..."
                          : driveSaveSuccess === mock.id
                          ? "Saved! 🟢"
                          : "Drive 📁"}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
