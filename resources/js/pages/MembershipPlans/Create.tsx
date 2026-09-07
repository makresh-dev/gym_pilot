import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, CreditCard } from 'lucide-react';
import * as React from 'react';
import InputError from '@/components/input-error';
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
import { Spinner } from '@/components/ui/spinner';
import { dashboard } from '@/routes';
import membershipPlans from '@/routes/membership-plans';

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        price: '',
        duration_days: '',
    });

    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        post(membershipPlans.store().url);
    };

    return (
        <>
            <Head title="Create Membership Plan" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6 max-w-7xl mx-auto w-full">
                <div>
                    <Button variant="ghost" size="sm" asChild className="-ml-3 mb-2 text-muted-foreground">
                        <Link href={membershipPlans.index()}>
                            <ArrowLeft data-icon="inline-start" className="size-4" />
                            Back to Membership Plans
                        </Link>
                    </Button>

                    <h1 className="text-2xl font-bold tracking-tight">
                        Create Membership Plan
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Define pricing and duration for memberships and renewals.
                    </p>
                </div>

                <div className="max-w-2xl">
                    <Card>
                        <form onSubmit={submit}>
                            <CardHeader>
                                <CardTitle className="text-lg">Plan Details</CardTitle>
                                <CardDescription>
                                    Members will be billed this amount for access over the specified duration.
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="flex flex-col gap-5">
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="name">Plan Name</Label>
                                    <Input
                                        id="name"
                                        type="text"
                                        value={data.name}
                                        onChange={(event) =>
                                            setData('name', event.target.value)
                                        }
                                        placeholder="e.g. Monthly Standard, 3-Month Transform"
                                        required
                                        autoFocus
                                    />
                                    <InputError message={errors.name} />
                                </div>

                                <div className="grid gap-5 sm:grid-cols-2">
                                    <div className="flex flex-col gap-2">
                                        <Label htmlFor="price">Price (₹)</Label>
                                        <Input
                                            id="price"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={data.price}
                                            onChange={(event) =>
                                                setData('price', event.target.value)
                                            }
                                            placeholder="1500"
                                            required
                                        />
                                        <InputError message={errors.price} />
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <Label htmlFor="duration_days">Duration (Days)</Label>
                                        <Input
                                            id="duration_days"
                                            type="number"
                                            min="1"
                                            step="1"
                                            value={data.duration_days}
                                            onChange={(event) =>
                                                setData(
                                                    'duration_days',
                                                    event.target.value,
                                                )
                                            }
                                            placeholder="30"
                                            required
                                        />
                                        <InputError message={errors.duration_days} />
                                    </div>
                                </div>

                                <div className="rounded-lg border bg-muted/40 p-4">
                                    <div className="flex items-start gap-3">
                                        <CreditCard className="mt-0.5 size-4 text-muted-foreground" />
                                        <div className="text-xs text-muted-foreground">
                                            <span className="font-semibold text-foreground">Duration Preview: </span>
                                            {data.duration_days ? (
                                                <>
                                                    A {data.duration_days}-day membership will expire {data.duration_days} calendar days after activation.
                                                </>
                                            ) : (
                                                'Enter duration days to preview membership term.'
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>

                            <CardFooter className="flex justify-end gap-3 border-t bg-muted/10 px-6 py-4">
                                <Button variant="outline" asChild>
                                    <Link href={membershipPlans.index()}>Cancel</Link>
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={
                                        processing ||
                                        !data.name ||
                                        !data.price ||
                                        !data.duration_days
                                    }
                                >
                                    {processing && <Spinner data-icon="inline-start" />}
                                    Create Plan
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>
                </div>
            </div>
        </>
    );
}

Create.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
        {
            title: 'Membership Plans',
            href: membershipPlans.index(),
        },
        {
            title: 'Create',
            href: membershipPlans.create(),
        },
    ],
};