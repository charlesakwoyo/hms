<?php

$setupWrite = ['system:setup', 'system:tariffs'];

return [

    'admin_role' => 'System Administrator',

    'resources' => [

        'setup-patient-categories' => [
            'table' => 'setup_patient_categories',
            'aliases' => ['isCash' => 'is_cash', 'defaultDiscount' => 'default_discount'],
            'write' => array_merge($setupWrite, ['setup:patient-categories']),
        ],

        'setup-patient-subcategories' => [
            'table' => 'setup_patient_subcategories',
            'aliases' => [
                'categoryCode' => 'category_code', 'categoryName' => 'category_name', 'subCategoryCode' => 'sub_category_code',
                'isCash' => 'is_cash', 'schemeCode' => 'scheme_code', 'schemeName' => 'scheme_name', 'schemeType' => 'scheme_type',
                'copayRule' => 'copay_rule', 'copayAmount' => 'copay_amount', 'creditLimit' => 'credit_limit',
                'preauthRequired' => 'preauth_required', 'contactPerson' => 'contact_person', 'contactPhone' => 'contact_phone',
            ],
            'write' => array_merge($setupWrite, ['setup:sub-categories']),
        ],

        'setup-patient-schemes' => [
            'table' => 'setup_patient_schemes',
            'aliases' => [
                'subCategoryId' => 'sub_category_id', 'providerName' => 'provider_name', 'schemeCode' => 'scheme_code',
                'schemeName' => 'scheme_name', 'schemeType' => 'scheme_type', 'copayRule' => 'copay_rule', 'copayAmount' => 'copay_amount',
                'creditLimit' => 'credit_limit', 'preAuthRequired' => 'preauth_required', 'contactPerson' => 'contact_person',
                'contactPhone' => 'contact_phone',
            ],
            'write' => array_merge($setupWrite, ['setup:sub-categories']),
        ],

        'setup-departments' => [
            'table' => 'setup_departments',
            'aliases' => ['headOfDepartment' => 'head_of_department', 'phoneExt' => 'phone_ext'],
            'write' => array_merge($setupWrite, ['setup:departments']),
        ],

        'setup-consultation-services' => [
            'table' => 'setup_consultation_services',
            'aliases' => ['durationMinutes' => 'duration_minutes', 'cashPrice' => 'cash_price', 'subCategoryPrices' => 'sub_category_prices_json'],
            'prices' => ['table' => 'setup_consultation_prices', 'foreign_key' => 'consultation_id'],
            'write' => array_merge($setupWrite, ['setup:consultations']),
        ],

        'setup-lab-tests' => [
            'table' => 'setup_lab_tests',
            'aliases' => [
                'clinicalComment' => 'clinical_comment', 'specimenType' => 'specimen_type', 'turnaroundMinutes' => 'turnaround_minutes',
                'cashPrice' => 'cash_price', 'subCategoryPrices' => 'sub_category_prices_json', 'parameters' => 'parameters_json',
            ],
            'prices' => ['table' => 'setup_lab_test_prices', 'foreign_key' => 'lab_test_id'],
            'write' => array_merge($setupWrite, ['setup:lab-tests']),
        ],

        'setup-radiology-tests' => [
            'table' => 'setup_radiology_tests',
            'aliases' => [
                'requiresContrast' => 'requires_contrast', 'preparationInstructions' => 'preparation_instructions',
                'cashPrice' => 'cash_price', 'subCategoryPrices' => 'sub_category_prices_json', 'defaultTemplateId' => 'default_template_id',
            ],
            'prices' => ['table' => 'setup_radiology_test_prices', 'foreign_key' => 'radiology_test_id'],
            'write' => array_merge($setupWrite, ['setup:radiology']),
        ],

        'setup-radiology-templates' => [
            'table' => 'setup_radiology_templates',
            'aliases' => [
                'templateCode' => 'template_code', 'templateName' => 'template_name', 'indicationBoilerplate' => 'indication_boilerplate',
                'techniqueBoilerplate' => 'technique_boilerplate', 'findingsTemplate' => 'findings_template',
                'impressionTemplate' => 'impression_template', 'normalReportText' => 'normal_report_text', 'isDefault' => 'is_default',
            ],
            'write' => array_merge($setupWrite, ['setup:radiology']),
        ],

        'setup-nursing-procedures' => [
            'table' => 'setup_nursing_procedures',
            'aliases' => ['cashPrice' => 'cash_price', 'subCategoryPrices' => 'sub_category_prices_json'],
            'prices' => ['table' => 'setup_nursing_procedure_prices', 'foreign_key' => 'nursing_procedure_id'],
            'write' => array_merge($setupWrite, ['setup:nursing-procedures']),
        ],

        'setup-pharmacy-drugs' => [
            'table' => 'setup_pharmacy_drugs',
            'aliases' => ['brandName' => 'brand_name', 'genericName' => 'generic_name', 'cashPrice' => 'cash_price', 'subCategoryPrices' => 'sub_category_prices_json'],
            'prices' => ['table' => 'setup_pharmacy_drug_prices', 'foreign_key' => 'drug_id'],
            'write' => array_merge($setupWrite, ['stores:stock']),
        ],

        'setup-icd11' => [
            'table' => 'setup_icd11',
            'aliases' => [],
            'write' => array_merge($setupWrite, ['setup:icd11']),
        ],

        'setup-inpatient-packages' => [
            'table' => 'setup_inpatient_packages',
            'aliases' => [
                'packageCode' => 'package_code', 'packageName' => 'package_name', 'wardType' => 'ward_type', 'includedDays' => 'included_days',
                'includedProcedures' => 'included_procedures_json', 'cashPrice' => 'cash_price', 'subCategoryPrices' => 'sub_category_prices_json',
                'overstayDailyRate' => 'overstay_daily_rate',
            ],
            'prices' => ['table' => 'setup_inpatient_package_prices', 'foreign_key' => 'package_id'],
            'write' => array_merge($setupWrite, ['setup:packages']),
        ],

        'setup-bed-items' => [
            'table' => 'setup_bed_items',
            'aliases' => [
                'bedNumber' => 'bed_number', 'wardName' => 'ward_name', 'wardId' => 'ward_id', 'bedType' => 'bed_type',
                'cashDailyRate' => 'cash_daily_rate', 'bedCharge' => 'bed_charge', 'nursingCareCharge' => 'nursing_care_charge',
                'mealsNutritionCharge' => 'meals_nutrition_charge', 'dailyReviewCharge' => 'daily_review_charge',
                'subCategoryDailyRates' => 'sub_category_daily_rates_json', 'subCategoryChargeComponents' => 'sub_category_charge_components_json',
                'oxygenEquipped' => 'oxygen_equipped', 'cardiacMonitorEquipped' => 'cardiac_monitor_equipped',
            ],
            'write' => array_merge($setupWrite, ['setup:beds']),
        ],

        'wards' => [
            'table' => 'wards',
            'aliases' => [
                'totalBeds' => 'total_beds', 'occupiedBeds' => 'occupied_beds', 'dailyRate' => 'daily_rate',
                'nurseInCharge' => 'nurse_in_charge', 'subCategoryChargeComponents' => 'sub_category_charge_components_json',
            ],
            'write' => array_merge($setupWrite, ['setup:wards']),
        ],

        'setup-workflow-mappings' => [
            'table' => 'setup_workflow_mappings',
            'aliases' => [],
            'write' => array_merge($setupWrite, ['setup:workflow']),
        ],

        'setup-cancer-protocols' => [
            'table' => 'setup_cancer_protocols',
            'aliases' => [
                'treatmentType' => 'treatment_type', 'defaultCycles' => 'default_cycles', 'cycleDays' => 'cycle_days',
                'preauthRequired' => 'preauth_required', 'shaBenefitCode' => 'sha_benefit_code',
            ],
            'write' => array_merge($setupWrite, ['setup:cancer']),
        ],

        'setup-cancer-services' => [
            'table' => 'setup_cancer_services',
            'aliases' => [
                'serviceType' => 'service_type', 'sourceEntity' => 'source_entity', 'sourceId' => 'source_id', 'cashPrice' => 'cash_price',
                'shaSubcategoryCode' => 'sha_subcategory_code', 'shaPrice' => 'sha_price', 'billingCategory' => 'billing_category',
                'preauthRequired' => 'preauth_required',
            ],
            'write' => array_merge($setupWrite, ['setup:cancer']),
        ],

        'sha-rebates' => [
            'table' => 'setup_sha_rebates',
            'aliases' => [
                'packageName' => 'package_name', 'dailyRebateAmount' => 'daily_rebate_amount', 'wardCategory' => 'ward_category',
                'isActive' => 'is_active', 'facilityLevel' => 'facility_level', 'benefitCategory' => 'benefit_category',
                'shaMaxPerDay' => 'sha_max_per_day', 'maxDaysPerYear' => 'max_days_per_year', 'requiresPreauth' => 'requires_preauth',
                'effectiveFrom' => 'effective_from', 'effectiveTo' => 'effective_to', 'legalReference' => 'legal_reference',
                'discountPerDay' => 'discount_per_day', 'discountLabel' => 'discount_label',
            ],
            'write' => ['system:tariffs'],
        ],

        'hospital-config' => [
            'table' => 'hospital_config',
            'aliases' => [
                'timezone' => 'timezone_name', 'mflCode' => 'mfl_code', 'facilityLevel' => 'facility_level', 'kraPin' => 'kra_pin',
                'shaProviderCode' => 'sha_provider_code', 'subCounty' => 'sub_county', 'emergencyHotline' => 'emergency_hotline',
                'timezoneName' => 'timezone_name',
            ],
            'single_row_id' => 1,
            'write' => ['system:config'],
        ],

        'queue' => [
            'table' => 'patient_queue',
            'aliases' => [
                'ticketNumber' => 'ticket_number', 'patientId' => 'patient_id', 'patientName' => 'patient_name', 'arrivedTime' => 'arrived_time',
                'currentStation' => 'current_station', 'assignedTo' => 'assigned_to', 'paymentMethod' => 'payment_method',
                'consultationFeePaid' => 'consultation_fee_paid', 'callCount' => 'call_count', 'lastCalledAt' => 'last_called_at',
                'servicePointNote' => 'service_point_note', 'consultationServiceId' => 'consultation_service_id',
                'consultationServiceCode' => 'consultation_service_code', 'consultationType' => 'consultation_type',
                'consultationFee' => 'consultation_fee', 'patientSubCategory' => 'patient_sub_category',
            ],
            'patient_record' => true,
        ],

        'security-roles' => [
            'table' => 'security_roles',
            'aliases' => ['isSystem' => 'is_system', 'rights' => 'rights_json', 'createdAt' => 'created_at', 'updatedAt' => 'updated_at'],
            'write' => ['roles:manage'],
        ],

    ],

];
