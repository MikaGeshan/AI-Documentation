<?php
use App\Http\Controllers\AuthController;
use App\Http\Controllers\GoogleAuthController;
use App\Http\Controllers\GoogleDriveController;
use App\Http\Controllers\OtpController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);
Route::post('/verify-otp', [OtpController::class, 'verifyOtp']);
Route::post('/auth/google', [GoogleAuthController::class, 'handleSignInWithGoogle'])->middleware('api');
Route::get('/auth/google/callback', [AuthController::class, 'handleGoogleCallback']);
Route::get('/drive-contents', [GoogleDriveController::class, 'getDriveContents']);

Route::middleware(['auth:api'])->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/refresh', [AuthController::class, 'refresh']);
});


