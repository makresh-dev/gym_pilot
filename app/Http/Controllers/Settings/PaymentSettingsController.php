<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PaymentSettingsController extends Controller
{
    /**
     * Show the gym's payment collection settings.
     */
    public function edit(Request $request): Response
    {
        $organization = $request->user()->organization;

        return Inertia::render('settings/payment', [
            'organization' => [
                'name' => $organization?->name,
                'upi_id' => $organization?->upi_id ?? '',
                'bank_account_name' => $organization?->bank_account_name ?? '',
                'bank_name' => $organization?->bank_name ?? '',
                'bank_account_number' => $organization?->bank_account_number ?? '',
                'bank_ifsc_code' => $organization?->bank_ifsc_code ?? '',
            ],
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Update the gym's payment collection details.
     */
    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'upi_id' => [
                'nullable',
                'string',
                'max:255',
                'regex:/^[\w.\-_]{2,256}@[a-zA-Z]{2,64}$/',
            ],
            'bank_account_name' => [
                'nullable',
                'string',
                'max:255',
            ],
            'bank_name' => [
                'nullable',
                'string',
                'max:255',
            ],
            'bank_account_number' => [
                'nullable',
                'string',
                'max:50',
            ],
            'bank_ifsc_code' => [
                'nullable',
                'string',
                'max:20',
                'regex:/^[A-Z]{4}0[A-Z0-9]{6}$/i',
            ],
        ], [
            'upi_id.regex' => 'Please enter a valid UPI ID (e.g. username@upi or 9876543210@paytm).',
            'bank_ifsc_code.regex' => 'Please enter a valid 11-character IFSC code (e.g. SBIN0001234).',
        ]);

        $organization = $request->user()->organization;

        if ($organization) {
            $organization->update([
                'upi_id' => !empty($validated['upi_id']) ? trim($validated['upi_id']) : null,
                'bank_account_name' => !empty($validated['bank_account_name']) ? trim($validated['bank_account_name']) : null,
                'bank_name' => !empty($validated['bank_name']) ? trim($validated['bank_name']) : null,
                'bank_account_number' => !empty($validated['bank_account_number']) ? trim($validated['bank_account_number']) : null,
                'bank_ifsc_code' => !empty($validated['bank_ifsc_code']) ? strtoupper(trim($validated['bank_ifsc_code'])) : null,
            ]);
        }

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Payment details updated successfully.'),
        ]);

        return to_route('payment-settings.edit');
    }
}
