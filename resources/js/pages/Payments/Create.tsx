import { Head, Link, useForm } from '@inertiajs/react';
import { QRCodeSVG } from 'qrcode.react';
import { useState } from 'react';
import {
    ArrowLeft,
    Building2,
    Check,
    CheckCircle2,
    Copy,
    CreditCard,
    DollarSign,
    ExternalLink,
    QrCode,
    Wallet,
} from 'lucide-react';
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

type OrganizationPayment = {
    name?: string;
    upi_id?: string;
    bank_account_name?: string;
    bank_name?: string;
    bank_account_number?: string;
    bank_ifsc_code?: string;
};

type Props = {
    member: Member;
    membership: Membership;
    organization?: OrganizationPayment;
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
    return `₹${Number.isFinite(amount) ? amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}`;
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
    organization,
    payment_methods,
}: Props) {
    const [copiedField, setCopiedField] = useState<string | null>(null);

    function handleCopy(text: string, field: string) {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    }

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

    const hasPaymentDetails = Boolean(
        organization?.upi_id ||
        organization?.bank_account_number ||
        organization?.bank_name
    );

    const dynamicUpiUrl = organization?.upi_id
        ? (amountIsValid && enteredAmount > 0
            ? `upi://pay?pa=${encodeURIComponent(organization.upi_id)}&pn=${encodeURIComponent(organization.name || 'GymPilot')}&am=${encodeURIComponent(enteredAmount.toFixed(2))}&cu=INR`
            : `upi://pay?pa=${encodeURIComponent(organization.upi_id)}&pn=${encodeURIComponent(organization.name || 'GymPilot')}&cu=INR`)
        : '';

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

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6 max-w-7xl mx-auto w-full">
                <div>
                    <Button variant="ghost" size="sm" asChild className="-ml-3 mb-2 text-muted-foreground">
                        <Link href={members.show(member.id)}>
                            <ArrowLeft data-icon="inline-start" className="size-4" />
                            Back to {member.name}
                        </Link>
                    </Button>

                    <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-2xl font-bold tracking-tight">Record Payment</h1>
                        <Badge variant="outline">{membership.plan}</Badge>
                        <Badge variant="secondary" className="capitalize">{membership.lifecycle_status}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Collect payment against {member.name}&apos;s current membership balance.
                    </p>
                </div>

                <div className="grid max-w-5xl gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
                    {/* Membership Ledger Summary & Payment Accounts */}
                    <div className="flex flex-col gap-6">
                        <Card>
                            <CardHeader className="border-b pb-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <CreditCard className="size-4 text-primary" />
                                        <CardTitle className="text-base font-semibold">
                                            Membership Ledger
                                        </CardTitle>
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                        {formatDate(membership.start_date)} → {formatDate(membership.end_date)}
                                    </span>
                                </div>
                            </CardHeader>

                            <CardContent className="grid divide-y p-0 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                                <div className="p-6">
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Total Price
                                    </p>
                                    <p className="mt-2 text-2xl font-bold tracking-tight">
                                        {formatCurrency(membership.price)}
                                    </p>
                                </div>

                                <div className="p-6">
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Paid So Far
                                    </p>
                                    <p className="mt-2 text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                                        {formatCurrency(membership.amount_paid)}
                                    </p>
                                </div>

                                <div className="p-6">
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Balance Due
                                    </p>
                                    <p className="mt-2 text-2xl font-bold tracking-tight text-destructive">
                                        {formatCurrency(membership.balance_due)}
                                    </p>
                                </div>
                            </CardContent>

                            <div className="border-t bg-muted/20 p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                            Balance After This Entry
                                        </p>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            Calculated dynamically based on amount entered.
                                        </p>
                                    </div>
                                    <p className={`text-2xl font-extrabold tracking-tight ${paymentComplete ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'}`}>
                                        {formatCurrency(remainingAfterPayment)}
                                    </p>
                                </div>
                            </div>
                        </Card>

                        {/* Gym Receiving Account Details Card */}
                        <Card className="rounded-2xl border border-border/80 shadow-2xs overflow-hidden">
                            <CardHeader className="border-b pb-4 bg-muted/10">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Wallet className="size-4 text-primary" />
                                        <CardTitle className="text-base font-semibold">
                                            Gym Receiving Accounts
                                        </CardTitle>
                                    </div>
                                    <Badge variant="outline" className="text-xs font-normal">
                                        {organization?.name || 'Gym Details'}
                                    </Badge>
                                </div>
                                <CardDescription className="text-xs">
                                    Show these details to the member or use the dynamic QR code for instant UPI collection.
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="p-6 space-y-6">
                                {hasPaymentDetails ? (
                                    <>
                                        {/* UPI Section */}
                                        {organization?.upi_id && (
                                            <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-xl border border-border/80 bg-muted/20">
                                                <div className="bg-white p-2.5 rounded-xl border shadow-2xs shrink-0 dark:bg-white">
                                                    <QRCodeSVG
                                                        value={dynamicUpiUrl}
                                                        size={110}
                                                        level="M"
                                                    />
                                                </div>
                                                <div className="space-y-2 flex-1 w-full text-center sm:text-left">
                                                    <div className="flex items-center justify-center sm:justify-start gap-2">
                                                        <QrCode className="size-4 text-primary" />
                                                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                                            UPI ID (Scan & Pay)
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-center sm:justify-start gap-2">
                                                        <code className="text-sm font-bold tracking-tight bg-background px-2.5 py-1 rounded-lg border font-mono">
                                                            {organization.upi_id}
                                                        </code>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="icon"
                                                            className="h-8 w-8 rounded-lg shrink-0"
                                                            onClick={() => handleCopy(organization.upi_id!, 'upi')}
                                                            title="Copy UPI ID"
                                                        >
                                                            {copiedField === 'upi' ? (
                                                                <Check className="size-3.5 text-emerald-600" />
                                                            ) : (
                                                                <Copy className="size-3.5" />
                                                            )}
                                                        </Button>
                                                    </div>
                                                    <p className="text-[11px] text-muted-foreground">
                                                        {amountIsValid
                                                            ? `QR code requested for exact balance: ${formatCurrency(enteredAmount)}`
                                                            : 'Scan with Google Pay, PhonePe, Paytm, or any UPI app.'}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Bank Details Section */}
                                        {(organization?.bank_account_number || organization?.bank_name) && (
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2">
                                                    <Building2 className="size-4 text-primary" />
                                                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                                        Direct Bank Transfer (IMPS / NEFT)
                                                    </h4>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                                    {organization.bank_name && (
                                                        <div className="p-3 rounded-xl border border-border/80 bg-muted/15">
                                                            <span className="text-muted-foreground block text-[11px]">Bank Name</span>
                                                            <span className="font-semibold text-foreground text-sm">{organization.bank_name}</span>
                                                        </div>
                                                    )}
                                                    {organization.bank_account_name && (
                                                        <div className="p-3 rounded-xl border border-border/80 bg-muted/15">
                                                            <span className="text-muted-foreground block text-[11px]">Account Holder</span>
                                                            <span className="font-semibold text-foreground text-sm">{organization.bank_account_name}</span>
                                                        </div>
                                                    )}
                                                    {organization.bank_account_number && (
                                                        <div className="p-3 rounded-xl border border-border/80 bg-muted/15 flex items-center justify-between">
                                                            <div>
                                                                <span className="text-muted-foreground block text-[11px]">Account Number</span>
                                                                <span className="font-semibold font-mono text-foreground text-sm">{organization.bank_account_number}</span>
                                                            </div>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7"
                                                                onClick={() => handleCopy(organization.bank_account_number!, 'acc')}
                                                            >
                                                                {copiedField === 'acc' ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
                                                            </Button>
                                                        </div>
                                                    )}
                                                    {organization.bank_ifsc_code && (
                                                        <div className="p-3 rounded-xl border border-border/80 bg-muted/15 flex items-center justify-between">
                                                            <div>
                                                                <span className="text-muted-foreground block text-[11px]">IFSC Code</span>
                                                                <span className="font-semibold font-mono text-foreground text-sm uppercase">{organization.bank_ifsc_code}</span>
                                                            </div>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7"
                                                                onClick={() => handleCopy(organization.bank_ifsc_code!, 'ifsc')}
                                                            >
                                                                {copiedField === 'ifsc' ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="text-center py-4 space-y-2">
                                        <p className="text-xs text-muted-foreground">
                                            No UPI ID or bank account details have been configured for this gym yet.
                                        </p>
                                        <Button variant="outline" size="sm" asChild className="rounded-xl text-xs">
                                            <Link href="/settings/payment">
                                                Configure Payment Details
                                                <ExternalLink className="ml-1.5 size-3" />
                                            </Link>
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Payment Details Form */}
                    <div>
                        <Card className="xl:sticky xl:top-6">
                            <form onSubmit={submit}>
                                <CardHeader>
                                    <CardTitle className="text-base font-semibold">Payment Details</CardTitle>
                                    <CardDescription>
                                        Enter transaction receipt details and payment channel.
                                    </CardDescription>
                                </CardHeader>

                                <CardContent className="flex flex-col gap-5">
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="amount">Amount (₹)</Label>
                                            <span className="text-xs text-muted-foreground">
                                                Max {formatCurrency(membership.balance_due)}
                                            </span>
                                        </div>

                                        <div className="relative">
                                            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                                ₹
                                            </span>
                                            <Input
                                                id="amount"
                                                type="number"
                                                min="0.01"
                                                max={membership.balance_due}
                                                step="0.01"
                                                value={data.amount}
                                                onChange={(event) => setData('amount', event.target.value)}
                                                placeholder="0.00"
                                                required
                                                autoFocus
                                                className="pl-7 text-lg font-semibold"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setAmount(membership.balance_due)}
                                                className="text-xs"
                                            >
                                                Full Balance
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setAmount(membership.balance_due / 2)}
                                                disabled={membership.balance_due <= 1}
                                                className="text-xs"
                                            >
                                                Half Balance
                                            </Button>
                                        </div>

                                        <InputError message={errors.amount} />
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <Label htmlFor="payment_method">Payment Method</Label>
                                        <Select
                                            value={data.payment_method}
                                            onValueChange={(value) => setData('payment_method', value)}
                                        >
                                            <SelectTrigger id="payment_method">
                                                <SelectValue placeholder="Select payment method" />
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
                                        <Label htmlFor="paid_at">Payment Date</Label>
                                        <Input
                                            id="paid_at"
                                            type="date"
                                            value={data.paid_at}
                                            onChange={(event) => setData('paid_at', event.target.value)}
                                            required
                                        />
                                        <InputError message={errors.paid_at} />
                                    </div>
                                </CardContent>

                                <div className="flex flex-col gap-2 border-t bg-muted/10 p-6">
                                    <Button
                                        type="submit"
                                        disabled={
                                            processing ||
                                            !amountIsValid ||
                                            !data.payment_method ||
                                            !data.paid_at
                                        }
                                        className="w-full"
                                    >
                                        {processing ? (
                                            <Spinner data-icon="inline-start" />
                                        ) : (
                                            <DollarSign data-icon="inline-start" className="size-4" />
                                        )}
                                        {paymentComplete ? 'Record Full Payment' : 'Record Payment'}
                                    </Button>

                                    <Button variant="ghost" size="sm" asChild className="w-full">
                                        <Link href={members.show(member.id)}>Cancel</Link>
                                    </Button>
                                </div>
                            </form>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}
