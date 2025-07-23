<?php
use App\Http\Controllers\AuthController;
use App\Http\Controllers\OtpController;
use Illuminate\Support\Facades\Route;


Route::middleware('api')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/verify-otp', [OtpController::class, 'verifyOtp']);
});