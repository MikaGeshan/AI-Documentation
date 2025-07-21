<?php
use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;


Route::middleware('api')->post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);