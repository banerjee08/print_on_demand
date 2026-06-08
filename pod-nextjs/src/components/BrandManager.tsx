"use client";
import React, { useState, useRef } from "react";
import { Plus, Check, Briefcase, Trash2, Sliders, BrainCircuit, Upload, FileText, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { Brand } from "@/lib/types";
import { getGoogleAccessToken, isGoogleAuthenticated } from "../lib/googleAuth";
import { exportBrandGuidelinesToDoc } from "../lib/googleWorkspace";

interface BrandManagerProps {
  brands: Brand[];
  activeBrandId: string;
  onSelectBrand: (id: string) => void;
  onAddBrand: (brand: Brand) => void;
  onUpdateBrand: (updated: Brand) => void;
  onDeleteBrand: (id: string) => void;
}

export default function BrandManager({
  brands,
  activeBrandId,
  onSelectBrand,
  onAddBrand,
  onUpdateBrand,
  onDeleteBrand,
}: BrandManagerProps) {
  // Brand creation form
  const [showAddForm, setShowAddForm] = useState(false);
  const [intakeMethod, setIntakeMethod] = useState<'manual' | 'upload'>('manual');
  
  const [newBrandName, setNewBrandName] = useState("");
  const [newBrandAudience, setNewBrandAudience] = useState("");
  const [newBrandVoice, setNewBrandVoice] = useState("Warm & Adventurous");
  const [newBrandKeywords, setNewBrandKeywords] = useState("");
  const [selectedColors, setSelectedColors] = useState<string[]>(["#FFFFFF", "#2B2B2B"]);
  const [colorInput, setColorInput] = useState("");

  const [documentName, setDocumentName] = useState("");
  const [uploadState, setUploadState] = useState<'idle' | 'processing' | 'done'>('idle');
  const [processingLogs, setProcessingLogs] = useState<string[]>([]);
  const logTimerRef = useRef<number | null>(null);

  const activeBrand = brands.find((b) => b.id === activeBrandId);

  // Google Workspace Doc Exporter Local States
  const [exportingDoc, setExportingDoc] = useState(false);
  const [exportedDocId, setExportedDocId] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const handleExportDoc = async () => {
    const token = getGoogleAccessToken();
    if (!token) {
      setExportError("Google Workspace Connection offline! Configure credentials in Sidebar menu first.");
      return;
    }
    setExportingDoc(true);
    setExportError(null);
    setExportedDocId(null);
    try {
      if (activeBrand) {
        const docId = await exportBrandGuidelinesToDoc(activeBrand, token);
        setExportedDocId(docId);
      }
    } catch (err: any) {
      console.error(err);
      setExportError(err.message || "Failed to export brand guidelines to Google Docs.");
    } finally {
      setExportingDoc(false);
    }
  };

  const handleAddColor = () => {
    const hex = colorInput.trim();
    if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
      if (!selectedColors.includes(hex)) {
        setSelectedColors([...selectedColors, hex.toUpperCase()]);
      }
      setColorInput("");
    } else {
      alert("Please provide a valid 6-character hex code starting with # (e.g. #FFC107)");
    }
  };

  const handleCreateBrand = () => {
    if (!newBrandName.trim() || !newBrandAudience.trim()) {
      alert("Please fill out the Brand Name and Target Audience fields.");
      return;
    }

    const brandId = "brand-" + Date.now();
    const cleanColors = selectedColors.length > 0 ? selectedColors : ["#F8FAFC", "#2D2D2D"];

    const nextBrand: Brand = {
      id: brandId,
      name: newBrandName,
      audience: newBrandAudience,
      voice: newBrandVoice,
      customKeywords: newBrandKeywords,
      colorGuidelines: cleanColors,
      imageLimit: 10,
      imagesCreated: 0,
      memory: {
        likedThemes: [],
        dislikedThemes: [],
        designStyleLearnings: [
          `Style guidelines initiated for ${newBrandName}`,
          `Default palette set to: ${cleanColors.join(", ")}`
        ],
      },
      guidelinesDocFile: documentName || undefined,
      guidelinesDocText: documentName ? `Custom parsed parameters of ${documentName}` : undefined,
    };

    onAddBrand(nextBrand);
    
    // Reset fields
    setNewBrandName("");
    setNewBrandAudience("");
    setNewBrandKeywords("");
    setSelectedColors(["#FFFFFF", "#2B2B2B"]);
    setDocumentName("");
    setUploadState('idle');
    setShowAddForm(false);
    
    alert(`Success! "${nextBrand.name}" has been registered in separate isolation. Future swiping sessions are mapped separately.`);
  };

  // Simulate parsing engine steps
  const triggerSimulatedPDFExtract = (fileName: string, sampleData: {
    name: string;
    audience: string;
    voice: string;
    keywords: string;
    colors: string[];
  }) => {
    setDocumentName(fileName);
    setUploadState('processing');
    setProcessingLogs(["[1/5] Opening PDF stream: " + fileName]);

    const logs = [
      "[2/5] Allocating memory segments & indexing metadata...",
      "[3/5] Client-side canvas blocks OCR parsing...",
      "[4/5] Extracting design rules, layout constraints, voice tone guidelines...",
      "[5/5] Success! Auto-filling brand formulation fields..."
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < logs.length) {
        setProcessingLogs((prev) => [...prev, logs[currentStep]]);
        currentStep++;
      } else {
        clearInterval(interval);
        setUploadState('done');
        // Auto fill fields
        setNewBrandName(sampleData.name);
        setNewBrandAudience(sampleData.audience);
        setNewBrandVoice(sampleData.voice);
        setNewBrandKeywords(sampleData.keywords);
        setSelectedColors(sampleData.colors);
      }
    }, 400);
  };

  const handleFileUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileExt = file.name.split('.').pop()?.toLowerCase();
    
    // Create random or sample values based on file
    const colorsList = ["#3C4B6E", "#8CA296", "#EEDAB2", "#2B2B2B"];
    const keywords = "clean flat design vectors, crisp contours, sustainable outdoorsy elements, cozy fonts";
    const voice = "Retro, Peaceful, Groovy";
    const audience = "Eco-conscious sustainable shoppers & explorers";
    const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;

    triggerSimulatedPDFExtract(file.name, {
      name: baseName,
      audience,
      voice,
      keywords,
      colors: colorsList
    });
  };

  const handleLoadSampleGuide = (sampleType: 'apex' | 'coastal') => {
    if (sampleType === 'apex') {
      triggerSimulatedPDFExtract("apex_brand_guidelines_2026.pdf", {
        name: "Apex Outdoors",
        audience: "Rugged outdoorsy dads, hiking guides & camper fathers",
        voice: "Warm & Adventurous",
        keywords: "distressed vintage vector badge, retro typography overlays, clean borders, woods mountains pine cones decals",
        colors: ["#2D2D2D", "#C19A6B", "#3C3B6E", "#FFFFFF"]
      });
    } else {
      triggerSimulatedPDFExtract("coastal_grooves_brandbook.pptx", {
        name: "Coastal Grooves",
        audience: "Relaxed pastel loving millennials, beach cottage residents",
        voice: "Retro, Peaceful, Groovy",
        keywords: "minimalist pastel wave line art, retro wavy bubble lettering, soft ocean seashell graphics, clean white decal border",
        colors: ["#F9F6F0", "#D0E1D4", "#85A3B2", "#EEDAB2"]
      });
    }
  };

  return (
    <div id="brand-manager" className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      {/* Sidebar: Brand selector list */}
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-3xl border-3 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1">
              <Briefcase className="w-5 h-5 text-yellow-500" /> Brands Register
            </h3>
            <button
              id="btn-show-add-brand-form"
              onClick={() => {
                setShowAddForm(!showAddForm);
                setIntakeMethod('manual');
              }}
              className="p-1 px-3 text-[10px] font-black uppercase text-slate-900 bg-yellow-405 bg-yellow-400 rounded-lg border-2 border-slate-950 shadow-[1.5px_1.5px_0px_0px_rgba(15,23,42,1)] active:translate-y-0.5 active:shadow-none cursor-pointer flex items-center gap-1 transition-all"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" /> Add Brand
            </button>
          </div>

          <p className="text-xs text-slate-500 font-bold leading-relaxed">
            Separate target demographics so future designs align strictly with specific niche aesthetics. Select your active context:
          </p>

          <div id="brands-selector-list" className="space-y-3 pt-1">
            {brands.map((b) => {
              const isActive = b.id === activeBrandId;
              return (
                <div
                  id={`brand-item-card-${b.id}`}
                  key={b.id}
                  onClick={() => onSelectBrand(b.id)}
                  className={`p-4 rounded-2xl border-2 text-left cursor-pointer transition-all flex justify-between items-center ${
                    isActive
                      ? "bg-slate-900 text-white border-slate-900 shadow-[3.5px_3.5px_0px_0px_rgba(15,23,42,1)] scale-[1.01]"
                      : "bg-white hover:bg-slate-50 border-slate-900 text-slate-850 shadow-[1.5px_1.5px_0px_0px_rgba(15,23,42,1)] hover:shadow-[3px_3px_0px_0px_rgba(15,23,42,1)]"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="font-black text-sm uppercase tracking-tight flex items-center gap-2">
                      {b.name}
                      {isActive && <Check className="w-4 h-4 text-yellow-400 shrink-0 stroke-[3]" />}
                    </div>
                    <div className={`text-[11px] ${isActive ? "text-slate-300" : "text-slate-500"} font-bold line-clamp-1`}>
                      Target: {b.audience}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex -space-x-1">
                      {b.colorGuidelines.slice(0, 3).map((col, idx) => (
                        <div
                          key={idx}
                          className="w-4 h-4 rounded-full border border-slate-900 shadow-sm"
                          style={{ backgroundColor: col }}
                        />
                      ))}
                    </div>
                    {brands.length > 1 && (
                      <button
                        id={`btn-delete-brand-${b.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Are you sure you want to delete brand: ${b.name}?`)) {
                            onDeleteBrand(b.id);
                          }
                        }}
                        className={`p-1.5 rounded-lg border border-transparent hover:border-red-500 hover:bg-red-500/10 hover:text-red-500 transition-all font-bold ${
                          isActive ? "text-slate-400 hover:text-red-400" : "text-slate-400"
                        }`}
                      >
                        <Trash2 className="w-4 h-4 stroke-[2]" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Add Brand Form Collapse */}
        {showAddForm && (
          <div id="add-brand-form" className="bg-white p-6 rounded-3xl border-3 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] space-y-4">
            <h4 className="font-black text-slate-900 uppercase text-xs tracking-wider pb-1 border-b-2 border-slate-200">
              Create New Brand Guide
            </h4>

            {/* Intake selector tabs */}
            <div className="flex gap-2 border-2 border-slate-900 rounded-xl overflow-hidden p-1 bg-slate-100">
              <button
                type="button"
                onClick={() => setIntakeMethod('manual')}
                className={`flex-1 font-black text-[10px] py-2 px-1 rounded-lg uppercase tracking-tight transition-all cursor-pointer ${
                  intakeMethod === 'manual' 
                    ? "bg-slate-900 text-white" 
                    : "text-slate-700 hover:bg-slate-200"
                }`}
              >
                Write Manually
              </button>
              <button
                type="button"
                onClick={() => setIntakeMethod('upload')}
                className={`flex-1 font-black text-[10px] py-2 px-1 rounded-lg uppercase tracking-tight transition-all cursor-pointer ${
                  intakeMethod === 'upload' 
                    ? "bg-slate-900 text-white" 
                    : "text-slate-700 hover:bg-slate-200"
                }`}
              >
                Upload Brand Document
              </button>
            </div>

            {/* Intake Render panels */}
            {intakeMethod === 'upload' ? (
              <div className="space-y-4">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block font-mono">
                  Guidelines Intake Engine:
                </span>

                {/* File picker drop area */}
                <div className="border-3 border-dashed border-slate-900 rounded-2xl p-5 bg-slate-50 flex flex-col items-center justify-center text-center space-y-2.5 relative transition-all hover:bg-slate-100 shadow-inner">
                  <Upload className="w-8 h-8 text-slate-700 animate-bounce" />
                  <div className="text-slate-900 font-extrabold text-[11px] uppercase tracking-wide">
                    Drag & Drop guidelines PDF / TXT
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold max-w-[200px] leading-relaxed mx-auto">
                    Max size 8MB. Automatically populates layout specs and hex color palettes!
                  </p>
                  <input
                    type="file"
                    accept=".pdf,.txt,.md,.docx,.pptx"
                    onChange={handleFileUploadChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                </div>

                {/* Interactive preconfigured sample Guideline PDF upload block */}
                <div className="space-y-2">
                  <span className="text-[9px] font-black font-mono text-slate-400 uppercase tracking-widest block text-center">
                    -- Or load a pre-compiled Brand Book --
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleLoadSampleGuide('apex')}
                      className="border-2 border-slate-900 bg-white hover:bg-slate-50 p-2 rounded-xl text-[10px] font-black text-slate-900 font-mono shadow-[1.5px_1.5px_0px_0px_rgba(15,23,42,1)] active:translate-y-0.5 active:shadow-none cursor-pointer uppercase flex items-center justify-center gap-1"
                    >
                      <FileText className="w-3.5 h-3.5 text-amber-500 shrink-0" /> Apex Book (rugged)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLoadSampleGuide('coastal')}
                      className="border-2 border-slate-900 bg-white hover:bg-slate-50 p-2 rounded-xl text-[10px] font-black text-slate-900 font-mono shadow-[1.5px_1.5px_0px_0px_rgba(15,23,42,1)] active:translate-y-0.5 active:shadow-none cursor-pointer uppercase flex items-center justify-center gap-1"
                    >
                      <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0" /> Coastal Book (pastel)
                    </button>
                  </div>
                </div>

                {/* Processing Logs console visual */}
                {uploadState === 'processing' && (
                  <div className="bg-slate-900 p-3 rounded-xl border-2 border-slate-800 text-[10px] font-mono text-emerald-400 space-y-1 max-h-36 overflow-y-auto shadow-inner select-none leading-relaxed">
                    <div className="flex items-center gap-1.5 font-bold mb-1 border-b border-slate-800 pb-1">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span>OCR EXTRACTION TERM:</span>
                    </div>
                    {processingLogs.map((log, idx) => (
                      <p key={idx}>{log}</p>
                    ))}
                  </div>
                )}

                {uploadState === 'done' && (
                  <div className="p-3 bg-emerald-50 rounded-xl border-2 border-slate-900 flex items-start gap-2 text-[11px] font-bold text-slate-900 shadow-sm leading-normal">
                    <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0 stroke-[3]" />
                    <div>
                      <span>Extracted: <strong className="font-black text-slate-950">"{documentName}"</strong> Rules loaded flawlessly! Review manual details below and click Create.</span>
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            {/* Standard manual fields or review panel */}
            <div className="space-y-3.5 pt-1.5">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Brand Name *</label>
                <input
                  id="input-brand-name"
                  type="text"
                  value={newBrandName}
                  onChange={(e) => setNewBrandName(e.target.value)}
                  placeholder="e.g. Cozy Woods Co."
                  className="w-full text-xs font-semibold border-2 border-slate-900 focus:outline-none p-2.5 rounded-xl bg-white focus:ring-1 focus:ring-yellow-400 shadow-[1.5px_1.5px_0px_0px_rgba(15,23,42,1)]"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Target Audience *</label>
                <input
                  id="input-brand-audience"
                  type="text"
                  value={newBrandAudience}
                  onChange={(e) => setNewBrandAudience(e.target.value)}
                  placeholder="e.g. Outdoorsy dads who hike"
                  className="w-full text-xs font-semibold border-2 border-slate-900 focus:outline-none p-2.5 rounded-xl bg-white focus:ring-1 focus:ring-yellow-400 shadow-[1.5px_1.5px_0px_0px_rgba(15,23,42,1)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Voice Tone</label>
                  <select
                    id="select-brand-voice"
                    value={newBrandVoice}
                    onChange={(e) => setNewBrandVoice(e.target.value)}
                    className="w-full text-xs font-semibold border-2 border-slate-900 focus:outline-none p-2 rounded-xl bg-white shadow-[1.5px_1.5px_0px_0px_rgba(15,23,42,1)] cursor-pointer"
                  >
                    <option value="Warm & Adventurous">Warm & Adventurous</option>
                    <option value="Sassy & Humorous">Sassy & Humorous</option>
                    <option value="Bold, Techy & Heavy">Bold, Techy & Heavy</option>
                    <option value="Retro, Peaceful, Groovy">Retro, Peaceful, Groovy</option>
                    <option value="Elegant & Minimalist">Elegant & Minimalist</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Custom Limits</label>
                  <div className="w-full text-xs font-mono font-bold bg-slate-100 border-2 border-slate-300 p-2 rounded-xl text-center text-slate-700">
                    10 free designs
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Style Guidelines (Keywords)</label>
                <textarea
                  id="input-brand-keywords"
                  rows={2}
                  value={newBrandKeywords}
                  onChange={(e) => setNewBrandKeywords(e.target.value)}
                  placeholder="e.g. distressed vector sticker, white border, sunset palettes"
                  className="w-full text-xs font-semibold border-2 border-slate-900 focus:outline-none p-2.5 rounded-xl bg-white focus:ring-1 focus:ring-yellow-400 shadow-[1.5px_1.5px_0px_0px_rgba(15,23,42,1)] resize-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Brand Colors</label>
                <div className="flex gap-2 mb-2">
                  <input
                    id="input-brand-color-hex"
                    type="text"
                    value={colorInput}
                    onChange={(e) => setColorInput(e.target.value)}
                    placeholder="#FF0055"
                    className="w-full text-xs font-bold border-2 border-slate-900 focus:outline-none p-2 rounded-xl bg-white focus:ring-1 focus:ring-yellow-400 font-mono uppercase shadow-[1.5px_1.5px_0px_0px_rgba(15,23,42,1)]"
                  />
                  <button
                    id="btn-add-brand-color"
                    onClick={handleAddColor}
                    className="bg-yellow-405 bg-yellow-400 hover:bg-yellow-300 border-2 border-slate-900 text-slate-900 px-4 py-2 text-xs font-black rounded-xl shadow-[1.5px_1.5px_0px_0px_rgba(15,23,42,1)] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer font-mono font-black border-slate-900 border-3 text-slate-950"
                  >
                    ADD
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedColors.map((col, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 text-xs bg-white px-2.5 py-1 rounded-xl border-2 border-slate-900 font-mono font-bold shadow-[1px_1px_0px_0px_rgba(15,23,42,1)]"
                    >
                      <span className="w-2.5 h-2.5 rounded-md border border-slate-900" style={{ backgroundColor: col }}></span>
                      {col}
                      <button
                        onClick={() => setSelectedColors(selectedColors.filter((_, idx) => idx !== i))}
                        className="text-red-500 hover:text-red-700 font-black ml-1 cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  id="btn-submit-brand"
                  onClick={handleCreateBrand}
                  className="flex-1 bg-yellow-400 hover:bg-yellow-300 text-slate-900 border-slate-900 border-3 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] active:translate-y-0.5 active:shadow-none font-black py-2.5 px-4 rounded-xl transition-all cursor-pointer text-xs uppercase tracking-wider"
                >
                  Create
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 bg-white hover:bg-slate-50 text-slate-705 border-slate-950 border-3 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] active:translate-y-0.5 active:shadow-none font-black py-2.5 px-4 rounded-xl transition-all cursor-pointer text-xs uppercase tracking-wider text-slate-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Focus: Display brand profile detailed rules */}
      {activeBrand ? (
        <div id="brand-detail-panel" className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-3xl border-3 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] space-y-6">
            <div className="flex flex-wrap justify-between items-start gap-4 pb-4 border-b-2 border-slate-900">
              <div>
                <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight">{activeBrand.name} Profile Settings</h4>
                <p className="text-xs text-slate-500 font-bold mt-1 leading-normal">
                  These guidelines align our image generation pipeline to enforce layout standards.
                </p>
                {activeBrand.guidelinesDocFile && (
                  <div className="mt-2 text-left">
                    <span className="inline-flex items-center gap-1.5 text-[10px] bg-slate-900 text-yellow-400 font-mono font-black px-2 py-1 rounded-md border border-slate-950">
                      📂 Parsed Guidelines Document: "{activeBrand.guidelinesDocFile}"
                    </span>
                  </div>
                )}

                {/* Google Docs Guideline Exporter Action Row */}
                <div className="mt-3.5 bg-slate-50 border-2 border-slate-200 border-dashed rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-inner">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Workspace Sync:</span>
                    {isGoogleAuthenticated() ? (
                      <span className="text-[9px] bg-emerald-100 text-emerald-850 px-2 py-0.5 rounded font-black uppercase border border-emerald-300">Connected</span>
                    ) : (
                      <span className="text-[9px] bg-slate-100 text-slate-400 px-2 py-0.5 rounded font-black uppercase border border-slate-200">Offline</span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {exportedDocId && (
                      <a
                        href={`https://docs.google.com/document/d/${exportedDocId}/edit`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[9px] bg-blue-50 hover:bg-blue-100 text-blue-700 font-black px-2.5 py-1.5 rounded-xl border border-blue-300 uppercase transition-all flex items-center gap-1 cursor-pointer"
                      >
                        📂 Open Google Doc
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={handleExportDoc}
                      disabled={exportingDoc || !isGoogleAuthenticated()}
                      className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-xl border-2 tracking-tight transition-all cursor-pointer ${
                        isGoogleAuthenticated()
                          ? "bg-slate-900 text-yellow-400 border-slate-900 hover:bg-slate-800 animate-pulse"
                          : "bg-slate-150 text-slate-400 border-slate-200 cursor-not-allowed"
                      }`}
                    >
                      {exportingDoc ? "Writing..." : "Export Guidelines to Doc"}
                    </button>
                  </div>
                </div>
                {exportError && (
                  <p className="text-[10px] text-red-500 font-black mt-1 font-mono uppercase tracking-tight">{exportError}</p>
                )}
              </div>
              <div className="text-right shrink-0">
                <span className="text-[9px] font-black font-mono text-slate-400 uppercase tracking-wider block">Daily Limits Left</span>
                <span className="inline-flex items-center gap-1.5 text-xs font-black font-mono text-slate-900 bg-yellow-400 p-2 px-3 rounded-2xl border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] mt-1">
                  {activeBrand.imageLimit - activeBrand.imagesCreated} / {activeBrand.imageLimit} Generations Free
                </span>
              </div>
            </div>

            {/* Editable Fields list */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 block mb-1 font-mono uppercase tracking-wider">Target Demographic:</label>
                  <p className="text-slate-950 text-sm font-black uppercase">{activeBrand.audience || "Unset"}</p>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 block mb-1 font-mono uppercase tracking-wider">Voice Guidelines:</label>
                  <p className="text-slate-950 text-sm font-black uppercase text-slate-900">{activeBrand.voice}</p>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 block mb-1.5 font-mono uppercase tracking-wider font-bold">Style Presets:</label>
                  <p className="bg-slate-50 border-2 border-slate-900 p-3 rounded-2xl text-slate-800 text-xs font-mono italic leading-relaxed font-bold">
                    "{activeBrand.customKeywords || "None defined yet. Add keywords to refine image layouts."}"
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 block mb-2.5 font-mono uppercase tracking-wider">Default Decal Palette:</label>
                  <div className="flex flex-wrap gap-2">
                    {activeBrand.colorGuidelines.map((color, idx) => (
                      <span key={idx} className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border-2 border-slate-900 font-mono text-xs shadow-[1.5px_1.5px_0px_0px_rgba(15,23,42,1)] font-bold">
                        <span className="w-3.5 h-3.5 rounded-md border border-slate-900 shadow-sm" style={{ backgroundColor: color }}></span>
                        {color}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Smart Memory Panel: Isolating each brand's memory */}
            <div id="brand-memory-block" className="bg-slate-900 text-white rounded-3xl border-3 border-slate-900 p-5 space-y-4 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
              <div className="flex justify-between items-center pb-3 border-b-2 border-slate-800">
                <div className="flex items-center gap-2">
                  <BrainCircuit className="text-yellow-405 text-yellow-400 w-5 h-5 stroke-[2.5]" />
                  <span className="font-extrabold text-white text-xs uppercase tracking-wider">Deep Brand Guidelines Memory</span>
                </div>
                <span className="text-[8px] bg-yellow-400 text-slate-900 px-2 py-1 rounded font-black font-mono uppercase tracking-wider">
                  Adaptive AI Memory
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 bg-slate-850 p-4 rounded-2xl border border-slate-800">
                  <span className="text-[10px] font-black text-emerald-405 text-emerald-400 block flex items-center gap-1 uppercase tracking-wider">
                    🟢 Preferred Creative Themes
                  </span>
                  {activeBrand.memory && activeBrand.memory.likedThemes && activeBrand.memory.likedThemes.length > 0 ? (
                    <ul className="text-xs text-slate-200 space-y-1.5 list-disc pl-4 font-bold">
                      {activeBrand.memory.likedThemes.map((theme, i) => (
                        <li key={i}>{theme}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-400 italic font-medium">No saved themes. Approved swipes populate this block.</p>
                  )}
                </div>

                <div className="space-y-2 bg-slate-850 p-4 rounded-2xl border border-slate-800">
                  <span className="text-[10px] font-black text-rose-405 text-rose-400 block flex items-center gap-1 uppercase tracking-wider">
                    🔴 Blacklisted Concepts
                  </span>
                  {activeBrand.memory && activeBrand.memory.dislikedThemes && activeBrand.memory.dislikedThemes.length > 0 ? (
                    <ul className="text-xs text-slate-200 space-y-1.5 list-disc pl-4 font-bold">
                      {activeBrand.memory.dislikedThemes.map((theme, i) => (
                        <li key={i}>{theme}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-400 italic font-medium">No avoided concepts registered yet.</p>
                  )}
                </div>
              </div>

              {/* Adaptive Stylistic Learnings from Swipe Sandbox */}
              {activeBrand.memory && activeBrand.memory.designStyleLearnings && activeBrand.memory.designStyleLearnings.length > 0 && (
                <div className="pt-3 border-t border-slate-850">
                  <span className="text-[10px] font-black text-slate-350 block uppercase tracking-wider mb-2">Consolidated Layout Learnings:</span>
                  <div className="space-y-1.5 text-xs text-slate-350 pl-1">
                    {activeBrand.memory.designStyleLearnings.map((learning, idx) => (
                      <div key={idx} className="flex gap-2 items-start mt-1 bg-slate-850/50 p-2 rounded-xl border border-slate-800">
                        <span className="font-mono text-yellow-400 font-extrabold shrink-0">•</span>
                        <p className="leading-relaxed font-sans font-bold text-slate-350 text-xs">{learning}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="lg:col-span-2 text-center py-16 bg-white border-2 border-slate-900 rounded-3xl shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] animate-pulse">
          <p className="text-slate-500 font-mono font-bold uppercase text-xs">Please select or build a brand profile to continue</p>
        </div>
      )}
    </div>
  );
}
