import { Head, Link, usePage } from '@inertiajs/react';
import { useState } from 'react';
import {
    Activity,
    ArrowRight,
    CalendarCheck2,
    CheckCircle2,
    ChevronRight,
    CreditCard,
    QrCode,
    ShieldAlert,
    TrendingUp,
    Wallet,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
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

export default function Welcome() {
    const { auth } = usePage<WelcomeProps>().props;
    const user = auth?.user;
    const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);

    return (
        <>
            <Head title="GymPilot - Smart Gym Management & Retention Engine" />

            <div className="flex min-h-screen flex-col bg-background text-foreground selection:bg-primary/15 selection:text-primary">
                {/* Frosted Apple Navigation */}
                <header className="sticky top-0 z-40 w-full border-b border-border/70 bg-background/80 backdrop-blur-xl transition-all">
                    <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center gap-3">
                            <img
                                src="/images/gympilot-logo.png"
                                alt="GymPilot Logo"
                                className="size-9 rounded-xl object-contain shadow-xs border border-border/60 bg-white dark:bg-card p-0.5"
                            />
                            <div className="flex flex-col">
                                <span className="text-sm font-bold tracking-tight text-foreground">GymPilot</span>
                                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider -mt-0.5">Smart Fitness Technology</span>
                            </div>
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
                                        src="/images/gympilot-logo.png"
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
                    <section className="border-t border-border/70 bg-card/40 py-16 md:py-20">
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
                </main>

                {/* Footer */}
                <footer className="border-t border-border/70 py-8 text-xs text-muted-foreground">
                    <div className="mx-auto flex max-w-6xl flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center gap-2.5">
                            <img
                                src="/images/gympilot-logo.png"
                                alt="GymPilot"
                                className="size-6 rounded-md object-contain border border-border/60 bg-white dark:bg-card p-0.5"
                            />
                            <span className="font-semibold text-foreground">GymPilot</span>
                            <span className="text-muted-foreground text-[11px]">• Smart Fitness Technology</span>
                        </div>
                        <p>© {new Date().getFullYear()} GymPilot. Engineered with precision.</p>
                    </div>
                </footer>
            </div>
        </>
    );
}