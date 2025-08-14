<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\GoogleTokenService;
use Google_Client;
use Google\Service\Drive as Google_Service_Drive;
use Google\Service\Drive\Permission as Google_Service_Drive_Permission;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Tymon\JWTAuth\Facades\JWTAuth;

class GoogleAuthController extends Controller
{
    private string $adminEmail;

    public function __construct()
    {
        $this->adminEmail = env('GOOGLE_ADMIN_EMAIL'); 
    }

    /**
     * Handle Google Sign-In via ID token
     */
    public function handleSignInWithGoogle(Request $request)
    {
        $idToken = $request->input('idToken');
        $serverAuthCode = $request->input('serverAuthCode');

        if (!$idToken || !$serverAuthCode) {
            return response()->json(['error' => 'Missing Google login parameters'], 400);
        }

        $client = new Google_Client(['client_id' => env('GOOGLE_CLIENT_ID')]);
        $payload = $client->verifyIdToken($idToken);

        if (!$payload) {
            return response()->json(['error' => 'Invalid ID Token'], 401);
        }

        $email = $payload['email'];
        $name = $payload['name'];

        $user = User::updateOrCreate(
            ['email' => $email],
            [
                'name'              => $name,
                'google_id'         => $payload['sub'],
                'email_verified_at' => now(),
            ]
        );

        $tokenData = GoogleTokenService::exchangeAuthCodeAndStore($email, $serverAuthCode);

        if (!isset($tokenData['access_token'])) {
            return response()->json(['error' => 'Failed to exchange auth code'], 500);
        }

        $user->update([
            'access_token'  => $tokenData['access_token'],
            'refresh_token' => $tokenData['refresh_token'] ?? $user->refresh_token,
            'expires_at'    => now()->addSeconds($tokenData['expires_in'] ?? 3600),
        ]);

        $token = JWTAuth::fromUser($user);

        return response()->json([
            'token' => $token,
            'user'  => $user
        ]);
    }



    /**
     * Check if a user has access to the admin Google Drive folder
     */
    private function checkFolderAccess(string $email): bool
    {
        try {
            $client = GoogleTokenService::getAuthorizedClient($this->adminEmail);
            $drive = new Google_Service_Drive($client);
            $folderId = env('GOOGLE_DRIVE_FOLDER_ID');

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

    /**
     * Share admin folder with a user
     */
    private function shareFolderToUser(string $email, string $role = 'reader'): void
    {
        try {
            $client = GoogleTokenService::getAuthorizedClient($this->adminEmail);
            $drive = new Google_Service_Drive($client);
            $folderId = env('GOOGLE_DRIVE_FOLDER_ID');

            $permission = new Google_Service_Drive_Permission([
                'type' => 'user',
                'role' => $role,
                'emailAddress' => $email,
            ]);

            $drive->permissions->create($folderId, $permission, [
                'sendNotificationEmail' => false,
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to share folder: " . $e->getMessage());
        }
    }
}
