import { Head, Link, router, useForm } from '@inertiajs/react';
import * as React from 'react';

import { dashboard } from '@/routes';
import attendance from '@/routes/attendance';

type MemberSearchResult = {
    id: string;
    name: string;
    phone: string;
};

type AttendanceIntervention = {
    type: string;
    notes: string | null;
    outcome: string | null;
    intervened_at: string;
};

type AttendanceContext = {
    weekly_visits: number;
    has_open_attendance_signal: boolean;
    latest_attendance_signal_status:
    | 'open'
    | 'resolved'
    | 'dismissed'
    | null;
    expected_visits_per_week: number | null;
    latest_intervention: AttendanceIntervention | null;
};

type AttendanceRecord = {
    id: string;
    member: {
        id: string;
        name: string;
        phone: string;
    };
    check_in_at: string;
    source: string;
    context: AttendanceContext;
};

type AttendanceStatus = {
    checked_in: boolean;
    check_in_at: string | null;
    membership_active: boolean;
    membership_end_date: string | null;
};

type AttendanceProps = {
    attendances: AttendanceRecord[];
    date: string;
    search: string;
    isToday: boolean;
};

function formatDate(date: string): string {
    return new Date(`${date}T00:00:00`).toLocaleDateString(
        'en-IN',
        {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        },
    );
}

function formatTime(date: string): string {
    return new Date(date).toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: 'numeric',
        minute: '2-digit',
    });
}

function getInterventionLabel(type: string): string {
    switch (type) {
        case 'call_member':
            return 'Called member';

        case 'send_whatsapp':
            return 'Sent WhatsApp';

        case 'in_person':
            return 'Spoke in person';

        case 'follow_up':
            return 'Scheduled follow-up';

        case 'other':
            return 'Other intervention';

        default:
            return type.replace(/_/g, ' ');
    }
}

