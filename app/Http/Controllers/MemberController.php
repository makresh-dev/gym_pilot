<?php

namespace App\Http\Controllers;

use App\Enums\PaymentMethod;
use App\Enums\SignalDismissalReason;
use App\Http\Requests\DismissSignalRequest;
use App\Http\Requests\StoreAttendanceRequest;
use App\Http\Requests\StoreInterventionRequest;
use App\Http\Requests\StoreMemberRequest;
use App\Http\Requests\StoreMembershipRenewalRequest;
use App\Http\Requests\StoreMembershipRequest;
use App\Http\Requests\StorePaymentRequest;
use App\Http\Requests\UpdateMemberRequest;
use App\Models\Attendance;
use App\Models\FollowUpTask;
use App\Models\Member;
use App\Models\MemberAccount;
use App\Models\Membership;
use App\Models\MembershipPlan;
use App\Models\Signal;
use App\Services\AttendanceService;
use App\Services\Intelligence\InterventionService;
use App\Services\Intelligence\SignalLifecycleService;
use App\Services\MemberTimelineService;
use App\Services\MembershipPurchaseService;
use App\Services\MembershipRenewalService;
use App\Services\PaymentService;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class MemberController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        $search = trim(
            $request->string('search')->toString()
        );

        $membershipStatus = $request
            ->string('membership_status')
            ->toString();

        if (! in_array(
            $membershipStatus,
            ['active', 'expiring', 'expired', 'none'],
            true
        )) {
            $membershipStatus = '';
        }

        $financialStatus = $request
            ->string('financial_status')
            ->toString();

        if (! in_array(
            $financialStatus,
            ['paid', 'outstanding'],
            true
        )) {
            $financialStatus = '';
        }

        $today = Carbon::today();
        $expiringCutoff = $today->copy()->addDays(7);

        $hasActiveMembership = function ($query) use ($today) {
            $query
                ->where('status', 'active')
                ->whereDate('start_date', '<=', $today)
                ->whereDate('end_date', '>=', $today);
        };

        $hasOutstandingMembership = function ($query) {
            $query->whereRaw(
                'memberships.price > (
                    SELECT COALESCE(SUM(payments.amount), 0)
                    FROM payments
                    WHERE payments.membership_id = memberships.id
                )'
            );
        };

        $members = Member::query()
            ->where(
                'organization_id',
                $user->organization_id
            )
            ->with([
                'memberships' => function ($query) {
                    $query
                        ->with('payments')
                        ->orderByDesc('start_date')
                        ->orderByDesc('end_date');
                },
            ])
            ->when(
                $search !== '',
                function ($query) use ($search) {
                    $query->where(function ($query) use ($search) {
                        $query
                            ->where(
                                'name',
                                'ilike',
                                "%{$search}%"
                            )
                            ->orWhere(
                                'phone',
                                'ilike',
                                "%{$search}%"
                            )
                            ->orWhere(
                                'email',
                                'ilike',
                                "%{$search}%"
                            );
                    });
                }
            )
            ->when(
                $membershipStatus === 'active',
                function ($query) use ($today, $expiringCutoff) {
                    $query->whereHas(
                        'memberships',
                        function ($query) use (
                            $today,
                            $expiringCutoff,
                        ) {
                            $query
                                ->where('status', 'active')
                                ->whereDate(
                                    'start_date',
                                    '<=',
                                    $today
                                )
                                ->whereDate(
                                    'end_date',
                                    '>=',
                                    $today
                                )
                                ->whereDate(
                                    'end_date',
                                    '>',
                                    $expiringCutoff
                                );
                        }
                    );
                }
            )
            ->when(
                $membershipStatus === 'expiring',
                function ($query) use ($today, $expiringCutoff) {
                    $query->whereHas(
                        'memberships',
                        function ($query) use (
                            $today,
                            $expiringCutoff,
                        ) {
                            $query
                                ->where('status', 'active')
                                ->whereDate(
                                    'start_date',
                                    '<=',
                                    $today
                                )
                                ->whereDate(
                                    'end_date',
                                    '>=',
                                    $today
                                )
                                ->whereDate(
                                    'end_date',
                                    '<=',
                                    $expiringCutoff
                                );
                        }
                    );
                }
            )
            ->when(
                $membershipStatus === 'expired',
                function ($query) use (
                    $hasActiveMembership,
                    $today,
                ) {
                    $query
                        ->whereDoesntHave(
                            'memberships',
                            $hasActiveMembership
                        )
                        ->whereHas(
                            'memberships',
                            function ($query) use ($today) {
                                $query->whereDate(
                                    'end_date',
                                    '<',
                                    $today
                                );
                            }
                        );
                }
            )
            ->when(
                $membershipStatus === 'none',
                function ($query) use (
                    $hasActiveMembership,
                    $today,
                ) {
                    $query
                        ->whereDoesntHave(
                            'memberships',
                            $hasActiveMembership
                        )
                        ->whereDoesntHave(
                            'memberships',
                            function ($query) use ($today) {
                                $query->whereDate(
                                    'end_date',
                                    '<',
                                    $today
                                );
                            }
                        );
                }
            )
            ->when(
                $financialStatus === 'outstanding',
                function ($query) use ($hasOutstandingMembership) {
                    $query->whereHas(
                        'memberships',
                        $hasOutstandingMembership
                    );
                }
            )
            ->when(
                $financialStatus === 'paid',
                function ($query) use ($hasOutstandingMembership) {
                    $query->whereDoesntHave(
                        'memberships',
                        $hasOutstandingMembership
                    );
                }
            )
            ->latest()
            ->paginate(20)
            ->withQueryString()
            ->through(
                function (Member $member) use (
                    $today,
                    $expiringCutoff,
                ) {
                    $activeMembership = $member->memberships
                        ->filter(
                            fn (Membership $membership) =>
                                $membership->isActive($today)
                        )
                        ->sortBy('end_date')
                        ->first();

                    $latestExpiredMembership = $member->memberships
                        ->filter(
                            fn (Membership $membership) =>
                                $membership->isExpired($today)
                        )
                        ->sortByDesc('end_date')
                        ->first();

                    if ($activeMembership) {
                        $memberStatus =
                            $activeMembership->end_date->lte(
                                $expiringCutoff
                            )
                                ? 'expiring'
                                : 'active';

                        $membershipExpiresAt = $activeMembership
                            ->end_date
                            ->toDateString();
                    } elseif ($latestExpiredMembership) {
                        $memberStatus = 'expired';

                        $membershipExpiresAt = $latestExpiredMembership
                            ->end_date
                            ->toDateString();
                    } else {
                        $memberStatus = 'none';
                        $membershipExpiresAt = null;
                    }

                    $totalBalanceDue = $member->memberships->sum(
                        fn (Membership $membership) =>
                            $membership->balanceDue()
                    );

                    return [
                        'id' => $member->id,
                        'name' => $member->name,
                        'email' => $member->email,
                        'phone' => $member->phone,
                        'date_of_birth' =>
                            $member->date_of_birth?->toDateString(),

                        'membership_status' => $memberStatus,
                        'financial_status' => $totalBalanceDue > 0
                            ? 'outstanding'
                            : 'paid',
                        'membership_expires_at' =>
                            $membershipExpiresAt,
                        'balance_due' => round(
                            $totalBalanceDue,
                            2
                        ),
                    ];
                }
            );

        return Inertia::render('Members/Index', [
            'members' => $members,
            'search' => $search,
            'membership_status' => $membershipStatus,
            'financial_status' => $financialStatus,
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

    public function show(
        Member $member,
        MemberTimelineService $timelineService,
    ): Response {
        Gate::authorize('view', $member);

        $member->load([
            'memberships.membershipPlan',
            'memberships.payments',
            'expectations',
            'goals',

            'signals' => function ($query) {
                $query
                    ->with('interventions')
                    ->latest('detected_at');
            },

            'interventions' => function ($query) {
                $query->latest('intervened_at');
            },
        ]);

        $member->memberships->each(
            fn (Membership $membership) => $membership->append([
                'lifecycle_status',
                'amount_paid',
                'balance_due',
            ])
        );

        $today = Carbon::today();
        $expiringCutoff = $today->copy()->addDays(7);

        $currentMembership = $member->memberships
            ->filter(
                fn (Membership $membership) =>
                    $membership->isActive($today)
            )
            ->sortBy('end_date')
            ->first();

        $latestExpiredMembership = $member->memberships
            ->filter(
                fn (Membership $membership) =>
                    $membership->isExpired($today)
            )
            ->sortByDesc('end_date')
            ->first();

        if ($currentMembership) {
            $membershipStatus = $currentMembership->end_date->lte(
                $expiringCutoff
            )
                ? 'expiring'
                : 'active';

            $membershipExpiresAt = $currentMembership
                ->end_date
                ->toDateString();
        } elseif ($latestExpiredMembership) {
            $membershipStatus = 'expired';
            $membershipExpiresAt = $latestExpiredMembership
                ->end_date
                ->toDateString();
        } else {
            $membershipStatus = 'none';
            $membershipExpiresAt = null;
        }

        $totalBalanceDue = $member->memberships->sum(
            fn (Membership $membership) =>
                $membership->balanceDue()
        );

        $operationalStatus = [
            'membership_status' => $membershipStatus,
            'financial_status' => $totalBalanceDue > 0
                ? 'outstanding'
                : 'paid',
            'membership_expires_at' => $membershipExpiresAt,
            'balance_due' => round($totalBalanceDue, 2),
        ];

        $member->interventions->each(function ($intervention) use ($member) {
            $intervenedDate = $intervention->intervened_at?->copy()->startOfDay();

            if (! $intervenedDate) {
                $intervention->setAttribute('signal_type', null);
                $intervention->setAttribute('signal_severity', null);
                $intervention->setAttribute('attendance_before_14d', null);
                $intervention->setAttribute('attendance_after_14d', null);
                $intervention->setAttribute('attendance_change', null);
                $intervention->setAttribute('follow_up_status', 'unavailable');

                return;
            }

            $signal = $member->signals
                ->firstWhere('id', $intervention->signal_id);

            $beforeStart = $intervenedDate->copy()->subDays(14);
            $beforeEnd = $intervenedDate->copy()->subDay();
            $followUpEnd = $intervenedDate->copy()->addDays(13);
            $today = Carbon::today();

            $afterEnd = $followUpEnd->lte($today)
                ? $followUpEnd
                : $today;

            $beforeCount = Attendance::query()
                ->where('organization_id', $member->organization_id)
                ->where('member_id', $member->id)
                ->whereBetween('check_in_at', [
                    $beforeStart->startOfDay(),
                    $beforeEnd->endOfDay(),
                ])
                ->count();

            $afterCount = Attendance::query()
                ->where('organization_id', $member->organization_id)
                ->where('member_id', $member->id)
                ->whereBetween('check_in_at', [
                    $intervenedDate->startOfDay(),
                    $afterEnd->endOfDay(),
                ])
                ->count();

            $intervention->setAttribute(
                'signal_type',
                $signal?->type?->value
            );
            $intervention->setAttribute(
                'signal_severity',
                $signal?->severity?->value
            );
            $intervention->setAttribute(
                'attendance_before_14d',
                $beforeCount
            );
            $intervention->setAttribute(
                'attendance_after_14d',
                $afterCount
            );
            $intervention->setAttribute(
                'attendance_change',
                $afterCount - $beforeCount
            );
            $intervention->setAttribute(
                'follow_up_status',
                $followUpEnd->lte($today)
                    ? 'ready'
                    : 'in_progress'
            );
        });

        $member->setRelation(
            'attendances',
            $member->attendances()
                ->latest('check_in_at')
                ->limit(50)
                ->get()
        );

        $checkedInToday = Attendance::query()
            ->where('organization_id', $member->organization_id)
            ->where('member_id', $member->id)
            ->whereDate('check_in_at', today())
            ->exists();

        $timeline = $timelineService->build($member);

        /*
         * Persistent follow-up tasks for this member.
         *
         * Staff assignment is intentionally not exposed in the MVP.
         * assigned_to_user_id remains nullable in the database for the
         * future multi-staff subscription tier.
         */
        $followUpTasks = FollowUpTask::query()
            ->where('organization_id', $member->organization_id)
            ->where('member_id', $member->id)
            ->with([
                'intervention:id,signal_id,type,notes,outcome,intervened_at',
            ])
            ->orderByRaw(
                "CASE WHEN status = 'pending' THEN 0 ELSE 1 END"
            )
            ->orderBy('due_date')
            ->get([
                'id',
                'member_id',
                'intervention_id',
                'status',
                'due_date',
                'completed_at',
                'completion_notes',
            ]);

        return Inertia::render('Members/Show', [
            'member' => $member,
            'operationalStatus' => $operationalStatus,
            'timeline' => $timeline,
            'checkedInToday' => $checkedInToday,
            'followUpTasks' => $followUpTasks,
        ]);
    }

    public function storeIntervention(
        StoreInterventionRequest $request,
        Member $member,
        InterventionService $interventionService,
    ): RedirectResponse {
        Gate::authorize('view', $member);

        $signal = Signal::query()
            ->where('organization_id', $member->organization_id)
            ->where('member_id', $member->id)
            ->findOrFail(
                $request->validated('signal_id')
            );

        $interventionService->record(
            signal: $signal,
            member: $member,
            type: $request->validated('type'),
            notes: $request->validated('notes'),
            outcome: $request->validated('outcome'),
            intervenedAt: $request->validated('intervened_at'),
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

    public function enableMobileAccess(
        Request $request,
        Member $member,
    ): RedirectResponse {
        Gate::authorize('update', $member);

        $validated = $request->validate([
            'password' => [
                'required',
                'string',
                'min:8',
                'max:255',
            ],
        ]);

        if ($member->account()->exists()) {
            return back()->withErrors([
                'mobile_access' =>
                    'Mobile access is already enabled for this member.',
            ]);
        }

        MemberAccount::create([
            'member_id' => $member->id,
            'password' => $validated['password'],
        ]);

        return back()->with(
            'success',
            'Mobile access enabled successfully.'
        );
    }

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

    public function editContext(Member $member): Response
    {
        Gate::authorize('update', $member);

        $today = Carbon::today();

        $currentExpectation = $member->expectations()
            ->whereDate('start_date', '<=', $today)
            ->where(function ($query) use ($today) {
                $query
                    ->whereNull('end_date')
                    ->orWhereDate('end_date', '>=', $today);
            })
            ->latest('start_date')
            ->first();

        $currentGoal = $member->goals()
            ->whereDate('start_date', '<=', $today)
            ->where(function ($query) use ($today) {
                $query
                    ->whereNull('end_date')
                    ->orWhereDate('end_date', '>=', $today);
            })
            ->latest('start_date')
            ->first();

        return Inertia::render('Members/EditContext', [
            'member' => [
                'id' => $member->id,
                'name' => $member->name,
                'phone' => $member->phone,
            ],
            'currentExpectation' => $currentExpectation,
            'currentGoal' => $currentGoal,
        ]);
    }

    public function updateContext(
        Request $request,
        Member $member,
    ): RedirectResponse {
        Gate::authorize('update', $member);

        $validated = $request->validate([
            'visits_per_week' => [
                'nullable',
                'integer',
                'min:1',
                'max:7',
            ],
            'goal' => [
                'nullable',
                'string',
                'max:100',
            ],
            'start_date' => [
                'required',
                'date',
                'before_or_equal:today',
            ],
        ]);

        $visitsPerWeek = $validated['visits_per_week'] ?? null;

        $goal = filled($validated['goal'] ?? null)
            ? trim($validated['goal'])
            : null;

        if ($visitsPerWeek === null && $goal === null) {
            return back()->withErrors([
                'context' =>
                    'Set an expected visit frequency or a goal.',
            ]);
        }

        $startDate = Carbon::parse(
            $validated['start_date']
        )->startOfDay();

        $currentExpectation = $member->expectations()
            ->whereNull('end_date')
            ->latest('start_date')
            ->first();

        $currentGoal = $member->goals()
            ->whereNull('end_date')
            ->latest('start_date')
            ->first();

        if (
            $currentExpectation &&
            $startDate->lt($currentExpectation->start_date)
        ) {
            return back()->withErrors([
                'start_date' =>
                    'Expected visits cannot start before the current expectation.',
            ]);
        }

        if (
            $currentGoal &&
            $startDate->lt($currentGoal->start_date)
        ) {
            return back()->withErrors([
                'start_date' =>
                    'Goal cannot start before the current goal.',
            ]);
        }

        DB::transaction(function () use (
            $member,
            $visitsPerWeek,
            $goal,
            $startDate,
            $currentExpectation,
            $currentGoal,
        ) {
            $previousDay = $startDate->copy()->subDay();

            /*
             * Attendance expectation history
             */
            if ($currentExpectation) {
                if (
                    $startDate->equalTo(
                        $currentExpectation->start_date
                    )
                ) {
                    if ($visitsPerWeek === null) {
                        $currentExpectation->update([
                            'end_date' =>
                                $previousDay->toDateString(),
                        ]);
                    } else {
                        $currentExpectation->update([
                            'visits_per_week' =>
                                $visitsPerWeek,
                        ]);
                    }
                } else {
                    $currentExpectation->update([
                        'end_date' =>
                            $previousDay->toDateString(),
                    ]);

                    if ($visitsPerWeek !== null) {
                        $member->expectations()->create([
                            'visits_per_week' =>
                                $visitsPerWeek,
                            'start_date' =>
                                $startDate->toDateString(),
                            'end_date' => null,
                        ]);
                    }
                }
            } elseif ($visitsPerWeek !== null) {
                $member->expectations()->create([
                    'visits_per_week' => $visitsPerWeek,
                    'start_date' =>
                        $startDate->toDateString(),
                    'end_date' => null,
                ]);
            }

            /*
             * Goal history
             */
            if ($currentGoal) {
                if (
                    $startDate->equalTo(
                        $currentGoal->start_date
                    )
                ) {
                    if ($goal === null) {
                        $currentGoal->update([
                            'end_date' =>
                                $previousDay->toDateString(),
                        ]);
                    } else {
                        $currentGoal->update([
                            'goal' => $goal,
                        ]);
                    }
                } else {
                    $currentGoal->update([
                        'end_date' =>
                            $previousDay->toDateString(),
                    ]);

                    if ($goal !== null) {
                        $member->goals()->create([
                            'goal' => $goal,
                            'start_date' =>
                                $startDate->toDateString(),
                            'end_date' => null,
                        ]);
                    }
                }
            } elseif ($goal !== null) {
                $member->goals()->create([
                    'goal' => $goal,
                    'start_date' =>
                        $startDate->toDateString(),
                    'end_date' => null,
                ]);
            }
        });

        return redirect()
            ->route('members.show', $member);
    }

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

    public function storeAttendance(
        StoreAttendanceRequest $request,
        Member $member,
        AttendanceService $attendanceService,
    ): RedirectResponse {
        Gate::authorize('view', $member);

        try {
            $attendanceService->checkIn($member);
        } catch (RuntimeException $exception) {
            return back()->withErrors([
                'attendance' => $exception->getMessage(),
            ]);
        }

        return back();
    }

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
            'suggested_start_date' => $suggestedStartDate,
        ]);
    }

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

    public function dismissSignal(
        DismissSignalRequest $request,
        Member $member,
        Signal $signal,
        SignalLifecycleService $lifecycleService,
    ): RedirectResponse {
        $organizationId = auth()->user()->organization_id;

        abort_unless(
            $member->organization_id === $organizationId
                && $signal->organization_id === $organizationId
                && $signal->member_id === $member->id,
            404,
        );

        $lifecycleService->dismiss(
            signal: $signal,
            reason: SignalDismissalReason::from(
                $request->validated('reason'),
            ),
            notes: $request->validated('notes'),
            dismissedBy: auth()->id(),
        );

        return back();
    }
}