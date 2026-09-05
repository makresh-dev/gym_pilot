import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { dashboard } from '@/routes';

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

type DashboardProps = {
    stats: DashboardStats;
    signals: Signal[];
    followUpTasks: FollowUpTask[];
    dailyWorkQueue: DailyWorkQueue;
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
}: DashboardProps) {
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

                {/* Financial summary */}
                <Link
                    href="/members?financial_status=outstanding"
                    className="group rounded-xl border p-5 transition hover:bg-muted/20"
                >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                        <div>
                            <h2 className="text-lg font-semibold">
                                Outstanding Balance
                            </h2>

                            <p className="mt-1 text-sm text-muted-foreground">
                                Amount currently due across active
                                memberships.
                            </p>
                        </div>

                        <div className="text-left sm:text-right">
                            <p className="whitespace-nowrap text-2xl font-semibold">
                                {formatCurrency(
                                    stats.outstanding_balance,
                                )}
                            </p>

                            <p className="mt-1 text-xs text-muted-foreground group-hover:text-foreground">
                                View members with outstanding balances →
                            </p>
                        </div>
                    </div>
                </Link>

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
        </>
    );
}

type WorkQueueColumnProps = {
    title: string;
    description: string;
    count: number;
    tone: 'overdue' | 'today' | 'upcoming';
    children: React.ReactNode;
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