"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Heart, X, Sparkles, Wand2, Info, ShoppingBag, ShieldAlert, CheckSquare, Zap, CreditCard, Type, Image as ImageIcon, ShieldCheck, Copy, Paintbrush } from "lucide-react";
import { Brand, DesignCard, TrendIdea } from "@/lib/types";

interface SwipeSandboxProps {
  activeBrand: Brand;
  designs: DesignCard[];
  onSwipe: (designId: string, status: 'liked' | 'disliked') => void;
  onGenerate: (prompt: string, theme: string) => Promise<void>;
  trends: TrendIdea[];
  creditsRemaining: number;
  onOpenBillingTab: () => void;
}

export default function SwipeSandbox({
  activeBrand,
  designs,
  onSwipe,
  onGenerate,
  trends,
  creditsRemaining,
  onOpenBillingTab,
}: SwipeSandboxProps) {
  const [userIdeaInput, setUserIdeaInput] = useState("");
  const [selectedTheme, setSelectedTheme] = useState("No theme");
  const [loading, setLoading] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [explanationText, setExplanationText] = useState("");
  const [dragOffset, setDragOffset] = useState(0);

  // Selector for Image vs Text mode
  const [sandboxMode, setSandboxMode] = useState<"image" | "text">("image");
  // Selector for text preferences layout style
  const [textPreference, setTextPreference] = useState<"with_text" | "without_text" | "no_preference">("with_text");

  // State to hold drafted slogan/expression options
  const [draftedSlogans, setDraftedSlogans] = useState<Array<{
    slogan: string;
    oneLiner: string;
    expression: string;
    prompt: string;
  }>>([]);
  const [guidelinesReflection, setGuidelinesReflection] = useState("");

  // Filter pending designs for Tinder swiping
  const activeDeck = designs.filter((d) => d.status === "pending" && d.brandId === activeBrand.id);

  // Handle generating directly a design image card (Option A or painted suggestion)
  const handleCompileDesign = async (forcedPrompt?: string) => {
    const promptToSend = forcedPrompt || userIdeaInput;
    if (!promptToSend.trim()) return;

    if (creditsRemaining <= 0) {
      alert("Nano Banana Free Quota surpassed! Please activate our paid credits tier or enter a developer API key to clear limitation flags.");
      onOpenBillingTab();
      return;
    }

    setLoading(true);
    setExplanationText("");

    try {
      // Step 1: Query backend to analyze prompt and write first-person "What I'm doing today" explanation
      const analyzeRes = await fetch("/api/analyze-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userIdea: promptToSend,
          brandName: activeBrand.name,
          brandAudience: activeBrand.audience,
          brandVoice: activeBrand.voice,
          brandKeywords: activeBrand.customKeywords,
          brandMemory: activeBrand.memory,
        }),
      });

      const analyzeData = await analyzeRes.json();
      setExplanationText(analyzeData.introMessage || `I am going to work on ${promptToSend} custom graphics suited for ${activeBrand.name}.`);

      // Step 2: Trigger image generator
      await onGenerate(analyzeData.finalRefinedPrompt || promptToSend, selectedTheme);
      
      // Clear fields on successful direct manual generation
      if (!forcedPrompt) {
        setUserIdeaInput("");
      }

    } catch (err) {
      console.error(err);
      alert("Design composition ran into an error. Setting fallback generation assets.");
    } finally {
      setLoading(false);
    }
  };

  // Option B: Slogan and prompt compiler handler
  const handleDraftSlogans = async () => {
    if (!userIdeaInput.trim()) {
      alert("Please enter a basic theme or custom seed idea to draft expressions and prompts.");
      return;
    }

    setDrafting(true);
    setGuidelinesReflection("");
    setDraftedSlogans([]);

    try {
      const res = await fetch("/api/generate-prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userIdea: userIdeaInput,
          theme: selectedTheme,
          brandName: activeBrand.name,
          brandAudience: activeBrand.audience,
          brandVoice: activeBrand.voice,
          brandKeywords: activeBrand.customKeywords,
          brandMemory: activeBrand.memory,
          textPreference,
        }),
      });

      if (!res.ok) throw new Error("Prompt drafting response failed");
      const data = await res.json();
      setDraftedSlogans(data.suggestions || []);
      setGuidelinesReflection(data.brandGuidelinesReflection || "");
    } catch (err) {
      console.error(err);
      alert("AI slogan and prompt drafting encountered an error. Applied developer custom guidelines template.");
    } finally {
      setDrafting(false);
    }
  };

  // Drag handler for Framer Motion Tinder swiping
  const handleDragEnd = (event: any, info: any, cardId: string) => {
    const swipeThreshold = 100;
    if (info.offset.x > swipeThreshold) {
      // Swipe Right -> Like
      onSwipe(cardId, "liked");
    } else if (info.offset.x < -swipeThreshold) {
      // Swipe Left -> Dislike
      onSwipe(cardId, "disliked");
    }
    setDragOffset(0);
  };

  const handleManualSwipe = (cardId: string, status: 'liked' | 'disliked') => {
    onSwipe(cardId, status);
  };

  return (
    <div id="swipe-sandbox" className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
      {/* Left Input panel (2 columns) */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white p-6 rounded-3xl border-3 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] space-y-5">
          <div className="flex items-center justify-between pb-3 border-b-2 border-dashed border-slate-200">
            <h3 className="font-extrabold text-slate-900 flex items-center gap-1.5 text-xs uppercase tracking-wider">
              <Wand2 className="text-pink-500 w-5 h-5 stroke-[2.5]" />
              Sandbox Designer
            </h3>
            <span className="text-[10px] bg-slate-900 text-white px-2.5 py-1 rounded-lg font-mono font-black uppercase tracking-tight">
              AI Powered
            </span>
          </div>

          {/* Credits Display */}
          {creditsRemaining <= 0 ? (
            <div className="p-4 bg-yellow-50 rounded-2xl border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] flex items-start gap-3 text-slate-900">
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-rose-500 stroke-[2.5]" />
              <div>
                <span className="font-black text-xs block uppercase tracking-tight">Free Quota Surpassed</span>
                <span className="text-[11px] font-bold leading-relaxed block mt-1 text-slate-600">
                  No further designs can be created today. Activate paid sandbox tiers or input custom credentials.
                </span>
                <button
                  onClick={onOpenBillingTab}
                  className="mt-3 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 bg-yellow-400 p-1.5 px-3 rounded-lg border-2 border-slate-900 shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
                >
                  <CreditCard className="w-3.5 h-3.5" /> Buy Credits
                </button>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-emerald-50 text-slate-950 border-2 border-slate-900 rounded-2xl flex items-center justify-between shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4.5 h-4.5 text-emerald-600 shrink-0 stroke-[2.5]" />
                <span className="text-xs font-bold leading-tight">
                  <strong className="text-slate-900">{creditsRemaining} Credits</strong> remaining.
                </span>
              </div>
              <span className="text-[8px] font-mono font-black text-emerald-700 bg-white border-2 border-emerald-300 px-1.5 py-0.5 rounded uppercase">
                Legal Safe Shield Active
              </span>
            </div>
          )}

          {/* Neobrutalist Select Mode Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl border-2 border-slate-900 shadow-[1.5px_1.5px_0px_0px_rgba(15,23,42,1)]">
            <button
              type="button"
              onClick={() => {
                setSandboxMode("image");
                setDraftedSlogans([]);
              }}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-black uppercase tracking-tight transition-all cursor-pointer ${
                sandboxMode === "image"
                  ? "bg-yellow-405 bg-yellow-400 text-slate-900 border-2 border-slate-900 shadow-[1px_1px_0px_0px_rgba(15,23,42,1)]"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              Generate Images
            </button>
            <button
              type="button"
              onClick={() => {
                setSandboxMode("text");
              }}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-black uppercase tracking-tight transition-all cursor-pointer ${
                sandboxMode === "text"
                  ? "bg-pink-300 text-slate-900 border-2 border-slate-900 shadow-[1px_1px_0px_0px_rgba(15,23,42,1)]"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Type className="w-3.5 h-3.5" />
              Generate Texts
            </button>
          </div>

          <div className="space-y-4">
            {/* Idea Selection Frame */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] font-black text-slate-400 block font-mono uppercase tracking-wider">
                  {sandboxMode === "image" ? "Your Concept Idea / Drawing Prompt:" : "Your Slogan Concept Concept Idea:"}
                </label>
                <span className="text-[8px] bg-slate-150 text-slate-500 border border-slate-300 font-mono font-bold uppercase rounded p-0.5 px-1 bg-slate-100 select-none">
                  Instant Prompting Engine
                </span>
              </div>
              <textarea
                id="input-user-concept"
                rows={3}
                value={userIdeaInput}
                onChange={(e) => setUserIdeaInput(e.target.value)}
                placeholder={
                  sandboxMode === "image"
                    ? "Input ANY custom idea (independent of selected themes!). E.g.: 'A patriotic camping bear wearing sunglasses, retro distressed stamp look.'"
                    : "Describe the concept topic you want custom slogan options drafted for. E.g.: 'outdoors father dad humor' or 'beach shells meditation'"
                }
                className="w-full text-xs font-semibold border-2 border-slate-900 focus:outline-none p-3.5 rounded-xl bg-white focus:ring-1 focus:ring-yellow-400 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] resize-none"
              />
              <p className="text-[9px] text-slate-400 font-bold mt-1 tracking-wide leading-tight">
                * Tip: Feel free to input ANY idea here. The AI will custom-optimize the final output prompt even if it does not belong to the selected theme!
              </p>
            </div>

            {/* Target Theme Dropdown (with ALWAYS present "No theme" evergreen fallback) */}
            <div>
              <label className="text-[10px] font-black text-slate-400 block mb-1.5 font-mono uppercase tracking-wider">
                Target Seasonal Theme Context:
              </label>
              <select
                id="select-design-theme"
                value={selectedTheme}
                onChange={(e) => setSelectedTheme(e.target.value)}
                className="w-full text-xs font-black border-2 border-slate-900 focus:outline-none p-2.5 rounded-xl bg-white shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] focus:ring-1 focus:ring-yellow-400 cursor-pointer"
              >
                <option value="No theme">No theme (Evergreen / All Year Long Product) 🌟</option>
                <option value="4th of July Camping">4th of July Weekend & Outdoors</option>
                <option value="Summer Retro Wave">Groovy Summer Coastlines & Sunsets</option>
                <option value="Back to School Teacher">Elementaries Back to School</option>
                <option value="Father's Day Barbecue">Father's Day BBQ & Master Grill</option>
                <option value="Custom Niche Topic">General Custom Branding line</option>
              </select>
            </div>

            {/* Text options configurations only shown in Option B text modes */}
            {sandboxMode === "text" && (
              <div className="space-y-1.5 bg-slate-50 p-3 rounded-2xl border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
                <span className="text-[9px] font-black font-mono text-slate-500 uppercase tracking-widest block">Text Rendering Preferences:</span>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setTextPreference("with_text")}
                    className={`p-1.5 text-[9px] font-extrabold uppercase rounded border ${
                      textPreference === "with_text"
                        ? "bg-slate-900 text-white border-slate-900 font-black"
                        : "bg-white text-slate-700 border-slate-200"
                    }`}
                  >
                    Include Text
                  </button>
                  <button
                    type="button"
                    onClick={() => setTextPreference("without_text")}
                    className={`p-1.5 text-[9px] font-extrabold uppercase rounded border ${
                      textPreference === "without_text"
                        ? "bg-slate-900 text-white border-slate-900 font-black"
                        : "bg-white text-slate-700 border-slate-200"
                    }`}
                  >
                    Illustration Only
                  </button>
                  <button
                    type="button"
                    onClick={() => setTextPreference("no_preference")}
                    className={`p-1.5 text-[9px] font-extrabold uppercase rounded border ${
                      textPreference === "no_preference"
                        ? "bg-slate-900 text-white border-slate-900 font-black"
                        : "bg-white text-slate-700 border-slate-200"
                    }`}
                  >
                    Let AI Decent
                  </button>
                </div>
              </div>
            )}

            {/* Action buttons */}
            {sandboxMode === "image" ? (
              <button
                id="btn-produce-design"
                onClick={() => handleCompileDesign()}
                disabled={loading || !userIdeaInput.trim()}
                className="w-full flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-slate-900 border-2 border-slate-900 font-black py-3 px-4 rounded-xl shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer text-xs uppercase tracking-wider disabled:opacity-50"
              >
                <Sparkles className={`w-4 h-4 text-slate-900 ${loading ? 'animate-spin' : ''}`} />
                {loading ? "PAINTING DECAL DECALS..." : "GENERATE DECALS & STICKERS"}
              </button>
            ) : (
              <button
                id="btn-produce-slogans"
                onClick={handleDraftSlogans}
                disabled={drafting || !userIdeaInput.trim()}
                className="w-full flex items-center justify-center gap-2 bg-pink-300 hover:bg-pink-200 text-slate-900 border-2 border-slate-900 font-black py-3 px-4 rounded-xl shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer text-xs uppercase tracking-wider disabled:opacity-50"
              >
                <Type className={`w-4 h-4 text-slate-900 ${drafting ? 'animate-spin' : ''}`} />
                {drafting ? "DRAFTING COMPLIANT WORDS..." : "GENERATE TEXTS & SLOGANS"}
              </button>
            )}
          </div>

          {/* Legal Compliance Indicator stamp */}
          <div className="pt-2 border-t border-dashed border-slate-200 flex items-center justify-between text-[9px] text-slate-400 font-black">
            <span className="flex items-center gap-1 uppercase tracking-tight">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 stroke-[3.5]" />
              Anti-Trademark Scanning active
            </span>
            <span className="uppercase text-slate-300 font-mono">CODE: SCAN_CLEAN_100%</span>
          </div>
        </div>

        {/* Explain work model today */}
        {explanationText && (
          <div id="swipe-planner-explanation" className="bg-slate-900 text-white p-5 rounded-3xl border-3 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] space-y-2">
            <span className="text-[9px] font-mono font-black text-yellow-400 uppercase tracking-widest block">Daily Sandbox Agenda</span>
            <p className="text-sm text-slate-200 leading-relaxed italic font-bold">
              "{explanationText}"
            </p>
          </div>
        )}
      </div>

      {/* Right Swipe panel (3 columns) */}
      <div className="lg:col-span-3 flex flex-col items-center space-y-6">
        
        {/* Render Option B suggestions deck on the right side if active, else show standard Swipe sandbox */}
        {sandboxMode === "text" && draftedSlogans.length > 0 ? (
          <div className="w-full space-y-5 animate-fade-in">
            <div className="bg-slate-900 text-white p-4.5 rounded-3xl border-3 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
              <h4 className="text-yellow-400 font-black text-xs uppercase tracking-widest flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 animate-pulse text-yellow-400" />
                AI Brand Guidelines Compliance Report
              </h4>
              <p className="text-[11px] font-medium leading-relaxed font-mono mt-1 text-slate-350">
                {guidelinesReflection || "Successfully drafted target slogans keeping alignment matching demographics, colors, voice constraints, and zero infringement policies."}
              </p>
              <div className="mt-2.5 pt-2 border-t border-dashed border-white/25 flex flex-wrap gap-2 text-[8px] font-mono uppercase font-black text-slate-400">
                <span className="bg-white/10 text-emerald-400 px-1 rounded">✓ No Trademark Infringement</span>
                <span className="bg-white/10 text-emerald-400 px-1 rounded">✓ Sentiment Safe</span>
                <span className="bg-white/10 text-emerald-400 px-1 rounded">✓ Custom for {activeBrand.name}</span>
              </div>
            </div>

            <div className="text-center">
              <h5 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                Select Slogan to generate artwork directly in Tinder Deck:
              </h5>
            </div>

            <div className="space-y-4 max-w-md mx-auto w-full">
              {draftedSlogans.map((sug, sidx) => (
                <div key={sidx} className="bg-white p-4.5 rounded-2xl border-3 border-slate-900 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] space-y-3 hover:translate-y-[-2px] transition-transform">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[9px] bg-pink-100 text-pink-700 font-black uppercase px-2 py-0.5 rounded-md border border-pink-300 font-mono">
                      Slogan Suggestion #{sidx + 1}
                    </span>
                    <span className="text-[9px] font-mono text-slate-400 font-bold uppercase">
                      Voice: {activeBrand.voice}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="text-slate-900 font-black text-sm uppercase break-words leading-tight bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      "{sug.slogan}"
                    </div>
                    
                    <div className="text-[11px] font-semibold text-slate-500 leading-normal">
                      <strong>Social Pitch:</strong> {sug.oneLiner}
                    </div>

                    <div className="text-[10px] font-mono uppercase font-black text-slate-600 bg-yellow-50 p-1 rounded-md px-2 border border-yellow-200 inline-block">
                      🏷️ Merch Expression: {sug.expression}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-dashed border-slate-200">
                    <button
                      type="button"
                      onClick={() => handleCompileDesign(sug.prompt)}
                      disabled={loading}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-[11px] uppercase py-2 rounded-lg border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] active:translate-y-0.5 active:shadow-none cursor-pointer transition-all"
                    >
                      <Paintbrush className="w-3.5 h-3.5" />
                      Paint Decal Artwork
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(sug.prompt);
                        alert("AI Engineered prompt copied to clipboard! You can paste this directly to custom image generators.");
                      }}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-800 p-2 rounded-lg border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] active:translate-y-0.5 active:shadow-none cursor-pointer transition-all flex items-center justify-center"
                      title="Copy Custom Prompt Text"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="w-full max-w-sm flex flex-col items-center gap-6">
            <h4 className="text-slate-900 font-extrabold text-sm uppercase tracking-wider text-center">
              Tinder Sandbox Swiping Deck
            </h4>

            {activeDeck.length === 0 ? (
              <div className="bg-white p-8 rounded-3xl border-3 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] text-center w-full space-y-4 py-12">
                <div className="w-16 h-16 bg-yellow-400 text-slate-905 border-2 border-slate-900 rounded-full flex items-center justify-center mx-auto shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] animate-bounce select-none">
                  <ShoppingBag className="w-8 h-8 text-slate-900 stroke-[2]" />
                </div>
                <div>
                  <h5 className="font-black text-slate-905 text-sm uppercase tracking-tight text-slate-900">Designs Swept Clean!</h5>
                  <p className="text-slate-500 font-bold text-xs leading-relaxed mt-2.5">
                    {sandboxMode === "text" 
                      ? "Draft custom slogans above, and click Paint Decal Artwork to push custom typography vectors right into your active tinder swiping carousel!"
                      : "Type an idea in the Left Panel and click GENERATE. Created decals automatically stack here as an interactive card deck."
                    }
                  </p>
                </div>
                <p className="text-[10px] font-black font-mono text-slate-400 uppercase tracking-wider pt-2 border-t border-dashed">
                  Tip: Swipe Right to Save, Swipe Left to Skip
                </p>
              </div>
            ) : (
              <div className="w-full flex flex-col items-center gap-6">
                {/* The Swipable Container Stack */}
                <div className="relative w-full h-[400px] flex items-center justify-center">
                  <AnimatePresence>
                    {activeDeck.slice(0, 1).map((design) => (
                      <motion.div
                        id={`swipe-card-${design.id}`}
                        key={design.id}
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        onDrag={(e, info) => setDragOffset(info.offset.x)}
                        onDragEnd={(e, info) => handleDragEnd(e, info, design.id)}
                        style={{ x: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1, rotate: dragOffset * 0.05 }}
                        exit={{
                          x: dragOffset > 0 ? 300 : -300,
                          opacity: 0,
                          scale: 0.8,
                          transition: { duration: 0.2 },
                        }}
                        className="absolute top-0 w-full bg-white rounded-3xl border-3 border-slate-900 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] overflow-hidden cursor-grab active:cursor-grabbing select-none h-full"
                      >
                        {/* Directional Overlay Indicators */}
                        {dragOffset > 25 && (
                          <div className="absolute top-6 left-6 rotate-[-12deg] bg-emerald-500 text-white font-black text-xs uppercase px-3 py-1.5 rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] z-10 animate-pulse">
                            Saves Design
                          </div>
                        )}
                        {dragOffset < -25 && (
                          <div className="absolute top-6 right-6 rotate-[12deg] bg-rose-500 text-white font-black text-xs uppercase px-3 py-1.5 rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] z-10 animate-pulse">
                            Dislikes Vibe
                          </div>
                        )}

                        {/* Image Area */}
                        <div className="h-4/5 w-full bg-slate-900 flex items-center justify-center overflow-hidden border-b-3 border-slate-900 relative">
                          <img
                            src={design.imageUrl}
                            alt="AI design representation"
                            className="w-full h-full object-cover max-w-full pointer-events-none"
                            referrerPolicy="no-referrer"
                          />
                          <span className="absolute bottom-3 left-3 text-[9px] bg-yellow-400 text-slate-900 border-2 border-slate-900 font-mono py-1 px-2.5 rounded-lg font-black shadow-[1.5px_1.5px_0px_0px_rgba(15,23,42,1)] uppercase">
                            Theme: {design.theme}
                          </span>
                        </div>

                        {/* Details Info Footer */}
                        <div className="p-4 bg-white h-1/5 flex flex-col justify-center">
                          <p className="text-slate-800 font-bold text-xs line-clamp-2">
                            <strong>PROMPT:</strong> "{design.prompt}"
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {/* Manual Swipe Action Buttons */}
                <div className="flex items-center gap-6">
                  <button
                    id="btn-dislike-swipe"
                    onClick={() => handleManualSwipe(activeDeck[0].id, "disliked")}
                    className="w-14 h-14 bg-white hover:bg-rose-50 text-rose-500 border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] active:translate-y-0.5 active:shadow-none rounded-full flex items-center justify-center hover:scale-110 transition-all cursor-pointer font-bold"
                    title="Dislike / Swipe Left"
                  >
                    <X className="w-6 h-6 stroke-[3]" />
                  </button>

                  <div className="text-center font-mono text-[10px] font-black uppercase text-slate-700 bg-slate-100 p-2.5 px-4 rounded-xl border-2 border-slate-900 shadow-inner">
                    {activeDeck.length} In Queue
                  </div>

                  <button
                    id="btn-like-swipe"
                    onClick={() => handleManualSwipe(activeDeck[0].id, "liked")}
                    className="w-14 h-14 bg-white hover:bg-emerald-50 text-emerald-600 border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] active:translate-y-0.5 active:shadow-none rounded-full flex items-center justify-center hover:scale-110 transition-all cursor-pointer font-bold"
                    title="Like & Save / Swipe Right"
                  >
                    <Heart className="w-6 h-6 stroke-[3] fill-emerald-500/20" />
                  </button>
                </div>

                {/* Swift Tips */}
                <p className="text-[11px] text-slate-400 text-center font-bold tracking-wide">
                  * Swipe right or click 💚 to save the asset. This populates your e-commerce catalog mockups!
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