function shiftDate(date: string, days: number): string {
    const value = new Date(`${date}T00:00:00`);

    value.setDate(value.getDate() + days);

    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

export default function Index({
    attendances,
    date,
    search,
    isToday,
}: AttendanceProps) {
    const [memberQuery, setMemberQuery] = React.useState('');

    const [listSearch, setListSearch] =
        React.useState(search);

    const [members, setMembers] = React.useState<
        MemberSearchResult[]
    >([]);

    const [searching, setSearching] = React.useState(false);

    const [selectedMember, setSelectedMember] =
        React.useState<MemberSearchResult | null>(null);

    const [attendanceStatus, setAttendanceStatus] =
        React.useState<AttendanceStatus | null>(null);

    const [checkingStatus, setCheckingStatus] =
        React.useState(false);

    const {
        data,
        setData,
        post,
        processing,
        errors,
        reset,
    } = useForm({
        member_id: '',
    });

    React.useEffect(() => {
        setListSearch(search);
    }, [search]);

    React.useEffect(() => {
        if (memberQuery.trim().length < 2 || selectedMember) {
            setMembers([]);
            return;
        }

        const timer = window.setTimeout(async () => {
            setSearching(true);

            try {
                const response = await fetch(
                    `${attendance.search().url}?query=${encodeURIComponent(memberQuery)}`,
                    {
                        headers: {
                            Accept: 'application/json',
                        },
                    },
                );

                if (!response.ok) {
                    throw new Error(
                        'Failed to search members.',
                    );
                }

                const results: MemberSearchResult[] =
                    await response.json();

                setMembers(results);
            } catch {
                setMembers([]);
            } finally {
                setSearching(false);
            }
        }, 300);

        return () => window.clearTimeout(timer);
    }, [memberQuery, selectedMember]);

    React.useEffect(() => {
        if (listSearch === search) {
            return;
        }

        const timer = window.setTimeout(() => {
            router.get(
                attendance.index().url,
                {
                    ...(listSearch.trim()
                        ? { search: listSearch.trim() }
                        : {}),
                    ...(date ? { date } : {}),
                },
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                },
            );
        }, 300);

        return () => window.clearTimeout(timer);
    }, [listSearch, search, date]);

    const selectMember = async (
        member: MemberSearchResult,
    ) => {
        setSelectedMember(member);
        setData('member_id', member.id);
        setMemberQuery(member.name);
        setMembers([]);

        setAttendanceStatus(null);
        setCheckingStatus(true);

        try {
            const response = await fetch(
                attendance.status(member.id).url,
                {
                    headers: {
                        Accept: 'application/json',
                    },
                },
            );

            if (!response.ok) {
                throw new Error(
                    'Failed to check attendance status.',
                );
            }

            const status: AttendanceStatus =
                await response.json();

            setAttendanceStatus(status);
        } catch {
            setAttendanceStatus(null);
        } finally {
            setCheckingStatus(false);
        }
    };

    const clearSelection = () => {
        setSelectedMember(null);
        setAttendanceStatus(null);
        setMemberQuery('');
        setData('member_id', '');
        setMembers([]);
    };

    const changeDate = (nextDate: string) => {
        router.get(
            attendance.index().url,
            {
                ...(search
                    ? { search }
                    : {}),
                date: nextDate,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    };

    const checkIn = (
        event: React.FormEvent,
    ) => {
        event.preventDefault();

        if (
            !isToday ||
            !data.member_id ||
            attendanceStatus?.checked_in ||
            !attendanceStatus?.membership_active
        ) {
            return;
        }

        post(attendance.store().url, {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setMemberQuery('');
                setSelectedMember(null);
                setAttendanceStatus(null);
            },
        });
    };

    return (
        <>
            <Head title="Attendance" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Attendance
                        </h1>

                        <p className="mt-1 text-sm text-muted-foreground">
                            Check members in and review attendance history.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() =>
                                changeDate(
                                    shiftDate(date, -1),
                                )
                            }
                            className="inline-flex h-9 items-center rounded-md border px-3 text-sm font-medium hover:bg-muted"
                        >
                            ←
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                changeDate(
                                    new Date()
                                        .toISOString()
                                        .slice(0, 10),
                                )
                            }
                            className={[
                                'h-9 rounded-md border px-3 text-sm font-medium hover:bg-muted',
                                isToday
                                    ? 'bg-muted'
                                    : '',
                            ].join(' ')}
                        >
                            Today
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                changeDate(
                                    shiftDate(date, 1),
                                )
                            }
                            disabled={isToday}
                            className="inline-flex h-9 items-center rounded-md border px-3 text-sm font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            →
                        </button>
                    </div>
                </div>

                {/* Date heading */}
                <div className="rounded-lg border bg-muted/20 px-4 py-3">
                    <p className="text-sm font-medium">
                        {isToday
                            ? "Today's Check-ins"
                            : `Check-ins · ${formatDate(date)}`}
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                        {attendances.length}{' '}
                        {attendances.length === 1
                            ? 'check-in'
                            : 'check-ins'}
                    </p>
                </div>

                {/* Check-in panel */}
                {isToday && (
                    <div className="rounded-xl border bg-card p-6">
                        <form
                            onSubmit={checkIn}
                            className="flex flex-col gap-4"
                        >
                            <div className="relative">
                                <label
                                    htmlFor="member-search"
                                    className="mb-2 block text-sm font-medium"
                                >
                                    Check in member
                                </label>

                                <input
                                    id="member-search"
                                    type="text"
                                    value={memberQuery}
                                    onChange={(event) => {
                                        setMemberQuery(
                                            event.target.value,
                                        );
                                        setSelectedMember(null);
                                        setAttendanceStatus(null);
                                        setData(
                                            'member_id',
                                            '',
                                        );
                                    }}
                                    placeholder="Search by name or phone..."
                                    autoComplete="off"
                                    className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                                />

                                {searching && (
                                    <p className="mt-2 text-sm text-muted-foreground">
                                        Searching...
                                    </p>
                                )}

                                {members.length > 0 && (
                                    <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border bg-popover shadow-md">
                                        {members.map((member) => (
                                            <button
                                                key={member.id}
                                                type="button"
                                                onClick={() =>
                                                    selectMember(
                                                        member,
                                                    )
                                                }
                                                className="block w-full px-4 py-3 text-left hover:bg-muted"
                                            >
                                                <div className="font-medium">
                                                    {member.name}
                                                </div>

                                                <div className="text-sm text-muted-foreground">
                                                    {member.phone}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {selectedMember && (
                                <div className="rounded-lg border bg-muted/30 p-4">
                                    <div className="flex items-center justify-between gap-4">
                                        <div>
                                            <p className="font-medium">
                                                {
                                                    selectedMember.name
                                                }
                                            </p>

                                            <p className="text-sm text-muted-foreground">
                                                {
                                                    selectedMember.phone
                                                }
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={clearSelection}
                                            className="text-sm text-muted-foreground hover:text-foreground"
                                        >
                                            Change
                                        </button>
                                    </div>

                                    <div className="mt-4 space-y-3">
                                        {checkingStatus && (
                                            <p className="text-sm text-muted-foreground">
                                                Checking member status...
                                            </p>
                                        )}

                                        {!checkingStatus &&
                                            attendanceStatus?.checked_in && (
                                                <div className="flex items-center justify-between rounded-md border px-4 py-3">
                                                    <div>
                                                        <p className="font-medium">
                                                            Already checked in today
                                                        </p>

                                                        {attendanceStatus.check_in_at && (
                                                            <p className="text-sm text-muted-foreground">
                                                                {formatTime(
                                                                    attendanceStatus.check_in_at,
                                                                )}
                                                            </p>
                                                        )}
                                                    </div>

                                                    <span className="text-sm font-medium text-muted-foreground">
                                                        Checked in
                                                    </span>
                                                </div>
                                            )}

                                        {!checkingStatus &&
                                            attendanceStatus &&
                                            !attendanceStatus.checked_in &&
                                            !attendanceStatus.membership_active && (
                                                <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3">
                                                    <p className="font-medium">
                                                        Membership inactive
                                                    </p>

                                                    <p className="mt-1 text-sm text-muted-foreground">
                                                        This member does not have
                                                        an active membership today.
                                                    </p>
                                                </div>
                                            )}

                                        {!checkingStatus &&
                                            attendanceStatus &&
                                            !attendanceStatus.checked_in &&
                                            attendanceStatus.membership_active && (
                                                <>
                                                    <div className="rounded-md border px-4 py-3">
                                                        <p className="font-medium">
                                                            Membership active
                                                        </p>

                                                        {attendanceStatus.membership_end_date && (
                                                            <p className="mt-1 text-sm text-muted-foreground">
                                                                Valid until{' '}
                                                                {formatDate(
                                                                    attendanceStatus.membership_end_date,
                                                                )}
                                                            </p>
                                                        )}
                                                    </div>

                                                    <button
                                                        type="submit"
                                                        disabled={processing}
                                                        className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
                                                    >
                                                        {processing
                                                            ? 'Checking in...'
                                                            : 'Check In'}
                                                    </button>
                                                </>
                                            )}
                                    </div>
                                </div>
                            )}

                            {errors.member_id && (
                                <p className="text-sm text-destructive">
                                    {errors.member_id}
                                </p>
                            )}
                        </form>
                    </div>
                )}

                {/* Attendance list */}
                <div className="rounded-xl border bg-card">
                    <div className="flex flex-col gap-3 border-b px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="font-semibold">
                                {isToday
                                    ? "Today's Check-ins"
                                    : `Check-ins · ${formatDate(date)}`}
                            </h2>

                            <p className="mt-1 text-xs text-muted-foreground">
                                Filter this day by member name or phone.
                            </p>
                        </div>

                        <div className="relative w-full sm:max-w-xs">
                            <input
                                type="search"
                                value={listSearch}
                                onChange={(event) =>
                                    setListSearch(
                                        event.target.value,
                                    )
                                }
                                placeholder="Search attendance..."
                                className="h-9 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>
                    </div>

                    {attendances.length === 0 ? (
                        <div className="px-6 py-10 text-center text-sm text-muted-foreground">
                            No check-ins recorded for this day.
                        </div>
                    ) : (
                        <div className="divide-y">
                            {attendances.map((record) => (
                                <div
                                    key={record.id}
                                    className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
                                >
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Link
                                                href={`/members/${record.member.id}`}
                                                className="font-medium hover:underline"
                                            >
                                                {record.member.name}
                                            </Link>

                                            {record.context.has_open_attendance_signal && (
                                                <span className="rounded-full border border-amber-500/30 px-2 py-0.5 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                                                    Attendance declining
                                                </span>
                                            )}

                                            {!record.context.has_open_attendance_signal &&
                                                record.context.latest_attendance_signal_status ===
                                                'resolved' && (
                                                    <span className="rounded-full border border-emerald-500/30 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                                                        Attendance recovered
                                                    </span>
                                                )}
                                        </div>

                                        <p className="text-sm text-muted-foreground">
                                            {record.member.phone}
                                        </p>

                                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                            <span>
                                                {record.context.weekly_visits}{' '}
                                                {record.context.weekly_visits === 1
                                                    ? 'visit'
                                                    : 'visits'}{' '}
                                                this week
                                            </span>

                                            {record.context.expected_visits_per_week !==
                                                null && (
                                                    <>
                                                        <span
                                                            aria-hidden="true"
                                                            className="hidden sm:inline"
                                                        >
                                                            ·
                                                        </span>

                                                        <span>
                                                            Expected{' '}
                                                            {
                                                                record.context
                                                                    .expected_visits_per_week
                                                            }
                                                            /week
                                                        </span>
                                                    </>
                                                )}
                                        </div>

                                        {record.context.latest_intervention && (
                                            <div className="mt-2 rounded-md bg-muted/20 px-3 py-2 text-xs">
                                                <span className="font-medium text-foreground">
                                                    Last action:{' '}
                                                </span>

                                                {getInterventionLabel(
                                                    record.context
                                                        .latest_intervention.type,
                                                )}

                                                {record.context.latest_intervention.outcome && (
                                                    <span>
                                                        {' · '}
                                                        {
                                                            record.context
                                                                .latest_intervention
                                                                .outcome
                                                        }
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className="shrink-0 text-left sm:text-right">
                                        <p className="text-sm font-medium">
                                            {formatTime(
                                                record.check_in_at,
                                            )}
                                        </p>

                                        <p className="text-xs capitalize text-muted-foreground">
                                            {record.source}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

Index.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
        {
            title: 'Attendance',
            href: attendance.index(),
        },
    ],
};
