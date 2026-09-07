import { Head, Link, router } from '@inertiajs/react';
import { Calendar, CreditCard, Edit, Plus, PowerOff, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { dashboard } from '@/routes';
import membershipPlans from '@/routes/membership-plans';

type MembershipPlan = {
    id: string;
    name: string;
    price: string;
    duration_days: number;
    is_active: boolean;
};

type MembershipPlansProps = {
    plans: MembershipPlan[];
};

export default function Index({ plans }: MembershipPlansProps) {
    const activePlans = plans.filter((plan) => plan.is_active);
    const inactivePlans = plans.filter((plan) => !plan.is_active);

    const toggleStatus = (plan: MembershipPlan) => {
        const message = plan.is_active
            ? `Deactivate "${plan.name}"? Existing memberships using this plan will be preserved.`
            : `Activate "${plan.name}"? This plan will become available for new memberships and renewals.`;

        if (!window.confirm(message)) {
            return;
        }

        router.patch(
            membershipPlans.toggleStatus(plan.id).url,
            {},
            {
                preserveScroll: true,
            },
        );
    };

    return (
        <>
            <Head title="Membership Plans" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6 max-w-7xl mx-auto w-full">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
                            Membership Plans
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground font-normal">
                            Configure pricing tiers and durations available for new memberships and renewals.
                        </p>
                    </div>

                    <Button asChild className="gap-2 rounded-full px-5 text-xs font-medium shadow-xs">
                        <Link href={membershipPlans.create()}>
                            <Plus data-icon="inline-start" className="size-4" />
                            Create Plan
                        </Link>
                    </Button>
                </div>

                {/* Active plans section */}
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-base sm:text-lg font-semibold tracking-tight text-foreground">Active Plans</h2>
                            <p className="text-xs text-muted-foreground">
                                Currently available to assign to members.
                            </p>
                        </div>
                        <Badge variant="secondary" className="rounded-full px-3 py-0.5 text-xs font-medium">{activePlans.length} active</Badge>
                    </div>

                    {activePlans.length === 0 ? (
                        <Card className="flex flex-col items-center justify-center p-8 text-center border-border/80">
                            <CreditCard className="size-10 text-muted-foreground/40" />
                            <p className="mt-3 text-sm font-semibold text-foreground">No active plans found</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Create your first membership plan to start enrolling members.
                            </p>
                            <Button asChild size="sm" className="mt-4 rounded-full px-4 text-xs">
                                <Link href={membershipPlans.create()}>
                                    <Plus data-icon="inline-start" className="size-3.5" />
                                    Create Plan
                                </Link>
                            </Button>
                        </Card>
                    ) : (
                        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {activePlans.map((plan) => (
                                <Card key={plan.id} className="flex flex-col justify-between overflow-hidden border-border/80 hover:border-primary/40 hover:shadow-[0_4px_20px_rgba(0,0,0,0.05)] transition-all duration-200">
                                    <CardHeader className="pb-2">
                                        <div className="flex items-center justify-between">
                                            <Badge variant="outline" className="gap-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                                <ShieldCheck className="size-3" />
                                                Active
                                            </Badge>
                                            <span className="flex items-center gap-1 text-xs text-muted-foreground font-medium">
                                                <Calendar className="size-3" />
                                                {plan.duration_days} days
                                            </span>
                                        </div>
                                        <CardTitle className="mt-2.5 text-lg font-semibold text-foreground">{plan.name}</CardTitle>
                                        <CardDescription className="text-xs">
                                            {plan.duration_days} calendar days access
                                        </CardDescription>
                                    </CardHeader>

                                    <CardContent className="pb-4">
                                        <div className="text-2xl sm:text-3xl font-semibold tracking-tight tabular-nums text-foreground">
                                            <span className="text-base sm:text-lg font-normal mr-0.5 text-muted-foreground">₹</span>
                                            {Number(plan.price).toLocaleString('en-IN')}
                                            <span className="text-xs font-normal text-muted-foreground ml-1.5">/ term</span>
                                        </div>
                                    </CardContent>

                                    <div className="flex items-center justify-end gap-2 border-t border-border/60 bg-muted/25 px-5 py-2.5">
                                        <Button variant="outline" size="sm" className="h-7.5 rounded-full px-3 text-xs" asChild>
                                            <Link href={membershipPlans.edit(plan.id)}>
                                                <Edit data-icon="inline-start" className="size-3.5" />
                                                Edit
                                            </Link>
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7.5 rounded-full px-3 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                                            onClick={() => toggleStatus(plan)}
                                        >
                                            <PowerOff data-icon="inline-start" className="size-3.5" />
                                            Deactivate
                                        </Button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                {/* Inactive plans section */}
                {inactivePlans.length > 0 && (
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold tracking-tight">Inactive Plans</h2>
                                <p className="text-xs text-muted-foreground">
                                    Historical plans kept for member records; not available for new check-outs.
                                </p>
                            </div>
                            <Badge variant="outline">{inactivePlans.length} archived</Badge>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {inactivePlans.map((plan) => (
                                <Card key={plan.id} className="flex flex-col justify-between opacity-80 transition hover:opacity-100">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center justify-between">
                                            <Badge variant="secondary" className="text-muted-foreground">
                                                Inactive
                                            </Badge>
                                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                                <Calendar className="size-3.5" />
                                                {plan.duration_days} days
                                            </span>
                                        </div>
                                        <CardTitle className="mt-2 text-lg font-semibold text-muted-foreground">
                                            {plan.name}
                                        </CardTitle>
                                    </CardHeader>

                                    <CardContent className="pb-4">
                                        <div className="text-xl font-bold tracking-tight text-muted-foreground">
                                            ₹{Number(plan.price).toLocaleString('en-IN')}
                                        </div>
                                    </CardContent>

                                    <div className="flex items-center justify-end gap-2 border-t bg-muted/20 px-6 py-3">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => toggleStatus(plan)}
                                        >
                                            Activate
                                        </Button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}
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
            title: 'Membership Plans',
            href: membershipPlans.index(),
        },
    ],
};