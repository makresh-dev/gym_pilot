<?php

use App\Http\Controllers\Api\Mobile\AttendanceQrController;
use App\Http\Controllers\Api\Mobile\MemberAuthController;
use App\Http\Controllers\Api\Mobile\MembershipController;
use App\Http\Controllers\Api\Mobile\PaymentController;
use Illuminate\Support\Facades\Route;

Route::prefix('mobile')->group(function () {
    Route::post(
        '/auth/login',
        [MemberAuthController::class, 'login']
    )->name('mobile.auth.login');

    Route::middleware('auth:member')->group(function () {
        Route::get(
            '/auth/me',
            [MemberAuthController::class, 'me']
        )->name('mobile.auth.me');

        Route::post(
            '/auth/logout',
            [MemberAuthController::class, 'logout']
        )->name('mobile.auth.logout');

        Route::post(
            '/attendance/check-in',
            [AttendanceQrController::class, 'checkIn']
        )->name('mobile.attendance.check-in');

        Route::get(
            '/attendance',
            [AttendanceQrController::class, 'history']
        )->name('mobile.attendance.history');

        Route::get(
            '/membership',
            [MembershipController::class, 'show']
        )->name('mobile.membership.show');

        Route::get(
            '/payments',
            [PaymentController::class, 'index']
        )->name('mobile.payments.index');
    });

    Route::get(
        '/attendance/qr/{token}',
        [AttendanceQrController::class, 'show']
    )->name('mobile.attendance.qr.show');
});