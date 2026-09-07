import { Head, Link, router } from '@inertiajs/react';
import { QRCodeSVG } from 'qrcode.react';
import { useState, type ReactNode } from 'react';
import { dashboard } from '@/routes';
import {
    Building2,
    Check,
    Copy,
    ExternalLink,
    QrCode,
    Receipt,
    Wallet,
    Printer,
    Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    StandeePrintDialog,
    printStandee,
    type StandeeType,
} from '@/components/standee-print-dialog';

type DashboardStats = {
    active_members: number;
    today_check_ins: number;
    expiring_memberships: number;
    open_signals: number;
    outstanding_balance: number;
};

type Recommendation = {
    type: string;
    label: string;
    reason: string;
};

type Signal = {
    id: string;

    member: {
        id: string;
        name: string;
        phone: string;
    };

    type: string;
    severity: string;

    evidence: {
        baseline_average?: number;
        recent_average?: number;
        decline_percentage?: number;
        expected_visits_per_week?: number | null;

        days_remaining?: number;
        membership_end_date?: string;
        plan?: string | null;
        price?: string | number;
    };

    detected_at: string;

    recommendation: Recommendation | null;

    latest_intervention: {
        id: string;
        type: string;
        notes: string | null;
        outcome: string | null;
        intervened_at: string;
    } | null;
};

type SignalPriority = {
    score: number;
    label: 'Act now' | 'Due soon' | 'Monitor';
    reason: string;
};

type FollowUpTask = {
    id: string;
    member_id: string;
    intervention_id: string | null;
    status: 'pending' | 'completed' | 'skipped';
    due_date: string;
    completed_at: string | null;
    completion_notes: string | null;
    is_overdue: boolean;

    member: {
        id: string;
        name: string;
    };

    intervention: {
        id: string;
        signal_id: string | null;
        type: string;
        notes: string | null;
        outcome: string | null;
        intervened_at: string;
    } | null;
};

type DailyWorkQueue = {
    overdue: {
        count: number;
        follow_ups: FollowUpTask[];
    };

    today: {
        count: number;
        follow_ups: FollowUpTask[];
        high_priority_signals: Signal[];
    };

    upcoming: {
        count: number;
        follow_ups: FollowUpTask[];
    };
};

type AttendanceQr = {
    organization_id: string;
    organization_name: string;
    payload: string;
};

type PaymentMethodBreakdown = {
    method: string;
    label: string;
    total_amount: number;
    count: number;
};

type RecentPayment = {
    id: string;
    amount: number;
    payment_method: string;
    paid_at: string;
    member: {
        id?: string;
        name: string;
        phone?: string | null;
    };
};

type PaymentReceiving = {
    organization_name: string;
    upi_id?: string | null;
    bank_account_name?: string | null;
    bank_name?: string | null;
    bank_account_number?: string | null;
    bank_ifsc_code?: string | null;
    summary: {
        total_received: number;
        today_received: number;
        this_month_received: number;
        method_breakdown: PaymentMethodBreakdown[];
        recent_payments: RecentPayment[];
    };
};

type DashboardProps = {
    stats: DashboardStats;
    signals: Signal[];
    followUpTasks: FollowUpTask[];
    dailyWorkQueue: DailyWorkQueue;
    attendanceQr: AttendanceQr;
    paymentReceiving?: PaymentReceiving;
};

type InterventionType =
    | 'call_member'
    | 'send_whatsapp'
    | 'in_person'
    | 'follow_up'
    | 'other';

type DismissalReason =
    | 'member_travelling'
    | 'already_handled'
    | 'not_relevant'
    | 'member_requested_pause'
    | 'other';

const interventionTypes: {
    value: InterventionType;
    label: string;
}[] = [
        {
            value: 'call_member',
            label: 'Call member',
        },
        {
            value: 'send_whatsapp',
            label: 'Send WhatsApp message',
        },
        {
            value: 'in_person',
            label: 'Talk in person',
        },
        {
            value: 'follow_up',
            label: 'Schedule follow-up',
        },
        {
            value: 'other',
            label: 'Other',
        },
    ];

const dismissalReasons: {
    value: DismissalReason;
    label: string;
}[] = [
        {
            value: 'member_travelling',
            label: 'Member is travelling',
        },
        {
            value: 'already_handled',
            label: 'Already handled elsewhere',
        },
        {
            value: 'not_relevant',
            label: 'Not relevant',
        },
        {
            value: 'member_requested_pause',
            label: 'Member requested a pause',
        },
        {
            value: 'other',
            label: 'Other',
        },
    ];

