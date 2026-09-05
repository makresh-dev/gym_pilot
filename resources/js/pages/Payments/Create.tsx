import { Head, Link, useForm } from '@inertiajs/react';
import members from '@/routes/members';

type PaymentMethod = {
    value: string;
    label: string;
};

type Member = {
    id: string;
    name: string;
};

type Membership = {
    id: string;
    plan: string;
    start_date: string;
    end_date: string;
    price: number;
    amount_paid: number;
    balance_due: number;
    lifecycle_status: string;
};

type Props = {
    member: Member;
    membership: Membership;
    payment_methods: PaymentMethod[];
};

type PaymentForm = {
    amount: string;
    payment_method: string;
    paid_at: string;
};

function getTodayDateKey(): string {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kolkata',
    }).format(new Date());
}

function formatCurrency(amount: number): string {
    return `₹${Number.isFinite(amount) ? amount.toFixed(2) : '0.00'}`;
}

function formatDate(date: string): string {
    const dateOnly = date.slice(0, 10);

    return new Date(`${dateOnly}T00:00:00`).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

export default function Create({
    member,
    membership,
    payment_methods,
}: Props) {
    const initialPaymentMethod = payment_methods[0]?.value ?? '';

    const { data, setData, post, processing, errors } =
        useForm<PaymentForm>({
            amount: '',
            payment_method: initialPaymentMethod,
            paid_at: getTodayDateKey(),
        });

    const enteredAmount = Number(data.amount);
    const amountIsValid =
        Number.isFinite(enteredAmount) &&
        enteredAmount > 0 &&
        enteredAmount <= membership.balance_due;

    const remainingAfterPayment = amountIsValid
        ? Math.max(0, membership.balance_due - enteredAmount)
        : membership.balance_due;

    const paymentComplete = amountIsValid && remainingAfterPayment === 0;

    function setAmount(amount: number): void {
        setData('amount', amount.toFixed(2));
    }

    function submit(event: React.FormEvent<HTMLFormElement>): void {
        event.preventDefault();

        post(`/members/${member.id}/memberships/${membership.id}/payments`, {
            preserveScroll: true,
        });
    }

    return (
        <>
            <Head title={`Record Payment · ${member.name}`} />

            <div className="min-h-full bg-muted/20">
                <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                    <div className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <Link
                                href={members.show(member.id)}
                                className="inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-foreground"
                            >
                                <span aria-hidden="true" className="mr-2 text-base">
                                    ←
                                </span>
                                Back to {member.name}
                            </Link>

                            <div className="mt-5 flex flex-wrap items-center gap-3">
                                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                                    Record payment
                                </h1>
                                <span className="rounded-full border bg-background px-3 py-1 text-xs font-medium">
                                    {membership.plan}
                                </span>
                            </div>

                            <p className="mt-2 text-sm text-muted-foreground">
                                Record a payment against {member.name}&apos;s membership.
                            </p>
                        </div>

                        <div className="hidden shrink-0 rounded-lg border bg-background px-4 py-3 sm:block">
                            <p className="text-xs text-muted-foreground">Membership period</p>
                            <p className="mt-1 text-sm font-medium">
                                {formatDate(membership.start_date)}{' '}
                                <span className="mx-1 text-muted-foreground">→</span>{' '}
                                {formatDate(membership.end_date)}
                            </p>
                        </div>
                    </div>

                    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_500px]">
                        <section className="rounded-2xl border bg-background shadow-sm">
                            <div className="border-b px-6 py-5 sm:px-8 sm:py-6">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                                            Membership
                                        </p>
                                        <h2 className="mt-1 text-xl font-semibold sm:text-2xl">
                                            {member.name}
                                        </h2>
                                    </div>

                                    <span className="rounded-full border bg-muted/30 px-3 py-1 text-xs font-medium capitalize">
                                        {membership.lifecycle_status}
                                    </span>
                                </div>
                            </div>

                            <div className="grid divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                                <div className="px-6 py-6 sm:px-8">
                                    <p className="text-sm text-muted-foreground">Membership price</p>
                                    <p className="mt-2 text-2xl font-semibold tracking-tight">
                                        {formatCurrency(membership.price)}
                                    </p>
                                </div>

                                <div className="px-6 py-6 sm:px-8">
                                    <p className="text-sm text-muted-foreground">Paid so far</p>
                                    <p className="mt-2 text-2xl font-semibold tracking-tight">
                                        {formatCurrency(membership.amount_paid)}
                                    </p>
                                </div>

                                <div className="px-6 py-6 sm:px-8">
                                    <p className="text-sm text-muted-foreground">Outstanding</p>
                                    <p className="mt-2 text-2xl font-semibold tracking-tight text-destructive">
                                        {formatCurrency(membership.balance_due)}
                                    </p>
                                </div>
                            </div>

                            <div className="border-t px-6 py-5 sm:px-8">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                                            Payment impact
                                        </p>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            Your remaining balance updates as you enter an amount.
                                        </p>
                                    </div>

                                    <div className="text-right">
                                        <p className="text-xs text-muted-foreground">Balance after payment</p>
                                        <p className={`mt-1 text-3xl font-semibold tracking-tight ${paymentComplete ? '' : 'text-destructive'}`}>
                                            {formatCurrency(remainingAfterPayment)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t bg-muted/20 px-6 py-5 sm:px-8">
                                <div className="grid gap-4 sm:grid-cols-3">
                                    <div>
                                        <p className="text-xs text-muted-foreground">Member</p>
                                        <p className="mt-1 font-medium">{member.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Plan</p>
                                        <p className="mt-1 font-medium">{membership.plan}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Period</p>
                                        <p className="mt-1 font-medium">
                                            {formatDate(membership.start_date)} → {formatDate(membership.end_date)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="rounded-2xl border bg-background shadow-sm xl:sticky xl:top-6">
                            <div className="border-b px-6 py-5 sm:px-7 sm:py-6">
                                <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                                    Payment details
                                </p>
                                <h2 className="mt-1 text-xl font-semibold sm:text-2xl">
                                    Enter payment
                                </h2>
                            </div>

                            <form onSubmit={submit} className="px-6 py-6 sm:px-7 sm:py-7">
                                <div>
                                    <div className="flex items-center justify-between gap-3">
                                        <label htmlFor="amount" className="text-sm font-medium">
                                            Amount
                                        </label>
                                        <span className="text-xs text-muted-foreground">
                                            Max {formatCurrency(membership.balance_due)}
                                        </span>
                                    </div>

                                    <div className="relative mt-2">
                                        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-muted-foreground">
                                            ₹
                                        </span>
                                        <input
                                            id="amount"
                                            type="number"
                                            min="0.01"
                                            max={membership.balance_due}
                                            step="0.01"
                                            inputMode="decimal"
                                            value={data.amount}
                                            onChange={(event) => setData('amount', event.target.value)}
                                            className="h-14 w-full rounded-xl border bg-background pl-10 pr-4 text-xl font-semibold outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/10"
                                            placeholder="0.00"
                                            required
                                            autoFocus
                                        />
                                    </div>

                                    <div className="mt-3 grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setAmount(membership.balance_due)}
                                            className="h-10 rounded-lg border px-3 text-sm font-medium transition hover:bg-muted"
                                        >
                                            Pay full balance
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setAmount(membership.balance_due / 2)}
                                            className="h-10 rounded-lg border px-3 text-sm font-medium transition hover:bg-muted"
                                            disabled={membership.balance_due <= 1}
                                        >
                                            Pay half
                                        </button>
                                    </div>

                                    {data.amount && Number.isFinite(enteredAmount) && (
                                        <p className={`mt-2 text-xs ${enteredAmount > membership.balance_due ? 'text-destructive' : 'text-muted-foreground'}`}>
                                            {enteredAmount > membership.balance_due
                                                ? 'Payment cannot exceed the outstanding balance.'
                                                : `Remaining after payment: ${formatCurrency(remainingAfterPayment)}`}
                                        </p>
                                    )}

                                    {errors.amount && (
                                        <p className="mt-2 text-sm text-destructive">{errors.amount}</p>
                                    )}
                                </div>

                                <div className="mt-7 grid gap-5 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                                    <div>
                                        <label htmlFor="payment_method" className="text-sm font-medium">
                                            Payment method
                                        </label>
                                        <select
                                            id="payment_method"
                                            value={data.payment_method}
                                            onChange={(event) => setData('payment_method', event.target.value)}
                                            className="mt-2 h-12 w-full rounded-xl border bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/10"
                                            required
                                        >
                                            {payment_methods.length === 0 ? (
                                                <option value="">No payment methods available</option>
                                            ) : (
                                                payment_methods.map((method) => (
                                                    <option key={method.value} value={method.value}>
                                                        {method.label}
                                                    </option>
                                                ))
                                            )}
                                        </select>
                                        {errors.payment_method && (
                                            <p className="mt-2 text-sm text-destructive">{errors.payment_method}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label htmlFor="paid_at" className="text-sm font-medium">
                                            Payment date
                                        </label>
                                        <input
                                            id="paid_at"
                                            type="date"
                                            value={data.paid_at}
                                            onChange={(event) => setData('paid_at', event.target.value)}
                                            className="mt-2 h-12 w-full rounded-xl border bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/10"
                                            required
                                        />
                                        {errors.paid_at && (
                                            <p className="mt-2 text-sm text-destructive">{errors.paid_at}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-7 rounded-xl border bg-muted/20 p-4">
                                    <div className="flex items-center justify-between gap-4 text-sm">
                                        <span className="text-muted-foreground">Payment method</span>
                                        <span className="font-medium">
                                            {data.payment_method
                                                ? payment_methods.find((method) => method.value === data.payment_method)?.label ?? data.payment_method
                                                : 'Select a method'}
                                        </span>
                                    </div>

                                    <div className="mt-3 flex items-center justify-between gap-4 text-sm">
                                        <span className="text-muted-foreground">Payment amount</span>
                                        <span className="font-semibold">
                                            {formatCurrency(Number.isFinite(enteredAmount) ? enteredAmount : 0)}
                                        </span>
                                    </div>

                                    <div className="mt-3 flex items-center justify-between gap-4 border-t pt-3 text-sm">
                                        <span className="text-muted-foreground">Remaining balance</span>
                                        <span className={`font-semibold ${paymentComplete ? '' : 'text-destructive'}`}>
                                            {formatCurrency(remainingAfterPayment)}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end xl:flex-col-reverse">
                                    <Link
                                        href={members.show(member.id)}
                                        className="inline-flex h-12 items-center justify-center rounded-xl border px-5 text-sm font-medium transition hover:bg-muted"
                                    >
                                        Cancel
                                    </Link>
                                    <button
                                        type="submit"
                                        disabled={processing || !amountIsValid || !data.payment_method || !data.paid_at}
                                        className="inline-flex h-12 items-center justify-center rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {processing ? 'Recording…' : paymentComplete ? 'Record full payment' : 'Record payment'}
                                    </button>
                                </div>
                            </form>
                        </section>
                    </div>
                </div>
            </div>
        </>
    );
}
