<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreMembershipPlanRequest;
use App\Http\Requests\UpdateMembershipPlanRequest;
use App\Models\MembershipPlan;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class MembershipPlanController extends Controller
{
    public function index(Request $request): Response
    {
        $organizationId = $request->user()->organization_id;

        $plans = MembershipPlan::query()
            ->where('organization_id', $organizationId)
            ->orderBy('name')
            ->get()
            ->map(fn (MembershipPlan $plan) => [
                'id' => $plan->id,
                'name' => $plan->name,
                'price' => $plan->price,
                'duration_days' => $plan->duration_days,
                'is_active' => $plan->is_active,
            ]);

        return Inertia::render('MembershipPlans/Index', [
            'plans' => $plans,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('MembershipPlans/Create');
    }

    public function store(
        StoreMembershipPlanRequest $request
    ): RedirectResponse {
        MembershipPlan::create([
            'organization_id' => $request->user()->organization_id,
            'name' => $request->validated('name'),
            'price' => $request->validated('price'),
            'duration_days' => $request->validated('duration_days'),
            'is_active' => true,
        ]);

        return redirect()
            ->route('membership-plans.index');
    }

    public function edit(
        MembershipPlan $membershipPlan
    ): Response {
        Gate::authorize('view', $membershipPlan);

        return Inertia::render('MembershipPlans/Edit', [
            'plan' => [
                'id' => $membershipPlan->id,
                'name' => $membershipPlan->name,
                'price' => $membershipPlan->price,
                'duration_days' => $membershipPlan->duration_days,
                'is_active' => $membershipPlan->is_active,
            ],
        ]);
    }

    public function update(
        UpdateMembershipPlanRequest $request,
        MembershipPlan $membershipPlan
    ): RedirectResponse {
        Gate::authorize('update', $membershipPlan);

        $membershipPlan->update([
            'name' => $request->validated('name'),
            'price' => $request->validated('price'),
            'duration_days' => $request->validated('duration_days'),
        ]);

        return redirect()
            ->route('membership-plans.index');
    }

    public function toggleStatus(
        MembershipPlan $membershipPlan
    ): RedirectResponse {
        Gate::authorize('update', $membershipPlan);

        $membershipPlan->update([
            'is_active' => ! $membershipPlan->is_active,
        ]);

        return redirect()
            ->route('membership-plans.index');
    }
}