<?php

namespace App\Http\Controllers;

use App\Enums\PaymentMethod;
use App\Http\Requests\StorePaymentRequest;
use App\Models\Member;
use App\Models\Membership;
use App\Services\PaymentService;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class PaymentController extends Controller
{
    public function create(
        Member $member,
        Membership $membership,
    ): Response {
        Gate::authorize('view', $member);

        /*
         * Nested route parameters are not enough by themselves.
         * Explicitly verify that the membership belongs to the same
         * member and organization before exposing its payment form.
         */
        abort_unless(
            $membership->organization_id === $member->organization_id &&
            $membership->member_id === $member->id,
            404,
        );

        $membership->load('membershipPlan');

        $membership->append([
            'lifecycle_status',
            'amount_paid',
            'balance_due',
        ]);

        abort_if(
            $membership->balance_due <= 0,
            404,
            'Membership has no outstanding balance.',
        );

        return Inertia::render('Payments/Create', [
            'member' => [
                'id' => $member->id,
                'name' => $member->name,
            ],
            'membership' => [
                'id' => $membership->id,
                'plan' => $membership->membershipPlan->name,
                'start_date' => $membership->start_date,
                'end_date' => $membership->end_date,
                'price' => (float) $membership->price,
                'amount_paid' => (float) $membership->amount_paid,
                'balance_due' => (float) $membership->balance_due,
                'lifecycle_status' => $membership->lifecycle_status,
            ],
            'payment_methods' => collect(PaymentMethod::cases())
                ->map(fn (PaymentMethod $method) => [
                    'value' => $method->value,
                    'label' => match ($method) {
                        PaymentMethod::CASH => 'Cash',
                        PaymentMethod::UPI => 'UPI',
                        PaymentMethod::CARD => 'Card',
                        PaymentMethod::BANK_TRANSFER => 'Bank transfer',
                        PaymentMethod::OTHER => 'Other',
                    },
                ])
                ->values()
                ->all(),
        ]);
    }

    public function store(
        StorePaymentRequest $request,
        Member $member,
        Membership $membership,
        PaymentService $paymentService,
    ): RedirectResponse {
        Gate::authorize('view', $member);

        /*
         * Re-check the nested ownership boundary before recording
         * the payment.
         */
        abort_unless(
            $membership->organization_id === $member->organization_id &&
            $membership->member_id === $member->id,
            404,
        );

        $paymentService->create(
            membership: $membership,
            amount: (float) $request->validated('amount'),
            paymentMethod: PaymentMethod::from(
                $request->validated('payment_method'),
            ),
            paidAt: Carbon::parse(
                $request->validated('paid_at'),
            ),
        );

        return redirect()
            ->route('members.show', $member)
            ->with('success', 'Payment recorded successfully.');
    }
}
