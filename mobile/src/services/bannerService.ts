import { API_URL } from '../config/api';

export interface MobileBanner {
  _id: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  isActive?: boolean;
  displayOrder?: number;
  startDate?: string;
  endDate?: string;
  ctaText?: string;
  ctaAction?: 'service' | 'parts' | 'external';
  targetId?: string;
  targetUrl?: string;
}

export const fetchActiveBanners = async (): Promise<MobileBanner[]> => {
  try {
    const response = await fetch(`${API_URL}/banners?activeOnly=true`);
    if (!response.ok) {
      return [];
    }

    const payload = await response.json().catch(() => ({}));
    return payload.data ?? [];
  } catch {
    return [];
  }
};
