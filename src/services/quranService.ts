export interface Surah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
}

export interface Ayah {
  number: number;
  text: string;
  numberInSurah: number;
  juz: number;
  manzil: number;
  page: number;
  ruku: number;
  hizbQuarter: number;
  sajda: boolean | object;
}

export interface SurahDetail extends Surah {
  ayahs: Ayah[];
}

export interface SearchMatch {
  number: number;
  text: string;
  numberInSurah: number;
  surah: Surah;
}

export const fetchSurahs = async (): Promise<Surah[]> => {
  const response = await fetch('https://api.alquran.cloud/v1/surah');
  if (!response.ok) {
    throw new Error('Failed to fetch surahs');
  }
  const data = await response.json();
  return data.data;
};

export const fetchSurah = async (id: number): Promise<SurahDetail> => {
  const response = await fetch(`https://api.alquran.cloud/v1/surah/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch surah');
  }
  const data = await response.json();
  return data.data;
};

export const searchQuran = async (query: string): Promise<SearchMatch[]> => {
  const response = await fetch(`https://api.alquran.cloud/v1/search/${encodeURIComponent(query)}/all/quran-simple-clean`);
  if (!response.ok) {
    throw new Error('Failed to search');
  }
  const data = await response.json();
  return data.data.matches;
};

export const stripTashkeel = (text: string): string => {
  return text.replace(/[\u0617-\u061A\u064B-\u0652\u06D6-\u06DC\u06DF-\u06E8\u06EA-\u06ED]/g, '');
};

export const toArabicNumber = (num: number): string => {
  const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return num
    .toString()
    .split('')
    .map((c) => arabicNumbers[parseInt(c)])
    .join('');
};
