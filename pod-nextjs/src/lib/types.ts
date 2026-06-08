export interface BrandMemory {
  likedThemes: string[];
  dislikedThemes: string[];
  designStyleLearnings: string[];
  likedMockupsCount?: number;
  dislikedMockupsCount?: number;
  mockupFeedbackLearnings?: string[]; // Sizing/placement preferences (e.g., "Prefers full chest prints on dark t-shirts")
  socialFeedbackLearnings?: string[]; // Copywriting/marketing preferences (e.g., "Prefers high-excitement story countdowns")
}

export interface Brand {
  id: string;
  name: string;
  audience: string;
  colorGuidelines: string[];
  voice: string;
  customKeywords: string;
  imageLimit: number;
  imagesCreated: number;
  memory: BrandMemory;
  guidelinesDocFile?: string;
  guidelinesDocText?: string;
  coreValues?: string[];
}

export type DesignStatus = 'pending' | 'liked' | 'disliked';

export interface DesignCard {
  id: string;
  brandId: string;
  prompt: string;
  theme: string;
  imageUrl: string;
  status: DesignStatus;
  timestamp: string;
}

export type ProductType = 't-shirt' | 'mug' | 'tote-bag' | 'hoodie' | 'phone-case';

export interface ProductMockup {
  id: string;
  designId: string;
  designUrl: string;
  brandId: string;
  productType: ProductType;
  productColor: string;
  placementScale: number; // e.g. 0.4
  placementOffset: { x: number; y: number };
  title: string;
  description: string;
  suggestedPrice: number;
  costPrice: number;
  tags: string[];
  mockupUrl: string; // Dynamic composite or template graphic
  likeStatus?: 'liked' | 'disliked' | 'none';
}

export interface SocialAsset {
  id: string;
  idAttr?: string;
  productId: string;
  productTitle: string;
  brandId: string;
  channel: 'instagram-post' | 'instagram-story' | 'instagram-reel' | 'pinterest-pin';
  caption: string;
  hashtags: string[];
  visualBrief: string;
  status: 'draft' | 'scheduled' | 'published';
  sharesSuggested: string;
  timestamp?: string;
  likeStatus?: 'liked' | 'disliked' | 'none';
}

export interface CampaignMetrics {
  id: string;
  productId: string;
  productTitle: string;
  brandId: string;
  views: number;
  clicks: number;
  conversions: number;
  revenue: number;
  ctr: number;
  conversionRate: number;
  campaignName: string;
}

export interface TrendIdea {
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
  colorMixSuggestion: string;
}

export interface SystemState {
  brands: Brand[];
  activeBrandId: string;
  designs: DesignCard[];
  mockups: ProductMockup[];
  campaigns: CampaignMetrics[];
  socialAssets: SocialAsset[];
  dailyTrendIdea: TrendIdea | null;
  dailyExplanation: string; // The "what I'm working on today" message
  activePaymentTier: 'free' | 'paid';
  nanoBananaCredits: number; // Max Credits e.g. 10 initially, or infinite if paid
  selectedLocales?: string[];
}
