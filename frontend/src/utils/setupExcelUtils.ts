import * as XLSX from 'xlsx';

export interface ParsedSheetData {
  fileName: string;
  sheetName: string;
  headers: string[];
  rows: Record<string, string | number>[];
  totalCount: number;
}

export function downloadSetupSampleTemplate(tabKey: string): void {
  let fileName = 'setup_sample_template.csv';
  let headers: string[] = [];
  let sampleRows: (string | number)[][] = [];

  switch (tabKey) {
    case 'icd11_codes':
      fileName = 'sample_icd11_codes_template.csv';
      headers = ['Code', 'Title', 'Chapter', 'Block', 'Category', 'Description'];
      sampleRows = [
        [
          '1A00',
          'Cholera (Vibrio cholerae)',
          '01 Certain infectious diseases',
          '1A00-1A0Z Intestinal infections',
          'Both',
          'Acute dehydrating diarrhea caused by Vibrio cholerae',
        ],
        [
          'BA00',
          'Essential hypertension',
          '11 Diseases of circulatory system',
          'BA00-BA0Z Hypertensive diseases',
          'Morbidity',
          'Primary arterial hypertension with BP >= 140/90 mmHg',
        ],
        [
          'CA20',
          'Acute upper respiratory infection, unspecified',
          '12 Diseases of respiratory system',
          'CA00-CA0Z Upper respiratory infections',
          'Morbidity',
          'Common cold, catarrh, acute nasopharyngitis',
        ],
        [
          '5A11',
          'Type 2 diabetes mellitus',
          '05 Endocrine, nutritional diseases',
          '5A10-5A1Z Diabetes mellitus',
          'Morbidity',
          'Adult-onset non-insulin dependent diabetes mellitus',
        ],
        [
          'JA00',
          'Single spontaneous delivery',
          '18 Pregnancy, childbirth, puerperium',
          'JA00-JA0Z Normal delivery',
          'Morbidity',
          'Uncomplicated vaginal delivery at term',
        ],
      ];
      break;

    case 'patient_categories':
      fileName = 'sample_patient_categories_template.csv';
      headers = ['Code', 'Category Name', 'Is Cash (Yes/No)', 'Default Discount %', 'Status'];
      sampleRows = [
        ['CASH', 'Cash Paying / Walk-In', 'Yes', 0, 'Active'],
        ['SHA', 'Social Health Authority (SHA)', 'No', 0, 'Active'],
        ['CORP', 'Corporate Company Schemes', 'No', 0, 'Active'],
        ['INS', 'Private Commercial Insurance', 'No', 0, 'Active'],
        ['EMP', 'Employees & Dependants', 'No', 25, 'Active'],
      ];
      break;

    case 'sub_categories':
      fileName = 'sample_sub_categories_and_schemes_template.csv';
      headers = [
        'Main Category Code',
        'Sub Category Code',
        'Sub Category Name',
        'Is Cash (Yes/No)',
        'Scheme Code',
        'Scheme Name',
        'Scheme Type (Outpatient/Inpatient/Comprehensive)',
        'CoPay Rule',
        'CoPay Amount (KSh)',
        'Credit Limit (KSh)',
        'PreAuth Required (Yes/No)',
        'Contact Person',
        'Contact Phone',
      ];
      sampleRows = [
        [
          'SHA',
          'SHA-COMP',
          'SHA Comprehensive Public Scheme',
          'No',
          'SCH-SHA-01',
          'Social Health Authority - Comprehensive Care',
          'Comprehensive',
          '0% Direct Capitation',
          0,
          500000,
          'Yes',
          'SHA Desk',
          '+254202723255',
        ],
        [
          'SHA',
          'SHA-PRIM',
          'SHA Primary Care Network (PCN)',
          'No',
          'SCH-SHA-02',
          'Social Health Authority - Primary Health Network',
          'Outpatient',
          '0% for Outpatient',
          0,
          150000,
          'No',
          'PCN Officer',
          '+254700889900',
        ],
        [
          'INS',
          'JUB-GOLD',
          'Jubilee Insurance Gold Executive',
          'No',
          'SCH-JUB-01',
          'Jubilee Health Insurance Executive Corporate Pool',
          'Comprehensive',
          '10% Co-Pay Non-Generic',
          200,
          1000000,
          'Yes',
          'Jubilee Approvals',
          '+254709901000',
        ],
        [
          'CORP',
          'SAF-STAFF',
          'Safaricom PLC Staff Scheme',
          'No',
          'SCH-SAF-01',
          'Safaricom Employee & Family Medical Trust',
          'Comprehensive',
          '0% Co-Pay Corporate Direct',
          0,
          1200000,
          'No',
          'HR Wellness',
          '+254722000000',
        ],
        ['CASH', 'CASH-GEN', 'General Cash Walk-In', 'Yes', '', '', '', '100% Out of Pocket', 0, 0, 'No', 'Reception', '+254207900000'],
      ];
      break;

    case 'departments':
      fileName = 'sample_departments_template.csv';
      headers = ['Department Code', 'Department Name', 'Department Type', 'Head of Department', 'Phone Extension', 'Location', 'Status'];
      sampleRows = [
        ['OPD', 'Outpatient Department (OPD)', 'Clinical', 'Dr. Patrick Ochieng, MD', '101', 'Ground Floor, Block A', 'Active'],
        ['TRIAGE', 'Nursing & Triage Station', 'Clinical', 'Nurse Beatrice Maina', '102', 'Reception Lobby', 'Active'],
        ['LAB', 'Pathology & Diagnostic Laboratory', 'Diagnostic', 'Evans Otieno, MLT', '103', 'Ground Floor, Wing C', 'Active'],
        ['PHARM', 'Pharmacy & Therapeutics', 'Support', 'Pharm. Stephen Karanja', '104', 'Ground Floor, Exit', 'Active'],
        ['RAD', 'Radiology & Medical Imaging', 'Diagnostic', 'Dr. Susan Kibet', '105', 'Basement Level 1', 'Active'],
        ['MAT', 'Maternity, Labour & MCH Ward', 'Inpatient', 'Dr. Faith Mutua', '203', '2nd Floor, Block M', 'Active'],
      ];
      break;

    case 'consultations':
    case 'consultation_setup':
      fileName = 'sample_consultation_services_template.csv';
      headers = [
        'Service Code',
        'Consultation Name',
        'Department',
        'Duration (Minutes)',
        'Cash Price (KSh)',
        'SHA Price (KSh)',
        'Corporate Price (KSh)',
        'Description',
      ];
      sampleRows = [
        [
          'CONS-OPD-01',
          'General Medical Outpatient Consultation',
          'Outpatient Department (OPD)',
          15,
          500,
          1200,
          1500,
          'Routine medical consultation and history taking',
        ],
        [
          'CONS-PED-01',
          'Consultant Pediatrician Review Clinic',
          'Pediatric Medical Ward',
          25,
          2000,
          2500,
          3000,
          'Specialist child healthcare and developmental exam',
        ],
        [
          'CONS-PHY-01',
          'Consultant Physician Review (Chronic Clinic)',
          'Outpatient Department (OPD)',
          30,
          2500,
          3000,
          3500,
          'Specialized hypertension and diabetes management',
        ],
        [
          'CONS-EMERG-01',
          'Emergency Casualty & Resuscitation',
          'Outpatient Department (OPD)',
          15,
          1000,
          2000,
          2500,
          'Urgent medical stabilization and acute trauma triage',
        ],
      ];
      break;

    case 'wards':
      fileName = 'sample_wards_tariff_template.csv';
      headers = [
        'Ward ID',
        'Ward Name',
        'Category',
        'Total Beds',
        'Occupied Beds',
        'Cash Daily Rate (KSh)',
        'Nurse In Charge',
        'Floor',
        'Bed Charge',
        'Nursing Care',
        'Meals & Nutrition',
        'Daily Review',
      ];
      sampleRows = [
        ['WARD-MMW', 'Male Medical Ward', 'Male Medical', 20, 0, 1500, 'Nurse In Charge', '1st Floor', 1500, 500, 300, 300],
        ['WARD-ICU', 'ICU / HDU', 'ICU / HDU', 6, 0, 12000, 'Critical Care Nurse', '3rd Floor', 12000, 2500, 1000, 1500],
      ];
      break;

    case 'inpatient_beds':
      fileName = 'sample_inpatient_beds_template.csv';
      headers = [
        'Bed Number',
        'Ward Name',
        'Bed Type',
        'Bed Charge (KSh/day)',
        'Nursing Care (KSh/day)',
        'Meals & Nutrition (KSh/day)',
        'Daily Review (KSh/day)',
        'SHA Daily Total (KSh)',
        'Corporate Daily Total (KSh)',
        'Oxygen Equipped (Yes/No)',
        'Cardiac Monitor (Yes/No)',
        'Status',
      ];
      sampleRows = [
        ['MMW-B01', 'Male Medical Ward', 'General', 1500, 500, 300, 300, 5200, 6000, 'Yes', 'No', 'Available'],
        ['FSW-B01', 'Female Surgical Ward', 'General', 1500, 500, 300, 300, 5200, 6000, 'Yes', 'No', 'Available'],
        ['MAT-B01', 'Maternity Ward', 'Semi-Private', 2500, 800, 500, 500, 8000, 9500, 'Yes', 'Yes', 'Available'],
        ['ICU-B01', 'Intensive Care Unit (ICU)', 'ICU', 12000, 2500, 1000, 1500, 17000, 22000, 'Yes', 'Yes', 'Available'],
        ['PRV-101', 'Executive Private Wing', 'Private', 6500, 1000, 700, 600, 9000, 11000, 'Yes', 'Yes', 'Available'],
      ];
      break;

    case 'inpatient_packages':
      fileName = 'sample_inpatient_packages_template.csv';
      headers = [
        'Package Code',
        'Package Name',
        'Ward Type',
        'Included Days',
        'Included Procedures (semicolon separated)',
        'Cash Price (KSh)',
        'SHA Price (KSh)',
        'Corporate Price (KSh)',
        'Overstay Rate (KSh/day)',
        'Description',
      ];
      sampleRows = [
        [
          'PKG-MAT-NVD',
          'Normal Vaginal Delivery (NVD) Package',
          'Maternity Ward',
          2,
          'Labour Ward Delivery Care; Obstetrician Attendance; Neonatal Resuscitation; 2 Days Ward Accommodation',
          28000,
          35000,
          45000,
          2500,
          'Comprehensive normal maternal delivery bundle',
        ],
        [
          'PKG-MAT-CS',
          'Cesarean Section (C-Section) Package',
          'Maternity Ward',
          3,
          'Theatre Charges; Anaesthesia; Surgeon Fees; 3 Days Semi-Private Stay; Routine Neonatal Care',
          65000,
          75000,
          95000,
          3500,
          'Elective or emergency C-Section bundle',
        ],
        [
          'PKG-SURG-APP',
          'Laparoscopic Appendectomy Bundle',
          'Surgical Ward',
          2,
          'Laparoscopic Theatre; Anaesthesia; Surgeon Fees; Biopsy Histopathology; 2 Days Inpatient Stay',
          75000,
          85000,
          110000,
          3000,
          'Keyhole appendix removal bundle',
        ],
      ];
      break;

    case 'cancer_setup':
      fileName = 'sample_cancer_oncology_protocols_template.csv';
      headers = [
        'Protocol Code',
        'Protocol Name',
        'Treatment Type',
        'Regimen',
        'Intent',
        'Route',
        'Cycle Days',
        'Default Cycles',
        'Department',
        'Preauthorization Required (Yes/No)',
        'SHA Benefit Code',
        'Description',
      ];
      sampleRows = [
        [
          'ONC-CHOP',
          'CHOP Chemotherapy Protocol',
          'Chemotherapy',
          'Cyclophosphamide + Doxorubicin + Vincristine + Prednisone',
          'Curative',
          'IV',
          21,
          6,
          'Oncology',
          'Yes',
          'SHA-ONC',
          'Example oncology protocol',
        ],
        [
          'ONC-FOLFOX',
          'FOLFOX Chemotherapy Protocol',
          'Chemotherapy',
          '5-FU + Leucovorin + Oxaliplatin',
          'Curative',
          'IV',
          14,
          8,
          'Oncology',
          'Yes',
          'SHA-ONC',
          'Example gastrointestinal oncology protocol',
        ],
        [
          'ONC-IMMUNO',
          'Pembrolizumab Immunotherapy',
          'Immunotherapy',
          'Pembrolizumab',
          'Disease Control',
          'IV',
          21,
          8,
          'Oncology',
          'Yes',
          'SHA-ONC',
          'Example immunotherapy protocol',
        ],
      ];
      break;

    case 'sub_category_pricing':
      fileName = 'sample_sub_category_bulk_tariffs_template.csv';
      headers = ['Item Code', 'Item Name', 'Category', 'Cash Price (KSh)', 'SHA Price (KSh)', 'Corporate Price (KSh)'];
      sampleRows = [
        ['LAB-HEM-01', 'Full Blood Count (FBC / CBC)', 'Laboratory', 650, 600, 800, ''],
        ['RAD-XR-01', 'Chest X-Ray (PA & Lateral)', 'Radiology', 1800, 1500, 2200],
        ['NUR-WND-01', 'Aseptic Wound Dressing (Minor)', 'Nursing', 500, 400, 650],
        ['DRUG-001', 'Augmentin 625mg', 'Pharmacy', 1200, 1100, 1450],
      ];
      break;

    case 'lab_tests':
    case 'lab_prices':
    case 'lab_parameters':
      fileName = 'sample_lab_tests_and_parameters_template.csv';
      headers = [
        'Test Code',
        'Test Name',
        'Department',
        'Specimen Type',
        'Turnaround (Mins)',
        'Cash Price (KSh)',
        'SHA Price (KSh)',
        'Corporate Price (KSh)',
        'Parameters (name:unit:normalRange separated by semicolon)',
        'Parameters JSON (optional)',
        'Parameter Name (optional detail rows)',
        'Unit',
        'Male Range',
        'Female Range',
        'Pediatric Range',
        'Critical Low',
        'Critical High',
        'Qualitative Options (| separated)',
        'Mandatory (Yes/No)',
      ];
      sampleRows = [
        [
          'LAB-HEM-01',
          'Full Blood Count (FBC / CBC)',
          'Hematology',
          'Whole Blood (EDTA)',
          30,
          650,
          600,
          800,
          'Hemoglobin:g/dL:13.0-17.5; WBC:x10^9/L:4.0-11.0; Platelets:x10^9/L:150-450; Hematocrit:%:40-52',
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          '',
        ],
        [
          'LAB-URN-01',
          'Urinalysis Dipstick + Microscopy',
          'Urinalysis',
          'Clean Catch Midstream Urine',
          20,
          400,
          350,
          500,
          'pH:pH:5.0-8.0; Protein:mg/dL:Negative; Glucose:mmol/L:Negative; Pus Cells:/HPF:0-5',
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          '',
        ],
        [
          'LAB-CHEM-02',
          'Renal Function Tests (U/C/E)',
          'Clinical Chemistry',
          'Serum (SST Tube)',
          45,
          1500,
          1200,
          1800,
          'Urea:mmol/L:2.5-7.8; Creatinine:µmol/L:62-106; Sodium:mmol/L:135-145; Potassium:mmol/L:3.5-5.1',
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          '',
        ],
        [
          'LAB-PAR-01',
          'Malaria Blood Smear (BS / RDT)',
          'Parasitology',
          'Capillary Blood',
          15,
          300,
          250,
          400,
          'Malaria Ag:RDT:Negative; Parasite Count:parasites/µL:Nil seen',
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          '',
        ],
      ];
      break;

    case 'radiology_tests':
    case 'radiology_prices':
    case 'radiology_templates':
      fileName = 'sample_radiology_tests_and_templates_template.csv';
      headers = [
        'Test Code',
        'Test Name',
        'Category',
        'Modality',
        'Cash Price (KSh)',
        'SHA Price (KSh)',
        'Corporate Price (KSh)',
        'Contrast Required (Yes/No)',
        'Preparation Instructions',
        'Report Template Name',
        'Normal Report Summary',
      ];
      sampleRows = [
        [
          'RAD-XR-01',
          'Chest X-Ray (PA & Lateral)',
          'X-Ray Thorax',
          'X-Ray',
          1800,
          1500,
          2200,
          'No',
          'Remove metallic necklaces and bra underwires',
          'Chest X-Ray PA View - Normal Adult Study',
          'Clear lung fields bilaterally. Normal CTR < 0.50. Sharp angles.',
        ],
        [
          'RAD-US-01',
          'Abdominal & Pelvic Ultrasound',
          'General Sonography',
          'Ultrasound',
          2500,
          2000,
          3000,
          'No',
          'Fast 6-8 hrs. Full bladder required.',
          'Abdominal & Pelvic Ultrasound - Normal Adult Scan',
          'Normal liver, gallbladder, kidneys, spleen, and bladder morphology.',
        ],
        [
          'RAD-CT-01',
          'Non-Contrast Brain CT Scan',
          'Neuroimaging',
          'CT Scan',
          7500,
          6000,
          9000,
          'No',
          'Remove hair clips and dentures',
          'Non-Contrast Head CT Scan - Normal Study',
          'No acute intracranial hemorrhage or midline shift.',
        ],
      ];
      break;

    case 'nursing_procedures':
    case 'nursing_prices':
      fileName = 'sample_nursing_procedures_template.csv';
      headers = [
        'Procedure Code',
        'Procedure Name',
        'Department',
        'Consumables Required',
        'Cash Price (KSh)',
        'SHA Price (KSh)',
        'Corporate Price (KSh)',
      ];
      sampleRows = [
        [
          'NUR-WND-01',
          'Aseptic Wound Dressing (Minor)',
          'Nursing OPD / Triage',
          'Sterile Gauze, Betadine, Micropore, Gloves',
          500,
          400,
          650,
        ],
        [
          'NUR-IV-01',
          'IV Cannulation & Infusion Setup',
          'Clinical Care / IPD',
          'IV Cannula 20G/22G, Giving Set, Normal Saline 500ml',
          800,
          700,
          1000,
        ],
        [
          'NUR-NEB-01',
          'Nebulization Therapy (Per Session)',
          'Emergency / Pediatric',
          'Jet Nebulizer Mask, Salbutamol Respule',
          400,
          350,
          550,
        ],
        [
          'NUR-CTH-01',
          'Foley Urinary Catheterization',
          'Inpatient / Emergency',
          'Foley 2-Way Catheter, Urine Bag, Lignocaine Gel',
          1000,
          850,
          1300,
        ],
      ];
      break;

    case 'drug_prices':
    case 'inventory_items':
      fileName = 'sample_pharmacy_drug_prices_template.csv';
      headers = [
        'Drug Code',
        'Brand Name',
        'Generic Name',
        'Formulation',
        'Strength',
        'Category',
        'Cash Price (KSh)',
        'SHA Price (KSh)',
        'Corporate Price (KSh)',
      ];
      sampleRows = [
        ['DRUG-001', 'Augmentin 625mg', 'Amoxicillin + Clavulanic Acid', 'Tablet', '625mg', 'Antibiotic', 1200, 1100, 1450],
        ['DRUG-002', 'Panadol Extra', 'Paracetamol + Caffeine', 'Tablet', '500mg/65mg', 'Analgesic', 150, 120, 200],
        ['DRUG-003', 'Rocephin 1g Inj', 'Ceftriaxone Sodium for Inj', 'Vial', '1g IV/IM', 'Antibiotic', 850, 750, 1100],
        ['DRUG-005', 'Glucophage 500mg', 'Metformin Hydrochloride', 'Tablet', '500mg', 'Antidiabetic', 400, 350, 500],
        ['DRUG-008', 'Ventolin Inhaler', 'Salbutamol Sulfate CFC-Free Inhaler', 'Inhaler', '100mcg/dose', 'Respiratory', 900, 800, 1150],
      ];
      break;

    default:
      fileName = 'sample_setup_import_template.csv';
      headers = ['Item Code', 'Item Name', 'Category', 'Cash Price', 'SHA Price', 'Corporate Price', 'Status'];
      sampleRows = [
        ['CODE-001', 'Sample Item One', 'General', 500, 450, 600, 'Active'],
        ['CODE-002', 'Sample Item Two', 'Diagnostic', 1200, 1000, 1500, 'Active'],
      ];
  }

  const csvRows: string[] = [];
  csvRows.push(headers.map(escapeCsvCell).join(','));
  sampleRows.forEach((row) => {
    csvRows.push(row.map(escapeCsvCell).join(','));
  });

  const csvString = '\uFEFF' + csvRows.join('\r\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function parseExcelOrCsvFile(file: File): Promise<ParsedSheetData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          throw new Error('The uploaded file does not contain any sheets.');
        }

        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson = XLSX.utils.sheet_to_json<any[]>(worksheet, {
          header: 1,
          defval: '',
        });

        if (!rawJson || rawJson.length === 0) {
          throw new Error('The uploaded sheet appears to be empty.');
        }

        const headerRow: string[] = (rawJson[0] || []).map((h: any) => String(h || '').trim());
        const filteredHeaders = headerRow.filter((h) => h.length > 0);

        const dataRows: Record<string, string | number>[] = [];
        for (let i = 1; i < rawJson.length; i++) {
          const rowValues = rawJson[i];
          if (!rowValues || rowValues.length === 0) continue;

          const hasContent = rowValues.some((val: any) => val !== undefined && val !== null && String(val).trim() !== '');
          if (!hasContent) continue;

          const rowObj: Record<string, string | number> = {};
          headerRow.forEach((colName, colIdx) => {
            if (colName) {
              rowObj[colName] = rowValues[colIdx] !== undefined ? rowValues[colIdx] : '';
            }
          });
          dataRows.push(rowObj);
        }

        resolve({
          fileName: file.name,
          sheetName: firstSheetName,
          headers: filteredHeaders,
          rows: dataRows,
          totalCount: dataRows.length,
        });
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to parse the uploaded Excel/CSV file';
        reject(new Error(errorMsg));
      }
    };

    reader.onerror = () => {
      reject(new Error('File reading failed. Please check file permissions and try again.'));
    };

    reader.readAsArrayBuffer(file);
  });
}

function escapeCsvCell(val: string | number): string {
  const str = String(val === undefined || val === null ? '' : val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}
