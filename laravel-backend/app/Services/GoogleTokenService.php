<?php

namespace App\Services;

use App\Models\User;
use Google_Client;
use Google\Service\Drive as Google_Service_Drive;
use Illuminate\Support\Facades\Log;

class GoogleTokenService
{
    /**
     * Exchange serverAuthCode for tokens and store them
     */
    public static function exchangeAuthCodeAndStore(string $accountEmail, string $serverAuthCode): array
    {
        $client = new Google_Client();
        $client->setClientId(env('GOOGLE_CLIENT_ID'));
        $client->setClientSecret(env('GOOGLE_CLIENT_SECRET'));
        $client->setRedirectUri(env('GOOGLE_REDIRECT_URI'));
        $client->addScope(Google_Service_Drive::DRIVE);
        $client->setAccessType('offline');
        $client->setPrompt('consent');

        $tokenData = $client->fetchAccessTokenWithAuthCode($serverAuthCode);

        if (isset($tokenData['error'])) {
            Log::error("[GoogleTokenService] Failed to exchange auth code", ['error' => $tokenData]);
            throw new \Exception("Google Auth code exchange failed: " . $tokenData['error']);
        }

        $user = User::where('email', $accountEmail)->firstOrFail();
        $user->access_token = $tokenData['access_token'];
        $user->refresh_token = $tokenData['refresh_token'] ?? $user->refresh_token; 
        $user->expires_at = now()->addSeconds($tokenData['expires_in']);
        $user->save();

        Log::info("[GoogleTokenService] Tokens stored for {$accountEmail}");

        return $tokenData;
    }

    /**
     * Get authorized Google client for a specific email
     */
    public static function getAuthorizedClient(string $accountEmail): Google_Client
    {
        $user = User::where('email', $accountEmail)->first();

        if (!$user || !$user->access_token) {
            throw new \Exception("No stored Google tokens for {$accountEmail}");
        }

        $client = new Google_Client();
        $client->setClientId(env('GOOGLE_CLIENT_ID'));
        $client->setClientSecret(env('GOOGLE_CLIENT_SECRET'));
        $client->addScope(Google_Service_Drive::DRIVE);
        $client->setAccessType('offline');
        $client->setAccessToken([
            'access_token' => $user->access_token,
            'refresh_token' => $user->refresh_token,
            'expires_in'    => $user->expires_at ? now()->diffInSeconds($user->expires_at) : 3600,
            'created'       => now()->timestamp
        ]);

        if ($client->isAccessTokenExpired()) {
            $newToken = $client->fetchAccessTokenWithRefreshToken($user->refresh_token);

            if (!isset($newToken['access_token'])) {
                throw new \Exception("Failed to refresh Google token for {$accountEmail}");
            }

            $user->access_token = $newToken['access_token'];
            $user->expires_at = now()->addSeconds($newToken['expires_in']);
            $user->save();

            $client->setAccessToken($newToken);
        }

        return $client;
    }

    /**
     * Get current access token string for a given account.
     */
    public static function getAccessToken(string $accountEmail): string
    {
        $client = self::getAuthorizedClient($accountEmail);
        return $client->getAccessToken()['access_token'];
    }

}
