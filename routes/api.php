<?php

use App\Http\Controllers\Api\Mobile\AttendanceQrController;
use App\Http\Controllers\Api\Mobile\MemberAuthController;
use Illuminate\Support\Facades\Route;

Route::prefix('mobile')->group(function () {
    /*
    |--------------------------------------------------------------------------
    | Member Authentication
    |--------------------------------------------------------------------------
    */

    Route::post(
        '/auth/login',
        [MemberAuthController::class, 'login']
    )->name('mobile.auth.login');

    Route::middleware('auth:sanctum')->group(function () {
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
    });

    /*
    |--------------------------------------------------------------------------
    | Attendance QR
    |--------------------------------------------------------------------------
    */

    Route::get(
        '/attendance/qr/{token}',
        [AttendanceQrController::class, 'show']
    )->name('mobile.attendance.qr.show');
});