import { Head, useForm } from '@inertiajs/react';
import { Building2, Check, Copy, QrCode, ShieldCheck, Wallet } from 'lucide-react';
import { useState } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

type OrganizationPayment = {
    name?: string;
    upi_id?: string;
    bank_account_name?: string;
    bank_name?: string;
    bank_account_number?: string;
    bank_ifsc_code?: string;
};

type Props = {
    organization: OrganizationPayment;
    status?: string;
};

export default function PaymentSettings({ organization }: Props) {
    const [copiedField, setCopiedField] = useState<string | null>(null);

    const { data, setData, patch, processing, errors, recentlySuccessful } = useForm({
        upi_id: organization.upi_id || '',
        bank_account_name: organization.bank_account_name || '',
        bank_name: organization.bank_name || '',
        bank_account_number: organization.bank_account_number || '',
        bank_ifsc_code: organization.bank_ifsc_code || '',
    });

    function handleCopy(text: string, field: string) {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        patch('/settings/payment', {
            preserveScroll: true,
        });
    }

    const upiLink = data.upi_id
        ? `upi://pay?pa=${encodeURIComponent(data.upi_id)}&pn=${encodeURIComponent(organization.name || 'GymPilot')}&cu=INR`
        : '';

    return (
        <>
            <Head title="Payment Settings" />

            <h1 className="sr-only">Payment Settings</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Payment Details"
                    description="Configure your gym's receiving account details so members can pay membership fees directly via UPI and Bank Transfer."
                />

                <form onSubmit={submit} className="space-y-6">
                    {/* UPI Section Card */}
                    <Card className="rounded-2xl border border-border/80 shadow-2xs">
                        <CardHeader className="pb-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                        <QrCode className="size-4" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base font-semibold">UPI Payment</CardTitle>
                                        <CardDescription className="text-xs">
                                            Instant member payments via Google Pay, PhonePe, Paytm, or BHIM
                                        </CardDescription>
                                    </div>
                                </div>
                                {data.upi_id && (
                                    <Badge variant="outline" className="text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30">
                                        Active
                                    </Badge>
                                )}
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="upi_id" className="text-sm font-medium">
                                    Gym UPI ID (VPA)
                                </Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="upi_id"
                                        type="text"
                                        value={data.upi_id}
                                        onChange={(e) => setData('upi_id', e.target.value)}
                                        placeholder="e.g. gymname@okhdfcbank, 9876543210@paytm"
                                        className="h-10 rounded-xl"
                                    />
                                    {data.upi_id && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            onClick={() => handleCopy(data.upi_id, 'upi')}
                                            title="Copy UPI ID"
                                            className="h-10 w-10 shrink-0 rounded-xl"
                                        >
                                            {copiedField === 'upi' ? (
                                                <Check className="size-4 text-emerald-600" />
                                            ) : (
                                                <Copy className="size-4" />
                                            )}
                                        </Button>
                                    )}
                                </div>
                                <InputError message={errors.upi_id} />
                                <p className="text-xs text-muted-foreground">
                                    This UPI ID will be shown to members on the payment collection desk with a dynamic QR code.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Direct Bank Transfer Card */}
                    <Card className="rounded-2xl border border-border/80 shadow-2xs">
                        <CardHeader className="pb-4">
                            <div className="flex items-center gap-2">
                                <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                    <Building2 className="size-4" />
                                </div>
                                <div>
                                    <CardTitle className="text-base font-semibold">Bank Account Details</CardTitle>
                                    <CardDescription className="text-xs">
                                        Direct NEFT / RTGS / IMPS bank transfer information
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="bank_account_name" className="text-sm font-medium">
                                        Account Holder Name
                                    </Label>
                                    <Input
                                        id="bank_account_name"
                                        type="text"
                                        value={data.bank_account_name}
                                        onChange={(e) => setData('bank_account_name', e.target.value)}
                                        placeholder="Name as registered with bank"
                                        className="h-10 rounded-xl"
                                    />
                                    <InputError message={errors.bank_account_name} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="bank_name" className="text-sm font-medium">
                                        Bank Name
                                    </Label>
                                    <Input
                                        id="bank_name"
                                        type="text"
                                        value={data.bank_name}
                                        onChange={(e) => setData('bank_name', e.target.value)}
                                        placeholder="e.g. HDFC Bank, State Bank of India"
                                        className="h-10 rounded-xl"
                                    />
                                    <InputError message={errors.bank_name} />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="bank_account_number" className="text-sm font-medium">
                                        Account Number
                                    </Label>
                                    <Input
                                        id="bank_account_number"
                                        type="text"
                                        value={data.bank_account_number}
                                        onChange={(e) => setData('bank_account_number', e.target.value)}
                                        placeholder="e.g. 50100234567890"
                                        className="h-10 rounded-xl font-mono"
                                    />
                                    <InputError message={errors.bank_account_number} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="bank_ifsc_code" className="text-sm font-medium">
                                        IFSC Code
                                    </Label>
                                    <Input
                                        id="bank_ifsc_code"
                                        type="text"
                                        value={data.bank_ifsc_code}
                                        onChange={(e) => setData('bank_ifsc_code', e.target.value.toUpperCase())}
                                        placeholder="e.g. HDFC0001234"
                                        className="h-10 rounded-xl font-mono uppercase"
                                    />
                                    <InputError message={errors.bank_ifsc_code} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Save Action & Status */}
                    <div className="flex items-center gap-4">
                        <Button
                            type="submit"
                            disabled={processing}
                            className="rounded-xl px-6"
                        >
                            {processing && <Spinner data-icon="inline-start" />}
                            Save Payment Details
                        </Button>

                        {recentlySuccessful && (
                            <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                                <ShieldCheck className="size-4" />
                                Changes saved successfully.
                            </p>
                        )}
                    </div>
                </form>
            </div>
        </>
    );
}
