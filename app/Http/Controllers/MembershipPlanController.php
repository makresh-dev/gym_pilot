<?php

namespace App\Http\Controllers;

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

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
            ],
            'price' => [
                'required',
                'numeric',
                'min:0',
            ],
            'duration_days' => [
                'required',
                'integer',
                'min:1',
            ],
        ]);

        $plan = MembershipPlan::create([
            'organization_id' => $request->user()->organization_id,
            'name' => $validated['name'],
            'price' => $validated['price'],
            'duration_days' => $validated['duration_days'],
            'is_active' => true,
        ]);

        return redirect()
            ->route('membership-plans.index');
    }

    public function edit(MembershipPlan $membershipPlan): Response
    {
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
        Request $request,
        MembershipPlan $membershipPlan
    ): RedirectResponse {
        Gate::authorize('update', $membershipPlan);

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
            ],
            'price' => [
                'required',
                'numeric',
                'min:0',
            ],
            'duration_days' => [
                'required',
                'integer',
                'min:1',
            ],
        ]);

        $membershipPlan->update([
            'name' => $validated['name'],
            'price' => $validated['price'],
            'duration_days' => $validated['duration_days'],
        ]);

        return redirect()
            ->route('membership-plans.index');
    }

    public function destroy(
        MembershipPlan $membershipPlan
    ): RedirectResponse {
        Gate::authorize('delete', $membershipPlan);

        $membershipPlan->update([
            'is_active' => false,
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