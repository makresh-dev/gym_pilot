import { Head, Link, usePage } from '@inertiajs/react';
import { useState } from 'react';
import {
    Activity,
    ArrowRight,
    Building2,
    CalendarCheck2,
    Check,
    CheckCircle2,
    ChevronRight,
    Copy,
    CreditCard,
    HelpCircle,
    Lock,
    QrCode,
    ShieldAlert,
    ShieldCheck,
    Sparkles,
    TrendingUp,
    Users,
    Wallet,
    Zap,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { dashboard, login, register } from '@/routes';

type WelcomeProps = {
    auth?: {
        user?: {
            name: string;
            email: string;
        } | null;
    } | null;
};

type Feature = {
    id: string;
    title: string;
    badge: string;
    subtitle: string;
    description: string;
    icon: typeof QrCode;
    colorTheme: {
        iconBg: string;
        iconText: string;
        borderHover: string;
        badgeColor: string;
    };
    problem: string;
    howItWorks: string[];
    benefits: string[];
    capabilities: string[];
};

const FEATURES: Feature[] = [
    {
        id: 'qr-checkin',
        title: 'Entrance QR Check-in',
        badge: 'Touchless Check-in',
        subtitle: 'Instant Mobile Attendance & Zero Front-Desk Queues',
        description:
            'Display a dynamic QR standee for members to scan with their phones. Real-time attendance logging with zero reception bottlenecks.',
        icon: QrCode,
        colorTheme: {
            iconBg: 'bg-blue-500/10 dark:bg-blue-500/20',
            iconText: 'text-blue-600 dark:text-blue-400',
            borderHover: 'hover:border-blue-500/50',
            badgeColor:
                'border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/10',
        },
        problem:
            'Paper sign-in registers and manual front-desk lookups create long member queues during peak morning and evening gym rush hours.',
        howItWorks: [
            'Place the printable GymPilot QR Standee at the gym turnstile or counter.',
            'Members scan the QR code using their mobile phone camera or the GymPilot app.',
            'Attendance is verified instantly in milliseconds, recording streaks and updating reports.',
        ],
        benefits: [
            'Eliminates reception queues and front-desk congestion completely.',
            'Logs tamper-proof, time-stamped visit history for club capacity planning.',
            'Feeds real-time visit frequency directly into churn-prediction algorithms.',
        ],
        capabilities: [
            '1-Click Printable Acrylic Standee',
            'Cross-device Camera Scanning',
            'Live Daily Attendance Stream',
            'Peak Hour Traffic Curves',
        ],
    },
    {
        id: 'retention-signals',
        title: 'Automated Retention Signals',
        badge: 'AI Churn Defense',
        subtitle: 'Detect Drop-offs Before Members Quit & Stop Paying',
        description:
            'Continuously analyzes member attendance cadence against their stated weekly goals to flag fading workout habits before cancellation.',
        icon: ShieldAlert,
        colorTheme: {
            iconBg: 'bg-amber-500/10 dark:bg-amber-500/20',
            iconText: 'text-amber-600 dark:text-amber-400',
            borderHover: 'hover:border-amber-500/50',
            badgeColor:
                'border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10',
        },
        problem:
            'Gym owners usually discover a member has quit only after their subscription lapses. By that point, the member has lost the gym habit and re-engaging them is nearly impossible.',
        howItWorks: [
            'GymPilot establishes an expected weekly workout baseline for every member (e.g. 3x/week).',
            'Algorithms detect significant drops in visit frequency (e.g. 50%+ drop over 2 consecutive weeks).',
            'Automatically generates high, medium, or low severity alerts with empirical evidence.',
        ],
        benefits: [
            'Reduces annual member dropout rates by up to 35%.',
            'Enables proactive, empathetic outreach before the habit is completely broken.',
            'Protects recurring membership revenue and improves customer lifetime value (LTV).',
        ],
        capabilities: [
            'Attendance Velocity Tracking',
            'Severity-based Prioritization (High/Medium/Low)',
            'Baseline vs. Actual Trend Evidence',
            'Upcoming Expiration Warnings (7 & 14-day)',
        ],
    },
    {
        id: 'work-queue',
        title: 'Daily Staff Work Queue',
        badge: 'Staff Accountability',
        subtitle: 'Structured Daily Outreach Tasks for Trainers & Reception',
        description:
            'Organizes member follow-ups, calls, WhatsApp check-ins, and renewals into Overdue, Today, and Upcoming queues so nothing slips through.',
        icon: CalendarCheck2,
        colorTheme: {
            iconBg: 'bg-indigo-500/10 dark:bg-indigo-500/20',
            iconText: 'text-indigo-600 dark:text-indigo-400',
            borderHover: 'hover:border-indigo-500/50',
            badgeColor:
                'border-indigo-500/30 text-indigo-600 dark:text-indigo-400 bg-indigo-500/10',
        },
        problem:
            'Gym staff want to follow up with absent members, but without a dedicated CRM system, reminders get lost on sticky notes, WhatsApp groups, and spreadsheets.',
        howItWorks: [
            'Retention signals and renewals automatically populate the daily work queue.',
            'Tasks are organized into prioritized buckets: Overdue, Today, and Upcoming.',
            'Staff execute 1-click interventions (Phone Call, WhatsApp, In-Person) and log notes.',
        ],
        benefits: [
            'Keeps trainers and front-desk staff focused on revenue-generating retention actions.',
            'Members feel personally valued and cared for, fostering strong community loyalty.',
            'Provides the gym owner with full visibility into staff outreach activity.',
        ],
        capabilities: [
            '1-Click WhatsApp & Phone Dialer',
            'Structured Intervention Outcomes',
            'Staff Follow-up Audit Trail',
            'Automated Task Progression',
        ],
    },
    {
        id: 'memberships-dues',
        title: 'Memberships & Due Ledger',
        badge: 'Financial Clarity',
        subtitle: 'Flexible Billing, Partial Payments & Due Tracking',
        description:
            'Configure unlimited membership tiers, collect partial installments, record balances due, and streamline renewals with complete ledger clarity.',
        icon: CreditCard,
        colorTheme: {
            iconBg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
            iconText: 'text-emerald-600 dark:text-emerald-400',
            borderHover: 'hover:border-emerald-500/50',
            badgeColor:
                'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10',
        },
        problem:
            'Unrecorded partial payments and informal credit agreements lead to uncollected revenue, cash leakage, and awkward arguments with members at the counter.',
        howItWorks: [
            'Configure your gym plans: Monthly, Quarterly, Half-Yearly, Annual, or Personal Training.',
            'Collect initial fees and log remaining pending balances due with clear repayment dates.',
            'Ledger automatically updates membership status (Active, Expired, Paused).',
        ],
        benefits: [
            'Zero revenue leakage—every pending balance is tracked and visible on the dashboard.',
            'Accommodates member budgets with structured partial installment collection.',
            'Instant digital receipt issuance and automated plan expiry calculation.',
        ],
        capabilities: [
            'Custom Plan Duration & Pricing',
            'Partial Payment & Due Balances',
            'Digital Payment Receipts',
            'One-Click Renewal Management',
        ],
    },
    {
        id: 'payment-desk',
        title: 'Payment Desk & UPI Standee',
        badge: 'Counter Scan & Pay',
        subtitle: 'Dynamic UPI QR Standees & Real-Time Collections Summary',
        description:
            'Generate custom UPI QR codes linked to your gym account, print acrylic counter standees, and monitor all-time, monthly, and daily collections.',
        icon: Wallet,
        colorTheme: {
            iconBg: 'bg-purple-500/10 dark:bg-purple-500/20',
            iconText: 'text-purple-600 dark:text-purple-400',
            borderHover: 'hover:border-purple-500/50',
            badgeColor:
                'border-purple-500/30 text-purple-600 dark:text-purple-400 bg-purple-500/10',
        },
        problem:
            'Gym owners pay high merchant swipe fees on card POS terminals or lack visibility into how much money was collected across UPI, cash, and bank wire today.',
        howItWorks: [
            'Register your gym’s UPI ID (VPA) and bank transfer details in settings or at signup.',
            'GymPilot generates a high-contrast UPI QR code encoded with your business name.',
            'Print the professional desk standee in 1 click and place it at your billing counter.',
        ],
        benefits: [
            'Direct peer-to-merchant UPI payments with 0% gateway commission fees.',
            'Crisp, pre-formatted counter standee template ready for physical display.',
            'Real-time financial summary tracking Today, This Month, and Lifetime receipts.',
        ],
        capabilities: [
            'All UPI Apps Supported (GPay, PhonePe, Paytm, BHIM)',
            'Wire Transfer Drawer (Bank Name, A/C, IFSC)',
            'Collection Channel Breakdown (UPI, Cash, Card, Wire)',
            'Recent Transaction Activity Stream',
        ],
    },
    {
        id: 'analytics-cockpit',
        title: 'Member Insights & Analytics',
        badge: 'Club Intelligence',
        subtitle: 'Unified Dashboard Cockpit for Real-Time Operations',
        description:
            'Monitor total active members, daily attendance volume, expiring memberships, and staff action lists from a sleek Apple-inspired interface.',
        icon: TrendingUp,
        colorTheme: {
            iconBg: 'bg-sky-500/10 dark:bg-sky-500/20',
            iconText: 'text-sky-600 dark:text-sky-400',
            borderHover: 'hover:border-sky-500/50',
            badgeColor:
                'border-sky-500/30 text-sky-600 dark:text-sky-400 bg-sky-500/10',
        },
        problem:
            'Gym owners often manage operations blindly without understanding member trends, attendance peaks, or which trainers are following up with dropping members.',
        howItWorks: [
            'All member check-ins, payments, and staff notes synchronize into the live dashboard.',
            'High-priority retention signals and work queue items are surfaced at the top of the day.',
            'Instant search and status filtering give managers instant access to member files.',
        ],
        benefits: [
            'Complete bird-eye view of your fitness business health at a single glance.',
            'Optimize gym staffing and group class schedules based on actual peak hour data.',
            'Fast, lightweight software that runs smoothly on mobile, tablet, and desktop.',
        ],
        capabilities: [
            'Live Active Member Metric Counters',
            'Real-time Daily Check-in Totals',
            'Fast Member Search & History',
            'Responsive Apple Human Interface Design',
        ],
    },
];

type PricingTier = {
    id: 'starter' | 'pro' | 'enterprise';
    name: string;
    badge: string;
    popular?: boolean;
    description: string;
    monthlyPrice: number;
    annualMonthlyPrice: number;
    annualTotal: number;
    memberCapacity: string;
    features: string[];
    ctaText: string;
    colorTheme: {
        accent: string;
        border: string;
        badgeBg: string;
    };
};

const PRICING_TIERS: PricingTier[] = [
    {
        id: 'starter',
        name: 'Starter Club',
        badge: 'Solo Gyms & Studios',
        popular: false,
        description:
            'Ideal for independent gyms, CrossFit boxes, and boutique fitness studios getting organized.',
        monthlyPrice: 1499,
        annualMonthlyPrice: 1199,
        annualTotal: 14388,
        memberCapacity: 'Up to 150 Active Members',
        ctaText: 'Start 14-Day Free Trial',
        colorTheme: {
            accent: 'text-blue-600 dark:text-blue-400',
            border: 'border-border/80 hover:border-blue-500/40',
            badgeBg:
                'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
        },
        features: [
            'Touchless QR Check-in & entrance scanner',
            '1-Click printable acrylic standee generator',
            'Full member profiles & attendance history log',
            'UPI Payment Receiving Desk & dynamic QR',
            'Membership plans, expiry & renewal alerts',
            'Live today check-in stream & streaks',
            '1 Admin / Owner login',
            'Standard email & community support',
        ],
    },
    {
        id: 'pro',
        name: 'Growth & Pro',
        badge: 'Most Popular Choice',
        popular: true,
        description:
            'Engineered for high-performing clubs prioritizing member retention, staff accountability, and cash flow.',
        monthlyPrice: 2999,
        annualMonthlyPrice: 2399,
        annualTotal: 28788,
        memberCapacity: 'Up to 600 Active Members',
        ctaText: 'Start 14-Day Pro Trial',
        colorTheme: {
            accent: 'text-primary',
            border: 'border-primary/70 ring-2 ring-primary/20 dark:ring-primary/40 shadow-xl shadow-primary/10',
            badgeBg: 'bg-primary text-primary-foreground border-primary',
        },
        features: [
            'Everything in Starter Club, plus:',
            'AI Automated Retention Signals & Churn Alerts',
            'Prioritized Daily Staff Task Queue (Calls & WhatsApp)',
            'Partial installment payments & outstanding dues ledger',
            'Member attendance habit & drop-off curves',
            'Isolated acrylic standee printing (Payment & Access)',
            '5 Staff & trainer logins with role access',
            'Priority WhatsApp & phone direct support',
        ],
    },
    {
        id: 'enterprise',
        name: 'Club Enterprise',
        badge: 'Chains & Multi-Branch',
        popular: false,
        description:
            'For multi-location fitness franchises, luxury wellness facilities, and high-volume fitness chains.',
        monthlyPrice: 5999,
        annualMonthlyPrice: 4799,
        annualTotal: 57588,
        memberCapacity: 'Unlimited Active Members',
        ctaText: 'Subscribe to Enterprise',
        colorTheme: {
            accent: 'text-emerald-600 dark:text-emerald-400',
            border: 'border-border/80 hover:border-emerald-500/40',
            badgeBg:
                'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
        },
        features: [
            'Everything in Growth & Pro, plus:',
            'Multi-branch consolidated cockpit & reporting',
            'Custom gym white-label logo branding on standees',
            'Advanced revenue forecasting & peak-hour flow analytics',
            'Unlimited staff, trainer, and front-desk accounts',
            'Automated daily encrypted cloud backup replication',
            'Dedicated onboarding manager & staff video training',
            '99.9% uptime SLA & priority feature requests',
        ],
    },
];

type FaqItem = {
    question: string;
    answer: string;
};

const FAQS: FaqItem[] = [
    {
        question: 'How does the 14-day free trial work?',
        answer: 'You get complete, unrestricted access to all features in your selected plan for 14 days. No credit card or upfront deposit is required. You can test touchless check-ins, retention signals, and staff queues with your real members.',
    },
    {
        question: 'Can I change my subscription tier as my gym expands?',
        answer: 'Yes! You can upgrade or downgrade your plan at any time with a single click. When upgrading, your payment is prorated automatically so you only pay for what you use.',
    },
    {
        question: 'Do my members need to install a mobile app to check in?',
        answer: 'No app download is required for members. They simply scan the physical QR standee at your gym entrance using their smartphone camera or browser for instantaneous attendance verification.',
    },
    {
        question: 'How do I collect subscription payments or member dues?',
        answer: 'GymPilot includes a Front-Desk UPI Payment Receiving Desk. You can generate dynamic, printable UPI standees encoded with your gym’s UPI ID (VPA) and bank details to receive payments directly with zero intermediary commission.',
    },
    {
        question: 'Is my gym and member data secure?',
        answer: 'Yes. We employ enterprise-grade SSL/TLS encryption, tenant-isolated organizational databases, daily automated cloud backups, and comply with standard data protection protocols.',
    },
];

export default function Welcome() {
    const { auth } = usePage<WelcomeProps>().props;
    const user = auth?.user;
    const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
    const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<PricingTier | null>(null);
    const [activeCheckoutTab, setActiveCheckoutTab] = useState<'trial' | 'upi'>('trial');
    const [copiedUpi, setCopiedUpi] = useState(false);

    const handleCopyUpi = () => {
        navigator.clipboard.writeText('subscribe.gympilot@icici');
        setCopiedUpi(true);
        setTimeout(() => setCopiedUpi(false), 2000);
    };

    return (
        <>
            <Head title="GymPilot - Smart Gym Management & Retention Engine" />

            <div className="flex min-h-screen flex-col bg-background text-foreground selection:bg-primary/15 selection:text-primary">
                {/* Frosted Apple Navigation */}
                <header className="sticky top-0 z-40 w-full border-b border-border/70 bg-background/80 backdrop-blur-xl transition-all">
                    <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center gap-6">
                            <Link href="/" className="flex items-center gap-3">
                                <img
                                    src="/images/gympilot-icon.png"
                                    alt="GymPilot Logo"
                                    className="size-9 rounded-xl object-contain shadow-xs border border-border/60 bg-white dark:bg-card p-0.5"
                                />
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold tracking-tight text-foreground">GymPilot</span>
                                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider -mt-0.5">Smart Fitness Technology</span>
                                </div>
                            </Link>

                            <nav className="hidden md:flex items-center gap-5 text-xs font-semibold text-muted-foreground ml-2">
                                <a href="#features" className="hover:text-foreground transition-colors">
                                    Features
                                </a>
                                <a href="#pricing" className="hover:text-foreground transition-colors flex items-center gap-1.5">
                                    <span>Pricing &amp; Plans</span>
                                    <span className="rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold px-1.5 py-0.5 border border-emerald-500/30">
                                        Save 20%
                                    </span>
                                </a>
                                <a href="#faq" className="hover:text-foreground transition-colors">
                                    FAQ
                                </a>
                            </nav>
                        </div>

                        <nav className="flex items-center gap-2">
                            {user ? (
                                <Button asChild size="sm" className="rounded-full px-4 text-xs font-medium">
                                    <Link href={dashboard()}>
                                        Dashboard
                                        <ArrowRight className="size-3.5" />
                                    </Link>
                                </Button>
                            ) : (
                                <>
                                    <Button variant="ghost" size="sm" className="rounded-full px-3.5 text-xs" asChild>
                                        <Link href={login()}>Log In</Link>
                                    </Button>
                                    <Button size="sm" className="rounded-full px-4 text-xs font-medium shadow-xs" asChild>
                                        <Link href={register()}>
                                            Get Started
                                            <ArrowRight className="size-3.5" />
                                        </Link>
                                    </Button>
                                </>
                            )}
                        </nav>
                    </div>
                </header>

                {/* Hero Section */}
                <main className="flex-1">
                    <section className="relative overflow-hidden pt-16 pb-16 md:pt-24 md:pb-24">
                        <div className="mx-auto flex max-w-4xl flex-col items-center px-4 text-center sm:px-6">
                            {/* Logo Emblem & Badge */}
                            <div className="mb-8 flex flex-col items-center">
                                <div className="relative mb-5 flex items-center justify-center">
                                    <div className="absolute -inset-4 rounded-full bg-emerald-500/20 blur-2xl dark:bg-emerald-500/15" />
                                    <img
                                        src="/images/gympilot-icon.png"
                                        alt="GymPilot Smart Fitness Technology"
                                        className="relative size-28 sm:size-32 rounded-3xl object-contain shadow-lg border border-border/80 bg-white dark:bg-card p-2 transition-transform duration-300 hover:scale-105"
                                    />
                                </div>

                                <Badge variant="outline" className="gap-1.5 rounded-full px-3.5 py-1 text-[11px] font-medium tracking-wide bg-card/80 backdrop-blur-sm border-border/80 shadow-2xs">
                                    <Activity className="size-3 text-emerald-500" />
                                    Smart Fitness Technology &amp; Retention Engine
                                </Badge>
                            </div>

                            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl text-foreground">
                                Run your gym with precision. <br className="hidden sm:inline" />
                                <span className="text-muted-foreground font-normal">
                                    Retain members longer.
                                </span>
                            </h1>

                            <p className="mt-6 max-w-xl text-base text-muted-foreground sm:text-lg font-normal leading-relaxed">
                                Real-time attendance check-ins, early retention signals before members churn,
                                daily prioritized staff follow-ups, and flexible billing.
                            </p>

                            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
                                {user ? (
                                    <Button size="lg" className="rounded-full px-7 text-sm font-medium shadow-xs" asChild>
                                        <Link href={dashboard()}>
                                            Open Dashboard
                                            <ArrowRight className="size-4" />
                                        </Link>
                                    </Button>
                                ) : (
                                    <>
                                        <Button size="lg" className="rounded-full px-7 text-sm font-medium shadow-xs" asChild>
                                            <Link href={register()}>
                                                Start Free Trial
                                                <ArrowRight className="size-4" />
                                            </Link>
                                        </Button>
                                        <Button size="lg" variant="outline" className="rounded-full px-7 text-sm font-medium bg-card/80 hover:bg-secondary" asChild>
                                            <Link href={login()}>Sign In</Link>
                                        </Button>
                                    </>
                                )}
                            </div>

                            {/* Trust badges */}
                            <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground font-medium">
                                <span className="inline-flex items-center gap-1.5">
                                    <CheckCircle2 className="size-3.5 text-emerald-500" />
                                    Instant QR check-ins
                                </span>
                                <span className="inline-flex items-center gap-1.5">
                                    <CheckCircle2 className="size-3.5 text-emerald-500" />
                                    Automated churn detection
                                </span>
                                <span className="inline-flex items-center gap-1.5">
                                    <CheckCircle2 className="size-3.5 text-emerald-500" />
                                    Prioritized staff work queue
                                </span>
                            </div>
                        </div>
                    </section>

                    {/* Feature Cards Grid */}
                    <section id="features" className="border-t border-border/70 bg-card/40 py-16 md:py-20 scroll-mt-14">
                        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                            <div className="mx-auto max-w-2xl text-center">
                                <span className="text-xs font-bold uppercase tracking-widest text-primary">
                                    Feature Deep Dive
                                </span>
                                <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                                    Engineered for high-performing fitness clubs
                                </h2>
                                <p className="mt-2.5 text-sm text-muted-foreground">
                                    Click any feature card below to see how it works, the problems it solves, and how it protects your revenue.
                                </p>
                            </div>

                            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                                {FEATURES.map((feature) => {
                                    const IconComponent = feature.icon;
                                    return (
                                        <Card
                                            key={feature.id}
                                            onClick={() => setSelectedFeature(feature)}
                                            className={`cursor-pointer group relative overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-md active:scale-[0.99] border-border/80 ${feature.colorTheme.borderHover}`}
                                        >
                                            <CardHeader className="pb-3">
                                                <div className="flex items-center justify-between gap-2">
                                                    <div
                                                        className={`flex size-11 items-center justify-center rounded-2xl ${feature.colorTheme.iconBg} ${feature.colorTheme.iconText} shadow-2xs`}
                                                    >
                                                        <IconComponent className="size-5" />
                                                    </div>
                                                    <span
                                                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wide border ${feature.colorTheme.badgeColor}`}
                                                    >
                                                        {feature.badge}
                                                    </span>
                                                </div>
                                                <CardTitle className="mt-3.5 text-base font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
                                                    {feature.title}
                                                </CardTitle>
                                                <CardDescription className="text-xs leading-relaxed text-muted-foreground line-clamp-2">
                                                    {feature.description}
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent className="pt-0 flex items-center justify-between">
                                                <span className="text-xs font-semibold text-primary inline-flex items-center gap-1 group-hover:gap-1.5 transition-all">
                                                    <span>Click to explore</span>
                                                    <ChevronRight className="size-3.5" />
                                                </span>
                                                <span className="text-[10px] text-muted-foreground/80 font-medium">Details →</span>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        </div>
                    </section>

                    {/* SaaS Pricing & Subscription Section */}
                    <section
                        id="pricing"
                        className="border-t border-border/70 bg-gradient-to-b from-background via-card/25 to-background py-20 md:py-28 relative overflow-hidden scroll-mt-14"
                    >
                        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                            {/* Section Header */}
                            <div className="mx-auto max-w-2xl text-center">
                                <span className="text-xs font-bold uppercase tracking-widest text-primary inline-flex items-center gap-1.5 bg-primary/10 border border-primary/20 px-3 py-1 rounded-full">
                                    <Sparkles className="size-3.5 text-primary" />
                                    <span>Transparent SaaS Pricing • Zero Hidden Fees</span>
                                </span>
                                <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-4xl text-foreground">
                                    Predictable plans to supercharge your gym
                                </h2>
                                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                                    Start your 14-day full-access trial today. No credit card required upfront. Upgrade, downgrade, or cancel anytime with a single click.
                                </p>

                                {/* Apple Segmented Billing Frequency Switcher */}
                                <div className="mt-8 inline-flex items-center p-1 rounded-full bg-muted/80 border border-border/80 shadow-2xs backdrop-blur-md">
                                    <button
                                        type="button"
                                        onClick={() => setBillingCycle('monthly')}
                                        className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${
                                            billingCycle === 'monthly'
                                                ? 'bg-background text-foreground shadow-xs border border-border/60'
                                                : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        Monthly Billing
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setBillingCycle('annual')}
                                        className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                                            billingCycle === 'annual'
                                                ? 'bg-background text-foreground shadow-xs border border-border/60'
                                                : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        <span>Annual Billing</span>
                                        <span className="rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5 border border-emerald-500/30">
                                            Save 20%
                                        </span>
                                    </button>
                                </div>
                            </div>

                            {/* Pricing Cards Grid */}
                            <div className="mt-14 grid gap-6 lg:grid-cols-3 items-stretch">
                                {PRICING_TIERS.map((tier) => {
                                    const currentMonthlyPrice =
                                        billingCycle === 'annual'
                                            ? tier.annualMonthlyPrice
                                            : tier.monthlyPrice;

                                    return (
                                        <Card
                                            key={tier.id}
                                            className={`relative flex flex-col justify-between overflow-hidden rounded-3xl transition-all duration-200 hover:-translate-y-1 hover:shadow-xl bg-card ${tier.colorTheme.border}`}
                                        >
                                            {tier.popular && (
                                                <div className="absolute top-0 inset-x-0 bg-primary py-1.5 text-center text-[11px] font-bold uppercase tracking-wider text-primary-foreground flex items-center justify-center gap-1.5 shadow-xs">
                                                    <Sparkles className="size-3.5 fill-current" />
                                                    <span>Most Popular Choice</span>
                                                </div>
                                            )}

                                            <div>
                                                <CardHeader className={tier.popular ? 'pt-9 pb-4' : 'pt-6 pb-4'}>
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span
                                                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${tier.colorTheme.badgeBg}`}
                                                        >
                                                            {tier.badge}
                                                        </span>
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-secondary/80 border border-border/60 px-2.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                                                            <Users className="size-3" />
                                                            <span>{tier.memberCapacity}</span>
                                                        </span>
                                                    </div>

                                                    <CardTitle className="text-xl font-bold tracking-tight text-foreground mt-3">
                                                        {tier.name}
                                                    </CardTitle>
                                                    <CardDescription className="text-xs leading-relaxed text-muted-foreground min-h-[36px]">
                                                        {tier.description}
                                                    </CardDescription>

                                                    {/* Price Display */}
                                                    <div className="mt-4 pt-4 border-t border-border/70">
                                                        <div className="flex items-baseline gap-1.5">
                                                            <span className="text-4xl font-extrabold tabular-nums tracking-tight text-foreground">
                                                                ₹{currentMonthlyPrice.toLocaleString('en-IN')}
                                                            </span>
                                                            <span className="text-xs font-semibold text-muted-foreground">
                                                                / month
                                                            </span>
                                                        </div>

                                                        <div className="mt-1 flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                                                            {billingCycle === 'annual' ? (
                                                                <>
                                                                    <span>Billed annually (₹{tier.annualTotal.toLocaleString('en-IN')}/yr)</span>
                                                                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">• 2 Months Free</span>
                                                                </>
                                                            ) : (
                                                                <span>Billed monthly • Cancel anytime</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </CardHeader>

                                                <CardContent className="pt-2 pb-4">
                                                    <div className="space-y-2.5">
                                                        <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
                                                            What's Included:
                                                        </span>
                                                        {tier.features.map((feature, idx) => {
                                                            const isHighlight = feature.startsWith('Everything in');
                                                            return (
                                                                <div
                                                                    key={idx}
                                                                    className={`flex items-start gap-2.5 text-xs ${
                                                                        isHighlight
                                                                            ? 'font-bold text-foreground py-0.5'
                                                                            : 'text-foreground/90 font-medium'
                                                                    }`}
                                                                >
                                                                    <CheckCircle2
                                                                        className={`size-4 shrink-0 mt-0.5 ${
                                                                            tier.popular
                                                                                ? 'text-primary'
                                                                                : 'text-emerald-500'
                                                                        }`}
                                                                    />
                                                                    <span className="leading-snug">{feature}</span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </CardContent>
                                            </div>

                                            <CardFooter className="pt-4 pb-6 border-t border-border/70 flex flex-col gap-2.5">
                                                <Button
                                                    size="lg"
                                                    variant={tier.popular ? 'default' : 'outline'}
                                                    className={`w-full rounded-xl font-semibold text-xs shadow-xs transition-all cursor-pointer ${
                                                        tier.popular
                                                            ? 'hover:brightness-105 active:scale-[0.99]'
                                                            : 'bg-card hover:bg-secondary active:scale-[0.99]'
                                                    }`}
                                                    onClick={() => {
                                                        setSelectedPlanForCheckout(tier);
                                                        setActiveCheckoutTab('trial');
                                                    }}
                                                >
                                                    <span>{tier.ctaText}</span>
                                                    <ArrowRight className="size-3.5 ml-1.5" />
                                                </Button>

                                                <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground font-medium">
                                                    <ShieldCheck className="size-3.5 text-emerald-500" />
                                                    <span>14-day zero-risk trial • Cancel anytime</span>
                                                </div>
                                            </CardFooter>
                                        </Card>
                                    );
                                })}
                            </div>

                            {/* Trust & Guarantees Value Grid */}
                            <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                <div className="rounded-2xl border border-border/80 bg-card/60 p-5 shadow-2xs">
                                    <div className="flex size-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 mb-3">
                                        <Zap className="size-5" />
                                    </div>
                                    <h4 className="text-sm font-bold text-foreground">14-Day Zero-Risk Trial</h4>
                                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                                        Test every check-in, alert, and retention signal with your real gym members before paying a rupee.
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-border/80 bg-card/60 p-5 shadow-2xs">
                                    <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-3">
                                        <QrCode className="size-5" />
                                    </div>
                                    <h4 className="text-sm font-bold text-foreground">Instant Standee Setup</h4>
                                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                                        Generate and print acrylic entrance turnstile &amp; UPI payment standees in under 60 seconds.
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-border/80 bg-card/60 p-5 shadow-2xs">
                                    <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mb-3">
                                        <Wallet className="size-5" />
                                    </div>
                                    <h4 className="text-sm font-bold text-foreground">Zero Hardware Cost</h4>
                                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                                        No expensive biometric turnstiles or RFID readers needed. Works natively on smartphone cameras.
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-border/80 bg-card/60 p-5 shadow-2xs">
                                    <div className="flex size-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 mb-3">
                                        <Lock className="size-5" />
                                    </div>
                                    <h4 className="text-sm font-bold text-foreground">Bank-Grade Cloud Security</h4>
                                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                                        Tenant-isolated gym databases, encrypted TLS transmission, and automated multi-region daily backups.
                                    </p>
                                </div>
                            </div>

                            {/* FAQ Section */}
                            <div id="faq" className="mt-20 max-w-3xl mx-auto scroll-mt-14">
                                <div className="text-center mb-10">
                                    <span className="text-xs font-bold uppercase tracking-widest text-primary">
                                        Got Questions?
                                    </span>
                                    <h3 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
                                        Frequently Asked Questions
                                    </h3>
                                    <p className="mt-1.5 text-xs text-muted-foreground">
                                        Everything you need to know about GymPilot subscriptions and billing.
                                    </p>
                                </div>

                                <div className="space-y-3.5">
                                    {FAQS.map((faq, idx) => (
                                        <div
                                            key={idx}
                                            className="rounded-2xl border border-border/80 bg-card/70 p-4 sm:p-5 shadow-2xs transition-all hover:bg-card"
                                        >
                                            <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                                                <HelpCircle className="size-4 text-primary shrink-0" />
                                                <span>{faq.question}</span>
                                            </h4>
                                            <p className="mt-2 text-xs leading-relaxed text-muted-foreground pl-6">
                                                {faq.answer}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Feature Explanation Modal Dialog */}
                    <Dialog
                        open={selectedFeature !== null}
                        onOpenChange={(isOpen) => {
                            if (!isOpen) setSelectedFeature(null);
                        }}
                    >
                        {selectedFeature && (
                            <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto p-6 sm:p-7 rounded-2xl">
                                <DialogHeader className="text-left">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div
                                            className={`flex size-12 items-center justify-center rounded-2xl ${selectedFeature.colorTheme.iconBg} ${selectedFeature.colorTheme.iconText} shadow-xs shrink-0`}
                                        >
                                            <selectedFeature.icon className="size-6" />
                                        </div>
                                        <div>
                                            <span
                                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${selectedFeature.colorTheme.badgeColor}`}
                                            >
                                                {selectedFeature.badge}
                                            </span>
                                            <DialogTitle className="text-xl font-bold tracking-tight text-foreground mt-1">
                                                {selectedFeature.title}
                                            </DialogTitle>
                                        </div>
                                    </div>
                                    <DialogDescription className="text-xs font-medium text-muted-foreground leading-relaxed">
                                        {selectedFeature.subtitle}
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="space-y-5 my-2">
                                    {/* The Problem It Solves */}
                                    <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 dark:bg-amber-500/10 p-3.5">
                                        <span className="block text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-1">
                                            The Problem This Solves
                                        </span>
                                        <p className="text-xs text-foreground/90 leading-relaxed">
                                            {selectedFeature.problem}
                                        </p>
                                    </div>

                                    {/* How It Works (Step-by-step) */}
                                    <div>
                                        <span className="block text-xs font-bold uppercase tracking-wider text-foreground mb-2.5">
                                            How It Works
                                        </span>
                                        <div className="space-y-2">
                                            {selectedFeature.howItWorks.map((step, idx) => (
                                                <div
                                                    key={idx}
                                                    className="flex items-start gap-2.5 text-xs text-muted-foreground leading-relaxed"
                                                >
                                                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold mt-0.5">
                                                        {idx + 1}
                                                    </span>
                                                    <span className="text-foreground/90">
                                                        {step}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Key Benefits */}
                                    <div className="rounded-xl border border-border/80 bg-muted/30 p-3.5">
                                        <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                                            Why It Matters for Your Gym
                                        </span>
                                        <div className="space-y-1.5">
                                            {selectedFeature.benefits.map((benefit, idx) => (
                                                <div
                                                    key={idx}
                                                    className="flex items-start gap-2 text-xs"
                                                >
                                                    <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                                    <span className="text-foreground/90 font-medium">
                                                        {benefit}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Capabilities Tags */}
                                    <div>
                                        <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                                            Key Capabilities Included
                                        </span>
                                        <div className="flex flex-wrap gap-1.5">
                                            {selectedFeature.capabilities.map((cap, idx) => (
                                                <span
                                                    key={idx}
                                                    className="rounded-lg border border-border/80 bg-background px-2.5 py-1 text-[11px] font-medium text-foreground/80"
                                                >
                                                    {cap}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <DialogFooter className="mt-4 flex flex-row items-center justify-between gap-3 pt-3 border-t border-border/70">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setSelectedFeature(null)}
                                    >
                                        Close
                                    </Button>

                                    <Button size="sm" className="gap-1.5" asChild>
                                        <Link href={register()}>
                                            <span>Try GymPilot Free</span>
                                            <ArrowRight className="size-3.5" />
                                        </Link>
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        )}
                    </Dialog>

                    {/* Subscription Plan Checkout & Activation Dialog */}
                    <Dialog
                        open={selectedPlanForCheckout !== null}
                        onOpenChange={(isOpen) => {
                            if (!isOpen) {
                                setSelectedPlanForCheckout(null);
                                setCopiedUpi(false);
                            }
                        }}
                    >
                        {selectedPlanForCheckout && (
                            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto p-6 sm:p-7 rounded-3xl">
                                <DialogHeader className="text-left pb-3 border-b border-border/70">
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                                            {selectedPlanForCheckout.badge}
                                        </span>
                                        <span className="text-xs font-semibold text-muted-foreground">
                                            {selectedPlanForCheckout.memberCapacity}
                                        </span>
                                    </div>
                                    <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
                                        Subscribe to {selectedPlanForCheckout.name}
                                    </DialogTitle>
                                    <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
                                        Choose how you would like to activate your GymPilot subscription today.
                                    </DialogDescription>
                                </DialogHeader>

                                {/* Plan Price & Billing Interval Pill Switcher */}
                                <div className="mt-4 rounded-2xl border border-border/80 bg-muted/40 p-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                                Selected Tier
                                            </span>
                                            <span className="text-base font-bold text-foreground">
                                                {selectedPlanForCheckout.name}
                                            </span>
                                        </div>

                                        {/* Billing cycle pill inside modal */}
                                        <div className="inline-flex items-center p-0.5 rounded-full bg-background border border-border/70 shadow-2xs">
                                            <button
                                                type="button"
                                                onClick={() => setBillingCycle('monthly')}
                                                className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                                                    billingCycle === 'monthly'
                                                        ? 'bg-primary text-primary-foreground shadow-2xs'
                                                        : 'text-muted-foreground hover:text-foreground'
                                                }`}
                                            >
                                                Monthly
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setBillingCycle('annual')}
                                                className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                                                    billingCycle === 'annual'
                                                        ? 'bg-primary text-primary-foreground shadow-2xs'
                                                        : 'text-muted-foreground hover:text-foreground'
                                                }`}
                                            >
                                                <span>Annual</span>
                                                <span className="rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 text-[9px] font-bold px-1 py-0.2">
                                                    -20%
                                                </span>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="mt-3 pt-3 border-t border-border/60 flex items-baseline justify-between">
                                        <span className="text-xs font-medium text-muted-foreground">Subscription Rate</span>
                                        <div className="text-right">
                                            <div className="text-2xl font-extrabold tabular-nums tracking-tight text-foreground">
                                                ₹
                                                {(billingCycle === 'annual'
                                                    ? selectedPlanForCheckout.annualMonthlyPrice
                                                    : selectedPlanForCheckout.monthlyPrice
                                                ).toLocaleString('en-IN')}
                                                <span className="text-xs font-semibold text-muted-foreground"> / mo</span>
                                            </div>
                                            {billingCycle === 'annual' && (
                                                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold block">
                                                    Billed as ₹{selectedPlanForCheckout.annualTotal.toLocaleString('en-IN')}/year
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Activation Method Tabs */}
                                <div className="mt-4 flex rounded-xl bg-muted/60 p-1 border border-border/70">
                                    <button
                                        type="button"
                                        onClick={() => setActiveCheckoutTab('trial')}
                                        className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                                            activeCheckoutTab === 'trial'
                                                ? 'bg-background text-foreground shadow-xs'
                                                : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        14-Day Free Trial (₹0 Today)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveCheckoutTab('upi')}
                                        className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                                            activeCheckoutTab === 'upi'
                                                ? 'bg-background text-foreground shadow-xs'
                                                : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        Direct UPI Subscription
                                    </button>
                                </div>

                                {/* Tab 1: Free Trial */}
                                {activeCheckoutTab === 'trial' && (
                                    <div className="mt-4 space-y-4">
                                        <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 dark:bg-emerald-500/10 p-4">
                                            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-xs">
                                                <CheckCircle2 className="size-4 shrink-0" />
                                                <span>Zero Upfront Payment Required</span>
                                            </div>
                                            <p className="mt-1.5 text-xs text-foreground/80 leading-relaxed">
                                                Start your 14-day full-access trial for <strong>{selectedPlanForCheckout.name}</strong> immediately. No credit card required. Set up your gym, register members, and print standees today.
                                            </p>
                                        </div>

                                        <div className="space-y-2 text-xs">
                                            <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                                Instant Benefits:
                                            </span>
                                            <div className="flex items-center gap-2 text-foreground/90 font-medium">
                                                <Check className="size-3.5 text-emerald-500" />
                                                <span>Full access to all {selectedPlanForCheckout.name} features</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-foreground/90 font-medium">
                                                <Check className="size-3.5 text-emerald-500" />
                                                <span>Capacity for {selectedPlanForCheckout.memberCapacity}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-foreground/90 font-medium">
                                                <Check className="size-3.5 text-emerald-500" />
                                                <span>Instant turnstile &amp; payment acrylic standee printing</span>
                                            </div>
                                        </div>

                                        <Button size="lg" className="w-full rounded-xl font-semibold gap-2 shadow-md mt-2 cursor-pointer" asChild>
                                            <Link href={register()}>
                                                <span>Start 14-Day Free Trial</span>
                                                <ArrowRight className="size-4" />
                                            </Link>
                                        </Button>
                                    </div>
                                )}

                                {/* Tab 2: Direct UPI Payment */}
                                {activeCheckoutTab === 'upi' && (
                                    <div className="mt-4 space-y-4 text-center">
                                        <div className="p-4 rounded-2xl border border-border/80 bg-card flex flex-col items-center">
                                            <span className="text-[11px] font-bold uppercase tracking-wider text-primary mb-1">
                                                GymPilot Official SaaS Subscription Desk
                                            </span>
                                            <span className="text-2xl font-extrabold text-foreground tabular-nums">
                                                ₹
                                                {(billingCycle === 'annual'
                                                    ? selectedPlanForCheckout.annualTotal
                                                    : selectedPlanForCheckout.monthlyPrice
                                                ).toLocaleString('en-IN')}
                                            </span>
                                            <span className="text-[11px] text-muted-foreground mb-3">
                                                {billingCycle === 'annual' ? 'Full 1-Year Subscription' : '1-Month Subscription'}
                                            </span>

                                            {/* Dynamic UPI QR */}
                                            <div className="rounded-2xl border-2 border-primary/20 bg-white p-3 shadow-md">
                                                <QRCodeSVG
                                                    value={`upi://pay?pa=subscribe.gympilot@icici&pn=GymPilot%20SaaS&am=${
                                                        billingCycle === 'annual'
                                                            ? selectedPlanForCheckout.annualTotal
                                                            : selectedPlanForCheckout.monthlyPrice
                                                    }&cu=INR`}
                                                    size={160}
                                                    level="Q"
                                                />
                                            </div>

                                            {/* Copy UPI ID Chip */}
                                            <div className="mt-3 flex items-center justify-center gap-2">
                                                <code className="rounded-lg bg-muted px-2.5 py-1 text-xs font-mono font-medium text-foreground">
                                                    subscribe.gympilot@icici
                                                </code>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-7 px-2.5 text-xs gap-1 rounded-lg cursor-pointer"
                                                    onClick={handleCopyUpi}
                                                >
                                                    {copiedUpi ? (
                                                        <>
                                                            <Check className="size-3 text-emerald-500" />
                                                            <span className="text-emerald-600">Copied</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Copy className="size-3 text-muted-foreground" />
                                                            <span>Copy VPA</span>
                                                        </>
                                                    )}
                                                </Button>
                                            </div>

                                            <p className="mt-3 text-[11px] text-muted-foreground leading-relaxed">
                                                Scan with any UPI App (Google Pay, PhonePe, Paytm, BHIM, Any Bank App). After transferring, click below to complete your gym registration and activate your account.
                                            </p>
                                        </div>

                                        <Button size="lg" className="w-full rounded-xl font-semibold gap-2 shadow-md cursor-pointer" asChild>
                                            <Link href={register()}>
                                                <span>I Have Paid • Proceed to Register</span>
                                                <ArrowRight className="size-4" />
                                            </Link>
                                        </Button>
                                    </div>
                                )}

                                <DialogFooter className="mt-4 pt-3 border-t border-border/70 flex flex-row items-center justify-between">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setSelectedPlanForCheckout(null);
                                            setCopiedUpi(false);
                                        }}
                                    >
                                        Close
                                    </Button>

                                    <span className="text-[11px] text-muted-foreground font-medium inline-flex items-center gap-1">
                                        <ShieldCheck className="size-3.5 text-emerald-500" />
                                        <span>Instant Account Activation</span>
                                    </span>
                                </DialogFooter>
                            </DialogContent>
                        )}
                    </Dialog>
                </main>

                {/* Footer */}
                <footer className="border-t border-border/70 py-10 text-xs text-muted-foreground bg-card/20">
                    <div className="mx-auto flex max-w-6xl flex-col sm:flex-row items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center gap-2.5">
                            <img
                                src="/images/gympilot-icon.png"
                                alt="GymPilot"
                                className="size-7 rounded-lg object-contain border border-border/60 bg-white dark:bg-card p-0.5"
                            />
                            <span className="font-bold text-foreground">GymPilot</span>
                            <span className="text-muted-foreground text-[11px]">• Smart Fitness Technology</span>
                        </div>

                        <div className="flex items-center gap-6 font-medium">
                            <a href="#features" className="hover:text-foreground transition-colors">
                                Features
                            </a>
                            <a href="#pricing" className="hover:text-foreground transition-colors">
                                Subscription Plans
                            </a>
                            <a href="#faq" className="hover:text-foreground transition-colors">
                                FAQ
                            </a>
                        </div>

                        <p>© {new Date().getFullYear()} GymPilot. Engineered with precision.</p>
                    </div>
                </footer>
            </div>
        </>
    );
}