import React, { useState, useEffect, useRef } from "react";
import {
  ArrowRight,
  BookOpen,
  Loader2,
  Search,
  Moon,
  Sun,
  Play,
  Pause,
  Volume2,
} from "lucide-react";
import {
  fetchSurahs,
  fetchSurah,
  searchQuran,
  Surah,
  SurahDetail,
  SearchMatch,
  toArabicNumber,
  stripTashkeel,
} from "./services/quranService";

const RECITERS = [
  { id: "Minshawy_Murattal_128kbps", name: "محمود صديق المنشاوي" },
  { id: "Abdul_Basit_Murattal_192kbps", name: "عبد الباسط عبد الصمد" },
  { id: "Fares_Abbad_64kbps", name: "فارس عباد" },
];

export default function App() {
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [currentSurah, setCurrentSurah] = useState<SurahDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Dark Mode
  const [darkMode, setDarkMode] = useState(false);

  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchMatch[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Audio
  const [reciter, setReciter] = useState(RECITERS[0].id);
  const [playingAyah, setPlayingAyah] = useState<number | null>(null);
  const [playingSurah, setPlayingSurah] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  useEffect(() => {
    const loadSurahs = async () => {
      try {
        setLoading(true);
        const data = await fetchSurahs();
        setSurahs(data);
      } catch (err) {
        setError("تعذر تحميل قائمة السور. يرجى المحاولة لاحقاً.");
      } finally {
        setLoading(false);
      }
    };
    loadSurahs();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim().length > 2) {
        setIsSearching(true);
        try {
          const results = await searchQuran(searchQuery.trim());
          setSearchResults(results);
        } catch (err) {
          console.error("Search error", err);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  useEffect(() => {
    if (
      playingAyah &&
      audioRef.current &&
      !audioRef.current.paused &&
      currentSurah
    ) {
      const ayah = currentSurah.ayahs.find((a) => a.number === playingAyah);
      if (ayah) {
        const surahStr = currentSurah.number.toString().padStart(3, "0");
        const ayahStr = ayah.numberInSurah.toString().padStart(3, "0");
        audioRef.current.src = `https://everyayah.com/data/${reciter}/${surahStr}${ayahStr}.mp3`;
        audioRef.current.play().catch(console.error);
      }
    }
  }, [reciter, currentSurah, playingAyah]);

  const handleSurahClick = async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      setSearchQuery("");
      const data = await fetchSurah(id);
      setCurrentSurah(data);
      window.scrollTo(0, 0);
    } catch (err) {
      setError("تعذر تحميل السورة. يرجى المحاولة لاحقاً.");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setCurrentSurah(null);
    setSearchQuery("");
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setPlayingAyah(null);
    setPlayingSurah(false);
    window.scrollTo(0, 0);
  };

  const playAudio = (ayahNumber: number, ayahNumberInSurah: number) => {
    if (audioRef.current && currentSurah) {
      const surahStr = currentSurah.number.toString().padStart(3, "0");
      const ayahStr = ayahNumberInSurah.toString().padStart(3, "0");
      audioRef.current.src = `https://everyayah.com/data/${reciter}/${surahStr}${ayahStr}.mp3`;
      audioRef.current.play().catch(console.error);
      setPlayingAyah(ayahNumber);
    }
  };

  const handleAudioEnded = () => {
    if (playingSurah && currentSurah && playingAyah) {
      const currentIndex = currentSurah.ayahs.findIndex(
        (a) => a.number === playingAyah,
      );
      if (currentIndex !== -1 && currentIndex < currentSurah.ayahs.length - 1) {
        const nextAyah = currentSurah.ayahs[currentIndex + 1];
        playAudio(nextAyah.number, nextAyah.numberInSurah);
      } else {
        setPlayingSurah(false);
        setPlayingAyah(null);
      }
    } else {
      setPlayingAyah(null);
    }
  };

  const toggleSurahAudio = () => {
    if (playingSurah) {
      audioRef.current?.pause();
      setPlayingSurah(false);
      setPlayingAyah(null);
    } else if (currentSurah) {
      setPlayingSurah(true);
      playAudio(
        currentSurah.ayahs[0].number,
        currentSurah.ayahs[0].numberInSurah,
      );
    }
  };

  const toggleAyahAudio = (ayahNumber: number, ayahNumberInSurah: number) => {
    if (playingAyah === ayahNumber) {
      audioRef.current?.pause();
      setPlayingAyah(null);
      setPlayingSurah(false);
    } else {
      setPlayingSurah(false);
      playAudio(ayahNumber, ayahNumberInSurah);
    }
  };

  const filteredSurahs = surahs.filter((surah) => {
    if (!searchQuery) return true;
    const query = stripTashkeel(searchQuery);
    return (
      stripTashkeel(surah.name).includes(query) ||
      stripTashkeel(surah.englishName)
        .toLowerCase()
        .includes(query.toLowerCase())
    );
  });

  if (loading && !surahs.length) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fdfbf7] dark:bg-gray-900 transition-colors duration-300">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-600 mb-4" />
        <p className="text-gray-600 dark:text-gray-400 font-medium">
          جاري التحميل...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fdfbf7] dark:bg-gray-900 font-cairo text-gray-800 dark:text-gray-100 pb-12 transition-colors duration-300">
      <audio ref={audioRef} onEnded={handleAudioEnded} />

      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 shadow-sm transition-colors duration-300">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            {currentSurah ? (
              <button
                onClick={handleBack}
                className="flex items-center gap-2 text-emerald-700 dark:text-emerald-500 hover:text-emerald-800 dark:hover:text-emerald-400 transition-colors p-2 -ml-2 rounded-full hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
              >
                <ArrowRight className="w-5 h-5" />
                <span className="font-semibold">العودة للفهرس</span>
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <BookOpen className="w-6 h-6 text-emerald-600 dark:text-emerald-500" />
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  القرآن الكريم
                </h1>
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-300"
                aria-label="Toggle Dark Mode"
              >
                {darkMode ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {!currentSurah && (
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-3 pr-10 py-2 border border-gray-300 dark:border-gray-700 rounded-xl leading-5 bg-white dark:bg-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-colors duration-300"
                placeholder="ابحث عن سورة أو آية (بدون تشكيل)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                dir="rtl"
              />
            </div>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pt-6">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl mb-6 text-center border border-red-100 dark:border-red-900/30">
            {error}
          </div>
        )}

        {loading && surahs.length > 0 && (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          </div>
        )}

        {/* Search Results */}
        {!currentSurah && !loading && searchQuery.length > 2 && (
          <div className="mb-8">
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-800 pb-2">
              نتائج البحث في الآيات
            </h3>
            {isSearching ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
              </div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-4">
                {searchResults.map((match) => (
                  <div
                    key={match.number}
                    className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-bold text-emerald-600 dark:text-emerald-500">
                        {match.surah.name}
                      </span>
                      <button
                        onClick={() => handleSurahClick(match.surah.number)}
                        className="text-xs bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-full hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
                      >
                        الذهاب للسورة
                      </button>
                    </div>
                    <p
                      className="text-lg quran-text text-gray-900 dark:text-gray-100 text-right"
                      dir="rtl"
                    >
                      {match.text}
                      <span className="inline-flex items-center justify-center mx-2 text-emerald-600 dark:text-emerald-500 text-sm font-cairo">
                        ﴿{toArabicNumber(match.numberInSurah)}﴾
                      </span>
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                لا توجد نتائج مطابقة
              </p>
            )}
          </div>
        )}

        {/* Surahs List */}
        {!currentSurah && !loading && (
          <div>
            {searchQuery.length > 0 && (
              <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-800 pb-2">
                السور
              </h3>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredSurahs.map((surah) => (
                <button
                  key={surah.number}
                  onClick={() => handleSurahClick(surah.number)}
                  className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:border-emerald-200 dark:hover:border-emerald-700 hover:shadow-md transition-all text-right group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 flex items-center justify-center bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full font-semibold text-sm group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/50 transition-colors">
                      {surah.number}
                    </div>
                    <div>
                      <h2 className="font-bold text-lg text-gray-900 dark:text-white">
                        {surah.name}
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {surah.revelationType === "Meccan" ? "مكية" : "مدنية"} •{" "}
                        {surah.numberOfAyahs} آية
                      </p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {surah.englishName}
                    </p>
                  </div>
                </button>
              ))}
              {filteredSurahs.length === 0 && (
                <p className="col-span-full text-center text-gray-500 dark:text-gray-400 py-8">
                  لا توجد سور مطابقة للبحث
                </p>
              )}
            </div>
          </div>
        )}

        {/* Surah Detail */}
        {currentSurah && !loading && (
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 md:p-10 transition-colors duration-300">
            <div className="text-center mb-8 border-b border-gray-100 dark:border-gray-700 pb-8">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4 quran-text">
                {currentSurah.name}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {currentSurah.revelationType === "Meccan" ? "مكية" : "مدنية"} •
                آياتها {toArabicNumber(currentSurah.numberOfAyahs)}
              </p>

              {/* Audio Controls */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  <select
                    value={reciter}
                    onChange={(e) => setReciter(e.target.value)}
                    className="bg-transparent border-none text-sm font-medium text-gray-700 dark:text-gray-300 focus:ring-0 cursor-pointer outline-none"
                    dir="rtl"
                  >
                    {RECITERS.map((r) => (
                      <option
                        key={r.id}
                        value={r.id}
                        className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      >
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="h-4 w-px bg-gray-300 dark:bg-gray-600 hidden sm:block"></div>

                <button
                  onClick={toggleSurahAudio}
                  className={`flex items-center gap-2 px-6 py-2 rounded-full font-bold transition-all ${
                    playingSurah
                      ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-400"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg"
                  }`}
                >
                  {playingSurah ? (
                    <>
                      <Pause className="w-5 h-5 fill-current" />
                      <span>إيقاف القراءة</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 fill-current" />
                      <span>قراءة السورة</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Bismillah - Don't show for Surah At-Tawbah (9) */}
            {currentSurah.number !== 9 && currentSurah.number !== 1 && (
              <div className="text-center mb-10">
                <p className="text-2xl md:text-3xl quran-text text-gray-800 dark:text-gray-200">
                  بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                </p>
              </div>
            )}

            <div className="text-justify leading-loose" dir="rtl">
              {currentSurah.ayahs.map((ayah) => {
                // Remove Bismillah from the first Ayah of each Surah (except Al-Fatihah)
                let text = ayah.text;
                if (
                  ayah.numberInSurah === 1 &&
                  currentSurah.number !== 1 &&
                  currentSurah.number !== 9
                ) {
                  text = text.replace(
                    "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ ",
                    "",
                  );
                }

                const isPlaying = playingAyah === ayah.number;

                return (
                  <span
                    key={ayah.number}
                    className={`inline text-2xl md:text-3xl quran-text transition-colors duration-300 relative group cursor-pointer ${
                      isPlaying
                        ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg px-1"
                        : "text-gray-900 dark:text-gray-100 hover:text-emerald-700 dark:hover:text-emerald-300"
                    }`}
                    onClick={() =>
                      toggleAyahAudio(ayah.number, ayah.numberInSurah)
                    }
                    title="اضغط للاستماع للآية"
                  >
                    {text}
                    <span
                      className={`inline-flex items-center justify-center mx-2 text-xl font-cairo ${
                        isPlaying
                          ? "text-emerald-700 dark:text-emerald-300"
                          : "text-emerald-600 dark:text-emerald-500"
                      }`}
                    >
                      ﴿{toArabicNumber(ayah.numberInSurah)}﴾
                    </span>
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
