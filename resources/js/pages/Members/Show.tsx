import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState, type FormEvent } from 'react';
import {
    AlertCircle,
    CheckCircle2,
    Clock3,
    ArrowLeft,
    ChevronLeft,
    ChevronRight,
    TrendingUp,
    TrendingDown,
    Minus,
    AlertTriangle,
    CreditCard,
    Calendar as CalendarIcon,
    User,
    Check,
    Archive,
    Edit3,
    RefreshCw,
    Plus,
    Activity,
    Target,
} from 'lucide-react';
import { dashboard } from '@/routes';
import members from '@/routes/members';
import FollowUpTaskPanel from '@/components/follow-up-task-panel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';

type Payment = {
    id: string;
    amount: string;
    payment_method: string;
    paid_at: string;
};

type Membership = {
    id: string;
    start_date: string;
    end_date: string;
    price: string;
    amount_paid: number;
    balance_due: number;
    status: string;
    lifecycle_status?: string;

    membership_plan: {
        name: string;
    };

    payments: Payment[];
};

type Expectation = {
    id: string;
    visits_per_week: number;
    start_date: string;
    end_date: string | null;
};

type Goal = {
    id: string;
    goal: string;
    start_date: string;
    end_date: string | null;
};

type Intervention = {
    id: string;
    type: string;
    notes: string | null;
    outcome: string | null;
    intervened_at: string;
    signal_type: string | null;
    signal_severity: string | null;
    attendance_before_14d: number | null;
    attendance_after_14d: number | null;
    attendance_change: number | null;
    follow_up_status: 'ready' | 'in_progress' | 'unavailable';
};

type SignalIntervention = {
    id: string;
    type: string;
    notes: string | null;
    outcome: string | null;
    intervened_at: string;
};

type Signal = {
    id: string;
    type: string;
    severity: string;
    status: string;

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
    resolved_at: string | null;

    dismissal_reason: string | null;
    dismissal_notes: string | null;
    dismissed_at: string | null;

    interventions: SignalIntervention[];
};

type Attendance = {
    id: string;
    check_in_at: string;
    source: string;
};

type TimelineEventType =
    | 'membership_started'
    | 'payment_received'
    | 'attendance_recorded'
    | 'signal_detected'
    | 'intervention_recorded'
    | 'signal_resolved'
    | 'signal_dismissed';

type TimelineEvent = {
    id: string;
    type: TimelineEventType;
    occurred_at: string;
    occurred_at_type: 'date' | 'datetime';

    data: {
        membership_id?: string;
        plan?: string | null;
        price?: number;
        start_date?: string;
        end_date?: string;

        payment_id?: string;
        amount?: number;
        payment_method?: string;

        attendance_id?: string;
        source?: string;

        signal_id?: string;
        signal_type?: string;
        severity?: string;
        evidence?: Record<string, unknown>;

        intervention_id?: string;
        type?: string;
        notes?: string | null;
        outcome?: string | null;

        reason?: string | null;
    };
};

type Member = {
    id: string;
    name: string;
    email: string | null;
    phone: string;
    date_of_birth: string | null;

    memberships: Membership[];
    expectations: Expectation[];
    goals: Goal[];

    signals: Signal[];
    interventions: Intervention[];
    attendances: Attendance[];
};

type OperationalStatus = {
    membership_status: 'active' | 'expiring' | 'expired' | 'none';
    financial_status: 'paid' | 'outstanding';
    membership_expires_at: string | null;
    balance_due: number;
};

type FollowUpTask = {
    id: string;
    member_id: string;
    intervention_id: string | null;
    status: 'pending' | 'completed' | 'skipped';
    due_date: string;
    completed_at: string | null;
    completion_notes: string | null;
    intervention?: {
        id: string;
        type: string;
        notes: string | null;
        outcome: string | null;
        intervened_at: string | null;
    } | null;
};

type ShowProps = {
    member: Member;
    operationalStatus: OperationalStatus;
    followUpTasks: FollowUpTask[];
    checkedInToday: boolean;
    timeline: TimelineEvent[];
};

type InterventionForm = {
    signal_id: string;
    type: string;
    notes: string;
    outcome: string;
};

type ContextForm = {
    visits_per_week: string;
    goal: string;
    start_date: string;
};

const goalOptions = [
    { value: 'weight_loss', label: 'Weight loss' },
    { value: 'muscle_gain', label: 'Muscle gain' },
    { value: 'general_fitness', label: 'General fitness' },
    { value: 'strength', label: 'Strength' },
    { value: 'other', label: 'Other' },
];

const interventionTypes = [
    {
        value: 'call_member',
        label: 'Call member',
    },
    {
        value: 'send_whatsapp',
        label: 'Send WhatsApp',
    },
    {
        value: 'in_person',
        label: 'Speak in person',
    },
    {
        value: 'follow_up',
        label: 'Follow up',
    },
    {
        value: 'other',
        label: 'Other',
    },
];

function formatCurrency(amount: number): string {
    return `₹${Number.isFinite(amount) ? amount.toFixed(2) : '0.00'}`;
}

function getDurationDays(membership: Membership): number {
    const start = parseDateOnly(membership.start_date);
    const end = parseDateOnly(membership.end_date);

    const difference =
        Math.round(
            (end.getTime() - start.getTime()) /
            (1000 * 60 * 60 * 24),
        ) + 1;

    return Math.max(1, difference);
}

