import { Head, Link } from '@inertiajs/react';
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
    };

    detected_at: string;

    recommendation: Recommendation | null;
};

type DashboardProps = {
    stats: DashboardStats;
    signals: Signal[];
};

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
                    <div className="flex items-center justify-between gap-6">
                        <div>
                            <h2 className="text-lg font-semibold">
                                Outstanding Balance
                            </h2>

                            <p className="mt-1 text-sm text-muted-foreground">
                                Amount currently due across active memberships.
                            </p>
                        </div>

                        <p className="whitespace-nowrap text-2xl font-semibold">
                            ₹{stats.outstanding_balance.toFixed(2)}
                        </p>
                    </div>
                </section>

                {/* Members needing attention */}
                <section className="rounded-xl border p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold">
                                Members Needing Attention
                            </h2>

                            <p className="mt-1 text-sm text-muted-foreground">
                                Recent behavior changes that may require action.
                            </p>
                        </div>

                        <span className="text-2xl font-semibold">
                            {signals.length}
                        </span>
                    </div>

                    <div className="mt-5 space-y-4">
                        {signals.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                Nothing needs attention right now.
                            </p>
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
    const hasDecline =
        signal.evidence.decline_percentage !== undefined;

    const hasBaseline =
        signal.evidence.baseline_average !== undefined;

    const hasRecent =
        signal.evidence.recent_average !== undefined;

    const hasExpected =
        signal.evidence.expected_visits_per_week !== undefined &&
        signal.evidence.expected_visits_per_week !== null;

    return (
        <div className="rounded-lg border p-4">
            {/* Signal header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <Link
                        href={`/members/${signal.member.id}`}
                        className="font-medium hover:underline"
                    >
                        {signal.member.name}
                    </Link>

                    <p className="mt-1 text-sm capitalize text-muted-foreground">
                        {signal.type.replace(/_/g, ' ')}
                    </p>
                </div>

                <span className="rounded-full border px-2.5 py-1 text-xs font-medium capitalize">
                    {signal.severity}
                </span>
            </div>

            {/* Signal evidence */}
            <div className="mt-4 space-y-1">
                {hasDecline && (
                    <p className="text-sm">
                        Attendance declined by{' '}
                        <span className="font-medium">
                            {signal.evidence.decline_percentage}%
                        </span>
                        .
                    </p>
                )}

                <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
                    {hasBaseline && (
                        <span>
                            Baseline:{' '}
                            {signal.evidence.baseline_average}
                            /week
                        </span>
                    )}

                    {hasRecent && (
                        <span>
                            Recent:{' '}
                            {signal.evidence.recent_average}
                            /week
                        </span>
                    )}

                    {hasExpected && (
                        <span>
                            Expected:{' '}
                            {signal.evidence.expected_visits_per_week}
                            /week
                        </span>
                    )}
                </div>
            </div>

            {/* Recommended action */}
            {signal.recommendation && (
                <div className="mt-4 rounded-md border bg-muted/30 p-3">
                    <p className="text-sm font-medium">
                        Recommended action
                    </p>

                    <p className="mt-1 text-sm">
                        {signal.recommendation.label}
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                        {signal.recommendation.reason}
                    </p>

                    <Link
                        href={`/members/${signal.member.id}`}
                        className="mt-3 inline-flex rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted"
                    >
                        View Member
                    </Link>
                </div>
            )}
        </div>
    );
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