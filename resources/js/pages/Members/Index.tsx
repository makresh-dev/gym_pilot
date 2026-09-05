import { Head, Link, router } from '@inertiajs/react';
import {
    AlertCircle,
    CheckCircle2,
    Clock3,
    Search,
    UserPlus,
    X,
} from 'lucide-react';
import { useEffect, useState } from 'react';

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
    membership_status: MembershipStatus;
    financial_status: FinancialStatus;
    membership_expires_at: string | null;
    balance_due: number;
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
    membership_status: MembershipStatus | '';
    financial_status: FinancialStatus | '';
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
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(amount);
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
    const config = {
        active: {
            label: 'Active',
            className:
                'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/40 dark:text-emerald-300',
            icon: CheckCircle2,
        },
        expiring: {
            label: 'Expiring',
            className:
                'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-950/40 dark:text-amber-300',
            icon: Clock3,
        },
        expired: {
            label: 'Expired',
            className:
                'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-950/40 dark:text-red-300',
            icon: AlertCircle,
        },
        none: {
            label: 'No Membership',
            className:
                'bg-muted text-muted-foreground ring-border',
            icon: AlertCircle,
        },
    }[status];

    const Icon = config.icon;

    return (
        <span
            className={[
                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset',
                config.className,
            ].join(' ')}
        >
            <Icon className="h-3.5 w-3.5" />
            {config.label}
        </span>
    );
}

function FinancialBadge({
    status,
    balanceDue,
}: {
    status: FinancialStatus;
    balanceDue: number;
}) {
    if (status === 'paid') {
        return (
            <span className="text-sm text-muted-foreground">
                Paid
            </span>
        );
    }

    return (
        <div className="flex items-center gap-1.5 text-sm font-medium text-orange-700 dark:text-orange-300">
            <span>{formatCurrency(balanceDue)} due</span>
        </div>
    );
}