function formatFollowUpDate(date: string): string {
    return new Date(`${date}T00:00:00`).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

function getGreeting(): string {
    const hour = new Date().getHours();

    if (hour < 12) {
        return 'Good morning';
    }

    if (hour < 17) {
        return 'Good afternoon';
    }

    return 'Good evening';
}

export default function Dashboard({
    stats,
    signals,
    followUpTasks,
    dailyWorkQueue,
    attendanceQr,
    paymentReceiving,
}: DashboardProps) {
    const [copiedUpi, setCopiedUpi] = useState(false);
    const [previewStandee, setPreviewStandee] = useState<StandeeType | null>(null);

    function copyUpi(text: string) {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedUpi(true);
        setTimeout(() => setCopiedUpi(false), 2000);
    }

    const workQueueCount =
        dailyWorkQueue.overdue.count +
        dailyWorkQueue.today.count +
        dailyWorkQueue.upcoming.count;

    const todayWorkCount = dailyWorkQueue.today.count;
    const overdueWorkCount = dailyWorkQueue.overdue.count;

    return (
        <>
            <Head title="Dashboard" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-semibold">
                        {getGreeting()}
                    </h1>

                    <p className="mt-1 text-sm text-muted-foreground">
                        Here’s what needs your attention today.
                    </p>
                </div>

                {/* Today context */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                    <span>
                        <strong className="font-medium text-foreground">
                            {stats.today_check_ins}
                        </strong>{' '}
                        check-ins today
                    </span>

                    <span className="hidden h-4 w-px bg-border sm:block" />

                    <Link
                        href="/members?membership_status=expiring"
                        className="hover:text-foreground hover:underline"
                    >
                        <strong className="font-medium text-foreground">
                            {stats.expiring_memberships}
                        </strong>{' '}
                        expiring memberships
                    </Link>

                    <span className="hidden h-4 w-px bg-border sm:block" />

                    <Link
                        href="/members?financial_status=outstanding"
                        className="hover:text-foreground hover:underline"
                    >
                        <strong className="font-medium text-foreground">
                            {formatCurrency(stats.outstanding_balance)}
                        </strong>{' '}
                        outstanding
                    </Link>

                    <span className="hidden h-4 w-px bg-border sm:block" />

                    <Link
                        href="#work-queue"
                        className="hover:text-foreground hover:underline"
                    >
                        <strong className="font-medium text-foreground">
                            {workQueueCount}
                        </strong>{' '}
                        follow-up items
                    </Link>
                </div>

                {/* Operational summary */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        label="Active Members"
                        value={stats.active_members}
                        href="/members?membership_status=active"
                        action="View members"
                    />

                    <StatCard
                        label="Today's Check-ins"
                        value={stats.today_check_ins}
                        href="/attendance"
                        action="View attendance"
                    />

                    <StatCard
                        label="Expiring Soon"
                        value={stats.expiring_memberships}
                        href="/members?membership_status=expiring"
                        action="View expiring"
                    />

                    <StatCard
                        label="Open Signals"
                        value={stats.open_signals}
                        href="#attention"
                        action="Review signals"
                    />
                </div>

                {/* GymPilot check-in QR */}
                <section className="rounded-xl border p-5">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                        <div className="min-w-0">
                            <h2 className="text-lg font-semibold">
                                GymPilot Check-in QR
                            </h2>

                            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                                Display this QR code at your gym entrance so members
                                can scan it with the GymPilot mobile app to check in.
                            </p>

                            <div className="mt-5 rounded-lg bg-muted/40 p-4">
                                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    Gym
                                </p>

                                <p className="mt-1 text-base font-medium">
                                    {attendanceQr.organization_name}
                                </p>

                                <p className="mt-3 break-all font-mono text-xs text-muted-foreground">
                                    {attendanceQr.payload}
                                </p>
                            </div>

                            <div className="mt-4 flex flex-wrap items-center gap-2">
                                <Button
                                    type="button"
                                    onClick={() => printStandee('checkin')}
                                    className="gap-1.5"
                                >
                                    <Printer className="size-4" />
                                    <span>Print Check-in QR</span>
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setPreviewStandee('checkin')}
                                    className="gap-1.5"
                                >
                                    <Eye className="size-4" />
                                    <span>Preview Standee</span>
                                </Button>
                            </div>
                        </div>

                        <div className="flex shrink-0 justify-center rounded-xl border bg-white p-5">
                            <QRCodeSVG
                                value={attendanceQr.payload}
                                size={220}
                                includeMargin
                            />
                        </div>
                    </div>
                </section>

                {/* Payment Receiving Desk & Collections Summary */}
                <section className="rounded-2xl border border-border/80 bg-card/40 p-5 space-y-6 shadow-2xs">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                            <div className="flex items-center gap-2">
                                <Wallet className="size-5 text-primary" />
                                <h2 className="text-lg font-bold tracking-tight text-foreground">
                                    Payment Receiving Desk
                                </h2>
                                {paymentReceiving?.upi_id && (
                                    <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                        UPI Active
                                    </span>
                                )}
                            </div>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                Scan &amp; Pay counter QR code for member collections and overview of all amounts received.
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <Link
                                href="/settings/payment"
                                className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
                            >
                                <ExternalLink className="size-3" />
                                <span>Payment Settings</span>
                            </Link>
                        </div>
                    </div>

                    {/* Revenue Summary Stats */}
                    <div className="grid gap-3.5 grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-xl border border-border/80 bg-muted/20 p-4">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                Total Collected
                            </p>
                            <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">
                                {formatCurrency(paymentReceiving?.summary.total_received ?? 0)}
                            </p>
                            <p className="mt-1 text-[11px] text-muted-foreground">
                                All-time receipts
                            </p>
                        </div>

                        <div className="rounded-xl border border-border/80 bg-muted/20 p-4">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                This Month
                            </p>
                            <p className="mt-1 text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                                {formatCurrency(paymentReceiving?.summary.this_month_received ?? 0)}
                            </p>
                            <p className="mt-1 text-[11px] text-muted-foreground">
                                Calendar month
                            </p>
                        </div>

                        <div className="rounded-xl border border-border/80 bg-muted/20 p-4">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                Today&apos;s Collection
                            </p>
                            <p className="mt-1 text-2xl font-bold tracking-tight text-primary">
                                {formatCurrency(paymentReceiving?.summary.today_received ?? 0)}
                            </p>
                            <p className="mt-1 text-[11px] text-muted-foreground">
                                Collected today
                            </p>
                        </div>

                        <Link
                            href="/members?financial_status=outstanding"
                            className="group rounded-xl border border-border/80 bg-muted/20 p-4 hover:border-destructive/40 transition-colors"
                        >
                            <div className="flex items-center justify-between">
                                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                    Outstanding Dues
                                </p>
                                <span className="text-[10px] text-primary group-hover:underline">View →</span>
                            </div>
                            <p className="mt-1 text-2xl font-bold tracking-tight text-destructive">
                                {formatCurrency(stats.outstanding_balance)}
                            </p>
                            <p className="mt-1 text-[11px] text-muted-foreground">
                                Pending from members
                            </p>
                        </Link>
                    </div>

                    {/* QR Standee & Receipts Grid */}
                    <div className="grid gap-6 lg:grid-cols-12">
                        {/* Desk Standee QR */}
                        <div className="lg:col-span-5 rounded-xl border border-border/80 bg-background/60 p-5 flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between pb-3 border-b border-border/60">
                                    <div className="flex items-center gap-2">
                                        <QrCode className="size-4 text-primary" />
                                        <h3 className="text-sm font-semibold text-foreground">
                                            Desk UPI QR Standee
                                        </h3>
                                    </div>
                                    <span className="text-[11px] font-medium text-muted-foreground">
                                        Scan &amp; Pay
                                    </span>
                                </div>

                                {paymentReceiving?.upi_id ? (
                                    <div className="mt-4 flex flex-col sm:flex-row items-center gap-4">
                                        <div className="bg-white p-3 rounded-2xl border shadow-xs shrink-0 flex items-center justify-center dark:bg-white">
                                            <QRCodeSVG
                                                value={`upi://pay?pa=${encodeURIComponent(paymentReceiving.upi_id)}&pn=${encodeURIComponent(paymentReceiving.organization_name || 'GymPilot')}&cu=INR`}
                                                size={140}
                                                level="M"
                                            />
                                        </div>

                                        <div className="flex flex-col gap-2.5 min-w-0 flex-1 text-center sm:text-left">
                                            <div>
                                                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                                    UPI VPA
                                                </span>
                                                <div className="mt-1 flex items-center justify-center sm:justify-start gap-1.5">
                                                    <code className="text-xs font-mono font-bold bg-muted/60 px-2 py-1 rounded-lg border border-border/80 truncate max-w-[190px]">
                                                        {paymentReceiving.upi_id}
                                                    </code>
                                                    <button
                                                        type="button"
                                                        className="inline-flex size-7 items-center justify-center rounded-lg border border-border/80 hover:bg-muted/60 transition-colors shrink-0"
                                                        onClick={() => copyUpi(paymentReceiving.upi_id!)}
                                                        title="Copy UPI ID"
                                                    >
                                                        {copiedUpi ? (
                                                            <Check className="size-3 text-emerald-600" />
                                                        ) : (
                                                            <Copy className="size-3 text-muted-foreground" />
                                                        )}
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="rounded-lg border border-border/60 bg-muted/30 p-2 text-[11px] space-y-1">
                                                <div className="flex items-center justify-between text-muted-foreground">
                                                    <span>Payee:</span>
                                                    <span className="font-medium text-foreground truncate max-w-[140px]">{paymentReceiving.organization_name}</span>
                                                </div>
                                                {paymentReceiving.bank_name && (
                                                    <div className="flex items-center justify-between text-muted-foreground">
                                                        <span>Bank:</span>
                                                        <span className="font-medium text-foreground">{paymentReceiving.bank_name}</span>
                                                    </div>
                                                )}
                                                {paymentReceiving.bank_account_number && (
                                                    <div className="flex items-center justify-between text-muted-foreground">
                                                        <span>Account:</span>
                                                        <span className="font-mono font-medium text-foreground">{paymentReceiving.bank_account_number}</span>
                                                    </div>
                                                )}
                                                {paymentReceiving.bank_ifsc_code && (
                                                    <div className="flex items-center justify-between text-muted-foreground">
                                                        <span>IFSC:</span>
                                                        <span className="font-mono font-medium text-foreground uppercase">{paymentReceiving.bank_ifsc_code}</span>
                                                    </div>
                                                )}
                                            </div>

                                            <p className="text-[10px] text-muted-foreground">
                                                Compatible with GPay, PhonePe, Paytm, BHIM &amp; UPI.
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-6 text-center space-y-2.5">
                                        <div className="size-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                                            <QrCode className="size-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold">No UPI ID Configured</p>
                                            <p className="text-xs text-muted-foreground max-w-xs mt-0.5">
                                                Add your gym&apos;s UPI ID in settings to activate your desk QR code.
                                            </p>
                                        </div>
                                        <Link
                                            href="/settings/payment"
                                            className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
                                        >
                                            Configure Now →
                                        </Link>
                                    </div>
                                )}
                            </div>

                            {paymentReceiving?.upi_id && (
                                <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between gap-2">
                                    <span className="text-[11px] text-muted-foreground">Printable Desk Standee</span>
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            type="button"
                                            onClick={() => setPreviewStandee('payment')}
                                            className="inline-flex items-center gap-1 rounded-lg border border-border/80 bg-background px-2.5 py-1 text-xs font-medium hover:bg-muted/60 transition-colors"
                                        >
                                            <Eye className="size-3" />
                                            <span>Preview</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => printStandee('payment')}
                                            className="inline-flex items-center gap-1 rounded-lg bg-primary text-primary-foreground px-2.5 py-1 text-xs font-medium hover:opacity-90 transition-opacity"
                                        >
                                            <Printer className="size-3" />
                                            <span>Print Standee</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Channel Breakdown & Recent Receipts */}
                        <div className="lg:col-span-7 rounded-xl border border-border/80 bg-background/60 p-5 flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between pb-3 border-b border-border/60">
                                    <div className="flex items-center gap-2">
                                        <Receipt className="size-4 text-primary" />
                                        <h3 className="text-sm font-semibold text-foreground">
                                            Payment Methods &amp; Recent Receipts
                                        </h3>
                                    </div>
                                    <span className="text-[11px] text-muted-foreground">
                                        Summary of amounts received
                                    </span>
                                </div>

                                {/* Breakdown by Payment Method */}
                                <div className="mt-4">
                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block mb-2">
                                        Collection Channels
                                    </span>
                                    {paymentReceiving?.summary.method_breakdown && paymentReceiving.summary.method_breakdown.length > 0 ? (
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                            {paymentReceiving.summary.method_breakdown.map((item) => (
                                                <div
                                                    key={item.method}
                                                    className="rounded-lg border border-border/70 bg-muted/20 p-2 text-xs"
                                                >
                                                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                                                        <span className="font-semibold uppercase">{item.label}</span>
                                                        <span>({item.count})</span>
                                                    </div>
                                                    <p className="mt-1 font-bold text-foreground text-sm">
                                                        {formatCurrency(item.total_amount)}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="rounded-lg border border-dashed border-border/80 p-2.5 text-center text-xs text-muted-foreground">
                                            No collection records logged yet
                                        </div>
                                    )}
                                </div>

                                {/* Recent Receipts */}
                                <div className="mt-4">
                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block mb-2">
                                        Recent Transactions
                                    </span>

                                    {paymentReceiving?.summary.recent_payments && paymentReceiving.summary.recent_payments.length > 0 ? (
                                        <div className="divide-y divide-border/60 rounded-lg border border-border/70 overflow-hidden bg-card/30">
                                            {paymentReceiving.summary.recent_payments.map((payment) => (
                                                <div
                                                    key={payment.id}
                                                    className="flex items-center justify-between p-2.5 text-xs hover:bg-muted/30 transition-colors"
                                                >
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <div className="size-6 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 font-bold text-[11px]">
                                                            ₹
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-medium text-foreground truncate">
                                                                {payment.member.name}
                                                            </p>
                                                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                                                <span>{formatDateTime(payment.paid_at)}</span>
                                                                <span>•</span>
                                                                <span className="uppercase font-mono bg-muted/80 px-1 py-0.2 rounded border border-border/60 text-[9px]">
                                                                    {payment.payment_method}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="text-right shrink-0">
                                                        <span className="font-bold text-xs text-emerald-600 dark:text-emerald-400">
                                                            +{formatCurrency(payment.amount)}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-muted-foreground text-center py-3">
                                            No recent payments to display.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Daily work queue */}
                <section
                    id="work-queue"
                    className="scroll-mt-6 rounded-xl border p-5"
                >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <h2 className="text-lg font-semibold">
                                Daily Work Queue
                            </h2>

                            <p className="mt-1 text-sm text-muted-foreground">
                                The work that needs to be handled, ordered by
                                urgency.
                            </p>
                        </div>

                        <span className="w-fit rounded-full border px-2.5 py-1 text-sm font-medium">
                            {workQueueCount}{' '}
                            {workQueueCount === 1 ? 'item' : 'items'}
                        </span>
                    </div>

                    <div className="mt-5 grid gap-4 lg:grid-cols-3">
                        <WorkQueueColumn
                            title="Overdue"
                            description="Follow-ups that were not completed on time."
                            count={dailyWorkQueue.overdue.count}
                            tone="overdue"
                        >
                            {dailyWorkQueue.overdue.follow_ups.map(
                                (task) => (
                                    <FollowUpTaskCard
                                        key={task.id}
                                        task={task}
                                    />
                                ),
                            )}
                        </WorkQueueColumn>

                        <WorkQueueColumn
                            title="Today"
                            description="Priority work for today."
                            count={dailyWorkQueue.today.count}
                            tone="today"
                        >
                            {dailyWorkQueue.today.high_priority_signals.map(
                                (signal) => (
                                    <SignalQueueCard
                                        key={`signal-${signal.id}`}
                                        signal={signal}
                                    />
                                ),
                            )}

                            {dailyWorkQueue.today.follow_ups.map((task) => (
                                <FollowUpTaskCard
                                    key={`follow-up-${task.id}`}
                                    task={task}
                                />
                            ))}
                        </WorkQueueColumn>

                        <WorkQueueColumn
                            title="Upcoming"
                            description="Follow-ups scheduled after today."
                            count={dailyWorkQueue.upcoming.count}
                            tone="upcoming"
                        >
                            {dailyWorkQueue.upcoming.follow_ups.map(
                                (task) => (
                                    <FollowUpTaskCard
                                        key={task.id}
                                        task={task}
                                    />
                                ),
                            )}
                        </WorkQueueColumn>
                    </div>

                    {todayWorkCount === 0 && overdueWorkCount === 0 && (
                        <div className="mt-4 rounded-lg border border-dashed p-6 text-center">
                            <p className="font-medium">
                                Nothing urgent is waiting.
                            </p>

                            <p className="mt-1 text-sm text-muted-foreground">
                                New work will appear here as signals and
                                follow-ups become actionable.
                            </p>
                        </div>
                    )}
                </section>

                {/* Needs attention today */}
                <section
                    id="attention"
                    className="scroll-mt-6 rounded-xl border p-5"
                >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <h2 className="text-lg font-semibold">
                                Needs Attention Today
                            </h2>

                            <p className="mt-1 text-sm text-muted-foreground">
                                Open signals are prioritized by severity,
                                urgency, and recent action context.
                            </p>
                        </div>

                        <span className="w-fit rounded-full border px-2.5 py-1 text-sm font-medium">
                            {signals.length}{' '}
                            {signals.length === 1 ? 'item' : 'items'}
                        </span>
                    </div>

                    <div className="mt-5 space-y-4">
                        {signals.length === 0 ? (
                            <div className="rounded-lg border border-dashed p-8 text-center">
                                <p className="font-medium">
                                    Nothing needs attention right now.
                                </p>

                                <p className="mt-1 text-sm text-muted-foreground">
                                    Open signals have been cleared.
                                </p>
                            </div>
                        ) : (
                            sortSignalsByPriority(signals).map((signal) => (
                                <SignalCard
                                    key={signal.id}
                                    signal={signal}
                                />
                            ))
                        )}
                    </div>
                </section>

                {/* Pending follow-ups */}
                <section className="rounded-xl border p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <h2 className="text-lg font-semibold">
                                Pending Follow-ups
                            </h2>

                            <p className="mt-1 text-sm text-muted-foreground">
                                All outstanding follow-up tasks.
                            </p>
                        </div>

                        <span className="w-fit rounded-full border px-2.5 py-1 text-sm font-medium">
                            {followUpTasks.length}{' '}
                            {followUpTasks.length === 1
                                ? 'task'
                                : 'tasks'}
                        </span>
                    </div>

                    <div className="mt-5 space-y-3">
                        {followUpTasks.length === 0 ? (
                            <div className="rounded-lg border border-dashed p-6 text-center">
                                <p className="font-medium">
                                    No pending follow-ups.
                                </p>

                                <p className="mt-1 text-sm text-muted-foreground">
                                    New follow-ups will appear here after an
                                    intervention is recorded.
                                </p>
                            </div>
                        ) : (
                            followUpTasks.map((task) => (
                                <FollowUpTaskRow
                                    key={task.id}
                                    task={task}
                                />
                            ))
                        )}
                    </div>
                </section>
            </div>

            <StandeePrintDialog
                open={previewStandee !== null}
                onOpenChange={(isOpen) => {
                    if (!isOpen) setPreviewStandee(null);
                }}
                type={previewStandee}
                organizationName={
                    paymentReceiving?.organization_name ||
                    attendanceQr.organization_name
                }
                checkinPayload={attendanceQr.payload}
                upiId={paymentReceiving?.upi_id}
                upiQrUrl={
                    paymentReceiving?.upi_id
                        ? `upi://pay?pa=${encodeURIComponent(paymentReceiving.upi_id)}&pn=${encodeURIComponent(paymentReceiving.organization_name)}&cu=INR`
                        : undefined
                }
                bankDetails={{
                    bankName: paymentReceiving?.bank_name,
                    bankAccountName: paymentReceiving?.bank_account_name,
                    bankAccountNumber: paymentReceiving?.bank_account_number,
                    bankIfscCode: paymentReceiving?.bank_ifsc_code,
                }}
            />
        </>
    );
}

type WorkQueueColumnProps = {
    title: string;
    description: string;
    count: number;
    tone: 'overdue' | 'today' | 'upcoming';
    children: ReactNode;
};

function WorkQueueColumn({
    title,
    description,
    count,
    tone,
    children,
}: WorkQueueColumnProps) {
    const items = Array.isArray(children)
        ? children.filter(Boolean)
        : children
            ? [children]
            : [];

    const toneClass = getQueueToneClass(tone);

    return (
        <div className="rounded-lg border p-4">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h3 className="font-medium">{title}</h3>

                    <p className="mt-1 text-xs text-muted-foreground">
                        {description}
                    </p>
                </div>

                <span
                    className={`rounded-full border px-2 py-1 text-xs font-medium ${toneClass}`}
                >
                    {count}
                </span>
            </div>

            <div className="mt-4 space-y-3">
                {items.length === 0 ? (
                    <p className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
                        Nothing here.
                    </p>
                ) : (
                    items
                )}
            </div>
        </div>
    );
}

function FollowUpTaskCard({ task }: { task: FollowUpTask }) {
    const [processing, setProcessing] = useState(false);

    function handleAction(action: 'complete' | 'skip'): void {
        if (processing) {
            return;
        }

        setProcessing(true);

        router.patch(
            `/follow-up-tasks/${task.id}/${action}`,
            {},
            {
                preserveScroll: true,
                onFinish: () => {
                    setProcessing(false);
                },
            },
        );
    }

    return (
        <div className="rounded-lg border p-3">
            <div className="flex items-start justify-between gap-3">
                <Link
                    href={`/members/${task.member.id}`}
                    className="min-w-0 font-medium hover:underline"
                >
                    {task.member.name}
                </Link>

                <span
                    className={`shrink-0 rounded-full border px-2 py-1 text-[11px] font-medium ${task.is_overdue
                        ? 'border-destructive/30 text-destructive'
                        : 'border-border text-muted-foreground'
                        }`}
                >
                    {task.is_overdue ? 'Overdue' : 'Follow-up'}
                </span>
            </div>

            <p className="mt-1 text-xs text-muted-foreground">
                {task.intervention
                    ? getInterventionLabel(task.intervention.type)
                    : 'Follow-up'}
            </p>

            <p className="mt-2 text-xs text-muted-foreground">
                Due {formatFollowUpDate(task.due_date)}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
                <button
                    type="button"
                    onClick={() => handleAction('complete')}
                    disabled={processing}
                    className="rounded-md bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {processing ? 'Saving...' : 'Complete'}
                </button>

                <button
                    type="button"
                    onClick={() => handleAction('skip')}
                    disabled={processing}
                    className="rounded-md border px-2.5 py-1.5 text-xs font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                >
                    Skip
                </button>
            </div>
        </div>
    );
}

function SignalQueueCard({ signal }: { signal: Signal }) {
    const priority = getSignalPriority(signal);

    return (
        <div className="rounded-lg border p-3">
            <div className="flex items-start justify-between gap-3">
                <Link
                    href={`/members/${signal.member.id}`}
                    className="font-medium hover:underline"
                >
                    {signal.member.name}
                </Link>

                <span className="rounded-full border border-destructive/30 px-2 py-1 text-[11px] font-medium text-destructive">
                    {priority.label}
                </span>
            </div>

            <p className="mt-1 text-xs text-muted-foreground">
                {getSignalTitle(signal.type)}
            </p>

            <p className="mt-2 text-xs text-muted-foreground">
                {priority.reason}
            </p>
        </div>
    );
}

function FollowUpTaskRow({ task }: { task: FollowUpTask }) {
    const [processing, setProcessing] = useState(false);

    function handleAction(action: 'complete' | 'skip'): void {
        if (processing) {
            return;
        }

        setProcessing(true);

        router.patch(
            `/follow-up-tasks/${task.id}/${action}`,
            {},
            {
                preserveScroll: true,
                onFinish: () => {
                    setProcessing(false);
                },
            },
        );
    }

    return (
        <div className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
                <Link
                    href={`/members/${task.member.id}`}
                    className="font-medium hover:underline"
                >
                    {task.member.name}
                </Link>

                <p className="mt-1 text-sm text-muted-foreground">
                    {task.intervention
                        ? getInterventionLabel(task.intervention.type)
                        : 'Follow-up'}
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                    Due {formatFollowUpDate(task.due_date)}
                </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <span
                    className={`rounded-full border px-2.5 py-1 text-xs font-medium ${task.is_overdue
                        ? 'border-destructive/30 text-destructive'
                        : 'border-border text-muted-foreground'
                        }`}
                >
                    {task.is_overdue ? 'Overdue' : 'Pending'}
                </span>

                <button
                    type="button"
                    onClick={() => handleAction('complete')}
                    disabled={processing}
                    className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {processing ? 'Saving...' : 'Complete'}
                </button>

                <button
                    type="button"
                    onClick={() => handleAction('skip')}
                    disabled={processing}
                    className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                >
                    Skip
                </button>
            </div>
        </div>
    );
}

function getQueueToneClass(
    tone: 'overdue' | 'today' | 'upcoming',
): string {
    switch (tone) {
        case 'overdue':
            return 'border-destructive/30 text-destructive';

        case 'today':
            return 'border-amber-500/30 text-amber-600 dark:text-amber-400';

        default:
            return 'border-border text-muted-foreground';
    }
}

type SignalCardProps = {
    signal: Signal;
};

function SignalCard({ signal }: SignalCardProps) {
    const [showInterventionForm, setShowInterventionForm] =
        useState(false);

    const [showDismissForm, setShowDismissForm] =
        useState(false);

    const [type, setType] = useState<InterventionType>(
        getDefaultInterventionType(signal),
    );

    const [notes, setNotes] = useState('');

    const [outcome, setOutcome] = useState('');

    const [dismissalReason, setDismissalReason] =
        useState<DismissalReason>('other');

    const [dismissalNotes, setDismissalNotes] = useState('');

    const [processing, setProcessing] = useState(false);

    const [error, setError] = useState<string | null>(null);

    const isAttendanceDecline =
        signal.type === 'attendance_decline';

    const isMembershipExpiring =
        signal.type === 'membership_expiring';

    const severity = getSeverityPresentation(
        signal.severity,
    );

    const signalTitle = getSignalTitle(signal.type);
    const priority = getSignalPriority(signal);

    function submitIntervention() {
        setProcessing(true);
        setError(null);

        router.post(
            `/members/${signal.member.id}/interventions`,
            {
                signal_id: signal.id,
                type,
                notes: notes || null,
                outcome: outcome || null,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setShowInterventionForm(false);
                    setNotes('');
                    setOutcome('');
                },
                onError: (errors) => {
                    const firstError = Object.values(errors)[0];

                    setError(
                        firstError ??
                        'Unable to record the intervention.',
                    );
                },
                onFinish: () => {
                    setProcessing(false);
                },
            },
        );
    }

    function submitDismissal() {
        setProcessing(true);
        setError(null);

        router.post(
            `/members/${signal.member.id}/signals/${signal.id}/dismiss`,
            {
                reason: dismissalReason,
                notes: dismissalNotes || null,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setShowDismissForm(false);
                    setDismissalNotes('');
                    setDismissalReason('other');
                },
                onError: (errors) => {
                    const firstError = Object.values(errors)[0];

                    setError(
                        firstError ??
                        'Unable to dismiss the signal.',
                    );
                },
                onFinish: () => {
                    setProcessing(false);
                },
            },
        );
    }

    function cancelForms() {
        if (processing) {
            return;
        }

        setShowInterventionForm(false);
        setShowDismissForm(false);
        setError(null);
    }

    return (
        <article className="overflow-hidden rounded-xl border">
            <div className={severity.indicatorClass} />

            <div className="p-5">
                {/* Signal header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <Link
                                href={`/members/${signal.member.id}`}
                                className="text-base font-semibold hover:underline"
                            >
                                {signal.member.name}
                            </Link>

                            <span
                                className={`rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${severity.badgeClass}`}
                            >
                                {signal.severity}
                            </span>

                            <span
                                className={`rounded-full border px-2.5 py-1 text-xs font-medium ${getPriorityBadgeClass(priority.label)}`}
                            >
                                {priority.label}
                            </span>
                        </div>

                        <p className="mt-1 text-sm text-muted-foreground">
                            {signalTitle}
                        </p>

                        <p className="mt-2 text-xs text-muted-foreground">
                            {priority.reason}
                        </p>
                    </div>

                    <Link
                        href={`/members/${signal.member.id}`}
                        className="w-fit rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted"
                    >
                        View Member
                    </Link>
                </div>

                {/* Evidence */}
                {isAttendanceDecline && (
                    <div className="mt-5">
                        {signal.evidence.decline_percentage !==
                            undefined && (
                                <p className="text-sm">
                                    Attendance declined by{' '}
                                    <span className="font-semibold">
                                        {signal.evidence.decline_percentage}
                                        %
                                    </span>
                                    .
                                </p>
                            )}

                        <div className="mt-3 grid gap-3 sm:grid-cols-3">
                            {signal.evidence
                                .baseline_average !== undefined && (
                                    <EvidenceItem
                                        label="Baseline"
                                        value={`${signal.evidence.baseline_average}/week`}
                                    />
                                )}

                            {signal.evidence.recent_average !==
                                undefined && (
                                    <EvidenceItem
                                        label="Recent"
                                        value={`${signal.evidence.recent_average}/week`}
                                    />
                                )}

                            {signal.evidence
                                .expected_visits_per_week !==
                                undefined &&
                                signal.evidence
                                    .expected_visits_per_week !== null && (
                                    <EvidenceItem
                                        label="Expected"
                                        value={`${signal.evidence.expected_visits_per_week}/week`}
                                    />
                                )}
                        </div>

                        {signal.evidence.expected_visits_per_week !==
                            undefined &&
                            signal.evidence.expected_visits_per_week !==
                            null &&
                            signal.evidence.recent_average !==
                            undefined && (
                                <AttendanceContext
                                    expected={
                                        signal.evidence
                                            .expected_visits_per_week
                                    }
                                    recent={
                                        signal.evidence.recent_average
                                    }
                                />
                            )}
                    </div>
                )}

                {isMembershipExpiring && (
                    <div className="mt-5">
                        {signal.evidence.days_remaining !==
                            undefined && (
                                <p className="text-sm">
                                    Membership expires in{' '}
                                    <span className="font-semibold">
                                        {signal.evidence.days_remaining}{' '}
                                        {signal.evidence.days_remaining === 1
                                            ? 'day'
                                            : 'days'}
                                    </span>
                                    .
                                </p>
                            )}

                        <div className="mt-3 grid gap-3 sm:grid-cols-3">
                            {signal.evidence.membership_end_date && (
                                <EvidenceItem
                                    label="Ends"
                                    value={formatDate(
                                        signal.evidence
                                            .membership_end_date,
                                    )}
                                />
                            )}

                            {signal.evidence.plan && (
                                <EvidenceItem
                                    label="Plan"
                                    value={signal.evidence.plan}
                                />
                            )}

                            {signal.evidence.price !==
                                undefined && (
                                    <EvidenceItem
                                        label="Price"
                                        value={`₹${signal.evidence.price}`}
                                    />
                                )}
                        </div>
                    </div>
                )}

                {/* Recommendation */}
                {signal.recommendation && (
                    <div className="mt-5 rounded-lg bg-muted/40 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Recommended action
                        </p>

                        <p className="mt-1 font-medium">
                            {signal.recommendation.label}
                        </p>

                        <p className="mt-1 text-sm text-muted-foreground">
                            {signal.recommendation.reason}
                        </p>

                        {!showInterventionForm &&
                            !showDismissForm && (
                                <div className="mt-4 flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowInterventionForm(true)
                                        }
                                        className="inline-flex rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
                                    >
                                        Record Intervention
                                    </button>

                                    {signal.member.phone && (
                                        <a
                                            href={`tel:${signal.member.phone}`}
                                            className="inline-flex rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted"
                                        >
                                            Call
                                        </a>
                                    )}

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowDismissForm(true);
                                            setError(null);
                                        }}
                                        className="inline-flex rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted"
                                    >
                                        Dismiss
                                    </button>
                                </div>
                            )}
                    </div>
                )}

                {/* Intervention form */}
                {showInterventionForm && (
                    <div className="mt-5 rounded-lg border p-4">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h3 className="font-medium">
                                    Record intervention
                                </h3>

                                <p className="mt-1 text-sm text-muted-foreground">
                                    Record what you actually did. The signal
                                    stays open until its condition is resolved.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={cancelForms}
                                disabled={processing}
                                className="text-sm text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Cancel
                            </button>
                        </div>

                        <div className="mt-4 grid gap-4">
                            <div>
                                <label
                                    htmlFor={`intervention-type-${signal.id}`}
                                    className="text-sm font-medium"
                                >
                                    Intervention
                                </label>

                                <select
                                    id={`intervention-type-${signal.id}`}
                                    value={type}
                                    onChange={(event) =>
                                        setType(
                                            event.target
                                                .value as InterventionType,
                                        )
                                    }
                                    disabled={processing}
                                    className="mt-1.5 h-10 w-full rounded-md border bg-background px-3 text-sm"
                                >
                                    {interventionTypes.map(
                                        (option) => (
                                            <option
                                                key={option.value}
                                                value={option.value}
                                            >
                                                {option.label}
                                            </option>
                                        ),
                                    )}
                                </select>
                            </div>

                            <div>
                                <label
                                    htmlFor={`intervention-notes-${signal.id}`}
                                    className="text-sm font-medium"
                                >
                                    Notes
                                </label>

                                <textarea
                                    id={`intervention-notes-${signal.id}`}
                                    value={notes}
                                    onChange={(event) =>
                                        setNotes(event.target.value)
                                    }
                                    disabled={processing}
                                    rows={3}
                                    placeholder="What happened?"
                                    className="mt-1.5 w-full resize-y rounded-md border bg-background px-3 py-2 text-sm"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor={`intervention-outcome-${signal.id}`}
                                    className="text-sm font-medium"
                                >
                                    Outcome
                                </label>

                                <textarea
                                    id={`intervention-outcome-${signal.id}`}
                                    value={outcome}
                                    onChange={(event) =>
                                        setOutcome(event.target.value)
                                    }
                                    disabled={processing}
                                    rows={3}
                                    placeholder="What was the result?"
                                    className="mt-1.5 w-full resize-y rounded-md border bg-background px-3 py-2 text-sm"
                                />
                            </div>

                            {error && (
                                <ErrorMessage message={error} />
                            )}

                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={cancelForms}
                                    disabled={processing}
                                    className="rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    onClick={submitIntervention}
                                    disabled={processing}
                                    className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {processing
                                        ? 'Recording...'
                                        : 'Record Action'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Dismissal form */}
                {showDismissForm && (
                    <div className="mt-5 rounded-lg border p-4">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h3 className="font-medium">
                                    Dismiss signal
                                </h3>

                                <p className="mt-1 text-sm text-muted-foreground">
                                    Tell us why this signal does not need
                                    further attention.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={cancelForms}
                                disabled={processing}
                                className="text-sm text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Cancel
                            </button>
                        </div>

                        <div className="mt-4 grid gap-4">
                            <div>
                                <label
                                    htmlFor={`dismissal-reason-${signal.id}`}
                                    className="text-sm font-medium"
                                >
                                    Reason
                                </label>

                                <select
                                    id={`dismissal-reason-${signal.id}`}
                                    value={dismissalReason}
                                    onChange={(event) =>
                                        setDismissalReason(
                                            event.target
                                                .value as DismissalReason,
                                        )
                                    }
                                    disabled={processing}
                                    className="mt-1.5 h-10 w-full rounded-md border bg-background px-3 text-sm"
                                >
                                    {dismissalReasons.map(
                                        (option) => (
                                            <option
                                                key={option.value}
                                                value={option.value}
                                            >
                                                {option.label}
                                            </option>
                                        ),
                                    )}
                                </select>
                            </div>

                            <div>
                                <label
                                    htmlFor={`dismissal-notes-${signal.id}`}
                                    className="text-sm font-medium"
                                >
                                    Notes
                                </label>

                                <textarea
                                    id={`dismissal-notes-${signal.id}`}
                                    value={dismissalNotes}
                                    onChange={(event) =>
                                        setDismissalNotes(
                                            event.target.value,
                                        )
                                    }
                                    disabled={processing}
                                    rows={3}
                                    placeholder="Add any useful context..."
                                    className="mt-1.5 w-full resize-y rounded-md border bg-background px-3 py-2 text-sm"
                                />
                            </div>

                            {error && (
                                <ErrorMessage message={error} />
                            )}

                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={cancelForms}
                                    disabled={processing}
                                    className="rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    onClick={submitDismissal}
                                    disabled={processing}
                                    className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {processing
                                        ? 'Dismissing...'
                                        : 'Dismiss Signal'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Latest intervention */}
                {signal.latest_intervention && (
                    <div className="mt-4 rounded-lg border bg-muted/20 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Latest intervention
                        </p>

                        <p className="mt-1 text-sm font-medium">
                            {getInterventionLabel(
                                signal.latest_intervention.type,
                            )}
                        </p>

                        {signal.latest_intervention.notes && (
                            <p className="mt-2 text-sm text-muted-foreground">
                                {signal.latest_intervention.notes}
                            </p>
                        )}

                        {signal.latest_intervention.outcome && (
                            <div className="mt-3">
                                <p className="text-xs text-muted-foreground">
                                    Outcome
                                </p>

                                <p className="mt-1 text-sm">
                                    {signal.latest_intervention.outcome}
                                </p>
                            </div>
                        )}

                        <p className="mt-3 text-xs text-muted-foreground">
                            {formatDateTime(
                                signal.latest_intervention
                                    .intervened_at,
                            )}
                        </p>
                    </div>
                )}
            </div>
        </article>
    );
}

function AttendanceContext({
    expected,
    recent,
}: {
    expected: number;
    recent: number;
}) {
    const expectedFortnight = expected * 2;
    const recentFortnight = recent * 2;

    const adherence =
        expectedFortnight > 0
            ? Math.min(
                100,
                (recentFortnight / expectedFortnight) * 100,
            )
            : null;

    const gap = Math.max(
        0,
        expectedFortnight - recentFortnight,
    );

    return (
        <div className="mt-3 rounded-lg border bg-muted/20 p-3">
            <div className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
                <span className="font-medium">
                    Recent attendance vs expectation
                </span>

                <span className="text-muted-foreground">
                    {recentFortnight.toFixed(1)} /{' '}
                    {expectedFortnight.toFixed(1)} visits in 14 days
                </span>
            </div>

            {adherence !== null && (
                <p className="mt-1 text-xs text-muted-foreground">
                    {adherence.toFixed(0)}% of expected attendance
                    {gap > 0
                        ? ` · ${gap.toFixed(1)} visit${Math.abs(gap - 1) < 0.05 ? '' : 's'} below expectation`
                        : ' · meeting or exceeding expectation'}
                </p>
            )}

            <p className="mt-2 text-xs text-muted-foreground">
                Compared with the member's stated expectation; this is
                context, not a diagnosis.
            </p>
        </div>
    );
}

type EvidenceItemProps = {
    label: string;
    value: string;
};

function EvidenceItem({
    label,
    value,
}: EvidenceItemProps) {
    return (
        <div className="rounded-lg border bg-muted/20 p-3">
            <p className="text-xs text-muted-foreground">
                {label}
            </p>

            <p className="mt-1 text-sm font-medium">
                {value}
            </p>
        </div>
    );
}

type ErrorMessageProps = {
    message: string;
};

function ErrorMessage({
    message,
}: ErrorMessageProps) {
    return (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {message}
        </div>
    );
}

function getSignalTitle(type: string): string {
    switch (type) {
        case 'attendance_decline':
            return 'Attendance has dropped significantly';

        case 'membership_expiring':
            return 'Membership is approaching expiry';

        default:
            return type.replace(/_/g, ' ');
    }
}

function getInterventionLabel(type: string): string {
    switch (type) {
        case 'call_member':
            return 'Called member';

        case 'send_whatsapp':
            return 'Sent WhatsApp message';

        case 'in_person':
            return 'Spoke with member in person';

        case 'follow_up':
            return 'Scheduled follow-up';

        case 'other':
            return 'Other intervention';

        default:
            return type.replace(/_/g, ' ');
    }
}

function getDefaultInterventionType(
    signal: Signal,
): InterventionType {
    if (signal.recommendation?.type === 'call_member') {
        return 'call_member';
    }

    if (
        signal.recommendation?.type ===
        'send_whatsapp'
    ) {
        return 'send_whatsapp';
    }

    return 'other';
}

function sortSignalsByPriority(signals: Signal[]): Signal[] {
    return [...signals].sort((a, b) => {
        const priorityDifference =
            getSignalPriority(b).score -
            getSignalPriority(a).score;

        if (priorityDifference !== 0) {
            return priorityDifference;
        }

        return (
            new Date(b.detected_at).getTime() -
            new Date(a.detected_at).getTime()
        );
    });
}

function getSignalPriority(
    signal: Signal,
): SignalPriority {
    let score =
        signal.severity === 'high'
            ? 100
            : signal.severity === 'medium'
                ? 60
                : 30;

    const reasons: string[] = [];

    if (signal.type === 'membership_expiring') {
        const days = signal.evidence.days_remaining;

        if (days !== undefined) {
            if (days <= 0) {
                score += 55;
                reasons.push(
                    'Membership expires today or has expired',
                );
            } else if (days <= 3) {
                score += 40;
                reasons.push(
                    `Membership expires in ${days} days`,
                );
            } else if (days <= 7) {
                score += 20;
                reasons.push(
                    `Membership expires in ${days} days`,
                );
            }
        }
    }

    if (signal.type === 'attendance_decline') {
        const decline = signal.evidence.decline_percentage;

        if (decline !== undefined) {
            if (decline >= 70) {
                score += 40;
                reasons.push(
                    'Attendance decline is severe',
                );
            } else if (decline >= 50) {
                score += 25;
                reasons.push(
                    'Attendance decline is significant',
                );
            }
        }

        const expected =
            signal.evidence.expected_visits_per_week;

        const recent =
            signal.evidence.recent_average;

        if (
            expected !== undefined &&
            expected !== null &&
            recent !== undefined &&
            expected > 0
        ) {
            const adherence =
                (recent / expected) * 100;

            if (adherence < 50) {
                score += 20;
                reasons.push(
                    'Recent attendance is below half of expectation',
                );
            }
        }
    }

    if (signal.latest_intervention) {
        const intervenedAt = new Date(
            signal.latest_intervention.intervened_at,
        ).getTime();

        const ageDays =
            (Date.now() - intervenedAt) /
            (1000 * 60 * 60 * 24);

        if (
            Number.isFinite(ageDays) &&
            ageDays <= 3
        ) {
            score -= signal.latest_intervention.outcome
                ? 20
                : 5;

            reasons.push(
                signal.latest_intervention.outcome
                    ? 'A recent intervention already has an outcome'
                    : 'A recent intervention was just recorded',
            );
        } else if (
            Number.isFinite(ageDays) &&
            ageDays <= 7
        ) {
            score -= 10;

            reasons.push(
                'A recent intervention is awaiting follow-up',
            );
        }
    }

    let label: SignalPriority['label'];

    if (score >= 110) {
        label = 'Act now';
    } else if (score >= 65) {
        label = 'Due soon';
    } else {
        label = 'Monitor';
    }

    if (reasons.length === 0) {
        reasons.push(
            'Prioritized from signal severity',
        );
    }

    return {
        score,
        label,
        reason: reasons.slice(0, 2).join(' · '),
    };
}

function getPriorityBadgeClass(
    label: SignalPriority['label'],
): string {
    switch (label) {
        case 'Act now':
            return 'border-destructive/30 text-destructive';

        case 'Due soon':
            return 'border-amber-500/30 text-amber-600 dark:text-amber-400';

        default:
            return 'border-border text-muted-foreground';
    }
}

function getSeverityPresentation(
    severity: string,
): {
    indicatorClass: string;
    badgeClass: string;
} {
    switch (severity) {
        case 'high':
            return {
                indicatorClass: 'h-1.5 bg-destructive',
                badgeClass:
                    'border-destructive/30 text-destructive',
            };

        case 'medium':
            return {
                indicatorClass:
                    'h-1.5 bg-amber-500',
                badgeClass:
                    'border-amber-500/30 text-amber-600 dark:text-amber-400',
            };

        case 'low':
            return {
                indicatorClass:
                    'h-1.5 bg-muted-foreground',
                badgeClass:
                    'border-muted-foreground/30 text-muted-foreground',
            };

        default:
            return {
                indicatorClass: 'h-1.5 bg-border',
                badgeClass:
                    'border-border text-muted-foreground',
            };
    }
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(amount);
}

function formatDate(date: string): string {
    return new Date(
        `${date}T00:00:00`,
    ).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

function formatDateTime(date: string): string {
    return new Date(date).toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}

type StatCardProps = {
    label: string;
    value: number;
    href: string;
    action: string;
};

function StatCard({
    label,
    value,
    href,
    action,
}: StatCardProps) {
    return (
        <Link
            href={href}
            className="group rounded-xl border p-5 transition hover:bg-muted/20"
        >
            <p className="text-sm text-muted-foreground">
                {label}
            </p>

            <p className="mt-2 text-3xl font-semibold">
                {value}
            </p>

            <p className="mt-3 text-xs text-muted-foreground group-hover:text-foreground">
                {action} →
            </p>
        </Link>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};