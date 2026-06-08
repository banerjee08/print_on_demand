"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, Briefcase, Wand2, Layers, Share2, BarChart2, CreditCard } from "lucide-react";
import { SystemState, Brand, DesignCard, ProductMockup, SocialAsset, CampaignMetrics } from "@/lib/types";
import TrendsDashboard from "@/components/TrendsDashboard";
import BrandManager from "@/components/BrandManager";
import SwipeSandbox from "@/components/SwipeSandbox";
import MockupStudio from "@/components/MockupStudio";
import MarketingHub from "@/components/MarketingHub";
import AnalyticsCharts from "@/components/AnalyticsCharts";
import BillingModal from "@/components/BillingModal";
import { 
  parseAndHandleGoogleHash, 
  loginWithGoogle, 
  logoutGoogle, 
  isGoogleAuthenticated, 
  getGoogleClientId, 
  saveGoogleClientId 
} from "@/lib/googleAuth";

const SEED_BRANDS: Brand[] = [
  {
    id: "brand-apex",
    name: "Apex Outdoors",
    audience: "Millennial dads, campers, & trail hikers",
    voice: "Rugged yet lighthearted and family-oriented",
    colorGuidelines: ["#B22234", "#3C3B6E", "#F4A261", "#2A9D8F"],
    customKeywords: "weathered vintage stamp texture, hand-drawn vector, bold sans font",
    imageLimit: 10,
    imagesCreated: 0,
    memory: {
      likedThemes: ["Retro Americana", "Campfire barbecue humor"],
      dislikedThemes: ["Cluttered realism", "Neon tech grids"],
      designStyleLearnings: [
        "Prefers bold, circular badge style labels.",
        "Responds positively to distressed woodgrain textures."
      ]
    }
  },
  {
    id: "brand-retro-groove",
    name: "Coastal Grooves",
    audience: "Coastal Grandmas & slow-living Gen-Z women",
    voice: "Retro, relaxed, warm, and highly aesthetic",
    colorGuidelines: ["#F9F6F0", "#C19A6B", "#85A3B2", "#E0B0FF"],
    customKeywords: "minimal vector sticker look, coastal crayon strokes, beach pastels",
    imageLimit: 10,
    imagesCreated: 0,
    memory: {
      likedThemes: ["Minimalist beach waves", "Groovy vintage cursive quotes"],
      dislikedThemes: ["High-contrast neon decals", "Dark aggressive slogans"],
      designStyleLearnings: [
        "Prefers pastel organic curves over straight lines.",
        "Draws inspiration from 70s-style typography stickers."
      ]
    }
  }
];

const INITIAL_CAMPAIGNS: CampaignMetrics[] = [
  {
    id: "camp-retro-tote",
    productId: "mock-1",
    productTitle: "Coastal Shores Canvas Tote Bag",
    brandId: "brand-retro-groove",
    views: 12500,
    clicks: 440,
    conversions: 18,
    revenue: 359.82,
    ctr: 3.52,
    conversionRate: 4.09,
    campaignName: "Retro Beach organic pins"
  },
  {
    id: "camp-apex-tee",
    productId: "mock-2",
    productTitle: "Star Spangled S'mores Unisex Tee",
    brandId: "brand-apex",
    views: 18200,
    clicks: 720,
    conversions: 36,
    revenue: 899.64,
    ctr: 3.95,
    conversionRate: 5.0,
    campaignName: "4th of July Camping Dad ads"
  }
];

