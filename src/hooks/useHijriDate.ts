import { useMemo } from 'react';

// Hijri month names in Arabic and English
const HIJRI_MONTHS_EN = [
  'Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani',
  'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', 'Shaban',
  'Ramadan', 'Shawwal', 'Dhul Qadah', 'Dhul Hijjah'
];

const HIJRI_MONTHS_AR = [
  'محرم', 'صفر', 'ربيع الأول', 'ربيع الثاني',
  'جمادى الأولى', 'جمادى الآخرة', 'رجب', 'شعبان',
  'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'
];

interface HijriDate {
  day: number;
  month: number;
  year: number;
  monthNameEn: string;
  monthNameAr: string;
  formatted: string;
  formattedAr: string;
}

// Simple Gregorian to Hijri conversion algorithm
function gregorianToHijri(date: Date): { day: number; month: number; year: number } {
  const gregorianDayNumber = Math.floor(
    (date.getTime() - new Date(1970, 0, 1).getTime()) / 86400000
  );
  
  // Julian day number
  const jd = gregorianDayNumber + 2440588;
  
  // Hijri calculation (approximation)
  const l = jd - 1948440 + 10632;
  const n = Math.floor((l - 1) / 10631);
  const l2 = l - 10631 * n + 354;
  const j = Math.floor((10985 - l2) / 5316) * Math.floor((50 * l2) / 17719) +
            Math.floor(l2 / 5670) * Math.floor((43 * l2) / 15238);
  const l3 = l2 - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) -
             Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
  const month = Math.floor((24 * l3) / 709);
  const day = l3 - Math.floor((709 * month) / 24);
  const year = 30 * n + j - 30;

  return { day, month, year };
}

export function useHijriDate(date: Date = new Date()): HijriDate {
  return useMemo(() => {
    const hijri = gregorianToHijri(date);
    const monthIndex = hijri.month - 1;
    
    return {
      day: hijri.day,
      month: hijri.month,
      year: hijri.year,
      monthNameEn: HIJRI_MONTHS_EN[monthIndex] || '',
      monthNameAr: HIJRI_MONTHS_AR[monthIndex] || '',
      formatted: `${hijri.day} ${HIJRI_MONTHS_EN[monthIndex]} ${hijri.year} H`,
      formattedAr: `${hijri.day} ${HIJRI_MONTHS_AR[monthIndex]} ${hijri.year} هـ`,
    };
  }, [date]);
}

export function formatHijriDate(date: Date, locale: 'en' | 'ar' = 'en'): string {
  const hijri = gregorianToHijri(date);
  const monthIndex = hijri.month - 1;
  
  if (locale === 'ar') {
    return `${hijri.day} ${HIJRI_MONTHS_AR[monthIndex]} ${hijri.year} هـ`;
  }
  return `${hijri.day} ${HIJRI_MONTHS_EN[monthIndex]} ${hijri.year} H`;
}

export { HIJRI_MONTHS_EN, HIJRI_MONTHS_AR };
