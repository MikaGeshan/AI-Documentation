<?php

namespace App\Services;

use Google_Client;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class GoogleTokenService
{
   public static function getAuthorizedClient(): Google_Client
    {
        $client = new Google_Client();
        $client->setClientId(env('GOOGLE_CLIENT_ID'));
        $client->setClientSecret(env('GOOGLE_CLIENT_SECRET'));
        $client->setAccessType('offline');
        $client->addScope(\Google_Service_Drive::DRIVE);

        $cachedAccessToken = Cache::get('google_admin_access_token') ?? env('GOOGLE_ADMIN_ACCESS_TOKEN');
        // $created = env('GOOGLE_ADMIN_CREATED') ?? time();

        $client->setAccessToken([
        'access_token' => $cachedAccessToken,
        'refresh_token' => env('GOOGLE_ADMIN_REFRESH_TOKEN'),
        'created' => (int) env('GOOGLE_ADMIN_CREATED', time()),
        'expires_in' => 3600,
        ]);


        if ($client->isAccessTokenExpired()) {
            Log::info('[GoogleTokenService] Token expired. Refreshing...');

            $newToken = $client->fetchAccessTokenWithRefreshToken(env('GOOGLE_ADMIN_REFRESH_TOKEN'));

            if (isset($newToken['access_token'])) {
                Cache::put('google_admin_access_token', $newToken['access_token'], now()->addSeconds($newToken['expires_in']));

               self::updateEnv([
                'GOOGLE_ADMIN_ACCESS_TOKEN' => $newToken['access_token'],
                'GOOGLE_ADMIN_CREATED' => $newToken['created'] ?? time(), 
                ]);


                Log::info('[GoogleTokenService] Token refreshed successfully.', [
                    'access_token_ending' => substr($newToken['access_token'], -5),
                ]);

                $client->setAccessToken($newToken);
            } else {
                Log::error('[GoogleTokenService] Failed to refresh token.', [
                    'response' => $newToken,
                ]);
                throw new \Exception("Google token refresh failed: " . json_encode($newToken));
            }
        }

        return $client;
    }

    public static function getAccessToken(): string
    {
        return Cache::get('google_admin_access_token', env('GOOGLE_ADMIN_ACCESS_TOKEN'));
    }

     protected static function updateEnv(array $data): void
    {
        $envPath = base_path('.env');
        $content = file_get_contents($envPath);

        foreach ($data as $key => $value) {
            $pattern = "/^{$key}=.*$/m";
            $replacement = "{$key}={$value}";
            if (preg_match($pattern, $content)) {
                $content = preg_replace($pattern, $replacement, $content);
            } else {
                $content .= PHP_EOL . "{$key}={$value}";
            }
        }

        file_put_contents($envPath, $content);
    }
}
