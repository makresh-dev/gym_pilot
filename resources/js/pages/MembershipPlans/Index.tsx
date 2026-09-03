import { Head, Link, router } from '@inertiajs/react';
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
        const action = plan.is_active ? 'Deactivate' : 'Activate';

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

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Membership Plans
                        </h1>

                        <p className="mt-1 text-sm text-muted-foreground">
                            Manage the plans available for new memberships
                            and renewals.
                        </p>
                    </div>

                    <Link
                        href={membershipPlans.create()}
                        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                    >
                        Create Plan
                    </Link>
                </div>

                {/* Active plans */}
                <section className="rounded-xl border">
                    <div className="border-b px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="font-semibold">
                                    Active Plans
                                </h2>

                                <p className="mt-1 text-sm text-muted-foreground">
                                    Available for new memberships and
                                    renewals.
                                </p>
                            </div>

                            <span className="text-sm text-muted-foreground">
                                {activePlans.length}
                            </span>
                        </div>
                    </div>

                    {activePlans.length === 0 ? (
                        <div className="px-6 py-10 text-center text-sm text-muted-foreground">
                            No active membership plans.
                        </div>
                    ) : (
                        <div className="divide-y">
                            {activePlans.map((plan) => (
                                <div
                                    key={plan.id}
                                    className="flex items-center justify-between gap-6 px-6 py-4"
                                >
                                    <div className="min-w-0">
                                        <p className="font-medium">
                                            {plan.name}
                                        </p>

                                        <p className="mt-1 text-sm text-muted-foreground">
                                            {plan.duration_days} days
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <p className="font-medium">
                                                ₹{plan.price}
                                            </p>

                                            <p className="text-xs text-muted-foreground">
                                                Plan price
                                            </p>
                                        </div>

                                        <Link
                                            href={membershipPlans.edit(
                                                plan.id,
                                            )}
                                            className="text-sm font-medium hover:underline"
                                        >
                                            Edit
                                        </Link>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                toggleStatus(plan)
                                            }
                                            className="text-sm font-medium text-destructive hover:underline"
                                        >
                                            Deactivate
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Inactive plans */}
                {inactivePlans.length > 0 && (
                    <section className="rounded-xl border">
                        <div className="border-b px-6 py-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="font-semibold">
                                        Inactive Plans
                                    </h2>

                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Historical plans kept for existing
                                        membership records.
                                    </p>
                                </div>

                                <span className="text-sm text-muted-foreground">
                                    {inactivePlans.length}
                                </span>
                            </div>
                        </div>

                        <div className="divide-y">
                            {inactivePlans.map((plan) => (
                                <div
                                    key={plan.id}
                                    className="flex items-center justify-between gap-6 px-6 py-4"
                                >
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium">
                                                {plan.name}
                                            </p>

                                            <span className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
                                                Inactive
                                            </span>
                                        </div>

                                        <p className="mt-1 text-sm text-muted-foreground">
                                            {plan.duration_days} days
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <p className="font-medium">
                                                ₹{plan.price}
                                            </p>

                                            <p className="text-xs text-muted-foreground">
                                                Historical plan
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                toggleStatus(plan)
                                            }
                                            className="text-sm font-medium hover:underline"
                                        >
                                            Activate
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
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