export default function Index({
    members,
    search,
    membership_status,
    financial_status,
}: MembersIndexProps) {
    const [query, setQuery] = useState(search);

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
                    ...(query.trim()
                        ? { search: query.trim() }
                        : {}),
                    ...(membership_status
                        ? { membership_status }
                        : {}),
                    ...(financial_status
                        ? { financial_status }
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
        membership_status,
        financial_status,
    ]);

    function applyFilters(
        nextMembershipStatus: MembershipStatus | '',
        nextFinancialStatus: FinancialStatus | '',
    ) {
        router.get(
            '/members',
            {
                ...(query.trim()
                    ? { search: query.trim() }
                    : {}),
                ...(nextMembershipStatus
                    ? {
                        membership_status:
                            nextMembershipStatus,
                    }
                    : {}),
                ...(nextFinancialStatus
                    ? {
                        financial_status:
                            nextFinancialStatus,
                    }
                    : {}),
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    }

    const hasActiveFilters =
        Boolean(membership_status || financial_status);

    return (
        <>
            <Head title="Members" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Members
                        </h1>

                        <p className="mt-1 text-sm text-muted-foreground">
                            Manage your gym members and their profiles.
                        </p>
                    </div>

                    <Link
                        href="/members/create"
                        className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
                    >
                        <UserPlus className="h-4 w-4" />
                        Add Member
                    </Link>
                </div>

                <div className="space-y-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="relative w-full sm:max-w-md">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                            <input
                                type="search"
                                value={query}
                                onChange={(event) =>
                                    setQuery(
                                        event.target.value,
                                    )
                                }
                                placeholder="Search by name, phone, or email..."
                                className="h-10 w-full rounded-md border bg-background pl-9 pr-3 text-sm outline-none transition focus:ring-2 focus:ring-ring"
                            />
                        </div>

                        <p className="text-sm text-muted-foreground">
                            {members.total}{' '}
                            {members.total === 1
                                ? 'member'
                                : 'members'}
                        </p>
                    </div>

                    <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                            {membershipFilters.map((filter) => {
                                const isActive =
                                    membership_status ===
                                    filter.value;

                                return (
                                    <button
                                        key={filter.value || 'all'}
                                        type="button"
                                        onClick={() =>
                                            applyFilters(
                                                filter.value,
                                                financial_status,
                                            )
                                        }
                                        className={[
                                            'rounded-full border px-3 py-1.5 text-sm transition',
                                            isActive
                                                ? 'border-foreground bg-foreground text-background'
                                                : 'hover:bg-muted',
                                        ].join(' ')}
                                    >
                                        {filter.label}
                                    </button>
                                );
                            })}

                            <span className="mx-1 hidden h-5 w-px bg-border sm:block" />

                            <button
                                type="button"
                                onClick={() =>
                                    applyFilters(
                                        membership_status,
                                        financial_status ===
                                            'outstanding'
                                            ? ''
                                            : 'outstanding',
                                    )
                                }
                                className={[
                                    'rounded-full border px-3 py-1.5 text-sm transition',
                                    financial_status ===
                                        'outstanding'
                                        ? 'border-foreground bg-foreground text-background'
                                        : 'hover:bg-muted',
                                ].join(' ')}
                            >
                                Outstanding
                            </button>

                            {hasActiveFilters && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        applyFilters('', '')
                                    }
                                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                                >
                                    <X className="h-3.5 w-3.5" />
                                    Clear filters
                                </button>
                            )}
                        </div>

                        {hasActiveFilters && (
                            <p className="text-xs text-muted-foreground">
                                Showing filtered members. Filters
                                apply together with search.
                            </p>
                        )}
                    </div>
                </div>

                <div className="hidden overflow-hidden rounded-lg border md:block">
                    <table className="w-full text-sm">
                        <thead className="border-b bg-muted/40">
                            <tr>
                                <th className="px-5 py-3 text-left font-medium">
                                    Member
                                </th>

                                <th className="px-5 py-3 text-left font-medium">
                                    Membership
                                </th>

                                <th className="px-5 py-3 text-left font-medium">
                                    Financial
                                </th>

                                <th className="px-5 py-3 text-right font-medium">
                                    Action
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {members.data.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={4}
                                        className="px-5 py-12 text-center"
                                    >
                                        <div className="mx-auto max-w-sm">
                                            <p className="font-medium">
                                                {query ||
                                                    hasActiveFilters
                                                    ? 'No members match these criteria'
                                                    : 'No members yet'}
                                            </p>

                                            <p className="mt-1 text-sm text-muted-foreground">
                                                {query ||
                                                    hasActiveFilters
                                                    ? 'Try a different search or clear a filter.'
                                                    : 'Add your first member to get started.'}
                                            </p>

                                            {!query &&
                                                !hasActiveFilters && (
                                                    <Link
                                                        href="/members/create"
                                                        className="mt-4 inline-flex rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
                                                    >
                                                        Add Member
                                                    </Link>
                                                )}
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                members.data.map((member) => (
                                    <tr
                                        key={member.id}
                                        className="border-b last:border-0 hover:bg-muted/20"
                                    >
                                        <td className="px-5 py-4">
                                            <Link
                                                href={`/members/${member.id}`}
                                                className="font-medium hover:underline"
                                            >
                                                {member.name}
                                            </Link>

                                            <p className="mt-1 text-xs text-muted-foreground">
                                                {member.phone}
                                            </p>
                                        </td>

                                        <td className="px-5 py-4">
                                            <MembershipBadge
                                                status={
                                                    member.membership_status
                                                }
                                            />

                                            {member.membership_expires_at && (
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    {member.membership_status ===
                                                        'expired'
                                                        ? `Expired ${formatDate(member.membership_expires_at)}`
                                                        : `Ends ${formatDate(member.membership_expires_at)}`}
                                                </p>
                                            )}
                                        </td>

                                        <td className="px-5 py-4">
                                            <FinancialBadge
                                                status={
                                                    member.financial_status
                                                }
                                                balanceDue={
                                                    member.balance_due
                                                }
                                            />
                                        </td>

                                        <td className="px-5 py-4 text-right">
                                            <Link
                                                href={`/members/${member.id}`}
                                                className="font-medium hover:underline"
                                            >
                                                View
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="space-y-3 md:hidden">
                    {members.data.length === 0 ? (
                        <div className="rounded-lg border border-dashed px-5 py-12 text-center">
                            <p className="font-medium">
                                {query || hasActiveFilters
                                    ? 'No members match these criteria'
                                    : 'No members yet'}
                            </p>

                            <p className="mt-1 text-sm text-muted-foreground">
                                {query || hasActiveFilters
                                    ? 'Try a different search or clear a filter.'
                                    : 'Add your first member to get started.'}
                            </p>

                            {!query &&
                                !hasActiveFilters && (
                                    <Link
                                        href="/members/create"
                                        className="mt-4 inline-flex rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
                                    >
                                        Add Member
                                    </Link>
                                )}
                        </div>
                    ) : (
                        members.data.map((member) => (
                            <div
                                key={member.id}
                                className="rounded-lg border p-4"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="min-w-0">
                                        <Link
                                            href={`/members/${member.id}`}
                                            className="font-medium hover:underline"
                                        >
                                            {member.name}
                                        </Link>

                                        <p className="mt-1 text-sm text-muted-foreground">
                                            {member.phone}
                                        </p>

                                        {member.email && (
                                            <p className="mt-1 truncate text-sm text-muted-foreground">
                                                {member.email}
                                            </p>
                                        )}
                                    </div>

                                    <Link
                                        href={`/members/${member.id}`}
                                        className="shrink-0 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted"
                                    >
                                        View
                                    </Link>
                                </div>

                                <div className="mt-4 flex flex-wrap items-center gap-2">
                                    <MembershipBadge
                                        status={
                                            member.membership_status
                                        }
                                    />

                                    {member.membership_expires_at && (
                                        <span className="text-xs text-muted-foreground">
                                            {member.membership_status ===
                                                'expired'
                                                ? `Expired ${formatDate(member.membership_expires_at)}`
                                                : `Ends ${formatDate(member.membership_expires_at)}`}
                                        </span>
                                    )}
                                </div>

                                <div className="mt-3 border-t pt-3">
                                    <FinancialBadge
                                        status={
                                            member.financial_status
                                        }
                                        balanceDue={
                                            member.balance_due
                                        }
                                    />
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {members.last_page > 1 && (
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-muted-foreground">
                            Page {members.current_page} of{' '}
                            {members.last_page}
                        </p>

                        <div className="flex flex-wrap gap-2">
                            {members.links.map((link, index) => (
                                <Link
                                    key={`${link.label}-${index}`}
                                    href={link.url ?? '#'}
                                    className={[
                                        'rounded-md border px-3 py-1.5 text-sm transition',
                                        link.active
                                            ? 'bg-muted font-medium'
                                            : 'hover:bg-muted',
                                        !link.url
                                            ? 'pointer-events-none opacity-40'
                                            : '',
                                    ].join(' ')}
                                    dangerouslySetInnerHTML={{
                                        __html: link.label,
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
