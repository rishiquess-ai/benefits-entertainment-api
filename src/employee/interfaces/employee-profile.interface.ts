// Decrypted employee profile returned by a tenant's profile API.
export interface EmployeeProfile {
  first_name: string;
  last_name: string;
  identifier: string;
  customer_ref_id: number;
  customer_name: string;
  emp_id: string;
  employee_unique_id: string;
  contact_no: string;
  email_id: string;
  active_flag: boolean;
}
