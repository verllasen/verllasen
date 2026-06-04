import { useState, useEffect, useMemo } from 'react';
import { Search, BookOpen, ChevronDown, Loader2, CheckCircle2, Circle } from 'lucide-react';
import clsx from 'clsx';

interface RawQAItem {
  question: string;
  choices: string[];
  correctAnswers: string[];
}

interface QAItem extends RawQAItem {
  id: string;
}

export default function Home() {
  const [data, setData] = useState<QAItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/теория-вероятностей.json');
        if (!response.ok) {
          throw new Error('Не удалось загрузить данные. Убедитесь, что файл находится в папке public.');
        }
        const jsonData: RawQAItem[] = await response.json();
        // Add a unique ID to each item
        const dataWithIds = jsonData.map((item, index) => ({
          ...item,
          id: `q-${index}`
        }));
        setData(dataWithIds);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Произошла неизвестная ошибка');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    const query = searchQuery.toLowerCase();
    return data.filter(
      (item) =>
        item.question.toLowerCase().includes(query) ||
        item.choices.some(choice => choice.toLowerCase().includes(query)) ||
        item.correctAnswers.some(ans => ans.toLowerCase().includes(query))
    );
  }, [data, searchQuery]);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 sm:py-6">
          <div className="flex flex-col mb-6">
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
                <BookOpen className="w-6 h-6" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                Экзамен теория вероятности
              </h1>
            </div>
            <p className="text-sm text-slate-500 font-medium tracking-wide">
              created by verllasen
            </p>
          </div>

          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            </div>
            <input
              type="text"
              className="block w-full pl-11 pr-4 py-3 sm:text-lg bg-white border border-slate-300 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow shadow-sm hover:shadow-md focus:shadow-md"
              placeholder="Поиск по вопросам и ответам..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <Loader2 className="w-10 h-10 animate-spin mb-4 text-indigo-500" />
            <p className="text-lg">Загрузка вопросов...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-700 p-6 rounded-2xl border border-red-100 text-center">
            <p className="font-medium text-lg mb-2">Ой, ошибка!</p>
            <p>{error}</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <Search className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <p className="text-xl font-medium text-slate-600">Ничего не найдено</p>
            <p className="mt-2">Попробуйте изменить поисковый запрос</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredData.map((item) => {
              const isExpanded = expandedId === item.id;
              
              return (
                <div
                  key={item.id}
                  className={clsx(
                    "bg-white rounded-2xl border transition-all duration-200 overflow-hidden",
                    isExpanded 
                      ? "border-indigo-200 shadow-md ring-1 ring-indigo-50" 
                      : "border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300"
                  )}
                >
                  <button
                    onClick={() => toggleExpand(item.id)}
                    className="w-full text-left px-5 py-4 sm:px-6 sm:py-5 flex items-start justify-between gap-4 focus:outline-none focus-visible:bg-slate-50"
                  >
                    <h3 className={clsx(
                      "font-semibold text-lg sm:text-xl leading-snug transition-colors",
                      isExpanded ? "text-indigo-900" : "text-slate-800"
                    )}>
                      {item.question}
                    </h3>
                    <div className={clsx(
                      "flex-shrink-0 mt-1 p-1 rounded-full transition-transform duration-300",
                      isExpanded ? "bg-indigo-100 text-indigo-600 rotate-180" : "text-slate-400"
                    )}>
                      <ChevronDown className="w-5 h-5" />
                    </div>
                  </button>
                  
                  <div
                    className={clsx(
                      "grid transition-all duration-300 ease-in-out",
                      isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    )}
                  >
                    <div className="overflow-hidden">
                      <div className="px-5 pb-5 sm:px-6 sm:pb-6 pt-1">
                        <div className="h-px w-full bg-slate-100 mb-4"></div>
                        <div className="space-y-2 mt-4">
                          {item.choices.map((choice, idx) => {
                            const isCorrect = item.correctAnswers.includes(choice);
                            return (
                              <div 
                                key={idx} 
                                className={clsx(
                                  "flex items-start gap-3 p-3 rounded-xl border transition-colors",
                                  isCorrect 
                                    ? "bg-emerald-50 border-emerald-200 text-emerald-900" 
                                    : "bg-slate-50 border-transparent text-slate-600"
                                )}
                              >
                                {isCorrect ? (
                                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                                ) : (
                                  <Circle className="w-5 h-5 text-slate-300 flex-shrink-0 mt-0.5" />
                                )}
                                <span className={clsx(
                                  "sm:text-lg leading-relaxed",
                                  isCorrect && "font-medium"
                                )}>
                                  {choice}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}