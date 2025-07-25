<?php

namespace App\Services;

use Google_Client;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;

class GoogleTokenService
{
    public static function getAuthorizedClient(): Google_Client
    {
        $client = new Google_Client();
        $client->setClientId(env('GOOGLE_CLIENT_ID'));
        $client->setClientSecret(env('GOOGLE_CLIENT_SECRET'));

        $cachedToken = Cache::get('google_admin_access_token');
        $accessToken = $cachedToken ?: env('GOOGLE_ADMIN_ACCESS_TOKEN');

        $client->setAccessToken([
            'access_token' => $accessToken,
            'refresh_token' => env('GOOGLE_ADMIN_REFRESH_TOKEN'),
            'expires_in' => 3600,
            'created' => env('GOOGLE_ADMIN_CREATED') ?? time(),
        ]);

        if ($client->isAccessTokenExpired()) {
            $newToken = $client->fetchAccessTokenWithRefreshToken(env('GOOGLE_ADMIN_REFRESH_TOKEN'));

            if (isset($newToken['access_token'])) {
                $client->setAccessToken($newToken);

                Cache::put('google_admin_access_token', $newToken['access_token'], now()->addSeconds($newToken['expires_in']));
            } else {
                throw new \Exception('Gagal me-refresh token: ' . json_encode($newToken));
            }
        }

        $client->addScope(\Google_Service_Drive::DRIVE);
        $client->setAccessType('offline');

        return $client;
    }


    public static function getAccessToken(): string
    {
        return Cache::get('google_admin_access_token', env('GOOGLE_ADMIN_ACCESS_TOKEN'));
    }
}
