import type {
  BillingPeriod,
  JobStatus,
  JobUrgency,
  Locale,
  ProVerificationStatus,
  PropertyType,
  QuoteStatus,
  SubscriptionStatus,
  UserRole,
} from '@buurklus/shared';

export interface LocalizedRef {
  id: string;
  slug: string;
  name: string;
}

export interface CategoryNode extends LocalizedRef {
  icon: string;
  typicalBudgetMinCents: number | null;
  typicalBudgetMaxCents: number | null;
  children: Omit<CategoryNode, 'children'>[];
}

export interface CityRef extends LocalizedRef {
  region: string;
  provinceName: string;
  lat: number;
  lng: number;
}

export interface PlanRef extends LocalizedRef {
  tagline: string;
  monthlyPriceCents: number;
  yearlyPriceCents: number;
  monthlyCredits: number;
  maxCategories: number;
  maxCities: number | null;
  featured: boolean;
  leadHeadStartMinutes: number;
  teamSeats: number;
  perks: string[];
}

export interface SessionUser {
  id: string;
  phone: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  avatarUrl: string | null;
  locale: Locale;
  role: UserRole;
  cityId: string | null;
  hasProProfile: boolean;
  proVerificationStatus: ProVerificationStatus | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface SignInResponse extends AuthTokens {
  user: SessionUser;
}

export interface OtpChallengeResponse {
  ok: true;
  expiresAt: string;
  resendAvailableAt: string;
  /** Present only when the API runs outside production. */
  debugCode?: string;
}

export interface JobSummary {
  id: string;
  reference: string;
  title: string;
  description: string;
  district: string | null;
  urgency: JobUrgency;
  status: JobStatus;
  propertyType: PropertyType | null;
  preferredStartDate: string | null;
  budgetMinCents: number | null;
  budgetMaxCents: number | null;
  photoUrls: string[];
  quoteCount: number;
  viewCount: number;
  publishedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  category: LocalizedRef & { icon: string };
  city: LocalizedRef;
  customer: { id: string; firstName: string | null; avatarUrl: string | null };
}

export interface Lead extends JobSummary {
  distanceKm: number | null;
  myQuote: { id: string; status: QuoteStatus } | null;
}

export interface QuoteProSummary {
  id: string;
  displayName: string;
  logoUrl: string | null;
  ratingAverage: number;
  ratingCount: number;
  yearsExperience: number;
  verificationStatus: ProVerificationStatus;
  jobsWon: number;
  medianResponseMinutes: number | null;
  baseCity: { slug: string; nameNl: string; nameEn: string };
}

export interface Quote {
  id: string;
  jobId: string;
  proId: string;
  amountCents: number;
  isEstimate: boolean;
  message: string;
  estimatedDurationDays: number | null;
  canStartOn: string | null;
  includesSiteVisit: boolean;
  validUntil: string;
  status: QuoteStatus;
  createdAt: string;
  pro?: QuoteProSummary;
}

export interface CustomerJobDetail extends Omit<JobSummary, 'category' | 'city'> {
  addressLine: string | null;
  awardedQuoteId: string | null;
  category: { id: string; slug: string; nameNl: string; nameEn: string; icon: string };
  city: { id: string; slug: string; nameNl: string; nameEn: string };
  quotes: Quote[];
}

export interface ProJobDetail extends JobSummary {
  addressLine: string | null;
  contactPhone: string | null;
  isAwardedToMe: boolean;
  myQuote: Quote | null;
}

export interface SubscriptionSummary {
  id: string;
  status: SubscriptionStatus;
  period: BillingPeriod;
  planSlug: string;
  planName: string;
  creditsRemaining: number;
  monthlyCredits: number;
  /** Zero while the platform is free. The app reads this, not a build flag. */
  monthlyPriceCents: number;
  currentPeriodEnd: string;
  trialEndsAt: string | null;
  cancelAtPeriodEnd: boolean;
  grantsAccess: boolean;
}

export interface ProDashboard {
  subscription: SubscriptionSummary | null;
  stats: { pendingQuotes: number; wonJobs: number; unreadMessages: number };
}

export interface ConversationSummary {
  id: string;
  lastMessageAt: string | null;
  customerUnread: number;
  proUnread: number;
  job: { id: string; reference: string; title: string; status: JobStatus; customerId: string; customer: { firstName: string | null; avatarUrl: string | null } };
  pro: { id: string; displayName: string; logoUrl: string | null; userId: string };
  quote: { id: string; amountCents: number; status: QuoteStatus } | null;
  messages: ChatMessage[];
}

export interface ChatMessage {
  id: string;
  body: string;
  attachmentUrls: string[];
  createdAt: string;
  senderId: string;
  sender?: { id: string; firstName: string | null; avatarUrl: string | null };
}

export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}
