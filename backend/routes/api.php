<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CatalogController;
use App\Http\Controllers\Api\ConsultationController;
use App\Http\Controllers\Api\LaboratoryController;
use App\Http\Controllers\Api\InpatientController;
use App\Http\Controllers\Api\PatientController;
use App\Http\Controllers\Api\QueueController;
use App\Http\Controllers\Api\RecordController;
use App\Http\Controllers\Api\TriageController;
use App\Http\Controllers\Api\VisitController;
use Illuminate\Support\Facades\Route;

Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:30,1');

Route::middleware('wisecare.auth')->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::post('/auth/change-password', [AuthController::class, 'changePassword']);

    Route::get('/patients/duplicate-check', [PatientController::class, 'duplicateCheck']);
    Route::get('/patients', [PatientController::class, 'index']);
    Route::post('/patients', [PatientController::class, 'store']);
    Route::get('/patients/{id}/visits', [PatientController::class, 'visits']);
    Route::get('/patients/{id}/queue-status', [PatientController::class, 'queueStatus']);
    Route::get('/patients/{id}/activity', [PatientController::class, 'activity']);
    Route::post('/patients/{id}/deactivate', [PatientController::class, 'deactivate']);
    Route::post('/patients/{id}/reactivate', [PatientController::class, 'reactivate']);
    Route::get('/patients/{id}', [PatientController::class, 'show']);
    Route::put('/patients/{id}', [PatientController::class, 'update']);

    Route::post('/patients/{patient}/visits', [VisitController::class, 'store']);
    Route::post('/visits/{visit}/cancel', [VisitController::class, 'cancel']);
    Route::post('/visits/{visit}/close', [VisitController::class, 'close']);

    Route::get('/queue/status/{patient}', [QueueController::class, 'status']);
    Route::post('/queue', [QueueController::class, 'store']);
    Route::post('/queue/{queue}/consultation-payment', [QueueController::class, 'recordConsultationPayment']);
    Route::post('/queue/{queue}/continue-after-payment', [QueueController::class, 'continueAfterPayment']);
    Route::post('/queue/{queue}/route', [QueueController::class, 'route']);

    Route::get('/triage/worklist', [TriageController::class, 'worklist']);
    Route::post('/triage/{queue}/assessment', [TriageController::class, 'save']);

    Route::get('/consultation/worklist', [ConsultationController::class, 'worklist']);
    Route::get('/consultation/{queue}/encounter', [ConsultationController::class, 'encounter']);
    Route::get('/consultation/diagnosis-catalog', [ConsultationController::class, 'diagnosisCatalog']);
    Route::get('/consultation/laboratory-catalog', [ConsultationController::class, 'laboratoryCatalog']);
    Route::post('/consultation/{queue}/laboratory-orders', [ConsultationController::class, 'orderLaboratoryTests']);
    Route::put('/consultation/{queue}/notes', [ConsultationController::class, 'saveNotes']);
    Route::post('/consultation/{queue}/diagnoses', [ConsultationController::class, 'addDiagnosis']);
    Route::post('/consultation/{queue}/disposition', [ConsultationController::class, 'saveDisposition']);
    Route::get('/inpatient/admission-requests', [InpatientController::class, 'admissionRequests']);
    Route::get('/inpatient/available-beds', [InpatientController::class, 'availableBeds']);
    Route::get('/inpatient/admissions', [InpatientController::class, 'admissions']);
    Route::post('/inpatient/admission-requests/{disposition}/accept', [InpatientController::class, 'acceptAdmission']);
    Route::post('/inpatient/admission-requests/{disposition}/decline', [InpatientController::class, 'declineAdmission']);
    Route::post('/inpatient/admissions/{admission}/discharge', [InpatientController::class, 'discharge']);
    Route::get('/inpatient/admissions/{admission}/clinical-chart', [InpatientController::class, 'clinicalChart']);
    Route::put('/inpatient/admissions/{admission}/admission-notes', [InpatientController::class, 'saveAdmissionNotes']);
    Route::post('/inpatient/admissions/{admission}/admission-notes/sign', [InpatientController::class, 'signAdmissionNotes']);
    Route::post('/inpatient/admissions/{admission}/doctor-notes', [InpatientController::class, 'saveDoctorNote']);
    Route::post('/inpatient/admissions/{admission}/ward-rounds', [InpatientController::class, 'saveWardRound']);
    Route::post('/inpatient/admissions/{admission}/vitals', [InpatientController::class, 'saveInpatientVitals']);
    Route::get('/laboratory/worklist', [LaboratoryController::class, 'worklist']);
    Route::post('/laboratory/orders/{order}/collect', [LaboratoryController::class, 'collect']);
    Route::post('/laboratory/orders/{order}/reject-specimen', [LaboratoryController::class, 'rejectSpecimen']);
    Route::put('/laboratory/orders/{order}/result', [LaboratoryController::class, 'enterResult']);
    Route::post('/laboratory/orders/{order}/verify', [LaboratoryController::class, 'verifyResult']);

    Route::get('/catalog/consultations', [CatalogController::class, 'consultations']);
    Route::get('/branches', [CatalogController::class, 'branches']);

    Route::get('/records/{resource}', [RecordController::class, 'index']);
    Route::post('/records/{resource}', [RecordController::class, 'store']);
    Route::delete('/records/{resource}/{id}', [RecordController::class, 'destroy']);
});
