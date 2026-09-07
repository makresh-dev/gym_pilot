import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Calendar, CreditCard, DollarSign, ShieldCheck } from 'lucide-react';
import * as React from 'react';
import InputError from '@/components/input-error';
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
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
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

    const planPrice = selectedPlan ? Number(selectedPlan.price) : 0;
    const paymentAmount = Number(form.data.payment_amount) || 0;

    const paymentExceedsPrice =
        form.data.payment && paymentAmount > planPrice;

    const paymentIsInvalid =
        form.data.payment &&
        (paymentAmount <= 0 || paymentExceedsPrice);

    const remainingBalance = Math.max(planPrice - paymentAmount, 0);

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

        form.post(members.memberships.store(member.id).url);
    };

    return (
        <>
            <Head title={`Add Membership — ${member.name}`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div>
                    <Button variant="ghost" size="sm" asChild className="-ml-3 mb-2 text-muted-foreground">
                        <Link href={members.show(member.id)}>
                            <ArrowLeft data-icon="inline-start" className="size-4" />
                            Back to {member.name}
                        </Link>
                    </Button>

                    <h1 className="text-2xl font-bold tracking-tight">Add Membership</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Assign an active membership plan to {member.name}.
                    </p>
                </div>

                {plans.length === 0 ? (
                    <Card className="flex flex-col items-center justify-center p-10 text-center">
                        <CreditCard className="size-10 text-muted-foreground/40" />
                        <h2 className="mt-4 font-semibold">No active membership plans</h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Create and activate at least one membership plan before assigning subscriptions.
                        </p>
                    </Card>
                ) : (
                    <form onSubmit={submit} className="flex max-w-4xl flex-col gap-6">
                        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
                            <div className="flex flex-col gap-6">
                                {/* Plan & Date Card */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base font-semibold">Plan & Period</CardTitle>
                                        <CardDescription>
                                            Select membership tier and beginning date.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex flex-col gap-5">
                                        <div className="flex flex-col gap-2">
                                            <Label htmlFor="membership_plan_id">Membership Plan</Label>
                                            <Select
                                                value={form.data.membership_plan_id}
                                                onValueChange={(value) => form.setData('membership_plan_id', value)}
                                            >
                                                <SelectTrigger id="membership_plan_id">
                                                    <SelectValue placeholder="Select plan" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectGroup>
                                                        {plans.map((plan) => (
                                                            <SelectItem key={plan.id} value={plan.id}>
                                                                {plan.name} — ₹{plan.price} ({plan.duration_days} days)
                                                            </SelectItem>
                                                        ))}
                                                    </SelectGroup>
                                                </SelectContent>
                                            </Select>
                                            <InputError message={form.errors.membership_plan_id} />
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <Label htmlFor="start_date">Start Date</Label>
                                            <Input
                                                id="start_date"
                                                type="date"
                                                value={form.data.start_date}
                                                onChange={(event) =>
                                                    form.setData('start_date', event.target.value)
                                                }
                                                required
                                            />
                                            <InputError message={form.errors.start_date} />
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Payment Card */}
                                {selectedPlan && (
                                    <Card>
                                        <CardHeader>
                                            <div className="flex items-center justify-between">
                                                <CardTitle className="text-base font-semibold">Payment Option</CardTitle>
                                                <Badge variant="outline">
                                                    Total ₹{Number(selectedPlan.price).toLocaleString('en-IN')}
                                                </Badge>
                                            </div>
                                            <CardDescription>
                                                Record full or partial payment upfront, or defer collection.
                                            </CardDescription>
                                        </CardHeader>

                                        <CardContent className="flex flex-col gap-5">
                                            <div className="grid grid-cols-2 gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        form.setData('payment', false);
                                                        form.setData('payment_amount', '');
                                                        form.setData('payment_method', '');
                                                    }}
                                                    className={`flex flex-col items-start rounded-lg border p-4 text-left transition ${
                                                        !form.data.payment
                                                            ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                                            : 'hover:bg-muted/40'
                                                    }`}
                                                >
                                                    <span className="font-semibold text-sm">Pay Later</span>
                                                    <span className="mt-1 text-xs text-muted-foreground">
                                                        Record membership now with ₹{Number(selectedPlan.price).toLocaleString('en-IN')} balance due.
                                                    </span>
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        form.setData('payment', true);
                                                        form.setData('payment_amount', String(selectedPlan.price));
                                                    }}
                                                    className={`flex flex-col items-start rounded-lg border p-4 text-left transition ${
                                                        form.data.payment
                                                            ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                                            : 'hover:bg-muted/40'
                                                    }`}
                                                >
                                                    <span className="font-semibold text-sm">Pay Now</span>
                                                    <span className="mt-1 text-xs text-muted-foreground">
                                                        Record instant payment entry against this membership.
                                                    </span>
                                                </button>
                                            </div>

                                            {form.data.payment && (
                                                <div className="flex flex-col gap-4 rounded-lg border bg-muted/20 p-4">
                                                    <div className="flex flex-col gap-2">
                                                        <div className="flex items-center justify-between">
                                                            <Label htmlFor="payment_amount">Payment Amount (₹)</Label>
                                                            <span className="text-xs text-muted-foreground">
                                                                Max ₹{selectedPlan.price}
                                                            </span>
                                                        </div>
                                                        <Input
                                                            id="payment_amount"
                                                            type="number"
                                                            min="0.01"
                                                            max={planPrice}
                                                            step="0.01"
                                                            value={form.data.payment_amount}
                                                            onChange={(event) =>
                                                                form.setData('payment_amount', event.target.value)
                                                            }
                                                            placeholder={`Max ₹${selectedPlan.price}`}
                                                            required
                                                        />
                                                        <InputError message={form.errors.payment_amount} />
                                                        {paymentExceedsPrice && (
                                                            <p className="text-xs text-destructive">
                                                                Amount cannot exceed plan price ₹{selectedPlan.price}.
                                                            </p>
                                                        )}
                                                    </div>

                                                    <div className="flex flex-col gap-2">
                                                        <Label htmlFor="payment_method">Payment Method</Label>
                                                        <Select
                                                            value={form.data.payment_method}
                                                            onValueChange={(value) => form.setData('payment_method', value)}
                                                        >
                                                            <SelectTrigger id="payment_method">
                                                                <SelectValue placeholder="Select method" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectGroup>
                                                                    {payment_methods.map((method) => (
                                                                        <SelectItem key={method.value} value={method.value}>
                                                                            {method.label}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectGroup>
                                                            </SelectContent>
                                                        </Select>
                                                        <InputError message={form.errors.payment_method} />
                                                    </div>

                                                    <div className="flex flex-col gap-2">
                                                        <Label htmlFor="paid_at">Payment Date & Time</Label>
                                                        <Input
                                                            id="paid_at"
                                                            type="datetime-local"
                                                            value={form.data.paid_at}
                                                            onChange={(event) =>
                                                                form.setData('paid_at', event.target.value)
                                                            }
                                                            required
                                                        />
                                                        <InputError message={form.errors.paid_at} />
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                )}
                            </div>

                            {/* Summary Sidebar */}
                            {selectedPlan && (
                                <div>
                                    <Card className="sticky top-6">
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-base font-semibold">Summary</CardTitle>
                                        </CardHeader>
                                        <CardContent className="flex flex-col gap-3 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Plan</span>
                                                <span className="font-medium">{selectedPlan.name}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Duration</span>
                                                <span className="font-medium">{selectedPlan.duration_days} days</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Start</span>
                                                <span className="font-medium">{formatDate(startDate)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">End</span>
                                                <span className="font-medium">{formatDate(endDate)}</span>
                                            </div>

                                            <div className="my-1 border-t" />

                                            <div className="flex justify-between text-base font-semibold">
                                                <span>Plan Price</span>
                                                <span>₹{Number(selectedPlan.price).toLocaleString('en-IN')}</span>
                                            </div>

                                            {form.data.payment && (
                                                <>
                                                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                                                        <span>Paying Now</span>
                                                        <span>- ₹{paymentAmount.toFixed(2)}</span>
                                                    </div>
                                                    <div className="flex justify-between font-semibold text-destructive">
                                                        <span>Remaining Due</span>
                                                        <span>₹{remainingBalance.toFixed(2)}</span>
                                                    </div>
                                                </>
                                            )}

                                            <Button
                                                type="submit"
                                                className="mt-4 w-full"
                                                disabled={
                                                    form.processing ||
                                                    !form.data.membership_plan_id ||
                                                    !form.data.start_date ||
                                                    paymentIsInvalid ||
                                                    (form.data.payment && !form.data.payment_method)
                                                }
                                            >
                                                {form.processing ? (
                                                    <Spinner data-icon="inline-start" />
                                                ) : (
                                                    <ShieldCheck data-icon="inline-start" className="size-4" />
                                                )}
                                                Create Membership
                                            </Button>

                                            <Button variant="ghost" size="sm" asChild className="w-full">
                                                <Link href={members.show(member.id)}>Cancel</Link>
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </div>
                            )}
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