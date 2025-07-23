<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
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
            $isValid = Otp::identifier($request->email)->attempt($request->otp);

            return response()->json([
                'success' => $isValid,
                'message' => $isValid
                    ? 'OTP valid, akun berhasil diverifikasi.'
                    : 'OTP tidak valid atau sudah expired.',
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan: ' . $e->getMessage(),
            ], 500);
        }
    }

    
}
