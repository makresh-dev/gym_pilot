import { Head, Link, useForm } from '@inertiajs/react';

type Member = {
    id: string;
    name: string;
};

type Membership = {
    id: string;
    price: string;
    balance_due: number;
    plan: string;
};

type Props = {
    member: Member;
    membership: Membership;
};

type PaymentForm = {
    amount: string;
    payment_method: string;
    paid_at: string;
};

export default function CreatePayment({
    member,
    membership,
}: Props) {
    const { data, setData, post, processing, errors } =
        useForm<PaymentForm>({
            amount: '',
            payment_method: '',
            paid_at: new Date().toISOString().slice(0, 16),
        });

    const submit = (
        event: React.FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        post(
            `/members/${member.id}/memberships/${membership.id}/payments`,
        );
    };

    return (
        <>
            <Head title={`Record Payment - ${member.name}`} />

            <div className="mx-auto max-w-2xl p-6">
                <Link
                    href={`/members/${member.id}`}
                    className="text-sm text-muted-foreground hover:underline"
                >
                    ← Back to Member
                </Link>

                <div className="mt-6">
                    <h1 className="text-2xl font-semibold">
                        Record Payment
                    </h1>

                    <p className="mt-1 text-sm text-muted-foreground">
                        {membership.plan} membership for {member.name}.
                    </p>
                </div>

                <div className="mt-6 grid gap-4 rounded-lg border p-5 sm:grid-cols-2">
                    <div>
                        <p className="text-sm text-muted-foreground">
                            Membership price
                        </p>

                        <p className="mt-1 text-lg font-semibold">
                            ₹{membership.price}
                        </p>
                    </div>

                    <div>
                        <p className="text-sm text-muted-foreground">
                            Balance due
                        </p>

                        <p className="mt-1 text-lg font-semibold">
                            ₹{membership.balance_due}
                        </p>
                    </div>
                </div>

                <form
                    onSubmit={submit}
                    className="mt-6 space-y-5 rounded-lg border p-6"
                >
                    <div>
                        <label
                            htmlFor="amount"
                            className="mb-2 block text-sm font-medium"
                        >
                            Amount
                        </label>

                        <input
                            id="amount"
                            type="number"
                            min="0.01"
                            step="0.01"
                            max={membership.balance_due}
                            value={data.amount}
                            onChange={(event) =>
                                setData(
                                    'amount',
                                    event.target.value,
                                )
                            }
                            className="w-full rounded-md border px-3 py-2"
                        />

                        {errors.amount && (
                            <p className="mt-1 text-sm text-destructive">
                                {errors.amount}
                            </p>
                        )}
                    </div>

                    <div>
                        <label
                            htmlFor="payment_method"
                            className="mb-2 block text-sm font-medium"
                        >
                            Payment method
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
                            className="w-full rounded-md border px-3 py-2"
                        >
                            <option value="">
                                Select payment method
                            </option>

                            <option value="cash">Cash</option>

                            <option value="upi">UPI</option>

                            <option value="card">Card</option>

                            <option value="bank_transfer">
                                Bank transfer
                            </option>

                            <option value="other">Other</option>
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
                            Paid at
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
                            className="w-full rounded-md border px-3 py-2"
                        />

                        {errors.paid_at && (
                            <p className="mt-1 text-sm text-destructive">
                                {errors.paid_at}
                            </p>
                        )}
                    </div>

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
                                !data.amount ||
                                !data.payment_method
                            }
                            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {processing
                                ? 'Recording...'
                                : 'Record Payment'}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}