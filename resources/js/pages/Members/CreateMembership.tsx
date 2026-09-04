import { Head, Link, useForm } from '@inertiajs/react';
import { dashboard } from '@/routes';
import members from '@/routes/members';

type MembershipPlan = {
    id: string;
    name: string;
    price: string;
    duration_days: number;
};

type PaymentMethod = {
    value: string;
    label: string;
};

type Member = {
    id: string;
    name: string;
};

type CreateMembershipProps = {
    member: Member;
    plans: MembershipPlan[];
    payment_methods: PaymentMethod[];
};

export default function CreateMembership({
    member,
    plans,
    payment_methods,
}: CreateMembershipProps) {
    const today = new Date().toISOString().split('T')[0];

    const form = useForm({
        membership_plan_id: plans[0]?.id ?? '',
        start_date: today,
        payment: false,
        payment_amount: '',
        payment_method: '',
        paid_at: new Date().toISOString().slice(0, 16),
    });

    const selectedPlan = plans.find(
        (plan) => plan.id === form.data.membership_plan_id,
    );

    const startDate = form.data.start_date
        ? new Date(`${form.data.start_date}T00:00:00`)
        : null;

    const endDate =
        selectedPlan && startDate
            ? new Date(
                startDate.getTime() +
                (selectedPlan.duration_days - 1) *
                24 *
                60 *
                60 *
                1000,
            )
            : null;

    const planPrice = selectedPlan
        ? Number(selectedPlan.price)
        : 0;

    const paymentAmount = Number(form.data.payment_amount) || 0;

    const paymentExceedsPrice =
        form.data.payment &&
        paymentAmount > planPrice;

    const paymentIsInvalid =
        form.data.payment &&
        (paymentAmount <= 0 || paymentExceedsPrice);

    const remainingBalance = Math.max(
        planPrice - paymentAmount,
        0,
    );

    const formatDate = (date: Date | null) => {
        if (!date) {
            return '—';
        }

        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const submit = (event: React.FormEvent) => {
        event.preventDefault();

        if (paymentIsInvalid) {
            return;
        }

        form.post(
            members.memberships.store(member.id).url,
        );
    };

    return (
        <>
            <Head title={`Add Membership — ${member.name}`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Link
                            href={members.show(member.id)}
                            className="hover:underline"
                        >
                            {member.name}
                        </Link>

                        <span>/</span>

                        <span>New Membership</span>
                    </div>

                    <h1 className="mt-2 text-2xl font-semibold tracking-tight">
                        Add Membership
                    </h1>

                    <p className="mt-1 text-sm text-muted-foreground">
                        Create a new membership for {member.name}.
                    </p>
                </div>

                {plans.length === 0 ? (
                    <section className="rounded-xl border">
                        <div className="px-6 py-10 text-center">
                            <h2 className="font-semibold">
                                No active membership plans
                            </h2>

                            <p className="mt-2 text-sm text-muted-foreground">
                                Create and activate a membership plan before
                                adding a membership.
                            </p>
                        </div>
                    </section>
                ) : (
                    <form
                        onSubmit={submit}
                        className="max-w-2xl space-y-6"
                    >
                        {/* Membership details */}
                        <section className="rounded-xl border">
                            <div className="border-b px-6 py-4">
                                <h2 className="font-semibold">
                                    Membership Details
                                </h2>

                                <p className="mt-1 text-sm text-muted-foreground">
                                    Select the plan and start date.
                                </p>
                            </div>

                            <div className="space-y-5 px-6 py-6">
                                {/* Plan */}
                                <div className="space-y-2">
                                    <label
                                        htmlFor="membership_plan_id"
                                        className="text-sm font-medium"
                                    >
                                        Membership Plan
                                    </label>

                                    <select
                                        id="membership_plan_id"
                                        value={form.data.membership_plan_id}
                                        onChange={(event) =>
                                            form.setData(
                                                'membership_plan_id',
                                                event.target.value,
                                            )
                                        }
                                        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                                    >
                                        <option value="">
                                            Select a plan
                                        </option>

                                        {plans.map((plan) => (
                                            <option
                                                key={plan.id}
                                                value={plan.id}
                                            >
                                                {plan.name} — ₹{plan.price} (
                                                {plan.duration_days} days)
                                            </option>
                                        ))}
                                    </select>

                                    {form.errors.membership_plan_id && (
                                        <p className="text-sm text-destructive">
                                            {
                                                form.errors
                                                    .membership_plan_id
                                            }
                                        </p>
                                    )}
                                </div>

                                {/* Start date */}
                                <div className="space-y-2">
                                    <label
                                        htmlFor="start_date"
                                        className="text-sm font-medium"
                                    >
                                        Start Date
                                    </label>

                                    <input
                                        id="start_date"
                                        type="date"
                                        value={form.data.start_date}
                                        onChange={(event) =>
                                            form.setData(
                                                'start_date',
                                                event.target.value,
                                            )
                                        }
                                        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                                    />

                                    {form.errors.start_date && (
                                        <p className="text-sm text-destructive">
                                            {form.errors.start_date}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </section>

                        {/* Payment */}
                        {selectedPlan && (
                            <section className="rounded-xl border">
                                <div className="border-b px-6 py-4">
                                    <h2 className="font-semibold">
                                        Payment
                                    </h2>

                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Record payment now or collect it
                                        later.
                                    </p>
                                </div>

                                <div className="space-y-5 px-6 py-6">
                                    {/* Payment choice */}
                                    <div className="space-y-3">
                                        <p className="text-sm font-medium">
                                            Payment Status
                                        </p>

                                        <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-4">
                                            <input
                                                type="radio"
                                                name="payment"
                                                checked={
                                                    !form.data.payment
                                                }
                                                onChange={() => {
                                                    form.setData(
                                                        'payment',
                                                        false,
                                                    );

                                                    form.setData(
                                                        'payment_amount',
                                                        '',
                                                    );

                                                    form.setData(
                                                        'payment_method',
                                                        '',
                                                    );
                                                }}
                                                className="mt-1"
                                            />

                                            <div>
                                                <p className="text-sm font-medium">
                                                    Pay Later
                                                </p>

                                                <p className="mt-1 text-sm text-muted-foreground">
                                                    Create the membership
                                                    without recording a
                                                    payment.
                                                </p>
                                            </div>
                                        </label>

                                        <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-4">
                                            <input
                                                type="radio"
                                                name="payment"
                                                checked={form.data.payment}
                                                onChange={() =>
                                                    form.setData(
                                                        'payment',
                                                        true,
                                                    )
                                                }
                                                className="mt-1"
                                            />

                                            <div>
                                                <p className="text-sm font-medium">
                                                    Pay Now
                                                </p>

                                                <p className="mt-1 text-sm text-muted-foreground">
                                                    Record a payment with the
                                                    membership.
                                                </p>
                                            </div>
                                        </label>
                                    </div>

                                    {/* Payment fields */}
                                    {form.data.payment && (
                                        <div className="space-y-5 rounded-lg bg-muted/40 p-4">
                                            {/* Amount */}
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <label
                                                        htmlFor="payment_amount"
                                                        className="text-sm font-medium"
                                                    >
                                                        Amount
                                                    </label>

                                                    <span className="text-xs text-muted-foreground">
                                                        Maximum ₹
                                                        {selectedPlan.price}
                                                    </span>
                                                </div>

                                                <input
                                                    id="payment_amount"
                                                    type="number"
                                                    min="0.01"
                                                    max={planPrice}
                                                    step="0.01"
                                                    value={
                                                        form.data
                                                            .payment_amount
                                                    }
                                                    onChange={(event) =>
                                                        form.setData(
                                                            'payment_amount',
                                                            event.target.value,
                                                        )
                                                    }
                                                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                                                    placeholder="Enter amount"
                                                />

                                                {form.errors
                                                    .payment_amount && (
                                                        <p className="text-sm text-destructive">
                                                            {
                                                                form.errors
                                                                    .payment_amount
                                                            }
                                                        </p>
                                                    )}

                                                {paymentExceedsPrice && (
                                                    <p className="text-sm text-destructive">
                                                        Payment cannot exceed
                                                        the membership price of
                                                        ₹{selectedPlan.price}.
                                                    </p>
                                                )}
                                            </div>

                                            {/* Payment method */}
                                            <div className="space-y-2">
                                                <label
                                                    htmlFor="payment_method"
                                                    className="text-sm font-medium"
                                                >
                                                    Payment Method
                                                </label>

                                                <select
                                                    id="payment_method"
                                                    value={
                                                        form.data
                                                            .payment_method
                                                    }
                                                    onChange={(event) =>
                                                        form.setData(
                                                            'payment_method',
                                                            event.target.value,
                                                        )
                                                    }
                                                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                                                >
                                                    <option value="">
                                                        Select payment method
                                                    </option>

                                                    {payment_methods.map(
                                                        (method) => (
                                                            <option
                                                                key={
                                                                    method.value
                                                                }
                                                                value={
                                                                    method.value
                                                                }
                                                            >
                                                                {method.label}
                                                            </option>
                                                        ),
                                                    )}
                                                </select>

                                                {form.errors
                                                    .payment_method && (
                                                        <p className="text-sm text-destructive">
                                                            {
                                                                form.errors
                                                                    .payment_method
                                                            }
                                                        </p>
                                                    )}
                                            </div>

                                            {/* Paid at */}
                                            <div className="space-y-2">
                                                <label
                                                    htmlFor="paid_at"
                                                    className="text-sm font-medium"
                                                >
                                                    Payment Date & Time
                                                </label>

                                                <input
                                                    id="paid_at"
                                                    type="datetime-local"
                                                    value={form.data.paid_at}
                                                    onChange={(event) =>
                                                        form.setData(
                                                            'paid_at',
                                                            event.target.value,
                                                        )
                                                    }
                                                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                                                />

                                                {form.errors.paid_at && (
                                                    <p className="text-sm text-destructive">
                                                        {
                                                            form.errors
                                                                .paid_at
                                                        }
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </section>
                        )}

                        {/* Summary */}
                        {selectedPlan && (
                            <section className="rounded-xl border">
                                <div className="border-b px-6 py-4">
                                    <h2 className="font-semibold">
                                        Membership Summary
                                    </h2>
                                </div>

                                <div className="grid gap-4 px-6 py-6 sm:grid-cols-3">
                                    <div>
                                        <p className="text-sm text-muted-foreground">
                                            Plan
                                        </p>

                                        <p className="mt-1 font-medium">
                                            {selectedPlan.name}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-sm text-muted-foreground">
                                            Start Date
                                        </p>

                                        <p className="mt-1 font-medium">
                                            {formatDate(startDate)}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-sm text-muted-foreground">
                                            End Date
                                        </p>

                                        <p className="mt-1 font-medium">
                                            {formatDate(endDate)}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-sm text-muted-foreground">
                                            Duration
                                        </p>

                                        <p className="mt-1 font-medium">
                                            {selectedPlan.duration_days} days
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-sm text-muted-foreground">
                                            Membership Price
                                        </p>

                                        <p className="mt-1 font-medium">
                                            ₹{selectedPlan.price}
                                        </p>
                                    </div>

                                    {form.data.payment && (
                                        <>
                                            <div>
                                                <p className="text-sm text-muted-foreground">
                                                    Paid Now
                                                </p>

                                                <p className="mt-1 font-medium">
                                                    ₹
                                                    {paymentAmount.toFixed(
                                                        2,
                                                    )}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-sm text-muted-foreground">
                                                    Remaining Balance
                                                </p>

                                                <p className="mt-1 font-medium">
                                                    ₹
                                                    {remainingBalance.toFixed(
                                                        2,
                                                    )}
                                                </p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </section>
                        )}

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-3">
                            <Link
                                href={members.show(member.id)}
                                className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
                            >
                                Cancel
                            </Link>

                            <button
                                type="submit"
                                disabled={
                                    form.processing ||
                                    !form.data.membership_plan_id ||
                                    !form.data.start_date ||
                                    paymentIsInvalid ||
                                    (form.data.payment &&
                                        !form.data.payment_method)
                                }
                                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {form.processing
                                    ? 'Creating...'
                                    : 'Create Membership'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </>
    );
}

CreateMembership.layout = {
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