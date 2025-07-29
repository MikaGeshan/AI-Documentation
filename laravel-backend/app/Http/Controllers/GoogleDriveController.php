<?php

namespace App\Http\Controllers;

use App\Services\GoogleTokenService;
use Google\Service\Drive as Google_Service_Drive;
use Google\Client;
use Google\Service\Docs;
use Google\Service\Docs\Request as DocsRequest;
use Google\Service\Docs\BatchUpdateDocumentRequest;
use Illuminate\Http\Request;

class GoogleDriveController extends Controller
{
   public function getDriveContents()
{
    $client = GoogleTokenService::getAuthorizedClient();
    $drive = new \Google_Service_Drive($client);

    $parentFolderId = env('GOOGLE_DRIVE_FOLDER_ID');

    $mainFolder = $drive->files->get($parentFolderId, [
        'fields' => 'id, name, webViewLink'
    ]);

    $subfoldersResult = $drive->files->listFiles([
        'q' => "'$parentFolderId' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false",
        'fields' => 'files(id, name, webViewLink)',
        'pageSize' => 1000
    ]);

    $subfolders = $subfoldersResult->getFiles();
    $subfolderIds = array_map(fn($f) => $f->id, $subfolders);

    if (empty($subfolderIds)) {
        return response()->json([
            'folder' => $mainFolder,
            'subfolders' => []
        ]);
    }

    $subfolderQueryParts = array_map(fn($id) => "'$id' in parents", $subfolderIds);
    $combinedQuery = '(' . implode(' or ', $subfolderQueryParts) . ') and trashed = false';

    $filesResult = $drive->files->listFiles([
        'q' => $combinedQuery,
        'fields' => 'files(id, name, mimeType, webViewLink, iconLink, parents)',
        'pageSize' => 1000
    ]);

    $files = $filesResult->getFiles();

    $filesGrouped = [];
    foreach ($files as $file) {
        foreach ($file->parents as $parentId) {
            $filesGrouped[$parentId][] = $file;
        }
    }

    $subfolderData = array_map(function ($subfolder) use ($filesGrouped) {
        return [
            'id' => $subfolder->id,
            'name' => $subfolder->name,
            'webViewLink' => $subfolder->webViewLink,
            'files' => $filesGrouped[$subfolder->id] ?? [],
        ];
    }, $subfolders);

    return response()->json([
        'folder' => $mainFolder,
        'subfolders' => $subfolderData
    ]);
    }

    public function downloadGoogleDocs(Request $request)
{
    $request->validate([
        'file_id' => 'required|string',
    ]);

    $fileId = $request->input('file_id');

    try {
        $client = GoogleTokenService::getAuthorizedClient(); 
        $drive = new \Google_Service_Drive($client);

        $file = $drive->files->get($fileId, ['fields' => 'name']);

        $fileName = $file->name ?? 'downloaded';
        $fileName .= '.pdf'; 

        $exportUrl = "https://www.googleapis.com/drive/v3/files/{$fileId}/export?mimeType=application/pdf";

        $httpClient = new \GuzzleHttp\Client();

        $response = $httpClient->get($exportUrl, [
            'headers' => [
                'Authorization' => 'Bearer ' . $client->getAccessToken()['access_token'],
            ],
            'stream' => true,
        ]);

        return response()->stream(function () use ($response) {
            echo $response->getBody()->getContents();
        }, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="' . $fileName . '"',
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'error' => 'Gagal mengunduh dokumen.',
            'details' => $e->getMessage()
        ], 500);
    }
    }

    public function deleteGoogleDocs(Request $request)
{
    $request->validate([
        'file_id' => 'required|string',
    ]);

    $fileId = $request->input('file_id');

    try {
        $client = GoogleTokenService::getAuthorizedClient();
        $drive = new \Google_Service_Drive($client);

        $drive->files->delete($fileId);

        return response()->json([
            'message' => 'File berhasil dihapus.'
        ]);
    } catch (\Google_Service_Exception $e) {
        return response()->json([
            'error' => 'Gagal menghapus file.',
            'details' => $e->getMessage()
        ], 500);
    } catch (\Exception $e) {
        return response()->json([
            'error' => 'Terjadi kesalahan tak terduga.',
            'details' => $e->getMessage()
        ], 500);
    }
    }

    public function createGoogleDriveFolder(Request $request)
    {
    $validated = $request->validate([
        'name' => 'required|string',
    ]);

    try {
        $client = GoogleTokenService::getAuthorizedClient();
        $service = new \Google_Service_Drive($client);

        $parentFolderId = env('GOOGLE_DRIVE_FOLDER_ID'); 

        $folderMetadata = new \Google_Service_Drive_DriveFile([
            'name' => $validated['name'],
            'mimeType' => 'application/vnd.google-apps.folder',
            'parents' => [$parentFolderId],
        ]);

        $folder = $service->files->create($folderMetadata, [
            'fields' => 'id, name',
        ]);

        return response()->json([
            'message' => 'Folder berhasil dibuat',
            'folder' => $folder,
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'error' => 'Gagal membuat folder.',
            'details' => $e->getMessage()
        ], 500);
    }
    }

    public function viewGoogleDocsAsPdf(Request $request)
    {
    $request->validate([
        'file_id' => 'required|string',
    ]);

    $fileId = $request->input('file_id');

    try {
        $client = GoogleTokenService::getAuthorizedClient(); 
        $drive = new \Google_Service_Drive($client);

        $file = $drive->files->get($fileId, ['fields' => 'name']);

        $fileName = $file->name ?? 'view';
        $fileName .= '.pdf';

        $exportUrl = "https://www.googleapis.com/drive/v3/files/{$fileId}/export?mimeType=application/pdf";

        $httpClient = new \GuzzleHttp\Client();

        $response = $httpClient->get($exportUrl, [
            'headers' => [
                'Authorization' => 'Bearer ' . $client->getAccessToken()['access_token'],
            ],
            'stream' => true,
        ]);

        return response()->stream(function () use ($response) {
            echo $response->getBody()->getContents();
        }, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="' . $fileName . '"',
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'error' => 'Gagal menampilkan dokumen sebagai PDF.',
            'details' => $e->getMessage()
        ], 500);
    }
    }





}
