<?php

use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\FollowUpTaskController;
use App\Http\Controllers\MemberController;
use App\Http\Controllers\MembershipPlanController;
use App\Http\Controllers\PaymentController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth'])->group(function () {

    /*
    |--------------------------------------------------------------------------
    | Dashboard
    |--------------------------------------------------------------------------
    */

    Route::get('/dashboard', DashboardController::class)
        ->name('dashboard');


    /*
    |--------------------------------------------------------------------------
    | Payment
    |--------------------------------------------------------------------------
    */

    Route::get(
        'members/{member}/memberships/{membership}/payments/create',
        [PaymentController::class, 'create']
    )->name('members.memberships.payments.create');

    Route::post(
        'members/{member}/memberships/{membership}/payments',
        [PaymentController::class, 'store']
    )->name('members.memberships.payments.store');


    /*
    |--------------------------------------------------------------------------
    | Follow-up Tasks
    |--------------------------------------------------------------------------
    */

    Route::patch(
        'follow-up-tasks/{followUpTask}/complete',
        [FollowUpTaskController::class, 'complete']
    )->name('follow-up-tasks.complete');

    Route::patch(
        'follow-up-tasks/{followUpTask}/skip',
        [FollowUpTaskController::class, 'skip']
    )->name('follow-up-tasks.skip');

    Route::patch(
        'follow-up-tasks/{followUpTask}/reopen',
        [FollowUpTaskController::class, 'reopen']
    )->name('follow-up-tasks.reopen');


    /*
    |--------------------------------------------------------------------------
    | Members
    |--------------------------------------------------------------------------
    */

    Route::resource('members', MemberController::class)
        ->only([
            'index',
            'create',
            'store',
            'show',
            'edit',
            'update',
            'destroy',
        ]);
    
    Route::get(
        'members/{member}/context/edit',
        [MemberController::class, 'editContext'],
    )->name('members.context.edit');

    Route::patch(
        'members/{member}/context',
        [MemberController::class, 'updateContext'],
    )->name('members.context.update');



    /*
    |--------------------------------------------------------------------------
    | Memberships
    |--------------------------------------------------------------------------
    */

    Route::get(
        '/members/{member}/memberships/create',
        [MemberController::class, 'createMembership']
    )->name('members.memberships.create');

    Route::post(
        '/members/{member}/memberships',
        [MemberController::class, 'storeMembership']
    )->name('members.memberships.store');

    Route::patch(
        '/members/{member}/memberships/{membership}',
        [MemberController::class, 'updateMembership']
    )->name('members.memberships.update');


    /*
    |--------------------------------------------------------------------------
    | Membership Renewal
    |--------------------------------------------------------------------------
    */

    Route::get(
        '/members/{member}/memberships/{membership}/renew',
        [MemberController::class, 'createRenewal']
    )->name('memberships.renew.create');

    Route::post(
        '/members/{member}/memberships/{membership}/renew',
        [MemberController::class, 'renewMembership']
    )->name('memberships.renew');


    /*
    |--------------------------------------------------------------------------
    | Attendance
    |--------------------------------------------------------------------------
    */

    Route::post(
        '/members/{member}/attendance',
        [MemberController::class, 'storeAttendance']
    )->name('members.attendance.store');

    Route::get(
        '/attendance/search',
        [AttendanceController::class, 'search']
    )->name('attendance.search');

    Route::get(
        '/attendance',
        [AttendanceController::class, 'index']
    )->name('attendance.index');

    Route::post(
        '/attendance',
        [AttendanceController::class, 'store']
    )->name('attendance.store');

    Route::get(
        '/attendance/{member}/status',
        [AttendanceController::class, 'status']
    )->name('attendance.status');


    /*
    |--------------------------------------------------------------------------
    | Membership Plans
    |--------------------------------------------------------------------------
    */

    Route::resource('membership-plans', MembershipPlanController::class)
        ->except(['show']);

    Route::patch(
        '/membership-plans/{membershipPlan}/toggle-status',
        [MembershipPlanController::class, 'toggleStatus']
    )->name('membership-plans.toggle-status');


    /*
    |--------------------------------------------------------------------------
    | Interventions
    |--------------------------------------------------------------------------
    */

    Route::post(
        '/members/{member}/interventions',
        [MemberController::class, 'storeIntervention']
    )->name('members.interventions.store');

    Route::post(
        '/members/{member}/signals/{signal}/interventions',
        [MemberController::class, 'storeIntervention']
    )->name('members.signals.interventions.store');


    /*
    |--------------------------------------------------------------------------
    | Signals
    |--------------------------------------------------------------------------
    */

    Route::post(
        '/members/{member}/signals/{signal}/dismiss',
        [MemberController::class, 'dismissSignal']
    )->name('members.signals.dismiss');

    /*
    |--------------------------------------------------------------------------
    | Payments
    |--------------------------------------------------------------------------
    */

    Route::get(
        'members/{member}/memberships/{membership}/payments/create',
        [PaymentController::class, 'create']
    )->name('members.memberships.payments.create');

    Route::post(
        'members/{member}/memberships/{membership}/payments',
        [PaymentController::class, 'store']
    )->name('members.memberships.payments.store');




});

require __DIR__ . '/settings.php';