// Company Branding - Stores company logo for certificates

export interface CompanyBrandingSettings {
  logoBase64?: string;
  logoMimeType?: string;
  companyName?: string;
  lastUpdated?: string;
}

const BRANDING_STORAGE_KEY = 'company-branding-settings';

export function getCompanyBranding(): CompanyBrandingSettings {
  try {
    const stored = localStorage.getItem(BRANDING_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

export function saveCompanyBranding(settings: CompanyBrandingSettings): void {
  const updated = {
    ...settings,
    lastUpdated: new Date().toISOString(),
  };
  localStorage.setItem(BRANDING_STORAGE_KEY, JSON.stringify(updated));
}

export function clearCompanyLogo(): void {
  const current = getCompanyBranding();
  saveCompanyBranding({
    ...current,
    logoBase64: undefined,
    logoMimeType: undefined,
  });
}

export function setCompanyLogo(base64: string, mimeType: string): void {
  const current = getCompanyBranding();
  saveCompanyBranding({
    ...current,
    logoBase64: base64,
    logoMimeType: mimeType,
  });
}

export function getCompanyLogo(): { base64: string; mimeType: string } | null {
  const branding = getCompanyBranding();
  if (branding.logoBase64 && branding.logoMimeType) {
    return {
      base64: branding.logoBase64,
      mimeType: branding.logoMimeType,
    };
  }
  return null;
}

export async function processLogoFile(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      reject(new Error('Invalid file type. Please use PNG, JPG, or SVG.'));
      return;
    }
    
    // Validate file size (500KB max)
    if (file.size > 500 * 1024) {
      reject(new Error('File too large. Maximum size is 500KB.'));
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      // Remove data URL prefix to get pure base64
      const base64Data = base64.split(',')[1];
      resolve({
        base64: base64Data,
        mimeType: file.type,
      });
    };
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsDataURL(file);
  });
}

export function getLogoDataUrl(): string | null {
  const logo = getCompanyLogo();
  if (logo) {
    return `data:${logo.mimeType};base64,${logo.base64}`;
  }
  return null;
}
