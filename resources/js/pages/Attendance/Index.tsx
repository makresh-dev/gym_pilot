import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    Activity,
    AlertCircle,
    Calendar,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock,
    Search,
    User,
    UserCheck,
    X,
} from 'lucide-react';
import * as React from 'react';
import InputError from '@/components/input-error';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
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
    return new Date(`${date}T00:00:00`).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
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
    return value.toISOString().slice(0, 10);
}

export default function Attendance({
    attendances,
    date,
    search,
    isToday,
}: AttendanceProps) {
    const [memberQuery, setMemberQuery] = React.useState('');
    const [members, setMembers] = React.useState<MemberSearchResult[]>([]);
    const [searching, setSearching] = React.useState(false);
    const [selectedMember, setSelectedMember] =
        React.useState<MemberSearchResult | null>(null);
    const [attendanceStatus, setAttendanceStatus] =
        React.useState<AttendanceStatus | null>(null);
    const [checkingStatus, setCheckingStatus] = React.useState(false);
    const [listSearch, setListSearch] = React.useState(search);

    const { data, setData, post, processing, reset, errors } = useForm({
        member_id: '',
    });

    React.useEffect(() => {
        setListSearch(search);
    }, [search]);

    React.useEffect(() => {
        const timeout = setTimeout(() => {
            if (listSearch === search) {
                return;
            }

            router.get(
                attendance.index().url,
                {
                    ...(listSearch
                        ? { search: listSearch }
                        : {}),
                    date,
                },
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                },
            );
        }, 300);

        return () => clearTimeout(timeout);
    }, [listSearch, date, search]);

    React.useEffect(() => {
        if (!memberQuery || selectedMember) {
            setMembers([]);
            setSearching(false);
            return;
        }

        const controller = new AbortController();
        setSearching(true);

        const timeout = setTimeout(async () => {
            try {
                const response = await fetch(
                    `/attendance/search-members?query=${encodeURIComponent(
                        memberQuery,
                    )}`,
                    {
                        signal: controller.signal,
                        headers: {
                            Accept: 'application/json',
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                    },
                );

                if (!response.ok) {
                    throw new Error('Search failed');
                }

                const results = await response.json();
                setMembers(results);
            } catch (error: unknown) {
                if (
                    error instanceof DOMException &&
                    error.name === 'AbortError'
                ) {
                    return;
                }
                setMembers([]);
            } finally {
                setSearching(false);
            }
        }, 300);

        return () => {
            clearTimeout(timeout);
            controller.abort();
        };
    }, [memberQuery, selectedMember]);

    const selectMember = async (member: MemberSearchResult) => {
        setSelectedMember(member);
        setData('member_id', member.id);
        setMemberQuery(member.name);
        setMembers([]);
        setCheckingStatus(true);

        try {
            const response = await fetch(
                `/attendance/status?member_id=${encodeURIComponent(
                    member.id,
                )}`,
                {
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                },
            );

            if (!response.ok) {
                throw new Error('Status check failed');
            }

            const status = await response.json();
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
                ...(search ? { search } : {}),
                date: nextDate,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    };

    const checkIn = (event: React.FormEvent) => {
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

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6 max-w-7xl mx-auto w-full">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">Attendance</h1>
                        <p className="mt-1 text-sm text-muted-foreground font-normal">
                            Record daily check-ins and monitor member attendance cadence.
                        </p>
                    </div>

                    <div className="flex items-center gap-1 rounded-full border border-border/80 bg-card/80 backdrop-blur-xs p-1 shadow-2xs">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => changeDate(shiftDate(date, -1))}
                            aria-label="Previous day"
                            className="size-7 rounded-full text-muted-foreground hover:text-foreground"
                        >
                            <ChevronLeft className="size-3.5" />
                        </Button>

                        <Button
                            type="button"
                            variant={isToday ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() =>
                                changeDate(new Date().toISOString().slice(0, 10))
                            }
                            className="h-7 rounded-full text-xs font-medium px-3 gap-1.5"
                        >
                            <Calendar data-icon="inline-start" className="size-3.5" />
                            {isToday ? 'Today' : formatDate(date)}
                        </Button>

                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            disabled={isToday}
                            onClick={() => changeDate(shiftDate(date, 1))}
                            aria-label="Next day"
                            className="size-7 rounded-full text-muted-foreground hover:text-foreground disabled:opacity-40"
                        >
                            <ChevronRight className="size-3.5" />
                        </Button>
                    </div>
                </div>

                {/* Check-in panel (only for today) */}
                {isToday && (
                    <Card className="border-border">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                        <UserCheck className="size-4" />
                                    </div>
                                    <CardTitle className="text-base font-semibold">
                                        Front Desk Check-in
                                    </CardTitle>
                                </div>
                                <Badge variant="outline" className="gap-1 text-xs">
                                    <Clock className="size-3" />
                                    Today's Entry
                                </Badge>
                            </div>
                            <CardDescription>
                                Search member by name or phone to verify membership status and record check-in.
                            </CardDescription>
                        </CardHeader>

                        <CardContent>
                            <form onSubmit={checkIn} className="flex flex-col gap-4">
                                <div className="relative">
                                    <Label htmlFor="member-search" className="sr-only">
                                        Search Member
                                    </Label>
                                    <div className="relative">
                                        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            id="member-search"
                                            type="text"
                                            value={memberQuery}
                                            onChange={(event) => {
                                                setMemberQuery(event.target.value);
                                                setSelectedMember(null);
                                                setAttendanceStatus(null);
                                                setData('member_id', '');
                                            }}
                                            placeholder="Search member name or phone number..."
                                            autoComplete="off"
                                            className="pl-9 pr-9"
                                        />
                                        {memberQuery && (
                                            <button
                                                type="button"
                                                onClick={clearSelection}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                            >
                                                <X className="size-4" />
                                            </button>
                                        )}
                                    </div>

                                    {searching && (
                                        <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                                            <Spinner className="size-3" />
                                            Searching members...
                                        </p>
                                    )}

                                    {members.length > 0 && !selectedMember && (
                                        <div className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border bg-popover p-1 shadow-lg">
                                            {members.map((member) => (
                                                <button
                                                    key={member.id}
                                                    type="button"
                                                    onClick={() => selectMember(member)}
                                                    className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition hover:bg-muted"
                                                >
                                                    <div>
                                                        <span className="font-medium text-foreground">
                                                            {member.name}
                                                        </span>
                                                        <span className="ml-2 text-xs text-muted-foreground">
                                                            {member.phone}
                                                        </span>
                                                    </div>
                                                    <Badge variant="outline" className="text-xs">Select</Badge>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {selectedMember && (
                                    <Card className="bg-muted/30">
                                        <CardContent className="flex flex-col gap-3 p-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex size-8 items-center justify-center rounded-full bg-background border">
                                                        <User className="size-4 text-muted-foreground" />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold leading-none">
                                                            {selectedMember.name}
                                                        </p>
                                                        <p className="mt-1 text-xs text-muted-foreground">
                                                            {selectedMember.phone}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={clearSelection}
                                                >
                                                    Change
                                                </Button>
                                            </div>

                                            {checkingStatus && (
                                                <div className="flex items-center gap-2 py-2 text-xs text-muted-foreground">
                                                    <Spinner className="size-3.5" />
                                                    Checking active membership status...
                                                </div>
                                            )}

                                            {!checkingStatus && attendanceStatus?.checked_in && (
                                                <Alert className="border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200">
                                                    <Clock className="size-4 text-amber-600 dark:text-amber-400" />
                                                    <AlertTitle className="text-sm font-semibold">
                                                        Already Checked In Today
                                                    </AlertTitle>
                                                    <AlertDescription className="text-xs">
                                                        Recorded at{' '}
                                                        {attendanceStatus.check_in_at
                                                            ? formatTime(attendanceStatus.check_in_at)
                                                            : 'today'}
                                                    </AlertDescription>
                                                </Alert>
                                            )}

                                            {!checkingStatus &&
                                                attendanceStatus &&
                                                !attendanceStatus.checked_in &&
                                                !attendanceStatus.membership_active && (
                                                    <Alert variant="destructive">
                                                        <AlertCircle className="size-4" />
                                                        <AlertTitle className="text-sm font-semibold">
                                                            Membership Inactive
                                                        </AlertTitle>
                                                        <AlertDescription className="text-xs">
                                                            This member does not have an active subscription today. Please renew their plan before entry.
                                                        </AlertDescription>
                                                    </Alert>
                                                )}

                                            {!checkingStatus &&
                                                attendanceStatus &&
                                                !attendanceStatus.checked_in &&
                                                attendanceStatus.membership_active && (
                                                    <div className="flex flex-col gap-3">
                                                        <Alert className="border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200">
                                                            <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                                                            <AlertTitle className="text-sm font-semibold">
                                                                Membership Valid
                                                            </AlertTitle>
                                                            <AlertDescription className="text-xs">
                                                                Active through{' '}
                                                                {attendanceStatus.membership_end_date
                                                                    ? formatDate(attendanceStatus.membership_end_date)
                                                                    : 'today'}
                                                            </AlertDescription>
                                                        </Alert>

                                                        <Button
                                                            type="submit"
                                                            disabled={processing}
                                                            className="w-full"
                                                        >
                                                            {processing ? (
                                                                <Spinner data-icon="inline-start" />
                                                            ) : (
                                                                <UserCheck data-icon="inline-start" className="size-4" />
                                                            )}
                                                            Record Check-in
                                                        </Button>
                                                    </div>
                                                )}
                                        </CardContent>
                                    </Card>
                                )}

                                <InputError message={errors.member_id} />
                            </form>
                        </CardContent>
                    </Card>
                )}

                {/* Attendances Table Card */}
                <Card className="border-border">
                    <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <CardTitle className="text-base font-semibold">
                                    {isToday ? "Today's Check-ins" : `Check-ins · ${formatDate(date)}`}
                                </CardTitle>
                                <Badge variant="secondary">
                                    {attendances.length} {attendances.length === 1 ? 'entry' : 'entries'}
                                </Badge>
                            </div>
                            <CardDescription>
                                Chronological log of member entrance scans and desk check-ins.
                            </CardDescription>
                        </div>

                        <div className="relative w-full sm:max-w-xs">
                            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                type="search"
                                value={listSearch}
                                onChange={(event) => setListSearch(event.target.value)}
                                placeholder="Search checked-in members..."
                                className="pl-9"
                            />
                        </div>
                    </CardHeader>

                    <CardContent className="p-0">
                        {attendances.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-12 text-center">
                                <Clock className="size-10 text-muted-foreground/40" />
                                <p className="mt-3 text-sm font-medium">No check-ins recorded for this day</p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Member entries scanned via QR or checked in at the desk will appear here.
                                </p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/30">
                                        <TableHead>Member</TableHead>
                                        <TableHead>Weekly Cadence</TableHead>
                                        <TableHead>Retention Context</TableHead>
                                        <TableHead>Source</TableHead>
                                        <TableHead className="text-right">Time</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {attendances.map((record) => (
                                        <TableRow key={record.id}>
                                            <TableCell>
                                                <Link
                                                    href={`/members/${record.member.id}`}
                                                    className="font-medium text-foreground hover:underline"
                                                >
                                                    {record.member.name}
                                                </Link>
                                                <p className="text-xs text-muted-foreground">
                                                    {record.member.phone}
                                                </p>
                                            </TableCell>

                                            <TableCell>
                                                <div className="flex items-center gap-1.5 text-xs font-medium">
                                                    <span>{record.context.weekly_visits} this week</span>
                                                    {record.context.expected_visits_per_week !== null && (
                                                        <span className="text-muted-foreground">
                                                            / {record.context.expected_visits_per_week} expected
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>

                                            <TableCell>
                                                <div className="flex flex-col gap-1">
                                                    {record.context.has_open_attendance_signal && (
                                                        <Badge
                                                            variant="outline"
                                                            className="w-fit border-amber-500/30 text-amber-600 dark:text-amber-400"
                                                        >
                                                            <Activity className="size-3" />
                                                            Attendance declining
                                                        </Badge>
                                                    )}

                                                    {!record.context.has_open_attendance_signal &&
                                                        record.context.latest_attendance_signal_status === 'resolved' && (
                                                            <Badge
                                                                variant="outline"
                                                                className="w-fit border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                                                            >
                                                                <CheckCircle2 className="size-3" />
                                                                Cadence recovered
                                                            </Badge>
                                                        )}

                                                    {record.context.latest_intervention && (
                                                        <span className="text-[11px] text-muted-foreground">
                                                            Action:{' '}
                                                            {getInterventionLabel(record.context.latest_intervention.type)}
                                                            {record.context.latest_intervention.outcome &&
                                                                ` (${record.context.latest_intervention.outcome})`}
                                                        </span>
                                                    )}

                                                    {!record.context.has_open_attendance_signal &&
                                                        record.context.latest_attendance_signal_status !== 'resolved' &&
                                                        !record.context.latest_intervention && (
                                                            <span className="text-xs text-muted-foreground">—</span>
                                                        )}
                                                </div>
                                            </TableCell>

                                            <TableCell>
                                                <Badge variant="secondary" className="capitalize">
                                                    {record.source}
                                                </Badge>
                                            </TableCell>

                                            <TableCell className="text-right">
                                                <span className="font-medium">
                                                    {formatTime(record.check_in_at)}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

Attendance.layout = {
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