function getSignalTypeLabel(type: string): string {
    switch (type) {
        case 'attendance_decline':
            return 'Attendance has dropped significantly';

        case 'membership_expiring':
            return 'Membership was approaching expiry';

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

function getDismissalReasonLabel(reason: string): string {
    switch (reason) {
        case 'member_travelling':
            return 'Member is travelling';

        case 'already_handled':
            return 'Already handled elsewhere';

        case 'not_relevant':
            return 'Not relevant';

        case 'member_requested_pause':
            return 'Member requested a pause';

        case 'other':
            return 'Other';

        default:
            return reason.replace(/_/g, ' ');
    }
}

function getSignalStatusPresentation(status: string): {
    label: string;
    badgeVariant: 'default' | 'outline' | 'secondary' | 'destructive';
    className: string;
} {
    switch (status) {
        case 'open':
            return {
                label: 'Open',
                badgeVariant: 'destructive',
                className: '',
            };

        case 'resolved':
            return {
                label: 'Resolved',
                badgeVariant: 'outline',
                className: 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10',
            };

        case 'dismissed':
            return {
                label: 'Dismissed',
                badgeVariant: 'secondary',
                className: 'text-muted-foreground',
            };

        default:
            return {
                label: status.replace(/_/g, ' '),
                badgeVariant: 'outline',
                className: '',
            };
    }
}

function getSeverityPresentation(
    severity: string,
): {
    badgeVariant: 'default' | 'outline' | 'secondary' | 'destructive';
    className: string;
} {
    switch (severity) {
        case 'high':
            return {
                badgeVariant: 'destructive',
                className: '',
            };

        case 'medium':
            return {
                badgeVariant: 'outline',
                className: 'border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10',
            };

        case 'low':
            return {
                badgeVariant: 'secondary',
                className: '',
            };

        default:
            return {
                badgeVariant: 'outline',
                className: '',
            };
    }
}

function formatPaymentMethod(
    method: string | undefined,
): string {
    switch (method) {
        case 'upi':
            return 'UPI';

        case 'cash':
            return 'Cash';

        case 'card':
            return 'Card';

        case 'bank_transfer':
            return 'Bank transfer';

        case 'other':
            return 'Other';

        default:
            return method?.replace(/_/g, ' ') ?? 'Unknown';
    }
}

function parseDateOnly(date: string): Date {
    const dateOnly = date.slice(0, 10);

    return new Date(`${dateOnly}T00:00:00`);
}

function formatDate(date: string): string {
    return parseDateOnly(date).toLocaleDateString(
        'en-IN',
        {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        },
    );
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

function getTimelineDay(
    event: TimelineEvent,
): string {
    if (event.occurred_at_type === 'date') {
        return event.occurred_at.slice(0, 10);
    }

    return new Date(event.occurred_at)
        .toLocaleDateString('en-CA', {
            timeZone: 'Asia/Kolkata',
        });
}

function getTimelineDayLabel(
    date: string,
): string {
    const today = new Date().toLocaleDateString(
        'en-CA',
        {
            timeZone: 'Asia/Kolkata',
        },
    );

    const yesterday = new Date(
        Date.now() - 24 * 60 * 60 * 1000,
    ).toLocaleDateString('en-CA', {
        timeZone: 'Asia/Kolkata',
    });

    if (date === today) {
        return 'Today';
    }

    if (date === yesterday) {
        return 'Yesterday';
    }

    return parseDateOnly(date).toLocaleDateString(
        'en-IN',
        {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        },
    );
}

function formatTimelineEventTime(
    event: TimelineEvent,
): string {
    if (event.occurred_at_type === 'date') {
        return formatDate(event.occurred_at);
    }

    return new Date(event.occurred_at).toLocaleTimeString(
        'en-IN',
        {
            timeZone: 'Asia/Kolkata',
            hour: 'numeric',
            minute: '2-digit',
        },
    );
}

function getTimelineTitle(
    event: TimelineEvent,
): string {
    switch (event.type) {
        case 'membership_started':
            return 'Membership started';

        case 'payment_received':
            return 'Payment received';

        case 'attendance_recorded':
            return 'Member checked in';

        case 'signal_detected':
            return 'Signal detected';

        case 'intervention_recorded':
            return 'Intervention recorded';

        case 'signal_resolved':
            return 'Signal resolved';

        case 'signal_dismissed':
            return 'Signal dismissed';

        default:
            return 'Activity';
    }
}

function getCalendarDays(month: Date): Date[] {
    const firstDay = new Date(
        month.getFullYear(),
        month.getMonth(),
        1,
    );

    const lastDay = new Date(
        month.getFullYear(),
        month.getMonth() + 1,
        0,
    );

    // Monday-first calendar: Monday = 0, Sunday = 6.
    const startOffset =
        (firstDay.getDay() + 6) % 7;

    const totalDays =
        startOffset + lastDay.getDate();

    const rows = Math.ceil(totalDays / 7);
    const days: Date[] = [];

    for (let index = 0; index < rows * 7; index++) {
        days.push(
            new Date(
                firstDay.getFullYear(),
                firstDay.getMonth(),
                1 - startOffset + index,
            ),
        );
    }

    return days;
}

function getCalendarDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

function getIndiaDateKey(date: string): string {
    return new Date(date).toLocaleDateString('en-CA', {
        timeZone: 'Asia/Kolkata',
    });
}

function getCalendarMonthLabel(date: Date): string {
    return date.toLocaleDateString('en-IN', {
        month: 'long',
        year: 'numeric',
    });
}

function getSelectedDayLabel(date: string): string {
    return parseDateOnly(date).toLocaleDateString(
        'en-IN',
        {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        },
    );
}

function MembershipStatusBadge({
    status,
}: {
    status: OperationalStatus['membership_status'];
}) {
    switch (status) {
        case 'active':
            return (
                <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 gap-1.5 px-3 py-1 text-xs">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Active
                </Badge>
            );
        case 'expiring':
            return (
                <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 gap-1.5 px-3 py-1 text-xs">
                    <Clock3 className="h-3.5 w-3.5" />
                    Expiring
                </Badge>
            );
        case 'expired':
            return (
                <Badge variant="destructive" className="gap-1.5 px-3 py-1 text-xs">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Expired
                </Badge>
            );
        case 'none':
        default:
            return (
                <Badge variant="secondary" className="gap-1.5 px-3 py-1 text-xs">
                    <AlertCircle className="h-3.5 w-3.5" />
                    No Membership
                </Badge>
            );
    }
}

function FinancialStatusBadge({
    status,
    balanceDue,
}: {
    status: OperationalStatus['financial_status'];
    balanceDue: number;
}) {
    if (status === 'paid') {
        return (
            <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs px-2.5 py-1">
                Fully Paid
            </Badge>
        );
    }

    return (
        <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs px-2.5 py-1 font-semibold">
            ₹{balanceDue.toLocaleString('en-IN')} outstanding
        </Badge>
    );
}

type AttendanceSnapshot = {
    recentVisits: number;
    previousVisits: number;
    expectedVisitsPerWeek: number | null;
    trend: 'improving' | 'declining' | 'stable' | 'insufficient_data';
    lastVisit: string | null;
    expectedVisitsInWindow: number | null;
    adherencePercentage: number | null;
    visitGap: number | null;
};

function getAttendanceSnapshot(
    attendances: Attendance[],
    expectedVisitsPerWeek: number | null,
): AttendanceSnapshot {
    const todayKey = new Date().toLocaleDateString('en-CA', {
        timeZone: 'Asia/Kolkata',
    });

    const today = parseDateOnly(todayKey);
    const recentStart = new Date(today);
    recentStart.setDate(recentStart.getDate() - 13);

    const previousStart = new Date(today);
    previousStart.setDate(previousStart.getDate() - 27);

    const previousEnd = new Date(today);
    previousEnd.setDate(previousEnd.getDate() - 14);

    const recentVisits = attendances.filter((attendance) => {
        const date = parseDateOnly(attendance.check_in_at);
        return date >= recentStart && date <= today;
    }).length;

    const previousVisits = attendances.filter((attendance) => {
        const date = parseDateOnly(attendance.check_in_at);
        return date >= previousStart && date <= previousEnd;
    }).length;

    let trend: AttendanceSnapshot['trend'] = 'insufficient_data';

    if (previousVisits > 0 || recentVisits > 0) {
        if (recentVisits > previousVisits) {
            trend = 'improving';
        } else if (recentVisits < previousVisits) {
            trend = 'declining';
        } else {
            trend = 'stable';
        }
    }

    const expectedVisitsInWindow = expectedVisitsPerWeek === null
        ? null
        : expectedVisitsPerWeek * 2;

    const adherencePercentage = expectedVisitsInWindow === null
        ? null
        : expectedVisitsInWindow === 0
            ? 100
            : Math.round((recentVisits / expectedVisitsInWindow) * 100);

    const visitGap = expectedVisitsInWindow === null
        ? null
        : recentVisits - expectedVisitsInWindow;

    const lastVisit = attendances.length > 0
        ? attendances
            .slice()
            .sort(
                (a, b) =>
                    new Date(b.check_in_at).getTime() -
                    new Date(a.check_in_at).getTime(),
            )[0]?.check_in_at ?? null
        : null;

    return {
        recentVisits,
        previousVisits,
        expectedVisitsPerWeek,
        trend,
        lastVisit,
        expectedVisitsInWindow,
        adherencePercentage,
        visitGap,
    };
}

function getAttendanceTrendPresentation(
    trend: AttendanceSnapshot['trend'],
): { label: string; className: string; icon: typeof TrendingUp } {
    switch (trend) {
        case 'improving':
            return {
                label: 'Improving',
                className: 'text-emerald-600 dark:text-emerald-400',
                icon: TrendingUp,
            };
        case 'declining':
            return {
                label: 'Declining',
                className: 'text-destructive',
                icon: TrendingDown,
            };
        case 'stable':
            return {
                label: 'Stable',
                className: 'text-muted-foreground',
                icon: Minus,
            };
        default:
            return {
                label: 'Not enough data',
                className: 'text-muted-foreground',
                icon: Minus,
            };
    }
}

export default function Show({
    member,
    operationalStatus,
    followUpTasks,
    checkedInToday,
    timeline,
}: ShowProps) {
    const todayKey = new Date().toLocaleDateString('en-CA', {
        timeZone: 'Asia/Kolkata',
    });

    const currentExpectation =
        member.expectations.find(
            (expectation) =>
                expectation.start_date.slice(0, 10) <= todayKey &&
                (expectation.end_date === null ||
                    expectation.end_date.slice(0, 10) >= todayKey),
        ) ?? null;

    const currentGoal =
        member.goals.find(
            (goal) =>
                goal.start_date.slice(0, 10) <= todayKey &&
                (goal.end_date === null ||
                    goal.end_date.slice(0, 10) >= todayKey),
        ) ?? null;

    const attendanceSnapshot = getAttendanceSnapshot(
        member.attendances,
        currentExpectation?.visits_per_week ?? null,
    );

    const attendanceTrend = getAttendanceTrendPresentation(
        attendanceSnapshot.trend,
    );
    const TrendIcon = attendanceTrend.icon;

    const openSignals = member.signals.filter(
        (signal) => signal.status === 'open',
    );

    const currentMembership =
        member.memberships.find(
            (membership) =>
                membership.lifecycle_status === 'active',
        ) ?? null;

    const latestExpiredMembership =
        member.memberships
            .filter(
                (membership) =>
                    membership.lifecycle_status === 'expired',
            )
            .sort(
                (a, b) =>
                    new Date(b.end_date).getTime() -
                    new Date(a.end_date).getTime(),
            )[0] ?? null;

    const upcomingMembership =
        member.memberships.find(
            (membership) =>
                membership.lifecycle_status === 'upcoming',
        ) ?? null;

    const historicalMemberships =
        member.memberships.filter(
            (membership) =>
                membership.lifecycle_status !== 'active' &&
                membership.lifecycle_status !== 'upcoming',
        );

    const currentPaid =
        currentMembership?.amount_paid ?? 0;

    const currentBalance =
        currentMembership?.balance_due ?? 0;

    const upcomingPaid =
        upcomingMembership?.amount_paid ?? 0;

    const upcomingBalance =
        upcomingMembership?.balance_due ?? 0;

    const [checkingIn, setCheckingIn] = useState(false);
    const [checkInError, setCheckInError] = useState<string | null>(
        null,
    );
    const [editingContext, setEditingContext] = useState(false);

    const contextForm = useForm<ContextForm>({
        visits_per_week: currentExpectation
            ? String(currentExpectation.visits_per_week)
            : '',
        goal: currentGoal?.goal ?? '',
        start_date: new Date().toLocaleDateString('en-CA', {
            timeZone: 'Asia/Kolkata',
        }),
    });

    const hasActiveMembership = member.memberships.some(
        (membership) =>
            membership.lifecycle_status === 'active',
    );

    const latestActivityDate =
        timeline.length > 0
            ? timeline[0].occurred_at
            : new Date().toISOString();

    const [calendarMonth, setCalendarMonth] = useState(
        (() => {
            const date = new Date(latestActivityDate);

            return new Date(
                date.getFullYear(),
                date.getMonth(),
                1,
            );
        })(),
    );

    const [selectedActivityDate, setSelectedActivityDate] =
        useState(
            getIndiaDateKey(latestActivityDate),
        );

    const timelineByDate = new Map<
        string,
        TimelineEvent[]
    >();

    for (const event of timeline) {
        const dateKey = getIndiaDateKey(
            event.occurred_at,
        );

        const existing = timelineByDate.get(dateKey);

        if (existing) {
            existing.push(event);
        } else {
            timelineByDate.set(dateKey, [event]);
        }
    }

    const selectedActivityEvents =
        timelineByDate.get(selectedActivityDate) ?? [];

    const calendarDays = getCalendarDays(calendarMonth);

    function handleCheckIn(): void {
        if (!hasActiveMembership || checkedInToday || checkingIn) {
            return;
        }

        setCheckingIn(true);
        setCheckInError(null);

        router.post(
            `/members/${member.id}/attendance`,
            {},
            {
                preserveScroll: true,
                onError: (errors) => {
                    const error = errors.attendance;

                    setCheckInError(
                        typeof error === 'string'
                            ? error
                            : 'Unable to record check-in.',
                    );
                },
                onFinish: () => {
                    setCheckingIn(false);
                },
            },
        );
    }

    function handleContextEdit(): void {
        contextForm.setData({
            visits_per_week: currentExpectation
                ? String(currentExpectation.visits_per_week)
                : '',
            goal: currentGoal?.goal ?? '',
            start_date: new Date().toLocaleDateString('en-CA', {
                timeZone: 'Asia/Kolkata',
            }),
        });
        contextForm.clearErrors();
        setEditingContext(true);
    }

    function submitContext(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault();

        contextForm.transform((data) => ({
            visits_per_week: data.visits_per_week === ''
                ? null
                : Number(data.visits_per_week),
            goal: data.goal || null,
            start_date: data.start_date,
        }));

        contextForm.patch(
            `/members/${member.id}/context`,
            {
                preserveScroll: true,
                onSuccess: () => {
                    setEditingContext(false);
                },
            },
        );
    }

    const contextErrors = contextForm.errors as Record<string, string | undefined>;

    return (
        <>
            <Head title={member.name} />

            <div className="mx-auto max-w-7xl flex flex-col gap-6 p-4 sm:p-6 w-full pb-12">
                {/* Header Card */}
                <Card className="overflow-hidden border-border shadow-xs">
                    <CardHeader className="flex flex-col gap-4 pb-5">
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" asChild className="gap-1 px-2 text-muted-foreground hover:text-foreground">
                                <Link href={members.index()}>
                                    <ArrowLeft className="h-4 w-4" />
                                    <span>Back to Members</span>
                                </Link>
                            </Button>
                        </div>

                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            {/* Member Identity & Status Badges */}
                            <div className="flex items-start gap-4">
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-extrabold text-xl shadow-inner">
                                    {member.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <div>
                                        <CardTitle className="text-2xl sm:text-3xl font-bold tracking-tight">
                                            {member.name}
                                        </CardTitle>
                                        <CardDescription className="text-sm font-medium mt-0.5 text-muted-foreground">
                                            {member.phone}
                                            {member.email ? ` · ${member.email}` : ''}
                                        </CardDescription>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2 pt-1">
                                        <MembershipStatusBadge status={operationalStatus.membership_status} />

                                        {operationalStatus.membership_expires_at && (
                                            <span className="text-xs text-muted-foreground font-medium">
                                                {operationalStatus.membership_status === 'expired'
                                                    ? `Expired ${formatDate(operationalStatus.membership_expires_at)}`
                                                    : `Ends ${formatDate(operationalStatus.membership_expires_at)}`}
                                            </span>
                                        )}

                                        <FinancialStatusBadge
                                            status={operationalStatus.financial_status}
                                            balanceDue={operationalStatus.balance_due}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Action Bar */}
                            <div className="flex flex-wrap items-center gap-2 pt-1 lg:pt-0 shrink-0">
                                <Button
                                    type="button"
                                    disabled={checkedInToday || checkingIn || !hasActiveMembership}
                                    onClick={handleCheckIn}
                                    variant={checkedInToday ? "secondary" : "default"}
                                    className="gap-2 h-10 px-4 font-semibold"
                                >
                                    {checkingIn ? (
                                        <>
                                            <Spinner className="h-4 w-4" />
                                            <span>Checking In...</span>
                                        </>
                                    ) : checkedInToday ? (
                                        <>
                                            <Check className="h-4 w-4 text-emerald-500" />
                                            <span>Checked In Today</span>
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="h-4 w-4" />
                                            <span>Check In</span>
                                        </>
                                    )}
                                </Button>

                                {operationalStatus.membership_status !== 'active' &&
                                    operationalStatus.membership_status !== 'expiring' && (
                                        <Button variant="outline" asChild className="gap-1.5 h-10">
                                            <Link href={members.memberships.create(member.id)}>
                                                <Plus className="h-4 w-4" />
                                                <span>Add Membership</span>
                                            </Link>
                                        </Button>
                                    )}

                                {currentMembership && currentBalance > 0 && (
                                    <Button variant="outline" asChild className="gap-1.5 h-10">
                                        <Link
                                            href={members.memberships.payments.create([
                                                member.id,
                                                currentMembership.id,
                                            ])}
                                        >
                                            <CreditCard className="h-4 w-4" />
                                            <span>Record Payment</span>
                                        </Link>
                                    </Button>
                                )}

                                {operationalStatus.membership_status !== 'none' &&
                                    operationalStatus.membership_status !== 'active' && (
                                        <Button variant="outline" asChild className="gap-1.5 h-10">
                                            <Link
                                                href={
                                                    currentMembership
                                                        ? `/members/${member.id}/memberships/${currentMembership.id}/renew`
                                                        : latestExpiredMembership
                                                            ? `/members/${member.id}/memberships/${latestExpiredMembership.id}/renew`
                                                            : members.memberships.create(member.id)
                                                }
                                            >
                                                <RefreshCw className="h-4 w-4" />
                                                <span>Renew</span>
                                            </Link>
                                        </Button>
                                    )}

                                <Button variant="outline" size="icon" asChild title="Edit Member" className="h-10 w-10">
                                    <Link href={members.edit(member.id)}>
                                        <Edit3 className="h-4 w-4" />
                                    </Link>
                                </Button>

                                <Button
                                    variant="outline"
                                    size="icon"
                                    type="button"
                                    title="Archive Member"
                                    className="h-10 w-10 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => {
                                        if (
                                            window.confirm(
                                                `Archive ${member.name}? Their historical data will be preserved.`,
                                            )
                                        ) {
                                            router.delete(members.destroy(member.id).url);
                                        }
                                    }}
                                >
                                    <Archive className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        {checkInError && (
                            <Alert variant="destructive" className="mt-2">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Check-in Failed</AlertTitle>
                                <AlertDescription>{checkInError}</AlertDescription>
                            </Alert>
                        )}

                        {!hasActiveMembership && (
                            <p className="text-xs text-muted-foreground">
                                Add an active membership to enable front-desk check-in for this member.
                            </p>
                        )}
                    </CardHeader>
                </Card>

                {/* ROW 1: Operational Core (Current Membership + Profile/Context) */}
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Left Column (Current Membership & Upcoming) */}
                    <div className="flex flex-col gap-6">
                        {/* Current Membership */}
                        <Card className="border-border">
                            <CardHeader className="flex flex-row items-center justify-between pb-4">
                                <div>
                                    <CardTitle className="text-lg font-bold">Current Membership</CardTitle>
                                    <CardDescription>Active agreement granting gym facility access</CardDescription>
                                </div>
                                <Button variant="outline" size="sm" asChild className="gap-1.5">
                                    <Link href={members.memberships.create(member.id)}>
                                        <Plus className="h-4 w-4" />
                                        <span>New Plan</span>
                                    </Link>
                                </Button>
                            </CardHeader>

                            <CardContent>
                                {currentMembership ? (
                                    <div className="flex flex-col gap-5 rounded-lg border bg-muted/20 p-5">
                                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-xl font-bold text-foreground">
                                                        {currentMembership.membership_plan.name}
                                                    </h3>
                                                    <Badge variant="outline" className="capitalize text-xs font-semibold">
                                                        {currentMembership.lifecycle_status ?? currentMembership.status}
                                                    </Badge>
                                                </div>
                                                <p className="mt-1 text-xs text-muted-foreground font-mono">
                                                    {formatDate(currentMembership.start_date)} → {formatDate(currentMembership.end_date)}
                                                </p>
                                            </div>

                                            <div className="text-left sm:text-right shrink-0">
                                                <p className="text-xs text-muted-foreground uppercase font-semibold">Membership Fee</p>
                                                <p className="text-2xl font-bold text-foreground">
                                                    {formatCurrency(Number(currentMembership.price))}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid gap-3 sm:grid-cols-3">
                                            <div className="rounded-lg border bg-card p-3">
                                                <p className="text-xs text-muted-foreground font-medium">Paid Amount</p>
                                                <p className="mt-1 text-lg font-bold text-emerald-600 dark:text-emerald-400">
                                                    {formatCurrency(currentPaid)}
                                                </p>
                                            </div>

                                            <div className="rounded-lg border bg-card p-3">
                                                <p className="text-xs text-muted-foreground font-medium">Balance Due</p>
                                                <p className={`mt-1 text-lg font-bold ${currentBalance > 0 ? 'text-destructive' : 'text-foreground'}`}>
                                                    {formatCurrency(currentBalance)}
                                                </p>
                                            </div>

                                            <div className="rounded-lg border bg-card p-3">
                                                <p className="text-xs text-muted-foreground font-medium">Plan Period</p>
                                                <p className="mt-1 text-lg font-bold text-foreground">
                                                    {getDurationDays(currentMembership)} days
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2.5 pt-1">
                                            {currentBalance > 0 && (
                                                <Button asChild className="gap-1.5" size="sm">
                                                    <Link
                                                        href={members.memberships.payments.create([
                                                            member.id,
                                                            currentMembership.id,
                                                        ])}
                                                    >
                                                        <CreditCard className="h-4 w-4" />
                                                        Record Payment
                                                    </Link>
                                                </Button>
                                            )}

                                            <Button variant="outline" asChild className="gap-1.5" size="sm">
                                                <Link href={`/members/${member.id}/memberships/${currentMembership.id}/renew`}>
                                                    <RefreshCw className="h-4 w-4" />
                                                    Renew Plan
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="rounded-lg border border-dashed p-8 text-center flex flex-col items-center justify-center">
                                        <AlertCircle className="h-8 w-8 text-muted-foreground/50 mb-2" />
                                        <p className="font-semibold text-base">No active membership</p>
                                        <p className="mt-1 text-xs text-muted-foreground max-w-sm">
                                            This member does not currently have an active membership. Assign a plan to grant entrance access.
                                        </p>
                                        <Button asChild className="mt-4 gap-1.5" size="sm">
                                            <Link href={members.memberships.create(member.id)}>
                                                <Plus className="h-4 w-4" />
                                                Add Membership
                                            </Link>
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Upcoming Membership (if exists) */}
                        {upcomingMembership && (
                            <Card className="border-border">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base font-bold">Upcoming Membership</CardTitle>
                                    <CardDescription>Scheduled renewal ready to activate</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="rounded-lg border p-4 flex flex-col gap-3">
                                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-bold text-base">
                                                        {upcomingMembership.membership_plan.name}
                                                    </h3>
                                                    <Badge variant="secondary" className="text-xs font-semibold">Upcoming</Badge>
                                                </div>
                                                <p className="mt-1 text-xs text-muted-foreground font-mono">
                                                    {formatDate(upcomingMembership.start_date)} → {formatDate(upcomingMembership.end_date)}
                                                </p>
                                            </div>
                                            <div className="text-left sm:text-right">
                                                <p className="text-xs text-muted-foreground">Price</p>
                                                <p className="font-bold text-lg">
                                                    {formatCurrency(Number(upcomingMembership.price))}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid gap-3 sm:grid-cols-2">
                                            <div className="rounded-md border bg-muted/20 p-2.5">
                                                <p className="text-xs text-muted-foreground">Paid</p>
                                                <p className="font-semibold text-sm">{formatCurrency(upcomingPaid)}</p>
                                            </div>
                                            <div className="rounded-md border bg-muted/20 p-2.5">
                                                <p className="text-xs text-muted-foreground">Outstanding</p>
                                                <p className="font-semibold text-sm">{formatCurrency(upcomingBalance)}</p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Right Column (Personal Details & Context/Goals) */}
                    <div className="flex flex-col gap-6">
                        {/* Personal Details */}
                        <Card className="border-border">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base font-bold">Personal Profile</CardTitle>
                                <CardDescription>Contact and demographic details</CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-col gap-3 text-sm">
                                <div className="flex justify-between items-center gap-4 py-2 border-b border-border/50">
                                    <span className="text-muted-foreground text-xs font-medium shrink-0">Phone Number</span>
                                    <span className="font-semibold text-foreground text-right">{member.phone}</span>
                                </div>

                                <div className="flex justify-between items-center gap-4 py-2 border-b border-border/50">
                                    <span className="text-muted-foreground text-xs font-medium shrink-0">Email Address</span>
                                    <span className="font-medium text-foreground text-right min-w-0 truncate">{member.email ?? '—'}</span>
                                </div>

                                <div className="flex justify-between items-center gap-4 py-2 border-b border-border/50">
                                    <span className="text-muted-foreground text-xs font-medium shrink-0">Date of Birth</span>
                                    <span className="font-medium text-foreground text-right">
                                        {member.date_of_birth ? formatDate(member.date_of_birth) : '—'}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Context & Goals */}
                        <Card className="border-border">
                            <CardHeader className="flex flex-row items-start justify-between pb-3">
                                <div>
                                    <CardTitle className="text-base font-bold">Target Expectations</CardTitle>
                                    <CardDescription>
                                        Benchmark metrics used to calculate attendance adherence
                                    </CardDescription>
                                </div>
                                {!editingContext && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleContextEdit}
                                        className="gap-1 h-8 text-xs"
                                    >
                                        <Edit3 className="h-3.5 w-3.5" />
                                        <span>Edit</span>
                                    </Button>
                                )}
                            </CardHeader>

                            <CardContent>
                                {!editingContext ? (
                                    <div className="flex flex-col gap-3 text-sm">
                                        <div className="flex justify-between items-center gap-4 py-2 border-b border-border/50">
                                            <span className="text-muted-foreground text-xs font-medium shrink-0">Target Frequency</span>
                                            <Badge variant="secondary" className="font-semibold text-xs shrink-0">
                                                {currentExpectation
                                                    ? `${currentExpectation.visits_per_week} visits / week`
                                                    : 'Not set'}
                                            </Badge>
                                        </div>

                                        <div className="flex justify-between items-center gap-4 py-2">
                                            <span className="text-muted-foreground text-xs font-medium shrink-0">Fitness Goal</span>
                                            <span className="font-semibold text-foreground capitalize text-xs text-right">
                                                {currentGoal ? currentGoal.goal.replace(/_/g, ' ') : 'Not set'}
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <form onSubmit={submitContext} className="flex flex-col gap-3.5">
                                        <div className="flex flex-col gap-1.5">
                                            <Label htmlFor="context-visits" className="text-xs">Expected visits per week</Label>
                                            <select
                                                id="context-visits"
                                                value={contextForm.data.visits_per_week}
                                                onChange={(event) =>
                                                    contextForm.setData('visits_per_week', event.target.value)
                                                }
                                                disabled={contextForm.processing}
                                                className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                                            >
                                                <option value="">Not set</option>
                                                {Array.from({ length: 7 }, (_, index) => index + 1).map((value) => (
                                                    <option key={value} value={value}>
                                                        {value} {value === 1 ? 'visit' : 'visits'} / week
                                                    </option>
                                                ))}
                                            </select>
                                            {contextForm.errors.visits_per_week && (
                                                <p className="text-xs text-destructive">
                                                    {contextForm.errors.visits_per_week}
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex flex-col gap-1.5">
                                            <Label htmlFor="context-goal" className="text-xs">Goal</Label>
                                            <select
                                                id="context-goal"
                                                value={contextForm.data.goal}
                                                onChange={(event) =>
                                                    contextForm.setData('goal', event.target.value)
                                                }
                                                disabled={contextForm.processing}
                                                className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                                            >
                                                <option value="">Not set</option>
                                                {contextForm.data.goal &&
                                                    !goalOptions.some(
                                                        (option) => option.value === contextForm.data.goal,
                                                    ) && (
                                                        <option value={contextForm.data.goal}>
                                                            {contextForm.data.goal.replace(/_/g, ' ')}
                                                        </option>
                                                    )}
                                                {goalOptions.map((option) => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                            {contextForm.errors.goal && (
                                                <p className="text-xs text-destructive">
                                                    {contextForm.errors.goal}
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex flex-col gap-1.5">
                                            <Label htmlFor="context-start-date" className="text-xs">Effective from</Label>
                                            <Input
                                                id="context-start-date"
                                                type="date"
                                                value={contextForm.data.start_date}
                                                onChange={(event) =>
                                                    contextForm.setData('start_date', event.target.value)
                                                }
                                                disabled={contextForm.processing}
                                                className="h-9 text-xs"
                                            />
                                            {contextForm.errors.start_date && (
                                                <p className="text-xs text-destructive">
                                                    {contextForm.errors.start_date}
                                                </p>
                                            )}
                                        </div>

                                        {contextErrors.context && (
                                            <p className="text-xs text-destructive">
                                                {contextErrors.context}
                                            </p>
                                        )}

                                        <p className="text-[11px] text-muted-foreground">
                                            Saving updates current expectation and records history.
                                        </p>

                                        <div className="flex items-center gap-2 pt-1">
                                            <Button
                                                type="submit"
                                                disabled={contextForm.processing}
                                                size="sm"
                                                className="h-8 text-xs"
                                            >
                                                {contextForm.processing ? 'Saving...' : 'Save Context'}
                                            </Button>

                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                disabled={contextForm.processing}
                                                onClick={() => setEditingContext(false)}
                                                className="h-8 text-xs"
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    </form>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* ROW 2: Engagement & Activity Calendar */}
                <div className="grid gap-6 lg:grid-cols-5">
                    {/* Attendance Calendar (wider, 3/5 cols) */}
                    <div className="lg:col-span-3 order-2 lg:order-1 flex flex-col gap-6">
                        <Card className="border-border h-full">
                            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-3">
                                <div>
                                    <CardTitle className="text-base font-bold">Attendance Calendar</CardTitle>
                                    <CardDescription>Daily check-in history and activity</CardDescription>
                                </div>

                                <div className="flex items-center gap-1.5">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        type="button"
                                        onClick={() =>
                                            setCalendarMonth(
                                                new Date(
                                                    calendarMonth.getFullYear(),
                                                    calendarMonth.getMonth() - 1,
                                                    1,
                                                ),
                                            )
                                        }
                                        className="h-8 w-8"
                                        aria-label="Previous month"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>

                                    <span className="min-w-32 text-center text-xs font-bold">
                                        {getCalendarMonthLabel(calendarMonth)}
                                    </span>

                                    <Button
                                        variant="outline"
                                        size="icon"
                                        type="button"
                                        onClick={() =>
                                            setCalendarMonth(
                                                new Date(
                                                    calendarMonth.getFullYear(),
                                                    calendarMonth.getMonth() + 1,
                                                    1,
                                                ),
                                            )
                                        }
                                        className="h-8 w-8"
                                        aria-label="Next month"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardHeader>

                                <div className="overflow-hidden rounded-lg border border-border">
                                    <div className="grid grid-cols-7 border-b bg-muted/40">
                                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                                            <div
                                                key={day}
                                                className="py-1.5 text-center text-[10px] font-bold text-muted-foreground uppercase"
                                            >
                                                {day}
                                            </div>
                                        ))}
                                    </div>

                                    <div className="grid grid-cols-7">
                                        {calendarDays.map((day) => {
                                            const dateKey = getCalendarDateKey(day);
                                            const dayEvents = timelineByDate.get(dateKey) ?? [];
                                            const attendanceCount = dayEvents.filter(
                                                (event) => event.type === 'attendance_recorded',
                                            ).length;
                                            const hasActivity = dayEvents.length > 0;
                                            const isCurrentMonth =
                                                day.getMonth() === calendarMonth.getMonth() &&
                                                day.getFullYear() === calendarMonth.getFullYear();
                                            const isSelected = selectedActivityDate === dateKey;
                                            const todayKeyLocal = getIndiaDateKey(new Date().toISOString());
                                            const isToday = dateKey === todayKeyLocal;

                                            return (
                                                <button
                                                    key={dateKey}
                                                    type="button"
                                                    onClick={() => setSelectedActivityDate(dateKey)}
                                                    className={`relative min-h-12 border-b border-r p-1 text-left transition sm:min-h-14 ${
                                                        isCurrentMonth ? 'bg-background' : 'bg-muted/15 text-muted-foreground'
                                                    } ${
                                                        isSelected
                                                            ? 'ring-2 ring-inset ring-primary z-10'
                                                            : 'hover:bg-muted/40'
                                                    }`}
                                                >
                                                    <div className="flex items-start justify-between gap-0.5">
                                                        <span
                                                            className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold ${
                                                                isToday ? 'bg-primary text-primary-foreground font-bold' : ''
                                                            }`}
                                                        >
                                                            {day.getDate()}
                                                        </span>

                                                        {attendanceCount > 0 && (
                                                            <span className="rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-1 py-0.2 text-[9px] font-bold">
                                                                {attendanceCount}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {hasActivity && (
                                                        <div className="mt-1 flex items-center gap-1">
                                                            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                                                            {dayEvents.length > 1 && (
                                                                <span className="text-[9px] text-muted-foreground">
                                                                    {dayEvents.length}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Selected Day Activity Details */}
                                <div className="rounded-lg border bg-muted/20 p-3.5">
                                    <div className="flex items-center justify-between pb-2.5 border-b border-border/50">
                                        <div>
                                            <p className="text-xs font-bold">
                                                {getSelectedDayLabel(selectedActivityDate)}
                                            </p>
                                            <p className="text-[11px] text-muted-foreground">
                                                {selectedActivityEvents.length === 0
                                                    ? 'No activity'
                                                    : `${selectedActivityEvents.length} recorded`}
                                            </p>
                                        </div>

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            type="button"
                                            onClick={() => {
                                                const todayKeyLocal = getIndiaDateKey(new Date().toISOString());
                                                const today = parseDateOnly(todayKeyLocal);
                                                setCalendarMonth(new Date(today.getFullYear(), today.getMonth(), 1));
                                                setSelectedActivityDate(todayKeyLocal);
                                            }}
                                            className="h-7 text-xs px-2"
                                        >
                                            Today
                                        </Button>
                                    </div>

                                    {selectedActivityEvents.length === 0 ? (
                                        <div className="py-4 text-center text-xs text-muted-foreground">
                                            No activity recorded on this day.
                                        </div>
                                    ) : (
                                        <div className="mt-2.5 flex flex-col gap-2">
                                            {selectedActivityEvents.map((event) => (
                                                <TimelineEventCard key={event.id} event={event} />
                                            ))}
                                        </div>
                                    )}
                                </div>
                        </Card>
                    </div>

                    {/* Engagement Snapshot (narrower, 2/5 cols) */}
                    <div className="lg:col-span-2 order-1 lg:order-2 flex flex-col gap-6">
                        <Card className="border-border h-full">
                            <CardHeader className="flex flex-row items-center justify-between pb-3">
                                <div>
                                    <CardTitle className="text-base font-bold">Engagement Snapshot</CardTitle>
                                    <CardDescription>Attendance velocity and adherence</CardDescription>
                                </div>
                                <Badge variant="outline" className={`gap-1 text-xs font-semibold ${attendanceTrend.className}`}>
                                    <TrendIcon className="h-3.5 w-3.5" />
                                    {attendanceTrend.label}
                                </Badge>
                            </CardHeader>

                            <CardContent className="flex flex-col gap-4">
                                <div className="grid gap-3 grid-cols-2">
                                    <div className="rounded-lg border bg-muted/20 p-3">
                                        <p className="text-xs text-muted-foreground font-medium">Last 14d</p>
                                        <p className="mt-1 text-xl font-bold tracking-tight">
                                            {attendanceSnapshot.recentVisits} <span className="text-xs font-normal text-muted-foreground">visits</span>
                                        </p>
                                    </div>

                                    <div className="rounded-lg border bg-muted/20 p-3">
                                        <p className="text-xs text-muted-foreground font-medium">Prior 14d</p>
                                        <p className="mt-1 text-xl font-bold tracking-tight">
                                            {attendanceSnapshot.previousVisits} <span className="text-xs font-normal text-muted-foreground">visits</span>
                                        </p>
                                    </div>

                                    <div className="rounded-lg border bg-muted/20 p-3">
                                        <p className="text-xs text-muted-foreground font-medium">Expected (14d)</p>
                                        <p className="mt-1 text-xl font-bold tracking-tight">
                                            {attendanceSnapshot.expectedVisitsInWindow === null
                                                ? '—'
                                                : `${attendanceSnapshot.expectedVisitsInWindow}`}
                                        </p>
                                    </div>

                                    <div className="rounded-lg border bg-muted/20 p-3 col-span-2">
                                        <p className="text-xs text-muted-foreground font-medium">Last Check-in</p>
                                        <p className="mt-1 text-xs font-bold leading-snug">
                                            {attendanceSnapshot.lastVisit
                                                ? formatDateTime(attendanceSnapshot.lastVisit)
                                                : 'No visits'}
                                        </p>
                                    </div>
                                </div>

                                {attendanceSnapshot.adherencePercentage !== null && (
                                    <div className="rounded-lg border bg-muted/20 p-3">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-xs font-semibold text-foreground">Adherence</p>
                                                <p className="text-[11px] text-muted-foreground">
                                                    {attendanceSnapshot.recentVisits}/{attendanceSnapshot.expectedVisitsInWindow} visits
                                                </p>
                                            </div>
                                            <p className="text-2xl font-extrabold text-foreground">
                                                {attendanceSnapshot.adherencePercentage}%
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {attendanceSnapshot.visitGap !== null && attendanceSnapshot.visitGap < 0 && (
                                    <Alert className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 py-2.5">
                                        <AlertTriangle className="h-4 w-4" />
                                        <AlertTitle className="text-xs font-bold">Attendance Gap</AlertTitle>
                                        <AlertDescription className="text-xs mt-0.5">
                                            {Math.abs(attendanceSnapshot.visitGap)} fewer visits than target.
                                        </AlertDescription>
                                    </Alert>
                                )}

                                {openSignals.some((signal) => signal.type === 'attendance_decline') && (
                                    <Alert variant="destructive" className="py-2.5">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertTitle className="text-xs font-bold">Decline Signal Active</AlertTitle>
                                        <AlertDescription className="text-xs mt-0.5">
                                            Review evidence below.
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* ROW 3: Retention Signals & Persistent Follow-ups */}
                <div className="grid gap-6 lg:grid-cols-5">
                    {/* Signal History (3/5 cols) */}
                    <div className="lg:col-span-3 flex flex-col gap-6">
                        <Card className="border-border">
                            <CardHeader className="flex flex-row items-center justify-between pb-3">
                                <div>
                                    <CardTitle className="text-base font-bold">Retention Signals</CardTitle>
                                    <CardDescription>
                                        System-detected risks and recorded staff actions
                                    </CardDescription>
                                </div>
                                <span className="text-xs text-muted-foreground font-medium">
                                    {openSignals.length} open · {member.signals.length} total
                                </span>
                            </CardHeader>
                            <CardContent className="flex flex-col gap-4">
                                {member.signals.length === 0 ? (
                                    <div className="rounded-lg border border-dashed p-6 text-center">
                                        <p className="font-semibold text-xs">No signals recorded</p>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            Signals will appear automatically when drop-off or expiry conditions trigger.
                                        </p>
                                    </div>
                                ) : (
                                    member.signals.map((signal) => (
                                        <SignalHistoryCard
                                            key={signal.id}
                                            memberId={member.id}
                                            signal={signal}
                                        />
                                    ))
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Follow-up Task Panel (2/5 cols) */}
                    <div className="lg:col-span-2 flex flex-col">
                        <FollowUpTaskPanel
                            tasks={followUpTasks}
                            memberId={member.id}
                            title="Member Follow-ups"
                        />
                    </div>
                </div>


                {/* ROW 4: History & Records Tables */}
                <div className="flex flex-col gap-6">
                    {/* Membership History Table */}
                    <Card className="border-border">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-bold">Membership History</CardTitle>
                            <CardDescription>All previous memberships and payment records</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/30">
                                            <TableHead>Plan</TableHead>
                                            <TableHead>Start</TableHead>
                                            <TableHead>End</TableHead>
                                            <TableHead>Price</TableHead>
                                            <TableHead>Paid</TableHead>
                                            <TableHead>Balance</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {historicalMemberships.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={8} className="h-20 text-center text-xs text-muted-foreground">
                                                    No historical memberships recorded.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            historicalMemberships.map((m) => {
                                                const lifecycleStatus = m.lifecycle_status ?? m.status;
                                                const canRenew = lifecycleStatus === 'expired';

                                                return (
                                                    <TableRow key={m.id} className="hover:bg-muted/30 transition-colors">
                                                        <TableCell className="font-semibold text-xs">
                                                            {m.membership_plan.name}
                                                        </TableCell>
                                                        <TableCell className="text-xs text-muted-foreground">
                                                            {formatDate(m.start_date)}
                                                        </TableCell>
                                                        <TableCell className="text-xs text-muted-foreground">
                                                            {formatDate(m.end_date)}
                                                        </TableCell>
                                                        <TableCell className="text-xs">{formatCurrency(Number(m.price))}</TableCell>
                                                        <TableCell className="text-xs font-semibold text-emerald-600">{formatCurrency(m.amount_paid)}</TableCell>
                                                        <TableCell className="text-xs">
                                                            <span className={m.balance_due > 0 ? 'text-destructive font-bold' : ''}>
                                                                {formatCurrency(m.balance_due)}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline" className="capitalize text-[10px]">
                                                                {lifecycleStatus}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            {canRenew ? (
                                                                <Button variant="ghost" size="sm" asChild className="h-7 text-xs font-semibold">
                                                                    <Link href={`/members/${member.id}/memberships/${m.id}/renew`}>
                                                                        Renew
                                                                    </Link>
                                                                </Button>
                                                            ) : (
                                                                <span className="text-muted-foreground text-xs">—</span>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Intervention History & Context History in 2 Columns */}
                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* Intervention History */}
                        <Card className="border-border">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base font-bold">Intervention History</CardTitle>
                                <CardDescription>Staff actions, member responses, and observed results</CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-col gap-3">
                                {member.interventions.length === 0 ? (
                                    <p className="text-xs text-muted-foreground py-4 text-center">
                                        No interventions recorded yet.
                                    </p>
                                ) : (
                                    <div className="divide-y divide-border">
                                        {member.interventions.map((intervention) => (
                                            <div key={intervention.id} className="py-3.5 first:pt-0 last:pb-0 flex flex-col gap-1.5">
                                                <div className="flex items-start justify-between gap-3">
                                                    <span className="font-bold text-xs">
                                                        {getInterventionLabel(intervention.type)}
                                                    </span>
                                                    <span className="text-[11px] text-muted-foreground shrink-0 text-right">
                                                        {formatDateTime(intervention.intervened_at)}
                                                    </span>
                                                </div>

                                                {intervention.notes && (
                                                    <p className="text-xs text-muted-foreground">
                                                        {intervention.notes}
                                                    </p>
                                                )}

                                                {intervention.outcome && (
                                                    <div className="rounded-md bg-muted/40 p-2 text-xs">
                                                        <span className="font-semibold text-foreground">Outcome: </span>
                                                        <span className="text-muted-foreground">{intervention.outcome}</span>
                                                    </div>
                                                )}

                                                {intervention.follow_up_status !== 'unavailable' && (
                                                    <div className="mt-1 rounded-md border bg-muted/20 p-2 text-[11px]">
                                                        <p className="font-semibold">Observed Attendance Impact</p>
                                                        {intervention.follow_up_status === 'in_progress' ? (
                                                            <p className="text-muted-foreground">
                                                                14-day observation window is in progress.
                                                            </p>
                                                        ) : (
                                                            <div className="mt-1.5 grid grid-cols-3 gap-2 text-center">
                                                                <div className="rounded border bg-card p-1">
                                                                    <span className="text-muted-foreground">Before</span>
                                                                    <p className="font-bold">{intervention.attendance_before_14d ?? 0}</p>
                                                                </div>
                                                                <div className="rounded border bg-card p-1">
                                                                    <span className="text-muted-foreground">After</span>
                                                                    <p className="font-bold">{intervention.attendance_after_14d ?? 0}</p>
                                                                </div>
                                                                <div className="rounded border bg-card p-1">
                                                                    <span className="text-muted-foreground">Change</span>
                                                                    <p className={`font-bold ${(intervention.attendance_change ?? 0) > 0 ? 'text-emerald-600' : ''}`}>
                                                                        {(intervention.attendance_change ?? 0) > 0 ? '+' : ''}
                                                                        {intervention.attendance_change ?? 0}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Context History */}
                        <Card className="border-border">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base font-bold">Context History</CardTitle>
                                <CardDescription>Timeline of expectation and goal changes</CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-col gap-4">
                                <div className="flex flex-col gap-2">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Attendance Expectations</p>
                                    <div className="divide-y divide-border rounded-md border bg-muted/10">
                                        {member.expectations.length === 0 ? (
                                            <p className="p-3 text-xs text-muted-foreground">No expectation changes recorded.</p>
                                        ) : (
                                            [...member.expectations]
                                                .sort((a, b) => b.start_date.localeCompare(a.start_date))
                                                .map((expectation) => (
                                                    <div key={expectation.id} className="p-2.5 flex items-center justify-between gap-3 text-xs">
                                                        <div className="min-w-0">
                                                            <p className="font-bold">
                                                                {expectation.visits_per_week} visits / week
                                                            </p>
                                                            <p className="text-[11px] text-muted-foreground">
                                                                {formatDate(expectation.start_date)} → {expectation.end_date ? formatDate(expectation.end_date) : 'Present'}
                                                            </p>
                                                        </div>
                                                        <Badge variant={expectation.end_date === null ? "default" : "secondary"} className="text-[10px] shrink-0">
                                                            {expectation.end_date === null ? 'Current' : 'Past'}
                                                        </Badge>
                                                    </div>
                                                ))
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Goal Timeline</p>
                                    <div className="divide-y divide-border rounded-md border bg-muted/10">
                                        {member.goals.length === 0 ? (
                                            <p className="p-3 text-xs text-muted-foreground">No goal changes recorded.</p>
                                        ) : (
                                            [...member.goals]
                                                .sort((a, b) => b.start_date.localeCompare(a.start_date))
                                                .map((goal) => (
                                                    <div key={goal.id} className="p-2.5 flex items-center justify-between gap-3 text-xs">
                                                        <div className="min-w-0">
                                                            <p className="font-bold capitalize">
                                                                {goal.goal.replace(/_/g, ' ')}
                                                            </p>
                                                            <p className="text-[11px] text-muted-foreground">
                                                                {formatDate(goal.start_date)} → {goal.end_date ? formatDate(goal.end_date) : 'Present'}
                                                            </p>
                                                        </div>
                                                        <Badge variant={goal.end_date === null ? "default" : "secondary"} className="text-[10px] shrink-0">
                                                            {goal.end_date === null ? 'Current' : 'Past'}
                                                        </Badge>
                                                    </div>
                                                ))
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}

function TimelineEventCard({ event }: { event: TimelineEvent }) {
    return (
        <div className="flex items-start gap-2.5 rounded-md border bg-card p-2.5 text-xs">
            <div className="mt-1 flex h-2 w-2 rounded-full bg-primary shrink-0" />
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                    <p className="font-semibold text-foreground">
                        {getTimelineTitle(event)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                        {formatTimelineEventTime(event)}
                    </p>
                </div>
                <TimelineEventContent event={event} />
            </div>
        </div>
    );
}

function TimelineEventContent({ event }: { event: TimelineEvent }) {
    switch (event.type) {
        case 'membership_started':
            return (
                <p className="mt-0.5 text-xs text-muted-foreground">
                    {event.data.plan ?? 'Membership'} · {formatCurrency(event.data.price ?? 0)}
                    {event.data.end_date && <> · ends {formatDate(event.data.end_date)}</>}
                </p>
            );

        case 'payment_received':
            return (
                <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatCurrency(event.data.amount ?? 0)} via {formatPaymentMethod(event.data.payment_method)}
                </p>
            );

        case 'attendance_recorded':
            return (
                <p className="mt-0.5 text-xs text-muted-foreground">
                    Check-in source: {event.data.source ?? 'manual'}
                </p>
            );

        case 'signal_detected':
            return (
                <div className="mt-0.5 text-xs text-muted-foreground">
                    <p>{getSignalTypeLabel(event.data.signal_type ?? '')}</p>
                    {event.data.severity && (
                        <p className="capitalize">Severity: {event.data.severity}</p>
                    )}
                </div>
            );

        case 'intervention_recorded':
            return (
                <div className="mt-0.5 text-xs text-muted-foreground">
                    <p>{getInterventionLabel(event.data.type ?? '')}</p>
                    {event.data.notes && <p className="italic">{event.data.notes}</p>}
                    {event.data.outcome && <p>Outcome: {event.data.outcome}</p>}
                </div>
            );

        case 'signal_resolved':
            return (
                <p className="mt-0.5 text-xs text-emerald-600 dark:text-emerald-400">
                    The underlying condition recovered.
                </p>
            );

        case 'signal_dismissed':
            return (
                <div className="mt-0.5 text-xs text-muted-foreground">
                    {event.data.reason && <p>{getDismissalReasonLabel(event.data.reason)}</p>}
                    {event.data.notes && <p className="italic">{event.data.notes}</p>}
                </div>
            );

        default:
            return null;
    }
}

type SignalHistoryCardProps = {
    memberId: string;
    signal: Signal;
};

function SignalHistoryCard({
    memberId,
    signal,
}: SignalHistoryCardProps) {
    const {
        data,
        setData,
        post,
        processing,
        errors,
        reset,
        transform,
    } = useForm<InterventionForm>({
        signal_id: signal.id,
        type: '',
        notes: '',
        outcome: '',
    });

    const status = getSignalStatusPresentation(signal.status);
    const severity = getSeverityPresentation(signal.severity);
    const isAttendanceDecline = signal.type === 'attendance_decline';
    const isMembershipExpiring = signal.type === 'membership_expiring';

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        transform((formData) => ({
            ...formData,
            signal_id: signal.id,
            notes: formData.notes || null,
            outcome: formData.outcome || null,
        }));

        post(`/members/${memberId}/interventions`, {
            preserveScroll: true,
            onSuccess: () => {
                reset('type', 'notes', 'outcome');
            },
        });
    };

    return (
        <Card className="overflow-hidden border border-border">
            <CardHeader className="pb-3 flex flex-col gap-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <CardTitle className="text-sm font-bold">
                            {getSignalTypeLabel(signal.type)}
                        </CardTitle>
                        <Badge variant={severity.badgeVariant} className={severity.className}>
                            {signal.severity}
                        </Badge>
                        <Badge variant={status.badgeVariant} className={status.className}>
                            {status.label}
                        </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                        Detected {formatDateTime(signal.detected_at)}
                    </span>
                </div>
            </CardHeader>

            <CardContent className="flex flex-col gap-3 text-xs">
                {/* Attendance decline evidence */}
                {isAttendanceDecline && (
                    <div className="flex flex-col gap-2.5">
                        {signal.evidence.decline_percentage !== undefined && (
                            <p className="text-xs font-medium">
                                Attendance declined by{' '}
                                <span className="text-destructive font-bold">
                                    {signal.evidence.decline_percentage}%
                                </span>
                            </p>
                        )}
                        <div className="grid gap-2.5 sm:grid-cols-3">
                            {signal.evidence.baseline_average !== undefined && (
                                <EvidenceItem
                                    label="Baseline"
                                    value={`${signal.evidence.baseline_average}/week`}
                                />
                            )}
                            {signal.evidence.recent_average !== undefined && (
                                <EvidenceItem
                                    label="Recent"
                                    value={`${signal.evidence.recent_average}/week`}
                                />
                            )}
                            {signal.evidence.expected_visits_per_week !== undefined &&
                                signal.evidence.expected_visits_per_week !== null && (
                                    <EvidenceItem
                                        label="Expected"
                                        value={`${signal.evidence.expected_visits_per_week}/week`}
                                    />
                                )}
                        </div>
                    </div>
                )}

                {/* Membership expiring evidence */}
                {isMembershipExpiring && (
                    <div className="flex flex-col gap-2.5">
                        {signal.evidence.days_remaining !== undefined && (
                            <p className="text-xs font-medium">
                                Membership expires in{' '}
                                <span className="font-bold text-amber-600">
                                    {signal.evidence.days_remaining}{' '}
                                    {signal.evidence.days_remaining === 1 ? 'day' : 'days'}
                                </span>
                            </p>
                        )}
                        <div className="grid gap-2.5 sm:grid-cols-3">
                            {signal.evidence.membership_end_date && (
                                <EvidenceItem
                                    label="Ends"
                                    value={formatDate(signal.evidence.membership_end_date)}
                                />
                            )}
                            {signal.evidence.plan && (
                                <EvidenceItem
                                    label="Plan"
                                    value={signal.evidence.plan}
                                />
                            )}
                            {signal.evidence.price !== undefined && (
                                <EvidenceItem
                                    label="Price"
                                    value={`₹${signal.evidence.price}`}
                                />
                            )}
                        </div>
                    </div>
                )}

                {/* Resolution */}
                {signal.status === 'resolved' && signal.resolved_at && (
                    <div className="rounded-lg border bg-muted/20 p-2.5 text-xs">
                        <p className="font-semibold uppercase tracking-wider text-muted-foreground text-[10px]">Resolution</p>
                        <p className="mt-0.5 font-medium text-emerald-600 dark:text-emerald-400">
                            The underlying condition recovered and the signal was automatically resolved.
                        </p>
                        <p className="mt-0.5 text-muted-foreground text-[10px]">
                            Resolved {formatDateTime(signal.resolved_at)}
                        </p>
                    </div>
                )}

                {/* Dismissal */}
                {signal.status === 'dismissed' && (
                    <div className="rounded-lg border bg-muted/20 p-2.5 text-xs">
                        <p className="font-semibold uppercase tracking-wider text-muted-foreground text-[10px]">Dismissal</p>
                        {signal.dismissal_reason && (
                            <p className="mt-0.5 font-medium">{getDismissalReasonLabel(signal.dismissal_reason)}</p>
                        )}
                        {signal.dismissal_notes && (
                            <p className="mt-0.5 text-muted-foreground">{signal.dismissal_notes}</p>
                        )}
                        {signal.dismissed_at && (
                            <p className="mt-0.5 text-muted-foreground text-[10px]">
                                Dismissed {formatDateTime(signal.dismissed_at)}
                            </p>
                        )}
                    </div>
                )}

                {/* Signal Interventions */}
                {signal.interventions.length > 0 && (
                    <div className="border-t pt-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Recorded Staff Actions
                        </p>
                        <div className="mt-2 flex flex-col gap-2">
                            {signal.interventions.map((interv) => (
                                <div key={interv.id} className="rounded-md border bg-card p-2.5 text-xs">
                                    <div className="flex justify-between items-center">
                                        <span className="font-bold">{getInterventionLabel(interv.type)}</span>
                                        <span className="text-[10px] text-muted-foreground">{formatDateTime(interv.intervened_at)}</span>
                                    </div>
                                    {interv.notes && <p className="mt-1 text-muted-foreground">{interv.notes}</p>}
                                    {interv.outcome && (
                                        <p className="mt-0.5 font-medium">Outcome: {interv.outcome}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Record intervention form for open signals */}
                {signal.status === 'open' && (
                    <form onSubmit={submit} className="border-t pt-3 flex flex-col gap-2.5">
                        <p className="text-xs font-bold">Record Action on Signal</p>
                        <div className="flex flex-col gap-1">
                            <Label htmlFor={`type-${signal.id}`} className="text-[11px]">Action Type</Label>
                            <select
                                id={`type-${signal.id}`}
                                value={data.type}
                                onChange={(e) => setData('type', e.target.value)}
                                disabled={processing}
                                className="h-8 w-full rounded-md border border-input bg-background px-3 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                                <option value="" disabled>Choose an action</option>
                                {interventionTypes.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                            {errors.type && <p className="text-xs text-destructive">{errors.type}</p>}
                        </div>

                        <div className="flex flex-col gap-1">
                            <Label htmlFor={`notes-${signal.id}`} className="text-[11px]">Notes</Label>
                            <Textarea
                                id={`notes-${signal.id}`}
                                value={data.notes}
                                onChange={(e) => setData('notes', e.target.value)}
                                disabled={processing}
                                rows={2}
                                placeholder="What did you discuss or do?"
                                className="text-xs"
                            />
                            {errors.notes && <p className="text-xs text-destructive">{errors.notes}</p>}
                        </div>

                        <div className="flex flex-col gap-1">
                            <Label htmlFor={`outcome-${signal.id}`} className="text-[11px]">Outcome</Label>
                            <Textarea
                                id={`outcome-${signal.id}`}
                                value={data.outcome}
                                onChange={(e) => setData('outcome', e.target.value)}
                                disabled={processing}
                                rows={2}
                                placeholder="What happened or what was agreed?"
                                className="text-xs"
                            />
                            {errors.outcome && <p className="text-xs text-destructive">{errors.outcome}</p>}
                        </div>

                        <Button
                            type="submit"
                            disabled={processing || !data.type}
                            size="sm"
                            className="w-fit gap-1.5 h-8 text-xs"
                        >
                            {processing ? (
                                <>
                                    <Spinner className="h-3.5 w-3.5" />
                                    Recording...
                                </>
                            ) : (
                                'Record Intervention'
                            )}
                        </Button>
                    </form>
                )}
            </CardContent>
        </Card>
    );
}

function EvidenceItem({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-md border bg-muted/20 p-2">
            <p className="text-[10px] text-muted-foreground">{label}</p>
            <p className="mt-0.5 text-xs font-bold">{value}</p>
        </div>
    );
}

Show.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
        {
            title: 'Members',
            href: members.index(),
        },
    ],
};