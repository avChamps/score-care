import {
  Activity,
  BadgeCheck,
  Banknote,
  BarChart3,
  Bell,
  Bot,
  BrainCircuit,
  BriefcaseBusiness,
  CalendarClock,
  CreditCard,
  FileCheck2,
  Gauge,
  Headphones,
  LockKeyhole,
  Mail,
  MapPin,
  MessageCircle,
  PieChart,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserRoundCheck,
  WalletCards,
} from "lucide-react";

export const navItems = [
  { label: "Credit Score", href: "/credit-score" },
  { label: "Reports", href: "/report" },
  { label: "AI Analysis", href: "/ai-analysis" },
  { label: "Repair", href: "/cibil-repair" },
  { label: "Pricing", href: "/pricing" },
  { label: "Company", href: "/about" },
];

export const footerGroups = [
  {
    title: "Platform",
    links: [
      { label: "Free Credit Score", href: "/credit-score" },
      { label: "Credit Reports", href: "/report" },
      { label: "AI Analysis", href: "/ai-analysis" },
      { label: "CIBIL Repair", href: "/cibil-repair" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Blog", href: "/blog" },
      { label: "Help Center", href: "/help-center" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Terms", href: "/terms" },
      { label: "Refund Policy", href: "/refund-policy" },
    ],
  },
];

export const stats = [
  { value: "1.2M+", label: "credit profiles analyzed" },
  { value: "Rs.980Cr", label: "estimated approval impact" },
  { value: "42%", label: "average score improvement path" },
  { value: "99.9%", label: "secure platform uptime" },
];

export const features = [
  {
    icon: Gauge,
    title: "Live Credit Intelligence",
    body: "Track score movement, utilization, inquiries, and repayment behavior in one premium workspace.",
  },
  {
    icon: BrainCircuit,
    title: "AI Report Diagnosis",
    body: "SCORECARE highlights risk factors, disputes, and optimization steps with lender-grade clarity.",
  },
  {
    icon: ShieldCheck,
    title: "Bank-Level Security",
    body: "Encrypted flows, consent-first access, and privacy controls built for sensitive financial data.",
  },
  {
    icon: TrendingUp,
    title: "Approval Readiness",
    body: "Personalized action plans help improve loan, card, and business credit eligibility.",
  },
  {
    icon: FileCheck2,
    title: "Premium Reports",
    body: "Beautifully structured reports with insights, summaries, and repair-ready documentation.",
  },
  {
    icon: Headphones,
    title: "Expert Repair Support",
    body: "Dedicated specialists help challenge inaccuracies and build a clean credit trajectory.",
  },
];

export const pricingPlans = [
  {
    name: "Essential",
    price: "Rs.499",
    yearly: "Rs.4,799",
    description: "For fast score checks and monthly monitoring.",
    features: ["Credit score snapshot", "Monthly score alerts", "Basic report summary", "Email support"],
    highlight: false,
  },
  {
    name: "Pro",
    price: "Rs.999",
    yearly: "Rs.9,599",
    description: "For serious credit builders and loan readiness.",
    features: ["Full report dashboard", "AI factor analysis", "Dispute checklist", "Priority support"],
    highlight: true,
  },
  {
    name: "Elite Repair",
    price: "Rs.2,499",
    yearly: "Rs.23,999",
    description: "For guided CIBIL repair and premium assistance.",
    features: ["Repair consultation", "Document templates", "Dedicated expert", "Weekly progress reviews"],
    highlight: false,
  },
];

export const testimonials = [
  {
    quote: "SCORECARE turned my report into a clear recovery plan. My credit card approval came through in six weeks.",
    name: "Aarav Mehta",
    role: "Founder, SaaS operator",
  },
  {
    quote: "The interface feels premium, but the real win is how quickly it identifies the score drag.",
    name: "Neha Kapoor",
    role: "Product leader",
  },
  {
    quote: "Our finance team uses SCORECARE before every working-capital application. It saves days of manual review.",
    name: "Rohan Iyer",
    role: "CFO, D2C brand",
  },
];

export const faqs = [
  {
    question: "Will checking my score reduce it?",
    answer: "No. SCORECARE uses soft-check style flows for monitoring and education, so your score is not impacted.",
  },
  {
    question: "Can AI analysis repair my CIBIL automatically?",
    answer: "AI identifies issues and recommends steps. Disputes and corrections still require consented documentation and bureau workflows.",
  },
  {
    question: "Is my data secure?",
    answer: "Yes. The product experience is designed around encryption, consent, role-based access, and minimal data exposure.",
  },
];

export const insights = [
  { icon: Activity, title: "Utilization spike", value: "+18%" },
  { icon: ReceiptText, title: "Dispute-ready items", value: "4" },
  { icon: WalletCards, title: "Card mix health", value: "A-" },
  { icon: Bell, title: "New lender alert", value: "2" },
];

export const repairTimeline = [
  "Credit audit and bureau data review",
  "Document collection and dispute drafting",
  "Bureau submission and lender coordination",
  "Progress tracking with expert recommendations",
];

export const dashboardCards = [
  { icon: Gauge, label: "Credit Score", value: "782", change: "+34 in 90 days" },
  { icon: CreditCard, label: "Credit Utilization", value: "21%", change: "Optimal range" },
  { icon: BadgeCheck, label: "Approval Readiness", value: "92%", change: "Prime tier" },
  { icon: Bot, label: "AI Recommendations", value: "8", change: "3 high impact" },
];

export const comparisonRows = [
  ["Credit score monitoring", "Yes", "Yes", "Yes"],
  ["AI report analysis", "Basic", "Advanced", "Advanced"],
  ["CIBIL repair expert", "-", "Add-on", "Included"],
  ["Priority WhatsApp support", "-", "Yes", "Yes"],
  ["Business credit review", "-", "-", "Included"],
];

export const blogPosts = [
  {
    title: "How credit utilization quietly moves your score",
    category: "Credit Strategy",
    read: "6 min read",
    image: "credit-utilization-visual",
  },
  {
    title: "What lenders look for before approving premium cards",
    category: "Lending",
    read: "8 min read",
    image: "premium-card-approval-visual",
  },
  {
    title: "A founder's guide to business credit hygiene",
    category: "Business",
    read: "7 min read",
    image: "business-credit-visual",
  },
];

export const contactCards = [
  { icon: MessageCircle, title: "WhatsApp concierge", value: "+91 98765 43210" },
  { icon: Mail, title: "Email support", value: "care@scorecare.in" },
  { icon: MapPin, title: "Office", value: "BKC, Mumbai, India" },
  { icon: CalendarClock, title: "Business hours", value: "Mon-Sat, 9:00-19:00" },
];

export const securityBadges = [
  { icon: LockKeyhole, label: "256-bit encryption" },
  { icon: ShieldCheck, label: "Consent-first access" },
  { icon: Banknote, label: "Bank-grade controls" },
  { icon: UserRoundCheck, label: "Verified experts" },
];

export const sidebarItems = [
  { icon: BarChart3, label: "Overview", href: "/dashboard" },
  { icon: CreditCard, label: "Credit", href: "/credit-score" },
  { icon: PieChart, label: "Reports", href: "/report" },
  { icon: Sparkles, label: "AI Insights", href: "/ai-analysis" },
  { icon: BriefcaseBusiness, label: "Profile", href: "/profile" },
  { icon: Bell, label: "Notifications", href: "/notifications" },
];
