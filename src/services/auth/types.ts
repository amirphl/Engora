export interface AuthErrorDetail {
  code: string;
  details?: any;
}

export interface AuthApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: AuthErrorDetail;
}

export interface AuthCustomerDTO {
  id: number;
  uuid: string;
  email: string;
  representative_first_name: string;
  representative_last_name: string;
  representative_mobile: string;
  account_type: string;
  company_name?: string;
  is_active?: boolean;
  is_email_verified?: boolean;
  is_mobile_verified?: boolean;
  created_at: string;
  referrer_agency_id?: number;
}

export interface CustomerSessionDTO {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
  token_type?: string;
  created_at?: string;
}

export interface LoginResponse {
  Customer?: AuthCustomerDTO;
  Session?: CustomerSessionDTO;
  customer?: AuthCustomerDTO;
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
}
