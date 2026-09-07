import { Head, Link, router } from '@inertiajs/react';
import {
    AlertCircle,
    CheckCircle2,
    Clock3,
    DollarSign,
    Search,
    User,
    UserPlus,
    X,
    ChevronRight,
} from 'lucide-react';
import { useEffect, useState } from 'react';
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

type MembershipStatus =
    | 'active'
    | 'expiring'
    | 'expired'
    | 'none';

type FinancialStatus = 'paid' | 'outstanding';

type Member = {
    id: string;
    name: string;
    email: string | null;
    phone: string;
    date_of_birth: string | null;
    membership_status: string | null;
    financial_status: string | null;
    membership_expires_at: string | null;
    balance_due: number | string | null | undefined;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type PaginatedMembers = {
    data: Member[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: PaginationLink[];
};

type MembersIndexProps = {
    members: PaginatedMembers;
    search: string;
    membership_status: string | '';
    financial_status: string | '';
};

const membershipFilters: {
    value: MembershipStatus | '';
    label: string;
}[] = [
    { value: '', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'expiring', label: 'Expiring' },
    { value: 'expired', label: 'Expired' },
    { value: 'none', label: 'No Membership' },
];

function formatCurrency(amount: number): string {
    const safeAmount = Number.isFinite(Number(amount))
        ? Number(amount)
        : 0;

    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(safeAmount);
}

function normalizeMembershipStatus(status: string | null | undefined): MembershipStatus {
    switch (status) {
        case 'active':
        case 'expiring':
        case 'expired':
        case 'none':
            return status;
        default:
            return 'none';
    }
}

function normalizeFinancialStatus(status: string | null | undefined): FinancialStatus {
    return status === 'paid' ? 'paid' : 'outstanding';
}

function normalizeBalanceDue(
    amount: number | string | null | undefined,
): number {
    const value = Number(amount);
    return Number.isFinite(value) ? value : 0;
}

function formatDate(date: string | null): string {
    if (!date) {
        return '—';
    }

    return new Intl.DateTimeFormat('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'Asia/Kolkata',
    }).format(new Date(`${date}T00:00:00+05:30`));
}

function MembershipBadge({
    status,
}: {
    status: MembershipStatus;
}) {
    switch (status) {
        case 'active':
            return (
                <Badge variant="outline" className="gap-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="size-3" />
                    Active
                </Badge>
            );
        case 'expiring':
            return (
                <Badge variant="outline" className="gap-1 border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <Clock3 className="size-3" />
                    Expiring
                </Badge>
            );
        case 'expired':
            return (
                <Badge variant="destructive" className="gap-1">
                    <AlertCircle className="size-3" />
                    Expired
                </Badge>
            );
        default:
            return (
                <Badge variant="secondary" className="gap-1 text-muted-foreground">
                    No Membership
                </Badge>
            );
    }
}

function FinancialBadge({
    status,
    balanceDue,
}: {
    status: FinancialStatus;
    balanceDue: number;
}) {
    if (status === 'paid' && balanceDue <= 0) {
        return (
            <Badge variant="outline" className="gap-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-3" />
                Fully Paid
            </Badge>
        );
    }

    return (
        <Badge variant="outline" className="gap-1 border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold">
            <DollarSign className="size-3" />
            Due {formatCurrency(balanceDue)}
        </Badge>
    );
}

export default function Index({
    members,
    search = '',
    membership_status = '',
    financial_status = '',
}: MembersIndexProps) {
    const [query, setQuery] = useState(search);

    const normalizedMembershipStatus: MembershipStatus | '' =
        membership_status && ['active', 'expiring', 'expired', 'none'].includes(membership_status)
            ? (membership_status as MembershipStatus)
            : '';

    const normalizedFinancialStatus: FinancialStatus | '' =
        financial_status && ['paid', 'outstanding'].includes(financial_status)
            ? (financial_status as FinancialStatus)
            : '';

    useEffect(() => {
        setQuery(search);
    }, [search]);

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            if (query === search) {
                return;
            }

            router.get(
                '/members',
                {
                    ...(query.trim() ? { search: query.trim() } : {}),
                    ...(normalizedMembershipStatus
                        ? { membership_status: normalizedMembershipStatus }
                        : {}),
                    ...(normalizedFinancialStatus
                        ? { financial_status: normalizedFinancialStatus }
                        : {}),
                },
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                },
            );
        }, 300);

        return () => window.clearTimeout(timeout);
    }, [
        query,
        search,
        normalizedMembershipStatus,
        normalizedFinancialStatus,
    ]);

    function applyFilters(
        nextMembershipStatus: MembershipStatus | '',
        nextFinancialStatus: FinancialStatus | '',
    ) {
        router.get(
            '/members',
            {
                ...(query.trim() ? { search: query.trim() } : {}),
                ...(nextMembershipStatus
                    ? { membership_status: nextMembershipStatus }
                    : {}),
                ...(nextFinancialStatus
                    ? { financial_status: nextFinancialStatus }
                    : {}),
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    }

    const hasActiveFilters = Boolean(membership_status || financial_status);

    return (
        <>
            <Head title="Members" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6 max-w-7xl mx-auto w-full">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">Members</h1>
                        <p className="mt-1 text-sm text-muted-foreground font-normal">
                            Manage your member roster, monitor active subscriptions, and track dues.
                        </p>
                    </div>

                    <Button asChild className="gap-2 shrink-0 rounded-full px-5 text-xs font-medium shadow-xs">
                        <Link href="/members/create">
                            <UserPlus className="size-4" />
                            <span>Add Member</span>
                        </Link>
                    </Button>
                </div>

                {/* Filters and search card */}
                <Card className="border-border/80">
                    <CardContent className="flex flex-col gap-4 p-4 sm:p-5">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="relative w-full sm:max-w-md">
                                <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    type="search"
                                    value={query}
                                    onChange={(event) => setQuery(event.target.value)}
                                    placeholder="Search by name, phone, or email..."
                                    className="pl-9.5 h-10 rounded-full bg-black/[0.03] dark:bg-white/[0.05] border-border/80 text-sm"
                                />
                            </div>

                            <Badge variant="outline" className="w-fit text-xs px-3.5 py-1 font-medium bg-card/80">
                                <span className="tabular-nums font-semibold mr-1">{members.total}</span> {members.total === 1 ? 'member' : 'members'}
                            </Badge>
                        </div>

                        {/* Filter chips */}
                        <div className="flex flex-wrap items-center gap-2">
                            {membershipFilters.map((filter) => {
                                const isActive = normalizedMembershipStatus === filter.value;
                                return (
                                    <Button
                                        key={filter.value || 'all'}
                                        type="button"
                                        size="sm"
                                        variant={isActive ? 'default' : 'outline'}
                                        onClick={() =>
                                            applyFilters(
                                                filter.value,
                                                normalizedFinancialStatus,
                                            )
                                        }
                                        className={`h-8 rounded-full text-xs font-medium transition-all ${
                                            isActive ? 'shadow-xs' : 'bg-card/80 hover:bg-secondary border-border/80'
                                        }`}
                                    >
                                        {filter.label}
                                    </Button>
                                );
                            })}

                            <span className="hidden h-5 w-px bg-border/80 sm:block" />

                            <Button
                                type="button"
                                size="sm"
                                variant={normalizedFinancialStatus === 'outstanding' ? 'default' : 'outline'}
                                onClick={() =>
                                    applyFilters(
                                        normalizedMembershipStatus,
                                        normalizedFinancialStatus === 'outstanding'
                                            ? ''
                                            : 'outstanding',
                                    )
                                }
                                className={`h-8 rounded-full text-xs font-medium transition-all ${
                                    normalizedFinancialStatus === 'outstanding' ? 'shadow-xs' : 'bg-card/80 hover:bg-secondary border-border/80'
                                }`}
                            >
                                Outstanding Dues
                            </Button>

                            {hasActiveFilters && (
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => applyFilters('', '')}
                                    className="h-8 rounded-full text-xs text-muted-foreground hover:text-foreground gap-1.5"
                                >
                                    <X className="size-3.5" />
                                    <span>Clear filters</span>
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Members Table (Desktop) */}
                <Card className="hidden md:block border-border overflow-hidden py-0 gap-0">
                    <CardContent className="p-0">
                        {members.data.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-12 text-center">
                                <User className="size-10 text-muted-foreground/40" />
                                <p className="mt-3 text-sm font-semibold">
                                    {query || hasActiveFilters
                                        ? 'No members match these criteria'
                                        : 'No members yet'}
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground max-w-sm">
                                    {query || hasActiveFilters
                                        ? 'Try clearing active filters or searching a different term.'
                                        : 'Add your first gym member to begin tracking attendance and subscriptions.'}
                                </p>
                                {!query && !hasActiveFilters && (
                                    <Button asChild size="sm" className="mt-4 gap-1.5">
                                        <Link href="/members/create">
                                            <UserPlus className="size-4" />
                                            Add Member
                                        </Link>
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                                        <TableHead className="pl-4 sm:pl-6 min-w-[240px] w-[35%]">Member</TableHead>
                                        <TableHead>Membership Status</TableHead>
                                        <TableHead>Financial Status</TableHead>
                                        <TableHead className="text-center pr-4 sm:pr-6">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {members.data.map((member) => (
                                        <TableRow key={member.id} className="hover:bg-muted/30 transition-colors">
                                            <TableCell className="pl-4 sm:pl-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                                                        {member.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <Link
                                                            href={`/members/${member.id}`}
                                                            className="font-bold text-foreground hover:underline block truncate"
                                                        >
                                                            {member.name}
                                                        </Link>
                                                        <p className="text-xs text-muted-foreground truncate">
                                                            {member.phone} {member.email ? `· ${member.email}` : ''}
                                                        </p>
                                                    </div>
                                                </div>
                                            </TableCell>

                                            <TableCell>
                                                <div className="flex flex-col gap-1 items-start">
                                                    <MembershipBadge
                                                        status={normalizeMembershipStatus(
                                                            member.membership_status,
                                                        )}
                                                    />
                                                    {member.membership_expires_at && (
                                                        <span className="text-[11px] text-muted-foreground">
                                                            {normalizeMembershipStatus(
                                                                member.membership_status,
                                                            ) === 'expired'
                                                                ? `Expired ${formatDate(member.membership_expires_at)}`
                                                                : `Ends ${formatDate(member.membership_expires_at)}`}
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>

                                            <TableCell>
                                                <FinancialBadge
                                                    status={normalizeFinancialStatus(
                                                        member.financial_status,
                                                    )}
                                                    balanceDue={normalizeBalanceDue(
                                                        member.balance_due,
                                                    )}
                                                />
                                            </TableCell>

                                            <TableCell className="text-center pr-4 sm:pr-6">
                                                <Button variant="ghost" size="sm" asChild className="gap-1 font-semibold hover:bg-muted">
                                                    <Link href={`/members/${member.id}`}>
                                                        <span>View Profile</span>
                                                        <ChevronRight className="size-4" />
                                                    </Link>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>

                {/* Mobile Cards view */}
                <div className="flex flex-col gap-3 md:hidden">
                    {members.data.length === 0 ? (
                        <Card className="flex flex-col items-center justify-center p-8 text-center border-border">
                            <User className="size-8 text-muted-foreground/40" />
                            <p className="mt-3 text-sm font-semibold">No members found</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Adjust your search or filters.
                            </p>
                        </Card>
                    ) : (
                        members.data.map((member) => (
                            <Card key={member.id} className="border-border">
                                <CardHeader className="pb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                                            {member.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <Link
                                                href={`/members/${member.id}`}
                                                className="font-bold text-foreground hover:underline block truncate"
                                            >
                                                {member.name}
                                            </Link>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {member.phone}
                                            </p>
                                        </div>
                                        <Button variant="outline" size="sm" asChild className="shrink-0">
                                            <Link href={`/members/${member.id}`}>
                                                View
                                            </Link>
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex flex-col gap-2 pt-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <MembershipBadge
                                            status={normalizeMembershipStatus(
                                                member.membership_status,
                                            )}
                                        />
                                        <FinancialBadge
                                            status={normalizeFinancialStatus(
                                                member.financial_status,
                                            )}
                                            balanceDue={normalizeBalanceDue(
                                                member.balance_due,
                                            )}
                                        />
                                    </div>
                                    {member.membership_expires_at && (
                                        <span className="text-[11px] text-muted-foreground">
                                            {normalizeMembershipStatus(
                                                member.membership_status,
                                            ) === 'expired'
                                                ? `Expired ${formatDate(member.membership_expires_at)}`
                                                : `Ends ${formatDate(member.membership_expires_at)}`}
                                        </span>
                                    )}
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>

                {/* Pagination */}
                {members.last_page > 1 && (
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-2">
                        <p className="text-xs text-muted-foreground font-medium">
                            Showing page {members.current_page} of {members.last_page} ({members.total} members total)
                        </p>

                        <div className="flex flex-wrap items-center gap-1.5">
                            {members.links.map((link, index) => (
                                <Button
                                    key={`${link.label}-${index}`}
                                    variant={link.active ? 'default' : 'outline'}
                                    size="sm"
                                    disabled={!link.url}
                                    asChild={Boolean(link.url)}
                                    className="h-8 min-w-8 text-xs"
                                >
                                    {link.url ? (
                                        <Link
                                            href={link.url}
                                            dangerouslySetInnerHTML={{
                                                __html: link.label,
                                            }}
                                        />
                                    ) : (
                                        <span
                                            dangerouslySetInnerHTML={{
                                                __html: link.label,
                                            }}
                                        />
                                    )}
                                </Button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
