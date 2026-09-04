<?php

namespace App\Services;

use App\Models\Member;
use Carbon\Carbon;

class MemberTimelineService
{
    public function build(Member $member): array
    {
        $events = [];

        /*
         * Memberships
         *
         * Membership start is a date-only domain event.
         * We deliberately do not manufacture a time for it.
         */
        foreach ($member->memberships as $membership) {
            $events[] = [
                'id' => "membership-started:{$membership->id}",
                'type' => 'membership_started',

                'occurred_at' => $membership->start_date->toDateString(),
                'occurred_at_type' => 'date',

                'data' => [
                    'membership_id' => $membership->id,
                    'plan' => $membership->membershipPlan?->name,
                    'price' => (float) $membership->price,
                    'start_date' => $membership->start_date->toDateString(),
                    'end_date' => $membership->end_date->toDateString(),
                ],
            ];
        }

        /*
         * Payments
         *
         * Payments are timestamped events.
         */
        foreach ($member->memberships as $membership) {
            foreach ($membership->payments as $payment) {
                $occurredAt = $this->toApplicationTimezone(
                    $payment->paid_at
                );

                $events[] = [
                    'id' => "payment:{$payment->id}",
                    'type' => 'payment_received',

                    'occurred_at' => $occurredAt->toISOString(),
                    'occurred_at_type' => 'datetime',

                    'data' => [
                        'payment_id' => $payment->id,
                        'membership_id' => $membership->id,
                        'amount' => (float) $payment->amount,
                        'payment_method' => $payment->payment_method,
                    ],
                ];
            }
        }

        /*
         * Attendance
         */
        foreach ($member->attendances as $attendance) {
            $occurredAt = $this->toApplicationTimezone(
                $attendance->check_in_at
            );

            $events[] = [
                'id' => "attendance:{$attendance->id}",
                'type' => 'attendance_recorded',

                'occurred_at' => $occurredAt->toISOString(),
                'occurred_at_type' => 'datetime',

                'data' => [
                    'attendance_id' => $attendance->id,
                    'source' => $attendance->source,
                ],
            ];
        }

        /*
         * Signals
         */
        foreach ($member->signals as $signal) {
            $detectedAt = $this->toApplicationTimezone(
                $signal->detected_at
            );

            $events[] = [
                'id' => "signal-detected:{$signal->id}",
                'type' => 'signal_detected',

                'occurred_at' => $detectedAt->toISOString(),
                'occurred_at_type' => 'datetime',

                'data' => [
                    'signal_id' => $signal->id,
                    'signal_type' => $signal->type->value,
                    'severity' => $signal->severity->value,
                    'evidence' => $signal->evidence,
                ],
            ];

            /*
             * Signal resolution
             */
            if ($signal->resolved_at) {
                $resolvedAt = $this->toApplicationTimezone(
                    $signal->resolved_at
                );

                $events[] = [
                    'id' => "signal-resolved:{$signal->id}",
                    'type' => 'signal_resolved',

                    'occurred_at' => $resolvedAt->toISOString(),
                    'occurred_at_type' => 'datetime',

                    'data' => [
                        'signal_id' => $signal->id,
                    ],
                ];
            }

            /*
             * Signal dismissal
             */
            if ($signal->dismissed_at) {
                $dismissedAt = $this->toApplicationTimezone(
                    $signal->dismissed_at
                );

                $events[] = [
                    'id' => "signal-dismissed:{$signal->id}",
                    'type' => 'signal_dismissed',

                    'occurred_at' => $dismissedAt->toISOString(),
                    'occurred_at_type' => 'datetime',

                    'data' => [
                        'signal_id' => $signal->id,
                        'reason' => $signal->dismissal_reason?->value,
                        'notes' => $signal->dismissal_notes,
                    ],
                ];
            }
        }

        /*
         * Interventions
         */
        foreach ($member->interventions as $intervention) {
            $occurredAt = $this->toApplicationTimezone(
                $intervention->intervened_at
            );

            $events[] = [
                'id' => "intervention:{$intervention->id}",
                'type' => 'intervention_recorded',

                'occurred_at' => $occurredAt->toISOString(),
                'occurred_at_type' => 'datetime',

                'data' => [
                    'intervention_id' => $intervention->id,
                    'signal_id' => $intervention->signal_id,
                    'type' => $intervention->type->value,
                    'notes' => $intervention->notes,
                    'outcome' => $intervention->outcome,
                ],
            ];
        }

        /*
         * Sort newest first.
         *
         * Date-only events are treated as the beginning of that
         * calendar day for ordering purposes.
         */
        usort(
            $events,
            function (array $a, array $b): int {
                return $this->sortTimestamp($b)
                    <=> $this->sortTimestamp($a);
            }
        );

        return $events;
    }

    private function toApplicationTimezone(
        Carbon|string $value
    ): Carbon {
        return Carbon::parse($value)
            ->setTimezone(config('app.timezone'));
    }

    private function sortTimestamp(array $event): int
    {
        if ($event['occurred_at_type'] === 'date') {
            return Carbon::createFromFormat(
                'Y-m-d',
                $event['occurred_at'],
                config('app.timezone'),
            )->startOfDay()->getTimestamp();
        }

        return Carbon::parse(
            $event['occurred_at']
        )->getTimestamp();
    }
}