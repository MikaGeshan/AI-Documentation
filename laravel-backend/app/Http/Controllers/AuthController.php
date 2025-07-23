<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Otp\UserRegistrationOtp; 
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Auth;
use SadiqSalau\LaravelOtp\Facades\Otp;

class AuthController extends Controller
{

    CONST SUCCESS_LOGIN_MESSAGE = 'Successfully Logged In';

    CONST ERROR_LOGIN_MESSAGE = 'Error while logging in';

    CONST SUCCESS_REGISTER_MESSAGE = 'User Successfully Registered';

    CONST ERROR_REGISTER_MESSAGE = 'Failed to Regist User';

    public function login(Request $request)
{
    $request->validate([
        'name' => 'nullable|string',
        'email' => 'nullable|email',
        'password' => 'required|min:8',
    ]);

    $emailOrname = $request->input('email') ?? $request->input('name');

    $input = filter_var($emailOrname, FILTER_VALIDATE_EMAIL) ? 'email' : 'name';

    $credentials = [
        $input => $emailOrname,
        'password' => $request->input('password'),
    ];

    if (Auth::attempt($credentials)) {
        $request->session()->regenerate();
        return response()->json([
            'message' => 'Login successful',
            'user' => Auth::user()
        ]);
    }

    return response()->json(['message' => 'Invalid credentials'], 401);
}

   public function register(Request $request)
{
    $request->validate([
    'name'     => ['required', 'string', 'max:255'],
    'email'    => ['required', 'email', 'unique:users,email'],
    'password' => ['required', 'string', 'min:8'], 
]);


    try {
        $otp = Otp::identifier($request->email)->send(
            new UserRegistrationOtp(
                name: $request->name,
                email: $request->email,
                password: $request->password
            ),
            Notification::route('mail', $request->email)
        );

        return response()->json([
            'success' => true,
            'message' => 'OTP berhasil dikirim. Silakan cek email Anda untuk verifikasi.',
            'status' => $otp['status'],
        ]);
    } catch (\Throwable $e) {
        return response()->json([
            'success' => false,
            'message' => 'Gagal mengirim OTP: ' . $e->getMessage(),
        ], 500);
    }
}
}
