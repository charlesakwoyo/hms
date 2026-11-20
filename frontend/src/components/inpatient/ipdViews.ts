export type IpdView =
  | 'bookings'
  | 'admitted'
  | 'beds'
  | 'admission'
  | 'admission_notes'
  | 'doctor_notes'
  | 'vitals'
  | 'io'
  | 'maternity'
  | 'emar'
  | 'orders'
  | 'billing'
  | 'efile'
  | 'ward_rounds'
  | 'dialysis'
  | 'theatre'
  | 'discharge';

export interface IpdLink {
  id: IpdView;
  label: string;
  group?: 'emr';
  module?: 'dialysis' | 'theatre';
}

export const IPD_LINKS: IpdLink[] = [
  { id: 'bookings', label: 'Bookings & Status' },
  { id: 'admitted', label: 'Admitted Patients List' },
  { id: 'beds', label: 'Ward & Bed Status' },
  { id: 'admission', label: 'Admission Form' },
  { id: 'admission_notes', label: 'Admission Clinical Notes' },
  { id: 'doctor_notes', label: 'Doctor Notes & ICD-11', group: 'emr' },
  { id: 'vitals', label: 'Patient Vitals Log', group: 'emr' },
  { id: 'io', label: 'Intake & Output (I/O)', group: 'emr' },
  { id: 'maternity', label: 'Maternity & Partograph', group: 'emr' },
  { id: 'emar', label: 'Emr and Cardex' },
  { id: 'orders', label: 'Orders & Nursing' },
  { id: 'billing', label: 'Inpatient Billing' },
  { id: 'efile', label: 'E-Inpatient Medical File' },
  { id: 'ward_rounds', label: 'Ward Rounds' },
  { id: 'dialysis', label: 'Renal Dialysis' },
  { id: 'theatre', label: 'Theatre Booking' },
  { id: 'discharge', label: 'Discharge Request' },
];

export const ipdLabel = (v: IpdView) => IPD_LINKS.find((l) => l.id === v)?.label || 'Inpatient';
