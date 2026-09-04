<?php

namespace App\Http\Controllers;

use App\Enums\InterventionType;
use App\Enums\PaymentMethod;
use App\Http\Requests\StoreAttendanceRequest;
use App\Http\Requests\StoreInterventionRequest;
use App\Http\Requests\StoreMemberRequest;
use App\Http\Requests\StoreMembershipRenewalRequest;
use App\Http\Requests\StoreMembershipRequest;
use App\Http\Requests\StorePaymentRequest;
use App\Http\Requests\UpdateMemberRequest;
use App\Models\Attendance;
use App\Models\Member;
use App\Models\Membership;
use App\Models\MembershipPlan;
use App\Models\Signal;
use App\Services\AttendanceService;
use App\Services\Intelligence\InterventionService;
use App\Services\MembershipPurchaseService;
use App\Services\MembershipRenewalService;
use App\Services\PaymentService;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class MemberController extends Controller
{
    public function index(): Response
    {
        $user = auth()->user();

        $members = Member::query()
            ->where('organization_id', $user->organization_id)
            ->latest()
            ->paginate(20)
            ->through(fn (Member $member) => [
                'id' => $member->id,
                'name' => $member->name,
                'email' => $member->email,
                'phone' => $member->phone,
                'date_of_birth' => $member->date_of_birth?->toDateString(),
            ]);

        return Inertia::render('Members/Index', [
            'members' => $members,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Members/Create');
    }

    public function store(StoreMemberRequest $request): RedirectResponse
    {
        $user = $request->user();

        $member = Member::create([
            'organization_id' => $user->organization_id,
            'name' => $request->string('name')->toString(),
            'email' => $request->input('email'),
            'phone' => $request->string('phone')->toString(),
            'date_of_birth' => $request->input('date_of_birth'),
        ]);

        return redirect()
            ->route('members.show', $member);
    }

    public function show(Member $member): Response
    {
        Gate::authorize('view', $member);

        $member->load([
            'memberships.membershipPlan',
            'memberships.payments',
            'expectations',
            'goals',
            'signals.interventions',
            'interventions',
        ]);

        /*
         * lifecycle_status is a derived attribute on Membership.
         */
        $member->memberships->each(
            fn (Membership $membership) => $membership->append(
                'lifecycle_status'
            )
        );

        $member->setRelation(
            'attendances',
            $member->attendances()
                ->latest('check_in_at')
                ->limit(10)
                ->get()
        );

        $checkedInToday = Attendance::query()
            ->where('member_id', $member->id)
            ->whereDate('check_in_at', today())
            ->exists();

        return Inertia::render('Members/Show', [
            'member' => $member,
            'checkedInToday' => $checkedInToday,
        ]);
    }

    public function storeIntervention(
        StoreInterventionRequest $request,
        Member $member,
        Signal $signal,
        InterventionService $interventionService,
    ): RedirectResponse {
        Gate::authorize('view', $member);

        if ($signal->member_id !== $member->id) {
            abort(404);
        }

        $interventionService->record(
            $signal,
            InterventionType::from(
                $request->string('type')->toString()
            ),
            $request->input('notes'),
            $request->input('outcome'),
        );

        return back();
    }

    public function edit(Member $member): Response
    {
        Gate::authorize('update', $member);

        return Inertia::render('Members/Edit', [
            'member' => [
                'id' => $member->id,
                'name' => $member->name,
                'email' => $member->email,
                'phone' => $member->phone,
                'date_of_birth' => $member->date_of_birth?->toDateString(),
            ],
        ]);
    }

    public function update(
        UpdateMemberRequest $request,
        Member $member,
    ): RedirectResponse {
        Gate::authorize('update', $member);

        $member->update([
            'name' => $request->string('name')->toString(),
            'email' => $request->input('email'),
            'phone' => $request->string('phone')->toString(),
            'date_of_birth' => $request->input('date_of_birth'),
        ]);

        return redirect()
            ->route('members.show', $member);
    }

    public function destroy(Member $member): RedirectResponse
    {
        Gate::authorize('delete', $member);

        $member->delete();

        return redirect()
            ->route('members.index');
    }

    /*
     * Show the create-membership form.
     */
    public function createMembership(Member $member): Response
    {
        Gate::authorize('view', $member);

        $plans = MembershipPlan::query()
            ->where('organization_id', $member->organization_id)
            ->where('is_active', true)
            ->orderBy('name')
            ->get([
                'id',
                'name',
                'price',
                'duration_days',
            ]);

        $paymentMethods = array_map(
            fn (PaymentMethod $method) => [
                'value' => $method->value,
                'label' => $method->getLabel(),
            ],
            PaymentMethod::cases(),
        );

        return Inertia::render('Members/CreateMembership', [
            'member' => [
                'id' => $member->id,
                'name' => $member->name,
            ],

            'plans' => $plans,

            'payment_methods' => $paymentMethods,
        ]);
    }

    /*
     * Create a new membership.
     */
    public function storeMembership(
        StoreMembershipRequest $request,
        Member $member,
        MembershipPurchaseService $membershipPurchaseService,
    ): RedirectResponse {
        Gate::authorize('view', $member);

        $validated = $request->validated();

        $plan = MembershipPlan::query()
            ->where('organization_id', $member->organization_id)
            ->where('is_active', true)
            ->findOrFail(
                $validated['membership_plan_id']
            );

        $recordPayment = $request->boolean('payment');

        $paymentMethod = null;

        if ($recordPayment) {
            $paymentMethod = PaymentMethod::from(
                $validated['payment_method']
            );
        }

        $membershipPurchaseService->create(
            member: $member,
            plan: $plan,
            startDate: Carbon::parse(
                $validated['start_date']
            ),
            recordPayment: $recordPayment,
            paymentAmount: $validated['payment_amount'] ?? null,
            paymentMethod: $paymentMethod,
            paidAt: isset($validated['paid_at'])
                ? Carbon::parse($validated['paid_at'])
                : null,
        );

        return redirect()
            ->route('members.show', $member);
    }

    /*
     * Show the record-payment form.
     */
    public function createPayment(
        Member $member,
        Membership $membership,
    ): Response {
        Gate::authorize('view', $member);

        if ($membership->member_id !== $member->id) {
            abort(404);
        }

        $methods = array_map(
            fn (PaymentMethod $method) => [
                'value' => $method->value,
                'label' => $method->getLabel(),
            ],
            PaymentMethod::cases(),
        );

        return Inertia::render('Members/CreatePayment', [
            'member' => [
                'id' => $member->id,
                'name' => $member->name,
            ],

            'membership' => [
                'id' => $membership->id,
                'status' => $membership->status,
                'balance_due' => $membership->balanceDue(),
            ],

            'payment_methods' => $methods,
        ]);
    }

    /*
     * Record a payment against an existing membership.
     */
    public function storePayment(
        StorePaymentRequest $request,
        Member $member,
        Membership $membership,
        PaymentService $paymentService,
    ): RedirectResponse {
        Gate::authorize('view', $member);

        if ($membership->member_id !== $member->id) {
            abort(404);
        }

        $paymentService->create(
            $membership,
            $request->input('amount'),
            PaymentMethod::from(
                $request->string('payment_method')->toString()
            ),
            Carbon::parse($request->input('paid_at')),
        );

        return redirect()
            ->route('members.show', $member);
    }

    public function storeAttendance(
        StoreAttendanceRequest $request,
        Member $member,
        AttendanceService $attendanceService,
    ): RedirectResponse {
        Gate::authorize('view', $member);

        $attendanceService->checkIn($member);

        return back();
    }

    /*
     * Show the renewal form.
     */
    public function createRenewal(
        Member $member,
        Membership $membership,
    ): Response {
        Gate::authorize('view', $member);

        if ($membership->member_id !== $member->id) {
            abort(404);
        }

        $membership->load('membershipPlan');

        $plans = MembershipPlan::query()
            ->where('organization_id', $member->organization_id)
            ->where('is_active', true)
            ->orderBy('name')
            ->get([
                'id',
                'name',
                'price',
                'duration_days',
            ]);

        $today = Carbon::today();

        /*
         * Active membership:
         * renewal starts the day after the current membership ends.
         *
         * Expired membership:
         * renewal starts today.
         */
        $suggestedStartDate = $membership->end_date->gte($today)
            ? $membership->end_date->copy()->addDay()
            : $today;

        $paymentMethods = array_map(
            fn (PaymentMethod $method) => [
                'value' => $method->value,
                'label' => $method->getLabel(),
            ],
            PaymentMethod::cases(),
        );

        return Inertia::render('Members/RenewMembership', [
            'member' => [
                'id' => $member->id,
                'name' => $member->name,
            ],

            'membership' => [
                'id' => $membership->id,
                'start_date' => $membership->start_date,
                'end_date' => $membership->end_date,
                'price' => $membership->price,
                'lifecycle_status' => $membership->lifecycle_status,
                'membership_plan' => [
                    'name' => $membership->membershipPlan->name,
                ],
            ],

            'plans' => $plans,

            'payment_methods' => $paymentMethods,

            'suggested_start_date' => $suggestedStartDate->toDateString(),
        ]);
    }

    /*
     * Create the renewed membership and optionally record payment.
     */
    public function renewMembership(
        StoreMembershipRenewalRequest $request,
        Member $member,
        Membership $membership,
        MembershipRenewalService $membershipRenewalService,
    ): RedirectResponse {
        Gate::authorize('view', $member);

        if ($membership->member_id !== $member->id) {
            abort(404);
        }

        $validated = $request->validated();

        $plan = MembershipPlan::query()
            ->where('organization_id', $member->organization_id)
            ->where('is_active', true)
            ->findOrFail(
                $validated['membership_plan_id']
            );

        $recordPayment = $request->boolean('payment');

        $paymentMethod = null;

        if ($recordPayment) {
            $paymentMethod = PaymentMethod::from(
                $request->string('payment_method')->toString()
            );
        }

        $membershipRenewalService->renew(
            member: $member,
            membership: $membership,
            plan: $plan,
            startDate: Carbon::parse(
                $validated['start_date']
            ),
            recordPayment: $recordPayment,
            paymentAmount: $request->input('payment_amount'),
            paymentMethod: $paymentMethod,
            paidAt: $request->filled('paid_at')
                ? Carbon::parse($request->input('paid_at'))
                : null,
        );

        return redirect()
            ->route('members.show', $member);
    }
}