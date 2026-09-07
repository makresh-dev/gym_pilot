import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Calendar, CreditCard, RotateCw, ShieldCheck } from 'lucide-react';
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
import members from '@/routes/members';

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

    const selectedPlanPrice = selectedPlan ? Number(selectedPlan.price) : 0;
    const paymentAmount = Number(data.payment_amount || 0);

    const paymentExceedsPrice =
        payNow && paymentAmount > selectedPlanPrice;

    const paymentIsInvalid =
        payNow &&
        (paymentAmount <= 0 ||
            paymentExceedsPrice ||
            !data.payment_method ||
            !data.paid_at);

    const remainingBalance = Math.max(0, selectedPlanPrice - paymentAmount);

    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!data.membership_plan_id || !data.start_date || paymentIsInvalid) {
            return;
        }

        post(`/members/${member.id}/memberships/${membership.id}/renew`);
    };

    const handlePayNowChange = (value: boolean) => {
        setPayNow(value);
        setData('payment', value);

        if (!value) {
            setData('payment_amount', '');
            setData('payment_method', '');
        } else if (selectedPlan) {
            setData('payment_amount', String(selectedPlan.price));
        }
    };

    return (
        <>
            <Head title={`Renew Membership - ${member.name}`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div>
                    <Button variant="ghost" size="sm" asChild className="-ml-3 mb-2 text-muted-foreground">
                        <Link href={members.show(member.id)}>
                            <ArrowLeft data-icon="inline-start" className="size-4" />
                            Back to {member.name}
                        </Link>
                    </Button>

                    <h1 className="text-2xl font-bold tracking-tight">Renew Membership</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Continue subscription benefits for {member.name}.
                    </p>
                </div>

                <div className="grid max-w-4xl gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
                    <div className="flex flex-col gap-6">
                        {/* Current Membership Card */}
                        <Card className="bg-muted/30">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <CreditCard className="size-4 text-primary" />
                                        <CardTitle className="text-sm font-semibold">
                                            Current Membership
                                        </CardTitle>
                                    </div>
                                    <Badge variant="outline" className="capitalize">
                                        {membership.lifecycle_status}
                                    </Badge>
                                </div>
                                <CardDescription>
                                    {membership.membership_plan.name} — ₹{membership.price}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="grid grid-cols-2 gap-3 text-xs">
                                <div>
                                    <span className="text-muted-foreground">Started: </span>
                                    <span className="font-medium">{membership.start_date}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Expires: </span>
                                    <span className="font-medium">{membership.end_date}</span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Renewal Configuration Form */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base font-semibold">Renewal Period & Plan</CardTitle>
                                <CardDescription>
                                    Choose the next subscription term and activation start date.
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="flex flex-col gap-5">
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="membership_plan_id">New Membership Plan</Label>
                                    <Select
                                        value={data.membership_plan_id}
                                        onValueChange={(value) => {
                                            setData('membership_plan_id', value);
                                            const p = plans.find((item) => item.id === value);
                                            if (payNow && p) {
                                                setData('payment_amount', String(p.price));
                                            }
                                        }}
                                    >
                                        <SelectTrigger id="membership_plan_id">
                                            <SelectValue placeholder="Select plan to renew" />
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
                                    <InputError message={errors.membership_plan_id} />
                                </div>

                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="start_date">Renewal Start Date</Label>
                                    <Input
                                        id="start_date"
                                        type="date"
                                        value={data.start_date}
                                        onChange={(event) =>
                                            setData('start_date', event.target.value)
                                        }
                                        required
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Defaults to seamlessly continue from the previous membership end date.
                                    </p>
                                    <InputError message={errors.start_date} />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Payment Selection Card */}
                        {selectedPlan && (
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-base font-semibold">Payment</CardTitle>
                                        <Badge variant="outline">
                                            Due ₹{Number(selectedPlan.price).toLocaleString('en-IN')}
                                        </Badge>
                                    </div>
                                    <CardDescription>
                                        Record payment at renewal or add to outstanding member ledger.
                                    </CardDescription>
                                </CardHeader>

                                <CardContent className="flex flex-col gap-5">
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => handlePayNowChange(false)}
                                            className={`flex flex-col items-start rounded-lg border p-4 text-left transition ${
                                                !payNow
                                                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                                    : 'hover:bg-muted/40'
                                            }`}
                                        >
                                            <span className="font-semibold text-sm">Pay Later</span>
                                            <span className="mt-1 text-xs text-muted-foreground">
                                                Renew membership now; balance remains due.
                                            </span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handlePayNowChange(true)}
                                            className={`flex flex-col items-start rounded-lg border p-4 text-left transition ${
                                                payNow
                                                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                                    : 'hover:bg-muted/40'
                                            }`}
                                        >
                                            <span className="font-semibold text-sm">Pay Now</span>
                                            <span className="mt-1 text-xs text-muted-foreground">
                                                Record payment received immediately.
                                            </span>
                                        </button>
                                    </div>

                                    {payNow && (
                                        <div className="flex flex-col gap-4 rounded-lg border bg-muted/20 p-4">
                                            <div className="flex flex-col gap-2">
                                                <div className="flex items-center justify-between">
                                                    <Label htmlFor="payment_amount">Amount (₹)</Label>
                                                    <span className="text-xs text-muted-foreground">
                                                        Max ₹{selectedPlan.price}
                                                    </span>
                                                </div>
                                                <Input
                                                    id="payment_amount"
                                                    type="number"
                                                    min="0.01"
                                                    max={selectedPlanPrice}
                                                    step="0.01"
                                                    value={data.payment_amount}
                                                    onChange={(event) =>
                                                        setData('payment_amount', event.target.value)
                                                    }
                                                    required
                                                />
                                                <InputError message={errors.payment_amount} />
                                                {paymentExceedsPrice && (
                                                    <p className="text-xs text-destructive">
                                                        Amount exceeds plan price ₹{selectedPlan.price}.
                                                    </p>
                                                )}
                                            </div>

                                            <div className="flex flex-col gap-2">
                                                <Label htmlFor="payment_method">Payment Method</Label>
                                                <Select
                                                    value={data.payment_method}
                                                    onValueChange={(value) => setData('payment_method', value)}
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
                                                <InputError message={errors.payment_method} />
                                            </div>

                                            <div className="flex flex-col gap-2">
                                                <Label htmlFor="paid_at">Payment Date & Time</Label>
                                                <Input
                                                    id="paid_at"
                                                    type="datetime-local"
                                                    value={data.paid_at}
                                                    onChange={(event) =>
                                                        setData('paid_at', event.target.value)
                                                    }
                                                    required
                                                />
                                                <InputError message={errors.paid_at} />
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Renewal Summary Sidebar */}
                    <div>
                        <Card className="sticky top-6">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base font-semibold">Renewal Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-col gap-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Member</span>
                                    <span className="font-medium">{member.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Plan</span>
                                    <span className="font-medium">{selectedPlan?.name ?? 'Not selected'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Start Date</span>
                                    <span className="font-medium">{data.start_date || '—'}</span>
                                </div>

                                <div className="my-1 border-t" />

                                <div className="flex justify-between text-base font-semibold">
                                    <span>Plan Price</span>
                                    <span>₹{selectedPlan ? Number(selectedPlan.price).toLocaleString('en-IN') : '0.00'}</span>
                                </div>

                                {payNow && selectedPlan && (
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
                                    onClick={(e) => submit(e as unknown as React.FormEvent<HTMLFormElement>)}
                                    className="mt-4 w-full"
                                    disabled={
                                        processing ||
                                        !data.membership_plan_id ||
                                        !data.start_date ||
                                        paymentIsInvalid
                                    }
                                >
                                    {processing ? (
                                        <Spinner data-icon="inline-start" />
                                    ) : (
                                        <RotateCw data-icon="inline-start" className="size-4" />
                                    )}
                                    Confirm Renewal
                                </Button>

                                <Button variant="ghost" size="sm" asChild className="w-full">
                                    <Link href={members.show(member.id)}>Cancel</Link>
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}