import { router } from '@inertiajs/react';
import { useMemo, useState } from 'react';

type FollowUpTaskStatus = 'pending' | 'completed' | 'skipped';

type FollowUpTask = {
    id: string;
    member_id: string;
    intervention_id: string | null;
    status: FollowUpTaskStatus | string;
    due_date: string;
    completed_at: string | null;
    completion_notes: string | null;
    member?: {
        id: string;
        name: string;
    } | null;
    intervention?: {
        id: string;
        type: string;
        notes: string | null;
        outcome: string | null;
        intervened_at: string;
    } | null;
};

type FollowUpTaskPanelProps = {
    tasks: FollowUpTask[];
    memberId?: string;
    title?: string;
};

function parseDateOnly(value: string): Date {
    return new Date(`${value.slice(0, 10)}T00:00:00`);
}

function formatDate(value: string): string {
    return parseDateOnly(value).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

function getTodayKey(): string {
    return new Date().toLocaleDateString('en-CA', {
        timeZone: 'Asia/Kolkata',
    });
}

function getTaskState(task: FollowUpTask): 'overdue' | 'today' | 'upcoming' | 'completed' | 'skipped' {
    if (task.status === 'completed') {
        return 'completed';
    }

    if (task.status === 'skipped') {
        return 'skipped';
    }

    const today = getTodayKey();
    const due = task.due_date.slice(0, 10);

    if (due < today) {
        return 'overdue';
    }

    if (due === today) {
        return 'today';
    }

    return 'upcoming';
}

function getInterventionLabel(type?: string): string {
    switch (type) {
        case 'call_member':
            return 'Called member';
        case 'send_whatsapp':
            return 'Sent WhatsApp message';
        case 'in_person':
            return 'Spoke with member in person';
        case 'follow_up':
            return 'Scheduled follow-up';
        case 'other':
            return 'Other intervention';
        default:
            return type?.replace(/_/g, ' ') ?? 'Intervention';
    }
}

function getStateLabel(state: ReturnType<typeof getTaskState>): string {
    switch (state) {
        case 'overdue':
            return 'Overdue';
        case 'today':
            return 'Due today';
        case 'upcoming':
            return 'Upcoming';
        case 'completed':
            return 'Completed';
        case 'skipped':
            return 'Skipped';
    }
}

export default function FollowUpTaskPanel({
    tasks,
    memberId,
    title = 'Follow-ups',
}: FollowUpTaskPanelProps) {
    const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
    const [notesByTask, setNotesByTask] = useState<Record<string, string>>({});
    const [processingTaskId, setProcessingTaskId] = useState<string | null>(null);

    const sortedTasks = useMemo(() => {
        return [...tasks].sort((a, b) => {
            const stateOrder: Record<string, number> = {
                overdue: 0,
                today: 1,
                upcoming: 2,
                completed: 3,
                skipped: 4,
            };

            const stateA = getTaskState(a);
            const stateB = getTaskState(b);

            const orderDifference = stateOrder[stateA] - stateOrder[stateB];

            if (orderDifference !== 0) {
                return orderDifference;
            }

            return a.due_date.localeCompare(b.due_date);
        });
    }, [tasks]);

    function updateNotes(taskId: string, value: string): void {
        setNotesByTask((current) => ({
            ...current,
            [taskId]: value,
        }));
    }

    function finishTask(
        task: FollowUpTask,
        action: 'complete' | 'skip',
    ): void {
        setProcessingTaskId(task.id);

        router.patch(
            `/follow-up-tasks/${task.id}/${action}`,
            {
                completion_notes: notesByTask[task.id]?.trim() || null,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setExpandedTaskId(null);
                    setNotesByTask((current) => {
                        const next = { ...current };
                        delete next[task.id];
                        return next;
                    });
                },
                onFinish: () => {
                    setProcessingTaskId(null);
                },
            },
        );
    }

    function reopenTask(task: FollowUpTask): void {
        setProcessingTaskId(task.id);

        router.patch(
            `/follow-up-tasks/${task.id}/reopen`,
            {},
            {
                preserveScroll: true,
                onFinish: () => {
                    setProcessingTaskId(null);
                },
            },
        );
    }

    const visibleTasks = memberId
        ? sortedTasks.filter((task) => task.member_id === memberId)
        : sortedTasks;

    return (
        <section className="rounded-lg border p-5">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-lg font-semibold">{title}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Persistent tasks created from member interventions.
                    </p>
                </div>

                <span className="text-sm text-muted-foreground">
                    {visibleTasks.filter((task) => getTaskState(task) === 'overdue').length}{' '}
                    overdue · {visibleTasks.length} total
                </span>
            </div>

            {visibleTasks.length === 0 ? (
                <div className="mt-5 rounded-lg border border-dashed p-6 text-center">
                    <p className="font-medium">No follow-ups.</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Follow-ups will appear here after an intervention is recorded.
                    </p>
                </div>
            ) : (
                <div className="mt-5 space-y-3">
                    {visibleTasks.map((task) => {
                        const state = getTaskState(task);
                        const expanded = expandedTaskId === task.id;
                        const processing = processingTaskId === task.id;

                        return (
                            <article
                                key={task.id}
                                className="rounded-lg border p-4"
                            >
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span
                                                className={`rounded-full border px-2.5 py-1 text-xs font-medium ${state === 'overdue'
                                                        ? 'border-destructive/30 text-destructive'
                                                        : state === 'today'
                                                            ? 'border-amber-500/30 text-amber-600 dark:text-amber-400'
                                                            : state === 'completed'
                                                                ? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                                                                : 'border-border text-muted-foreground'
                                                    }`}
                                            >
                                                {getStateLabel(state)}
                                            </span>

                                            <span className="text-sm font-medium">
                                                {formatDate(task.due_date)}
                                            </span>
                                        </div>

                                        <p className="mt-2 font-medium">
                                            {task.member?.name ?? 'Member'}
                                        </p>

                                        {task.intervention?.type && (
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                {getInterventionLabel(task.intervention.type)}
                                            </p>
                                        )}

                                        {task.intervention?.notes && (
                                            <p className="mt-2 text-sm text-muted-foreground">
                                                {task.intervention.notes}
                                            </p>
                                        )}

                                        {task.completion_notes && (
                                            <p className="mt-2 text-sm text-muted-foreground">
                                                <span className="font-medium text-foreground">
                                                    Notes:
                                                </span>{' '}
                                                {task.completion_notes}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex shrink-0 flex-wrap gap-2">
                                        {task.member_id && (
                                            <a
                                                href={`/members/${task.member_id}`}
                                                className="rounded-md border px-3 py-2 text-sm font-medium"
                                            >
                                                Open member
                                            </a>
                                        )}

                                        {task.status === 'pending' ? (
                                            <>
                                                <button
                                                    type="button"
                                                    disabled={processing}
                                                    onClick={() => setExpandedTaskId(expanded ? null : task.id)}
                                                    className="rounded-md border px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    {expanded ? 'Close' : 'Finish'}
                                                </button>

                                                {expanded && (
                                                    <button
                                                        type="button"
                                                        disabled={processing}
                                                        onClick={() => finishTask(task, 'complete')}
                                                        className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        {processing ? 'Saving…' : 'Complete'}
                                                    </button>
                                                )}
                                            </>
                                        ) : (
                                            <button
                                                type="button"
                                                disabled={processing}
                                                onClick={() => reopenTask(task)}
                                                className="rounded-md border px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                {processing ? 'Saving…' : 'Reopen'}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {expanded && task.status === 'pending' && (
                                    <div className="mt-4 border-t pt-4">
                                        <label className="text-sm font-medium">
                                            Completion notes
                                        </label>
                                        <textarea
                                            value={notesByTask[task.id] ?? ''}
                                            onChange={(event) =>
                                                updateNotes(task.id, event.target.value)
                                            }
                                            rows={3}
                                            maxLength={5000}
                                            placeholder="What happened during the follow-up?"
                                            className="mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
                                        />

                                        <div className="mt-3 flex flex-wrap gap-2">
                                            <button
                                                type="button"
                                                disabled={processing}
                                                onClick={() => finishTask(task, 'skip')}
                                                className="rounded-md border px-3 py-2 text-sm font-medium text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                Skip instead
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </article>
                        );
                    })}
                </div>
            )}
        </section>
    );
}
