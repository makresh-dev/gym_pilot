import { Head, Link, useForm } from '@inertiajs/react';

type Member = {
    id: string;
    name: string;
};

type MembershipPlan = {
    id: string;
    name: string;
    price: string;
    duration_days: number;
};

type Props = {
    member: Member;
    plans: MembershipPlan[];
};

type MembershipForm = {
    membership_plan_id: string;
    start_date: string;
};

export default function CreateMembership({
    member,
    plans,
}: Props) {
    const { data, setData, post, processing, errors } =
        useForm<MembershipForm>({
            membership_plan_id: '',
            start_date: new Date()
                .toISOString()
                .split('T')[0],
        });

    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        post(`/members/${member.id}/memberships`);
    };

    return (
        <>
            <Head title={`Add Membership - ${member.name}`} />

            <div className="mx-auto max-w-2xl p-6">
                <Link
                    href={`/members/${member.id}`}
                    className="text-sm text-muted-foreground hover:underline"
                >
                    ← Back to Member
                </Link>

                <div className="mt-6">
                    <h1 className="text-2xl font-semibold">
                        Add Membership
                    </h1>

                    <p className="mt-1 text-sm text-muted-foreground">
                        Add a membership for {member.name}.
                    </p>
                </div>

                <form
                    onSubmit={submit}
                    className="mt-6 space-y-5 rounded-lg border p-6"
                >
                    <div>
                        <label
                            htmlFor="membership_plan_id"
                            className="mb-2 block text-sm font-medium"
                        >
                            Membership plan
                        </label>

                        <select
                            id="membership_plan_id"
                            value={data.membership_plan_id}
                            onChange={(event) =>
                                setData(
                                    'membership_plan_id',
                                    event.target.value,
                                )
                            }
                            className="w-full rounded-md border px-3 py-2"
                        >
                            <option value="">
                                Select a plan
                            </option>

                            {plans.map((plan) => (
                                <option
                                    key={plan.id}
                                    value={plan.id}
                                >
                                    {plan.name} — ₹{plan.price} (
                                    {plan.duration_days} days)
                                </option>
                            ))}
                        </select>

                        {errors.membership_plan_id && (
                            <p className="mt-1 text-sm text-destructive">
                                {errors.membership_plan_id}
                            </p>
                        )}
                    </div>

                    <div>
                        <label
                            htmlFor="start_date"
                            className="mb-2 block text-sm font-medium"
                        >
                            Start date
                        </label>

                        <input
                            id="start_date"
                            type="date"
                            value={data.start_date}
                            onChange={(event) =>
                                setData(
                                    'start_date',
                                    event.target.value,
                                )
                            }
                            className="w-full rounded-md border px-3 py-2"
                        />

                        {errors.start_date && (
                            <p className="mt-1 text-sm text-destructive">
                                {errors.start_date}
                            </p>
                        )}
                    </div>

                    <div className="flex justify-end gap-3">
                        <Link
                            href={`/members/${member.id}`}
                            className="rounded-md border px-4 py-2 text-sm font-medium"
                        >
                            Cancel
                        </Link>

                        <button
                            type="submit"
                            disabled={
                                processing ||
                                !data.membership_plan_id
                            }
                            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {processing
                                ? 'Creating...'
                                : 'Create Membership'}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}