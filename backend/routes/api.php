<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CatalogController;
use App\Http\Controllers\Api\PatientController;
use App\Http\Controllers\Api\RecordController;
use Illuminate\Support\Facades\Route;

Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:30,1');

Route::middleware('wisecare.auth')->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::post('/auth/change-password', [AuthController::class, 'changePassword']);

    Route::get('/patients', [PatientController::class, 'index']);
    Route::get('/patients/{id}', [PatientController::class, 'show']);
    Route::post('/patients', [PatientController::class, 'store']);
    Route::put('/patients/{id}', [PatientController::class, 'update']);

    Route::get('/catalog/consultations', [CatalogController::class, 'consultations']);
    Route::get('/branches', [CatalogController::class, 'branches']);

    Route::get('/records/{resource}', [RecordController::class, 'index']);
    Route::post('/records/{resource}', [RecordController::class, 'store']);
    Route::delete('/records/{resource}/{id}', [RecordController::class, 'destroy']);
});
