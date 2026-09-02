<?php

namespace App\Http\Controllers;

use App\Services\Intelligence\InterventionService;
use App\Http\Requests\UpdateMemberRequest;
use App\Http\Requests\StoreInterventionRequest;
use App\Http\Requests\StoreMemberRequest;
use App\Enums\InterventionType;
use Illuminate\Support\Facades\Gate;
use App\Models\Member;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\Signal;
use App\Http\Requests\StoreMembershipRequest;
use App\Models\MembershipPlan;
use App\Services\MembershipService;
use App\Models\Attendance;
use Carbon\Carbon;
use App\Enums\PaymentMethod;
use App\Http\Requests\StorePaymentRequest;
use App\Models\Membership;
use App\Services\PaymentService;
use App\Http\Requests\StoreAttendanceRequest;
use App\Services\AttendanceService;


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
    Member $member
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

    return Inertia::render('Members/CreateMembership', [
        'member' => [
            'id' => $member->id,
            'name' => $member->name,
        ],
        'plans' => $plans,
    ]);
}

public function storeMembership(
    StoreMembershipRequest $request,
    Member $member,
    MembershipService $membershipService
): RedirectResponse {
    Gate::authorize('view', $member);

    $plan = MembershipPlan::findOrFail($request->input('membership_plan_id'));

    $membershipService->create(
        $member,
        $plan,
        Carbon::parse($request->input('start_date')),
    );

    return redirect()
        ->route('members.show', $member);
}

public function createPayment(
    Member $member,
    Membership $membership,
): Response {
    Gate::authorize('view', $member);

    if ($membership->member_id !== $member->id) {
        abort(404);
    }

    $methods = array_map(
        fn(PaymentMethod $m) => [
            'value' => $m->value,
            'label' => $m->getLabel(),
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

public function storePayment(
    StorePaymentRequest $request,
    Member $member,
    Membership $membership,
    PaymentService $paymentService
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

    $attendanceService->checkIn(
        $member,
        Carbon::parse($request->input('check_in_at')),
    );

    return back();
}

}