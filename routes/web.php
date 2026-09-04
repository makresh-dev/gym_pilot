<?php

use App\Http\Controllers\MemberController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\MembershipPlanController;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth'])->group(function () {
    Route::get('/dashboard', DashboardController::class)
        ->name('dashboard');

    Route::post(
        '/members/{member}/signals/{signal}/interventions',
        [MemberController::class, 'storeIntervention']
    )->name('members.signals.interventions.store');

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
    '/members/{member}/memberships/create',
    [MemberController::class, 'createMembership']
    )->name('members.memberships.create');

    Route::post(
    '/members/{member}/memberships',
    [MemberController::class, 'storeMembership']
    )->name('members.memberships.store');

    Route::get(
    '/members/{member}/memberships/{membership}/payments/create',
    [MemberController::class, 'createPayment']
    )->name('members.memberships.payments.create');

    Route::post(
    '/members/{member}/memberships/{membership}/payments',
    [MemberController::class, 'storePayment']
    )->name('members.memberships.payments.store');

    Route::post(
    '/members/{member}/attendance',
    [MemberController::class, 'storeAttendance']
    )->name('members.attendance.store');

    Route::get('/attendance/search', [AttendanceController::class, 'search'])
    ->name('attendance.search');

    Route::get('/attendance', [AttendanceController::class, 'index'])
    ->name('attendance.index');

    Route::post('/attendance', [AttendanceController::class, 'store'])
    ->name('attendance.store');

    Route::get('/attendance/{member}/status', [AttendanceController::class, 'status'])
    ->name('attendance.status');

    Route::post(
        '/members/{member}/memberships/{membership}/renew',
        [MemberController::class, 'renewMembership']
    )->name('memberships.renew');
    

    Route::get(
    '/members/{member}/memberships/{membership}/renew',
    [MemberController::class, 'createRenewal']
    )->name('memberships.renew.create');

    Route::post(
    '/members/{member}/memberships/{membership}/renew',
    [MemberController::class, 'renewMembership']
    )->name('memberships.renew');

    Route::resource('membership-plans', MembershipPlanController::class)
    ->except(['show']);

    Route::resource('membership-plans', MembershipPlanController::class)
    ->except(['show', 'destroy']);

    Route::patch(
        '/membership-plans/{membershipPlan}/toggle-status',
        [MembershipPlanController::class, 'toggleStatus']
    )->name('membership-plans.toggle-status');

    Route::post('/members/{member}/interventions', [
    MemberController::class,
    'storeIntervention',
    ])->name('members.interventions.store');

    Route::post('/members/{member}/signals/{signal}/dismiss', [
    MemberController::class,
    'dismissSignal',
    ])->name('members.signals.dismiss');

    Route::post('/members/{member}/signals/{signal}/dismiss', [
    MemberController::class,
    'dismissSignal',
    ])->name('members.signals.dismiss');


});

require __DIR__.'/settings.php';