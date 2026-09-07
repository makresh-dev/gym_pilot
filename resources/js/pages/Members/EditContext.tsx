import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Calendar, History, Target } from 'lucide-react';
import type { FormEvent } from 'react';
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

    const generalError = (form.errors as Record<string, string | undefined>).context;

    return (
        <>
            <Head title={`Edit Context · ${member.name}`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div>
                    <Button variant="ghost" size="sm" asChild className="-ml-3 mb-2 text-muted-foreground">
                        <Link href={members.show(member.id)}>
                            <ArrowLeft data-icon="inline-start" className="size-4" />
                            Back to Member Profile
                        </Link>
                    </Button>

                    <h1 className="text-2xl font-bold tracking-tight">
                        Edit Member Context & Goals
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {member.name} · {member.phone}
                    </p>
                </div>

                <div className="max-w-3xl">
                    <form onSubmit={submit} className="flex flex-col gap-6">
                        {/* Current Context Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Target Expectations & Objectives</CardTitle>
                                <CardDescription>
                                    Used by the GymPilot intelligence engine to evaluate attendance patterns and trigger early retention signals.
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="grid gap-6 sm:grid-cols-2">
                                <Card className="bg-muted/30">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="size-4 text-primary" />
                                                <CardTitle className="text-sm font-semibold">Weekly Cadence</CardTitle>
                                            </div>
                                            <Badge variant="secondary">
                                                {currentExpectation
                                                    ? `${currentExpectation.visits_per_week}/week`
                                                    : 'Not set'}
                                            </Badge>
                                        </div>
                                        <CardDescription className="text-xs">
                                            How often the member committed to train each week.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex flex-col gap-2">
                                        <Label htmlFor="visits_per_week">Expected visits per week</Label>
                                        <Select
                                            value={form.data.visits_per_week}
                                            onValueChange={(value) => form.setData('visits_per_week', value)}
                                            disabled={form.processing}
                                        >
                                            <SelectTrigger id="visits_per_week">
                                                <SelectValue placeholder="Select weekly visits" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectGroup>
                                                    <SelectItem value="">Not set</SelectItem>
                                                    {Array.from({ length: 7 }, (_, index) => index + 1).map((value) => (
                                                        <SelectItem key={value} value={String(value)}>
                                                            {value} {value === 1 ? 'visit' : 'visits'} per week
                                                        </SelectItem>
                                                    ))}
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>
                                        <InputError message={form.errors.visits_per_week} />
                                    </CardContent>
                                </Card>

                                <Card className="bg-muted/30">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Target className="size-4 text-primary" />
                                                <CardTitle className="text-sm font-semibold">Primary Goal</CardTitle>
                                            </div>
                                            <Badge variant="secondary" className="capitalize">
                                                {formatGoal(currentGoal?.goal ?? null)}
                                            </Badge>
                                        </div>
                                        <CardDescription className="text-xs">
                                            The member's primary fitness objective.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex flex-col gap-2">
                                        <Label htmlFor="goal">Goal</Label>
                                        <Select
                                            value={form.data.goal}
                                            onValueChange={(value) => form.setData('goal', value)}
                                            disabled={form.processing}
                                        >
                                            <SelectTrigger id="goal">
                                                <SelectValue placeholder="Select primary goal" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectGroup>
                                                    <SelectItem value="">Not set</SelectItem>
                                                    {goalOptions.map((option) => (
                                                        <SelectItem key={option.value} value={option.value}>
                                                            {option.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>
                                        <InputError message={form.errors.goal} />
                                    </CardContent>
                                </Card>
                            </CardContent>
                        </Card>

                        {/* Effective Date Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Effective Date</CardTitle>
                                <CardDescription>
                                    The starting date for this context period. Historical records are preserved.
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="flex flex-col gap-4">
                                <div className="flex flex-col gap-2 sm:max-w-xs">
                                    <Label htmlFor="start_date">Effective from</Label>
                                    <Input
                                        id="start_date"
                                        type="date"
                                        value={form.data.start_date}
                                        onChange={(event) =>
                                            form.setData('start_date', event.target.value)
                                        }
                                        disabled={form.processing}
                                        max={todayIndia()}
                                    />
                                    <InputError message={form.errors.start_date} />
                                </div>

                                {generalError && (
                                    <p className="text-sm text-destructive">{generalError}</p>
                                )}

                                <div className="rounded-lg border bg-muted/40 p-4">
                                    <div className="flex items-start gap-3">
                                        <History className="mt-0.5 size-4 text-muted-foreground" />
                                        <div className="text-xs text-muted-foreground">
                                            <span className="font-semibold text-foreground">History is preserved: </span>
                                            Saving a new context period automatically archives the previous one. This maintains full historical records for retention analysis.
                                        </div>
                                    </div>
                                </div>
                            </CardContent>

                            <div className="flex items-center justify-end gap-3 border-t bg-muted/10 px-6 py-4">
                                <Button variant="outline" asChild>
                                    <Link href={members.show(member.id)}>Cancel</Link>
                                </Button>
                                <Button type="submit" disabled={form.processing}>
                                    {form.processing && <Spinner data-icon="inline-start" />}
                                    Save Context
                                </Button>
                            </div>
                        </Card>
                    </form>
                </div>
            </div>
        </>
    );
}
