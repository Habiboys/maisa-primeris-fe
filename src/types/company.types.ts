import type { CompanyBranding } from './auth.types';

export interface ProvisionedAdminCredential {
  id: string;
  name: string;
  email: string;
  password: string;
  role: string;
}

export interface CompanyProvisioningInfo {
  default_admin?: ProvisionedAdminCredential;
}

export interface Company {
  id: string;
  name: string;
  code: string;
  domain?: string | null;
  is_active: boolean;
  subscription_plan?: string;
  billing_cycle?: 'monthly' | 'yearly';
  subscription_status?: 'active' | 'trial' | 'grace' | 'inactive' | 'suspended' | 'cancelled';
  subscription_started_at?: string | null;
  subscription_ended_at?: string | null;
  is_suspended?: boolean;
  created_at: string;
  updated_at: string;
  settings?: CompanyBranding | null;
  provisioning?: CompanyProvisioningInfo;
}

export interface CompanyPayload {
  name: string;
  code?: string;
  domain?: string | null;
  is_active?: boolean;
  subscription_plan?: string;
  billing_cycle?: 'monthly' | 'yearly';
  subscription_status?: 'active' | 'trial' | 'grace' | 'inactive' | 'suspended' | 'cancelled';
  subscription_started_at?: string | null;
  subscription_ended_at?: string | null;
  is_suspended?: boolean;
}

export interface CompanySettingsPayload {
  app_name?: string;
  logo_url?: string | null;
  favicon_url?: string | null;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
}
