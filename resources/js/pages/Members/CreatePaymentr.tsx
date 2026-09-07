import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, DollarSign } from 'lucide-react';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
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

const defaultPaymentMethods = [
    { value: 'cash', label: 'Cash' },
    { value: 'upi', label: 'UPI / QR' },
    { value: 'card', label: 'Card' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
];

export default function CreatePayment({
    member,
    membership,
}: Props) {
    const { data, setData, post, processing, errors } =
        useForm<PaymentForm>({
            amount: String(membership.balance_due || ''),
            payment_method: 'upi',
            paid_at: new Date().toISOString().slice(0, 16),
        });

    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        post(`/members/${member.id}/memberships/${membership.id}/payments`);
    };

    return (
        <>
            <Head title={`Record Payment - ${member.name}`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div>
                    <Button variant="ghost" size="sm" asChild className="-ml-3 mb-2 text-muted-foreground">
                        <Link href={members.show(member.id)}>
                            <ArrowLeft data-icon="inline-start" className="size-4" />
                            Back to Member Profile
                        </Link>
                    </Button>

                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold tracking-tight">Record Payment</h1>
                        <Badge variant="outline">{membership.plan}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Collect payment against {member.name}&apos;s membership balance.
                    </p>
                </div>

                <div className="max-w-2xl">
                    <Card>
                        <form onSubmit={submit}>
                            <CardHeader>
                                <CardTitle className="text-lg">Payment Details</CardTitle>
                                <CardDescription>
                                    Record member dues transaction into the ledger.
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="flex flex-col gap-5">
                                <div className="grid grid-cols-2 gap-4 rounded-lg border bg-muted/20 p-4">
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase tracking-wider">
                                            Membership Price
                                        </p>
                                        <p className="mt-1 text-lg font-bold">₹{membership.price}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase tracking-wider">
                                            Balance Due
                                        </p>
                                        <p className="mt-1 text-lg font-bold text-destructive">
                                            ₹{membership.balance_due}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="amount">Amount (₹)</Label>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-auto p-0 text-xs text-primary"
                                            onClick={() => setData('amount', String(membership.balance_due))}
                                        >
                                            Pay Full Due (₹{membership.balance_due})
                                        </Button>
                                    </div>
                                    <Input
                                        id="amount"
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        max={membership.balance_due}
                                        value={data.amount}
                                        onChange={(e) => setData('amount', e.target.value)}
                                        placeholder="0.00"
                                        required
                                        autoFocus
                                    />
                                    <InputError message={errors.amount} />
                                </div>

                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="payment_method">Payment Method</Label>
                                    <Select
                                        value={data.payment_method}
                                        onValueChange={(val) => setData('payment_method', val)}
                                    >
                                        <SelectTrigger id="payment_method">
                                            <SelectValue placeholder="Select method" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                {defaultPaymentMethods.map((m) => (
                                                    <SelectItem key={m.value} value={m.value}>
                                                        {m.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.payment_method} />
                                </div>

                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="paid_at">Payment Timestamp</Label>
                                    <Input
                                        id="paid_at"
                                        type="datetime-local"
                                        value={data.paid_at}
                                        onChange={(e) => setData('paid_at', e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.paid_at} />
                                </div>
                            </CardContent>

                            <CardFooter className="flex justify-end gap-3 border-t bg-muted/10 px-6 py-4">
                                <Button variant="outline" asChild>
                                    <Link href={members.show(member.id)}>Cancel</Link>
                                </Button>
                                <Button type="submit" disabled={processing || !data.amount || !data.payment_method}>
                                    {processing ? (
                                        <Spinner data-icon="inline-start" />
                                    ) : (
                                        <DollarSign data-icon="inline-start" className="size-4" />
                                    )}
                                    Record Payment
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>
                </div>
            </div>
        </>
    );
}