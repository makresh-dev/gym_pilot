import { Head, Link, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import members from '@/routes/members';

type Expectation = {
    id: string;
    visits_per_week: number;
    start_date: string;
    end_date: string | null;
};

type Goal = {
    id: string;
    goal: string;
    start_date: string;
    end_date: string | null;
};

type Member = {
    id: string;
    name: string;
    phone: string;
};

type Props = {
    member: Member;
    currentExpectation: Expectation | null;
    currentGoal: Goal | null;
};

type ContextForm = {
    visits_per_week: string;
    goal: string;
    start_date: string;
};

const goalOptions = [
    { value: 'weight_loss', label: 'Weight loss' },
    { value: 'muscle_gain', label: 'Muscle gain' },
    { value: 'general_fitness', label: 'General fitness' },
    { value: 'strength', label: 'Strength' },
    { value: 'other', label: 'Other' },
];

function todayIndia(): string {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kolkata',
    }).format(new Date());
}

function formatGoal(goal: string | null): string {
    return goal ? goal.replace(/_/g, ' ') : 'Not set';
}

function FieldError({ message }: { message?: string }) {
    if (!message) {
        return null;
    }

    return (
        <p className="mt-1.5 text-sm text-destructive">
            {message}
        </p>
    );
}

export default function EditContext({
    member,
    currentExpectation,
    currentGoal,
}: Props) {
    const form = useForm<ContextForm>({
        visits_per_week: currentExpectation
            ? String(currentExpectation.visits_per_week)
            : '',
        goal: currentGoal?.goal ?? '',
        start_date: todayIndia(),
    });

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        form.patch(`/members/${member.id}/context`, {
            preserveScroll: true,
        });
    }

    return (
        <>
            <Head title={`Edit Context · ${member.name}`} />

            <div className="mx-auto max-w-4xl p-6">
                <div className="mb-8">
                    <Link
                        href={members.show(member.id)}
                        className="text-sm text-muted-foreground hover:text-foreground hover:underline"
                    >
                        ← Back to Member
                    </Link>

                    <div className="mt-4">
                        <h1 className="text-3xl font-semibold">
                            Edit Member Context
                        </h1>

                        <p className="mt-1 text-sm text-muted-foreground">
                            {member.name} · {member.phone}
                        </p>
                    </div>
                </div>

                <form onSubmit={submit} className="space-y-6">
                    <section className="rounded-xl border">
                        <div className="border-b px-6 py-5">
                            <h2 className="text-lg font-semibold">
                                Current context
                            </h2>

                            <p className="mt-1 text-sm text-muted-foreground">
                                These values describe what the member expects
                                and what they are currently working toward.
                            </p>
                        </div>

                        <div className="grid gap-6 p-6 lg:grid-cols-2">
                            <div className="rounded-lg border p-5">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <h3 className="font-medium">
                                            Attendance expectation
                                        </h3>

                                        <p className="mt-1 text-sm text-muted-foreground">
                                            How often the member expects to
                                            train each week.
                                        </p>
                                    </div>

                                    <span className="text-sm font-medium">
                                        {currentExpectation
                                            ? `${currentExpectation.visits_per_week}/week`
                                            : 'Not set'}
                                    </span>
                                </div>

                                <label
                                    htmlFor="visits_per_week"
                                    className="mt-5 block text-sm font-medium"
                                >
                                    Expected visits per week
                                </label>

                                <select
                                    id="visits_per_week"
                                    value={form.data.visits_per_week}
                                    onChange={(event) =>
                                        form.setData(
                                            'visits_per_week',
                                            event.target.value,
                                        )
                                    }
                                    disabled={form.processing}
                                    className="mt-1.5 h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                                >
                                    <option value="">Not set</option>

                                    {Array.from(
                                        { length: 7 },
                                        (_, index) => index + 1,
                                    ).map((value) => (
                                        <option
                                            key={value}
                                            value={value}
                                        >
                                            {value}{' '}
                                            {value === 1
                                                ? 'visit'
                                                : 'visits'}{' '}
                                            per week
                                        </option>
                                    ))}
                                </select>

                                <FieldError
                                    message={form.errors.visits_per_week}
                                />
                            </div>

                            <div className="rounded-lg border p-5">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <h3 className="font-medium">
                                            Current goal
                                        </h3>

                                        <p className="mt-1 text-sm text-muted-foreground">
                                            The member's primary training
                                            objective.
                                        </p>
                                    </div>

                                    <span className="text-right text-sm font-medium capitalize">
                                        {formatGoal(
                                            currentGoal?.goal ?? null,
                                        )}
                                    </span>
                                </div>

                                <label
                                    htmlFor="goal"
                                    className="mt-5 block text-sm font-medium"
                                >
                                    Goal
                                </label>

                                <select
                                    id="goal"
                                    value={form.data.goal}
                                    onChange={(event) =>
                                        form.setData(
                                            'goal',
                                            event.target.value,
                                        )
                                    }
                                    disabled={form.processing}
                                    className="mt-1.5 h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                                >
                                    <option value="">Not set</option>

                                    {goalOptions.map((option) => (
                                        <option
                                            key={option.value}
                                            value={option.value}
                                        >
                                            {option.label}
                                        </option>
                                    ))}
                                </select>

                                <FieldError message={form.errors.goal} />
                            </div>
                        </div>
                    </section>

                    <section className="rounded-xl border">
                        <div className="border-b px-6 py-5">
                            <h2 className="text-lg font-semibold">
                                Effective date
                            </h2>

                            <p className="mt-1 text-sm text-muted-foreground">
                                Use the date from which these values should
                                apply.
                            </p>
                        </div>

                        <div className="p-6">
                            <label
                                htmlFor="start_date"
                                className="block text-sm font-medium"
                            >
                                Effective from
                            </label>

                            <input
                                id="start_date"
                                type="date"
                                value={form.data.start_date}
                                onChange={(event) =>
                                    form.setData(
                                        'start_date',
                                        event.target.value,
                                    )
                                }
                                disabled={form.processing}
                                max={todayIndia()}
                                className="mt-1.5 h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring sm:max-w-xs"
                            />

                            <FieldError
                                message={form.errors.start_date}
                            />

                            {form.errors.context && (
                                <p className="mt-3 text-sm text-destructive">
                                    {form.errors.context}
                                </p>
                            )}

                            <div className="mt-4 rounded-lg border bg-muted/20 p-4">
                                <p className="text-sm font-medium">
                                    History is preserved
                                </p>

                                <p className="mt-1 text-sm text-muted-foreground">
                                    Saving a new context period closes the
                                    previous active period instead of deleting
                                    it. This keeps the member's historical
                                    expectations and goals available for future
                                    intelligence.
                                </p>
                            </div>
                        </div>
                    </section>

                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        <Link
                            href={members.show(member.id)}
                            className="inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-medium hover:bg-muted"
                        >
                            Cancel
                        </Link>

                        <button
                            type="submit"
                            disabled={form.processing}
                            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {form.processing
                                ? 'Saving...'
                                : 'Save context'}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}
