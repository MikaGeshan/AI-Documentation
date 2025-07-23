<?php

namespace App\Http\Controllers;

use App\Models\User;
use Tymon\JWTAuth\Facades\JWTAuth;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use SadiqSalau\LaravelOtp\Facades\Otp;

class OtpController extends Controller
{
    public function verifyOtp(Request $request)
{
    $request->validate([
        'email' => 'required|email',
        'otp'   => 'required|string',
    ]);

    try {
        $email = strtolower($request->email);
        $isValid = Otp::identifier($email)->attempt($request->otp);

        if (!$isValid) {
            return response()->json([
                'success' => false,
                'message' => 'OTP tidak valid atau sudah expired.',
            ], 401);
        }

        $payload = Cache::get("register_payload_{$email}");

        if (!$payload) {
            return response()->json([
                'success' => false,
                'message' => 'Data pendaftaran tidak ditemukan.',
            ], 404);
        }

        if (!User::where('email', $email)->exists()) {
            $user = User::create([
                'name'     => $payload['name'],
                'email'    => $payload['email'],
                'password' => Hash::make($payload['password']), 
            ]);
        } else {
            $user = User::where('email', $email)->first();
        }

        $token = Auth::guard('api')->login($user);

        return response()->json([
        'success' => true,
        'message' => 'OTP valid, akun berhasil diverifikasi dan login.',
        'access_token' => $token,
        'token_type' => 'bearer',
        'expires_in' => JWTAuth::factory()->getTTL() * 60,
        'user' => $user,
        ]);


    } catch (\Throwable $e) {
        return response()->json([
            'success' => false,
            'message' => 'Terjadi kesalahan: ' . $e->getMessage(),
        ], 500);
    }
}

    
}
