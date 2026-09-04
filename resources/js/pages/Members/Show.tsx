import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState, type FormEvent } from 'react';
import { dashboard } from '@/routes';
import members from '@/routes/members';

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

type ShowProps = {
    member: Member;
    checkedInToday: boolean;
    timeline: TimelineEvent[];
};

type InterventionForm = {
    signal_id: string;
    type: string;
    notes: string;
    outcome: string;
};

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
    const start = new Date(
        `${membership.start_date}T00:00:00`,
    );

    const end = new Date(
        `${membership.end_date}T00:00:00`,
    );

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
    className: string;
} {
    switch (status) {
        case 'open':
            return {
                label: 'Open',
                className:
                    'border-destructive/30 text-destructive',
            };

        case 'resolved':
            return {
                label: 'Resolved',
                className:
                    'border-emerald-500/30 text-emerald-600 dark:text-emerald-400',
            };

        case 'dismissed':
            return {
                label: 'Dismissed',
                className:
                    'border-muted-foreground/30 text-muted-foreground',
            };

        default:
            return {
                label: status.replace(/_/g, ' '),
                className:
                    'border-border text-muted-foreground',
            };
    }
}

function getSeverityPresentation(
    severity: string,
): {
    className: string;
} {
    switch (severity) {
        case 'high':
            return {
                className:
                    'border-destructive/30 text-destructive',
            };

        case 'medium':
            return {
                className:
                    'border-amber-500/30 text-amber-600 dark:text-amber-400',
            };

        case 'low':
            return {
                className:
                    'border-muted-foreground/30 text-muted-foreground',
            };

        default:
            return {
                className:
                    'border-border text-muted-foreground',
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

function groupTimelineByDay(
    timeline: TimelineEvent[],
): {
    date: string;
    events: TimelineEvent[];
}[] {
    const groups = new Map<
        string,
        TimelineEvent[]
    >();

    for (const event of timeline) {
        const day = getTimelineDay(event);

        const existing = groups.get(day);

        if (existing) {
            existing.push(event);
        } else {
            groups.set(day, [event]);
        }
    }

    return Array.from(groups.entries()).map(
        ([date, events]) => ({
            date,
            events,
        }),
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

export default function Show({
    member,
    checkedInToday,
    timeline,
}: ShowProps) {
    const currentExpectation =
        member.expectations.find(
            (expectation) => expectation.end_date === null,
        ) ?? null;

    const currentGoal =
        member.goals.find(
            (goal) => goal.end_date === null,
        ) ?? null;

    const openSignals = member.signals.filter(
        (signal) => signal.status === 'open',
    );

    const currentMembership =
        member.memberships.find(
            (membership) =>
                membership.lifecycle_status === 'active',
        ) ?? null;

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

    const hasActiveMembership = member.memberships.some(
        (membership) =>
            membership.lifecycle_status === 'active',
    );

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

    return (
        <>
            <Head title={member.name} />

            <div className="mx-auto max-w-6xl p-6">
                {/* Header */}
                <div className="mb-6">
                    <Link
                        href={members.index()}
                        className="text-sm text-muted-foreground hover:underline"
                    >
                        ← Back to Members
                    </Link>

                    <div className="mt-4">
                        <h1 className="text-3xl font-semibold">
                            {member.name}
                        </h1>

                        <p className="mt-1 text-sm text-muted-foreground">
                            {member.phone}

                            {member.email
                                ? ` · ${member.email}`
                                : ''}
                        </p>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                        <div>
                            <button
                                type="button"
                                disabled={
                                    checkedInToday ||
                                    checkingIn ||
                                    !hasActiveMembership
                                }
                                onClick={handleCheckIn}
                                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {checkedInToday
                                    ? 'Checked In Today'
                                    : checkingIn
                                        ? 'Checking In...'
                                        : 'Check In'}
                            </button>

                            {checkInError ? (
                                <p className="mt-2 text-sm text-destructive">
                                    {checkInError}
                                </p>
                            ) : !hasActiveMembership ? (
                                <p className="mt-2 text-sm text-muted-foreground">
                                    Add an active membership before checking in.
                                </p>
                            ) : null}
                        </div>

                        <Link
                            href={members.memberships.create(
                                member.id,
                            )}
                            className="rounded-md border px-4 py-2 text-sm font-medium"
                        >
                            Add Membership
                        </Link>

                        <Link
                            href={members.edit(member.id)}
                            className="rounded-md border px-4 py-2 text-sm font-medium"
                        >
                            Edit
                        </Link>

                        <button
                            type="button"
                            onClick={() => {
                                if (
                                    window.confirm(
                                        `Archive ${member.name}? Their historical data will be preserved.`,
                                    )
                                ) {
                                    router.delete(
                                        members.destroy(
                                            member.id,
                                        ).url,
                                    );
                                }
                            }}
                            className="rounded-md border px-4 py-2 text-sm font-medium text-destructive"
                        >
                            Archive
                        </button>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Overview */}
                    <section className="rounded-lg border p-5">
                        <h2 className="text-lg font-semibold">
                            Overview
                        </h2>

                        <div className="mt-4 space-y-3 text-sm">
                            <div className="flex justify-between gap-4">
                                <span className="text-muted-foreground">
                                    Phone
                                </span>

                                <span>{member.phone}</span>
                            </div>

                            <div className="flex justify-between gap-4">
                                <span className="text-muted-foreground">
                                    Email
                                </span>

                                <span>
                                    {member.email ?? '—'}
                                </span>
                            </div>

                            <div className="flex justify-between gap-4">
                                <span className="text-muted-foreground">
                                    Date of birth
                                </span>

                                <span>
                                    {member.date_of_birth
                                        ? formatDate(
                                            member.date_of_birth,
                                        )
                                        : '—'}
                                </span>
                            </div>
                        </div>
                    </section>

                    {/* Context */}
                    <section className="rounded-lg border p-5">
                        <h2 className="text-lg font-semibold">
                            Context
                        </h2>

                        <div className="mt-4 space-y-4 text-sm">
                            <div>
                                <p className="text-muted-foreground">
                                    Expected visits
                                </p>

                                <p className="mt-1 font-medium">
                                    {currentExpectation
                                        ? `${currentExpectation.visits_per_week} / week`
                                        : 'Not set'}
                                </p>
                            </div>

                            <div>
                                <p className="text-muted-foreground">
                                    Current goal
                                </p>

                                <p className="mt-1 font-medium capitalize">
                                    {currentGoal
                                        ? currentGoal.goal.replace(
                                            /_/g,
                                            ' ',
                                        )
                                        : 'Not set'}
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Unified Timeline */}
                    <section className="rounded-lg border p-5 md:col-span-2">
                        <div>
                            <h2 className="text-lg font-semibold">
                                Timeline
                            </h2>

                            <p className="mt-1 text-sm text-muted-foreground">
                                Everything that has happened with this
                                member.
                            </p>
                        </div>

                        <div className="mt-6">
                            {timeline.length === 0 ? (
                                <div className="rounded-lg border border-dashed p-6 text-center">
                                    <p className="font-medium">
                                        No activity recorded yet.
                                    </p>

                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Memberships, payments,
                                        attendance, signals, and
                                        interventions will appear here.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    {groupTimelineByDay(
                                        timeline,
                                    ).map((group) => (
                                        <div key={group.date}>
                                            <div className="mb-4 flex items-center gap-3">
                                                <h3 className="text-sm font-semibold">
                                                    {getTimelineDayLabel(
                                                        group.date,
                                                    )}
                                                </h3>

                                                <div className="h-px flex-1 bg-border" />
                                            </div>

                                            <div className="relative space-y-5 pl-1">
                                                {group.events.map(
                                                    (event) => (
                                                        <TimelineEvent
                                                            key={
                                                                event.id
                                                            }
                                                            event={
                                                                event
                                                            }
                                                        />
                                                    ),
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Attendance */}
                    <section className="rounded-lg border p-5">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-semibold">
                                    Recent Attendance
                                </h2>

                                <p className="mt-1 text-sm text-muted-foreground">
                                    Latest member check-ins.
                                </p>
                            </div>

                            <span className="text-sm text-muted-foreground">
                                {member.attendances.length}{' '}
                                recent
                            </span>
                        </div>

                        <div className="mt-4 space-y-3">
                            {member.attendances.length ===
                                0 ? (
                                <p className="text-sm text-muted-foreground">
                                    No attendance records.
                                </p>
                            ) : (
                                member.attendances.map(
                                    (attendance) => (
                                        <div
                                            key={
                                                attendance.id
                                            }
                                            className="flex items-center justify-between border-b pb-3 last:border-0"
                                        >
                                            <div>
                                                <p className="text-sm font-medium">
                                                    {formatDateTime(
                                                        attendance.check_in_at,
                                                    )}
                                                </p>
                                            </div>

                                            <span className="text-xs capitalize text-muted-foreground">
                                                {
                                                    attendance.source
                                                }
                                            </span>
                                        </div>
                                    ),
                                )
                            )}
                        </div>
                    </section>

                    {/* Current Membership */}
                    <section className="rounded-lg border p-5 md:col-span-2">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-semibold">
                                    Current Membership
                                </h2>

                                <p className="mt-1 text-sm text-muted-foreground">
                                    The membership currently granting
                                    access.
                                </p>
                            </div>

                            <Link
                                href={members.memberships.create(
                                    member.id,
                                )}
                                className="rounded-md border px-4 py-2 text-sm font-medium"
                            >
                                Add Membership
                            </Link>
                        </div>

                        {currentMembership ? (
                            <div className="mt-5 rounded-lg border bg-muted/20 p-5">
                                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h3 className="text-xl font-semibold">
                                                {
                                                    currentMembership
                                                        .membership_plan
                                                        .name
                                                }
                                            </h3>

                                            <span className="rounded-full border px-2.5 py-1 text-xs font-medium capitalize">
                                                {currentMembership.lifecycle_status ??
                                                    currentMembership.status}
                                            </span>
                                        </div>

                                        <p className="mt-2 text-sm text-muted-foreground">
                                            {
                                                currentMembership.start_date
                                            }{' '}
                                            →{' '}
                                            {
                                                currentMembership.end_date
                                            }
                                        </p>
                                    </div>

                                    <div className="text-left lg:text-right">
                                        <p className="text-sm text-muted-foreground">
                                            Membership price
                                        </p>

                                        <p className="mt-1 text-2xl font-semibold">
                                            {formatCurrency(
                                                Number(
                                                    currentMembership.price,
                                                ),
                                            )}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                                    <div className="rounded-md border p-4">
                                        <p className="text-sm text-muted-foreground">
                                            Paid
                                        </p>

                                        <p className="mt-1 text-lg font-semibold">
                                            {formatCurrency(
                                                currentPaid,
                                            )}
                                        </p>
                                    </div>

                                    <div className="rounded-md border p-4">
                                        <p className="text-sm text-muted-foreground">
                                            Outstanding
                                        </p>

                                        <p
                                            className={`mt-1 text-lg font-semibold ${currentBalance >
                                                0
                                                ? 'text-destructive'
                                                : ''
                                                }`}
                                        >
                                            {formatCurrency(
                                                currentBalance,
                                            )}
                                        </p>
                                    </div>

                                    <div className="rounded-md border p-4">
                                        <p className="text-sm text-muted-foreground">
                                            Plan duration
                                        </p>

                                        <p className="mt-1 text-lg font-semibold">
                                            {getDurationDays(
                                                currentMembership,
                                            )}{' '}
                                            days
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-6 flex flex-wrap gap-3">
                                    {currentBalance > 0 && (
                                        <Link
                                            href={
                                                members
                                                    .memberships
                                                    .payments
                                                    .create([
                                                        member.id,
                                                        currentMembership.id,
                                                    ])
                                            }
                                            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                                        >
                                            Record Payment
                                        </Link>
                                    )}

                                    <Link
                                        href={`/members/${member.id}/memberships/${currentMembership.id}/renew`}
                                        className="rounded-md border px-4 py-2 text-sm font-medium"
                                    >
                                        Renew
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <div className="mt-5 rounded-lg border border-dashed px-6 py-10 text-center">
                                <p className="font-medium">
                                    No current membership
                                </p>

                                <p className="mt-1 text-sm text-muted-foreground">
                                    This member does not currently have an
                                    active membership.
                                </p>

                                <Link
                                    href={members.memberships.create(
                                        member.id,
                                    )}
                                    className="mt-4 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                                >
                                    Add Membership
                                </Link>
                            </div>
                        )}
                    </section>

                    {/* Upcoming Membership */}
                    {upcomingMembership && (
                        <section className="rounded-lg border p-5 md:col-span-2">
                            <div>
                                <h2 className="text-lg font-semibold">
                                    Upcoming Membership
                                </h2>

                                <p className="mt-1 text-sm text-muted-foreground">
                                    The next membership scheduled for this
                                    member.
                                </p>
                            </div>

                            <div className="mt-5 rounded-lg border p-5">
                                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h3 className="font-semibold">
                                                {
                                                    upcomingMembership
                                                        .membership_plan
                                                        .name
                                                }
                                            </h3>

                                            <span className="rounded-full border px-2.5 py-1 text-xs font-medium">
                                                upcoming
                                            </span>
                                        </div>

                                        <p className="mt-2 text-sm text-muted-foreground">
                                            {
                                                upcomingMembership.start_date
                                            }{' '}
                                            →{' '}
                                            {
                                                upcomingMembership.end_date
                                            }
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-sm text-muted-foreground">
                                            Price
                                        </p>

                                        <p className="mt-1 font-semibold">
                                            {formatCurrency(
                                                Number(
                                                    upcomingMembership.price,
                                                ),
                                            )}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <p className="text-sm text-muted-foreground">
                                            Paid
                                        </p>

                                        <p className="mt-1 font-medium">
                                            {formatCurrency(
                                                upcomingPaid,
                                            )}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-sm text-muted-foreground">
                                            Outstanding
                                        </p>

                                        <p className="mt-1 font-medium">
                                            {formatCurrency(
                                                upcomingBalance,
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Membership History */}
                    <section className="rounded-lg border p-5 md:col-span-2">
                        <div>
                            <h2 className="text-lg font-semibold">
                                Membership History
                            </h2>

                            <p className="mt-1 text-sm text-muted-foreground">
                                Previous memberships and their payment
                                history.
                            </p>
                        </div>

                        <div className="mt-4 overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="border-b">
                                    <tr>
                                        <th className="px-3 py-2 text-left">
                                            Plan
                                        </th>

                                        <th className="px-3 py-2 text-left">
                                            Start
                                        </th>

                                        <th className="px-3 py-2 text-left">
                                            End
                                        </th>

                                        <th className="px-3 py-2 text-left">
                                            Price
                                        </th>

                                        <th className="px-3 py-2 text-left">
                                            Paid
                                        </th>

                                        <th className="px-3 py-2 text-left">
                                            Balance
                                        </th>

                                        <th className="px-3 py-2 text-left">
                                            Status
                                        </th>

                                        <th className="px-3 py-2 text-right">
                                            Action
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {historicalMemberships.length ===
                                        0 ? (
                                        <tr>
                                            <td
                                                colSpan={8}
                                                className="px-3 py-6 text-center text-muted-foreground"
                                            >
                                                No historical
                                                memberships.
                                            </td>
                                        </tr>
                                    ) : (
                                        historicalMemberships.map(
                                            (
                                                membership,
                                            ) => {
                                                const lifecycleStatus =
                                                    membership.lifecycle_status ??
                                                    membership.status;

                                                const canRenew =
                                                    lifecycleStatus ===
                                                    'expired';

                                                return (
                                                    <tr
                                                        key={
                                                            membership.id
                                                        }
                                                        className="border-b last:border-0"
                                                    >
                                                        <td className="px-3 py-3">
                                                            {
                                                                membership
                                                                    .membership_plan
                                                                    .name
                                                            }
                                                        </td>

                                                        <td className="px-3 py-3">
                                                            {formatDate(
                                                                membership.start_date,
                                                            )}
                                                        </td>

                                                        <td className="px-3 py-3">
                                                            {formatDate(
                                                                membership.end_date,
                                                            )}
                                                        </td>

                                                        <td className="px-3 py-3">
                                                            {formatCurrency(
                                                                Number(
                                                                    membership.price,
                                                                ),
                                                            )}
                                                        </td>

                                                        <td className="px-3 py-3">
                                                            {formatCurrency(
                                                                membership.amount_paid,
                                                            )}
                                                        </td>

                                                        <td className="px-3 py-3">
                                                            <span
                                                                className={
                                                                    membership.balance_due >
                                                                        0
                                                                        ? 'font-medium text-destructive'
                                                                        : 'font-medium'
                                                                }
                                                            >
                                                                {formatCurrency(
                                                                    membership.balance_due,
                                                                )}
                                                            </span>
                                                        </td>

                                                        <td className="px-3 py-3">
                                                            <span className="rounded-full border px-2.5 py-1 text-xs font-medium capitalize">
                                                                {
                                                                    lifecycleStatus
                                                                }
                                                            </span>
                                                        </td>

                                                        <td className="px-3 py-3 text-right">
                                                            {canRenew ? (
                                                                <Link
                                                                    href={`/members/${member.id}/memberships/${membership.id}/renew`}
                                                                    className="font-medium hover:underline"
                                                                >
                                                                    Renew
                                                                </Link>
                                                            ) : (
                                                                <span className="text-muted-foreground">
                                                                    —
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            },
                                        )
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* Signal History */}
                    <section className="rounded-lg border p-5 md:col-span-2">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-semibold">
                                    Signal History
                                </h2>

                                <p className="mt-1 text-sm text-muted-foreground">
                                    Conditions detected for this member,
                                    including actions and outcomes.
                                </p>
                            </div>

                            <span className="text-sm text-muted-foreground">
                                {openSignals.length} open ·{' '}
                                {member.signals.length} total
                            </span>
                        </div>

                        <div className="mt-5 space-y-4">
                            {member.signals.length === 0 ? (
                                <div className="rounded-lg border border-dashed p-6 text-center">
                                    <p className="font-medium">
                                        No signals recorded.
                                    </p>

                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Signals will appear here when
                                        the intelligence system detects
                                        a meaningful change.
                                    </p>
                                </div>
                            ) : (
                                member.signals.map(
                                    (signal) => (
                                        <SignalHistoryCard
                                            key={signal.id}
                                            memberId={member.id}
                                            signal={signal}
                                        />
                                    ),
                                )
                            )}
                        </div>
                    </section>

                    {/* Member-wide Intervention History */}
                    <section className="rounded-lg border p-5 md:col-span-2">
                        <h2 className="text-lg font-semibold">
                            Intervention History
                        </h2>

                        <p className="mt-1 text-sm text-muted-foreground">
                            All actions recorded for this member.
                        </p>

                        <div className="mt-4 space-y-4">
                            {member.interventions.length ===
                                0 ? (
                                <p className="text-sm text-muted-foreground">
                                    No interventions recorded.
                                </p>
                            ) : (
                                member.interventions.map(
                                    (
                                        intervention,
                                    ) => (
                                        <div
                                            key={
                                                intervention.id
                                            }
                                            className="border-b pb-4 last:border-0"
                                        >
                                            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                                <p className="font-medium">
                                                    {getInterventionLabel(
                                                        intervention.type,
                                                    )}
                                                </p>

                                                <p className="text-xs text-muted-foreground">
                                                    {formatDateTime(
                                                        intervention.intervened_at,
                                                    )}
                                                </p>
                                            </div>

                                            {intervention.notes && (
                                                <p className="mt-2 text-sm text-muted-foreground">
                                                    {
                                                        intervention.notes
                                                    }
                                                </p>
                                            )}

                                            {intervention.outcome && (
                                                <div className="mt-2">
                                                    <p className="text-xs text-muted-foreground">
                                                        Outcome
                                                    </p>

                                                    <p className="mt-1 text-sm">
                                                        {
                                                            intervention.outcome
                                                        }
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    ),
                                )
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </>
    );
}

function TimelineEvent({
    event,
}: {
    event: TimelineEvent;
}) {
    return (
        <div className="relative flex gap-4">
            <div className="relative mt-1.5 flex w-3 shrink-0 justify-center">
                <div className="h-2.5 w-2.5 rounded-full bg-foreground" />
            </div>

            <div className="min-w-0 flex-1">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <p className="font-medium">
                        {getTimelineTitle(event)}
                    </p>

                    <p className="text-xs text-muted-foreground">
                        {formatTimelineEventTime(event)}
                    </p>
                </div>

                <TimelineEventContent event={event} />
            </div>
        </div>
    );
}

function TimelineEventContent({
    event,
}: {
    event: TimelineEvent;
}) {
    switch (event.type) {
        case 'membership_started':
            return (
                <p className="mt-1 text-sm text-muted-foreground">
                    {event.data.plan ?? 'Membership'} ·{' '}
                    {formatCurrency(event.data.price ?? 0)}
                    {event.data.end_date && (
                        <>
                            {' '}
                            · ends{' '}
                            {formatDate(event.data.end_date)}
                        </>
                    )}
                </p>
            );

        case 'payment_received':
            return (
                <p className="mt-1 text-sm text-muted-foreground">
                    {formatCurrency(event.data.amount ?? 0)} via{' '}
                    {formatPaymentMethod(
                        event.data.payment_method,
                    )}
                </p>
            );

        case 'attendance_recorded':
            return (
                <p className="mt-1 text-sm text-muted-foreground">
                    Check-in source:{' '}
                    {event.data.source ?? 'manual'}
                </p>
            );

        case 'signal_detected':
            return (
                <div className="mt-1">
                    <p className="text-sm text-muted-foreground">
                        {getSignalTypeLabel(
                            event.data.signal_type ?? '',
                        )}
                    </p>

                    {event.data.severity && (
                        <p className="mt-1 text-xs capitalize text-muted-foreground">
                            Severity: {event.data.severity}
                        </p>
                    )}
                </div>
            );

        case 'intervention_recorded':
            return (
                <div className="mt-1">
                    <p className="text-sm text-muted-foreground">
                        {getInterventionLabel(
                            event.data.type ?? '',
                        )}
                    </p>

                    {event.data.notes && (
                        <p className="mt-1 text-sm text-muted-foreground">
                            {event.data.notes}
                        </p>
                    )}

                    {event.data.outcome && (
                        <p className="mt-1 text-sm text-muted-foreground">
                            Outcome: {event.data.outcome}
                        </p>
                    )}
                </div>
            );

        case 'signal_resolved':
            return (
                <p className="mt-1 text-sm text-muted-foreground">
                    The underlying condition recovered.
                </p>
            );

        case 'signal_dismissed':
            return (
                <div className="mt-1">
                    {event.data.reason && (
                        <p className="text-sm text-muted-foreground">
                            {getDismissalReasonLabel(
                                event.data.reason,
                            )}
                        </p>
                    )}

                    {event.data.notes && (
                        <p className="mt-1 text-sm text-muted-foreground">
                            {event.data.notes}
                        </p>
                    )}
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

    const status = getSignalStatusPresentation(
        signal.status,
    );

    const severity = getSeverityPresentation(
        signal.severity,
    );

    const isAttendanceDecline =
        signal.type === 'attendance_decline';

    const isMembershipExpiring =
        signal.type === 'membership_expiring';

    const submit = (
        event: FormEvent<HTMLFormElement>,
    ) => {
        event.preventDefault();

        transform((data) => ({
            ...data,
            signal_id: signal.id,
            notes: data.notes || null,
            outcome: data.outcome || null,
        }));

        post(
            `/members/${memberId}/interventions`,
            {
                preserveScroll: true,

                onSuccess: () => {
                    reset('type', 'notes', 'outcome');
                },
            },
        );
    };

    return (
        <article className="overflow-hidden rounded-lg border">
            <div className="p-5">
                {/* Signal header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold">
                                {getSignalTypeLabel(
                                    signal.type,
                                )}
                            </h3>

                            <span
                                className={`rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${severity.className}`}
                            >
                                {signal.severity}
                            </span>

                            <span
                                className={`rounded-full border px-2.5 py-1 text-xs font-medium ${status.className}`}
                            >
                                {status.label}
                            </span>
                        </div>

                        <p className="mt-1 text-xs text-muted-foreground">
                            Detected{' '}
                            {formatDateTime(
                                signal.detected_at,
                            )}
                        </p>
                    </div>
                </div>

                {/* Attendance evidence */}
                {isAttendanceDecline && (
                    <div className="mt-5">
                        {signal.evidence
                            .decline_percentage !==
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

                            {signal.evidence
                                .recent_average !==
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
                        {signal.evidence
                            .days_remaining !==
                            undefined && (
                                <p className="text-sm">
                                    Membership expires in{' '}
                                    <span className="font-semibold">
                                        {
                                            signal.evidence
                                                .days_remaining
                                        }{' '}
                                        {signal.evidence
                                            .days_remaining ===
                                            1
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

                {/* Resolution */}
                {signal.status === 'resolved' &&
                    signal.resolved_at && (
                        <div className="mt-5 rounded-lg border bg-muted/20 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Resolution
                            </p>

                            <p className="mt-1 text-sm">
                                The underlying condition recovered and the
                                signal was automatically resolved.
                            </p>

                            <p className="mt-2 text-xs text-muted-foreground">
                                Resolved{' '}
                                {formatDateTime(
                                    signal.resolved_at,
                                )}
                            </p>
                        </div>
                    )}

                {/* Dismissal */}
                {signal.status === 'dismissed' && (
                    <div className="mt-5 rounded-lg border bg-muted/20 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Dismissal
                        </p>

                        {signal.dismissal_reason && (
                            <p className="mt-1 text-sm font-medium">
                                {getDismissalReasonLabel(
                                    signal.dismissal_reason,
                                )}
                            </p>
                        )}

                        {signal.dismissal_notes && (
                            <p className="mt-2 text-sm text-muted-foreground">
                                {signal.dismissal_notes}
                            </p>
                        )}

                        {signal.dismissed_at && (
                            <p className="mt-3 text-xs text-muted-foreground">
                                Dismissed{' '}
                                {formatDateTime(
                                    signal.dismissed_at,
                                )}
                            </p>
                        )}
                    </div>
                )}

                {/* Interventions */}
                {signal.interventions.length > 0 && (
                    <div className="mt-5 border-t pt-5">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Interventions
                        </p>

                        <div className="mt-3 space-y-3">
                            {signal.interventions.map(
                                (intervention) => (
                                    <div
                                        key={
                                            intervention.id
                                        }
                                        className="rounded-lg border bg-muted/20 p-4"
                                    >
                                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                            <p className="text-sm font-medium">
                                                {getInterventionLabel(
                                                    intervention.type,
                                                )}
                                            </p>

                                            <p className="text-xs text-muted-foreground">
                                                {formatDateTime(
                                                    intervention.intervened_at,
                                                )}
                                            </p>
                                        </div>

                                        {intervention.notes && (
                                            <p className="mt-2 text-sm text-muted-foreground">
                                                {
                                                    intervention.notes
                                                }
                                            </p>
                                        )}

                                        {intervention.outcome && (
                                            <div className="mt-3">
                                                <p className="text-xs text-muted-foreground">
                                                    Outcome
                                                </p>

                                                <p className="mt-1 text-sm">
                                                    {
                                                        intervention.outcome
                                                    }
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ),
                            )}
                        </div>
                    </div>
                )}

                {/* Record intervention */}
                {signal.status === 'open' && (
                    <form
                        onSubmit={submit}
                        className="mt-5 border-t pt-5"
                    >
                        <p className="text-sm font-medium">
                            Record intervention
                        </p>

                        <div className="mt-4 grid gap-4">
                            <div>
                                <label
                                    htmlFor={`type-${signal.id}`}
                                    className="mb-1.5 block text-sm font-medium"
                                >
                                    Action
                                </label>

                                <select
                                    id={`type-${signal.id}`}
                                    value={data.type}
                                    onChange={(event) =>
                                        setData(
                                            'type',
                                            event.target.value,
                                        )
                                    }
                                    disabled={processing}
                                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                                >
                                    <option
                                        value=""
                                        disabled
                                    >
                                        Choose an action
                                    </option>

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
                                                {
                                                    option.label
                                                }
                                            </option>
                                        ),
                                    )}
                                </select>

                                {errors.type && (
                                    <p className="mt-1 text-sm text-destructive">
                                        {errors.type}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label
                                    htmlFor={`notes-${signal.id}`}
                                    className="mb-1.5 block text-sm font-medium"
                                >
                                    Notes
                                </label>

                                <textarea
                                    id={`notes-${signal.id}`}
                                    value={data.notes}
                                    onChange={(event) =>
                                        setData(
                                            'notes',
                                            event.target.value,
                                        )
                                    }
                                    disabled={processing}
                                    rows={3}
                                    placeholder="What did you discuss or do?"
                                    className="w-full resize-y rounded-md border bg-background px-3 py-2 text-sm"
                                />

                                {errors.notes && (
                                    <p className="mt-1 text-sm text-destructive">
                                        {
                                            errors.notes
                                        }
                                    </p>
                                )}
                            </div>

                            <div>
                                <label
                                    htmlFor={`outcome-${signal.id}`}
                                    className="mb-1.5 block text-sm font-medium"
                                >
                                    Outcome
                                </label>

                                <textarea
                                    id={`outcome-${signal.id}`}
                                    value={data.outcome}
                                    onChange={(event) =>
                                        setData(
                                            'outcome',
                                            event.target.value,
                                        )
                                    }
                                    disabled={processing}
                                    rows={3}
                                    placeholder="What happened?"
                                    className="w-full resize-y rounded-md border bg-background px-3 py-2 text-sm"
                                />

                                {errors.outcome && (
                                    <p className="mt-1 text-sm text-destructive">
                                        {
                                            errors.outcome
                                        }
                                    </p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={
                                    processing ||
                                    !data.type
                                }
                                className="w-fit rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {processing
                                    ? 'Recording...'
                                    : 'Record Intervention'}
                            </button>
                        </div>
                    </form>
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