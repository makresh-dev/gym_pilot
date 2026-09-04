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
        type: string;
        notes: string | null;
        outcome: string | null;
        intervened_at: string;
    } | null;
};

type DashboardProps = {
    stats: DashboardStats;
    signals: Signal[];
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

export default function Dashboard({
    stats,
    signals,
}: DashboardProps) {
    return (
        <>
            <Head title="Dashboard" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-semibold">
                        Good morning
                    </h1>

                    <p className="mt-1 text-sm text-muted-foreground">
                        Here’s what needs your attention today.
                    </p>
                </div>

                {/* Main stats */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        label="Active Members"
                        value={stats.active_members}
                    />

                    <StatCard
                        label="Today's Check-ins"
                        value={stats.today_check_ins}
                    />

                    <StatCard
                        label="Expiring Soon"
                        value={stats.expiring_memberships}
                    />

                    <StatCard
                        label="Open Signals"
                        value={stats.open_signals}
                    />
                </div>

                {/* Financial summary */}
                <section className="rounded-xl border p-5">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                        <div>
                            <h2 className="text-lg font-semibold">
                                Outstanding Balance
                            </h2>

                            <p className="mt-1 text-sm text-muted-foreground">
                                Amount currently due across active
                                memberships.
                            </p>
                        </div>

                        <p className="whitespace-nowrap text-2xl font-semibold">
                            ₹{stats.outstanding_balance.toFixed(2)}
                        </p>
                    </div>
                </section>

                {/* Attention Center */}
                <section className="rounded-xl border p-5">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <h2 className="text-lg font-semibold">
                                Members Needing Attention
                            </h2>

                            <p className="mt-1 text-sm text-muted-foreground">
                                Recent changes that may require action.
                            </p>
                        </div>

                        <span className="rounded-full border px-2.5 py-1 text-sm font-medium">
                            {signals.length}
                        </span>
                    </div>

                    <div className="mt-5 space-y-4">
                        {signals.length === 0 ? (
                            <div className="rounded-lg border border-dashed p-8 text-center">
                                <p className="font-medium">
                                    Nothing needs attention right now.
                                </p>

                                <p className="mt-1 text-sm text-muted-foreground">
                                    Your current open signals have been
                                    cleared.
                                </p>
                            </div>
                        ) : (
                            signals.map((signal) => (
                                <SignalCard
                                    key={signal.id}
                                    signal={signal}
                                />
                            ))
                        )}
                    </div>
                </section>
            </div>
        </>
    );
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

    const [error, setError] = useState<string | null>(
        null,
    );

    const isAttendanceDecline =
        signal.type === 'attendance_decline';

    const isMembershipExpiring =
        signal.type === 'membership_expiring';

    const severity = getSeverityPresentation(
        signal.severity,
    );

    const signalTitle = getSignalTitle(signal.type);

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
                    const firstError = Object.values(
                        errors,
                    )[0];

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
                    const firstError = Object.values(
                        errors,
                    )[0];

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
            {/* Severity indicator */}
            <div className={severity.indicatorClass} />

            <div className="p-5">
                {/* Header */}
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
                        </div>

                        <p className="mt-1 text-sm text-muted-foreground">
                            {signalTitle}
                        </p>
                    </div>
                </div>

                {/* Attendance decline evidence */}
                {isAttendanceDecline && (
                    <div className="mt-5">
                        {signal.evidence.decline_percentage !==
                            undefined && (
                                <p className="text-sm">
                                    Attendance declined by{' '}
                                    <span className="font-semibold">
                                        {
                                            signal.evidence
                                                .decline_percentage
                                        }
                                        %
                                    </span>
                                    .
                                </p>
                            )}

                        <div className="mt-3 grid gap-3 sm:grid-cols-3">
                            {signal.evidence
                                .baseline_average !==
                                undefined && (
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
                                    .expected_visits_per_week !==
                                null && (
                                    <EvidenceItem
                                        label="Expected"
                                        value={`${signal.evidence.expected_visits_per_week}/week`}
                                    />
                                )}
                        </div>
                    </div>
                )}

                {/* Membership expiry evidence */}
                {isMembershipExpiring && (
                    <div className="mt-5">
                        {signal.evidence.days_remaining !==
                            undefined && (
                                <p className="text-sm">
                                    Membership expires in{' '}
                                    <span className="font-semibold">
                                        {
                                            signal.evidence
                                                .days_remaining
                                        }{' '}
                                        {signal.evidence
                                            .days_remaining === 1
                                            ? 'day'
                                            : 'days'}
                                    </span>
                                    .
                                </p>
                            )}

                        <div className="mt-3 grid gap-3 sm:grid-cols-3">
                            {signal.evidence
                                .membership_end_date && (
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
                                    value={
                                        signal.evidence
                                            .plan
                                    }
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
                                            setShowInterventionForm(
                                                true,
                                            )
                                        }
                                        className="inline-flex rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
                                    >
                                        Record Intervention
                                    </button>

                                    <Link
                                        href={`/members/${signal.member.id}`}
                                        className="inline-flex rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted"
                                    >
                                        View Member
                                    </Link>

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
                                            setShowDismissForm(
                                                true,
                                            );
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
                                    Record what you actually did. The
                                    signal stays open until its condition
                                    is resolved.
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
                            {/* Intervention type */}
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
                                                key={
                                                    option.value
                                                }
                                                value={
                                                    option.value
                                                }
                                            >
                                                {option.label}
                                            </option>
                                        ),
                                    )}
                                </select>
                            </div>

                            {/* Notes */}
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
                                        setNotes(
                                            event.target
                                                .value,
                                        )
                                    }
                                    disabled={processing}
                                    rows={3}
                                    placeholder="What happened?"
                                    className="mt-1.5 w-full resize-y rounded-md border bg-background px-3 py-2 text-sm"
                                />
                            </div>

                            {/* Outcome */}
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
                                        setOutcome(
                                            event.target
                                                .value,
                                        )
                                    }
                                    disabled={processing}
                                    rows={3}
                                    placeholder="What was the result?"
                                    className="mt-1.5 w-full resize-y rounded-md border bg-background px-3 py-2 text-sm"
                                />
                            </div>

                            {/* Error */}
                            {error && (
                                <ErrorMessage message={error} />
                            )}

                            {/* Actions */}
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
                                    onClick={
                                        submitIntervention
                                    }
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
                            {/* Reason */}
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
                                                key={
                                                    option.value
                                                }
                                                value={
                                                    option.value
                                                }
                                            >
                                                {option.label}
                                            </option>
                                        ),
                                    )}
                                </select>
                            </div>

                            {/* Notes */}
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
                                            event.target
                                                .value,
                                        )
                                    }
                                    disabled={processing}
                                    rows={3}
                                    placeholder="Add any useful context..."
                                    className="mt-1.5 w-full resize-y rounded-md border bg-background px-3 py-2 text-sm"
                                />
                            </div>

                            {/* Error */}
                            {error && (
                                <ErrorMessage message={error} />
                            )}

                            {/* Actions */}
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
                                    {
                                        signal.latest_intervention
                                            .outcome
                                    }
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
                indicatorClass: 'h-1.5 bg-amber-500',
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
};

function StatCard({
    label,
    value,
}: StatCardProps) {
    return (
        <div className="rounded-xl border p-5">
            <p className="text-sm text-muted-foreground">
                {label}
            </p>

            <p className="mt-2 text-3xl font-semibold">
                {value}
            </p>
        </div>
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