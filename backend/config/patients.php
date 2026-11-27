<?php

return [
    'require_identifier' => env('PATIENT_REQUIRE_IDENTIFIER', false),

    'sequences' => [
        'patient' => 'PATIENT',
        'visit' => 'VISIT',
        'queue' => 'QUEUE',
    ],

    'rights' => [
        'patient.view' => ['patient:view', 'patients:read'],
        'patient.create' => ['patient:create', 'patients:create'],
        'patient.update' => ['patient:update', 'patients:edit'],
        'patient.deactivate' => ['patient:deactivate', 'patients:edit'],
        'patient.merge' => ['patient:merge'],
        'visit.create' => ['visit:create', 'patients:create'],
        'visit.view' => ['visit:view', 'patients:read'],
        'visit.cancel' => ['visit:cancel', 'patients:edit'],
        'queue.view' => ['queue:view', 'queue:manage', 'queue:tv'],
        'queue.route' => ['queue:route', 'queue:manage'],
        'queue.payment' => ['billing:collect'],
        'triage.view' => ['triage:vitals'],
        'triage.assess' => ['triage:vitals'],
        'consultation.read' => ['consultation:read', 'consultation:write', 'consultation:diagnose'],
        'consultation.write' => ['consultation:write'],
        'laboratory.read' => ['lab:collect', 'lab:results', 'lab:approve'],
        'laboratory.collect' => ['lab:collect'],
        'laboratory.result' => ['lab:results'],
        'laboratory.verify' => ['lab:approve'],
        'inpatient.admissions.read' => ['inpatient:bookings', 'inpatient:admit'],
        'inpatient.beds.read' => ['inpatient:beds', 'inpatient:view', 'inpatient:admit', 'inpatient:bookings'],
        'inpatient.read' => ['inpatient:view', 'inpatient:discharge'],
        'inpatient.admit' => ['inpatient:admit'],
        'inpatient.discharge' => ['inpatient:discharge'],
        'inpatient.clinical.read' => [
            'inpatient:admission-notes', 'inpatient:doctor-notes', 'inpatient:rounds', 'inpatient:vitals',
        ],
        'inpatient.admission-notes.write' => ['inpatient:admission-notes'],
        'inpatient.doctor-notes.write' => ['inpatient:doctor-notes'],
        'inpatient.rounds.write' => ['inpatient:rounds'],
        'inpatient.vitals.write' => ['inpatient:vitals'],
    ],

    'active_visit_statuses' => ['Open', 'In Progress'],

    'statuses' => [
        'Registered', 'Active', 'Inactive', 'In Triage', 'In Consultation', 'At Lab', 'At Radiology',
        'At Pharmacy', 'At Billing', 'Pending Consultation Payment', 'Pending SHA Verification', 'Admitted', 'Discharged',
    ],

    'stations' => ['Registration', 'Billing', 'Triage', 'Consultation', 'Laboratory', 'Radiology', 'Pharmacy', 'Inpatient Ward', 'Discharged'],
];
