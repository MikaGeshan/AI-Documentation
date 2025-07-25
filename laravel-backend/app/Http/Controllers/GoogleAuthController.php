<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\GoogleTokenService;
use Google_Client as Google_Client;
use Google\Service\Drive as Google_Service_Drive;
use Google_Service_Drive_Permission;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Laravel\Socialite\Facades\Socialite;
use Tymon\JWTAuth\Facades\JWTAuth;

class GoogleAuthController extends Controller
{
   public function handleSignInWithGoogle(Request $request)
{
    $idToken = $request->input('idToken');

    if (!$idToken) {
        return response()->json(['error' => 'Missing ID token'], 400);
    }

    $client = new Google_Client(['client_id' => env('GOOGLE_CLIENT_ID')]);
    $payload = $client->verifyIdToken($idToken);

    if (!$payload) {
        return response()->json(['error' => 'Invalid ID Token'], 401);
    }

    $email = $payload['email'];
    $name = $payload['name'];

    $user = User::firstOrNew(['email' => $email]);
    $user->name = $name;
    $user->google_id = $payload['sub'];

    if (!$user->exists) {
        $hasAccess = $this->checkFolderAccess($email); 
        $user->role = $hasAccess ? 'admin' : 'user';
        $user->email_verified_at = now();
    }

    $user->save();

    $token = JWTAuth::fromUser($user);

    return response()->json([
        'token' => $token,
        'user' => $user,
        'role' => $user->role,
    ]);
}


    public function redirectToGoogle()
    {
        return Socialite::driver('google')
            ->scopes(['https://www.googleapis.com/auth/userinfo.email'])
            ->redirect();
    }

    public function handleGoogleCallback()
    {
        $googleUser = Socialite::driver('google')->user();

        $user = User::firstOrNew([
            'email' => $googleUser->getEmail(),
        ]);

        $user->name = $googleUser->getName();
        $user->google_id = $googleUser->getId();

        $hasAccess = $this->checkFolderAccess($googleUser->getEmail());

        if (!$user->exists) {
            $user->role = $hasAccess ? 'admin' : 'user';
            $user->email_verified_at = now();
        }

        $user->save();
        Auth::login($user);

        $this->shareFolderToUser($googleUser->getEmail(), 'reader');

        return redirect('/'); 
    }

    private function checkFolderAccess($email)
    {
        $client = GoogleTokenService::getAuthorizedClient();
        $drive = new Google_Service_Drive($client);

        $folderId = env('GOOGLE_DRIVE_FOLDER_ID'); 

        try {
            $permissions = $drive->permissions->listPermissions($folderId, [
                'fields' => 'permissions(emailAddress,role)',
            ]);

            foreach ($permissions->getPermissions() as $perm) {
                if ($perm->getEmailAddress() === $email) {
                    return true;
                }
            }
        } catch (\Exception $e) {
            Log::error("Failed to check folder access: " . $e->getMessage());
        }

        return false;
    }

    private function shareFolderToUser($email, $role = 'reader')
    {
        $client = GoogleTokenService::getAuthorizedClient();
        $drive = new Google_Service_Drive($client);

        $folderId = env('GOOGLE_DRIVE_FOLDER_ID'); 

        $permission = new Google_Service_Drive_Permission([
            'type' => 'user',
            'role' => $role,
            'emailAddress' => $email,
        ]);

        try {
            $drive->permissions->create($folderId, $permission, [
                'sendNotificationEmail' => false,
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to share folder: " . $e->getMessage());
        }
    }
}
