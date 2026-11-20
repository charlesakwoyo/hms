/*M!999999\- enable the sandbox mode */ 
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
DROP TABLE IF EXISTS `admission_clinical_notes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `admission_clinical_notes` (
  `id` varchar(50) NOT NULL,
  `patient_id` varchar(50) NOT NULL,
  `admission_id` varchar(50) NOT NULL,
  `chief_complaint` text DEFAULT NULL,
  `examination_json` longtext DEFAULT NULL,
  `history_present_illness` text DEFAULT NULL,
  `past_history` text DEFAULT NULL,
  `pre_medications_json` longtext DEFAULT NULL,
  `tobacco_use` varchar(10) DEFAULT NULL,
  `alcohol_use` varchar(10) DEFAULT NULL,
  `substance_notes` text DEFAULT NULL,
  `primary_diagnosis` varchar(255) DEFAULT NULL,
  `differential_diagnoses` text DEFAULT NULL,
  `orders_json` longtext DEFAULT NULL,
  `management_plan` text DEFAULT NULL,
  `clinician_name` varchar(180) DEFAULT NULL,
  `license_no` varchar(100) DEFAULT NULL,
  `designation` varchar(150) DEFAULT NULL,
  `signed_at` datetime DEFAULT NULL,
  `status` varchar(30) DEFAULT 'Signed',
  `created_by` varchar(180) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `patient_id` (`patient_id`),
  KEY `idx_acn_admission` (`admission_id`),
  CONSTRAINT `admission_clinical_notes_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE,
  CONSTRAINT `admission_clinical_notes_ibfk_2` FOREIGN KEY (`admission_id`) REFERENCES `admissions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `admissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `admissions` (
  `id` varchar(50) NOT NULL,
  `patient_id` varchar(50) NOT NULL,
  `patient_name` varchar(180) DEFAULT NULL,
  `patient_age` int(11) DEFAULT NULL,
  `patient_gender` varchar(20) DEFAULT NULL,
  `ward_id` varchar(50) NOT NULL,
  `bed_number` varchar(80) DEFAULT NULL,
  `admitted_date` date DEFAULT NULL,
  `admitted_time` time DEFAULT NULL,
  `admitting_doctor` varchar(180) DEFAULT NULL,
  `primary_nurse` varchar(180) DEFAULT NULL,
  `admitting_diagnosis` text DEFAULT NULL,
  `icd_code` varchar(80) DEFAULT NULL,
  `insurance_provider` varchar(180) DEFAULT NULL,
  `scheme_id` bigint(20) unsigned DEFAULT NULL,
  `sha_preauth_number` varchar(120) DEFAULT NULL,
  `sha_rebate_package` varchar(180) DEFAULT NULL,
  `sha_daily_rebate` decimal(12,2) DEFAULT NULL,
  `net_daily_bed_charge` decimal(12,2) DEFAULT NULL,
  `status` varchar(40) DEFAULT NULL,
  `discharge_date` date DEFAULT NULL,
  `discharge_summary` text DEFAULT NULL,
  `emergency_contact` varchar(180) DEFAULT NULL,
  `emergency_phone` varchar(50) DEFAULT NULL,
  `daily_bed_charge` decimal(12,2) DEFAULT NULL,
  `total_days_stayed` int(11) DEFAULT 0,
  `diet_instructions` text DEFAULT NULL,
  `attending_specialist` varchar(180) DEFAULT NULL,
  `setup_bed_id` bigint(20) DEFAULT NULL,
  `inpatient_package_id` bigint(20) DEFAULT NULL,
  `tariff_scheme` varchar(100) DEFAULT NULL,
  `bed_charge` decimal(12,2) NOT NULL DEFAULT 0.00,
  `nursing_care_charge` decimal(12,2) NOT NULL DEFAULT 0.00,
  `meals_nutrition_charge` decimal(12,2) NOT NULL DEFAULT 0.00,
  `daily_review_charge` decimal(12,2) NOT NULL DEFAULT 0.00,
  `daily_accommodation_charge` decimal(12,2) NOT NULL DEFAULT 0.00,
  `branch_id` bigint(20) unsigned DEFAULT 1,
  `tariff_sub_category_id` bigint(20) DEFAULT NULL,
  `tariff_sub_category_code` varchar(100) DEFAULT NULL,
  `tariff_sub_category_name` varchar(180) DEFAULT NULL,
  `visit_id` varchar(50) DEFAULT NULL,
  `inpatient_package_name` varchar(180) DEFAULT NULL,
  `inpatient_package_price` decimal(12,2) DEFAULT NULL,
  `inpatient_package_included_days` int(11) DEFAULT NULL,
  `bill_discount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `bill_discount_type` varchar(80) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_admission_patient` (`patient_id`),
  KEY `fk_admission_ward` (`ward_id`),
  KEY `idx_admission_setup_bed` (`setup_bed_id`),
  KEY `idx_admission_package` (`inpatient_package_id`),
  KEY `idx_admissions_branch` (`branch_id`),
  KEY `idx_admissions_scheme` (`scheme_id`),
  KEY `idx_admissions_visit` (`visit_id`),
  KEY `idx_admissions_package` (`inpatient_package_id`),
  KEY `idx_admissions_status_ward` (`status`,`ward_id`),
  KEY `idx_admissions_patient_status` (`patient_id`,`status`),
  CONSTRAINT `fk_admission_inpatient_package` FOREIGN KEY (`inpatient_package_id`) REFERENCES `setup_inpatient_packages` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_admission_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_admission_setup_bed` FOREIGN KEY (`setup_bed_id`) REFERENCES `setup_bed_items` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_admission_ward` FOREIGN KEY (`ward_id`) REFERENCES `wards` (`id`),
  CONSTRAINT `fk_admissions_branch` FOREIGN KEY (`branch_id`) REFERENCES `hospital_branches` (`id`) ON DELETE NO ACTION,
  CONSTRAINT `fk_admissions_visit` FOREIGN KEY (`visit_id`) REFERENCES `patient_visits` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `appointments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `appointments` (
  `id` varchar(50) NOT NULL,
  `appointment_number` varchar(50) DEFAULT NULL,
  `patient_id` varchar(50) NOT NULL,
  `visit_id` varchar(50) DEFAULT NULL,
  `branch_id` bigint(20) unsigned NOT NULL DEFAULT 1,
  `department_id` bigint(20) DEFAULT NULL,
  `consultation_service_id` bigint(20) DEFAULT NULL,
  `appointment_date` date NOT NULL,
  `appointment_time` time NOT NULL,
  `consultation_type` varchar(180) DEFAULT NULL,
  `reason` text DEFAULT NULL,
  `status` varchar(40) NOT NULL DEFAULT 'Scheduled',
  `booked_by` varchar(50) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_appointment_number` (`appointment_number`),
  KEY `idx_appt_patient_date` (`patient_id`,`appointment_date`),
  KEY `idx_appt_branch_date` (`branch_id`,`appointment_date`),
  KEY `idx_appt_visit` (`visit_id`),
  KEY `fk_appt_department` (`department_id`),
  KEY `fk_appt_service` (`consultation_service_id`),
  CONSTRAINT `fk_appt_branch` FOREIGN KEY (`branch_id`) REFERENCES `hospital_branches` (`id`),
  CONSTRAINT `fk_appt_department` FOREIGN KEY (`department_id`) REFERENCES `setup_departments` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_appt_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_appt_service` FOREIGN KEY (`consultation_service_id`) REFERENCES `setup_consultation_services` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_appt_visit` FOREIGN KEY (`visit_id`) REFERENCES `patient_visits` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `audit_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_log` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` varchar(50) DEFAULT NULL,
  `action` varchar(80) DEFAULT NULL,
  `entity_type` varchar(80) DEFAULT NULL,
  `entity_id` varchar(100) DEFAULT NULL,
  `details_json` longtext DEFAULT NULL,
  `ip_address` varchar(80) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `branch_id` bigint(20) unsigned DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `idx_audit_log_branch` (`branch_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `auth_login_attempts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_login_attempts` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `username` varchar(180) DEFAULT NULL,
  `user_id` varchar(50) DEFAULT NULL,
  `ip` varchar(64) NOT NULL,
  `success` tinyint(1) NOT NULL,
  `reason` varchar(60) DEFAULT NULL,
  `user_agent` varchar(255) DEFAULT NULL,
  `attempted_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_ala_ip` (`ip`,`attempted_at`),
  KEY `idx_ala_user` (`username`,`attempted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `beds`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `beds` (
  `id` varchar(50) NOT NULL,
  `bed_number` varchar(80) DEFAULT NULL,
  `ward_id` varchar(50) NOT NULL,
  `status` varchar(40) DEFAULT NULL,
  `patient_id` varchar(50) DEFAULT NULL,
  `admission_id` varchar(50) DEFAULT NULL,
  `daily_rate` decimal(12,2) DEFAULT 0.00,
  `has_oxygen` tinyint(1) DEFAULT 0,
  `notes` text DEFAULT NULL,
  `branch_id` bigint(20) unsigned DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `fk_bed_patient` (`patient_id`),
  KEY `idx_bed_ward` (`ward_id`),
  KEY `idx_beds_branch` (`branch_id`),
  CONSTRAINT `fk_bed_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_bed_ward` FOREIGN KEY (`ward_id`) REFERENCES `wards` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_beds_branch` FOREIGN KEY (`branch_id`) REFERENCES `hospital_branches` (`id`) ON DELETE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `blood_units`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `blood_units` (
  `id` varchar(50) NOT NULL,
  `unit_number` varchar(120) DEFAULT NULL,
  `blood_group` varchar(10) DEFAULT NULL,
  `component_type` varchar(100) DEFAULT NULL,
  `collection_date` date DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `volume_ml` decimal(10,2) DEFAULT NULL,
  `storage_location` varchar(150) DEFAULT NULL,
  `hiv_result` varchar(30) DEFAULT NULL,
  `hep_b_result` varchar(30) DEFAULT NULL,
  `hep_c_result` varchar(30) DEFAULT NULL,
  `syphilis_result` varchar(30) DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  `donor_id` varchar(100) DEFAULT NULL,
  `assigned_patient_id` varchar(50) DEFAULT NULL,
  `assigned_patient_name` varchar(180) DEFAULT NULL,
  `branch_id` bigint(20) unsigned DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `assigned_patient_id` (`assigned_patient_id`),
  KEY `idx_blood_units_branch` (`branch_id`),
  CONSTRAINT `blood_units_ibfk_1` FOREIGN KEY (`assigned_patient_id`) REFERENCES `patients` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_blood_units_branch` FOREIGN KEY (`branch_id`) REFERENCES `hospital_branches` (`id`) ON DELETE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `branch_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `branch_settings` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `branch_id` bigint(20) unsigned NOT NULL,
  `setting_key` varchar(100) NOT NULL,
  `setting_value` longtext DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_branch_setting` (`branch_id`,`setting_key`),
  CONSTRAINT `fk_bs_branch` FOREIGN KEY (`branch_id`) REFERENCES `hospital_branches` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `branch_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `branch_users` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `branch_id` bigint(20) unsigned NOT NULL,
  `user_id` varchar(100) NOT NULL,
  `is_primary` tinyint(1) NOT NULL DEFAULT 0,
  `status` varchar(30) NOT NULL DEFAULT 'Active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_branch_user` (`branch_id`,`user_id`),
  CONSTRAINT `fk_bu_branch` FOREIGN KEY (`branch_id`) REFERENCES `hospital_branches` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `budget_allocations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `budget_allocations` (
  `id` varchar(50) NOT NULL,
  `fiscal_year` varchar(30) DEFAULT NULL,
  `department` varchar(150) DEFAULT NULL,
  `cost_center_code` varchar(80) DEFAULT NULL,
  `budget_category` varchar(120) DEFAULT NULL,
  `allocated_amount` decimal(14,2) DEFAULT NULL,
  `utilized_amount` decimal(14,2) DEFAULT NULL,
  `balance_amount` decimal(14,2) DEFAULT NULL,
  `utilization_rate` decimal(8,2) DEFAULT NULL,
  `status` varchar(30) DEFAULT NULL,
  `branch_id` bigint(20) unsigned DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `idx_budget_allocations_branch` (`branch_id`),
  CONSTRAINT `fk_budget_allocations_branch` FOREIGN KEY (`branch_id`) REFERENCES `hospital_branches` (`id`) ON DELETE NO ACTION,
  CONSTRAINT `fk_budget_branch` FOREIGN KEY (`branch_id`) REFERENCES `hospital_branches` (`id`) ON DELETE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `cancer_billing_links`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `cancer_billing_links` (
  `id` varchar(50) NOT NULL,
  `patient_id` varchar(50) NOT NULL,
  `plan_id` varchar(50) NOT NULL,
  `cycle_id` varchar(50) DEFAULT NULL,
  `session_id` varchar(50) DEFAULT NULL,
  `invoice_id` varchar(50) NOT NULL,
  `billing_stage` varchar(80) NOT NULL,
  `amount` decimal(12,2) DEFAULT 0.00,
  `sha_rebate` decimal(12,2) DEFAULT 0.00,
  `patient_copay` decimal(12,2) DEFAULT 0.00,
  `status` varchar(40) DEFAULT 'Open',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `branch_id` bigint(20) unsigned DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `idx_cbl_patient` (`patient_id`),
  KEY `idx_cbl_plan` (`plan_id`),
  KEY `idx_cbl_invoice` (`invoice_id`),
  KEY `fk_cbl_cycle` (`cycle_id`),
  KEY `fk_cbl_session` (`session_id`),
  KEY `idx_cancer_billing_links_branch` (`branch_id`),
  CONSTRAINT `fk_cbl_cycle` FOREIGN KEY (`cycle_id`) REFERENCES `cancer_treatment_cycles` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_cbl_invoice` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cbl_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cbl_plan` FOREIGN KEY (`plan_id`) REFERENCES `cancer_treatment_plans` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cbl_session` FOREIGN KEY (`session_id`) REFERENCES `cancer_treatment_sessions` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `cancer_preauth_links`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `cancer_preauth_links` (
  `id` varchar(50) NOT NULL,
  `patient_id` varchar(50) NOT NULL,
  `plan_id` varchar(50) NOT NULL,
  `cycle_id` varchar(50) DEFAULT NULL,
  `session_id` varchar(50) DEFAULT NULL,
  `preauth_id` varchar(50) NOT NULL,
  `preauth_number` varchar(120) DEFAULT NULL,
  `status` varchar(40) DEFAULT 'Linked',
  `linked_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `branch_id` bigint(20) unsigned DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `idx_cpl_patient` (`patient_id`),
  KEY `idx_cpl_plan` (`plan_id`),
  KEY `idx_cpl_preauth` (`preauth_id`),
  KEY `fk_cpl_cycle` (`cycle_id`),
  KEY `fk_cpl_session` (`session_id`),
  KEY `idx_cancer_preauth_links_branch` (`branch_id`),
  CONSTRAINT `fk_cpl_cycle` FOREIGN KEY (`cycle_id`) REFERENCES `cancer_treatment_cycles` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_cpl_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cpl_plan` FOREIGN KEY (`plan_id`) REFERENCES `cancer_treatment_plans` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cpl_preauth` FOREIGN KEY (`preauth_id`) REFERENCES `sha_preauthorizations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cpl_session` FOREIGN KEY (`session_id`) REFERENCES `cancer_treatment_sessions` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `cancer_sha_claim_links`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `cancer_sha_claim_links` (
  `id` varchar(50) NOT NULL,
  `patient_id` varchar(50) NOT NULL,
  `plan_id` varchar(50) NOT NULL,
  `cycle_id` varchar(50) DEFAULT NULL,
  `session_id` varchar(50) DEFAULT NULL,
  `claim_id` varchar(50) NOT NULL,
  `claim_number` varchar(120) DEFAULT NULL,
  `amount` decimal(12,2) DEFAULT 0.00,
  `status` varchar(40) DEFAULT 'Linked',
  `branch_id` bigint(20) unsigned DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `idx_cscl_claim` (`claim_id`),
  KEY `idx_cscl_plan` (`plan_id`),
  KEY `fk_cscl_patient` (`patient_id`),
  KEY `fk_cscl_cycle` (`cycle_id`),
  KEY `fk_cscl_session` (`session_id`),
  KEY `idx_cancer_sha_claim_links_branch` (`branch_id`),
  CONSTRAINT `fk_cscl_claim` FOREIGN KEY (`claim_id`) REFERENCES `sha_claims` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cscl_cycle` FOREIGN KEY (`cycle_id`) REFERENCES `cancer_treatment_cycles` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_cscl_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cscl_plan` FOREIGN KEY (`plan_id`) REFERENCES `cancer_treatment_plans` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cscl_session` FOREIGN KEY (`session_id`) REFERENCES `cancer_treatment_sessions` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `cancer_treatment_cycles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `cancer_treatment_cycles` (
  `id` varchar(50) NOT NULL,
  `plan_id` varchar(50) NOT NULL,
  `patient_id` varchar(50) NOT NULL,
  `cycle_number` int(11) NOT NULL,
  `scheduled_date` date DEFAULT NULL,
  `actual_date` date DEFAULT NULL,
  `status` varchar(40) DEFAULT 'Planned',
  `sha_preauth_id` varchar(50) DEFAULT NULL,
  `sha_preauth_number` varchar(120) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `branch_id` bigint(20) unsigned DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_ctc_plan_cycle` (`plan_id`,`cycle_number`),
  KEY `idx_ctc_patient` (`patient_id`),
  KEY `fk_ctc_preauth` (`sha_preauth_id`),
  KEY `idx_cancer_treatment_cycles_branch` (`branch_id`),
  CONSTRAINT `fk_ctc_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ctc_plan` FOREIGN KEY (`plan_id`) REFERENCES `cancer_treatment_plans` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ctc_preauth` FOREIGN KEY (`sha_preauth_id`) REFERENCES `sha_preauthorizations` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `cancer_treatment_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `cancer_treatment_items` (
  `id` varchar(50) NOT NULL,
  `session_id` varchar(50) NOT NULL,
  `patient_id` varchar(50) NOT NULL,
  `source_entity` varchar(80) DEFAULT NULL,
  `source_id` varchar(80) DEFAULT NULL,
  `item_code` varchar(100) DEFAULT NULL,
  `item_name` varchar(255) NOT NULL,
  `category` varchar(80) NOT NULL,
  `quantity` decimal(12,2) DEFAULT 1.00,
  `unit_price` decimal(12,2) DEFAULT 0.00,
  `sha_rebate` decimal(12,2) DEFAULT 0.00,
  `patient_copay` decimal(12,2) DEFAULT 0.00,
  `billed_amount` decimal(12,2) DEFAULT 0.00,
  `preauth_ref` varchar(120) DEFAULT NULL,
  `invoice_id` varchar(50) DEFAULT NULL,
  `sha_claim_id` varchar(50) DEFAULT NULL,
  `lab_order_id` varchar(50) DEFAULT NULL,
  `radiology_order_id` varchar(50) DEFAULT NULL,
  `prescription_id` varchar(50) DEFAULT NULL,
  `consultation_id` varchar(50) DEFAULT NULL,
  `inpatient_order_id` varchar(50) DEFAULT NULL,
  `status` varchar(40) DEFAULT 'Planned',
  `branch_id` bigint(20) unsigned DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `idx_cti_session` (`session_id`),
  KEY `idx_cti_patient` (`patient_id`),
  KEY `idx_cti_invoice` (`invoice_id`),
  KEY `idx_cti_claim` (`sha_claim_id`),
  KEY `idx_cti_lab` (`lab_order_id`),
  KEY `idx_cti_rad` (`radiology_order_id`),
  KEY `idx_cti_rx` (`prescription_id`),
  KEY `idx_cti_cons` (`consultation_id`),
  KEY `idx_cti_ipd_order` (`inpatient_order_id`),
  KEY `idx_cancer_treatment_items_branch` (`branch_id`),
  CONSTRAINT `fk_cti_claim` FOREIGN KEY (`sha_claim_id`) REFERENCES `sha_claims` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_cti_cons` FOREIGN KEY (`consultation_id`) REFERENCES `consultations` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_cti_invoice` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_cti_ipd_order` FOREIGN KEY (`inpatient_order_id`) REFERENCES `inpatient_orders` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_cti_lab` FOREIGN KEY (`lab_order_id`) REFERENCES `lab_orders` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_cti_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cti_rad` FOREIGN KEY (`radiology_order_id`) REFERENCES `radiology_orders` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_cti_rx` FOREIGN KEY (`prescription_id`) REFERENCES `prescriptions` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_cti_session` FOREIGN KEY (`session_id`) REFERENCES `cancer_treatment_sessions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `cancer_treatment_plans`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `cancer_treatment_plans` (
  `id` varchar(50) NOT NULL,
  `patient_id` varchar(50) NOT NULL,
  `admission_id` varchar(50) DEFAULT NULL,
  `protocol_id` varchar(50) DEFAULT NULL,
  `diagnosis_code` varchar(100) DEFAULT NULL,
  `diagnosis_name` varchar(255) DEFAULT NULL,
  `stage` varchar(80) DEFAULT NULL,
  `intent` varchar(100) DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `oncologist` varchar(180) DEFAULT NULL,
  `sha_preauth_id` varchar(50) DEFAULT NULL,
  `sha_preauth_number` varchar(120) DEFAULT NULL,
  `total_cycles_planned` int(11) DEFAULT 1,
  `current_cycle` int(11) DEFAULT 0,
  `status` varchar(40) DEFAULT 'Active',
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `branch_id` bigint(20) unsigned DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `idx_ctp_patient` (`patient_id`),
  KEY `idx_ctp_admission` (`admission_id`),
  KEY `idx_ctp_protocol` (`protocol_id`),
  KEY `idx_ctp_preauth` (`sha_preauth_id`),
  KEY `idx_cancer_treatment_plans_branch` (`branch_id`),
  CONSTRAINT `fk_ctp_admission` FOREIGN KEY (`admission_id`) REFERENCES `admissions` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_ctp_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ctp_preauth` FOREIGN KEY (`sha_preauth_id`) REFERENCES `sha_preauthorizations` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_ctp_protocol` FOREIGN KEY (`protocol_id`) REFERENCES `setup_cancer_protocols` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `cancer_treatment_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `cancer_treatment_sessions` (
  `id` varchar(50) NOT NULL,
  `cycle_id` varchar(50) NOT NULL,
  `plan_id` varchar(50) NOT NULL,
  `patient_id` varchar(50) NOT NULL,
  `admission_id` varchar(50) DEFAULT NULL,
  `session_type` varchar(80) NOT NULL DEFAULT 'Chemotherapy Infusion',
  `start_time` datetime DEFAULT NULL,
  `end_time` datetime DEFAULT NULL,
  `clinician` varchar(180) DEFAULT NULL,
  `status` varchar(40) DEFAULT 'Scheduled',
  `vitals_summary` text DEFAULT NULL,
  `clinical_notes` text DEFAULT NULL,
  `sha_preauth_id` varchar(50) DEFAULT NULL,
  `sha_preauth_number` varchar(120) DEFAULT NULL,
  `branch_id` bigint(20) unsigned DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `idx_cts_cycle` (`cycle_id`),
  KEY `idx_cts_plan` (`plan_id`),
  KEY `idx_cts_patient` (`patient_id`),
  KEY `idx_cts_admission` (`admission_id`),
  KEY `fk_cts_preauth` (`sha_preauth_id`),
  KEY `idx_cancer_treatment_sessions_branch` (`branch_id`),
  CONSTRAINT `fk_cts_admission` FOREIGN KEY (`admission_id`) REFERENCES `admissions` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_cts_cycle` FOREIGN KEY (`cycle_id`) REFERENCES `cancer_treatment_cycles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cts_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cts_plan` FOREIGN KEY (`plan_id`) REFERENCES `cancer_treatment_plans` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cts_preauth` FOREIGN KEY (`sha_preauth_id`) REFERENCES `sha_preauthorizations` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `consultation_diagnoses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `consultation_diagnoses` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `consultation_id` varchar(50) NOT NULL,
  `patient_id` varchar(50) NOT NULL,
  `visit_id` varchar(50) DEFAULT NULL,
  `icd11_id` bigint(20) DEFAULT NULL,
  `diagnosis_code` varchar(100) DEFAULT NULL,
  `diagnosis_title` varchar(255) DEFAULT NULL,
  `diagnosis_type` varchar(40) DEFAULT 'Primary',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_cd_consultation` (`consultation_id`),
  KEY `idx_cd_patient_visit` (`patient_id`,`visit_id`),
  KEY `fk_cd_visit` (`visit_id`),
  KEY `fk_cd_icd11` (`icd11_id`),
  CONSTRAINT `fk_cd_consultation` FOREIGN KEY (`consultation_id`) REFERENCES `consultations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cd_icd11` FOREIGN KEY (`icd11_id`) REFERENCES `setup_icd11` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_cd_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cd_visit` FOREIGN KEY (`visit_id`) REFERENCES `patient_visits` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `consultations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `consultations` (
  `id` varchar(50) NOT NULL,
  `patient_id` varchar(50) NOT NULL,
  `patient_name` varchar(180) DEFAULT NULL,
  `doctor_name` varchar(180) DEFAULT NULL,
  `timestamp_value` datetime DEFAULT NULL,
  `chief_complaint` text DEFAULT NULL,
  `history_of_present_illness` text DEFAULT NULL,
  `examination_findings` text DEFAULT NULL,
  `provisional_diagnosis` text DEFAULT NULL,
  `icd_code` varchar(80) DEFAULT NULL,
  `payment_scheme` varchar(120) DEFAULT NULL,
  `management_plan` text DEFAULT NULL,
  `status` varchar(30) DEFAULT 'Draft',
  `setup_consultation_service_id` bigint(20) DEFAULT NULL,
  `department_id` bigint(20) DEFAULT NULL,
  `icd11_id` bigint(20) DEFAULT NULL,
  `consultation_type` varchar(180) DEFAULT NULL,
  `consultation_fee` decimal(12,2) NOT NULL DEFAULT 0.00,
  `patient_sub_category` varchar(100) DEFAULT NULL,
  `setup_consultation_service_code` varchar(80) DEFAULT NULL,
  `branch_id` bigint(20) unsigned DEFAULT 1,
  `visit_id` varchar(50) DEFAULT NULL,
  `follow_up_at` datetime DEFAULT NULL,
  `follow_up_department_id` bigint(20) DEFAULT NULL,
  `follow_up_department` varchar(180) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_consult_patient` (`patient_id`),
  KEY `idx_consult_setup_service` (`setup_consultation_service_id`),
  KEY `idx_consult_department` (`department_id`),
  KEY `idx_consult_icd11` (`icd11_id`),
  KEY `idx_consultations_branch` (`branch_id`),
  KEY `idx_consultations_visit` (`visit_id`),
  CONSTRAINT `fk_consult_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_consultation_department` FOREIGN KEY (`department_id`) REFERENCES `setup_departments` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_consultation_icd11` FOREIGN KEY (`icd11_id`) REFERENCES `setup_icd11` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_consultation_setup_service` FOREIGN KEY (`setup_consultation_service_id`) REFERENCES `setup_consultation_services` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_consultations_branch` FOREIGN KEY (`branch_id`) REFERENCES `hospital_branches` (`id`) ON DELETE NO ACTION,
  CONSTRAINT `fk_consultations_visit` FOREIGN KEY (`visit_id`) REFERENCES `patient_visits` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `dental_consultations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `dental_consultations` (
  `id` varchar(80) NOT NULL,
  `patient_id` varchar(50) NOT NULL,
  `patient_name` varchar(180) DEFAULT NULL,
  `consulted_at` datetime DEFAULT NULL,
  `dentist` varchar(180) DEFAULT NULL,
  `chief_complaint` text DEFAULT NULL,
  `diagnosis` text DEFAULT NULL,
  `status` varchar(30) DEFAULT NULL,
  `invoice_id` varchar(80) DEFAULT NULL,
  `data_json` longtext DEFAULT NULL,
  `updated_by` varchar(180) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_dc_patient` (`patient_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `dha_hie_config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `dha_hie_config` (
  `id` int(11) NOT NULL DEFAULT 1,
  `gateway_url` varchar(255) DEFAULT NULL,
  `environment` varchar(30) DEFAULT NULL,
  `facility_kmhfl_code` varchar(100) DEFAULT NULL,
  `facility_name` varchar(180) DEFAULT NULL,
  `facility_level` varchar(50) DEFAULT NULL,
  `sha_contract_number` varchar(120) DEFAULT NULL,
  `client_id` varchar(180) DEFAULT NULL,
  `client_secret` text DEFAULT NULL,
  `api_key` text DEFAULT NULL,
  `bearer_token` text DEFAULT NULL,
  `token_expires_at` datetime DEFAULT NULL,
  `last_ping_timestamp` datetime DEFAULT NULL,
  `connection_status` varchar(40) DEFAULT NULL,
  `last_ping_latency_ms` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `diagnoses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `diagnoses` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `code` varchar(50) NOT NULL,
  `name` varchar(255) NOT NULL,
  `chapter` varchar(150) DEFAULT NULL,
  `category` varchar(150) DEFAULT NULL,
  `is_common` tinyint(1) NOT NULL DEFAULT 0,
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active',
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `dialysis_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `dialysis_sessions` (
  `id` varchar(50) NOT NULL,
  `session_number` varchar(80) DEFAULT NULL,
  `patient_id` varchar(50) NOT NULL,
  `patient_name` varchar(180) DEFAULT NULL,
  `age` int(11) DEFAULT NULL,
  `gender` varchar(20) DEFAULT NULL,
  `sha_member_number` varchar(120) DEFAULT NULL,
  `session_date` date DEFAULT NULL,
  `shift` varchar(50) DEFAULT NULL,
  `station_number` varchar(100) DEFAULT NULL,
  `dialyzer_model` varchar(180) DEFAULT NULL,
  `access_type` varchar(100) DEFAULT NULL,
  `access_site` varchar(150) DEFAULT NULL,
  `pre_weight_kg` decimal(8,2) DEFAULT NULL,
  `post_weight_kg` decimal(8,2) DEFAULT NULL,
  `target_uf_volume_ml` decimal(12,2) DEFAULT NULL,
  `actual_uf_volume_ml` decimal(12,2) DEFAULT NULL,
  `pre_bp` varchar(50) DEFAULT NULL,
  `post_bp` varchar(50) DEFAULT NULL,
  `pre_pulse` int(11) DEFAULT NULL,
  `heparin_dose_units` int(11) DEFAULT NULL,
  `duration_hours` decimal(6,2) DEFAULT NULL,
  `nephrologist` varchar(180) DEFAULT NULL,
  `dialysis_nurse` varchar(180) DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  `sha_approved` tinyint(1) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `branch_id` bigint(20) unsigned DEFAULT 1,
  `visit_id` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `patient_id` (`patient_id`),
  KEY `idx_dialysis_sessions_branch` (`branch_id`),
  KEY `idx_dialysis_visit` (`visit_id`),
  KEY `idx_dialysis_sessions_visit` (`visit_id`),
  CONSTRAINT `dialysis_sessions_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_dialysis_branch` FOREIGN KEY (`branch_id`) REFERENCES `hospital_branches` (`id`) ON DELETE NO ACTION,
  CONSTRAINT `fk_dialysis_sessions_branch` FOREIGN KEY (`branch_id`) REFERENCES `hospital_branches` (`id`) ON DELETE NO ACTION,
  CONSTRAINT `fk_dialysis_sessions_visit` FOREIGN KEY (`visit_id`) REFERENCES `patient_visits` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_dialysis_visit` FOREIGN KEY (`visit_id`) REFERENCES `patient_visits` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `discharge_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `discharge_requests` (
  `id` varchar(50) NOT NULL,
  `patient_id` varchar(50) NOT NULL,
  `admission_id` varchar(50) NOT NULL,
  `requested_date` date NOT NULL,
  `reason` varchar(255) NOT NULL,
  `requested_by` varchar(180) NOT NULL,
  `status` varchar(40) DEFAULT 'Pending',
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `branch_id` bigint(20) unsigned DEFAULT 1,
  `visit_id` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_dr_patient` (`patient_id`),
  KEY `idx_dr_admission` (`admission_id`),
  KEY `idx_discharge_requests_branch` (`branch_id`),
  KEY `idx_discharge_req_visit` (`visit_id`),
  KEY `idx_discharge_requests_visit` (`visit_id`),
  CONSTRAINT `fk_discharge_req_visit` FOREIGN KEY (`visit_id`) REFERENCES `patient_visits` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_discharge_requests_visit` FOREIGN KEY (`visit_id`) REFERENCES `patient_visits` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_dr_admission` FOREIGN KEY (`admission_id`) REFERENCES `admissions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_dr_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `discharge_summaries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `discharge_summaries` (
  `id` varchar(50) NOT NULL,
  `patient_id` varchar(50) NOT NULL,
  `admission_id` varchar(50) NOT NULL,
  `discharge_date` date NOT NULL,
  `final_diagnosis` text DEFAULT NULL,
  `procedures` text DEFAULT NULL,
  `hospital_course` text DEFAULT NULL,
  `condition_at_discharge` varchar(255) DEFAULT NULL,
  `medications_on_discharge` text DEFAULT NULL,
  `follow_up_date` date DEFAULT NULL,
  `follow_up_instructions` text DEFAULT NULL,
  `summary` text NOT NULL,
  `attending_doctor` varchar(180) DEFAULT NULL,
  `prepared_by` varchar(180) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `branch_id` bigint(20) unsigned DEFAULT 1,
  `visit_id` varchar(50) DEFAULT NULL,
  `chief_complaint` text DEFAULT NULL,
  `examination_findings` text DEFAULT NULL,
  `investigations` text DEFAULT NULL,
  `treatment_given` text DEFAULT NULL,
  `follow_up_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_ds_patient` (`patient_id`),
  KEY `idx_ds_admission` (`admission_id`),
  KEY `idx_discharge_summaries_branch` (`branch_id`),
  KEY `idx_discharge_sum_visit` (`visit_id`),
  KEY `idx_discharge_summaries_visit` (`visit_id`),
  CONSTRAINT `fk_discharge_sum_visit` FOREIGN KEY (`visit_id`) REFERENCES `patient_visits` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_discharge_summaries_visit` FOREIGN KEY (`visit_id`) REFERENCES `patient_visits` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_ds_admission` FOREIGN KEY (`admission_id`) REFERENCES `admissions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ds_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `entity_store`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `entity_store` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `entity_type` varchar(100) NOT NULL,
  `entity_id` varchar(100) NOT NULL,
  `patient_id` varchar(50) DEFAULT NULL,
  `parent_entity_type` varchar(100) DEFAULT NULL,
  `parent_entity_id` varchar(100) DEFAULT NULL,
  `data_json` longtext NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_entity` (`entity_type`,`entity_id`),
  KEY `idx_entity_patient` (`patient_id`),
  KEY `idx_entity_type_updated` (`entity_type`,`updated_at`),
  CONSTRAINT `fk_entity_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `fixed_assets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `fixed_assets` (
  `id` varchar(50) NOT NULL,
  `asset_tag` varchar(100) DEFAULT NULL,
  `name` varchar(180) DEFAULT NULL,
  `category` varchar(120) DEFAULT NULL,
  `model_or_serial` varchar(180) DEFAULT NULL,
  `department` varchar(150) DEFAULT NULL,
  `purchase_date` date DEFAULT NULL,
  `purchase_cost` decimal(12,2) DEFAULT NULL,
  `current_book_value` decimal(12,2) DEFAULT NULL,
  `depreciation_rate` decimal(8,2) DEFAULT NULL,
  `condition_status` varchar(60) DEFAULT NULL,
  `last_service_date` date DEFAULT NULL,
  `next_service_date` date DEFAULT NULL,
  `responsible_officer` varchar(180) DEFAULT NULL,
  `branch_id` bigint(20) unsigned DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `idx_fixed_assets_branch` (`branch_id`),
  CONSTRAINT `fk_fixed_assets_branch` FOREIGN KEY (`branch_id`) REFERENCES `hospital_branches` (`id`) ON DELETE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `goods_received_note_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `goods_received_note_items` (
  `id` varchar(50) NOT NULL,
  `grn_id` varchar(50) NOT NULL,
  `purchase_order_item_id` varchar(50) NOT NULL,
  `inventory_id` varchar(50) NOT NULL,
  `item_code` varchar(80) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `unit` varchar(50) DEFAULT NULL,
  `ordered_qty` decimal(12,2) DEFAULT 0.00,
  `previously_received_qty` decimal(12,2) DEFAULT 0.00,
  `received_qty` decimal(12,2) NOT NULL,
  `unit_cost` decimal(12,2) DEFAULT 0.00,
  `batch_number` varchar(100) DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `branch_id` bigint(20) unsigned DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_grni_grn` (`grn_id`),
  KEY `idx_grni_inventory` (`inventory_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `goods_received_notes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `goods_received_notes` (
  `id` varchar(50) NOT NULL,
  `grn_number` varchar(100) NOT NULL,
  `purchase_order_id` varchar(50) NOT NULL,
  `lpo_number` varchar(100) DEFAULT NULL,
  `supplier_name` varchar(180) DEFAULT NULL,
  `receipt_date` date NOT NULL,
  `received_by` varchar(180) NOT NULL,
  `invoice_number` varchar(100) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `status` varchar(30) DEFAULT 'Posted',
  `branch_id` bigint(20) unsigned DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `grn_number` (`grn_number`),
  KEY `idx_grn_po` (`purchase_order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `hospital_branches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `hospital_branches` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(40) NOT NULL,
  `name` varchar(180) NOT NULL,
  `branch_type` varchar(60) DEFAULT 'Hospital Branch',
  `mfl_code` varchar(80) DEFAULT NULL,
  `sha_provider_code` varchar(100) DEFAULT NULL,
  `county` varchar(120) DEFAULT NULL,
  `sub_county` varchar(120) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `phone` varchar(80) DEFAULT NULL,
  `email` varchar(180) DEFAULT NULL,
  `status` varchar(30) NOT NULL DEFAULT 'Active',
  `is_default` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `hospital_config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `hospital_config` (
  `id` int(11) NOT NULL DEFAULT 1,
  `hospital_name` varchar(180) DEFAULT NULL,
  `mfl_code` varchar(80) DEFAULT NULL,
  `facility_level` varchar(50) DEFAULT NULL,
  `kra_pin` varchar(80) DEFAULT NULL,
  `sha_provider_code` varchar(100) DEFAULT NULL,
  `county` varchar(100) DEFAULT NULL,
  `sub_county` varchar(100) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `phone` varchar(80) DEFAULT NULL,
  `emergency_hotline` varchar(80) DEFAULT NULL,
  `email` varchar(180) DEFAULT NULL,
  `website` varchar(255) DEFAULT NULL,
  `currency` varchar(20) DEFAULT 'KSh',
  `timezone_name` varchar(80) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `hr_employees`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `hr_employees` (
  `id` varchar(50) NOT NULL,
  `employee_no` varchar(50) NOT NULL,
  `name` varchar(180) NOT NULL,
  `email` varchar(180) DEFAULT NULL,
  `phone` varchar(80) DEFAULT NULL,
  `department` varchar(150) DEFAULT NULL,
  `job_title` varchar(150) DEFAULT NULL,
  `employment_type` varchar(60) DEFAULT 'Permanent',
  `status` varchar(30) DEFAULT 'Active',
  `basic_salary` decimal(14,2) NOT NULL DEFAULT 0.00,
  `pay_method` varchar(40) DEFAULT 'Bank',
  `bank_name` varchar(150) DEFAULT NULL,
  `bank_branch` varchar(150) DEFAULT NULL,
  `bank_account` varchar(100) DEFAULT NULL,
  `kra_pin` varchar(80) DEFAULT NULL,
  `nssf_no` varchar(80) DEFAULT NULL,
  `sha_no` varchar(80) DEFAULT NULL,
  `housing_levy_eligible` tinyint(1) DEFAULT 1,
  `pensionable` tinyint(1) DEFAULT 1,
  `insurance_relief` decimal(12,2) DEFAULT 0.00,
  `tax_relief` decimal(12,2) DEFAULT 0.00,
  `start_date` date DEFAULT NULL,
  `staff_user_id` varchar(50) DEFAULT NULL,
  `branch_id` bigint(20) unsigned NOT NULL DEFAULT 1,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_hr_employee_no` (`employee_no`),
  KEY `idx_hr_branch` (`branch_id`),
  KEY `idx_hr_user` (`staff_user_id`),
  CONSTRAINT `fk_hr_branch` FOREIGN KEY (`branch_id`) REFERENCES `hospital_branches` (`id`),
  CONSTRAINT `fk_hr_user` FOREIGN KEY (`staff_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `icd11_catalog`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `icd11_catalog` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `code` varchar(50) NOT NULL,
  `title` varchar(255) NOT NULL,
  `chapter` varchar(150) DEFAULT NULL,
  `block` varchar(150) DEFAULT NULL,
  `category` enum('Morbidity','Mortality','Both') NOT NULL DEFAULT 'Morbidity',
  `description` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `idx_icd11_title` (`title`),
  KEY `idx_icd11_chapter` (`chapter`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `inpatient_admissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `inpatient_admissions` (
  `id` varchar(50) NOT NULL,
  `patient_id` varchar(50) NOT NULL,
  `patient_name` varchar(150) NOT NULL,
  `ward_id` varchar(50) NOT NULL,
  `ward_name` varchar(100) NOT NULL,
  `bed_id` varchar(50) NOT NULL,
  `bed_number` varchar(50) NOT NULL,
  `admitted_date` varchar(50) NOT NULL,
  `admitting_doctor` varchar(150) NOT NULL,
  `admitting_diagnosis` text NOT NULL,
  `deposit_paid` decimal(10,2) DEFAULT 0.00,
  `status` varchar(50) DEFAULT 'Admitted',
  `discharged_date` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `inpatient_beds`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `inpatient_beds` (
  `id` varchar(50) NOT NULL,
  `bed_number` varchar(50) NOT NULL,
  `ward_id` varchar(50) NOT NULL,
  `ward_name` varchar(100) NOT NULL,
  `status` varchar(50) DEFAULT 'Available',
  `patient_id` varchar(50) DEFAULT NULL,
  `patient_name` varchar(150) DEFAULT NULL,
  `admission_id` varchar(50) DEFAULT NULL,
  `daily_charge` decimal(10,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `inpatient_daily_bill_components`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `inpatient_daily_bill_components` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `admission_id` varchar(50) NOT NULL,
  `patient_id` varchar(50) NOT NULL,
  `billing_date` date NOT NULL,
  `charge_type` varchar(60) NOT NULL,
  `description` varchar(255) NOT NULL,
  `amount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `quantity` decimal(12,2) NOT NULL DEFAULT 1.00,
  `setup_bed_id` bigint(20) DEFAULT NULL,
  `sub_category_id` bigint(20) DEFAULT NULL,
  `source_component_id` bigint(20) DEFAULT NULL,
  `invoice_id` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_ipd_daily_component` (`admission_id`,`billing_date`,`charge_type`),
  KEY `idx_ipd_daily_admission` (`admission_id`),
  KEY `idx_ipd_daily_invoice` (`invoice_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `inpatient_doctor_notes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `inpatient_doctor_notes` (
  `id` varchar(50) NOT NULL,
  `patient_id` varchar(50) NOT NULL,
  `admission_id` varchar(50) NOT NULL,
  `clinician` varchar(180) DEFAULT NULL,
  `icd_code` varchar(255) DEFAULT NULL,
  `diagnosis` text DEFAULT NULL,
  `subjective` text DEFAULT NULL,
  `objective` text DEFAULT NULL,
  `assessment` text DEFAULT NULL,
  `plan` text DEFAULT NULL,
  `noted_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_idn_admission` (`admission_id`),
  KEY `patient_id` (`patient_id`),
  CONSTRAINT `inpatient_doctor_notes_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE,
  CONSTRAINT `inpatient_doctor_notes_ibfk_2` FOREIGN KEY (`admission_id`) REFERENCES `admissions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `inpatient_intake_output`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `inpatient_intake_output` (
  `id` varchar(50) NOT NULL,
  `patient_id` varchar(50) NOT NULL,
  `admission_id` varchar(50) NOT NULL,
  `entry_type` varchar(30) NOT NULL,
  `item_name` varchar(180) NOT NULL,
  `amount` decimal(12,2) DEFAULT 0.00,
  `unit` varchar(40) DEFAULT 'mL',
  `route` varchar(100) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `recorded_by` varchar(180) DEFAULT NULL,
  `recorded_at` datetime DEFAULT current_timestamp(),
  `branch_id` bigint(20) unsigned DEFAULT 1,
  `visit_id` varchar(50) DEFAULT NULL,
  `started_at` datetime DEFAULT NULL,
  `finished_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_iio_patient` (`patient_id`),
  KEY `idx_iio_admission` (`admission_id`),
  KEY `idx_inpatient_intake_output_branch` (`branch_id`),
  KEY `idx_iio_visit` (`visit_id`),
  KEY `idx_inpatient_intake_output_visit` (`visit_id`),
  CONSTRAINT `fk_iio_admission_ioform` FOREIGN KEY (`admission_id`) REFERENCES `admissions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_iio_patient_ioform` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_iio_visit` FOREIGN KEY (`visit_id`) REFERENCES `patient_visits` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_inpatient_intake_output_visit` FOREIGN KEY (`visit_id`) REFERENCES `patient_visits` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `inpatient_medical_files`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `inpatient_medical_files` (
  `id` varchar(50) NOT NULL,
  `patient_id` varchar(50) NOT NULL,
  `admission_id` varchar(50) NOT NULL,
  `location` varchar(180) DEFAULT NULL,
  `sub_location` varchar(180) DEFAULT NULL,
  `chief` varchar(180) DEFAULT NULL,
  `sub_chief` varchar(180) DEFAULT NULL,
  `primary_school` varchar(180) DEFAULT NULL,
  `education_level` varchar(120) DEFAULT NULL,
  `religion` varchar(80) DEFAULT NULL,
  `marital_status` varchar(60) DEFAULT NULL,
  `file_issued_by` varchar(180) DEFAULT NULL,
  `nok_name` varchar(180) DEFAULT NULL,
  `nok_relationship` varchar(80) DEFAULT NULL,
  `nok_phone` varchar(60) DEFAULT NULL,
  `nok_signature` varchar(180) DEFAULT NULL,
  `readmission_ip_no` varchar(80) DEFAULT NULL,
  `nurse_in_charge` varchar(180) DEFAULT NULL,
  `updated_by` varchar(180) DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `branch_id` bigint(20) DEFAULT NULL,
  `visit_id` varchar(50) DEFAULT NULL,
  `occupation` varchar(180) DEFAULT NULL,
  `county` varchar(180) DEFAULT NULL,
  `admission_mode` varchar(40) DEFAULT NULL,
  `nok_address` varchar(255) DEFAULT NULL,
  `discharge_outcome` varchar(60) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_imf_admission` (`admission_id`),
  KEY `idx_imf_patient` (`patient_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `inpatient_medications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `inpatient_medications` (
  `id` varchar(50) NOT NULL,
  `admission_id` varchar(50) NOT NULL,
  `patient_id` varchar(50) NOT NULL,
  `medication_name` varchar(180) DEFAULT NULL,
  `dosage` varchar(100) DEFAULT NULL,
  `route` varchar(60) DEFAULT NULL,
  `frequency` varchar(100) DEFAULT NULL,
  `scheduled_time` time DEFAULT NULL,
  `administered_status` varchar(40) DEFAULT NULL,
  `administered_by` varchar(180) DEFAULT NULL,
  `administered_at` datetime DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `branch_id` bigint(20) unsigned DEFAULT 1,
  `ordered_by` varchar(180) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `admission_id` (`admission_id`),
  KEY `patient_id` (`patient_id`),
  KEY `idx_inpatient_medications_branch` (`branch_id`),
  CONSTRAINT `inpatient_medications_ibfk_1` FOREIGN KEY (`admission_id`) REFERENCES `admissions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `inpatient_medications_ibfk_2` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `inpatient_orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `inpatient_orders` (
  `id` varchar(50) NOT NULL,
  `patient_id` varchar(50) NOT NULL,
  `admission_id` varchar(50) NOT NULL,
  `order_type` varchar(50) NOT NULL,
  `item_id` varchar(80) DEFAULT NULL,
  `item_code` varchar(100) DEFAULT NULL,
  `item_name` varchar(255) NOT NULL,
  `quantity` decimal(12,2) DEFAULT 1.00,
  `unit_price` decimal(12,2) DEFAULT 0.00,
  `sha_subcategory` varchar(100) DEFAULT NULL,
  `instructions` text DEFAULT NULL,
  `ordered_by` varchar(180) DEFAULT NULL,
  `status` varchar(40) DEFAULT 'Ordered',
  `ordered_at` datetime DEFAULT current_timestamp(),
  `lab_test_id` bigint(20) DEFAULT NULL,
  `radiology_test_id` bigint(20) DEFAULT NULL,
  `nursing_procedure_id` bigint(20) DEFAULT NULL,
  `pharmacy_drug_id` bigint(20) DEFAULT NULL,
  `inpatient_package_id` bigint(20) DEFAULT NULL,
  `bed_id` bigint(20) DEFAULT NULL,
  `billing_status` varchar(30) NOT NULL DEFAULT 'Unpaid',
  `invoice_id` varchar(50) DEFAULT NULL,
  `source_setup_code` varchar(80) DEFAULT NULL,
  `branch_id` bigint(20) unsigned DEFAULT 1,
  `visit_id` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_io_patient` (`patient_id`),
  KEY `idx_io_admission` (`admission_id`),
  KEY `idx_io_lab` (`lab_test_id`),
  KEY `idx_io_rad` (`radiology_test_id`),
  KEY `idx_io_nursing` (`nursing_procedure_id`),
  KEY `idx_io_drug` (`pharmacy_drug_id`),
  KEY `fk_io_package` (`inpatient_package_id`),
  KEY `fk_io_bed` (`bed_id`),
  KEY `idx_inpatient_orders_branch` (`branch_id`),
  KEY `idx_ip_order_visit` (`visit_id`),
  KEY `idx_inpatient_orders_visit` (`visit_id`),
  KEY `idx_ipd_orders_billing_status` (`billing_status`),
  KEY `idx_ipd_orders_admission_time` (`admission_id`,`ordered_at`),
  CONSTRAINT `fk_inpatient_orders_visit` FOREIGN KEY (`visit_id`) REFERENCES `patient_visits` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_io_admission` FOREIGN KEY (`admission_id`) REFERENCES `admissions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_io_bed` FOREIGN KEY (`bed_id`) REFERENCES `setup_bed_items` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_io_drug` FOREIGN KEY (`pharmacy_drug_id`) REFERENCES `setup_pharmacy_drugs` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_io_lab` FOREIGN KEY (`lab_test_id`) REFERENCES `setup_lab_tests` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_io_nursing` FOREIGN KEY (`nursing_procedure_id`) REFERENCES `setup_nursing_procedures` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_io_package` FOREIGN KEY (`inpatient_package_id`) REFERENCES `setup_inpatient_packages` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_io_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_io_rad` FOREIGN KEY (`radiology_test_id`) REFERENCES `setup_radiology_tests` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_ip_order_visit` FOREIGN KEY (`visit_id`) REFERENCES `patient_visits` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `inpatient_vitals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `inpatient_vitals` (
  `id` varchar(50) NOT NULL,
  `patient_id` varchar(50) NOT NULL,
  `admission_id` varchar(50) NOT NULL,
  `systolic` int(11) DEFAULT NULL,
  `diastolic` int(11) DEFAULT NULL,
  `pulse` int(11) DEFAULT NULL,
  `temperature` decimal(4,1) DEFAULT NULL,
  `respiratory_rate` int(11) DEFAULT NULL,
  `spo2` int(11) DEFAULT NULL,
  `recorded_by` varchar(180) DEFAULT NULL,
  `recorded_at` datetime DEFAULT current_timestamp(),
  `fbs` decimal(5,1) DEFAULT NULL,
  `rbs` decimal(5,1) DEFAULT NULL,
  `remarks` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_iv_admission` (`admission_id`),
  KEY `patient_id` (`patient_id`),
  CONSTRAINT `inpatient_vitals_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE,
  CONSTRAINT `inpatient_vitals_ibfk_2` FOREIGN KEY (`admission_id`) REFERENCES `admissions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `inpatient_wards`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `inpatient_wards` (
  `id` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `department` varchar(100) NOT NULL,
  `capacity` int(11) NOT NULL,
  `gender_occupancy` varchar(50) NOT NULL,
  `nurse_in_charge` varchar(150) NOT NULL,
  `daily_bed_rate` decimal(10,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `inventory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventory` (
  `id` varchar(50) NOT NULL,
  `item_code` varchar(80) DEFAULT NULL,
  `name` varchar(180) NOT NULL,
  `category` varchar(100) DEFAULT NULL,
  `dosage_form` varchar(80) DEFAULT NULL,
  `stock_quantity` int(11) DEFAULT 0,
  `reorder_level` int(11) DEFAULT 20,
  `unit_cost` decimal(12,2) DEFAULT 0.00,
  `selling_price` decimal(12,2) DEFAULT 0.00,
  `expiry_date` date DEFAULT NULL,
  `batch_number` varchar(100) DEFAULT NULL,
  `supplier` varchar(180) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `branch_id` bigint(20) unsigned DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `idx_inventory_branch` (`branch_id`),
  KEY `idx_inventory_item_code` (`item_code`),
  KEY `idx_inventory_name_batch` (`name`,`batch_number`),
  KEY `idx_inventory_expiry` (`expiry_date`),
  CONSTRAINT `fk_inventory_branch` FOREIGN KEY (`branch_id`) REFERENCES `hospital_branches` (`id`) ON DELETE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `inventory_register_imports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventory_register_imports` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `file_name` varchar(255) DEFAULT NULL,
  `imported_by` varchar(180) DEFAULT NULL,
  `row_count` int(11) NOT NULL DEFAULT 0,
  `inserted_count` int(11) NOT NULL DEFAULT 0,
  `updated_count` int(11) NOT NULL DEFAULT 0,
  `deleted_count` int(11) NOT NULL DEFAULT 0,
  `protected_count` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_iri_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `inventory_stocks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventory_stocks` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `store_id` varchar(50) NOT NULL,
  `inventory_id` varchar(50) NOT NULL,
  `stock_quantity` decimal(12,2) DEFAULT 0.00,
  `reorder_level` decimal(12,2) DEFAULT 20.00,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `branch_id` bigint(20) unsigned DEFAULT 1,
  `average_cost` decimal(14,2) DEFAULT 0.00,
  `last_movement_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_store_inventory` (`store_id`,`inventory_id`),
  KEY `idx_is_store` (`store_id`),
  KEY `idx_is_inventory` (`inventory_id`),
  KEY `idx_inventory_stocks_branch` (`branch_id`),
  KEY `idx_stocks_store_inventory` (`store_id`,`inventory_id`),
  CONSTRAINT `fk_inventory_stocks_branch` FOREIGN KEY (`branch_id`) REFERENCES `hospital_branches` (`id`) ON DELETE NO ACTION,
  CONSTRAINT `fk_is_inventory` FOREIGN KEY (`inventory_id`) REFERENCES `inventory` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_is_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `inventory_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventory_transactions` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `inventory_id` varchar(50) NOT NULL,
  `store_id` varchar(50) DEFAULT NULL,
  `branch_id` bigint(20) unsigned NOT NULL DEFAULT 1,
  `transaction_type` varchar(40) NOT NULL,
  `quantity` decimal(12,2) NOT NULL DEFAULT 0.00,
  `unit_cost` decimal(12,2) DEFAULT 0.00,
  `batch_number` varchar(100) DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `reference_type` varchar(60) DEFAULT NULL,
  `reference_id` varchar(100) DEFAULT NULL,
  `patient_id` varchar(50) DEFAULT NULL,
  `visit_id` varchar(50) DEFAULT NULL,
  `performed_by` varchar(50) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_it_inventory_date` (`inventory_id`,`created_at`),
  KEY `idx_it_store` (`store_id`),
  KEY `idx_it_patient_visit` (`patient_id`,`visit_id`),
  KEY `fk_it_branch` (`branch_id`),
  KEY `fk_it_visit` (`visit_id`),
  KEY `idx_it_expiry` (`expiry_date`),
  CONSTRAINT `fk_it_branch` FOREIGN KEY (`branch_id`) REFERENCES `hospital_branches` (`id`),
  CONSTRAINT `fk_it_inventory` FOREIGN KEY (`inventory_id`) REFERENCES `inventory` (`id`),
  CONSTRAINT `fk_it_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_it_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_it_visit` FOREIGN KEY (`visit_id`) REFERENCES `patient_visits` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `invoice_amendments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `invoice_amendments` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `invoice_id` varchar(50) NOT NULL,
  `admission_id` varchar(50) DEFAULT NULL,
  `amended_by` varchar(180) DEFAULT NULL,
  `reason` varchar(500) NOT NULL,
  `old_total` decimal(12,2) NOT NULL DEFAULT 0.00,
  `new_total` decimal(12,2) NOT NULL DEFAULT 0.00,
  `old_items_json` longtext DEFAULT NULL,
  `new_items_json` longtext DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_ia_invoice` (`invoice_id`),
  KEY `idx_ia_admission` (`admission_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `invoice_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `invoice_items` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `invoice_id` varchar(50) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `category` varchar(100) DEFAULT NULL,
  `unit_cost` decimal(12,2) DEFAULT NULL,
  `quantity` decimal(12,2) DEFAULT NULL,
  `total` decimal(12,2) DEFAULT NULL,
  `setup_entity_type` varchar(50) DEFAULT NULL,
  `setup_entity_id` bigint(20) DEFAULT NULL,
  `source_entity` varchar(60) DEFAULT NULL,
  `source_id` varchar(100) DEFAULT NULL,
  `payer` varchar(180) DEFAULT NULL,
  `branch_id` bigint(20) unsigned DEFAULT 1,
  `is_paid` tinyint(1) NOT NULL DEFAULT 0,
  `paid_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_invoice_item_invoice` (`invoice_id`),
  KEY `idx_invoice_item_payer` (`payer`),
  KEY `idx_invoice_items_branch` (`branch_id`),
  CONSTRAINT `fk_invoice_item_invoice` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `invoice_payment_splits`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `invoice_payment_splits` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `invoice_id` varchar(50) NOT NULL,
  `payment_method` varchar(60) DEFAULT NULL,
  `amount` decimal(12,2) DEFAULT NULL,
  `reference` varchar(150) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `branch_id` bigint(20) unsigned DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `fk_payment_invoice` (`invoice_id`),
  KEY `idx_invoice_payment_splits_branch` (`branch_id`),
  CONSTRAINT `fk_payment_invoice` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `invoices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `invoices` (
  `id` varchar(50) NOT NULL,
  `patient_id` varchar(50) DEFAULT NULL,
  `patient_name` varchar(180) DEFAULT NULL,
  `patient_phone` varchar(50) DEFAULT NULL,
  `invoice_date` date DEFAULT NULL,
  `subtotal` decimal(12,2) DEFAULT 0.00,
  `discount` decimal(12,2) DEFAULT 0.00,
  `tax` decimal(12,2) DEFAULT 0.00,
  `total_amount` decimal(12,2) DEFAULT 0.00,
  `amount_paid` decimal(12,2) DEFAULT 0.00,
  `balance` decimal(12,2) DEFAULT 0.00,
  `payment_method` varchar(60) DEFAULT NULL,
  `payment_reference` varchar(150) DEFAULT NULL,
  `status` varchar(40) DEFAULT NULL,
  `cashier_name` varchar(180) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `billing_payer` varchar(180) DEFAULT NULL,
  `insurance_provider` varchar(180) DEFAULT NULL,
  `scheme_id` bigint(20) unsigned DEFAULT NULL,
  `parent_invoice_id` varchar(50) DEFAULT NULL,
  `branch_id` bigint(20) unsigned DEFAULT 1,
  `visit_id` varchar(50) DEFAULT NULL,
  `invoice_type` varchar(40) NOT NULL DEFAULT 'STANDARD',
  `is_amended` tinyint(1) NOT NULL DEFAULT 0,
  `amendment_reason` varchar(500) DEFAULT NULL,
  `amended_by` varchar(180) DEFAULT NULL,
  `amended_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_invoice_patient` (`patient_id`),
  KEY `idx_invoice_billing_payer` (`billing_payer`),
  KEY `idx_invoice_parent` (`parent_invoice_id`),
  KEY `idx_invoices_branch` (`branch_id`),
  KEY `idx_invoices_scheme` (`scheme_id`),
  KEY `idx_invoice_visit` (`visit_id`),
  KEY `idx_invoices_visit` (`visit_id`),
  CONSTRAINT `fk_invoice_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_invoice_visit` FOREIGN KEY (`visit_id`) REFERENCES `patient_visits` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_invoices_branch` FOREIGN KEY (`branch_id`) REFERENCES `hospital_branches` (`id`) ON DELETE NO ACTION,
  CONSTRAINT `fk_invoices_visit` FOREIGN KEY (`visit_id`) REFERENCES `patient_visits` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `journal_entries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `journal_entries` (
  `id` varchar(50) NOT NULL,
  `voucher_number` varchar(100) DEFAULT NULL,
  `entry_date` date DEFAULT NULL,
  `reference_type` varchar(100) DEFAULT NULL,
  `reference_number` varchar(120) DEFAULT NULL,
  `total_debit` decimal(12,2) DEFAULT NULL,
  `total_credit` decimal(12,2) DEFAULT NULL,
  `status` varchar(30) DEFAULT NULL,
  `posted_by` varchar(180) DEFAULT NULL,
  `branch_id` bigint(20) unsigned DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `idx_journal_entries_branch` (`branch_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `journal_entry_lines`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `journal_entry_lines` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `journal_entry_id` varchar(50) NOT NULL,
  `account_code` varchar(80) DEFAULT NULL,
  `account_name` varchar(180) DEFAULT NULL,
  `debit` decimal(12,2) DEFAULT NULL,
  `credit` decimal(12,2) DEFAULT NULL,
  `narration` text DEFAULT NULL,
  `branch_id` bigint(20) unsigned DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `journal_entry_id` (`journal_entry_id`),
  KEY `idx_journal_entry_lines_branch` (`branch_id`),
  CONSTRAINT `journal_entry_lines_ibfk_1` FOREIGN KEY (`journal_entry_id`) REFERENCES `journal_entries` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `lab_orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `lab_orders` (
  `id` varchar(50) NOT NULL,
  `patient_id` varchar(50) NOT NULL,
  `patient_name` varchar(180) DEFAULT NULL,
  `test_name` varchar(180) DEFAULT NULL,
  `category` varchar(80) DEFAULT NULL,
  `sample_type` varchar(100) DEFAULT NULL,
  `requested_by` varchar(180) DEFAULT NULL,
  `requested_at` datetime DEFAULT NULL,
  `cost` decimal(12,2) DEFAULT 0.00,
  `status` varchar(50) DEFAULT 'Pending',
  `result_value` text DEFAULT NULL,
  `reference_range` varchar(180) DEFAULT NULL,
  `result_notes` text DEFAULT NULL,
  `conducted_by` varchar(180) DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `setup_lab_test_id` bigint(20) DEFAULT NULL,
  `result_parameters_json` longtext DEFAULT NULL,
  `billing_status` varchar(30) NOT NULL DEFAULT 'Unpaid',
  `invoice_id` varchar(50) DEFAULT NULL,
  `setup_lab_test_code` varchar(80) DEFAULT NULL,
  `branch_id` bigint(20) unsigned DEFAULT 1,
  `visit_id` varchar(50) DEFAULT NULL,
  `tariff_sub_category_id` bigint(20) DEFAULT NULL,
  `tariff_sub_category_code` varchar(80) DEFAULT NULL,
  `tariff_sub_category_name` varchar(180) DEFAULT NULL,
  `price_source` varchar(120) DEFAULT NULL,
  `sample_collected_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_lab_patient` (`patient_id`),
  KEY `idx_lab_setup_test` (`setup_lab_test_id`),
  KEY `idx_lab_orders_branch` (`branch_id`),
  KEY `idx_lab_visit` (`visit_id`),
  KEY `idx_lab_orders_visit` (`visit_id`),
  CONSTRAINT `fk_lab_branch` FOREIGN KEY (`branch_id`) REFERENCES `hospital_branches` (`id`) ON DELETE NO ACTION,
  CONSTRAINT `fk_lab_orders_branch` FOREIGN KEY (`branch_id`) REFERENCES `hospital_branches` (`id`) ON DELETE NO ACTION,
  CONSTRAINT `fk_lab_orders_visit` FOREIGN KEY (`visit_id`) REFERENCES `patient_visits` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_lab_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_lab_setup_test` FOREIGN KEY (`setup_lab_test_id`) REFERENCES `setup_lab_tests` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_lab_visit` FOREIGN KEY (`visit_id`) REFERENCES `patient_visits` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `labour_care_guides`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `labour_care_guides` (
  `id` varchar(80) NOT NULL,
  `patient_id` varchar(50) NOT NULL,
  `admission_id` varchar(50) DEFAULT NULL,
  `active_labour_at` datetime DEFAULT NULL,
  `status` varchar(30) DEFAULT NULL,
  `data_json` longtext DEFAULT NULL,
  `updated_by` varchar(180) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_lcg_admission` (`admission_id`),
  KEY `idx_lcg_patient` (`patient_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `maternity_records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `maternity_records` (
  `id` varchar(50) NOT NULL,
  `patient_id` varchar(50) NOT NULL,
  `admission_id` varchar(50) NOT NULL,
  `gravida` int(11) DEFAULT NULL,
  `para` int(11) DEFAULT NULL,
  `lmp` date DEFAULT NULL,
  `edd` date DEFAULT NULL,
  `delivery_mode` varchar(80) DEFAULT NULL,
  `apgar_score` varchar(80) DEFAULT NULL,
  `birth_weight` varchar(40) DEFAULT NULL,
  `delivered_at` datetime DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `recorded_by` varchar(180) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_mr_admission` (`admission_id`),
  KEY `patient_id` (`patient_id`),
  CONSTRAINT `maternity_records_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE,
  CONSTRAINT `maternity_records_ibfk_2` FOREIGN KEY (`admission_id`) REFERENCES `admissions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `medication_administrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `medication_administrations` (
  `id` varchar(50) NOT NULL,
  `patient_id` varchar(50) NOT NULL,
  `admission_id` varchar(50) NOT NULL,
  `medication_id` varchar(50) DEFAULT NULL,
  `medication_name` varchar(255) DEFAULT NULL,
  `dosage` varchar(120) DEFAULT NULL,
  `route` varchar(60) DEFAULT NULL,
  `frequency` varchar(120) DEFAULT NULL,
  `given_at` datetime NOT NULL,
  `given_by` varchar(180) DEFAULT NULL,
  `status` varchar(30) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `branch_id` bigint(20) DEFAULT NULL,
  `visit_id` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_madm_admission` (`admission_id`),
  KEY `idx_madm_medication` (`medication_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `mho_report_definitions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `mho_report_definitions` (
  `id` varchar(50) NOT NULL,
  `report_code` varchar(80) NOT NULL,
  `report_name` varchar(255) NOT NULL,
  `frequency` varchar(40) DEFAULT 'Monthly',
  `data_source` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `report_code` (`report_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `migrations` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `moh_reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `moh_reports` (
  `id` varchar(80) NOT NULL,
  `report_type` varchar(20) NOT NULL,
  `period_label` varchar(80) DEFAULT NULL,
  `period_start` date DEFAULT NULL,
  `period_end` date DEFAULT NULL,
  `facility_name` varchar(180) DEFAULT NULL,
  `kmhfl_code` varchar(40) DEFAULT NULL,
  `status` varchar(30) DEFAULT 'Draft',
  `data_json` longtext DEFAULT NULL,
  `prepared_by` varchar(180) DEFAULT NULL,
  `submitted_by` varchar(180) DEFAULT NULL,
  `submitted_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `branch_id` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_moh_type_period` (`report_type`,`period_start`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `morgue_records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `morgue_records` (
  `id` varchar(50) NOT NULL,
  `tag_number` varchar(80) DEFAULT NULL,
  `deceased_name` varchar(180) DEFAULT NULL,
  `age` int(11) DEFAULT NULL,
  `gender` varchar(20) DEFAULT NULL,
  `date_of_death` date DEFAULT NULL,
  `time_of_death` time DEFAULT NULL,
  `intake_date` date DEFAULT NULL,
  `intake_time` time DEFAULT NULL,
  `source_type` varchar(100) DEFAULT NULL,
  `ward_or_location` varchar(150) DEFAULT NULL,
  `attending_doctor` varchar(180) DEFAULT NULL,
  `cold_room_number` varchar(100) DEFAULT NULL,
  `slot_number` varchar(100) DEFAULT NULL,
  `cause_of_death` text DEFAULT NULL,
  `autopsy_required` tinyint(1) DEFAULT NULL,
  `autopsy_status` varchar(50) DEFAULT NULL,
  `embalming_status` varchar(50) DEFAULT NULL,
  `daily_storage_rate` decimal(12,2) DEFAULT NULL,
  `total_accrued_storage` decimal(12,2) DEFAULT NULL,
  `next_of_kin_name` varchar(180) DEFAULT NULL,
  `next_of_kin_phone` varchar(80) DEFAULT NULL,
  `next_of_kin_relationship` varchar(100) DEFAULT NULL,
  `status` varchar(80) DEFAULT NULL,
  `release_date` date DEFAULT NULL,
  `burial_permit_number` varchar(120) DEFAULT NULL,
  `branch_id` bigint(20) unsigned DEFAULT 1,
  `patient_id` varchar(50) DEFAULT NULL,
  `visit_id` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_morgue_records_branch` (`branch_id`),
  KEY `idx_morgue_patient` (`patient_id`),
  KEY `idx_morgue_visit` (`visit_id`),
  KEY `idx_morgue_records_visit` (`visit_id`),
  CONSTRAINT `fk_morgue_branch` FOREIGN KEY (`branch_id`) REFERENCES `hospital_branches` (`id`) ON DELETE NO ACTION,
  CONSTRAINT `fk_morgue_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_morgue_records_branch` FOREIGN KEY (`branch_id`) REFERENCES `hospital_branches` (`id`) ON DELETE NO ACTION,
  CONSTRAINT `fk_morgue_records_visit` FOREIGN KEY (`visit_id`) REFERENCES `patient_visits` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_morgue_visit` FOREIGN KEY (`visit_id`) REFERENCES `patient_visits` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `mpesa_api_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `mpesa_api_settings` (
  `id` varchar(50) NOT NULL,
  `environment` varchar(20) NOT NULL DEFAULT 'sandbox',
  `consumer_key` text NOT NULL,
  `consumer_secret` text NOT NULL,
  `short_code` varchar(30) NOT NULL,
  `passkey` text NOT NULL,
  `transaction_type` varchar(40) NOT NULL DEFAULT 'CustomerPayBillOnline',
  `callback_url` text DEFAULT NULL,
  `account_reference` varchar(100) DEFAULT 'WISECARE',
  `transaction_desc` varchar(255) DEFAULT 'WiseCare Hospital Payment',
  `enabled` tinyint(1) DEFAULT 1,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `callback_token` varchar(64) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `mpesa_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `mpesa_transactions` (
  `id` varchar(50) NOT NULL,
  `invoice_id` varchar(50) DEFAULT NULL,
  `patient_id` varchar(50) DEFAULT NULL,
  `phone` varchar(30) NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `collection_method` varchar(30) NOT NULL DEFAULT 'STK_PUSH',
  `status` varchar(30) NOT NULL DEFAULT 'PENDING',
  `merchant_request_id` varchar(100) DEFAULT NULL,
  `checkout_request_id` varchar(100) DEFAULT NULL,
  `mpesa_receipt_number` varchar(100) DEFAULT NULL,
  `transaction_date` datetime DEFAULT NULL,
  `result_code` varchar(20) DEFAULT NULL,
  `result_description` text DEFAULT NULL,
  `last_four_digits` varchar(4) DEFAULT NULL,
  `manual_reference` varchar(100) DEFAULT NULL,
  `raw_callback_json` longtext DEFAULT NULL,
  `initiated_by` varchar(180) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `branch_id` bigint(20) unsigned DEFAULT 1,
  `last_queried_at` datetime DEFAULT NULL,
  `confirmed_by` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_mpesa_invoice` (`invoice_id`),
  KEY `idx_mpesa_patient` (`patient_id`),
  KEY `idx_mpesa_checkout` (`checkout_request_id`),
  KEY `idx_mpesa_transactions_branch` (`branch_id`),
  CONSTRAINT `fk_mpesa_invoice` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_mpesa_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `mwavuli_claim_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `mwavuli_claim_log` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `claim_id` varchar(50) NOT NULL,
  `visit_id` varchar(50) DEFAULT NULL,
  `environment` varchar(20) NOT NULL,
  `action` varchar(20) NOT NULL,
  `success` tinyint(1) NOT NULL DEFAULT 0,
  `http_status` int(11) DEFAULT NULL,
  `mwavuli_status` varchar(40) DEFAULT NULL,
  `hold_reason` text DEFAULT NULL,
  `error` text DEFAULT NULL,
  `warnings_json` longtext DEFAULT NULL,
  `steps_json` longtext DEFAULT NULL,
  `correlation_id` varchar(80) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_mcl_claim` (`claim_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `mwavuli_eligibility_benefits`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `mwavuli_eligibility_benefits` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `check_id` bigint(20) unsigned NOT NULL,
  `category` varchar(80) DEFAULT NULL,
  `name` varchar(180) DEFAULT NULL,
  `excluded` tinyint(1) NOT NULL DEFAULT 0,
  `allowed_kes` decimal(14,2) DEFAULT NULL,
  `used_kes` decimal(14,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_meb_check` (`check_id`),
  CONSTRAINT `fk_meb_check` FOREIGN KEY (`check_id`) REFERENCES `mwavuli_eligibility_checks` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `mwavuli_eligibility_checks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `mwavuli_eligibility_checks` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `patient_id` varchar(50) NOT NULL,
  `patient_name` varchar(180) DEFAULT NULL,
  `national_id` varchar(80) DEFAULT NULL,
  `visit_id` varchar(50) NOT NULL,
  `member_number` varchar(120) DEFAULT NULL,
  `searched_by` varchar(40) DEFAULT NULL,
  `environment` varchar(20) NOT NULL,
  `status` varchar(30) NOT NULL,
  `benefit_package` varchar(180) DEFAULT NULL,
  `reasons` text DEFAULT NULL,
  `sha_requested_at` datetime DEFAULT NULL,
  `sha_checked_at` datetime DEFAULT NULL,
  `response_ms` int(11) DEFAULT NULL,
  `response_json` longtext DEFAULT NULL,
  `checked_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_mec_patient` (`patient_id`),
  KEY `idx_mec_visit` (`visit_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `mwavuli_event_cursor`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `mwavuli_event_cursor` (
  `environment` varchar(20) NOT NULL,
  `last_event_id` bigint(20) unsigned NOT NULL,
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `last_cursor` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`environment`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `mwavuli_events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `mwavuli_events` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `environment` varchar(20) NOT NULL,
  `event_id` varchar(40) NOT NULL,
  `source` varchar(10) NOT NULL,
  `type` varchar(60) NOT NULL,
  `occurred_at` datetime DEFAULT NULL,
  `patient_id` varchar(50) DEFAULT NULL,
  `visit_id` varchar(50) DEFAULT NULL,
  `status` varchar(40) DEFAULT NULL,
  `payload_json` longtext NOT NULL,
  `signature` text DEFAULT NULL,
  `signature_valid` tinyint(1) DEFAULT NULL,
  `headers_json` text DEFAULT NULL,
  `applied_at` datetime DEFAULT NULL,
  `received_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_mwe_event` (`environment`,`event_id`),
  KEY `idx_mwe_visit` (`visit_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `mwavuli_patient_registry`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `mwavuli_patient_registry` (
  `patient_id` varchar(50) NOT NULL,
  `environment` varchar(20) NOT NULL,
  `state` varchar(30) NOT NULL,
  `cr_number` varchar(60) DEFAULT NULL,
  `checked_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `response_json` longtext DEFAULT NULL,
  `sent_version` int(11) DEFAULT NULL,
  `sent_hash` char(40) DEFAULT NULL,
  `sent_updated_at` varchar(40) DEFAULT NULL,
  `hold_reason` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`patient_id`,`environment`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `mwavuli_reference_cache`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `mwavuli_reference_cache` (
  `environment` varchar(20) NOT NULL,
  `list` varchar(60) NOT NULL,
  `items_json` longtext NOT NULL,
  `fetched_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`environment`,`list`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `mwavuli_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `mwavuli_settings` (
  `id` tinyint(3) unsigned NOT NULL,
  `active` varchar(20) DEFAULT NULL,
  `sandbox_url` varchar(255) DEFAULT NULL,
  `sandbox_key` text DEFAULT NULL,
  `production_url` varchar(255) DEFAULT NULL,
  `production_key` text DEFAULT NULL,
  `webhook_secret` text DEFAULT NULL,
  `updated_by` varchar(100) DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `sandbox_ca` text DEFAULT NULL,
  `production_ca` text DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `nursing_cardex`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `nursing_cardex` (
  `id` varchar(50) NOT NULL,
  `patient_id` varchar(50) NOT NULL,
  `admission_id` varchar(50) NOT NULL,
  `shift` varchar(30) NOT NULL,
  `entry_date` date NOT NULL,
  `nurse_name` varchar(180) NOT NULL,
  `observations` text DEFAULT NULL,
  `nursing_actions` text DEFAULT NULL,
  `medication_notes` text DEFAULT NULL,
  `diet` text DEFAULT NULL,
  `mobility` text DEFAULT NULL,
  `wound_line_care` text DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `branch_id` bigint(20) unsigned DEFAULT 1,
  `visit_id` varchar(50) DEFAULT NULL,
  `recorded_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_nc_patient` (`patient_id`),
  KEY `idx_nc_admission` (`admission_id`),
  KEY `idx_nursing_cardex_branch` (`branch_id`),
  KEY `idx_cardex_visit` (`visit_id`),
  KEY `idx_nursing_cardex_visit` (`visit_id`),
  CONSTRAINT `fk_cardex_branch` FOREIGN KEY (`branch_id`) REFERENCES `hospital_branches` (`id`) ON DELETE NO ACTION,
  CONSTRAINT `fk_cardex_visit` FOREIGN KEY (`visit_id`) REFERENCES `patient_visits` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_nc_admission` FOREIGN KEY (`admission_id`) REFERENCES `admissions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_nc_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_nursing_cardex_branch` FOREIGN KEY (`branch_id`) REFERENCES `hospital_branches` (`id`) ON DELETE NO ACTION,
  CONSTRAINT `fk_nursing_cardex_visit` FOREIGN KEY (`visit_id`) REFERENCES `patient_visits` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `oncology_plan_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `oncology_plan_details` (
  `id` varchar(80) NOT NULL,
  `plan_id` varchar(80) NOT NULL,
  `patient_id` varchar(50) DEFAULT NULL,
  `care_status` varchar(60) DEFAULT NULL,
  `data_json` longtext DEFAULT NULL,
  `updated_by` varchar(180) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_opd_plan` (`plan_id`),
  KEY `idx_opd_patient` (`patient_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `partograph_readings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `partograph_readings` (
  `id` varchar(50) NOT NULL,
  `patient_id` varchar(50) NOT NULL,
  `admission_id` varchar(50) NOT NULL,
  `reading_at` datetime NOT NULL,
  `fetal_heart_rate` int(11) DEFAULT NULL,
  `cervical_dilatation` decimal(4,1) DEFAULT NULL,
  `head_descent` varchar(10) DEFAULT NULL,
  `contractions_per_10` int(11) DEFAULT NULL,
  `contraction_seconds` int(11) DEFAULT NULL,
  `maternal_bp` varchar(20) DEFAULT NULL,
  `maternal_pulse` int(11) DEFAULT NULL,
  `recorded_by` varchar(180) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_pr_admission` (`admission_id`),
  KEY `patient_id` (`patient_id`),
  CONSTRAINT `partograph_readings_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE,
  CONSTRAINT `partograph_readings_ibfk_2` FOREIGN KEY (`admission_id`) REFERENCES `admissions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `patient_coverages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `patient_coverages` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `patient_id` varchar(50) NOT NULL,
  `sub_category_id` bigint(20) NOT NULL,
  `scheme_id` bigint(20) unsigned DEFAULT NULL,
  `member_number` varchar(120) DEFAULT NULL,
  `policy_number` varchar(120) DEFAULT NULL,
  `is_primary` tinyint(1) NOT NULL DEFAULT 0,
  `status` varchar(30) NOT NULL DEFAULT 'Active',
  `effective_from` date DEFAULT NULL,
  `effective_to` date DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_pc_patient` (`patient_id`),
  KEY `idx_pc_subcategory` (`sub_category_id`),
  KEY `idx_pc_scheme` (`scheme_id`),
  CONSTRAINT `fk_pc_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pc_scheme` FOREIGN KEY (`scheme_id`) REFERENCES `setup_patient_schemes` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_pc_subcategory` FOREIGN KEY (`sub_category_id`) REFERENCES `setup_patient_subcategories` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `patient_queue`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `patient_queue` (
  `id` varchar(50) NOT NULL,
  `ticket_number` varchar(60) DEFAULT NULL,
  `patient_id` varchar(50) NOT NULL,
  `patient_name` varchar(180) DEFAULT NULL,
  `arrived_time` datetime DEFAULT NULL,
  `current_station` varchar(80) DEFAULT NULL,
  `priority` varchar(30) DEFAULT NULL,
  `assigned_to` varchar(180) DEFAULT NULL,
  `payment_method` varchar(80) DEFAULT NULL,
  `consultation_fee_paid` tinyint(1) DEFAULT 0,
  `status` varchar(40) DEFAULT NULL,
  `call_count` int(11) DEFAULT 0,
  `last_called_at` datetime DEFAULT NULL,
  `service_point_note` text DEFAULT NULL,
  `consultation_service_id` bigint(20) DEFAULT NULL,
  `consultation_service_code` varchar(80) DEFAULT NULL,
  `consultation_type` varchar(180) DEFAULT NULL,
  `consultation_fee` decimal(12,2) NOT NULL DEFAULT 0.00,
  `patient_sub_category` varchar(100) DEFAULT NULL,
  `scheme_id` bigint(20) unsigned DEFAULT NULL,
  `branch_id` bigint(20) unsigned DEFAULT 1,
  `visit_id` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_queue_patient` (`patient_id`),
  KEY `idx_patient_queue_branch` (`branch_id`),
  KEY `idx_queue_scheme` (`scheme_id`),
  KEY `idx_queue_visit` (`visit_id`),
  KEY `idx_patient_queue_visit` (`visit_id`),
  CONSTRAINT `fk_patient_queue_branch` FOREIGN KEY (`branch_id`) REFERENCES `hospital_branches` (`id`) ON DELETE NO ACTION,
  CONSTRAINT `fk_patient_queue_visit` FOREIGN KEY (`visit_id`) REFERENCES `patient_visits` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_queue_branch` FOREIGN KEY (`branch_id`) REFERENCES `hospital_branches` (`id`) ON DELETE NO ACTION,
  CONSTRAINT `fk_queue_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_queue_visit` FOREIGN KEY (`visit_id`) REFERENCES `patient_visits` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `patient_visits`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `patient_visits` (
  `id` varchar(50) NOT NULL,
  `visit_number` varchar(50) NOT NULL,
  `patient_id` varchar(50) NOT NULL,
  `branch_id` bigint(20) unsigned NOT NULL DEFAULT 1,
  `visit_date` date NOT NULL,
  `visit_time` time DEFAULT NULL,
  `encounter_type` varchar(40) NOT NULL DEFAULT 'Outpatient',
  `department_id` bigint(20) DEFAULT NULL,
  `patient_category_id` bigint(20) DEFAULT NULL,
  `patient_sub_category_id` bigint(20) DEFAULT NULL,
  `scheme_id` bigint(20) unsigned DEFAULT NULL,
  `scheme_name` varchar(180) DEFAULT NULL,
  `status` varchar(40) NOT NULL DEFAULT 'Open',
  `source` varchar(60) DEFAULT 'Registration',
  `opened_by` varchar(50) DEFAULT NULL,
  `closed_at` datetime DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_patient_visit_number` (`visit_number`),
  KEY `idx_pv_patient_date` (`patient_id`,`visit_date`),
  KEY `idx_pv_branch_date` (`branch_id`,`visit_date`),
  KEY `idx_pv_status` (`status`),
  KEY `fk_pv_department` (`department_id`),
  KEY `fk_pv_category` (`patient_category_id`),
  KEY `fk_pv_subcategory` (`patient_sub_category_id`),
  KEY `fk_pv_scheme` (`scheme_id`),
  CONSTRAINT `fk_pv_branch` FOREIGN KEY (`branch_id`) REFERENCES `hospital_branches` (`id`),
  CONSTRAINT `fk_pv_category` FOREIGN KEY (`patient_category_id`) REFERENCES `setup_patient_categories` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_pv_department` FOREIGN KEY (`department_id`) REFERENCES `setup_departments` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_pv_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pv_scheme` FOREIGN KEY (`scheme_id`) REFERENCES `setup_patient_schemes` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_pv_subcategory` FOREIGN KEY (`patient_sub_category_id`) REFERENCES `setup_patient_subcategories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `patients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `patients` (
  `id` varchar(50) NOT NULL,
  `full_name` varchar(180) NOT NULL,
  `age` int(11) DEFAULT 0,
  `dob` date DEFAULT NULL,
  `gender` varchar(20) NOT NULL,
  `phone` varchar(50) NOT NULL,
  `email` varchar(180) DEFAULT NULL,
  `national_id` varchar(80) DEFAULT NULL,
  `birth_certificate_no` varchar(80) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `emergency_contact` varchar(180) DEFAULT NULL,
  `emergency_phone` varchar(50) DEFAULT NULL,
  `kin_relationship` varchar(60) DEFAULT NULL,
  `blood_group` varchar(10) DEFAULT NULL,
  `allergies` text DEFAULT NULL,
  `insurance_provider` varchar(180) DEFAULT NULL,
  `insurance_scheme` varchar(180) DEFAULT NULL,
  `insurance_policy_no` varchar(120) DEFAULT NULL,
  `insurance_number` varchar(120) DEFAULT NULL,
  `patient_category` varchar(180) DEFAULT NULL,
  `patient_sub_category` varchar(180) DEFAULT NULL,
  `scheme_id` bigint(20) unsigned DEFAULT NULL,
  `status` varchar(80) DEFAULT 'Registered',
  `current_bed` varchar(80) DEFAULT NULL,
  `current_ward` varchar(120) DEFAULT NULL,
  `sha_verified` tinyint(1) DEFAULT 0,
  `sha_attendance_token` varchar(255) DEFAULT NULL,
  `registered_date` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `branch_id` bigint(20) unsigned DEFAULT 1,
  `patient_category_id` bigint(20) DEFAULT NULL,
  `patient_sub_category_id` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_patient_name` (`full_name`),
  KEY `idx_patient_phone` (`phone`),
  KEY `idx_patient_national` (`national_id`),
  KEY `idx_patients_branch` (`branch_id`),
  KEY `idx_patients_scheme` (`scheme_id`),
  KEY `idx_patients_category` (`patient_category_id`),
  KEY `idx_patients_subcategory` (`patient_sub_category_id`),
  KEY `idx_patients_category_id` (`patient_category_id`),
  KEY `idx_patients_subcategory_id` (`patient_sub_category_id`),
  CONSTRAINT `fk_patients_branch` FOREIGN KEY (`branch_id`) REFERENCES `hospital_branches` (`id`) ON DELETE NO ACTION,
  CONSTRAINT `fk_patients_category` FOREIGN KEY (`patient_category_id`) REFERENCES `setup_patient_categories` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_patients_scheme` FOREIGN KEY (`scheme_id`) REFERENCES `setup_patient_schemes` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_patients_subcategory` FOREIGN KEY (`patient_sub_category_id`) REFERENCES `setup_patient_subcategories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `payroll_components`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `payroll_components` (
  `id` varchar(50) NOT NULL,
  `name` varchar(180) NOT NULL,
  `code` varchar(80) DEFAULT NULL,
  `type` varchar(50) NOT NULL,
  `calculation` varchar(40) NOT NULL,
  `value` decimal(14,4) NOT NULL DEFAULT 0.0000,
  `basis` varchar(60) DEFAULT 'Basic Salary',
  `taxable` tinyint(1) DEFAULT 1,
  `pensionable` tinyint(1) DEFAULT 0,
  `active` tinyint(1) DEFAULT 1,
  `branch_id` bigint(20) unsigned NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_paycomp_branch` (`branch_id`),
  CONSTRAINT `fk_paycomp_branch` FOREIGN KEY (`branch_id`) REFERENCES `hospital_branches` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `payroll_runs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `payroll_runs` (
  `id` varchar(50) NOT NULL,
  `period` varchar(20) NOT NULL,
  `run_date` datetime DEFAULT NULL,
  `status` varchar(30) DEFAULT 'Draft',
  `employee_count` int(11) DEFAULT 0,
  `gross_total` decimal(14,2) DEFAULT 0.00,
  `deductions_total` decimal(14,2) DEFAULT 0.00,
  `net_total` decimal(14,2) DEFAULT 0.00,
  `employer_cost_total` decimal(14,2) DEFAULT 0.00,
  `processed_by` varchar(50) DEFAULT NULL,
  `branch_id` bigint(20) unsigned NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_payroll_period_branch` (`period`,`branch_id`),
  KEY `idx_payrun_branch` (`branch_id`),
  CONSTRAINT `fk_payrun_branch` FOREIGN KEY (`branch_id`) REFERENCES `hospital_branches` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `payroll_setup`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `payroll_setup` (
  `id` varchar(50) NOT NULL,
  `pay_frequency` varchar(30) DEFAULT 'Monthly',
  `currency` varchar(10) DEFAULT 'KES',
  `standard_working_days` decimal(8,2) DEFAULT 26.00,
  `standard_working_hours` decimal(8,2) DEFAULT 8.00,
  `overtime_rate_multiplier` decimal(8,3) DEFAULT 1.500,
  `personal_relief` decimal(12,2) DEFAULT 2400.00,
  `shif_rate` decimal(8,5) DEFAULT 0.02750,
  `shif_minimum` decimal(12,2) DEFAULT 300.00,
  `housing_levy_rate` decimal(8,5) DEFAULT 0.01500,
  `nssf_tier1_limit` decimal(14,2) DEFAULT 9000.00,
  `nssf_tier2_limit` decimal(14,2) DEFAULT 108000.00,
  `nssf_rate` decimal(8,5) DEFAULT 0.06000,
  `payroll_email_subject` varchar(255) DEFAULT 'WiseCare Payslip - {period}',
  `payslip_footer` text DEFAULT NULL,
  `branch_id` bigint(20) unsigned NOT NULL DEFAULT 1,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_paysetup_branch` (`branch_id`),
  CONSTRAINT `fk_paysetup_branch` FOREIGN KEY (`branch_id`) REFERENCES `hospital_branches` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `payslips`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `payslips` (
  `id` varchar(50) NOT NULL,
  `payroll_run_id` varchar(50) NOT NULL,
  `employee_id` varchar(50) NOT NULL,
  `employee_no` varchar(50) NOT NULL,
  `employee_name` varchar(180) NOT NULL,
  `email` varchar(180) DEFAULT NULL,
  `period` varchar(20) NOT NULL,
  `earnings_json` longtext DEFAULT NULL,
  `deductions_json` longtext DEFAULT NULL,
  `benefits_json` longtext DEFAULT NULL,
  `gross_pay` decimal(14,2) DEFAULT 0.00,
  `taxable_pay` decimal(14,2) DEFAULT 0.00,
  `net_pay` decimal(14,2) DEFAULT 0.00,
  `employer_contributions_json` longtext DEFAULT NULL,
  `employer_cost` decimal(14,2) DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `emailed_at` datetime DEFAULT NULL,
  `branch_id` bigint(20) unsigned NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `idx_payslip_run` (`payroll_run_id`),
  KEY `idx_payslip_employee` (`employee_id`),
  KEY `idx_payslip_branch` (`branch_id`),
  CONSTRAINT `fk_payslip_branch` FOREIGN KEY (`branch_id`) REFERENCES `hospital_branches` (`id`),
  CONSTRAINT `fk_payslip_employee` FOREIGN KEY (`employee_id`) REFERENCES `hr_employees` (`id`),
  CONSTRAINT `fk_payslip_run` FOREIGN KEY (`payroll_run_id`) REFERENCES `payroll_runs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `pharmacy_otc_sale_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `pharmacy_otc_sale_items` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `sale_id` varchar(60) NOT NULL,
  `inventory_id` varchar(50) NOT NULL,
  `item_code` varchar(80) DEFAULT NULL,
  `item_name` varchar(180) NOT NULL,
  `dosage_form` varchar(80) DEFAULT NULL,
  `batch_number` varchar(100) DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `quantity` decimal(12,2) NOT NULL,
  `unit_price` decimal(12,2) NOT NULL,
  `total` decimal(12,2) NOT NULL,
  `issued_quantity` decimal(12,2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (`id`),
  KEY `idx_otc_item_sale` (`sale_id`),
  KEY `idx_otc_item_inventory` (`inventory_id`),
  CONSTRAINT `fk_otc_item_sale` FOREIGN KEY (`sale_id`) REFERENCES `pharmacy_otc_sales` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `pharmacy_otc_sales`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `pharmacy_otc_sales` (
  `id` varchar(60) NOT NULL,
  `sale_number` varchar(60) NOT NULL,
  `customer_name` varchar(180) DEFAULT NULL,
  `customer_phone` varchar(60) DEFAULT NULL,
  `invoice_id` varchar(60) DEFAULT NULL,
  `sale_date` datetime NOT NULL,
  `subtotal` decimal(12,2) NOT NULL DEFAULT 0.00,
  `discount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `total_amount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `payment_method` varchar(60) DEFAULT 'Cash',
  `payment_reference` varchar(150) DEFAULT NULL,
  `status` varchar(40) NOT NULL DEFAULT 'Billed',
  `billed_by` varchar(150) DEFAULT NULL,
  `issued_by` varchar(150) DEFAULT NULL,
  `issued_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_otc_sale_number` (`sale_number`),
  KEY `idx_otc_status` (`status`),
  KEY `idx_otc_date` (`sale_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `prescriptions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `prescriptions` (
  `id` varchar(50) NOT NULL,
  `patient_id` varchar(50) NOT NULL,
  `patient_name` varchar(180) DEFAULT NULL,
  `doctor_name` varchar(180) DEFAULT NULL,
  `prescription_date` date DEFAULT NULL,
  `medication_name` varchar(180) DEFAULT NULL,
  `dosage` varchar(100) DEFAULT NULL,
  `frequency` varchar(100) DEFAULT NULL,
  `duration` varchar(100) DEFAULT NULL,
  `quantity` decimal(12,2) DEFAULT NULL,
  `unit_price` decimal(12,2) DEFAULT NULL,
  `instructions` text DEFAULT NULL,
  `status` varchar(50) DEFAULT 'Pending',
  `dispensed_by` varchar(180) DEFAULT NULL,
  `dispensed_at` datetime DEFAULT NULL,
  `setup_pharmacy_drug_id` bigint(20) DEFAULT NULL,
  `setup_pharmacy_drug_code` varchar(80) DEFAULT NULL,
  `branch_id` bigint(20) unsigned DEFAULT 1,
  `visit_id` varchar(50) DEFAULT NULL,
  `billing_status` varchar(30) NOT NULL DEFAULT 'Unpaid',
  `invoice_id` varchar(60) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_rx_patient` (`patient_id`),
  KEY `idx_rx_setup_drug` (`setup_pharmacy_drug_id`),
  KEY `idx_prescriptions_branch` (`branch_id`),
  KEY `idx_rx_visit` (`visit_id`),
  KEY `idx_prescriptions_visit` (`visit_id`),
  CONSTRAINT `fk_prescriptions_branch` FOREIGN KEY (`branch_id`) REFERENCES `hospital_branches` (`id`) ON DELETE NO ACTION,
  CONSTRAINT `fk_prescriptions_visit` FOREIGN KEY (`visit_id`) REFERENCES `patient_visits` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_rx_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rx_setup_drug` FOREIGN KEY (`setup_pharmacy_drug_id`) REFERENCES `setup_pharmacy_drugs` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_rx_visit` FOREIGN KEY (`visit_id`) REFERENCES `patient_visits` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `purchase_order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchase_order_items` (
  `id` varchar(50) NOT NULL,
  `purchase_order_id` varchar(50) NOT NULL,
  `item_code` varchar(80) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `unit` varchar(50) DEFAULT NULL,
  `quantity` decimal(12,2) DEFAULT NULL,
  `unit_price` decimal(12,2) DEFAULT NULL,
  `total_price` decimal(12,2) DEFAULT NULL,
  `received_qty` decimal(12,2) DEFAULT NULL,
  `branch_id` bigint(20) unsigned DEFAULT 1,
  `inventory_id` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `purchase_order_id` (`purchase_order_id`),
  KEY `idx_purchase_order_items_branch` (`branch_id`),
  KEY `idx_poi_inventory_id` (`inventory_id`),
  CONSTRAINT `fk_poi_inventory` FOREIGN KEY (`inventory_id`) REFERENCES `inventory` (`id`) ON DELETE SET NULL,
  CONSTRAINT `purchase_order_items_ibfk_1` FOREIGN KEY (`purchase_order_id`) REFERENCES `purchase_orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `purchase_orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchase_orders` (
  `id` varchar(50) NOT NULL,
  `lpo_number` varchar(100) DEFAULT NULL,
  `supplier_name` varchar(180) DEFAULT NULL,
  `supplier_contact` varchar(180) DEFAULT NULL,
  `order_date` date DEFAULT NULL,
  `expected_delivery_date` date DEFAULT NULL,
  `total_amount` decimal(12,2) DEFAULT NULL,
  `status` varchar(60) DEFAULT NULL,
  `approved_by` varchar(180) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `branch_id` bigint(20) unsigned DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `idx_purchase_orders_branch` (`branch_id`),
  CONSTRAINT `fk_purchase_orders_branch` FOREIGN KEY (`branch_id`) REFERENCES `hospital_branches` (`id`) ON DELETE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `radiology_orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `radiology_orders` (
  `id` varchar(50) NOT NULL,
  `patient_id` varchar(50) NOT NULL,
  `patient_name` varchar(180) DEFAULT NULL,
  `modality` varchar(80) DEFAULT NULL,
  `body_part` varchar(150) DEFAULT NULL,
  `clinical_indication` text DEFAULT NULL,
  `requested_by` varchar(180) DEFAULT NULL,
  `requested_at` datetime DEFAULT NULL,
  `cost` decimal(12,2) DEFAULT 0.00,
  `status` varchar(50) DEFAULT 'Pending',
  `radiology_report` text DEFAULT NULL,
  `conducted_by` varchar(180) DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `setup_radiology_test_id` bigint(20) DEFAULT NULL,
  `setup_radiology_template_id` bigint(20) DEFAULT NULL,
  `billing_status` varchar(30) NOT NULL DEFAULT 'Unpaid',
  `invoice_id` varchar(50) DEFAULT NULL,
  `setup_radiology_test_code` varchar(80) DEFAULT NULL,
  `branch_id` bigint(20) unsigned DEFAULT 1,
  `visit_id` varchar(50) DEFAULT NULL,
  `tariff_sub_category_id` bigint(20) DEFAULT NULL,
  `tariff_sub_category_code` varchar(80) DEFAULT NULL,
  `tariff_sub_category_name` varchar(180) DEFAULT NULL,
  `price_source` varchar(120) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_rad_patient` (`patient_id`),
  KEY `idx_rad_setup_test` (`setup_radiology_test_id`),
  KEY `idx_rad_setup_template` (`setup_radiology_template_id`),
  KEY `idx_radiology_orders_branch` (`branch_id`),
  KEY `idx_rad_visit` (`visit_id`),
  KEY `idx_radiology_orders_visit` (`visit_id`),
  CONSTRAINT `fk_rad_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rad_setup_template` FOREIGN KEY (`setup_radiology_template_id`) REFERENCES `setup_radiology_templates` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_rad_setup_test` FOREIGN KEY (`setup_radiology_test_id`) REFERENCES `setup_radiology_tests` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_rad_visit` FOREIGN KEY (`visit_id`) REFERENCES `patient_visits` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_radiology_branch` FOREIGN KEY (`branch_id`) REFERENCES `hospital_branches` (`id`) ON DELETE NO ACTION,
  CONSTRAINT `fk_radiology_orders_branch` FOREIGN KEY (`branch_id`) REFERENCES `hospital_branches` (`id`) ON DELETE NO ACTION,
  CONSTRAINT `fk_radiology_orders_visit` FOREIGN KEY (`visit_id`) REFERENCES `patient_visits` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `report_department_definitions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `report_department_definitions` (
  `id` varchar(50) NOT NULL,
  `department_code` varchar(50) NOT NULL,
  `department_name` varchar(180) NOT NULL,
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `department_code` (`department_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `report_runs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `report_runs` (
  `id` varchar(50) NOT NULL,
  `report_code` varchar(80) NOT NULL,
  `department_code` varchar(50) DEFAULT NULL,
  `period_start` date NOT NULL,
  `period_end` date NOT NULL,
  `generated_by` varchar(180) DEFAULT NULL,
  `generated_at` datetime DEFAULT current_timestamp(),
  `status` varchar(30) DEFAULT 'Generated',
  `output_format` varchar(20) DEFAULT 'PRINT',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `security_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `security_roles` (
  `id` varchar(80) NOT NULL,
  `name` varchar(120) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `is_system` tinyint(1) NOT NULL DEFAULT 0,
  `rights_json` longtext DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `setup_bed_charge_components`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `setup_bed_charge_components` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `bed_id` bigint(20) NOT NULL,
  `sub_category_id` bigint(20) DEFAULT NULL,
  `charge_type` varchar(40) NOT NULL,
  `amount` decimal(12,2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_sbcc` (`bed_id`,`sub_category_id`,`charge_type`),
  KEY `idx_sbcc_subcategory` (`sub_category_id`),
  CONSTRAINT `fk_sbcc_bed` FOREIGN KEY (`bed_id`) REFERENCES `setup_bed_items` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_sbcc_subcategory` FOREIGN KEY (`sub_category_id`) REFERENCES `setup_patient_subcategories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `setup_bed_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `setup_bed_items` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `bed_number` varchar(80) DEFAULT NULL,
  `ward_name` varchar(180) DEFAULT NULL,
  `bed_type` varchar(80) DEFAULT NULL,
  `cash_daily_rate` decimal(12,2) DEFAULT NULL,
  `sub_category_daily_rates_json` longtext DEFAULT NULL,
  `oxygen_equipped` tinyint(1) DEFAULT NULL,
  `cardiac_monitor_equipped` tinyint(1) DEFAULT NULL,
  `status` varchar(40) DEFAULT NULL,
  `ward_id` varchar(50) DEFAULT NULL,
  `bed_charge` decimal(12,2) DEFAULT 0.00,
  `nursing_care_charge` decimal(12,2) DEFAULT 0.00,
  `meals_nutrition_charge` decimal(12,2) DEFAULT 0.00,
  `daily_review_charge` decimal(12,2) DEFAULT 0.00,
  `sub_category_charge_components_json` longtext DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_setup_bed_ward` (`ward_id`),
  CONSTRAINT `fk_setup_bed_ward` FOREIGN KEY (`ward_id`) REFERENCES `wards` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `setup_cancer_preauth_rules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `setup_cancer_preauth_rules` (
  `id` varchar(50) NOT NULL,
  `protocol_id` varchar(50) DEFAULT NULL,
  `service_id` varchar(50) DEFAULT NULL,
  `rule_name` varchar(180) NOT NULL,
  `requires_preauth` tinyint(1) DEFAULT 1,
  `minimum_amount` decimal(12,2) DEFAULT 0.00,
  `sha_benefit_code` varchar(100) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `status` varchar(30) DEFAULT 'Active',
  PRIMARY KEY (`id`),
  KEY `idx_cpr_protocol` (`protocol_id`),
  KEY `idx_cpr_service` (`service_id`),
  CONSTRAINT `fk_cpr_protocol` FOREIGN KEY (`protocol_id`) REFERENCES `setup_cancer_protocols` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cpr_service` FOREIGN KEY (`service_id`) REFERENCES `setup_cancer_services` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `setup_cancer_protocol_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `setup_cancer_protocol_items` (
  `id` varchar(50) NOT NULL,
  `protocol_id` varchar(50) NOT NULL,
  `source_entity` varchar(80) DEFAULT NULL,
  `source_id` varchar(80) DEFAULT NULL,
  `item_code` varchar(100) DEFAULT NULL,
  `item_name` varchar(255) NOT NULL,
  `item_type` varchar(80) NOT NULL,
  `dose` varchar(120) DEFAULT NULL,
  `frequency` varchar(120) DEFAULT NULL,
  `duration_days` int(11) DEFAULT 1,
  `default_quantity` decimal(12,2) DEFAULT 1.00,
  `billing_category` varchar(80) DEFAULT NULL,
  `preauth_required` tinyint(1) DEFAULT 1,
  `status` varchar(30) DEFAULT 'Active',
  PRIMARY KEY (`id`),
  KEY `idx_cpi_protocol` (`protocol_id`),
  CONSTRAINT `fk_cpi_protocol` FOREIGN KEY (`protocol_id`) REFERENCES `setup_cancer_protocols` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `setup_cancer_protocols`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `setup_cancer_protocols` (
  `id` varchar(50) NOT NULL,
  `code` varchar(80) NOT NULL,
  `name` varchar(255) NOT NULL,
  `treatment_type` varchar(80) NOT NULL,
  `regimen` varchar(255) DEFAULT NULL,
  `intent` varchar(100) DEFAULT NULL,
  `route` varchar(100) DEFAULT NULL,
  `cycle_days` int(11) DEFAULT 21,
  `default_cycles` int(11) DEFAULT 1,
  `department` varchar(150) DEFAULT 'Oncology',
  `preauth_required` tinyint(1) DEFAULT 1,
  `sha_benefit_code` varchar(100) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `status` varchar(30) DEFAULT 'Active',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_cancer_protocol_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `setup_cancer_services`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `setup_cancer_services` (
  `id` varchar(50) NOT NULL,
  `code` varchar(100) NOT NULL,
  `name` varchar(255) NOT NULL,
  `service_type` varchar(80) NOT NULL,
  `source_entity` varchar(80) DEFAULT NULL,
  `source_id` varchar(80) DEFAULT NULL,
  `cash_price` decimal(12,2) DEFAULT 0.00,
  `sha_subcategory_code` varchar(100) DEFAULT NULL,
  `sha_price` decimal(12,2) DEFAULT 0.00,
  `billing_category` varchar(80) DEFAULT 'Procedure',
  `preauth_required` tinyint(1) DEFAULT 1,
  `status` varchar(30) DEFAULT 'Active',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_cancer_service_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `setup_consultation_prices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `setup_consultation_prices` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `consultation_id` bigint(20) NOT NULL,
  `sub_category_id` bigint(20) NOT NULL,
  `price` decimal(12,2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_setup_consultation_price` (`consultation_id`,`sub_category_id`),
  KEY `idx_scp_subcategory` (`sub_category_id`),
  CONSTRAINT `fk_scp_consultation` FOREIGN KEY (`consultation_id`) REFERENCES `setup_consultation_services` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_scp_subcategory` FOREIGN KEY (`sub_category_id`) REFERENCES `setup_patient_subcategories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `setup_consultation_services`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `setup_consultation_services` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `code` varchar(80) DEFAULT NULL,
  `name` varchar(180) DEFAULT NULL,
  `department` varchar(180) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `duration_minutes` int(11) DEFAULT NULL,
  `cash_price` decimal(12,2) DEFAULT NULL,
  `sub_category_prices_json` longtext DEFAULT NULL,
  `status` varchar(30) DEFAULT NULL,
  `department_id` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_scs_department_id` (`department_id`),
  CONSTRAINT `fk_scs_department` FOREIGN KEY (`department_id`) REFERENCES `setup_departments` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `setup_departments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `setup_departments` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `code` varchar(80) DEFAULT NULL,
  `name` varchar(180) DEFAULT NULL,
  `type` varchar(50) DEFAULT NULL,
  `head_of_department` varchar(180) DEFAULT NULL,
  `phone_ext` varchar(50) DEFAULT NULL,
  `location` varchar(150) DEFAULT NULL,
  `status` varchar(30) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `setup_icd11`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `setup_icd11` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `code` varchar(80) DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `chapter` varchar(180) DEFAULT NULL,
  `block` varchar(180) DEFAULT NULL,
  `category` varchar(50) DEFAULT NULL,
  `description` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_setup_icd11_title` (`title`),
  KEY `idx_setup_icd11_code` (`code`),
  FULLTEXT KEY `ft_setup_icd11_title_code` (`title`,`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `setup_inpatient_package_prices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `setup_inpatient_package_prices` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `package_id` bigint(20) NOT NULL,
  `sub_category_id` bigint(20) NOT NULL,
  `price` decimal(12,2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_sipp_price` (`package_id`,`sub_category_id`),
  KEY `idx_sipp_subcategory` (`sub_category_id`),
  CONSTRAINT `fk_sipp_package` FOREIGN KEY (`package_id`) REFERENCES `setup_inpatient_packages` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_sipp_subcategory` FOREIGN KEY (`sub_category_id`) REFERENCES `setup_patient_subcategories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `setup_inpatient_packages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `setup_inpatient_packages` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `package_code` varchar(80) DEFAULT NULL,
  `package_name` varchar(180) DEFAULT NULL,
  `ward_type` varchar(100) DEFAULT NULL,
  `included_days` int(11) DEFAULT NULL,
  `included_procedures_json` longtext DEFAULT NULL,
  `cash_price` decimal(12,2) DEFAULT NULL,
  `sub_category_prices_json` longtext DEFAULT NULL,
  `overstay_daily_rate` decimal(12,2) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `status` varchar(30) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `setup_lab_test_prices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `setup_lab_test_prices` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `lab_test_id` bigint(20) NOT NULL,
  `sub_category_id` bigint(20) NOT NULL,
  `price` decimal(12,2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_sltp_price` (`lab_test_id`,`sub_category_id`),
  KEY `idx_sltp_subcategory` (`sub_category_id`),
  CONSTRAINT `fk_sltp_subcategory` FOREIGN KEY (`sub_category_id`) REFERENCES `setup_patient_subcategories` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_sltp_test` FOREIGN KEY (`lab_test_id`) REFERENCES `setup_lab_tests` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `setup_lab_tests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `setup_lab_tests` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `code` varchar(80) DEFAULT NULL,
  `name` varchar(180) DEFAULT NULL,
  `department` varchar(120) DEFAULT NULL,
  `specimen_type` varchar(120) DEFAULT NULL,
  `turnaround_minutes` int(11) DEFAULT NULL,
  `cash_price` decimal(12,2) DEFAULT NULL,
  `sub_category_prices_json` longtext DEFAULT NULL,
  `parameters_json` longtext DEFAULT NULL,
  `status` varchar(30) DEFAULT NULL,
  `clinical_comment` longtext DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `setup_nursing_procedure_prices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `setup_nursing_procedure_prices` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `nursing_procedure_id` bigint(20) NOT NULL,
  `sub_category_id` bigint(20) NOT NULL,
  `price` decimal(12,2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_snpp_price` (`nursing_procedure_id`,`sub_category_id`),
  KEY `idx_snpp_subcategory` (`sub_category_id`),
  CONSTRAINT `fk_snpp_procedure` FOREIGN KEY (`nursing_procedure_id`) REFERENCES `setup_nursing_procedures` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_snpp_subcategory` FOREIGN KEY (`sub_category_id`) REFERENCES `setup_patient_subcategories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `setup_nursing_procedures`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `setup_nursing_procedures` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `code` varchar(80) DEFAULT NULL,
  `name` varchar(180) DEFAULT NULL,
  `department` varchar(120) DEFAULT NULL,
  `consumables` text DEFAULT NULL,
  `cash_price` decimal(12,2) DEFAULT NULL,
  `sub_category_prices_json` longtext DEFAULT NULL,
  `status` varchar(30) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `setup_patient_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `setup_patient_categories` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `code` varchar(80) DEFAULT NULL,
  `name` varchar(180) DEFAULT NULL,
  `is_cash` tinyint(1) DEFAULT NULL,
  `default_discount` decimal(12,2) DEFAULT NULL,
  `status` varchar(30) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `setup_patient_schemes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `setup_patient_schemes` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `sub_category_id` bigint(20) NOT NULL,
  `provider_name` varchar(180) DEFAULT NULL,
  `scheme_code` varchar(100) DEFAULT NULL,
  `scheme_name` varchar(180) NOT NULL,
  `scheme_type` varchar(50) DEFAULT 'Comprehensive',
  `copay_rule` varchar(180) DEFAULT '0%',
  `copay_amount` decimal(12,2) DEFAULT 0.00,
  `credit_limit` decimal(12,2) DEFAULT 0.00,
  `preauth_required` tinyint(1) DEFAULT 0,
  `contact_person` varchar(180) DEFAULT NULL,
  `contact_phone` varchar(80) DEFAULT NULL,
  `status` varchar(30) DEFAULT 'Active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_sps_scheme` (`sub_category_id`,`scheme_code`,`scheme_name`),
  KEY `idx_sps_subcategory` (`sub_category_id`),
  CONSTRAINT `fk_sps_subcategory` FOREIGN KEY (`sub_category_id`) REFERENCES `setup_patient_subcategories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `setup_patient_subcategories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `setup_patient_subcategories` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `category_code` varchar(80) DEFAULT NULL,
  `category_name` varchar(180) DEFAULT NULL,
  `sub_category_code` varchar(100) DEFAULT NULL,
  `name` varchar(180) DEFAULT NULL,
  `is_cash` tinyint(1) DEFAULT NULL,
  `scheme_code` varchar(100) DEFAULT NULL,
  `scheme_name` varchar(180) DEFAULT NULL,
  `scheme_type` varchar(50) DEFAULT NULL,
  `copay_rule` varchar(180) DEFAULT NULL,
  `copay_amount` decimal(12,2) DEFAULT NULL,
  `credit_limit` decimal(12,2) DEFAULT NULL,
  `preauth_required` tinyint(1) DEFAULT NULL,
  `contact_person` varchar(180) DEFAULT NULL,
  `contact_phone` varchar(80) DEFAULT NULL,
  `status` varchar(30) DEFAULT NULL,
  `category_id` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_spsc_category_id` (`category_id`),
  CONSTRAINT `fk_spsc_category` FOREIGN KEY (`category_id`) REFERENCES `setup_patient_categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `setup_pharmacy_drug_prices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `setup_pharmacy_drug_prices` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `drug_id` bigint(20) NOT NULL,
  `sub_category_id` bigint(20) NOT NULL,
  `price` decimal(12,2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_spp_price` (`drug_id`,`sub_category_id`),
  KEY `idx_spp_subcategory` (`sub_category_id`),
  CONSTRAINT `fk_spp_drug` FOREIGN KEY (`drug_id`) REFERENCES `setup_pharmacy_drugs` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_spp_subcategory` FOREIGN KEY (`sub_category_id`) REFERENCES `setup_patient_subcategories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `setup_pharmacy_drugs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `setup_pharmacy_drugs` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `code` varchar(80) DEFAULT NULL,
  `brand_name` varchar(180) DEFAULT NULL,
  `generic_name` varchar(180) DEFAULT NULL,
  `formulation` varchar(100) DEFAULT NULL,
  `strength` varchar(100) DEFAULT NULL,
  `category` varchar(120) DEFAULT NULL,
  `cash_price` decimal(12,2) DEFAULT NULL,
  `sub_category_prices_json` longtext DEFAULT NULL,
  `status` varchar(30) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `setup_radiology_templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `setup_radiology_templates` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `template_code` varchar(80) DEFAULT NULL,
  `template_name` varchar(180) DEFAULT NULL,
  `modality` varchar(80) DEFAULT NULL,
  `indication_boilerplate` text DEFAULT NULL,
  `technique_boilerplate` text DEFAULT NULL,
  `findings_template` text DEFAULT NULL,
  `impression_template` text DEFAULT NULL,
  `normal_report_text` text DEFAULT NULL,
  `is_default` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `setup_radiology_test_prices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `setup_radiology_test_prices` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `radiology_test_id` bigint(20) NOT NULL,
  `sub_category_id` bigint(20) NOT NULL,
  `price` decimal(12,2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_srtp_price` (`radiology_test_id`,`sub_category_id`),
  KEY `idx_srtp_subcategory` (`sub_category_id`),
  CONSTRAINT `fk_srtp_subcategory` FOREIGN KEY (`sub_category_id`) REFERENCES `setup_patient_subcategories` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_srtp_test` FOREIGN KEY (`radiology_test_id`) REFERENCES `setup_radiology_tests` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `setup_radiology_tests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `setup_radiology_tests` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `code` varchar(80) DEFAULT NULL,
  `name` varchar(180) DEFAULT NULL,
  `category` varchar(120) DEFAULT NULL,
  `modality` varchar(80) DEFAULT NULL,
  `preparation_instructions` text DEFAULT NULL,
  `requires_contrast` tinyint(1) DEFAULT NULL,
  `cash_price` decimal(12,2) DEFAULT NULL,
  `sub_category_prices_json` longtext DEFAULT NULL,
  `default_template_id` bigint(20) DEFAULT NULL,
  `status` varchar(30) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `setup_sha_rebates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `setup_sha_rebates` (
  `id` varchar(80) NOT NULL,
  `code` varchar(80) DEFAULT NULL,
  `package_name` varchar(180) DEFAULT NULL,
  `daily_rebate_amount` decimal(12,2) DEFAULT NULL,
  `ward_category` varchar(120) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT NULL,
  `facility_level` varchar(20) DEFAULT NULL,
  `benefit_category` varchar(80) DEFAULT NULL,
  `sha_max_per_day` decimal(12,2) DEFAULT NULL,
  `max_days_per_year` int(11) DEFAULT NULL,
  `requires_preauth` tinyint(1) DEFAULT NULL,
  `fund` varchar(40) DEFAULT NULL,
  `effective_from` date DEFAULT NULL,
  `effective_to` date DEFAULT NULL,
  `legal_reference` varchar(200) DEFAULT NULL,
  `discount_per_day` decimal(12,2) DEFAULT NULL,
  `discount_label` varchar(80) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `setup_ward_tariffs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `setup_ward_tariffs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `ward_id` varchar(50) NOT NULL,
  `sub_category_id` bigint(20) NOT NULL,
  `bed_charge` decimal(12,2) NOT NULL DEFAULT 0.00,
  `nursing_care_charge` decimal(12,2) NOT NULL DEFAULT 0.00,
  `meals_nutrition_charge` decimal(12,2) NOT NULL DEFAULT 0.00,
  `daily_review_charge` decimal(12,2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_setup_ward_tariff` (`ward_id`,`sub_category_id`),
  KEY `idx_swt_subcategory` (`sub_category_id`),
  CONSTRAINT `fk_swt_subcategory` FOREIGN KEY (`sub_category_id`) REFERENCES `setup_patient_subcategories` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_swt_ward` FOREIGN KEY (`ward_id`) REFERENCES `wards` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `setup_workflow_mappings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `setup_workflow_mappings` (
  `id` varchar(100) NOT NULL,
  `source_entity` varchar(80) NOT NULL,
  `source_id` varchar(100) NOT NULL,
  `source_code` varchar(100) DEFAULT NULL,
  `workflow_code` varchar(80) NOT NULL,
  `execution_station` varchar(80) DEFAULT NULL,
  `billing_required` tinyint(1) NOT NULL DEFAULT 1,
  `collection_requires_payment` tinyint(1) NOT NULL DEFAULT 0,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `notes` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_swm_source` (`source_entity`,`source_id`),
  KEY `idx_swm_workflow` (`workflow_code`),
  KEY `idx_swm_station` (`execution_station`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `sha_claim_diagnoses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `sha_claim_diagnoses` (
  `id` varchar(50) NOT NULL,
  `claim_id` varchar(50) NOT NULL,
  `code` varchar(80) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `diagnosis_type` varchar(50) DEFAULT NULL,
  `branch_id` bigint(20) unsigned DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `claim_id` (`claim_id`),
  KEY `idx_sha_claim_diagnoses_branch` (`branch_id`),
  CONSTRAINT `sha_claim_diagnoses_ibfk_1` FOREIGN KEY (`claim_id`) REFERENCES `sha_claims` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `sha_claim_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `sha_claim_items` (
  `id` varchar(50) NOT NULL,
  `claim_id` varchar(50) NOT NULL,
  `item_code` varchar(100) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `category` varchar(100) DEFAULT NULL,
  `quantity` decimal(12,2) DEFAULT NULL,
  `unit_price` decimal(12,2) DEFAULT NULL,
  `total_cost` decimal(12,2) DEFAULT NULL,
  `sha_rebate` decimal(12,2) DEFAULT NULL,
  `patient_copay` decimal(12,2) DEFAULT NULL,
  `preauth_ref` varchar(120) DEFAULT NULL,
  `adjudication_status` varchar(50) DEFAULT NULL,
  `disallowance_reason` text DEFAULT NULL,
  `setup_item_type` varchar(50) DEFAULT NULL,
  `setup_item_id` bigint(20) DEFAULT NULL,
  `branch_id` bigint(20) unsigned DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `claim_id` (`claim_id`),
  KEY `idx_sha_claim_items_branch` (`branch_id`),
  CONSTRAINT `sha_claim_items_ibfk_1` FOREIGN KEY (`claim_id`) REFERENCES `sha_claims` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `sha_claims`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `sha_claims` (
  `id` varchar(50) NOT NULL,
  `claim_number` varchar(120) DEFAULT NULL,
  `fhir_claim_id` varchar(180) DEFAULT NULL,
  `patient_id` varchar(50) NOT NULL,
  `patient_name` varchar(180) DEFAULT NULL,
  `national_id` varchar(80) DEFAULT NULL,
  `sha_member_number` varchar(120) DEFAULT NULL,
  `scheme_type` varchar(80) DEFAULT NULL,
  `claim_type` varchar(100) DEFAULT NULL,
  `encounter_type` varchar(50) DEFAULT NULL,
  `visit_date` date DEFAULT NULL,
  `discharge_date` date DEFAULT NULL,
  `admitting_doctor` varchar(180) DEFAULT NULL,
  `kmdc_number` varchar(100) DEFAULT NULL,
  `total_claim_amount` decimal(14,2) DEFAULT NULL,
  `approved_amount` decimal(14,2) DEFAULT NULL,
  `patient_copay` decimal(14,2) DEFAULT NULL,
  `deduction_amount` decimal(14,2) DEFAULT NULL,
  `status` varchar(80) DEFAULT NULL,
  `preauth_number` varchar(120) DEFAULT NULL,
  `dha_hie_transaction_id` varchar(180) DEFAULT NULL,
  `dha_submission_timestamp` datetime DEFAULT NULL,
  `dha_adjudication_timestamp` datetime DEFAULT NULL,
  `rejection_code` varchar(100) DEFAULT NULL,
  `rejection_reason` text DEFAULT NULL,
  `clinical_audit_notes` text DEFAULT NULL,
  `supporting_docs_json` longtext DEFAULT NULL,
  `fhir_bundle_json` longtext DEFAULT NULL,
  `resubmission_count` int(11) DEFAULT 0,
  `last_updated` datetime DEFAULT NULL,
  `branch_id` bigint(20) unsigned DEFAULT 1,
  `visit_id` varchar(50) DEFAULT NULL,
  `invoice_id` varchar(50) DEFAULT NULL,
  `mwavuli_environment` varchar(20) DEFAULT NULL,
  `mwavuli_status` varchar(40) DEFAULT NULL,
  `mwavuli_hold_code` varchar(80) DEFAULT NULL,
  `mwavuli_hold_reason` text DEFAULT NULL,
  `mwavuli_submitted_at` datetime DEFAULT NULL,
  `mwavuli_checked_at` datetime DEFAULT NULL,
  `mwavuli_response_json` longtext DEFAULT NULL,
  `payer_relationship` varchar(20) DEFAULT NULL,
  `principal_member_number` varchar(120) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `patient_id` (`patient_id`),
  KEY `idx_sha_claims_branch` (`branch_id`),
  KEY `idx_sha_claim_visit` (`visit_id`),
  KEY `idx_sha_claims_visit` (`visit_id`),
  CONSTRAINT `fk_sha_claims_branch` FOREIGN KEY (`branch_id`) REFERENCES `hospital_branches` (`id`) ON DELETE NO ACTION,
  CONSTRAINT `sha_claims_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `sha_code_map`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `sha_code_map` (
  `kind` varchar(20) NOT NULL,
  `vendor_code` varchar(80) NOT NULL,
  `target_code` varchar(40) NOT NULL,
  `target_display` varchar(255) DEFAULT NULL,
  `updated_by` varchar(100) DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`kind`,`vendor_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `sha_eligibility`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `sha_eligibility` (
  `national_id` varchar(80) NOT NULL,
  `member_number` varchar(120) DEFAULT NULL,
  `full_name` varchar(180) DEFAULT NULL,
  `dob` date DEFAULT NULL,
  `gender` varchar(20) DEFAULT NULL,
  `phone` varchar(80) DEFAULT NULL,
  `scheme_type` varchar(80) DEFAULT NULL,
  `sub_category` varchar(120) DEFAULT NULL,
  `status` varchar(40) DEFAULT NULL,
  `verified_at` datetime DEFAULT NULL,
  `biometric_verified` tinyint(1) DEFAULT NULL,
  `fingerprint_match_confidence` decimal(6,2) DEFAULT NULL,
  `opd_available` tinyint(1) DEFAULT NULL,
  `opd_daily_cap` decimal(12,2) DEFAULT NULL,
  `ipd_daily_limit` decimal(12,2) DEFAULT NULL,
  `maternity_covered` tinyint(1) DEFAULT NULL,
  `chronic_covered` tinyint(1) DEFAULT NULL,
  `dialysis_sessions_remaining` int(11) DEFAULT NULL,
  `preauth_required_procedures_json` longtext DEFAULT NULL,
  `attendance_token` varchar(255) DEFAULT NULL,
  `otp_verified` tinyint(1) DEFAULT NULL,
  `branch_id` bigint(20) unsigned DEFAULT 1,
  PRIMARY KEY (`national_id`),
  KEY `idx_sha_eligibility_branch` (`branch_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `sha_interventions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `sha_interventions` (
  `code` varchar(40) NOT NULL,
  `name` varchar(500) NOT NULL,
  `sub_benefit` varchar(40) DEFAULT NULL,
  `sub_benefit_name` varchar(255) DEFAULT NULL,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `synced_at` datetime NOT NULL,
  PRIMARY KEY (`code`),
  KEY `idx_sha_interventions_name` (`name`(100))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `sha_preauthorizations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `sha_preauthorizations` (
  `id` varchar(50) NOT NULL,
  `preauth_number` varchar(120) DEFAULT NULL,
  `patient_id` varchar(50) NOT NULL,
  `patient_name` varchar(180) DEFAULT NULL,
  `national_id` varchar(80) DEFAULT NULL,
  `sha_member_number` varchar(120) DEFAULT NULL,
  `scheme` varchar(80) DEFAULT NULL,
  `requested_date` date DEFAULT NULL,
  `validity_expiry` date DEFAULT NULL,
  `procedure_code` varchar(100) DEFAULT NULL,
  `procedure_name` varchar(255) DEFAULT NULL,
  `department` varchar(150) DEFAULT NULL,
  `estimated_cost` decimal(12,2) DEFAULT NULL,
  `approved_amount` decimal(12,2) DEFAULT NULL,
  `diagnosis_code` varchar(80) DEFAULT NULL,
  `diagnosis_name` varchar(255) DEFAULT NULL,
  `clinician_name` varchar(180) DEFAULT NULL,
  `kmdc_number` varchar(100) DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  `urgency` varchar(30) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `dha_approval_notes` text DEFAULT NULL,
  `attachments_json` longtext DEFAULT NULL,
  `branch_id` bigint(20) unsigned DEFAULT 1,
  `visit_id` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `patient_id` (`patient_id`),
  KEY `idx_sha_preauthorizations_branch` (`branch_id`),
  KEY `idx_sha_preauth_visit` (`visit_id`),
  KEY `idx_sha_preauthorizations_visit` (`visit_id`),
  CONSTRAINT `fk_sha_preauth_branch` FOREIGN KEY (`branch_id`) REFERENCES `hospital_branches` (`id`) ON DELETE NO ACTION,
  CONSTRAINT `fk_sha_preauth_visit` FOREIGN KEY (`visit_id`) REFERENCES `patient_visits` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_sha_preauthorizations_branch` FOREIGN KEY (`branch_id`) REFERENCES `hospital_branches` (`id`) ON DELETE NO ACTION,
  CONSTRAINT `fk_sha_preauthorizations_visit` FOREIGN KEY (`visit_id`) REFERENCES `patient_visits` (`id`) ON DELETE SET NULL,
  CONSTRAINT `sha_preauthorizations_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `sha_remittances`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `sha_remittances` (
  `id` varchar(50) NOT NULL,
  `voucher_number` varchar(120) DEFAULT NULL,
  `batch_id` varchar(120) DEFAULT NULL,
  `payment_date` date DEFAULT NULL,
  `bank_reference` varchar(150) DEFAULT NULL,
  `scheme` varchar(80) DEFAULT NULL,
  `total_claims_count` int(11) DEFAULT NULL,
  `total_claimed_amount` decimal(14,2) DEFAULT NULL,
  `total_approved_amount` decimal(14,2) DEFAULT NULL,
  `total_disallowed_amount` decimal(14,2) DEFAULT NULL,
  `withholding_tax` decimal(14,2) DEFAULT NULL,
  `net_disbursed_amount` decimal(14,2) DEFAULT NULL,
  `status` varchar(40) DEFAULT NULL,
  `claim_ids_json` longtext DEFAULT NULL,
  `branch_id` bigint(20) unsigned DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `idx_sha_remittances_branch` (`branch_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `sha_visit_consents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `sha_visit_consents` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `visit_id` varchar(40) NOT NULL,
  `consent_id` varchar(40) NOT NULL,
  `purpose` varchar(20) NOT NULL,
  `method` varchar(20) NOT NULL,
  `status` varchar(30) NOT NULL,
  `interventions` varchar(255) DEFAULT NULL,
  `sent_to` varchar(60) DEFAULT NULL,
  `workstation_id` varchar(40) DEFAULT NULL,
  `workstation` varchar(120) DEFAULT NULL,
  `expires_at` datetime DEFAULT NULL,
  `resend_after` datetime DEFAULT NULL,
  `attempts_left` int(11) DEFAULT NULL,
  `verified_at` datetime DEFAULT NULL,
  `failure_code` varchar(80) DEFAULT NULL,
  `failure_message` varchar(255) DEFAULT NULL,
  `response_json` longtext DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `sent_json` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_svc_consent` (`visit_id`,`consent_id`),
  KEY `idx_svc_visit` (`visit_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `sha_visit_diagnoses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `sha_visit_diagnoses` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `visit_id` varchar(40) NOT NULL,
  `code` varchar(40) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `is_primary` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp(),
  `source` varchar(30) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_svd_visit` (`visit_id`),
  CONSTRAINT `fk_svd_visit` FOREIGN KEY (`visit_id`) REFERENCES `sha_visits` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `sha_visit_documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `sha_visit_documents` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `visit_id` varchar(40) NOT NULL,
  `doc_id` varchar(40) NOT NULL,
  `document_type` varchar(30) NOT NULL,
  `title` varchar(180) NOT NULL,
  `file_name` varchar(255) DEFAULT NULL,
  `file_path` varchar(255) NOT NULL,
  `content_type` varchar(60) NOT NULL,
  `size_bytes` int(11) NOT NULL,
  `sha256` char(64) DEFAULT NULL,
  `generated` tinyint(1) NOT NULL DEFAULT 0,
  `uploaded_at` datetime DEFAULT NULL,
  `upload_error` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_svdoc` (`visit_id`,`doc_id`),
  KEY `idx_svdoc_visit` (`visit_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `sha_visit_emergencies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `sha_visit_emergencies` (
  `visit_id` varchar(40) NOT NULL,
  `status` varchar(20) NOT NULL,
  `identification` varchar(20) NOT NULL,
  `identified_patient_id` varchar(50) DEFAULT NULL,
  `identifying_patient_id` varchar(50) DEFAULT NULL,
  `interventions` varchar(255) NOT NULL,
  `arrival_mode` varchar(30) NOT NULL,
  `brought_by` varchar(30) NOT NULL,
  `reference_number` varchar(80) DEFAULT NULL,
  `doctor_json` text NOT NULL,
  `notes` text DEFAULT NULL,
  `unknown_reason` varchar(500) DEFAULT NULL,
  `protocols_json` text DEFAULT NULL,
  `sent_to` varchar(60) DEFAULT NULL,
  `otp_expires_at` datetime DEFAULT NULL,
  `resend_after` datetime DEFAULT NULL,
  `attempts_left` int(11) DEFAULT NULL,
  `failure_code` varchar(80) DEFAULT NULL,
  `failure_message` varchar(255) DEFAULT NULL,
  `requested_at` datetime DEFAULT NULL,
  `opened_at` datetime DEFAULT NULL,
  `identified_at` datetime DEFAULT NULL,
  `response_json` longtext DEFAULT NULL,
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`visit_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `sha_visit_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `sha_visit_items` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `visit_id` varchar(40) NOT NULL,
  `stage` varchar(20) NOT NULL,
  `category` varchar(30) NOT NULL,
  `setup_type` varchar(20) NOT NULL,
  `setup_id` bigint(20) NOT NULL,
  `code` varchar(80) NOT NULL,
  `name` varchar(255) NOT NULL,
  `claim_category` varchar(40) NOT NULL,
  `quantity` decimal(12,2) NOT NULL DEFAULT 1.00,
  `unit_price` decimal(12,2) NOT NULL,
  `price_key` varchar(60) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `source_invoice_id` varchar(50) DEFAULT NULL,
  `source_invoice_item_id` bigint(20) DEFAULT NULL,
  `intervention_code` varchar(40) DEFAULT NULL,
  `rx_dose` decimal(10,2) DEFAULT NULL,
  `rx_dose_unit` varchar(30) DEFAULT NULL,
  `rx_times_per_day` int(11) DEFAULT NULL,
  `rx_days` int(11) DEFAULT NULL,
  `rx_instructions` varchar(255) DEFAULT NULL,
  `rx_as_needed` tinyint(1) NOT NULL DEFAULT 0,
  `rx_prescribed_at` datetime DEFAULT NULL,
  `rx_source` varchar(60) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_svi_visit` (`visit_id`),
  CONSTRAINT `fk_svi_visit` FOREIGN KEY (`visit_id`) REFERENCES `sha_visits` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `sha_visit_preauths`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `sha_visit_preauths` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `visit_id` varchar(40) NOT NULL,
  `preauth_id` varchar(40) NOT NULL,
  `type` varchar(20) NOT NULL,
  `service_id` varchar(40) DEFAULT NULL,
  `intervention_code` varchar(40) DEFAULT NULL,
  `amount` decimal(14,2) DEFAULT NULL,
  `status` varchar(20) NOT NULL,
  `reference` varchar(60) DEFAULT NULL,
  `reason` text DEFAULT NULL,
  `dha_trace_id` varchar(80) DEFAULT NULL,
  `service_start` datetime DEFAULT NULL,
  `service_end` datetime DEFAULT NULL,
  `details_json` text DEFAULT NULL,
  `document_ids` varchar(255) DEFAULT NULL,
  `requested_at` datetime DEFAULT NULL,
  `decided_at` datetime DEFAULT NULL,
  `doctor_asked_at` datetime DEFAULT NULL,
  `response_json` longtext DEFAULT NULL,
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_svp` (`visit_id`,`preauth_id`),
  KEY `idx_svp_visit` (`visit_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `sha_visits`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `sha_visits` (
  `id` varchar(40) NOT NULL,
  `visit_number` varchar(50) DEFAULT NULL,
  `patient_id` varchar(50) NOT NULL,
  `patient_name` varchar(180) DEFAULT NULL,
  `member_number` varchar(120) DEFAULT NULL,
  `relationship` varchar(20) NOT NULL DEFAULT 'principal',
  `principal_member_number` varchar(120) DEFAULT NULL,
  `eligibility_check_id` bigint(20) unsigned DEFAULT NULL,
  `benefit_package` varchar(180) DEFAULT NULL,
  `status` varchar(20) NOT NULL,
  `patient_otp_token` varchar(60) DEFAULT NULL,
  `patient_otp_at` datetime DEFAULT NULL,
  `intervention_started_at` datetime DEFAULT NULL,
  `visit_started_at` datetime DEFAULT NULL,
  `queue_id` varchar(50) DEFAULT NULL,
  `claim_id` varchar(50) DEFAULT NULL,
  `prescriber_user_id` varchar(50) DEFAULT NULL,
  `prescriber_name` varchar(180) DEFAULT NULL,
  `prescriber_body` varchar(10) DEFAULT NULL,
  `prescriber_registry_id` varchar(60) DEFAULT NULL,
  `prescriber_token` varchar(60) DEFAULT NULL,
  `prescriber_verified_at` datetime DEFAULT NULL,
  `finalized_at` datetime DEFAULT NULL,
  `final_auth_method` varchar(20) DEFAULT NULL,
  `final_auth_token` varchar(60) DEFAULT NULL,
  `final_auth_at` datetime DEFAULT NULL,
  `transmitted_at` datetime DEFAULT NULL,
  `cancelled_at` datetime DEFAULT NULL,
  `environment` varchar(20) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `branch_id` bigint(20) unsigned DEFAULT NULL,
  `visit_type` varchar(20) NOT NULL DEFAULT 'outpatient',
  `intervention_codes` varchar(255) DEFAULT NULL,
  `visit_consent_at` datetime DEFAULT NULL,
  `practitioner_registry_id` varchar(60) DEFAULT NULL,
  `practitioner_name` varchar(180) DEFAULT NULL,
  `practitioner_regulator` varchar(20) DEFAULT NULL,
  `practitioner_found` tinyint(1) DEFAULT NULL,
  `invoice_number` varchar(50) DEFAULT NULL,
  `discharge_reason` varchar(30) DEFAULT NULL,
  `discharge_detail` varchar(255) DEFAULT NULL,
  `closed_at` datetime DEFAULT NULL,
  `discharge_consent_at` datetime DEFAULT NULL,
  `submitted_at` datetime DEFAULT NULL,
  `mw_version` int(11) NOT NULL DEFAULT 0,
  `mw_synced_at` datetime DEFAULT NULL,
  `mw_sync_error` text DEFAULT NULL,
  `mw_warnings_json` longtext DEFAULT NULL,
  `mw_eligibility_status` varchar(40) DEFAULT NULL,
  `scheme_preauth` varchar(60) DEFAULT NULL,
  `mw_eligibility_reason` varchar(500) DEFAULT NULL,
  `mw_eligibility_at` datetime DEFAULT NULL,
  `mw_shared_status` varchar(40) DEFAULT NULL,
  `mw_shared_reason` varchar(500) DEFAULT NULL,
  `mw_shared_at` datetime DEFAULT NULL,
  `claim_session_json` longtext DEFAULT NULL,
  `correcting` tinyint(1) NOT NULL DEFAULT 0,
  `service_type` varchar(20) DEFAULT NULL,
  `reference_number` varchar(60) DEFAULT NULL,
  `visit_note` text DEFAULT NULL,
  `dx_dismissed` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_sha_visit_number` (`visit_number`),
  KEY `idx_sha_visit_patient` (`patient_id`),
  KEY `idx_sha_visit_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `store_requisition_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `store_requisition_items` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `requisition_id` varchar(50) NOT NULL,
  `item_code` varchar(80) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `qty_requested` decimal(12,2) DEFAULT NULL,
  `qty_approved` decimal(12,2) DEFAULT NULL,
  `unit` varchar(50) DEFAULT NULL,
  `branch_id` bigint(20) unsigned DEFAULT 1,
  `inventory_id` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `requisition_id` (`requisition_id`),
  KEY `idx_store_requisition_items_branch` (`branch_id`),
  KEY `idx_sri_inventory_id` (`inventory_id`),
  CONSTRAINT `fk_sri_inventory` FOREIGN KEY (`inventory_id`) REFERENCES `inventory` (`id`) ON DELETE SET NULL,
  CONSTRAINT `store_requisition_items_ibfk_1` FOREIGN KEY (`requisition_id`) REFERENCES `store_requisitions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `store_requisitions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `store_requisitions` (
  `id` varchar(50) NOT NULL,
  `requisition_number` varchar(100) DEFAULT NULL,
  `department` varchar(120) DEFAULT NULL,
  `requested_by` varchar(180) DEFAULT NULL,
  `request_date` date DEFAULT NULL,
  `urgency` varchar(30) DEFAULT NULL,
  `status` varchar(40) DEFAULT NULL,
  `issued_by` varchar(180) DEFAULT NULL,
  `issue_date` date DEFAULT NULL,
  `branch_id` bigint(20) unsigned DEFAULT 1,
  `source_store_id` varchar(50) DEFAULT NULL,
  `destination_store_id` varchar(50) DEFAULT NULL,
  `approved_by` varchar(180) DEFAULT NULL,
  `approval_date` datetime DEFAULT NULL,
  `received_by` varchar(180) DEFAULT NULL,
  `received_date` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_store_requisitions_branch` (`branch_id`),
  KEY `idx_requisition_stores` (`source_store_id`,`destination_store_id`),
  CONSTRAINT `fk_store_req_branch` FOREIGN KEY (`branch_id`) REFERENCES `hospital_branches` (`id`) ON DELETE NO ACTION,
  CONSTRAINT `fk_store_requisitions_branch` FOREIGN KEY (`branch_id`) REFERENCES `hospital_branches` (`id`) ON DELETE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `store_stock_movements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `store_stock_movements` (
  `id` varchar(50) NOT NULL,
  `store_id` varchar(50) NOT NULL,
  `inventory_id` varchar(50) NOT NULL,
  `movement_type` varchar(40) NOT NULL,
  `quantity_in` decimal(14,2) DEFAULT 0.00,
  `quantity_out` decimal(14,2) DEFAULT 0.00,
  `balance_after` decimal(14,2) DEFAULT 0.00,
  `unit_cost` decimal(14,2) DEFAULT 0.00,
  `reference_type` varchar(60) DEFAULT NULL,
  `reference_id` varchar(80) DEFAULT NULL,
  `batch_number` varchar(100) DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `performed_by` varchar(180) DEFAULT NULL,
  `movement_date` datetime DEFAULT current_timestamp(),
  `branch_id` bigint(20) unsigned DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `idx_ssm_store_date` (`store_id`,`movement_date`),
  KEY `idx_ssm_inventory_date` (`inventory_id`,`movement_date`),
  KEY `idx_ssm_type` (`movement_type`),
  CONSTRAINT `fk_ssm_inventory` FOREIGN KEY (`inventory_id`) REFERENCES `inventory` (`id`),
  CONSTRAINT `fk_ssm_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `store_transfer_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `store_transfer_items` (
  `id` varchar(50) NOT NULL,
  `transfer_id` varchar(50) NOT NULL,
  `inventory_id` varchar(50) NOT NULL,
  `quantity` decimal(14,2) NOT NULL,
  `unit_cost` decimal(14,2) DEFAULT 0.00,
  `batch_number` varchar(100) DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_sti_transfer` (`transfer_id`),
  KEY `idx_sti_inventory` (`inventory_id`),
  CONSTRAINT `fk_sti_inventory` FOREIGN KEY (`inventory_id`) REFERENCES `inventory` (`id`),
  CONSTRAINT `fk_sti_transfer` FOREIGN KEY (`transfer_id`) REFERENCES `store_transfers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `store_transfers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `store_transfers` (
  `id` varchar(50) NOT NULL,
  `transfer_number` varchar(80) NOT NULL,
  `source_store_id` varchar(50) NOT NULL,
  `destination_store_id` varchar(50) NOT NULL,
  `transfer_date` datetime DEFAULT current_timestamp(),
  `status` varchar(30) DEFAULT 'Completed',
  `requested_by` varchar(180) DEFAULT NULL,
  `approved_by` varchar(180) DEFAULT NULL,
  `received_by` varchar(180) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `branch_id` bigint(20) unsigned DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `transfer_number` (`transfer_number`),
  KEY `idx_st_source` (`source_store_id`),
  KEY `idx_st_destination` (`destination_store_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `stores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `stores` (
  `id` varchar(50) NOT NULL,
  `code` varchar(50) NOT NULL,
  `name` varchar(180) NOT NULL,
  `store_type` varchar(80) DEFAULT 'Pharmacy',
  `location` varchar(180) DEFAULT NULL,
  `manager` varchar(180) DEFAULT NULL,
  `status` varchar(30) DEFAULT 'Active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `branch_id` bigint(20) unsigned DEFAULT 1,
  `parent_store_id` varchar(50) DEFAULT NULL,
  `is_main_store` tinyint(1) DEFAULT 0,
  `can_issue` tinyint(1) DEFAULT 1,
  `can_receive` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `idx_stores_branch` (`branch_id`),
  KEY `idx_stores_parent` (`parent_store_id`),
  CONSTRAINT `fk_stores_branch` FOREIGN KEY (`branch_id`) REFERENCES `hospital_branches` (`id`) ON DELETE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `system_sequences`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `system_sequences` (
  `sequence_key` varchar(50) NOT NULL,
  `next_value` bigint(20) NOT NULL DEFAULT 1001,
  PRIMARY KEY (`sequence_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `tariff_prices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `tariff_prices` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `department` varchar(120) DEFAULT NULL,
  `test_name` varchar(180) DEFAULT NULL,
  `code` varchar(80) DEFAULT NULL,
  `price` decimal(12,2) DEFAULT NULL,
  `sha_price` decimal(12,2) DEFAULT NULL,
  `corporate_price` decimal(12,2) DEFAULT NULL,
  `is_saved` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `theatre_bookings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `theatre_bookings` (
  `id` varchar(50) NOT NULL,
  `booking_number` varchar(80) DEFAULT NULL,
  `patient_id` varchar(50) NOT NULL,
  `patient_name` varchar(180) DEFAULT NULL,
  `age` int(11) DEFAULT NULL,
  `gender` varchar(20) DEFAULT NULL,
  `procedure_name` varchar(255) DEFAULT NULL,
  `procedure_code` varchar(100) DEFAULT NULL,
  `surgery_type` varchar(50) DEFAULT NULL,
  `theatre_room` varchar(180) DEFAULT NULL,
  `scheduled_date` date DEFAULT NULL,
  `scheduled_time` time DEFAULT NULL,
  `lead_surgeon` varchar(180) DEFAULT NULL,
  `assistant_surgeon` varchar(180) DEFAULT NULL,
  `anesthesiologist` varchar(180) DEFAULT NULL,
  `scrub_nurse` varchar(180) DEFAULT NULL,
  `anesthesia_type` varchar(80) DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  `pre_op_checklist_complete` tinyint(1) DEFAULT NULL,
  `blood_crossmatched_units` int(11) DEFAULT NULL,
  `sha_preauth_number` varchar(120) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `setup_service_id` varchar(50) DEFAULT NULL,
  `branch_id` bigint(20) unsigned DEFAULT 1,
  `visit_id` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `patient_id` (`patient_id`),
  KEY `idx_theatre_setup_service` (`setup_service_id`),
  KEY `idx_theatre_bookings_branch` (`branch_id`),
  KEY `idx_theatre_visit` (`visit_id`),
  KEY `idx_theatre_bookings_visit` (`visit_id`),
  CONSTRAINT `fk_theatre_bookings_branch` FOREIGN KEY (`branch_id`) REFERENCES `hospital_branches` (`id`) ON DELETE NO ACTION,
  CONSTRAINT `fk_theatre_bookings_visit` FOREIGN KEY (`visit_id`) REFERENCES `patient_visits` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_theatre_branch` FOREIGN KEY (`branch_id`) REFERENCES `hospital_branches` (`id`) ON DELETE NO ACTION,
  CONSTRAINT `fk_theatre_setup_service` FOREIGN KEY (`setup_service_id`) REFERENCES `setup_cancer_services` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_theatre_visit` FOREIGN KEY (`visit_id`) REFERENCES `patient_visits` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `theatre_case_records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `theatre_case_records` (
  `id` varchar(80) NOT NULL,
  `booking_id` varchar(80) NOT NULL,
  `patient_id` varchar(50) DEFAULT NULL,
  `stage` varchar(40) DEFAULT NULL,
  `consent_signed` tinyint(1) NOT NULL DEFAULT 0,
  `data_json` longtext DEFAULT NULL,
  `updated_by` varchar(180) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_tcr_booking` (`booking_id`),
  KEY `idx_tcr_patient` (`patient_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `transfusion_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `transfusion_requests` (
  `id` varchar(50) NOT NULL,
  `request_number` varchar(100) DEFAULT NULL,
  `patient_id` varchar(50) NOT NULL,
  `patient_name` varchar(180) DEFAULT NULL,
  `ward_or_clinic` varchar(150) DEFAULT NULL,
  `blood_group_required` varchar(20) DEFAULT NULL,
  `component` varchar(100) DEFAULT NULL,
  `units_requested` int(11) DEFAULT NULL,
  `urgency` varchar(50) DEFAULT NULL,
  `hemoglobin_level` decimal(6,2) DEFAULT NULL,
  `clinical_indication` text DEFAULT NULL,
  `crossmatch_status` varchar(50) DEFAULT NULL,
  `issuing_doctor` varchar(180) DEFAULT NULL,
  `request_date` date DEFAULT NULL,
  `branch_id` bigint(20) unsigned DEFAULT 1,
  `visit_id` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `patient_id` (`patient_id`),
  KEY `idx_transfusion_requests_branch` (`branch_id`),
  KEY `idx_transfusion_visit` (`visit_id`),
  KEY `idx_transfusion_requests_visit` (`visit_id`),
  CONSTRAINT `fk_transfusion_branch` FOREIGN KEY (`branch_id`) REFERENCES `hospital_branches` (`id`) ON DELETE NO ACTION,
  CONSTRAINT `fk_transfusion_requests_branch` FOREIGN KEY (`branch_id`) REFERENCES `hospital_branches` (`id`) ON DELETE NO ACTION,
  CONSTRAINT `fk_transfusion_requests_visit` FOREIGN KEY (`visit_id`) REFERENCES `patient_visits` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_transfusion_visit` FOREIGN KEY (`visit_id`) REFERENCES `patient_visits` (`id`) ON DELETE SET NULL,
  CONSTRAINT `transfusion_requests_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `tv_display_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `tv_display_settings` (
  `id` int(11) NOT NULL,
  `settings_json` text NOT NULL,
  `updated_at` datetime DEFAULT NULL,
  `updated_by` varchar(120) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `tv_screens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `tv_screens` (
  `tv_id` varchar(40) NOT NULL,
  `last_seen` datetime NOT NULL,
  `sound` varchar(20) NOT NULL DEFAULT '',
  `screen` varchar(20) NOT NULL DEFAULT '',
  `test_played` int(11) NOT NULL DEFAULT 0,
  `agent` varchar(190) NOT NULL DEFAULT '',
  PRIMARY KEY (`tv_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` varchar(50) NOT NULL,
  `full_name` varchar(180) NOT NULL,
  `username` varchar(100) DEFAULT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` varchar(100) NOT NULL,
  `email` varchar(180) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `department` varchar(150) DEFAULT NULL,
  `status` varchar(30) DEFAULT 'Active',
  `license_number` varchar(100) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `last_login` datetime DEFAULT NULL,
  `must_change_password` tinyint(1) NOT NULL DEFAULT 0,
  `password_changed_at` datetime DEFAULT NULL,
  `failed_logins` int(11) NOT NULL DEFAULT 0,
  `locked_until` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `vitals_triage`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `vitals_triage` (
  `id` varchar(50) NOT NULL,
  `patient_id` varchar(50) NOT NULL,
  `systolic` decimal(6,2) DEFAULT NULL,
  `diastolic` decimal(6,2) DEFAULT NULL,
  `pulse` decimal(6,2) DEFAULT NULL,
  `temperature` decimal(6,2) DEFAULT NULL,
  `respiratory_rate` decimal(6,2) DEFAULT NULL,
  `spo2` decimal(6,2) DEFAULT NULL,
  `weight_kg` decimal(8,2) DEFAULT NULL,
  `height_cm` decimal(8,2) DEFAULT NULL,
  `bmi` decimal(8,2) DEFAULT NULL,
  `bmi_category` varchar(30) DEFAULT NULL,
  `triage_category` varchar(30) DEFAULT NULL,
  `nurse_notes` text DEFAULT NULL,
  `recorded_by` varchar(180) DEFAULT NULL,
  `recorded_at` datetime DEFAULT NULL,
  `branch_id` bigint(20) unsigned DEFAULT 1,
  `visit_id` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_vitals_patient` (`patient_id`),
  KEY `idx_vitals_triage_branch` (`branch_id`),
  KEY `idx_vitals_visit` (`visit_id`),
  KEY `idx_vitals_triage_visit` (`visit_id`),
  CONSTRAINT `fk_vitals_branch` FOREIGN KEY (`branch_id`) REFERENCES `hospital_branches` (`id`) ON DELETE NO ACTION,
  CONSTRAINT `fk_vitals_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_vitals_triage_branch` FOREIGN KEY (`branch_id`) REFERENCES `hospital_branches` (`id`) ON DELETE NO ACTION,
  CONSTRAINT `fk_vitals_triage_visit` FOREIGN KEY (`visit_id`) REFERENCES `patient_visits` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_vitals_visit` FOREIGN KEY (`visit_id`) REFERENCES `patient_visits` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `vw_patient_subcategory_schemes`;
/*!50001 DROP VIEW IF EXISTS `vw_patient_subcategory_schemes`*/;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8mb4;
/*!50001 CREATE VIEW `vw_patient_subcategory_schemes` AS SELECT
 1 AS `scheme_id`,
  1 AS `sub_category_id`,
  1 AS `category_code`,
  1 AS `category_name`,
  1 AS `sub_category_code`,
  1 AS `sub_category_name`,
  1 AS `provider_name`,
  1 AS `scheme_code`,
  1 AS `scheme_name`,
  1 AS `scheme_type`,
  1 AS `copay_rule`,
  1 AS `copay_amount`,
  1 AS `credit_limit`,
  1 AS `preauth_required`,
  1 AS `contact_person`,
  1 AS `contact_phone`,
  1 AS `status` */;
SET character_set_client = @saved_cs_client;
DROP TABLE IF EXISTS `ward_round_notes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `ward_round_notes` (
  `id` varchar(50) NOT NULL,
  `admission_id` varchar(50) NOT NULL,
  `patient_id` varchar(50) NOT NULL,
  `doctor_name` varchar(180) DEFAULT NULL,
  `timestamp_value` datetime DEFAULT NULL,
  `subjective` text DEFAULT NULL,
  `objective` text DEFAULT NULL,
  `assessment` varchar(50) DEFAULT NULL,
  `plan` text DEFAULT NULL,
  `branch_id` bigint(20) unsigned DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `admission_id` (`admission_id`),
  KEY `patient_id` (`patient_id`),
  KEY `idx_ward_round_notes_branch` (`branch_id`),
  CONSTRAINT `ward_round_notes_ibfk_1` FOREIGN KEY (`admission_id`) REFERENCES `admissions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ward_round_notes_ibfk_2` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `wards`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `wards` (
  `id` varchar(50) NOT NULL,
  `name` varchar(120) DEFAULT NULL,
  `category` varchar(100) DEFAULT NULL,
  `total_beds` int(11) DEFAULT 0,
  `occupied_beds` int(11) DEFAULT 0,
  `daily_rate` decimal(12,2) DEFAULT 0.00,
  `nurse_in_charge` varchar(180) DEFAULT NULL,
  `floor` varchar(50) DEFAULT NULL,
  `sub_category_charge_components_json` longtext DEFAULT NULL,
  `branch_id` bigint(20) unsigned DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `idx_wards_branch` (`branch_id`),
  CONSTRAINT `fk_wards_branch` FOREIGN KEY (`branch_id`) REFERENCES `hospital_branches` (`id`) ON DELETE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `wisecare_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `wisecare_migrations` (
  `name` varchar(190) NOT NULL,
  `done_at` datetime NOT NULL,
  PRIMARY KEY (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `wisecare_schema_version`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `wisecare_schema_version` (
  `id` tinyint(3) unsigned NOT NULL,
  `version` varchar(40) NOT NULL,
  `applied_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `workflow_events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `workflow_events` (
  `id` varchar(100) NOT NULL,
  `patient_id` varchar(50) DEFAULT NULL,
  `source_entity` varchar(80) DEFAULT NULL,
  `source_id` varchar(100) DEFAULT NULL,
  `workflow_code` varchar(80) DEFAULT NULL,
  `from_station` varchar(80) DEFAULT NULL,
  `to_station` varchar(80) DEFAULT NULL,
  `event_type` varchar(80) NOT NULL,
  `status` varchar(40) DEFAULT 'Completed',
  `invoice_id` varchar(50) DEFAULT NULL,
  `performed_by` varchar(180) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `branch_id` bigint(20) unsigned DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `idx_we_patient` (`patient_id`),
  KEY `idx_we_source` (`source_entity`,`source_id`),
  KEY `idx_we_invoice` (`invoice_id`),
  KEY `idx_workflow_events_branch` (`branch_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50001 DROP VIEW IF EXISTS `vw_patient_subcategory_schemes`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `vw_patient_subcategory_schemes` AS select `ps`.`id` AS `scheme_id`,`ps`.`sub_category_id` AS `sub_category_id`,`sc`.`category_code` AS `category_code`,`sc`.`category_name` AS `category_name`,`sc`.`sub_category_code` AS `sub_category_code`,`sc`.`name` AS `sub_category_name`,`ps`.`provider_name` AS `provider_name`,`ps`.`scheme_code` AS `scheme_code`,`ps`.`scheme_name` AS `scheme_name`,`ps`.`scheme_type` AS `scheme_type`,`ps`.`copay_rule` AS `copay_rule`,`ps`.`copay_amount` AS `copay_amount`,`ps`.`credit_limit` AS `credit_limit`,`ps`.`preauth_required` AS `preauth_required`,`ps`.`contact_person` AS `contact_person`,`ps`.`contact_phone` AS `contact_phone`,`ps`.`status` AS `status` from (`setup_patient_schemes` `ps` join `setup_patient_subcategories` `sc` on(`sc`.`id` = `ps`.`sub_category_id`)) where `ps`.`status` = 'Active' and coalesce(`sc`.`status`,'Active') = 'Active' */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

/*M!999999\- enable the sandbox mode */ 
