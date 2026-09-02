<?php

use App\Http\Controllers\MemberController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\AttendanceController;

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
    
});

require __DIR__.'/settings.php';