export default function Home() {
  const [state, setState] = useState<SystemState>(() => {
    if (typeof window === "undefined") return {
      brands: SEED_BRANDS,
      activeBrandId: "brand-apex",
      designs: [],
      mockups: [],
      campaigns: INITIAL_CAMPAIGNS,
      socialAssets: [],
      dailyTrendIdea: null,
      dailyExplanation: "",
      activePaymentTier: "free",
      nanoBananaCredits: 10,
    };
    
    const saved = localStorage.getItem("nano_banana_state");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.brands && parsed.brands.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error("Local storage decoding failed:", e);
      }
    }
    return {
      brands: SEED_BRANDS,
      activeBrandId: "brand-apex",
      designs: [],
      mockups: [],
      campaigns: INITIAL_CAMPAIGNS,
      socialAssets: [],
      dailyTrendIdea: null,
      dailyExplanation: "",
      activePaymentTier: "free",
      nanoBananaCredits: 10,
    };
  });

  const [activeTab, setActiveTab] = useState<string>("trends");
  const [googleSecActive, setGoogleSecActive] = useState(false);
  const [showClientInput, setShowClientInput] = useState(false);
  const [tempClientId, setTempClientId] = useState("");

  useEffect(() => {
    setTempClientId(getGoogleClientId());
    const matchedToken = parseAndHandleGoogleHash();
    if (matchedToken) {
      setGoogleSecActive(true);
      alert("Google Workspace connectivity is now ACTIVE!");
    } else {
      setGoogleSecActive(isGoogleAuthenticated());
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("nano_banana_state", JSON.stringify(state));
  }, [state]);

  const activeBrand = state.brands.find((b) => b.id === state.activeBrandId) || state.brands[0];

  const handleSelectBrand = (id: string) => {
    setState((prev) => ({ ...prev, activeBrandId: id }));
  };

  const handleAddBrand = (brand: Brand) => {
    setState((prev) => ({
      ...prev,
      brands: [...prev.brands, brand],
      activeBrandId: brand.id,
    }));
  };

  const handleUpdateBrand = (updated: Brand) => {
    setState((prev) => ({
      ...prev,
      brands: prev.brands.map((b) => (b.id === updated.id ? updated : b)),
    }));
  };

  const handleDeleteBrand = (id: string) => {
    const remaining = state.brands.filter((b) => b.id !== id);
    setState((prev) => ({
      ...prev,
      brands: remaining,
      activeBrandId: remaining[0]?.id || "",
    }));
  };

  const handleGenerateDesign = async (prompt: string, theme: string) => {
    try {
      const response = await fetch("/api/generate-design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          colorPalette: activeBrand.colorGuidelines,
          customKeywords: activeBrand.customKeywords,
          activeBrandId: activeBrand.id,
        }),
      });

      if (!response.ok) throw new Error("Image composition failed");
      const data = await response.json();

      const newDesign: DesignCard = {
        id: "design-" + Date.now(),
        brandId: activeBrand.id,
        prompt: prompt,
        theme: theme,
        imageUrl: data.imageUrl,
        status: "pending",
        timestamp: new Date().toISOString(),
      };

      setState((prev) => {
        const updatedBrands = prev.brands.map((b) => {
          if (b.id === activeBrand.id) {
            return { ...b, imagesCreated: b.imagesCreated + 1 };
          }
          return b;
        });

        return {
          ...prev,
          designs: [newDesign, ...prev.designs],
          brands: updatedBrands,
          nanoBananaCredits: Math.max(0, prev.nanoBananaCredits - 1),
        };
      });

    } catch (err: any) {
      console.error(err);
      alert("Generator encountered an exception.");
    }
  };

  const handleSwipeDesign = async (designId: string, status: 'liked' | 'disliked') => {
    setState((prev) => {
      const targetDesign = prev.designs.find((d) => d.id === designId);
      if (!targetDesign) return prev;

      const updatedDesigns = prev.designs.map((d) =>
        d.id === designId ? { ...d, status } : d
      );

      return {
        ...prev,
        designs: updatedDesigns,
      };
    });
  };

  const handleMockupCreated = (mock: ProductMockup) => {
    setState((prev) => ({
      ...prev,
      mockups: [mock, ...prev.mockups],
    }));
  };

  const handleUpdateMockupPrices = (updatedMockups: ProductMockup[]) => {
    setState((prev) => ({
      ...prev,
      mockups: prev.mockups.map((m) => {
        const found = updatedMockups.find((u) => u.id === m.id);
        return found ? found : m;
      }),
    }));
  };

  const handleSocialAssetCreated = (asset: SocialAsset) => {
    setState((prev) => {
      const exists = prev.socialAssets.some(
        (as) => as.productId === asset.productId && as.channel === asset.channel
      );
      if (exists) return prev;

      const mock = prev.mockups.find((m) => m.id === asset.productId) || { suggestedPrice: 24.99 };
      const randomCTR = 3.5 + Math.random() * 2.8;
      const fakeViews = 2400 + Math.floor(Math.random() * 8000);
      const fakeClicks = Math.floor(fakeViews * (randomCTR / 100));
      const fakeConvs = Math.floor(fakeClicks * (0.02 + Math.random() * 0.04));
      const fakeRevenue = fakeConvs * mock.suggestedPrice;

      const newCampaign: CampaignMetrics = {
        id: `campaign-${Date.now()}`,
        productId: asset.productId,
        productTitle: asset.productTitle,
        brandId: asset.brandId,
        views: fakeViews,
        clicks: fakeClicks,
        conversions: fakeConvs,
        revenue: fakeRevenue,
        ctr: randomCTR,
        conversionRate: fakeClicks > 0 ? (fakeConvs / fakeClicks) * 100 : 2.5,
        campaignName: `${asset.channel.toUpperCase()} Organic Launch`,
      };

      return {
        ...prev,
        socialAssets: [asset, ...prev.socialAssets],
        campaigns: [newCampaign, ...prev.campaigns],
      };
    });
  };

  const handleUpdateSocialAsset = (updatedAsset: SocialAsset) => {
    setState((prev) => ({
      ...prev,
      socialAssets: prev.socialAssets.map((sa) =>
        sa.id === updatedAsset.id ? updatedAsset : sa
      ),
    }));
  };

  const handleActivateCredits = (creditsAdded: number) => {
    setState((prev) => ({
      ...prev,
      activePaymentTier: "paid",
      nanoBananaCredits: prev.nanoBananaCredits + creditsAdded,
    }));
  };

  const handleMockupFeedback = async (mockupId: string, status: 'liked' | 'disliked' | 'none') => {
    setState((prev) => ({
      ...prev,
      mockups: prev.mockups.map((m) =>
        m.id === mockupId ? { ...m, likeStatus: status } : m
      ),
    }));
  };

  const handleSocialAssetFeedback = async (assetId: string, status: 'liked' | 'disliked' | 'none') => {
    setState((prev) => ({
      ...prev,
      socialAssets: prev.socialAssets.map((sa) =>
        sa.id === assetId ? { ...sa, likeStatus: status } : sa
      ),
    }));
  };

  const handleGoogleDisconnect = () => {
    logoutGoogle();
    setGoogleSecActive(false);
  };

  const handleInitGAuth = () => {
    const id = getGoogleClientId();
    if (!id) {
      setShowClientInput(true);
      return;
    }
    loginWithGoogle();
  };

  const handleSaveClientId = () => {
    saveGoogleClientId(tempClientId);
    setShowClientInput(false);
  };

  const tabs = [
    { id: "trends", label: "Scanner", icon: Sparkles },
    { id: "brand", label: "Brand Memory", icon: Briefcase },
    { id: "swipe", label: "Tinder Deck", icon: Wand2 },
    { id: "mockups", label: "Mockup Studio", icon: Layers },
    { id: "marketing", label: "Social Hub", icon: Share2 },
    { id: "analytics", label: "Metrics Console", icon: BarChart2 },
    { id: "billing", label: "Billing", icon: CreditCard },
  ];

  return (
    <div id="application-container" className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col antialiased">
      <header className="bg-white border-b-4 border-slate-900 shrink-0 sticky top-0 z-50 py-4 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-400 w-11 h-11 rounded-2xl flex items-center justify-center border-3 border-slate-900 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] shrink-0 select-none animate-pulse">
              <span className="font-black text-slate-900 text-2xl tracking-tighter">B</span>
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight uppercase text-slate-900 flex items-center gap-1.5">
                BananaPOD <span className="bg-slate-900 text-white text-[9px] px-1.5 py-0.5 rounded ml-1 tracking-normal lowercase border-none">ai</span>
              </h1>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mt-1">POD Trend & Tinder-Swipe Studio</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex flex-col items-center sm:items-end">
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-tight mb-1">Active Brand</span>
              <select
                value={state.activeBrandId}
                onChange={(e) => handleSelectBrand(e.target.value)}
                className="bg-white border-2 border-slate-900 rounded-xl px-3 py-1.5 text-xs font-black shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] outline-none text-slate-900 focus:ring-1 focus:ring-yellow-400 cursor-pointer"
              >
                {state.brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-white border-2 border-slate-900 px-4 py-1.5 rounded-2xl flex items-center gap-3.5 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)]">
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-slate-400 uppercase leading-none">Quota usage</span>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-16 h-2 bg-slate-100 rounded-full border border-slate-350 overflow-hidden shrink-0">
                    <div 
                      className="h-full bg-yellow-400 transition-all duration-300" 
                      style={{ width: `${Math.min((state.nanoBananaCredits / 15) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-extrabold font-mono text-slate-800">{state.nanoBananaCredits} Left</span>
                </div>
              </div>
              <button
                onClick={() => setActiveTab("billing")}
                className="bg-yellow-400 border-2 border-slate-900 text-[10px] font-black px-2.5 py-1 rounded-lg shadow-[1.5px_1.5px_0px_0px_rgba(15,23,42,1)] active:translate-y-0.5 active:shadow-none hover:bg-yellow-300 transition-all cursor-pointer text-slate-900 uppercase tracking-wider"
              >
                Buy
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6 lg:flex-row items-stretch">
        <aside className="lg:w-56 shrink-0 flex flex-row lg:flex-col gap-3 overflow-x-auto lg:overflow-x-visible pb-3 lg:pb-0 border-b lg:border-b-0 lg:border-r border-slate-200 pr-0 lg:pr-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-black whitespace-nowrap transition-all duration-100 cursor-pointer text-left w-full border-2 ${
                  isSelected
                    ? "bg-yellow-400 text-slate-900 border-slate-900 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] scale-[1.02]"
                    : "bg-white text-slate-700 border-slate-900 shadow-[1.5px_1.5px_0px_0px_rgba(15,23,42,1)] hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isSelected ? "text-slate-900 stroke-[2.5]" : "text-slate-400"}`} />
                <span className="uppercase tracking-tight text-[11px]">{tab.label}</span>
              </button>
            );
          })}

          <div className="hidden lg:flex flex-col gap-3 mt-auto pt-4 border-t-2 border-slate-200 border-dashed">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black uppercase text-slate-400 font-mono tracking-wider">Google GAuth Sync</span>
              <span className={`w-2 h-2 rounded-full ${googleSecActive ? "bg-emerald-500 animate-pulse" : "bg-slate-350"}`} />
            </div>

            {googleSecActive ? (
              <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-3 space-y-2 text-left">
                <p className="text-[10px] font-black text-emerald-800 uppercase tracking-tight leading-none flex items-center gap-1">
                  <span>🟢 Synced</span>
                </p>
                <p className="text-[9px] text-slate-600 leading-tight font-bold">Workspace sheets, docs, and drive exports are fully energized!</p>
                <button
                  type="button"
                  onClick={handleGoogleDisconnect}
                  className="w-full bg-white hover:bg-slate-50 border border-slate-250 hover:border-slate-400 text-slate-700 font-black py-1 px-2 text-[9px] rounded-lg cursor-pointer uppercase transition-all"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <div className="bg-white border-2 border-slate-950 rounded-2xl p-3 space-y-2 text-left shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
                <span className="text-[9px] text-slate-500 font-bold block leading-normal">
                  Export guidelines to Docs, sync catalogs to Sheets, and save mockups to Google Drive!
                </span>

                {showClientInput ? (
                  <div className="space-y-1.5">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-tight block">OAuth Client ID (from GCP):</label>
                    <input
                      type="text"
                      value={tempClientId}
                      onChange={(e) => setTempClientId(e.target.value)}
                      placeholder="Enter Client ID..."
                      className="w-full bg-slate-50 border-2 border-slate-900 text-[10px] p-1.5 rounded-lg font-mono outline-none focus:ring-1 focus:ring-yellow-400"
                    />
                    <div className="flex gap-1.5 pt-0.5">
                      <button
                        type="button"
                        onClick={handleSaveClientId}
                        className="flex-1 bg-yellow-400 hover:bg-yellow-300 text-slate-900 border border-slate-900 text-[8px] font-black py-1 rounded cursor-pointer uppercase"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowClientInput(false)}
                        className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[8px] font-bold py-1 rounded cursor-pointer uppercase"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <button
                      type="button"
                      onClick={handleInitGAuth}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-yellow-400 font-black py-2 px-3 text-[10px] rounded-xl cursor-pointer uppercase transition-all flex items-center justify-center gap-1 shadow-sm"
                    >
                      Authenticate
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowClientInput(true)}
                      className="w-full text-slate-500 hover:text-slate-800 font-black py-0.5 text-[8px] text-center uppercase tracking-tight block hover:underline cursor-pointer"
                    >
                      ⚙️ Setup Client ID
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>

        <section className="flex-1 min-w-0 lg:pl-6 pt-2 lg:pt-0">
          {activeTab === "trends" && (
            <TrendsDashboard
              onSelectTrend={(trend) => {
                setActiveTab("swipe");
                alert(`Trend Niche loaded! Prompt parameter outlines tailored to "${trend.title}". Submit prompt in left panel.`);
              }}
              activeBrand={activeBrand}
            />
          )}

          {activeTab === "brand" && (
            <BrandManager
              brands={state.brands}
              activeBrandId={state.activeBrandId}
              onSelectBrand={handleSelectBrand}
              onAddBrand={handleAddBrand}
              onUpdateBrand={handleUpdateBrand}
              onDeleteBrand={handleDeleteBrand}
            />
          )}

          {activeTab === "swipe" && (
            <SwipeSandbox
              activeBrand={activeBrand}
              designs={state.designs}
              onSwipe={handleSwipeDesign}
              onGenerate={handleGenerateDesign}
              trends={[]}
              creditsRemaining={state.nanoBananaCredits}
              onOpenBillingTab={() => setActiveTab("billing")}
            />
          )}

          {activeTab === "mockups" && (
            <MockupStudio
              likedDesigns={state.designs.filter((d) => d.status === "liked" && d.brandId === activeBrand.id)}
              activeBrand={activeBrand}
              onMockupCreated={handleMockupCreated}
              createdMockups={state.mockups.filter((m) => m.brandId === activeBrand.id)}
              onUpdateMockupPrices={handleUpdateMockupPrices}
              onSocialAssetCreated={handleSocialAssetCreated}
              onMockupLike={handleMockupFeedback}
            />
          )}

          {activeTab === "marketing" && (
            <MarketingHub
              mockups={state.mockups.filter((m) => m.brandId === activeBrand.id)}
              onSocialAssetCreated={handleSocialAssetCreated}
              socialAssets={state.socialAssets.filter((sa) => sa.brandId === activeBrand.id)}
              onSocialLike={handleSocialAssetFeedback}
              activeBrand={activeBrand}
              onSocialAssetUpdated={handleUpdateSocialAsset}
            />
          )}

          {activeTab === "analytics" && (
            <AnalyticsCharts
              campaigns={state.campaigns.filter((c) => c.brandId === activeBrand.id)}
              brandName={activeBrand.name}
            />
          )}

          {activeTab === "billing" && (
            <BillingModal
              currentTier={state.activePaymentTier}
              onActivatePaidTier={handleActivateCredits}
              creditsRemaining={state.nanoBananaCredits}
            />
          )}
        </section>
      </main>

      <footer className="bg-white border-t-2 border-slate-200 py-4 shrink-0 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex gap-4 sm:gap-8 text-slate-600">
            <span className="hover:text-slate-900 cursor-pointer" onClick={() => setActiveTab("trends")}>Trends</span>
            <span className="hover:text-slate-900 cursor-pointer" onClick={() => setActiveTab("swipe")}>Tinder Deck</span>
            <span className="hover:text-slate-900 cursor-pointer" onClick={() => setActiveTab("marketing")}>Social Hub</span>
            <span className="hover:text-slate-900 cursor-pointer" onClick={() => setActiveTab("billing")}>Billing</span>
          </div>
          <div className="flex items-center gap-2 font-mono">
            <span>SYSTEM STATUS: <strong className="text-emerald-600 animate-pulse">ALL OPERATIONAL</strong></span>
          </div>
        </div>
      </footer>
    </div>
  );
}
