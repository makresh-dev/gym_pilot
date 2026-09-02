import { Head, Link, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';

type MemberForm = {
    name: string;
    email: string;
    phone: string;
    date_of_birth: string;
};

export default function Create() {
    const { data, setData, post, processing, errors } = useForm<MemberForm>({
        name: '',
        email: '',
        phone: '',
        date_of_birth: '',
    });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        post('/members');
    };

    return (
        <>
            <Head title="Add Member" />

            <div className="mx-auto max-w-2xl p-6">
                <div className="mb-6">
                    <Link
                        href="/members"
                        className="text-sm text-muted-foreground hover:underline"
                    >
                        ← Back to Members
                    </Link>

                    <h1 className="mt-4 text-2xl font-semibold">
                        Add Member
                    </h1>

                    <p className="mt-1 text-sm text-muted-foreground">
                        Add a new member to your gym.
                    </p>
                </div>

                <form
                    onSubmit={submit}
                    className="space-y-5 rounded-lg border p-6"
                >
                    <div>
                        <label
                            htmlFor="name"
                            className="mb-2 block text-sm font-medium"
                        >
                            Name
                        </label>

                        <input
                            id="name"
                            type="text"
                            value={data.name}
                            onChange={(event) =>
                                setData('name', event.target.value)
                            }
                            className="w-full rounded-md border px-3 py-2"
                        />

                        {errors.name && (
                            <p className="mt-1 text-sm text-destructive">
                                {errors.name}
                            </p>
                        )}
                    </div>

                    <div>
                        <label
                            htmlFor="phone"
                            className="mb-2 block text-sm font-medium"
                        >
                            Phone
                        </label>

                        <input
                            id="phone"
                            type="tel"
                            value={data.phone}
                            onChange={(event) =>
                                setData('phone', event.target.value)
                            }
                            className="w-full rounded-md border px-3 py-2"
                        />

                        {errors.phone && (
                            <p className="mt-1 text-sm text-destructive">
                                {errors.phone}
                            </p>
                        )}
                    </div>

                    <div>
                        <label
                            htmlFor="email"
                            className="mb-2 block text-sm font-medium"
                        >
                            Email
                        </label>

                        <input
                            id="email"
                            type="email"
                            value={data.email}
                            onChange={(event) =>
                                setData('email', event.target.value)
                            }
                            className="w-full rounded-md border px-3 py-2"
                        />

                        {errors.email && (
                            <p className="mt-1 text-sm text-destructive">
                                {errors.email}
                            </p>
                        )}
                    </div>

                    <div>
                        <label
                            htmlFor="date_of_birth"
                            className="mb-2 block text-sm font-medium"
                        >
                            Date of birth
                        </label>

                        <input
                            id="date_of_birth"
                            type="date"
                            value={data.date_of_birth}
                            onChange={(event) =>
                                setData(
                                    'date_of_birth',
                                    event.target.value,
                                )
                            }
                            className="w-full rounded-md border px-3 py-2"
                        />

                        {errors.date_of_birth && (
                            <p className="mt-1 text-sm text-destructive">
                                {errors.date_of_birth}
                            </p>
                        )}
                    </div>

                    <div className="flex items-center justify-end gap-3">
                        <Link
                            href="/members"
                            className="rounded-md border px-4 py-2 text-sm font-medium"
                        >
                            Cancel
                        </Link>

                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
                        >
                            {processing ? 'Creating...' : 'Create Member'}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}