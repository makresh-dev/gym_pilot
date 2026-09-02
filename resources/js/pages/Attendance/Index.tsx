import { Head, Link, useForm } from '@inertiajs/react';
import * as React from 'react';

import { dashboard } from '@/routes';
import attendance from '@/routes/attendance';

type MemberSearchResult = {
    id: string;
    name: string;
    phone: string;
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
};

type AttendanceStatus = {
    checked_in: boolean;
    check_in_at: string | null;
};

type AttendanceProps = {
    attendances: AttendanceRecord[];
};

export default function Index({ attendances }: AttendanceProps) {
    const [query, setQuery] = React.useState('');
    const [members, setMembers] = React.useState<MemberSearchResult[]>([]);
    const [searching, setSearching] = React.useState(false);
    const [selectedMember, setSelectedMember] =
        React.useState<MemberSearchResult | null>(null);

    const [attendanceStatus, setAttendanceStatus] =
        React.useState<AttendanceStatus | null>(null);
    const [checkingStatus, setCheckingStatus] = React.useState(false);

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
        if (query.trim().length < 2 || selectedMember) {
            setMembers([]);
            return;
        }

        const timer = window.setTimeout(async () => {
            setSearching(true);

            try {
                const response = await fetch(
                    `${attendance.search().url}?query=${encodeURIComponent(query)}`,
                    {
                        headers: {
                            Accept: 'application/json',
                        },
                    },
                );

                if (!response.ok) {
                    throw new Error('Failed to search members.');
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
    }, [query, selectedMember]);

    const selectMember = async (member: MemberSearchResult) => {
        setSelectedMember(member);
        setData('member_id', member.id);
        setQuery(member.name);
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
                throw new Error('Failed to check attendance status.');
            }

            const status: AttendanceStatus = await response.json();

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
        setQuery('');
        setData('member_id', '');
        setMembers([]);
    };

    const checkIn = (event: React.FormEvent) => {
        event.preventDefault();

        if (!data.member_id || attendanceStatus?.checked_in) {
            return;
        }

        post(attendance.store().url, {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setQuery('');
                setSelectedMember(null);
                setAttendanceStatus(null);
            },
        });
    };

    return (
        <>
            <Head title="Attendance" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Attendance
                    </h1>

                    <p className="text-sm text-muted-foreground">
                        Check members in and view today&apos;s attendance.
                    </p>
                </div>

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
                                Find member
                            </label>

                            <input
                                id="member-search"
                                type="text"
                                value={query}
                                onChange={(event) => {
                                    setQuery(event.target.value);
                                    setSelectedMember(null);
                                    setAttendanceStatus(null);
                                    setData('member_id', '');
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
                                                selectMember(member)
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
                                            {selectedMember.name}
                                        </p>

                                        <p className="text-sm text-muted-foreground">
                                            {selectedMember.phone}
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

                                <div className="mt-4">
                                    {checkingStatus && (
                                        <p className="text-sm text-muted-foreground">
                                            Checking today&apos;s attendance...
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
                                                            {new Date(
                                                                attendanceStatus.check_in_at,
                                                            ).toLocaleTimeString(
                                                                [],
                                                                {
                                                                    hour: '2-digit',
                                                                    minute: '2-digit',
                                                                },
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
                                        !attendanceStatus.checked_in && (
                                            <button
                                                type="submit"
                                                disabled={processing}
                                                className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
                                            >
                                                {processing
                                                    ? 'Checking in...'
                                                    : 'Check In'}
                                            </button>
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

                <div className="rounded-xl border bg-card">
                    <div className="border-b px-6 py-4">
                        <h2 className="font-semibold">
                            Today&apos;s Check-ins
                        </h2>
                    </div>

                    {attendances.length === 0 ? (
                        <div className="px-6 py-10 text-center text-sm text-muted-foreground">
                            No check-ins today.
                        </div>
                    ) : (
                        <div className="divide-y">
                            {attendances.map((record) => (
                                <div
                                    key={record.id}
                                    className="flex items-center justify-between px-6 py-4"
                                >
                                    <div>
                                        <Link
                                            href={`/members/${record.member.id}`}
                                            className="font-medium hover:underline"
                                        >
                                            {record.member.name}
                                        </Link>

                                        <p className="text-sm text-muted-foreground">
                                            {record.member.phone}
                                        </p>
                                    </div>

                                    <div className="text-right">
                                        <p className="text-sm font-medium">
                                            {new Date(
                                                record.check_in_at,
                                            ).toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
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