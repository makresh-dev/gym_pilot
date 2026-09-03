import { Head, Link, router, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';

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
    };
    detected_at: string;
    resolved_at: string | null;
    interventions: Intervention[];
};

type Attendance = {
    id: string;
    check_in_at: string;
    source: string;
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
};

type InterventionForm = {
    type: string;
    notes: string;
    outcome: string;
};

export default function Show({ member, checkedInToday }: ShowProps) {
    const currentExpectation =
        member.expectations.find(
            (expectation) => expectation.end_date === null,
        ) ?? null;

    const currentGoal =
        member.goals.find((goal) => goal.end_date === null) ?? null;

    const openSignals = member.signals.filter(
        (signal) => signal.status === 'open',
    );

    return (
        <>
            <Head title={member.name} />

            <div className="mx-auto max-w-6xl p-6">
                <div className="mb-6">
                    <Link
                        href="/members"
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
                            {member.email ? ` · ${member.email}` : ''}
                        </p>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                        <button
                            type="button"
                            disabled={checkedInToday}
                            onClick={() => {
                                router.post(
                                    `/members/${member.id}/attendance`,
                                    {
                                        check_in_at: new Date().toISOString(),
                                    },
                                    {
                                        preserveScroll: true,
                                    },
                                );
                            }}
                            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {checkedInToday
                                ? 'Checked In Today'
                                : 'Check In'}
                        </button>

                        <Link
                            href={`/members/${member.id}/memberships/create`}
                            className="rounded-md border px-4 py-2 text-sm font-medium"
                        >
                            Add Membership
                        </Link>

                        <Link
                            href={`/members/${member.id}/edit`}
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
                                    router.delete(`/members/${member.id}`);
                                }
                            }}
                            className="rounded-md border px-4 py-2 text-sm font-medium text-destructive"
                        >
                            Archive
                        </button>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Member overview */}
                    <section className="rounded-lg border p-5">
                        <h2 className="text-lg font-semibold">
                            Overview
                        </h2>

                        <div className="mt-4 space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    Phone
                                </span>

                                <span>{member.phone}</span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    Email
                                </span>

                                <span>
                                    {member.email ?? '—'}
                                </span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    Date of birth
                                </span>

                                <span>
                                    {member.date_of_birth ?? '—'}
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

                                <p className="mt-1 font-medium">
                                    {currentGoal
                                        ? currentGoal.goal
                                        : 'Not set'}
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Attendance */}
                    <section className="rounded-lg border p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold">
                                    Recent Attendance
                                </h2>

                                <p className="mt-1 text-sm text-muted-foreground">
                                    Latest member check-ins.
                                </p>
                            </div>

                            <span className="text-sm text-muted-foreground">
                                {member.attendances.length} recent
                            </span>
                        </div>

                        <div className="mt-4 space-y-3">
                            {member.attendances.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    No attendance records.
                                </p>
                            ) : (
                                member.attendances.map((attendance) => (
                                    <div
                                        key={attendance.id}
                                        className="flex items-center justify-between border-b pb-3 last:border-0"
                                    >
                                        <div>
                                            <p className="text-sm font-medium">
                                                {new Date(
                                                    attendance.check_in_at,
                                                ).toLocaleDateString()}
                                            </p>

                                            <p className="text-xs text-muted-foreground">
                                                {new Date(
                                                    attendance.check_in_at,
                                                ).toLocaleTimeString([], {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </p>
                                        </div>

                                        <span className="text-xs capitalize text-muted-foreground">
                                            {attendance.source}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>

                    {/* Memberships */}
                    <section className="rounded-lg border p-5 md:col-span-2">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold">
                                    Memberships
                                </h2>

                                <p className="mt-1 text-sm text-muted-foreground">
                                    Membership history and payments.
                                </p>
                            </div>

                            <Link
                                href={`/members/${member.id}/memberships/create`}
                                className="rounded-md border px-4 py-2 text-sm font-medium"
                            >
                                Add Membership
                            </Link>
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
                                    {member.memberships.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={8}
                                                className="px-3 py-6 text-center text-muted-foreground"
                                            >
                                                No memberships.
                                            </td>
                                        </tr>
                                    ) : (
                                        member.memberships.map(
                                            (membership) => {
                                                const paid =
                                                    membership.payments.reduce(
                                                        (total, payment) =>
                                                            total +
                                                            Number(
                                                                payment.amount,
                                                            ),
                                                        0,
                                                    );

                                                const balance = Math.max(
                                                    0,
                                                    Number(membership.price) -
                                                    paid,
                                                );

                                                const lifecycleStatus =
                                                    membership.lifecycle_status ??
                                                    membership.status;

                                                const canRenew =
                                                    lifecycleStatus ===
                                                    'active' ||
                                                    lifecycleStatus ===
                                                    'expired';

                                                return (
                                                    <tr
                                                        key={membership.id}
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
                                                            {
                                                                membership.start_date
                                                            }
                                                        </td>

                                                        <td className="px-3 py-3">
                                                            {
                                                                membership.end_date
                                                            }
                                                        </td>

                                                        <td className="px-3 py-3">
                                                            ₹
                                                            {membership.price}
                                                        </td>

                                                        <td className="px-3 py-3">
                                                            ₹
                                                            {paid.toFixed(2)}
                                                        </td>

                                                        <td className="px-3 py-3">
                                                            <span
                                                                className={
                                                                    balance >
                                                                        0
                                                                        ? 'font-medium text-destructive'
                                                                        : 'font-medium'
                                                                }
                                                            >
                                                                ₹
                                                                {balance.toFixed(
                                                                    2,
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
                                                            <div className="flex justify-end gap-3">
                                                                {balance > 0 && (
                                                                    <Link
                                                                        href={`/members/${member.id}/memberships/${membership.id}/payments/create`}
                                                                        className="font-medium hover:underline"
                                                                    >
                                                                        Record
                                                                        payment
                                                                    </Link>
                                                                )}

                                                                {canRenew && (
                                                                    <Link
                                                                        href={`/members/${member.id}/memberships/${membership.id}/renew`}
                                                                        className="font-medium hover:underline"
                                                                    >
                                                                        Renew
                                                                    </Link>
                                                                )}

                                                                {balance === 0 &&
                                                                    !canRenew && (
                                                                        <span className="text-sm text-muted-foreground">
                                                                            Paid
                                                                        </span>
                                                                    )}
                                                            </div>
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

                    {/* Signals */}
                    <section className="rounded-lg border p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold">
                                    Signals
                                </h2>

                                <p className="mt-1 text-sm text-muted-foreground">
                                    Conditions that may need attention.
                                </p>
                            </div>

                            <span className="text-sm text-muted-foreground">
                                {openSignals.length} open
                            </span>
                        </div>

                        <div className="mt-4 space-y-4">
                            {openSignals.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    No open signals.
                                </p>
                            ) : (
                                openSignals.map((signal) => (
                                    <SignalCard
                                        key={signal.id}
                                        memberId={member.id}
                                        signal={signal}
                                    />
                                ))
                            )}
                        </div>
                    </section>

                    {/* Interventions */}
                    <section className="rounded-lg border p-5">
                        <h2 className="text-lg font-semibold">
                            Interventions
                        </h2>

                        <div className="mt-4 space-y-4">
                            {member.interventions.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    No interventions recorded.
                                </p>
                            ) : (
                                member.interventions.map(
                                    (intervention) => (
                                        <div
                                            key={intervention.id}
                                            className="border-b pb-4 last:border-0"
                                        >
                                            <p className="font-medium capitalize">
                                                {intervention.type.replace(
                                                    /_/g,
                                                    ' ',
                                                )}
                                            </p>

                                            {intervention.notes && (
                                                <p className="mt-1 text-sm text-muted-foreground">
                                                    {
                                                        intervention.notes
                                                    }
                                                </p>
                                            )}

                                            {intervention.outcome && (
                                                <p className="mt-1 text-sm">
                                                    Outcome:{' '}
                                                    {
                                                        intervention.outcome
                                                    }
                                                </p>
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

type SignalCardProps = {
    memberId: string;
    signal: Signal;
};

function SignalCard({
    memberId,
    signal,
}: SignalCardProps) {
    const { data, setData, post, processing, errors, reset } =
        useForm<InterventionForm>({
            type: '',
            notes: '',
            outcome: '',
        });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        post(
            `/members/${memberId}/signals/${signal.id}/interventions`,
            {
                preserveScroll: true,
                onSuccess: () => {
                    reset();
                },
            },
        );
    };

    return (
        <div className="rounded-md border p-4">
            <div className="flex items-center justify-between">
                <span className="font-medium">
                    {signal.type.replace(/_/g, ' ')}
                </span>

                <span className="text-sm capitalize">
                    {signal.severity}
                </span>
            </div>

            {signal.evidence.decline_percentage !== undefined && (
                <p className="mt-2 text-sm text-muted-foreground">
                    Attendance declined by{' '}
                    {signal.evidence.decline_percentage}%.
                </p>
            )}

            {signal.evidence.baseline_average !== undefined && (
                <p className="mt-1 text-sm text-muted-foreground">
                    Baseline: {signal.evidence.baseline_average} visits/week
                </p>
            )}

            {signal.evidence.recent_average !== undefined && (
                <p className="mt-1 text-sm text-muted-foreground">
                    Recent: {signal.evidence.recent_average} visits/week
                </p>
            )}

            {signal.evidence.expected_visits_per_week !== undefined &&
                signal.evidence.expected_visits_per_week !== null && (
                    <p className="mt-1 text-sm text-muted-foreground">
                        Expected: {signal.evidence.expected_visits_per_week}{' '}
                        visits/week
                    </p>
                )}

            <form
                onSubmit={submit}
                className="mt-5 space-y-3 border-t pt-4"
            >
                <p className="text-sm font-medium">
                    Record intervention
                </p>

                <div>
                    <label
                        htmlFor={`type-${signal.id}`}
                        className="mb-1 block text-sm"
                    >
                        Action
                    </label>

                    <select
                        id={`type-${signal.id}`}
                        value={data.type}
                        onChange={(event) =>
                            setData('type', event.target.value)
                        }
                        className="w-full rounded-md border px-3 py-2"
                    >
                        <option value="" disabled>
                            Choose an action
                        </option>

                        <option value="call_member">
                            Call member
                        </option>

                        <option value="send_whatsapp">
                            Send WhatsApp
                        </option>

                        <option value="in_person">
                            Speak in person
                        </option>

                        <option value="follow_up">
                            Follow up
                        </option>

                        <option value="other">
                            Other
                        </option>
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
                        className="mb-1 block text-sm"
                    >
                        Notes
                    </label>

                    <textarea
                        id={`notes-${signal.id}`}
                        value={data.notes}
                        onChange={(event) =>
                            setData('notes', event.target.value)
                        }
                        rows={3}
                        placeholder="What did you discuss or do?"
                        className="w-full rounded-md border px-3 py-2"
                    />

                    {errors.notes && (
                        <p className="mt-1 text-sm text-destructive">
                            {errors.notes}
                        </p>
                    )}
                </div>

                <div>
                    <label
                        htmlFor={`outcome-${signal.id}`}
                        className="mb-1 block text-sm"
                    >
                        Outcome
                    </label>

                    <textarea
                        id={`outcome-${signal.id}`}
                        value={data.outcome}
                        onChange={(event) =>
                            setData('outcome', event.target.value)
                        }
                        rows={3}
                        placeholder="What happened?"
                        className="w-full rounded-md border px-3 py-2"
                    />

                    {errors.outcome && (
                        <p className="mt-1 text-sm text-destructive">
                            {errors.outcome}
                        </p>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={processing || !data.type}
                    className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {processing
                        ? 'Recording...'
                        : 'Record Intervention'}
                </button>
            </form>
        </div>
    );
}