export interface StudentCalling {
  id: string;
  student_id: string;
  user_id: string;
  call_status?: string;
  call_notes?: string;
  called_at?: string;
  is_active: boolean;
  created_on: string;
  created_by: string;
  updated_on: string;
  updated_by: string;
}

export interface StudentIncentive {
  id: string;
  student_id: string;
  user_id: string;
  incentive_amount: number;
  is_incentive_done: boolean;
  created_on: string;
  created_by: string;
  updated_on: string;
  updated_by: string;
}
