import React, { useState, useEffect } from "react";
import { TrendingUp, RefreshCw, Calendar, Sparkles, User, Tag, HelpCircle, ArrowRight, Globe, CheckCircle2 } from "lucide-react";
import { TrendIdea, Brand } from "../types";

interface TrendsDashboardProps {
  onSelectTrend: (trend: TrendIdea) => void;
  activeBrand: Brand;
}

const AVAILABLE_LOCALES = [
  { code: "US", label: "United States", flag: "🇺🇸" },
  { code: "UK", label: "United Kingdom", flag: "🇬🇧" },
  { code: "CA", label: "Canada", flag: "🇨🇦" },
  { code: "AU", label: "Australia", flag: "🇦🇺" },
  { code: "DE", label: "Germany / EU", flag: "🇩🇪" },
  { code: "FR", label: "France / EU", flag: "🇫🇷" }
];

export default function TrendsDashboard({ onSelectTrend, activeBrand }: TrendsDashboardProps) {
  const [trends, setTrends] = useState<TrendIdea[]>([]);
  const [explanation, setExplanation] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLocales, setSelectedLocales] = useState<string[]>(["US", "UK", "CA"]);

  const fetchTrends = async (overrideLocales?: string[]) => {
    setLoading(true);
    setError(null);
    try {
      const activeLocs = overrideLocales || selectedLocales;
      const localesParam = activeLocs.join(", ");
      const res = await fetch(`/api/trends?locales=${encodeURIComponent(localesParam)}`);
      const data = await res.json();
      if (res.ok) {
        setTrends(data.trends || []);
        setExplanation(data.explanation || "");
      } else {
        throw new Error(data.error || "Failed to load trend analysis.");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong fetching market trends.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrends();
  }, []);

  const handleToggleLocale = (code: string) => {
    let nextLocs = [...selectedLocales];
    if (nextLocs.includes(code)) {
      if (nextLocs.length === 1) {
        alert("At least one active target locale is required to crawl trends.");
        return;
      }
      nextLocs = nextLocs.filter((l) => l !== code);
    } else {
      nextLocs.push(code);
    }
    setSelectedLocales(nextLocs);
    fetchTrends(nextLocs);
  };

  return (
    <div id="trends-dashboard-container" className="space-y-8">
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-900 text-white p-6 rounded-3xl border-3 border-slate-900 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)]">
        <div>
          <div className="flex items-center gap-2 text-yellow-400 font-mono text-xs uppercase tracking-wider mb-2 font-black">
            <Sparkles className="w-4 h-4 text-yellow-400 animate-spin" />
            Active Niche Scanner
          </div>
          <h2 className="text-2xl font-black tracking-tight uppercase">Upcoming POD Trends & Market Opportunities</h2>
          <p className="text-slate-400 text-xs mt-1">
            Analyzing seasonal velocity, social feeds, and keywords for <span className="text-yellow-400 font-extrabold underline underline-offset-4 decoration-yellow-400">{activeBrand?.name}</span>
          </p>
        </div>
        <button
          id="btn-refresh-trends"
          onClick={() => fetchTrends()}
          disabled={loading}
          className="flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-black py-2.5 px-5 rounded-2xl border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] active:translate-y-0.5 active:shadow-none transition-all disabled:opacity-50 text-xs uppercase tracking-wide cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 text-slate-900 ${loading ? 'animate-spin' : ''}`} />
          Re-Analyze Locales
        </button>
      </div>

      {/* Locale Configuration Manager */}
      <div id="locale-config-panel" className="bg-white p-6 rounded-3xl border-3 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] space-y-4">
        <div className="flex items-center gap-2.5 pb-2.5 border-b-2 border-slate-100">
          <span className="p-1 px-2.5 bg-sky-100 text-sky-700 font-mono font-black text-[10px] rounded border-2 border-sky-600 block uppercase">
            Configuration
          </span>
          <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-widest flex items-center gap-1">
            Target Geographical Locales & Currency Alignment
          </h4>
        </div>
        
        <p className="text-xs text-slate-500 font-bold leading-normal">
          Toggle target regions. Our crawler customizes seasonal opportunities, legal holiday calendars, pricing norms, and cultural slangs to match these selections. Toggling a locale instantly performs an AI Crawl:
        </p>

        <div className="flex flex-wrap gap-3 pt-1">
          {AVAILABLE_LOCALES.map((loc) => {
            const isActive = selectedLocales.includes(loc.code);
            return (
              <button
                key={loc.code}
                onClick={() => handleToggleLocale(loc.code)}
                className={`flex items-center gap-2 p-2.5 px-4 rounded-xl border-2 font-black text-xs uppercase tracking-tight transition-all cursor-pointer ${
                  isActive 
                    ? "bg-slate-900 text-white border-slate-900 shadow-[2px_2px_0px_0px_rgba(250,204,21,1)]" 
                    : "bg-white text-slate-700 border-slate-250 hover:border-slate-900 shadow-sm"
                }`}
              >
                <span className="text-base select-none">{loc.flag}</span>
                <span>{loc.label}</span>
                {isActive && <CheckCircle2 className="w-4 h-4 text-yellow-405 text-yellow-400 stroke-[3.5]" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Daily Planner Callout / "What I'm work on today" Section */}
      {explanation && (
        <div id="daily-agenda-card" className="bg-yellow-50 p-6 rounded-3xl border-3 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <Calendar className="w-24 h-24 text-slate-900" />
          </div>
          <div className="flex items-start gap-4">
            <div className="bg-yellow-400 text-slate-900 p-3 rounded-2xl shrink-0 flex items-center justify-center border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <div className="text-slate-900 font-black font-mono text-xs uppercase tracking-widest">
                Daily Design Agenda Planner (Locales: {selectedLocales.join(", ")})
              </div>
              <h3 className="text-base font-black text-slate-900 mt-1">What we are working on today:</h3>
              <p className="text-slate-800 text-xs leading-relaxed mt-2 font-black italic bg-white/65 p-3 rounded-xl border-2 border-dashed border-slate-300">
                "{explanation}"
              </p>
              <div className="mt-3 flex items-center gap-2 text-xs text-slate-600 font-bold">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Generating tailored designs optimized for local markets in {selectedLocales.join(" & ")}.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div id="trends-error-alert" className="p-4 bg-rose-50 text-rose-950 rounded-2xl border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)]">
          <p className="text-sm font-black">{error}</p>
        </div>
      )}

      {/* Grid of Trending Niches */}
      <div>
        <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-5 flex items-center gap-2">
          <TrendingUp className="text-yellow-500 w-5 h-5 stroke-[2.5]" />
          Seasonal Niche Opportunities for {selectedLocales.join("/")}
        </h4>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((idx) => (
              <div key={idx} className="bg-white p-6 rounded-3xl border-2 border-slate-300 shadow-inner animate-pulse space-y-4">
                <div className="h-6 bg-slate-200 rounded w-2/3"></div>
                <div className="h-4 bg-slate-100 rounded w-1/2"></div>
                <div className="space-y-4 pt-2">
                  <div className="h-12 bg-slate-105 rounded w-full"></div>
                  <div className="h-4 bg-slate-100 rounded w-5/6"></div>
                </div>
                <div className="h-10 bg-slate-200 rounded pt-4"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {trends.map((item) => (
              <div
                id={`trend-card-${item.id}`}
                key={item.id}
                className="bg-white rounded-3xl border-3 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] hover:shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] transition-all flex flex-col justify-between overflow-hidden group"
              >
                {/* Visual Category Header Accent */}
                <div className="bg-yellow-400 border-b-3 border-slate-900 p-4 flex justify-between items-center text-slate-900">
                  <span className="font-mono text-[10px] bg-slate-900 text-white px-2.5 py-1 rounded-lg font-black uppercase tracking-wider">
                    {item.category}
                  </span>
                  <span className="font-mono text-xs text-slate-905 font-black tracking-tight text-slate-900">
                    🔥 HIGH VELOCITY
                  </span>
                </div>

                <div className="p-5 flex-1 space-y-4">
                  <div>
                    <h5 className="font-black text-lg text-slate-900 uppercase tracking-tight group-hover:text-amber-500 transition-colors">
                      {item.title}
                    </h5>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold mt-2">
                      <User className="w-4 h-4 text-slate-400" />
                      <span>Audience: <strong className="text-slate-800">{item.targetAudience}</strong></span>
                    </div>
                  </div>

                  {/* Hot reasons */}
                  <div className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-900 space-y-3.5 shadow-inner">
                    <p className="text-xs text-slate-700 leading-relaxed font-semibold">
                      <strong className="text-slate-900 block font-black uppercase tracking-tight text-[10px] mb-1">Why it sells in {selectedLocales.join("/")}:</strong>
                      {item.hotSellReason}
                    </p>
                    <p className="text-xs text-slate-600 leading-relaxed italic border-t-2 border-dotted border-slate-200 pt-2 font-bold text-slate-700">
                      <strong className="text-slate-800 not-italic block font-black uppercase tracking-tight text-[10px] mb-1">Selling Point:</strong>
                      "{item.sellingPoint}"
                    </p>
                  </div>

                  {/* Demographic core values */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-black text-slate-400 block font-mono uppercase">Target Core Values:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {(item.coreValues || ["Family values", "Humor Vibe", "Durability"]).map((val, idx) => (
                        <span key={idx} className="text-[9px] bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-black uppercase tracking-wider border-2 border-slate-300 shadow-sm font-mono">
                          ✦ {val}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Suggested Trend Colors swatches */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-black text-slate-400 block font-mono uppercase">Trend Palette:</span>
                    <div className="flex items-center gap-2">
                      {item.colorPalette.map((col, idx) => (
                        <div key={idx} className="relative group/color flex items-center justify-center">
                          <div
                            className="w-7 h-7 rounded-lg border-2 border-slate-900 shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] hover:scale-110 transition-transform cursor-pointer"
                            style={{ backgroundColor: col }}
                            title={col}
                          />
                          <span className="absolute bottom-full mb-1.5 text-[9px] bg-slate-900 text-white font-black py-0.5 px-1.5 rounded opacity-0 group-hover/color:opacity-100 font-mono transition-all z-10 border border-slate-705">
                            {col}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Visual Color Mix calculator ratio */}
                  <div className="bg-slate-50 border-2 border-slate-900 rounded-2xl p-3.5 space-y-2.5 shadow-inner">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-mono font-black uppercase text-slate-500">
                        Colorway Harmony Mix:
                      </span>
                      <span className="text-[8px] bg-emerald-500 text-white font-mono font-black uppercase px-2 py-0.5 rounded">
                        Optimal Blend
                      </span>
                    </div>

                    {/* Segmented ratio bar */}
                    <div className="h-4.5 border-2 border-slate-900 rounded-full overflow-hidden flex shadow-[1px_1px_0px_0px_rgba(15,23,42,1)]">
                      <div className="h-full bg-yellow-400 border-r-2 border-slate-900 flex items-center justify-center text-[8px] font-black text-slate-950 font-mono w-[60%]" title="Trend Dominance">
                        60% Trend
                      </div>
                      <div className="h-full bg-slate-900 flex items-center justify-center text-[7px] font-black text-white font-mono w-[40%]" title="Brand Anchored Swatches">
                        40% Brand
                      </div>
                    </div>

                    {/* Side by side comparison indicator swatches */}
                    <div className="grid grid-cols-2 gap-2 text-[9px] font-bold border-t border-dashed border-slate-200 pt-2 text-slate-500">
                      <div className="space-y-1">
                        <span className="text-[8px] font-mono block uppercase text-slate-450">Trend Tones:</span>
                        <div className="flex gap-1">
                          {item.colorPalette.slice(0, 3).map((c, i) => (
                            <span key={i} className="inline-block w-4 h-4 rounded border border-slate-900 shadow-sm" style={{ backgroundColor: c }} />
                          ))}
                        </div>
                      </div>
                      <div className="space-y-1 border-l border-dashed border-slate-200 pl-2">
                        <span className="text-[8px] font-mono block uppercase text-slate-450">Active Brand Swatches:</span>
                        <div className="flex gap-1 font-mono">
                          {activeBrand?.colorGuidelines?.slice(0, 3).map((c, i) => (
                            <span key={i} className="inline-block w-4 h-4 rounded border border-slate-900 shadow-sm" style={{ backgroundColor: c }} />
                          )) || "None set"}
                        </div>
                      </div>
                    </div>

                    <p className="text-[11px] leading-relaxed text-slate-650 mt-1 pb-1 font-bold italic line-clamp-3 text-slate-600">
                      "{item.colorMixSuggestion || 'Blend 60% of the trend theme with 40% of our default branding base coordinates to reinforce recognizability.'}"
                    </p>
                  </div>

                  {/* Tags list */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {item.tags.map((tag, idx) => (
                      <span key={idx} className="flex items-center gap-1 text-[10px] bg-white text-slate-700 px-2.5 py-0.5 rounded-full font-bold border-2 border-slate-900 shadow-[1px_1px_0px_0px_rgba(15,23,42,1)]">
                        <Tag className="w-3 h-3 text-slate-400 stroke-[2.5]" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Card Button */}
                <div className="p-4 bg-slate-50 border-t-2 border-slate-900">
                  <button
                    id={`btn-use-trend-${item.id}`}
                    onClick={() => onSelectTrend(item)}
                    className="w-full flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-black py-2.5 rounded-2xl border-2 border-slate-900 shadow-[2.5px_2.5px_0px_0px_rgba(15,23,42,1)] active:translate-y-0.5 active:shadow-none transition-all text-xs uppercase tracking-wider cursor-pointer"
                  >
                    Load into Designer
                    <ArrowRight className="w-4 h-4 text-slate-900 stroke-[2.5]" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Guide Card */}
      <div className="p-6 bg-white rounded-3xl border-3 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex gap-4">
          <div className="p-3 bg-yellow-400 text-slate-900 rounded-2xl border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
            <HelpCircle className="w-6 h-6 text-slate-900 animate-pulse" />
          </div>
          <div>
            <h6 className="font-black text-slate-900 uppercase text-sm tracking-tight">How custom locales dictate sales</h6>
            <p className="text-slate-600 text-xs font-bold leading-relaxed mt-1">
              Printful & Printify merchants thrive by pre-generating collections 45-60 days before the holiday starts. Load any trend to automatically pre-populate prompt suggestions and sandbox assets!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
