import { Form, Head } from '@inertiajs/react';
import { Wallet } from 'lucide-react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { login } from '@/routes';
import { store } from '@/routes/register';

type Props = {
    passwordRules: string;
};

export default function Register({ passwordRules }: Props) {
    return (
        <>
            <Head title="Register" />

            <Form
                {...store.form()}
                resetOnSuccess={['password', 'password_confirmation']}
                disableWhileProcessing
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Your name</Label>

                                <Input
                                    id="name"
                                    type="text"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="name"
                                    name="name"
                                    placeholder="Full name"
                                />

                                <InputError
                                    message={errors.name}
                                    className="mt-2"
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="gym_name">
                                    Gym / Business name
                                </Label>

                                <Input
                                    id="gym_name"
                                    type="text"
                                    required
                                    tabIndex={2}
                                    autoComplete="organization"
                                    name="gym_name"
                                    placeholder="Your gym or business name"
                                />

                                <InputError
                                    message={errors.gym_name}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">
                                    Email address
                                </Label>

                                <Input
                                    id="email"
                                    type="email"
                                    required
                                    tabIndex={3}
                                    autoComplete="email"
                                    name="email"
                                    placeholder="email@example.com"
                                />

                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password">
                                    Password
                                </Label>

                                <PasswordInput
                                    id="password"
                                    required
                                    tabIndex={4}
                                    autoComplete="new-password"
                                    name="password"
                                    placeholder="Password"
                                    passwordrules={passwordRules}
                                />

                                <InputError message={errors.password} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password_confirmation">
                                    Confirm password
                                </Label>

                                <PasswordInput
                                    id="password_confirmation"
                                    required
                                    tabIndex={5}
                                    autoComplete="new-password"
                                    name="password_confirmation"
                                    placeholder="Confirm password"
                                    passwordrules={passwordRules}
                                />

                                <InputError
                                    message={errors.password_confirmation}
                                />
                            </div>

                            {/* Optional Payment Details */}
                            <div className="rounded-2xl border border-border/80 bg-muted/20 p-4 space-y-4 shadow-2xs">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Wallet className="size-4 text-primary" />
                                        <span className="text-sm font-semibold tracking-tight text-foreground">
                                            Payment Collection Details
                                        </span>
                                    </div>
                                    <Badge variant="secondary" className="text-[11px] font-medium px-2 py-0.5 rounded-full">
                                        Optional
                                    </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Provide your UPI ID and bank account details so members can pay fees directly to your gym. You can also update these anytime in Settings.
                                </p>

                                <div className="grid gap-3">
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="upi_id" className="text-xs font-medium">
                                            UPI ID (VPA)
                                        </Label>
                                        <Input
                                            id="upi_id"
                                            type="text"
                                            tabIndex={6}
                                            autoComplete="off"
                                            name="upi_id"
                                            placeholder="e.g. gymname@okaxis or 9876543210@paytm"
                                        />
                                        <InputError message={errors.upi_id} />
                                    </div>

                                    <div className="relative my-1 flex items-center justify-center">
                                        <div className="absolute inset-0 flex items-center">
                                            <span className="w-full border-t border-border/60" />
                                        </div>
                                        <span className="relative bg-muted/60 px-2 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold rounded">
                                            Bank Details
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="grid gap-1.5">
                                            <Label htmlFor="bank_account_name" className="text-xs font-medium">
                                                Account Holder Name
                                            </Label>
                                            <Input
                                                id="bank_account_name"
                                                type="text"
                                                tabIndex={7}
                                                name="bank_account_name"
                                                placeholder="Name as per bank"
                                            />
                                            <InputError message={errors.bank_account_name} />
                                        </div>

                                        <div className="grid gap-1.5">
                                            <Label htmlFor="bank_name" className="text-xs font-medium">
                                                Bank Name
                                            </Label>
                                            <Input
                                                id="bank_name"
                                                type="text"
                                                tabIndex={8}
                                                name="bank_name"
                                                placeholder="e.g. HDFC Bank, SBI"
                                            />
                                            <InputError message={errors.bank_name} />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="grid gap-1.5">
                                            <Label htmlFor="bank_account_number" className="text-xs font-medium">
                                                Account Number
                                            </Label>
                                            <Input
                                                id="bank_account_number"
                                                type="text"
                                                tabIndex={9}
                                                name="bank_account_number"
                                                placeholder="Bank account number"
                                            />
                                            <InputError message={errors.bank_account_number} />
                                        </div>

                                        <div className="grid gap-1.5">
                                            <Label htmlFor="bank_ifsc_code" className="text-xs font-medium">
                                                IFSC Code
                                            </Label>
                                            <Input
                                                id="bank_ifsc_code"
                                                type="text"
                                                tabIndex={10}
                                                name="bank_ifsc_code"
                                                placeholder="e.g. HDFC0001234"
                                                className="uppercase"
                                            />
                                            <InputError message={errors.bank_ifsc_code} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="mt-2 w-full"
                                tabIndex={11}
                                data-test="register-user-button"
                            >
                                {processing && <Spinner />}
                                Create account
                            </Button>
                        </div>

                        <div className="text-muted-foreground text-center text-sm">
                            Already have an account?{' '}
                            <TextLink href={login()} tabIndex={12}>
                                Log in
                            </TextLink>
                        </div>
                    </>
                )}
            </Form>
        </>
    );
}

Register.layout = {
    title: 'Create an account',
    description:
        'Create your gym account and start managing your business',
};