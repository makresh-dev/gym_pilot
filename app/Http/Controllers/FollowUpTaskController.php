<?php

namespace App\Http\Controllers;

use App\Http\Requests\CompleteFollowUpTaskRequest;
use App\Models\FollowUpTask;
use App\Services\Intelligence\FollowUpTaskService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;

class FollowUpTaskController extends Controller
{
    public function complete(
        CompleteFollowUpTaskRequest $request,
        FollowUpTask $followUpTask,
        FollowUpTaskService $followUpTaskService,
    ): RedirectResponse {
        $this->authorizeTask($followUpTask);

        $followUpTaskService->complete(
            followUpTask: $followUpTask,
            completionNotes: $request->validated('completion_notes'),
        );

        return back();
    }

    public function skip(
        CompleteFollowUpTaskRequest $request,
        FollowUpTask $followUpTask,
        FollowUpTaskService $followUpTaskService,
    ): RedirectResponse {
        $this->authorizeTask($followUpTask);

        $followUpTaskService->skip(
            followUpTask: $followUpTask,
            completionNotes: $request->validated('completion_notes'),
        );

        return back();
    }

    public function reopen(
        FollowUpTask $followUpTask,
        FollowUpTaskService $followUpTaskService,
    ): RedirectResponse {
        $this->authorizeTask($followUpTask);

        $followUpTaskService->reopen(
            followUpTask: $followUpTask,
        );

        return back();
    }

    private function authorizeTask(FollowUpTask $followUpTask): void
    {
        /*
         * Tenant boundary:
         * the task must belong to the authenticated user's organization.
         */
        $user = auth()->user();

        abort_unless(
            $user &&
            $followUpTask->organization_id === $user->organization_id,
            403,
        );

        /*
         * Reuse the existing Member authorization rules.
         * Follow-ups are ultimately member-specific operational data.
         */
        Gate::authorize('view', $followUpTask->member);
    }
}