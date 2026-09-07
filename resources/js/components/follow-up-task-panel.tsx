import { router } from '@inertiajs/react';
import {
    AlertCircle,
    Calendar,
    CheckCircle2,
    Clock,
    RotateCcw,
    User,
    XCircle,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';

type FollowUpTaskStatus = 'pending' | 'completed' | 'skipped';

export type FollowUpTask = {
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
        intervened_at: string | null;
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

function getStateBadge(state: ReturnType<typeof getTaskState>) {
    switch (state) {
        case 'overdue':
            return (
                <Badge variant="destructive" className="gap-1">
                    <AlertCircle className="size-3" />
                    Overdue
                </Badge>
            );
        case 'today':
            return (
                <Badge variant="outline" className="gap-1 border-amber-500/30 text-amber-600 dark:text-amber-400">
                    <Clock className="size-3" />
                    Due today
                </Badge>
            );
        case 'upcoming':
            return (
                <Badge variant="secondary" className="gap-1">
                    <Calendar className="size-3" />
                    Upcoming
                </Badge>
            );
        case 'completed':
            return (
                <Badge variant="outline" className="gap-1 border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="size-3" />
                    Completed
                </Badge>
            );
        case 'skipped':
            return (
                <Badge variant="secondary" className="gap-1 text-muted-foreground">
                    <XCircle className="size-3" />
                    Skipped
                </Badge>
            );
    }
}

export default function FollowUpTaskPanel({
    tasks,
    memberId,
    title = 'Follow-up Tasks',
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

    const overdueCount = visibleTasks.filter((t) => getTaskState(t) === 'overdue').length;

    return (
        <Card>
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
                <div>
                    <CardTitle className="text-base font-semibold">{title}</CardTitle>
                    <CardDescription>
                        Action items scheduled from retention signals and staff interventions.
                    </CardDescription>
                </div>

                <div className="flex items-center gap-2">
                    {overdueCount > 0 && (
                        <Badge variant="destructive">{overdueCount} overdue</Badge>
                    )}
                    <Badge variant="secondary">{visibleTasks.length} total</Badge>
                </div>
            </CardHeader>

            <CardContent className="p-4 sm:p-6">
                {visibleTasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center">
                        <Clock className="size-8 text-muted-foreground/40" />
                        <p className="mt-3 text-sm font-semibold">No follow-ups scheduled</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Scheduled follow-ups created during member touchpoints will appear here.
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {visibleTasks.map((task) => {
                            const state = getTaskState(task);
                            const expanded = expandedTaskId === task.id;
                            const processing = processingTaskId === task.id;

                            return (
                                <Card key={task.id} className="transition hover:border-primary/40">
                                    <CardContent className="flex flex-col gap-3 p-4">
                                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                            <div className="flex flex-col gap-1.5">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    {getStateBadge(state)}
                                                    <span className="text-xs font-semibold text-foreground">
                                                        Due {formatDate(task.due_date)}
                                                    </span>
                                                </div>

                                                {!memberId && task.member && (
                                                    <div className="flex items-center gap-1.5 font-medium text-sm">
                                                        <User className="size-3.5 text-muted-foreground" />
                                                        {task.member.name}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Action buttons */}
                                            <div className="flex items-center gap-2 self-end sm:self-start">
                                                {state !== 'completed' && state !== 'skipped' && !expanded && (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            onClick={() => setExpandedTaskId(task.id)}
                                                        >
                                                            Resolve Task
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            disabled={processing}
                                                            onClick={() => finishTask(task, 'skip')}
                                                        >
                                                            Skip
                                                        </Button>
                                                    </>
                                                )}

                                                {(state === 'completed' || state === 'skipped') && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        disabled={processing}
                                                        onClick={() => reopenTask(task)}
                                                    >
                                                        {processing ? (
                                                            <Spinner data-icon="inline-start" />
                                                        ) : (
                                                            <RotateCcw data-icon="inline-start" className="size-3.5" />
                                                        )}
                                                        Reopen
                                                    </Button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Intervention context if available */}
                                        {task.intervention && (
                                            <div className="rounded-md bg-muted/40 p-3 text-xs text-muted-foreground">
                                                <span className="font-semibold text-foreground">
                                                    Origin:{' '}
                                                </span>
                                                {getInterventionLabel(task.intervention.type)}
                                                {task.intervention.notes && ` — "${task.intervention.notes}"`}
                                                {task.intervention.outcome && (
                                                    <span className="block mt-1 font-medium text-foreground">
                                                        Previous outcome: {task.intervention.outcome}
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        {/* Resolution expansion */}
                                        {expanded && (
                                            <div className="mt-2 flex flex-col gap-3 border-t pt-3">
                                                <Textarea
                                                    placeholder="Add completion notes or member response (optional)..."
                                                    value={notesByTask[task.id] || ''}
                                                    onChange={(e) => updateNotes(task.id, e.target.value)}
                                                    className="min-h-20"
                                                />

                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setExpandedTaskId(null)}
                                                    >
                                                        Cancel
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        disabled={processing}
                                                        onClick={() => finishTask(task, 'skip')}
                                                    >
                                                        Mark as Skipped
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        disabled={processing}
                                                        onClick={() => finishTask(task, 'complete')}
                                                    >
                                                        {processing && <Spinner data-icon="inline-start" />}
                                                        Complete Task
                                                    </Button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Completion notes display */}
                                        {task.completion_notes && (
                                            <div className="rounded-md border bg-muted/20 p-2.5 text-xs text-muted-foreground">
                                                <span className="font-semibold text-foreground">Resolution notes: </span>
                                                {task.completion_notes}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
