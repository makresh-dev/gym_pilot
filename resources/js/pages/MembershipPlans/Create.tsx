import { Head, Link, useForm } from '@inertiajs/react';
import * as React from 'react';

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

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div>
                    <Link
                        href={membershipPlans.index()}
                        className="text-sm text-muted-foreground hover:underline"
                    >
                        ← Back to Membership Plans
                    </Link>

                    <div className="mt-4">
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Create Membership Plan
                        </h1>

                        <p className="mt-1 text-sm text-muted-foreground">
                            Create a plan that can be used for new memberships
                            and renewals.
                        </p>
                    </div>
                </div>

                <section className="max-w-2xl rounded-xl border p-6">
                    <form
                        onSubmit={submit}
                        className="space-y-5"
                    >
                        <div>
                            <label
                                htmlFor="name"
                                className="mb-2 block text-sm font-medium"
                            >
                                Plan Name
                            </label>

                            <input
                                id="name"
                                type="text"
                                value={data.name}
                                onChange={(event) =>
                                    setData('name', event.target.value)
                                }
                                placeholder="Monthly"
                                className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                            />

                            {errors.name && (
                                <p className="mt-1 text-sm text-destructive">
                                    {errors.name}
                                </p>
                            )}
                        </div>

                        <div>
                            <label
                                htmlFor="price"
                                className="mb-2 block text-sm font-medium"
                            >
                                Price
                            </label>

                            <input
                                id="price"
                                type="number"
                                min="0"
                                step="0.01"
                                value={data.price}
                                onChange={(event) =>
                                    setData('price', event.target.value)
                                }
                                placeholder="1500.00"
                                className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                            />

                            {errors.price && (
                                <p className="mt-1 text-sm text-destructive">
                                    {errors.price}
                                </p>
                            )}
                        </div>

                        <div>
                            <label
                                htmlFor="duration_days"
                                className="mb-2 block text-sm font-medium"
                            >
                                Duration
                            </label>

                            <input
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
                                className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                            />

                            <p className="mt-1 text-xs text-muted-foreground">
                                Enter the number of days the membership lasts.
                            </p>

                            {errors.duration_days && (
                                <p className="mt-1 text-sm text-destructive">
                                    {errors.duration_days}
                                </p>
                            )}
                        </div>

                        <div className="rounded-lg border bg-muted/30 p-4">
                            <p className="text-sm font-medium">
                                Example
                            </p>

                            <p className="mt-1 text-sm text-muted-foreground">
                                A ₹1,500 plan with a 30-day duration will create
                                a membership lasting 30 calendar days.
                            </p>
                        </div>

                        <div className="flex justify-end gap-3">
                            <Link
                                href={membershipPlans.index()}
                                className="rounded-md border px-4 py-2 text-sm font-medium"
                            >
                                Cancel
                            </Link>

                            <button
                                type="submit"
                                disabled={
                                    processing ||
                                    !data.name ||
                                    !data.price ||
                                    !data.duration_days
                                }
                                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {processing
                                    ? 'Creating...'
                                    : 'Create Plan'}
                            </button>
                        </div>
                    </form>
                </section>
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