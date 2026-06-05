import React, { useState } from "react";
import { CreditCard, Check, Shield, Star, Wallet, Lock, HelpCircle, RefreshCw, Sparkles, KeyRound } from "lucide-react";

interface BillingModalProps {
  currentTier: 'free' | 'paid';
  onActivatePaidTier: (creditsAdded: number) => void;
  creditsRemaining: number;
}

export default function BillingModal({
  currentTier,
  onActivatePaidTier,
  creditsRemaining,
}: BillingModalProps) {
  // Billing fields
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [purchaseAmount, setPurchaseAmount] = useState(19.99); // Default small pack
  const [paymentVendor, setPaymentVendor] = useState("stripe");

  const handleChargeCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardNumber || !expiry || !cvc || !buyerName) {
      alert("Please enter all required credit card parameters to authenticate.");
      return;
    }

    setSubmitting(true);
    setSuccessMsg(null);

    // Dynamic credit volume
    const packCredits = purchaseAmount === 19.99 ? 150 : purchaseAmount === 39.99 ? 400 : 50;

    setTimeout(() => {
      setSubmitting(false);
      onActivatePaidTier(packCredits);
      setSuccessMsg(`Payment completed! Securely processed via mock ${paymentVendor.toUpperCase()} gateway. ${packCredits} Premium Nano Banana Generation API credits successfully added immediately to active session.`);
      // Reset forms
      setCardNumber("");
      setExpiry("");
      setCvc("");
      setBuyerName("");
    }, 2200);
  };

  return (
    <div id="billing-subsystem" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Tier Comparison Panel (7 columns) */}
      <div className="lg:col-span-12 xl:col-span-7 space-y-6">
        <div className="bg-white p-6 rounded-3xl border-3 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] space-y-5">
          <div className="flex items-center justify-between pb-3 border-b-2 border-dashed border-slate-200">
            <h3 className="font-extrabold text-slate-900 flex items-center gap-1.5 text-xs uppercase tracking-wider">
              <Star className="text-yellow-500 w-5 h-5 fill-yellow-500/20 stroke-[2.5]" />
              Resource Selection & Quota Tiers
            </h3>
            <span className="text-xs bg-slate-900 text-white px-3 py-1 rounded-xl font-mono font-black uppercase tracking-tight">
              Active Tier: {currentTier.toUpperCase()}
            </span>
          </div>

          <p className="text-slate-600 font-bold text-xs leading-relaxed">
            Generate unlimited custom print graphics with supreme control. Rely 100% on free tiers for entry-level tasks or activate premium engines to harness Imagen-4 and Gemini text-image pipelines.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Free Tier card */}
            <div className="p-4 rounded-2xl border-2 border-slate-900 bg-slate-50 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <span className="text-[10px] bg-slate-200 text-slate-900 font-mono font-black py-1 px-2.5 rounded-lg border border-slate-350 uppercase tracking-tight">
                  Free Decal Tier
                </span>
                <div className="text-2xl font-black text-slate-900 font-sans">$0<span className="text-xs font-bold text-slate-400">/ forever</span></div>
                <ul className="text-xs text-slate-600 font-bold space-y-2">
                  <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" /> Pollinations Image Core</li>
                  <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" /> Max 10 initial images</li>
                  <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" /> Multi-Brand Memories</li>
                  <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" /> Standard Etsy & Instagram copies</li>
                </ul>
              </div>
              <span className="text-[9px] text-slate-400 font-mono font-bold uppercase">No credentials required.</span>
            </div>

            {/* Paid Tier card */}
            <div className="p-4 rounded-2xl border-2 border-slate-900 bg-yellow-50/50 flex flex-col justify-between space-y-4 relative">
              <div className="absolute top-3 right-3 shadow-sm bg-yellow-400 border border-slate-900 text-slate-900 rounded-full p-1 leading-none">
                <Sparkles className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>

              <div className="space-y-2">
                <span className="text-[10px] bg-yellow-400 text-slate-900 font-mono font-black py-1 px-2.5 rounded-lg border border-slate-900 uppercase tracking-tight">
                  Premium Sandbox
                </span>
                <div className="text-2xl font-black text-slate-900 font-sans">$19<span className="text-xs font-bold text-slate-450">.99 / credit pack</span></div>
                <ul className="text-xs text-slate-700 font-bold space-y-2">
                  <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-slate-900 stroke-[3]" /> Gemini 2.5 Image ("Nano Banana")</li>
                  <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-slate-900 stroke-[3]" /> Imagen 4 & high resolutions</li>
                  <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-slate-900 stroke-[3]" /> Expanded Credits: +150 on checkout</li>
                  <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-slate-900 stroke-[3]" /> Extended 9:16 Instagram Mockups</li>
                </ul>
              </div>
              <span className="text-[9px] text-yellow-600 font-mono font-black uppercase tracking-tight">Processed instantly via Stripe.</span>
            </div>
          </div>
        </div>

        {/* Secret Setup Info Callout */}
        <div className="bg-slate-900 text-white p-5 rounded-3xl border-3 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] space-y-3">
          <h4 className="font-extrabold text-xs text-slate-100 flex items-center gap-2 uppercase tracking-wide">
            <KeyRound className="text-yellow-400 w-5 h-5 stroke-[2.5]" />
            Alternative Option: Connect Your Key
          </h4>
          <p className="text-xs text-slate-305 font-bold leading-relaxed">
            By default, premium server-side image generation is quota restricted. If you want to bypass quotas for free, paste your personal token into this AI Studio workspace.
          </p>
          <div className="space-y-2 bg-slate-950 p-4 rounded-2xl border border-slate-800 text-[10px] font-mono leading-relaxed text-slate-350">
            <div className="flex gap-1.5 items-start">
              <span className="text-yellow-400 font-black">1.</span>
              <p className="font-bold">Go to the <strong className="text-white">Settings &gt; Secrets</strong> panel in this AI Studio workspace.</p>
            </div>
            <div className="flex gap-1.5 items-start">
              <span className="text-yellow-400 font-black">2.</span>
              <p className="font-bold">Create a secret with key name: <span className="text-yellow-400 font-bold">GEMINI_API_KEY</span> and paste your personal key.</p>
            </div>
            <div className="flex gap-1.5 items-start">
              <span className="text-yellow-400 font-black">3.</span>
              <p className="font-bold">The applet detects it at execution runtime, granting you unlimited premium calls!</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stripe payment Form (5 columns) */}
      <div className="lg:col-span-12 xl:col-span-5 bg-white p-6 rounded-3xl border-3 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] space-y-5">
        <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5 uppercase tracking-wide pb-2 border-b-2 border-dashed border-slate-200">
          <Wallet className="w-5 h-5 text-slate-900 stroke-[2.5]" />
          Secure Payment Portal
        </h4>

        {successMsg && (
          <div className="p-4 bg-emerald-50 text-slate-950 border-2 border-slate-900 rounded-2xl text-xs flex flex-col gap-1 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
            <span className="font-black uppercase tracking-tight text-emerald-700">✓ Transaction Approved</span>
            <p className="leading-relaxed font-bold">{successMsg}</p>
          </div>
        )}

        <form onSubmit={handleChargeCard} className="space-y-4">
          <div>
            <label className="text-[10px] font-black text-slate-400 block mb-1.5 font-mono uppercase tracking-wider">Select Package:</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPurchaseAmount(9.99)}
                className={`py-2 px-1 border-2 border-slate-900 text-center rounded-xl text-xs font-black transition-all cursor-pointer shadow-[1.5px_1.5px_0px_0px_rgba(15,23,42,1)] active:translate-y-0.5 active:shadow-none ${
                  purchaseAmount === 9.99 ? "bg-yellow-400 text-slate-900" : "bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                $9.99
                <span className="text-[9px] font-bold block opacity-70">+50 Credits</span>
              </button>

              <button
                type="button"
                onClick={() => setPurchaseAmount(19.99)}
                className={`py-2 px-1 border-2 border-slate-900 text-center rounded-xl text-xs font-black transition-all cursor-pointer shadow-[1.5px_1.5px_0px_0px_rgba(15,23,42,1)] active:translate-y-0.5 active:shadow-none ${
                  purchaseAmount === 19.99 ? "bg-yellow-400 text-slate-900" : "bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                $19.99
                <span className="text-[9px] font-bold block opacity-70">+150 Credits</span>
              </button>

              <button
                type="button"
                onClick={() => setPurchaseAmount(39.99)}
                className={`py-2 px-1 border-2 border-slate-900 text-center rounded-xl text-xs font-black transition-all cursor-pointer shadow-[1.5px_1.5px_0px_0px_rgba(15,23,42,1)] active:translate-y-0.5 active:shadow-none ${
                  purchaseAmount === 39.99 ? "bg-yellow-400 text-slate-900" : "bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                $39.99
                <span className="text-[9px] font-bold block opacity-70">+400 Credits</span>
              </button>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 block mb-1.5 font-mono uppercase tracking-wider">Gateway Vendor:</label>
            <div className="grid grid-cols-2 gap-25 gap-3">
              <button
                type="button"
                onClick={() => setPaymentVendor("stripe")}
                className={`py-2 text-xs font-black border-2 border-slate-900 rounded-xl transition-all cursor-pointer shadow-[1.5px_1.5px_0px_0px_rgba(15,23,42,1)] active:translate-y-0.5 active:shadow-none uppercase tracking-tight ${
                  paymentVendor === "stripe" ? "bg-yellow-400 text-slate-900" : "bg-white text-slate-500 hover:bg-slate-50"
                }`}
                id="btn-vendor-stripe"
              >
                Stripe Payments
              </button>
              <button
                type="button"
                onClick={() => setPaymentVendor("paypal")}
                className={`py-2 text-xs font-black border-2 border-slate-900 rounded-xl transition-all cursor-pointer shadow-[1.5px_1.5px_0px_0px_rgba(15,23,42,1)] active:translate-y-0.5 active:shadow-none uppercase tracking-tight ${
                  paymentVendor === "paypal" ? "bg-yellow-400 text-slate-900" : "bg-white text-slate-500 hover:bg-slate-50"
                }`}
                id="btn-vendor-paypal"
              >
                PayPal Standard
              </button>
            </div>
          </div>

          <div className="space-y-3.5 pt-2 border-t-2 border-dashed border-slate-200">
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Cardowner Name</label>
              <input
                id="input-billing-user-name"
                type="text"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                placeholder="John Doe"
                className="w-full text-xs font-bold border-2 border-slate-900 focus:outline-none p-2.5 rounded-xl bg-white focus:ring-1 focus:ring-yellow-400 shadow-[1.5px_1.5px_0px_0px_rgba(15,23,42,1)]"
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Credit Card Number</label>
              <input
                id="input-billing-card-number"
                type="text"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value.replace(/\s+/g, '').replace(/(\d{4})/g, '$1 ').trim())}
                maxLength={19}
                placeholder="4242 4242 4242 4242"
                className="w-full text-xs font-bold border-2 border-slate-900 focus:outline-none p-2.5 rounded-xl bg-white focus:ring-1 focus:ring-yellow-400 font-mono shadow-[1.5px_1.5px_0px_0px_rgba(15,23,42,1)]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Expiry Date</label>
                <input
                  id="input-billing-card-expiry"
                  type="text"
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  maxLength={5}
                  placeholder="MM/YY"
                  className="w-full text-xs font-bold border-2 border-slate-900 focus:outline-none p-2.5 rounded-xl bg-white focus:ring-1 focus:ring-yellow-400 font-mono shadow-[1.5px_1.5px_0px_0px_rgba(15,23,42,1)]"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">CVC / Security Code</label>
                <input
                  id="input-billing-card-cvc"
                  type="password"
                  value={cvc}
                  onChange={(e) => setCvc(e.target.value)}
                  maxLength={3}
                  placeholder="***"
                  className="w-full text-xs font-bold border-2 border-slate-900 focus:outline-none p-2.5 rounded-xl bg-white focus:ring-1 focus:ring-yellow-400 font-mono shadow-[1.5px_1.5px_0px_0px_rgba(15,23,42,1)]"
                />
              </div>
            </div>
          </div>

          <button
            id="btn-process-payment"
            type="submit"
            disabled={submitting}
            className="w-full bg-yellow-400 hover:bg-yellow-300 text-slate-900 border-2 border-slate-900 font-black py-3.5 px-4 rounded-xl shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer text-xs uppercase tracking-wider disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {submitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-slate-900 stroke-[3]" /> Securing Authorization...
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5 text-slate-900 stroke-[2.5]" /> Pay ${purchaseAmount.toFixed(2)} Securely
              </>
            )}
          </button>
        </form>

        <p className="text-[9px] text-slate-400 text-center font-bold font-sans uppercase tracking-tight">
          🛡 Encrypted SSL connection. Payments processed as sandbox tokens.
        </p>
      </div>
    </div>
  );
}
