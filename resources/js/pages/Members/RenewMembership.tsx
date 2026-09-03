import { Head, Link, useForm } from '@inertiajs/react';
import * as React from 'react';

type Member = {
    id: string;
    name: string;
};

type Membership = {
    id: string;
    start_date: string;
    end_date: string;
    price: string;
    lifecycle_status: string;
    membership_plan: {
        name: string;
    };
};

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

type RenewMembershipProps = {
    member: Member;
    membership: Membership;
    plans: MembershipPlan[];
    payment_methods: PaymentMethod[];
    suggested_start_date: string;
};

export default function RenewMembership({
    member,
    membership,
    plans,
    payment_methods,
    suggested_start_date,
}: RenewMembershipProps) {
    const now = new Date();

    const defaultPaidAt = [
        now.toISOString().split('T')[0],
        now.toTimeString().slice(0, 5),
    ].join('T');

    const [payNow, setPayNow] = React.useState(false);

    const { data, setData, post, processing, errors } = useForm({
        membership_plan_id: '',
        start_date: suggested_start_date,
        payment: false,
        payment_amount: '',
        payment_method: '',
        paid_at: defaultPaidAt,
    });

    const selectedPlan = plans.find(
        (plan) => plan.id === data.membership_plan_id,
    );

    const selectedPlanPrice = selectedPlan
        ? Number(selectedPlan.price)
        : 0;

    const paymentAmount = Number(data.payment_amount || 0);

    const paymentExceedsPrice =
        payNow &&
        paymentAmount > selectedPlanPrice;

    const paymentIsInvalid =
        payNow &&
        (
            paymentAmount <= 0 ||
            paymentExceedsPrice ||
            !data.payment_method ||
            !data.paid_at
        );

    const remainingBalance = Math.max(
        0,
        selectedPlanPrice - paymentAmount,
    );

    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!data.membership_plan_id || !data.start_date) {
            return;
        }

        if (paymentIsInvalid) {
            return;
        }

        post(
            `/members/${member.id}/memberships/${membership.id}/renew`,
        );
    };

    const handlePayNowChange = (value: boolean) => {
        setPayNow(value);

        setData('payment', value);

        if (!value) {
            setData('payment_amount', '');
            setData('payment_method', '');
        }
    };

    return (
        <>
            <Head title={`Renew Membership - ${member.name}`} />

            <div className="mx-auto max-w-3xl p-6">
                <div className="mb-6">
                    <Link
                        href={`/members/${member.id}`}
                        className="text-sm text-muted-foreground hover:underline"
                    >
                        ← Back to Member
                    </Link>

                    <div className="mt-4">
                        <h1 className="text-2xl font-semibold">
                            Renew Membership
                        </h1>

                        <p className="mt-1 text-sm text-muted-foreground">
                            Renew membership for {member.name}.
                        </p>
                    </div>
                </div>

                {/* Current membership */}
                <section className="rounded-xl border p-5">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h2 className="font-semibold">
                                Current Membership
                            </h2>

                            <p className="mt-1 text-sm text-muted-foreground">
                                {membership.membership_plan.name}
                            </p>
                        </div>

                        <span className="rounded-full border px-2.5 py-1 text-xs font-medium capitalize">
                            {membership.lifecycle_status}
                        </span>
                    </div>

                    <div className="mt-4 grid gap-4 sm:grid-cols-3">
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Start
                            </p>

                            <p className="mt-1 font-medium">
                                {membership.start_date}
                            </p>
                        </div>

                        <div>
                            <p className="text-sm text-muted-foreground">
                                End
                            </p>

                            <p className="mt-1 font-medium">
                                {membership.end_date}
                            </p>
                        </div>

                        <div>
                            <p className="text-sm text-muted-foreground">
                                Price
                            </p>

                            <p className="mt-1 font-medium">
                                ₹{membership.price}
                            </p>
                        </div>
                    </div>
                </section>

                {/* Renewal form */}
                <section className="mt-6 rounded-xl border p-5">
                    <h2 className="font-semibold">
                        New Membership
                    </h2>

                    <form
                        onSubmit={submit}
                        className="mt-5 space-y-5"
                    >
                        {/* Plan */}
                        <div>
                            <label
                                htmlFor="membership_plan_id"
                                className="mb-2 block text-sm font-medium"
                            >
                                Membership Plan
                            </label>

                            <select
                                id="membership_plan_id"
                                value={data.membership_plan_id}
                                onChange={(event) =>
                                    setData(
                                        'membership_plan_id',
                                        event.target.value,
                                    )
                                }
                                className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                            >
                                <option value="">
                                    Select a plan
                                </option>

                                {plans.map((plan) => (
                                    <option
                                        key={plan.id}
                                        value={plan.id}
                                    >
                                        {plan.name} — ₹{plan.price} /{' '}
                                        {plan.duration_days} days
                                    </option>
                                ))}
                            </select>

                            {errors.membership_plan_id && (
                                <p className="mt-1 text-sm text-destructive">
                                    {errors.membership_plan_id}
                                </p>
                            )}
                        </div>

                        {/* Start date */}
                        <div>
                            <label
                                htmlFor="start_date"
                                className="mb-2 block text-sm font-medium"
                            >
                                Start Date
                            </label>

                            <input
                                id="start_date"
                                type="date"
                                value={data.start_date}
                                onChange={(event) =>
                                    setData(
                                        'start_date',
                                        event.target.value,
                                    )
                                }
                                className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                            />

                            <p className="mt-1 text-xs text-muted-foreground">
                                Suggested start date based on the current
                                membership.
                            </p>

                            {errors.start_date && (
                                <p className="mt-1 text-sm text-destructive">
                                    {errors.start_date}
                                </p>
                            )}
                        </div>

                        {/* Payment */}
                        <div>
                            <p className="mb-2 text-sm font-medium">
                                Payment
                            </p>

                            <div className="space-y-2">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="radio"
                                        name="payment"
                                        checked={!payNow}
                                        onChange={() =>
                                            handlePayNowChange(false)
                                        }
                                    />

                                    <span className="text-sm">
                                        Pay later
                                    </span>
                                </label>

                                <label className="flex items-center gap-2">
                                    <input
                                        type="radio"
                                        name="payment"
                                        checked={payNow}
                                        onChange={() =>
                                            handlePayNowChange(true)
                                        }
                                    />

                                    <span className="text-sm">
                                        Pay now
                                    </span>
                                </label>
                            </div>

                            {errors.payment && (
                                <p className="mt-1 text-sm text-destructive">
                                    {errors.payment}
                                </p>
                            )}
                        </div>

                        {/* Payment details */}
                        {payNow && (
                            <div className="space-y-5 rounded-lg border bg-muted/20 p-4">
                                <div>
                                    <label
                                        htmlFor="payment_amount"
                                        className="mb-2 block text-sm font-medium"
                                    >
                                        Payment Amount
                                    </label>

                                    <input
                                        id="payment_amount"
                                        type="number"
                                        min="0.01"
                                        step="0.01"
                                        max={
                                            selectedPlan
                                                ? selectedPlan.price
                                                : undefined
                                        }
                                        value={data.payment_amount}
                                        onChange={(event) =>
                                            setData(
                                                'payment_amount',
                                                event.target.value,
                                            )
                                        }
                                        placeholder="Enter amount paid"
                                        className={`w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring ${paymentExceedsPrice
                                                ? 'border-destructive'
                                                : ''
                                            }`}
                                    />

                                    {paymentExceedsPrice ? (
                                        <p className="mt-1 text-sm text-destructive">
                                            Payment cannot exceed the
                                            membership price of ₹
                                            {selectedPlanPrice.toFixed(2)}.
                                        </p>
                                    ) : (
                                        errors.payment_amount && (
                                            <p className="mt-1 text-sm text-destructive">
                                                {errors.payment_amount}
                                            </p>
                                        )
                                    )}
                                </div>

                                <div>
                                    <label
                                        htmlFor="payment_method"
                                        className="mb-2 block text-sm font-medium"
                                    >
                                        Payment Method
                                    </label>

                                    <select
                                        id="payment_method"
                                        value={data.payment_method}
                                        onChange={(event) =>
                                            setData(
                                                'payment_method',
                                                event.target.value,
                                            )
                                        }
                                        className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                                    >
                                        <option value="">
                                            Select payment method
                                        </option>

                                        {payment_methods.map((method) => (
                                            <option
                                                key={method.value}
                                                value={method.value}
                                            >
                                                {method.label}
                                            </option>
                                        ))}
                                    </select>

                                    {errors.payment_method && (
                                        <p className="mt-1 text-sm text-destructive">
                                            {errors.payment_method}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label
                                        htmlFor="paid_at"
                                        className="mb-2 block text-sm font-medium"
                                    >
                                        Paid At
                                    </label>

                                    <input
                                        id="paid_at"
                                        type="datetime-local"
                                        value={data.paid_at}
                                        onChange={(event) =>
                                            setData(
                                                'paid_at',
                                                event.target.value,
                                            )
                                        }
                                        className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                                    />

                                    {errors.paid_at && (
                                        <p className="mt-1 text-sm text-destructive">
                                            {errors.paid_at}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Renewal summary */}
                        {selectedPlan && (
                            <div className="rounded-lg border bg-muted/30 p-4">
                                <p className="text-sm font-medium">
                                    Renewal Summary
                                </p>

                                <div className="mt-3 space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">
                                            Plan
                                        </span>

                                        <span>
                                            {selectedPlan.name}
                                        </span>
                                    </div>

                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">
                                            Price
                                        </span>

                                        <span>
                                            ₹{selectedPlan.price}
                                        </span>
                                    </div>

                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">
                                            Duration
                                        </span>

                                        <span>
                                            {selectedPlan.duration_days} days
                                        </span>
                                    </div>

                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">
                                            Starts
                                        </span>

                                        <span>
                                            {data.start_date}
                                        </span>
                                    </div>

                                    {payNow && (
                                        <>
                                            <div className="border-t pt-2" />

                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">
                                                    Paid now
                                                </span>

                                                <span>
                                                    ₹
                                                    {paymentAmount.toFixed(
                                                        2,
                                                    )}
                                                </span>
                                            </div>

                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">
                                                    Remaining balance
                                                </span>

                                                <span>
                                                    ₹
                                                    {remainingBalance.toFixed(
                                                        2,
                                                    )}
                                                </span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex justify-end gap-3">
                            <Link
                                href={`/members/${member.id}`}
                                className="rounded-md border px-4 py-2 text-sm font-medium"
                            >
                                Cancel
                            </Link>

                            <button
                                type="submit"
                                disabled={
                                    processing ||
                                    !data.membership_plan_id ||
                                    !data.start_date ||
                                    paymentIsInvalid
                                }
                                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {processing
                                    ? 'Renewing...'
                                    : 'Renew Membership'}
                            </button>
                        </div>
                    </form>
                </section>
            </div>
        </>
    );
}