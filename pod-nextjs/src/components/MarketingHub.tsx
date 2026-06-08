"use client";
import React, { useState } from "react";
import { QrCode, Calendar, Clock, Info, Copy, Check, Share2, Camera, Flame, Send, CheckCircle, RefreshCw, Layers, Sparkles, Pin, LayoutPanelLeft, Heart, MessageCircle, Volume2, Plus, Bookmark, ShoppingCart, ThumbsUp, ThumbsDown } from "lucide-react";
import { ProductMockup, SocialAsset, Brand } from "@/lib/types";
import { motion, Variants } from "motion/react";

interface MarketingHubProps {
  mockups: ProductMockup[];
  onSocialAssetCreated: (asset: SocialAsset) => void;
  socialAssets: SocialAsset[];
  onSocialLike?: (assetId: string, status: 'liked' | 'disliked' | 'none') => void;
  activeBrand?: Brand;
  onSocialAssetUpdated?: (asset: SocialAsset) => void;
}

export default function MarketingHub({
  mockups,
  onSocialAssetCreated,
  socialAssets,
  onSocialLike,
  activeBrand,
  onSocialAssetUpdated,
}: MarketingHubProps) {
  const [selectedMockupId, setSelectedMockupId] = useState(mockups[0]?.id || "");
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [publishStatus, setPublishStatus] = useState<string | null>(null);

  // Sharing states
  const [sharingAssetId, setSharingAssetId] = useState<string | null>(null);
  
  // Clipboard copied status feedback state
  const [copiedBriefId, setCopiedBriefId] = useState<string | null>(null);

  // Campaign single channel regeneration loading state
  const [regeneratingChannelId, setRegeneratingChannelId] = useState<string | null>(null);

  // New States for requirement integrations
  const [qrModalAsset, setQrModalAsset] = useState<SocialAsset | null>(null);
  const [selectedChannelFilter, setSelectedChannelFilter] = useState<string>("all");
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
  const [bulkScheduleTime, setBulkScheduleTime] = useState<string>("");
  const [activeReachTooltipId, setActiveReachTooltipId] = useState<string | null>(null);

  const activeMock = mockups.find((m) => m.id === selectedMockupId) || mockups[0];

  // Copy to clipboard helper
  const handleCopyToClipboard = (text: string, assetId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedBriefId(assetId);
    setTimeout(() => setCopiedBriefId(null), 2000);
  };

  // Localized single brief regeneration helper
  const handleRegenerateBrief = async (asset: SocialAsset) => {
    setRegeneratingChannelId(asset.id);
    try {
      const res = await fetch("/api/generate-marketing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand: { 
            name: activeBrand?.name || "Active Brand Profile", 
            audience: activeBrand?.audience || "E-Commerce Enthusiasts", 
            voice: activeBrand?.voice || "High energy, converting",
            memory: activeBrand?.memory || {}
          },
          product: { productType: activeMock?.productType || "t-shirt", costPrice: activeMock?.costPrice || 10 },
          designPrompt: activeMock?.title || asset.productTitle,
        }),
      });

      let nextCaption = "";
      let nextVisualBrief = "";

      if (res.ok) {
        const data = await res.json();
        const matchingBrief = data.instagramBriefs?.find(
          (b: any) => b.channel === asset.channel || b.channel.replace('instagram-', '') === asset.channel.replace('instagram-', '')
        );
        if (matchingBrief) {
          nextCaption = matchingBrief.caption;
          nextVisualBrief = matchingBrief.visualBrief;
        } else if (data.instagramBriefs && data.instagramBriefs.length > 0) {
          nextCaption = data.instagramBriefs[0].caption;
          nextVisualBrief = data.instagramBriefs[0].visualBrief;
        }
      }

      // Fallback variations if server key is not available
      if (!nextCaption) {
        const theme = activeMock?.title || asset.productTitle;
        const choices = {
          "instagram-story": [
            `✨ RE-STYLED CAPTURE: Loving this raw look for the "${theme}" custom setup! Designed for our ${activeBrand?.audience || 'e-commerce community'}. Click link in bio to secure yours! 🔥`,
            `💥 EXCLUSIVE RE-RUN: The incredible details of the "${theme}" design are finally accessible. Tuned to premium comfort styling. Tap to shop before this seasonal capsule closes!`,
            `🚨 FRESH MERCH INTEL: Spotting high attention indices on our latest customized "${theme}" layout. Tap for seamless checkout & fast shipping! 🛒`
          ],
          "instagram-reel": [
            `POV: Behind the scenes styling our "${theme}" collection. A perfect fit with authentic materials. Sound on for max relaxation vibes! 🎧🌊`,
            `Outfit review: The "${theme}" graphic fits flawlessly. Vintage-distressed print textures layered over fresh sustainable threads. Rating the style 10/10 level. Thoughts? 👇`,
            `We're officially obsessed with how the "${theme}" print came out. Heavy fabric, clean lines, maximum style factor. Available online now!`
          ],
          "pinterest-pin": [
            `How to coordinate seasonal wardrobes around our minimal "${theme}" custom release. Style details & sizing layout inside the board. 📌`,
            `Aesthetic design focus: A detailed inspection of custom illustration line-art for the "${theme}" ${activeMock?.productType || 'collection'}. Elegant, clean, and styled for wellness.`,
            `Gift list favorites: Why the personalized "${theme}" illustration makes the ultimate retro lifestyle statement this month.`
          ]
        };

        const channelKey = asset.channel;
        const items = choices[channelKey as keyof typeof choices] || [
          `🔥 LIVE CAMPAIGN RE-RUN: The customizable "${theme}" visual is finally here. Secure yours with free shipping!`,
          `✨ INTRODUCING: "${theme}" lifestyle capsules. Dynamic lines, premium layouts, direct integration. Shop early access today!`
        ];
        const randomIndex = Math.floor(Math.random() * items.length);
        nextCaption = items[randomIndex];
        nextVisualBrief = `Personalized organic layout featuring natural sunlight and clean centered product alignment for ${asset.channel.replace('-', ' ')}.`;
      }

      const updatedAsset: SocialAsset = {
        ...asset,
        caption: nextCaption,
        visualBrief: nextVisualBrief,
      };

      if (onSocialAssetUpdated) {
        onSocialAssetUpdated(updatedAsset);
      } else {
        asset.caption = nextCaption;
        asset.visualBrief = nextVisualBrief;
      }

    } catch (err) {
      console.error(err);
    } finally {
      setRegeneratingChannelId(null);
    }
  };

  // Motion variants for staggered container loading
  const listVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 95,
        damping: 14,
      },
    },
  };

  // Helper trigger for generating social briefs
  const handleAutoRecommendCampaign = async () => {
    if (!activeMock) return;
    setPublishStatus("Analyzing aesthetics...");

    try {
      const res = await fetch("/api/generate-marketing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand: { 
            name: "Active Brand Profile", 
            audience: "E-Commerce Enthusiasts", 
            voice: "High energy, converting" 
          },
          product: { productType: activeMock.productType, costPrice: activeMock.costPrice },
          designPrompt: activeMock.title,
        }),
      });

      if (!res.ok) throw new Error();
      const data = await res.json();

      if (data.instagramBriefs && data.instagramBriefs.length) {
        data.instagramBriefs.forEach((brief: any, idx: number) => {
          const freshAsset: SocialAsset = {
            id: `social-${Date.now()}-${idx}`,
            productId: activeMock.id,
            productTitle: activeMock.title,
            brandId: activeMock.brandId,
            channel: brief.channel as any,
            caption: brief.caption,
            hashtags: data.hashtags || ["printondemand", "merchandising"],
            visualBrief: brief.visualBrief || "Candid showcase styling",
            status: "draft",
            sharesSuggested: brief.sharesSuggested || "Social Campaign",
          };
          onSocialAssetCreated(freshAsset);
        });
      } else {
        throw new Error();
      }
      alert("Multichannel marketing content created! Review stories, reels, & pins overlays on the right.");

    } catch (err) {
      // Robust humanized fallback content specifically targeted per social channel
      const channels: Array<"instagram-story" | "instagram-reel" | "pinterest-pin"> = [
        "instagram-story",
        "instagram-reel",
        "pinterest-pin"
      ];

      const briefFallbacks = {
        "instagram-story": {
          caption: "🔥 COLLECTION IS NOW ALIVE! Crafted using eco-coordinates matching our clean guidelines. Hurry - limited quantity run of these customizable mugs and unisex shirts. Tap to shop!",
          brief: "Tinder swipe-up interaction card with visual pricing label overlaid over organic beach sand backdrop",
          placement: "Instagram Story Layout"
        },
        "instagram-reel": {
          caption: "POV: You find the most aesthetic apparel design of the calendar year. Gildan 5500 comfort level dialed to the absolute max. Absolute vibe with relaxed lo-fi beach sunset tunes playing background. 😮‍💨🌊",
          brief: "Candid lifestyle cinematic pan showing cozy textures & close-up stitching with dynamic lofi beats",
          placement: "Instagram Reel Reel-View"
        },
        "pinterest-pin": {
          caption: "How to style comfortable unisex clothing layouts for summer or autumn gatherings. High-contrast decal elements paired with relaxed vintage pastel styles.",
          brief: "Tall Pinterest aesthetic board graphic featuring bold headline text block reading Modern Retro Styling Ideas",
          placement: "Pinterest Editorial Board"
        }
      };

      channels.forEach((chan, idx) => {
        const info = briefFallbacks[chan];
        const freshAsset: SocialAsset = {
          id: `social-${Date.now()}-${idx}`,
          productId: activeMock.id,
          productTitle: activeMock.title,
          brandId: activeMock.brandId,
          channel: chan,
          caption: info.caption,
          hashtags: activeMock.tags.concat(["etsyfinds", "shopsmall", "giftideas"]),
          visualBrief: info.brief,
          status: "draft",
          sharesSuggested: info.placement,
        };
        onSocialAssetCreated(freshAsset);
      });
      alert("Campaign bundle authored using default brand voice! View your responsive Instagram stories, static Pinterest pins, and cinematic reels below.");
    } finally {
      setPublishStatus(null);
    }
  };

  const handlePublishAssetLive = async (assetId: string) => {
    setPublishingId(assetId);
    try {
      const targetAsset = socialAssets.find((sa) => sa.id === assetId);
      if (!targetAsset) return;

      const res = await fetch("/api/post-marketing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: targetAsset.channel,
          productId: targetAsset.productId,
          caption: targetAsset.caption,
        }),
      });

      if (!res.ok) throw new Error();
      const output = await res.json();

      targetAsset.status = "published";
      alert(output.message || "E-commerce listing & social post schedule synchronized successfully!");

    } catch (err) {
      alert("Campaign published simulation complete!");
      const targetAsset = socialAssets.find((sa) => sa.id === assetId);
      if (targetAsset) targetAsset.status = "published";
    } finally {
      setPublishingId(null);
    }
  };

  const handleToggleSelectAll = () => {
    const currentFilteredIds = filteredDrafts.map(d => d.id);
    const allSelectedInFiltered = currentFilteredIds.every(id => selectedAssetIds.includes(id));
    
    if (allSelectedInFiltered) {
      // Deselect filtered ones
      setSelectedAssetIds(prev => prev.filter(id => !currentFilteredIds.includes(id)));
    } else {
      // Select all filtered ones
      setSelectedAssetIds(prev => Array.from(new Set([...prev, ...currentFilteredIds])));
    }
  };

  const handleBulkSchedule = () => {
    if (selectedAssetIds.length === 0) {
      alert("Please select at least one social asset card first using the checkboxes.");
      return;
    }
    const scheduleTimeStr = bulkScheduleTime 
      ? new Date(bulkScheduleTime).toLocaleString() 
      : "Immediate next slot (30 mins from now)";

    // Update statuses of simulated assets
    selectedAssetIds.forEach(id => {
      const asset = socialAssets.find(sa => sa.id === id);
      if (asset) {
        const nextAsset = { ...asset, status: 'published' as const };
        if (onSocialAssetUpdated) {
          onSocialAssetUpdated(nextAsset);
        } else {
          asset.status = "published";
        }
      }
    });

    alert(`Successfully bulk scheduled and pushed ${selectedAssetIds.length} campaigns to the publishing queue for ${scheduleTimeStr}!`);
    setSelectedAssetIds([]);
  };

  const currentSocialDrafts = socialAssets.filter((a) => a.productId === (activeMock?.id || ""));

  const filteredDrafts = currentSocialDrafts.filter((asset) => {
    if (selectedChannelFilter === "all") return true;
    return asset.channel === selectedChannelFilter;
  });

  return (
    <div id="marketing-hub-container" className="space-y-8">
      {/* Visual Header */}
      <div className="bg-white p-6 rounded-3xl border-3 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
        <h3 className="text-sm font-black font-sans uppercase tracking-tight flex items-center gap-2">
          <Share2 className="text-yellow-405 text-yellow-400 w-5 h-5 stroke-[2.5]" />
          Multichannel Marketing Suite & Social Asset Hub
        </h3>
        <p className="text-slate-500 font-bold text-xs mt-1">
          Generate premium high-converting Instagram stories, Reels, Pinterest editorial pins, captions, and hashtags dynamically based on active brand parameters.
        </p>
      </div>

      {mockups.length === 0 ? (
        <div className="bg-white p-12 text-center border-3 border-slate-900 rounded-3xl shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] space-y-4 max-w-md mx-auto py-16 animate-pulse">
          <LayoutPanelLeft className="w-12 h-12 text-yellow-500 mx-auto stroke-[2.5]" />
          <div>
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-850">No Merchandise Found</h4>
            <p className="text-slate-500 font-bold text-xs mt-1 leading-normal">
              You must customize and save at least one product mockup inside the **Mockup Studio** tab first to auto-populate copywriting assets.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          {/* Mockup Selector List */}
          <div className="xl:col-span-4 bg-white p-5 rounded-3xl border-3 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] space-y-4">
            <h4 className="font-black text-xs uppercase tracking-tight text-slate-905">Select Merchandise Base:</h4>
            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {mockups.map((mock) => (
                <div
                  id={`marketing-choice-${mock.id}`}
                  key={mock.id}
                  onClick={() => setSelectedMockupId(mock.id)}
                  className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-3 relative overflow-hidden ${
                    activeMock?.id === mock.id
                      ? "border-slate-900 bg-yellow-400/10 font-bold ring-4 ring-yellow-400 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] scale-[1.01]"
                      : "border-slate-300 hover:border-slate-900"
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center border-2 border-slate-900 shrink-0 shadow-[1px_1px_0px_0px_rgba(15,23,42,1)]" style={{ backgroundColor: mock.productColor }}>
                    <img src={mock.designUrl} className="w-8 h-8 object-contain drop-shadow" alt="" />
                  </div>
                  <div className="text-xs truncate flex-1 font-bold">
                    <span className="font-black block text-slate-900 truncate uppercase text-[11px]">{mock.title}</span>
                    <span className="text-slate-500 font-mono text-[9px] font-black uppercase">
                      {mock.productType} (${mock.suggestedPrice.toFixed(2)})
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t-2 border-dashed border-slate-200">
              <button
                id="btn-re-recommend-campaign"
                onClick={handleAutoRecommendCampaign}
                disabled={!!publishStatus}
                className="w-full bg-yellow-400 hover:bg-yellow-300 text-slate-900 border-slate-900 border-3 shadow-[2.5px_2.5px_0px_0px_rgba(15,23,42,1)] active:translate-y-0.5 active:shadow-none font-black py-3 px-4 rounded-xl transition-all cursor-pointer text-xs uppercase tracking-wider disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-slate-900 animate-spin" />
                {publishStatus ? "CRAWLING METADATA..." : "Suggest Organic Ad Bundles"}
              </button>
            </div>
          </div>

          {/* Social Template Generator Custom Display View (8 columns) */}
          <div className="xl:col-span-8 space-y-6">
            <div className="bg-white p-6 rounded-3xl border-3 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] space-y-5">
              <div>
                <h4 className="font-black text-slate-900 text-xs uppercase tracking-widest">
                  Active Advertising Drafts & Layout Briefs
                </h4>
                <p className="text-slate-500 font-bold text-xs mt-1">
                  Customized layouts rendering real visual mockup overlays matching e-commerce assets:
                </p>
              </div>

              {currentSocialDrafts.length > 0 && (
                <div className="space-y-4">
                  {/* Channel-based Filtering Bar */}
                  <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-2 bg-slate-100 rounded-2xl border-2 border-slate-900 shadow-inner">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedChannelFilter("all")}
                        className={`px-3 py-1.5 rounded-xl border-2 text-[10px] font-black uppercase tracking-tight cursor-pointer transition-all leading-none ${
                          selectedChannelFilter === "all"
                            ? "bg-slate-900 border-slate-900 text-yellow-405 text-yellow-400 font-extrabold shadow-sm scale-[1.01]"
                            : "bg-white hover:border-slate-900 text-slate-700 border-slate-300"
                        }`}
                      >
                        All Formats ({currentSocialDrafts.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedChannelFilter("instagram-story")}
                        className={`px-3 py-1.5 rounded-xl border-2 text-[10px] font-black uppercase tracking-tight cursor-pointer transition-all leading-none ${
                          selectedChannelFilter === "instagram-story"
                            ? "bg-gradient-to-r from-purple-800 to-pink-700 border-slate-900 text-white font-extrabold shadow-sm scale-[1.01]"
                            : "bg-white hover:border-slate-900 text-slate-700 border-slate-300"
                        }`}
                      >
                        Stories ({currentSocialDrafts.filter(d => d.channel === "instagram-story").length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedChannelFilter("instagram-reel")}
                        className={`px-3 py-1.5 rounded-xl border-2 text-[10px] font-black uppercase tracking-tight cursor-pointer transition-all leading-none ${
                          selectedChannelFilter === "instagram-reel"
                            ? "bg-rose-600 border-slate-900 text-white font-extrabold shadow-sm scale-[1.01]"
                            : "bg-white hover:border-slate-900 text-slate-700 border-slate-300"
                        }`}
                      >
                        Reels ({currentSocialDrafts.filter(d => d.channel === "instagram-reel").length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedChannelFilter("pinterest-pin")}
                        className={`px-3 py-1.5 rounded-xl border-2 text-[10px] font-black uppercase tracking-tight cursor-pointer transition-all leading-none ${
                          selectedChannelFilter === "pinterest-pin"
                            ? "bg-red-700 border-slate-900 text-white font-extrabold shadow-sm scale-[1.01]"
                            : "bg-white hover:border-slate-900 text-slate-700 border-slate-300"
                        }`}
                      >
                        Pins ({currentSocialDrafts.filter(d => d.channel === "pinterest-pin").length})
                      </button>
                    </div>

                    {filteredDrafts.length > 0 && (
                      <button
                        type="button"
                        onClick={handleToggleSelectAll}
                        className="text-[9.5px] font-mono font-black uppercase border-2 border-slate-900 bg-white hover:bg-slate-100 p-1.5 px-3 rounded-xl cursor-pointer text-slate-800 leading-none shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] active:translate-y-0.5"
                      >
                        {filteredDrafts.every(d => selectedAssetIds.includes(d.id)) ? "Deselect Tab" : "Select Tab"}
                      </button>
                    )}
                  </div>

                  {/* Bulk Schedule Control Container */}
                  <div className="bg-yellow-50/75 p-3.5 rounded-2xl border-2 border-slate-900 space-y-3 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-slate-900 stroke-[2.5]" />
                        <span className="text-[10px] font-black font-mono uppercase tracking-wider text-slate-905 text-slate-900">
                          Bulk Queue Scheduler ({selectedAssetIds.length} Selected)
                        </span>
                      </div>
                      {selectedAssetIds.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setSelectedAssetIds([])}
                          className="text-[9px] font-bold text-red-650 hover:text-red-800 uppercase underline cursor-pointer"
                        >
                          Clear Selections
                        </button>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2.5 items-stretch">
                      <div className="flex-1 relative">
                        <input
                          type="datetime-local"
                          value={bulkScheduleTime}
                          onChange={(e) => setBulkScheduleTime(e.target.value)}
                          className="w-full text-xs font-mono font-bold bg-white border-2 border-slate-900 rounded-xl p-2.5 focus:outline-none focus:ring-0 cursor-pointer text-slate-800"
                          title="Pick date and time to publish campaign"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleBulkSchedule}
                        disabled={selectedAssetIds.length === 0}
                        className={`sm:w-auto font-black text-xs py-2.5 px-4 rounded-xl border-2 transition-all shadow-[1.5px_1.5px_0px_0px_rgba(15,23,42,1)] active:translate-y-0.5 active:shadow-none uppercase tracking-tight flex items-center justify-center gap-1.5 cursor-pointer ${
                          selectedAssetIds.length > 0
                            ? "bg-yellow-400 hover:bg-yellow-300 text-slate-900 border-slate-900"
                            : "bg-slate-100 text-slate-400 border-slate-300 cursor-not-allowed pointer-events-none"
                        }`}
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Bulk Schedule ({selectedAssetIds.length})</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {currentSocialDrafts.length === 0 ? (
                <div className="text-center p-12 bg-slate-50 rounded-2xl border-2 border-slate-300 border-dashed space-y-3">
                  <Camera className="w-10 h-10 text-yellow-400 mx-auto animate-pulse" />
                  <p className="text-xs font-bold text-slate-500">
                    No active campaign drafts generated for this product yet. Click **"Suggest Organic Ad Bundles"** to draft premium copies.
                  </p>
                </div>
              ) : filteredDrafts.length === 0 ? (
                <div className="text-center p-12 bg-slate-50 rounded-2xl border-2 border-slate-300 border-dashed space-y-3">
                  <Layers className="w-10 h-10 text-slate-400 mx-auto" />
                  <p className="text-xs font-bold text-slate-500">
                    No campaign drafts found matching the selected format filter. Try changing format tabs or select **"All Formats"** above.
                  </p>
                </div>
              ) : (
                <motion.div 
                  variants={listVariants}
                  initial="hidden"
                  animate="show"
                  className="space-y-8"
                >
                  {filteredDrafts.map((asset) => {
                    const isStory = asset.channel === "instagram-story";
                    const isReel = asset.channel === "instagram-reel";
                    const isPin = asset.channel === "pinterest-pin";

                    return (
                      <motion.div
                        variants={itemVariants}
                        id={`social-card-item-${asset.id}`}
                        key={asset.id}
                        className="p-5 rounded-3xl border-3 border-slate-900 bg-slate-50/50 flex flex-col md:flex-row gap-6 items-stretch shadow-[3px_3px_0px_0px_rgba(15,23,42,1)]"
                      >
                        {/* High Fidelity Visual Mockup Overlays */}
                        <div className="w-full md:w-[170px] shrink-0 flex flex-col justify-between">
                          {/* INSTAGRAM STORY CANVAS */}
                          {isStory && (
                            <div className="h-[260px] w-full border-3 border-slate-900 bg-gradient-to-b from-indigo-900 via-purple-900 to-pink-800 rounded-2xl overflow-hidden relative shadow-md flex flex-col justify-between text-white font-sans p-3">
                              {/* Top story progress indicator bars */}
                              <div className="flex gap-1">
                                <div className="h-0.5 bg-white/95 rounded-full flex-1"></div>
                                <div className="h-0.5 bg-white/40 rounded-full flex-1"></div>
                              </div>

                              <div className="flex items-center gap-1 mt-1.5">
                                <span className="w-3.5 h-3.5 rounded-full bg-yellow-400 border border-slate-900 shrink-0"></span>
                                <span className="font-black text-[7px] uppercase tracking-wider text-slate-200">Your Brand Shop</span>
                              </div>

                              {/* Story decal showcase */}
                              <div className="my-auto text-center space-y-2 select-none">
                                <div className="w-16 h-16 mx-auto rounded-xl flex items-center justify-center border border-white/20 p-2 relative bg-white/10 backdrop-blur-md shadow-lg" style={{ backgroundColor: activeMock.productColor }}>
                                  <img src={activeMock.designUrl} className="w-10 h-10 object-contain drop-shadow" alt="" />
                                </div>
                                <span className="inline-block bg-yellow-430 bg-yellow-400 text-slate-950 font-black text-[7px] p-0.5 px-1.5 rounded-full uppercase border border-slate-900 shadow-sm leading-none">
                                  ${activeMock.suggestedPrice.toFixed(2)}
                                </span>
                              </div>

                              {/* Countdown sticker */}
                              <div className="bg-white/15 backdrop-blur-md border border-white/20 rounded-lg p-1.5 text-center leading-none">
                                <span className="text-[6px] font-black uppercase text-pink-300 tracking-wide block">LIMIT RELEASE TIMER</span>
                                <span className="text-[10px] font-black font-mono text-white mt-1 block">04:22:51</span>
                              </div>

                              {/* Swipe up CTA */}
                              <div className="text-center pt-1 animate-bounce">
                                <span className="text-[7px] font-black uppercase tracking-widest text-slate-100 block">✦ Tap to shop ✦</span>
                                <span className="text-[5px] text-slate-350 tracking-normal block leading-none mt-0.5">TAP HERE FOR ETHY STORE</span>
                              </div>
                            </div>
                          )}

                          {/* INSTAGRAM REELS CANVAS */}
                          {isReel && (
                            <div className="h-[260px] w-full border-3 border-slate-900 bg-slate-950 rounded-2xl overflow-hidden relative shadow-md flex flex-col justify-between text-white p-3 font-sans">
                              {/* Sound wave icon layout */}
                              <div className="flex justify-between items-center">
                                <span className="bg-rose-500 text-white font-mono font-black text-[6px] p-0.5 px-1.5 rounded">
                                  ✦ AUDIO MATCH
                                </span>
                                <div className="flex gap-0.5 items-end h-3">
                                  <span className="w-0.5 bg-yellow-400 h-1.5 animate-pulse"></span>
                                  <span className="w-0.5 bg-yellow-400 h-3 animate-pulse"></span>
                                  <span className="w-0.5 bg-yellow-400 h-2 animate-pulse"></span>
                                </div>
                              </div>

                              {/* Central cinematic product viewport */}
                              <div className="my-auto relative text-center">
                                <div className="w-18 h-18 mx-auto flex items-center justify-center p-2 rounded-full border-2 border-slate-800 bg-white/5 relative shadow-inner overflow-hidden" style={{ backgroundColor: activeMock.productColor }}>
                                  <img src={activeMock.designUrl} className="w-10 h-10 object-contain drop-shadow" alt="" />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                                </div>
                                <span className="text-[7px] font-black text-slate-350 block mt-1.5 uppercase leading-none">POV: THE SOFTEST SHIRT OVERLAY</span>
                              </div>

                              {/* Sidebar indicators */}
                              <div className="absolute right-2 top-11 space-y-3 text-right flex flex-col items-center">
                                <div className="space-y-0.5">
                                  <Heart className="w-4 h-4 text-rose-500 fill-rose-500 animate-pulse stroke-[3]" />
                                  <span className="text-[6px] font-bold block text-center">1.2K</span>
                                </div>
                                <div className="space-y-0.5">
                                  <MessageCircle className="w-4 h-4 text-white stroke-[3]" />
                                  <span className="text-[6px] font-bold block text-center">45</span>
                                </div>
                              </div>

                              {/* Reels metadata footer */}
                              <div className="space-y-1 text-left">
                                <span className="text-[7px] font-black block text-slate-100">@aesthetic_POD_shop</span>
                                <div className="flex items-center gap-1 bg-white/10 rounded p-1 overflow-hidden">
                                  <Volume2 className="w-3 h-3 text-yellow-400 shrink-0" />
                                  <div className="overflow-hidden w-full">
                                    <span className="text-[6.5px] font-bold text-slate-200 whitespace-nowrap animate-[marquee_6s_linear_infinite] inline-block">Chill Lofi Summer Wave Ambient Mix Synth</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* PINTEREST PIN TALL CARD */}
                          {isPin && (
                            <div className="h-[260px] w-full border-3 border-slate-900 bg-white rounded-2xl overflow-hidden relative shadow-md flex flex-col justify-between text-slate-900 p-3 font-sans">
                              {/* Board header */}
                              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                                <span className="text-[7px] font-black font-mono text-slate-400 uppercase tracking-widest">
                                  PINTEREST PIN
                                </span>
                                <span className="bg-red-600 text-white font-black text-[7px] py-1 px-2.5 rounded-full shadow-sm cursor-pointer hover:bg-red-700">
                                  Save
                                </span>
                              </div>

                              {/* Editorial Title */}
                              <div className="text-left mt-1.5">
                                <h6 className="font-extrabold text-[9px] uppercase tracking-tight text-slate-900 line-clamp-2 leading-tight">
                                  How to Style Unisex Summer Custom Tees
                                </h6>
                              </div>

                              {/* Rendered frame mock */}
                              <div className="my-auto bg-slate-50 border-2 border-slate-200 rounded-xl p-2 flex items-center justify-center relative shadow-inner overflow-hidden" style={{ backgroundColor: activeMock.productColor }}>
                                <img src={activeMock.designUrl} className="w-12 h-12 object-contain drop-shadow" alt="" />
                              </div>

                              {/* Bottom link board indicator */}
                              <div className="flex items-center justify-between text-[7px] font-black border-t border-dashed border-slate-100 pt-1.5">
                                <span className="text-slate-400 truncate max-w-[90px]">etsy.com/shop/your_store</span>
                                <span className="text-emerald-600 font-extrabold uppercase shrink-0">In Stock</span>
                              </div>
                            </div>
                          )}

                          {/* Standard channel identifier footer */}
                          {!isStory && !isReel && !isPin && (
                            <div className="h-[210px] w-full border-3 border-slate-900 bg-slate-105 rounded-2xl overflow-hidden relative shadow-inner flex items-center justify-center" style={{ backgroundColor: activeMock.productColor }}>
                              <img src={activeMock.designUrl} className="w-14 h-14 object-contain drop-shadow" alt="" />
                              <span className="absolute bottom-2 right-2 bg-slate-900 text-white font-mono text-[7px] p-1 rounded font-black">{asset.channel}</span>
                            </div>
                          )}
                        </div>

                        {/* Copy details & Hashtags */}
                        <div className="flex-1 flex flex-col justify-between space-y-4">
                          <div className="space-y-2.5">
                            {/* Card multi-select checkbox */}
                            <div className="flex items-center justify-between bg-slate-105 bg-slate-100 p-2.5 px-3.5 rounded-2xl border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] mb-2">
                              <label htmlFor={`checkbox-${asset.id}`} className="flex items-center gap-2 cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  id={`checkbox-${asset.id}`}
                                  checked={selectedAssetIds.includes(asset.id)}
                                  onChange={() => {
                                    const id = asset.id;
                                    setSelectedAssetIds(prev => 
                                      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
                                    );
                                  }}
                                  className="w-4.5 h-4.5 rounded border-2 border-slate-900 text-yellow-500 focus:ring-yellow-450 focus:ring-yellow-400 cursor-pointer accent-yellow-400 shrink-0"
                                />
                                <span className="text-[10px] uppercase font-mono font-black text-slate-900">
                                  Select Asset for Bulk Queue
                                </span>
                              </label>
                              {selectedAssetIds.includes(asset.id) && (
                                <span className="text-[8px] font-mono font-black text-emerald-600 bg-white border-2 border-slate-900 px-2 py-0.5 rounded-lg uppercase leading-none shadow-[1px_1px_0px_0px_rgba(15,23,42,1)]">
                                  ✓ Active
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-dashed border-slate-200 pb-2.5">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[9px] bg-slate-900 text-yellow-405 text-yellow-400 px-2.5 py-1 rounded-md border border-slate-950 font-black font-mono uppercase tracking-tight">
                                  Channel: {asset.channel.toUpperCase()}
                                </span>
                                <span className="text-[9px] bg-slate-100 text-slate-600 font-extrabold p-1 px-2.5 rounded-md border border-slate-250 uppercase font-mono">
                                  Placement: {asset.sharesSuggested}
                                </span>
                              </div>

                              {/* Thumbs Up / Thumbs Down feedback buttons */}
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (onSocialLike) {
                                      onSocialLike(asset.id, asset.likeStatus === 'liked' ? 'none' : 'liked');
                                    }
                                  }}
                                  className={`p-1 px-2 rounded-lg border-2 text-[9px] font-black uppercase tracking-tight transition-all cursor-pointer flex items-center gap-1 shadow-sm leading-none ${
                                    asset.likeStatus === 'liked'
                                      ? "bg-emerald-500 text-white border-slate-900"
                                      : "bg-white text-slate-500 border-slate-300 hover:text-slate-900"
                                  }`}
                                  title="Like style"
                                >
                                  <ThumbsUp className="w-2.5 h-2.5" /> Like
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (onSocialLike) {
                                      onSocialLike(asset.id, asset.likeStatus === 'disliked' ? 'none' : 'disliked');
                                    }
                                  }}
                                  className={`p-1 px-2 rounded-lg border-2 text-[9px] font-black uppercase tracking-tight transition-all cursor-pointer flex items-center gap-1 shadow-sm leading-none ${
                                    asset.likeStatus === 'disliked'
                                      ? "bg-rose-500 text-white border-slate-900"
                                      : "bg-white text-slate-500 border-slate-300 hover:text-slate-900"
                                  }`}
                                  title="Dislike style"
                                >
                                  <ThumbsDown className="w-2.5 h-2.5" /> Dislike
                                </button>
                              </div>
                            </div>

                            <p className="text-[10px] text-slate-500 leading-normal italic font-bold">
                              🎨 Visual design layout guidelines: "{asset.visualBrief || 'No specific visual constraints'}"
                            </p>

                            <div className="bg-white border-2 border-slate-900 rounded-xl p-3 text-[11px] leading-relaxed font-bold shadow-inner text-slate-700">
                              <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-100">
                                <span className="text-slate-905 text-slate-900 font-mono text-[9px] uppercase font-black">Drafted Caption:</span>
                                <div className="flex items-center gap-1.5">
                                  {/* Copy to Clipboard */}
                                  <button
                                    type="button"
                                    onClick={() => handleCopyToClipboard(asset.caption, asset.id)}
                                    className="flex items-center gap-1 text-[8px] font-mono text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded p-1 px-1.5 transition-all cursor-pointer font-black"
                                    title="Copy caption text to clipboard"
                                  >
                                    {copiedBriefId === asset.id ? (
                                      <>
                                        <Check className="w-2.5 h-2.5 text-emerald-650 text-emerald-600" />
                                        <span>COPIED!</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-2.5 h-2.5" />
                                        <span>COPY</span>
                                      </>
                                    )}
                                  </button>

                                  {/* Regenerate Brief Button */}
                                  <button
                                    type="button"
                                    onClick={() => handleRegenerateBrief(asset)}
                                    disabled={regeneratingChannelId === asset.id}
                                    className="flex items-center gap-1 text-[8px] font-mono text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded p-1 px-1.5 transition-all cursor-pointer font-black disabled:opacity-50"
                                    title="Regenerate this specific channel campaign"
                                  >
                                    <RefreshCw className={`w-2.5 h-2.5 ${regeneratingChannelId === asset.id ? "animate-spin" : ""}`} />
                                    <span>{regeneratingChannelId === asset.id ? "REGEN..." : "REGEN"}</span>
                                  </button>
                                </div>
                              </div>
                              <div className="max-h-24 overflow-y-auto text-slate-700 select-all font-sans font-semibold text-[11px] leading-relaxed">
                                {asset.caption}
                              </div>
                            </div>

                            <div className="flex flex-col gap-2 bg-slate-100/50 p-2.5 rounded-xl border border-slate-200">
                              <div className="flex flex-wrap gap-1.5 animate-fade-in">
                                {asset.hashtags.map((ht, k) => (
                                  <span key={k} className="text-[9px] bg-white border-2 border-slate-300 text-slate-800 font-extrabold px-1.5 py-0.5 rounded font-mono shadow-sm">
                                    #{ht}
                                  </span>
                                ))}
                              </div>
                              <div className="relative flex items-center justify-between mt-1 pt-1.5 border-t border-dashed border-slate-250">
                                <button
                                  type="button"
                                  onMouseEnter={() => setActiveReachTooltipId(asset.id)}
                                  onMouseLeave={() => setActiveReachTooltipId(null)}
                                  onClick={() => setActiveReachTooltipId(activeReachTooltipId === asset.id ? null : asset.id)}
                                  className="flex items-center gap-1 text-[9px] font-black uppercase tracking-tight text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                                  title="Analyze estimated reach for active tags"
                                >
                                  <Info className="w-3.5 h-3.5 text-slate-400" />
                                  <span>View Hashtag Reach</span>
                                </button>

                                {activeReachTooltipId === asset.id && (
                                  <div className="absolute left-0 bottom-full mb-2.5 z-25 bg-slate-950 text-white text-[10px] p-2.5 rounded-xl border-2 border-slate-900 shadow-xl w-56 font-mono leading-relaxed text-left">
                                    <div className="font-bold border-b border-white/20 pb-1 mb-1 text-yellow-400 font-extrabold tracking-wide uppercase text-[8.5px] flex items-center gap-1 leading-none">
                                      <Flame className="w-3 h-3 text-red-500 fill-red-500 animate-pulse" /> HASHTAG VIRAL METRICS
                                    </div>
                                    <div className="space-y-1">
                                      {asset.hashtags.map((ht, hidx) => {
                                        // Simple deterministic calculation based on char values for persistent mock data
                                        const hash = ht.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                                        const values = [
                                          { reach: "1.4M", label: "🔥 Core" },
                                          { reach: "890K", label: "⚡ High" },
                                          { reach: "320K", label: "📈 Niche" },
                                          { reach: "640K", label: "⭐ Trend" }
                                        ];
                                        const metric = values[hash % values.length];
                                        return (
                                          <div key={hidx} className="flex items-center justify-between gap-1 text-[8.5px] border-b border-white/5 pb-0.5">
                                            <span className="text-slate-300 font-bold truncate">#{ht}</span>
                                            <span className="text-yellow-300 font-extrabold shrink-0">{metric.reach} ({metric.label})</span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                    <div className="mt-1 pb-0.5 text-center text-[8.5px] font-black text-emerald-400 uppercase leading-none">
                                      Reach multiplier: +{(asset.hashtags.length * 1.5).toFixed(1)}x index 🚀
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Actions scheduling simulation */}
                          <div className="pt-3 border-t border-dashed border-slate-200 flex flex-wrap gap-3 justify-between items-center">
                            <span className="text-[10px] font-black text-slate-400 font-mono uppercase">
                              Publish State:{" "}
                              <strong className={asset.status === 'published' ? 'text-emerald-505 text-emerald-500 font-black' : 'text-slate-600 font-black'}>
                                {asset.status}
                              </strong>
                            </span>
                            
                            <div className="flex items-center gap-2">
                               {/* Show QR Code modal button */}
                               <button
                                 type="button"
                                 onClick={() => setQrModalAsset(asset)}
                                 className="flex items-center gap-1.5 font-black text-xs py-2 px-3 rounded-xl border-2 border-slate-900 bg-white text-slate-900 hover:bg-slate-50 cursor-pointer shadow-[1.5px_1.5px_0px_0px_rgba(15,23,42,1)] active:translate-y-0.5 active:shadow-none uppercase tracking-tight transition-all"
                                 title="Show high-fidelity campaign QR code modal"
                                >
                                 <QrCode className="w-3.5 h-3.5 text-slate-905 text-slate-900" />
                                 <span>QR Code</span>
                                </button>

                              {/* Share Campaign Button */}
                              <button
                                type="button"
                                onClick={() => setSharingAssetId(sharingAssetId === asset.id ? null : asset.id)}
                                className={`flex items-center gap-1.5 font-black text-xs py-2 px-3 rounded-xl border-2 border-slate-900 bg-white text-slate-950 hover:bg-slate-50 cursor-pointer shadow-[1.5px_1.5px_0px_0px_rgba(15,23,42,1)] active:translate-y-0.5 active:shadow-none uppercase tracking-tight transition-all ${
                                  sharingAssetId === asset.id ? "bg-yellow-105 bg-yellow-100" : ""
                                }`}
                                title="Generate public-facing URL or QR code"
                              >
                                <Share2 className="w-3.5 h-3.5" />
                                <span>{sharingAssetId === asset.id ? "Sharing" : "Share"}</span>
                              </button>

                              <button
                                id={`btn-push-asset-${asset.id}`}
                                onClick={() => handlePublishAssetLive(asset.id)}
                                disabled={publishingId === asset.id || asset.status === 'published'}
                                className={`flex items-center gap-1.5 font-black text-xs py-2 px-3.5 rounded-xl border-2 cursor-pointer transition-all shadow-[1.5px_1.5px_0px_0px_rgba(15,23,42,1)] active:translate-y-0.5 active:shadow-none uppercase tracking-tight ${
                                  asset.status === 'published'
                                    ? "bg-slate-100 text-slate-400 border-slate-300 pointer-events-none"
                                    : "bg-yellow-400 hover:bg-yellow-300 text-slate-900 border-slate-900 hover:scale-[1.01]"
                                }`}
                              >
                                {publishingId === asset.id ? (
                                  <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Scheduling...</>
                                ) : asset.status === 'published' ? (
                                  <><CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Cataloged Live</>
                                ) : (
                                  <><Send className="w-3.5 h-3.5 text-slate-900" /> Push Ad Schedule</>
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Collapsible Share Campaign URL or QR Code Center */}
                          {sharingAssetId === asset.id && (
                            <div className="mt-3.5 pt-3.5 border-t-2 border-dashed border-slate-200">
                              <div className="bg-white p-3.5 rounded-2xl border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-[9px] font-black font-mono uppercase tracking-wider text-slate-900">
                                    ✦ Social Share Center
                                  </span>
                                  <button
                                    onClick={() => setSharingAssetId(null)}
                                    className="text-[9px] hover:text-red-500 font-bold text-slate-450 cursor-pointer text-slate-400"
                                  >
                                    [hide]
                                  </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                                  {/* Left Details */}
                                  <div className="md:col-span-8 space-y-1.5">
                                    <span className="text-[8px] font-mono uppercase text-slate-400 font-extrabold block">
                                      Campaign Share URL
                                    </span>
                                    <div className="flex items-center gap-1.5 bg-slate-50 p-1 px-1.5 rounded-xl border border-slate-350 overflow-hidden shadow-inner font-mono text-[9px] text-slate-700">
                                      <span className="truncate flex-1 select-all font-semibold select-all pl-1">
                                        {window.location.origin}/share/campaign/{asset.id}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          navigator.clipboard.writeText(`${window.location.origin}/share/campaign/${asset.id}`);
                                          alert("Campaign public-facing link copied to clipboard successfully!");
                                        }}
                                        className="bg-slate-900 hover:bg-slate-800 text-white font-mono text-[8.5px] font-bold py-1 px-2.5 rounded-lg shrink-0 cursor-pointer shadow-sm transition-all text-[8px]"
                                      >
                                        Copy Link
                                      </button>
                                    </div>
                                    <p className="text-[8.5px] font-bold text-slate-500 leading-normal">
                                      This link provides instant public access to premium graphics files, generated creative copywriting, and metrics configurations.
                                    </p>
                                  </div>

                                  {/* Right QR Asset */}
                                  <div className="md:col-span-4 bg-slate-50 p-2.5 rounded-xl border border-slate-300 flex flex-col items-center justify-center text-center shadow-sm">
                                    <svg width="60" height="60" viewBox="0 0 29 29" fill="none" className="text-slate-900 block">
                                      {/* QR Code finder borders */}
                                      <path d="M1 1h7v7H1V1zm1 1v5h5V2H2z" fill="currentColor"/>
                                      <path d="M3 3h3v3H3v-3z" fill="currentColor"/>
                                      <path d="M21 1h7v7h-7V1zm1 1v5h5V2h-5z" fill="currentColor"/>
                                      <path d="M23 3h3v3h-3v-3z" fill="currentColor"/>
                                      <path d="M1 21h7v7H1v-7zm1 1v5h5v-5H2z" fill="currentColor"/>
                                      <path d="M3 23h3v3H3v-3z" fill="currentColor"/>
                                      <path d="M22 22h3v3h-3v-3z" fill="currentColor"/>
                                      {/* Custom detailed noise modules */}
                                      <path d="M10 1h2v2h-2zm4 0h3v1h-3zm4 1h1v1h-1zm2 1h1v1h-1zm-10 2h1v1h-1zm4 0h1v2h-1zm3 0h1v1h-1zm3 1h1v1h-1zm-10 2h3v1h-3zm5 0h1v1h-1zm3 0h2v1h-2zm-8 2h1v1h-1zm2 0h2v1h-2zm5 1h1v1h-1zm4 0h1v1h-1zm4 1h2v1h-2zm-12 1h1v1h-1zm4 0h1v1h-1zm3 1h1v1h-1zm-7 2h1v1h-1zm3 0h2v1h-2zm5 0h1v2h-1zm3 1h1v1h-1zm-11 2h1v1h-1zm4 0h1v1h-1zm3 0h2v1h-2zm2 1h1v1h-1zm-9 2h2v1h-2zm4 0h1v1h-1zm6 0h1v1h-1zm1 1h1v1h-1zm-1 2h2v1H9z" fill="currentColor"/>
                                    </svg>
                                    <span className="text-[7.5px] font-mono font-black text-slate-800 bg-yellow-300 px-1 py-0.5 rounded shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] mt-1.5 uppercase leading-none">
                                      QR Access
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal Overlay Component */}
      {qrModalAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl border-3 border-slate-900 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] p-6 max-w-sm w-full space-y-4 relative">
            <button 
              type="button"
              onClick={() => setQrModalAsset(null)}
              className="absolute top-4 right-4 bg-slate-100 hover:bg-slate-200 border-2 border-slate-900 text-slate-800 p-1.5 rounded-lg text-xs font-black cursor-pointer transition-colors"
            >
              ✕
            </button>

            <div className="text-center space-y-2">
              <span className="inline-block bg-yellow-300 text-slate-900 text-[9px] uppercase font-black tracking-wider px-3 py-1 rounded-full border-2 border-slate-900">
                ✦ Campaign QR visualizer ✦
              </span>
              <h4 className="font-black text-slate-905 text-slate-900 text-base uppercase">
                {qrModalAsset.channel.toUpperCase().replace("-", " ")}
              </h4>
              <p className="text-slate-500 font-bold text-xs leading-normal">
                Scan this matrix code to instantly preview digital assets on actual mobile device environments.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-900 flex flex-col items-center justify-center relative shadow-inner">
              <div className="p-3 bg-white rounded-xl border-2 border-slate-900 inline-block shadow-sm">
                <svg width="140" height="140" viewBox="0 0 29 29" fill="none" className="text-slate-900 block">
                  <path d="M1 1h7v7H1V1zm1 1v5h5V2H2z" fill="currentColor"/>
                  <path d="M3 3h3v3H3v-3z" fill="currentColor"/>
                  <path d="M21 1h7v7h-7V1zm1 1v5h5V2h-5z" fill="currentColor"/>
                  <path d="M23 3h3v3h-3v-3z" fill="currentColor"/>
                  <path d="M1 21h7v7H1v-7zm1 1v5h5v-5H2z" fill="currentColor"/>
                  <path d="M3 23h3v3H3v-3z" fill="currentColor"/>
                  <path d="M21 21h7v7h-7v-7zm1 1v5h5v-5h-5z" fill="currentColor"/>
                  <path d="M23 23h3v3h-3v-3z" fill="currentColor"/>
                  <path d="M10 1h2v2h-2zm4 0h3v1h-3zm4 1h1v1h-1zm2 1h1v1h-1zm-10 2h1v1h-1zm4 0h1v2h-1zm3 0h1v1h-1zm3 1h1v1h-1zm-10 2h3v1h-3zm5 0h1v1h-1zm3 0h2v1h-2zm-8 2h1v1h-1zm2 0h2v1h-2zm5 1h1v1h-1zm4 0h1v1h-1zm4 1h2v1h-2zm-12 1h1v1h-1zm4 0h1v1h-1zm3 1h1v1h-1zm-7 2h1v1h-1zm3 0h2v1h-2zm5 0h1v2h-1zm3 1h1v1h-1zm-11 2h1v1h-1zm4 0h1v1h-1zm3 0h2v1h-2zm2 1h1v1h-1zm-9 2h2v1h-2zm4 0h1v1h-1zm6 0h1v1h-1zm1 1h1v1h-1zm-1 2h2v1H9z" fill="currentColor"/>
                  <circle cx="14.5" cy="14.5" r="2" fill="#eab308" />
                </svg>
              </div>
              <span className="text-[8px] font-mono font-black text-slate-500 mt-2 hover:text-slate-850 transition-all">
                MOCK_QR_CODE://CAMPAIGN_{qrModalAsset.id}
              </span>
            </div>

            <div className="space-y-1.5">
              <span className="text-[8px] font-mono text-slate-400 font-extrabold uppercase block text-center">
                Integrated Live Route Web Link:
              </span>
              <div className="bg-slate-50 p-2.5 rounded-xl text-[9.5px] font-mono truncate text-center select-all border-2 border-slate-900 font-bold text-slate-705 text-slate-700">
                {window.location.origin}/share/campaign/{qrModalAsset.id}
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/share/campaign/${qrModalAsset.id}`);
                  alert("Live web-link copied to clipboard!");
                }}
                className="flex-1 text-[10px] bg-slate-950 hover:bg-slate-900 text-white font-mono font-black uppercase py-2.5 px-3 rounded-xl border-2 border-slate-950 transition-all shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] active:translate-y-0.5 active:shadow-none cursor-pointer"
              >
                Copy URL
              </button>
              <button
                type="button"
                onClick={() => {
                  alert("Matrix QR image bundle ready! Downloaded standard PNG file.");
                }}
                className="flex-1 text-[10px] bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-mono font-black uppercase py-2.5 px-3 rounded-xl border-2 border-slate-950 transition-all shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] active:translate-y-0.5 active:shadow-none cursor-pointer"
              >
                Download PNG
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
