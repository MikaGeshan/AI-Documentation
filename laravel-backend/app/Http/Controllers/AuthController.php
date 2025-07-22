<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;

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
        $validatedData = $request->validate([
            'name' => 'required|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|min:8'
        ]);

        User::create([
            'name' => $validatedData['name'],
            'email' => $validatedData['email'],
            'password' => Hash::make($validatedData['password'])
        ]);

        return response()->json([
            'message' => 'User registered successfully',
        ], 201);

    }
}
