import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash, Translate, Target, ListNumbers, DownloadSimple } from '@phosphor-icons/react';
import { toPng } from 'html-to-image';

type Criterion = { id: string; name: string; weight: number };
type Option = { id: string; name: string };
type Scores = Record<string, number>; // key: optionId_criterionId

const TRANSLATIONS = {
  en: {
    title: 'Decisify',
    subtitle: 'Mathematical precision for complex choices.',
    criteria: 'Criteria',
    criteriaDesc: 'The weights defining your outcome.',
    options: 'Options',
    optionsDesc: 'The candidates in consideration.',
    matrix: 'The Matrix',
    matrixDesc: 'Assign scores (1-10) to map the landscape.',
    results: 'Synthesis',
    resultsDesc: 'The dominant mathematical choice.',
    addCrit: 'Enter criterion...',
    addOpt: 'Enter option...',
    weight: 'W',
    reset: 'Clear Context',
    emptyScores: 'Insufficient data for synthesis.',
    score: 'pts',
    bestChoice: 'OPTIMAL',
    download: 'Export to Image',
  },
  ar: {
    title: 'ديسيسايف',
    subtitle: 'دقة رياضية لخياراتك المعقدة.',
    criteria: 'المعايير',
    criteriaDesc: 'الأوزان التي تحدد نتيجتك.',
    options: 'المرشحون',
    optionsDesc: 'الخيارات قيد الدراسة.',
    matrix: 'المصفوفة',
    matrixDesc: 'قم بتعيين الدرجات (١-١٠).',
    results: 'التركيب',
    resultsDesc: 'الخيار الرياضي المهيمن.',
    addCrit: 'أدخل معيار...',
    addOpt: 'أدخل خيار...',
    weight: 'وزن',
    reset: 'مسح السياق',
    emptyScores: 'بيانات غير كافية للتركيب.',
    score: 'نقطة',
    bestChoice: 'الأمثل',
    download: 'تحميل النتيجة كصورة',
  },
};

export default function App() {
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [options, setOptions] = useState<Option[]>([]);
  const [scores, setScores] = useState<Scores>({});
  const [newCrit, setNewCrit] = useState('');
  const [newCritWeight, setNewCritWeight] = useState(3);
  const [newOpt, setNewOpt] = useState('');
  const exportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportedImage, setExportedImage] = useState<string | null>(null);

  const t = TRANSLATIONS[lang];

  const generateId = () => {
    return (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : Math.random().toString(36).substring(2, 15);
  };

  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('decisifyState-v3');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.lang) setLang(parsed.lang);
        if (parsed.criteria) setCriteria(parsed.criteria);
        if (parsed.options) setOptions(parsed.options);
        if (parsed.scores) setScores(parsed.scores);
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('decisifyState-v3', JSON.stringify({ lang, criteria, options, scores }));
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang, criteria, options, scores]);

  const addCriterion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCrit.trim()) return;
    setCriteria([...criteria, { id: generateId(), name: newCrit.trim(), weight: newCritWeight }]);
    setNewCrit('');
  };

  const addOption = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOpt.trim()) return;
    setOptions([...options, { id: generateId(), name: newOpt.trim() }]);
    setNewOpt('');
  };

  const handleScoreChange = (optId: string, critId: string, val: string) => {
    let num = parseInt(val);
    const newScores = { ...scores };
    if (isNaN(num)) {
      delete newScores[`${optId}_${critId}`];
    } else {
      if (num > 10) num = 10;
      if (num < 1) num = 1;
      newScores[`${optId}_${critId}`] = num;
    }
    setScores(newScores);
  };

  const exportAsImage = async () => {
    if (!exportRef.current) return;
    setIsExporting(true);
    try {
      const data = await toPng(exportRef.current, {
        backgroundColor: '#050505',
        pixelRatio: window.devicePixelRatio || 2,
        cacheBust: true,
        filter: (node) => {
          if (node.hasAttribute && node.hasAttribute('data-ignore-export')) {
            return false;
          }
          return true;
        }
      });
      
      // On mobile (touch devices), direct download often fails due to async context.
      // So we show the image in an overlay for the user to long-press or share.
      if (window.innerWidth < 768 || ('ontouchstart' in window)) {
        setExportedImage(data);
      } else {
        const a = document.createElement('a');
        a.href = data;
        a.download = 'Decisify-Result.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (err) {
      console.error('Failed to export image', err);
      alert(lang === 'ar' ? 'فشل تحميل الصورة. يرجى المحاولة مرة أخرى.' : 'Failed to export image. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const results = options.map(o => {
    let total = 0;
    let complete = true;
    criteria.forEach(c => {
      const s = scores[`${o.id}_${c.id}`];
      if (s) total += s * c.weight;
      else complete = false;
    });
    return { ...o, total, complete };
  }).sort((a, b) => b.total - a.total);

  const maxTotal = Math.max(0, ...results.map(r => r.total));
  const theoreticalMax = criteria.reduce((sum, c) => sum + (10 * c.weight), 0) || 1;

  return (
    <div className="min-h-[100dvh] flex flex-col xl:flex-row relative">
      
      {/* LEFT COLUMN: Setup */}
      <aside className="w-full xl:w-[450px] 2xl:w-[500px] border-b xl:border-b-0 xl:border-r border-[var(--border)] glass z-10 flex flex-col xl:sticky xl:top-0 xl:h-[100dvh]">
        <header className="p-6 md:p-8 pb-4 flex justify-between items-center shrink-0">
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tighter text-white flex items-center gap-3">
              <div className="w-3 h-3 bg-[#e0ff22] rounded-full shadow-[0_0_15px_#e0ff22]"></div>
              {t.title}
            </h1>
            <p className="text-xs md:text-sm text-[var(--fg-muted)] mt-2 font-mono">{t.subtitle}</p>
          </div>
          <button 
            onClick={() => setLang(lang === 'en' ? 'ar' : 'en')} 
            className="w-10 h-10 rounded-full border border-[var(--border)] flex items-center justify-center hover:bg-white/5 transition-colors shrink-0"
          >
            <Translate className="w-5 h-5 text-white/70" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-8 pt-4 flex flex-col gap-10">
          
          {/* CRITERIA SECTION */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-white/5 border border-white/10 shrink-0">
                <Target className="w-5 h-5 text-[#e0ff22]" />
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-semibold text-white/90">{t.criteria}</h2>
                <p className="text-[10px] md:text-xs text-[var(--fg-muted)] font-mono mt-1">{t.criteriaDesc}</p>
              </div>
            </div>
            
            <form onSubmit={addCriterion} className="flex gap-2 md:gap-3 mb-6">
              <input 
                type="text" 
                value={newCrit} 
                onChange={e => setNewCrit(e.target.value)} 
                placeholder={t.addCrit}
                className="flex-1 min-w-0 glass-input rounded-xl px-3 md:px-4 py-3 text-sm text-white placeholder:text-white/30"
              />
              <div className="flex items-center gap-1 md:gap-2 glass-input rounded-xl px-2 md:px-3 shrink-0">
                <span className="text-[10px] uppercase text-white/50 font-semibold">{t.weight}</span>
                <input 
                  type="number" min="1" max="5" 
                  value={newCritWeight} 
                  onChange={e => setNewCritWeight(parseInt(e.target.value) || 1)} 
                  className="w-8 bg-transparent text-center text-white focus:outline-none font-mono text-sm" 
                />
              </div>
              <button type="submit" className="w-12 h-12 shrink-0 flex items-center justify-center rounded-xl bg-white text-black hover:bg-[#e0ff22] transition-colors">
                <Plus weight="bold" />
              </button>
            </form>

            <ul className="flex flex-col gap-2 md:gap-3">
              <AnimatePresence>
                {criteria.map(c => (
                  <motion.li 
                    key={c.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex justify-between items-center p-3 md:p-4 rounded-xl border border-[var(--border)] bg-white/[0.02] hover:bg-white/[0.04] transition-colors group"
                  >
                    <span className="text-sm font-semibold text-white break-words">{c.name}</span>
                    <div className="flex items-center gap-3 md:gap-4 shrink-0">
                      <span className="text-xs font-mono text-[#e0ff22] bg-[#e0ff22]/10 px-2 py-1 rounded">×{c.weight}</span>
                      <button onClick={() => setCriteria(criteria.filter(x => x.id !== c.id))} className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                        <Trash weight="fill" />
                      </button>
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          </section>

          {/* OPTIONS SECTION */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-white/5 border border-white/10 shrink-0">
                <ListNumbers className="w-5 h-5 text-[#e0ff22]" />
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-semibold text-white/90">{t.options}</h2>
                <p className="text-[10px] md:text-xs text-[var(--fg-muted)] font-mono mt-1">{t.optionsDesc}</p>
              </div>
            </div>

            <form onSubmit={addOption} className="flex gap-2 md:gap-3 mb-6">
              <input 
                type="text" 
                value={newOpt} 
                onChange={e => setNewOpt(e.target.value)} 
                placeholder={t.addOpt}
                className="flex-1 min-w-0 glass-input rounded-xl px-3 md:px-4 py-3 text-sm text-white placeholder:text-white/30"
              />
              <button type="submit" className="w-12 h-12 shrink-0 flex items-center justify-center rounded-xl bg-white text-black hover:bg-[#e0ff22] transition-colors">
                <Plus weight="bold" />
              </button>
            </form>

            <ul className="flex flex-col gap-2 md:gap-3">
              <AnimatePresence>
                {options.map(o => (
                  <motion.li 
                    key={o.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex justify-between items-center p-3 md:p-4 rounded-xl border border-[var(--border)] bg-white/[0.02] hover:bg-white/[0.04] transition-colors group"
                  >
                    <span className="text-sm font-semibold text-white break-words">{o.name}</span>
                    <button onClick={() => setOptions(options.filter(x => x.id !== o.id))} className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                      <Trash weight="fill" />
                    </button>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          </section>
        </div>
        
        <div className="p-6 md:p-8 border-t border-[var(--border)] shrink-0">
           <button 
             onClick={() => { setCriteria([]); setOptions([]); setScores({}); }} 
             className="text-[10px] md:text-xs uppercase tracking-widest text-[var(--fg-muted)] hover:text-white transition-colors"
           >
             {t.reset}
           </button>
        </div>
      </aside>

      {/* RIGHT COLUMN: Matrix & Results */}
      <main className="flex-1 p-4 sm:p-8 lg:p-20 xl:p-24 flex flex-col gap-16 md:gap-24 relative overflow-hidden min-w-0">
        
        {/* Abstract background glow */}
        <div className="absolute top-1/4 right-1/4 w-[300px] md:w-96 h-[300px] md:h-96 bg-[#e0ff22]/5 rounded-full blur-[120px] pointer-events-none"></div>

        <section className="relative z-10">
          <div className="mb-8 md:mb-12">
            <h2 className="text-3xl md:text-4xl lg:text-5xl tracking-tighter font-black text-white mb-2 md:mb-4">{t.matrix}</h2>
            <p className="text-[var(--fg-muted)] font-mono text-[10px] md:text-sm uppercase tracking-widest">{t.matrixDesc}</p>
          </div>

          {criteria.length > 0 && options.length > 0 ? (
            <div className="table-wrapper">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#0f0f0f]">
                    <th className="min-w-[120px] sticky left-0 z-20 bg-[#0f0f0f] border-r border-[var(--border)]"></th>
                    {criteria.map((c, i) => (
                      <th key={c.id} className="text-center min-w-[100px] px-2 py-4">
                        <div className="text-white mb-1 truncate max-w-[120px] mx-auto" title={c.name}>{c.name}</div>
                        <div className="text-[10px] text-[#e0ff22]">WEIGHT: {c.weight}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {options.map((o, i) => (
                    <tr key={o.id} className="transition-colors hover:bg-white/[0.02]">
                      <td className="font-semibold text-white/90 sticky left-0 z-20 bg-[var(--bg)] border-r border-[var(--border)] truncate max-w-[120px]" title={o.name}>
                        {o.name}
                      </td>
                      {criteria.map((c, j) => {
                        const val = scores[`${o.id}_${c.id}`] || '';
                        return (
                          <td key={c.id} className="text-center px-2">
                            <input
                              type="number"
                              min="1" max="10"
                              value={val}
                              onChange={e => handleScoreChange(o.id, c.id, e.target.value)}
                              className="w-14 md:w-16 h-10 md:h-12 bg-black/50 border border-white/10 text-center rounded-lg text-white focus:outline-none focus:border-[#e0ff22] font-mono transition-all focus:bg-[#e0ff22]/5 shadow-inner"
                            />
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="border border-white/10 border-dashed rounded-2xl p-10 md:p-16 flex flex-col items-center justify-center text-center opacity-50 bg-black/20">
              <Target className="w-10 md:w-12 h-10 md:h-12 mb-4 text-white/30" />
              <div className="text-xs md:text-sm font-mono px-4">{t.emptyScores}</div>
            </div>
          )}
        </section>

        {/* EXPORTABLE SYNTHESIS SECTION */}
        <section className="relative z-10 w-full" ref={exportRef}>
          <div className="mb-8 md:mb-12 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl tracking-tighter font-black text-white mb-2 md:mb-4">{t.results}</h2>
              <p className="text-[var(--fg-muted)] font-mono text-[10px] md:text-sm uppercase tracking-widest">{t.resultsDesc}</p>
            </div>
            
            {results.some(r => r.total > 0) && (
              <button 
                onClick={exportAsImage}
                disabled={isExporting}
                data-ignore-export="true"
                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white text-xs font-mono font-semibold uppercase tracking-widest transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <DownloadSimple className={`w-4 h-4 ${isExporting ? 'animate-pulse' : ''}`} />
                {isExporting ? (lang === 'ar' ? 'جاري التحميل...' : 'Exporting...') : t.download}
              </button>
            )}
          </div>

          {/* VISUAL CHART */}
          {results.some(r => r.total > 0) && (
            <div className="mb-12 bg-[#0f0f0f] border border-white/10 rounded-2xl p-6 md:p-10 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
              <div className="flex flex-col gap-6">
                {results.map((r, i) => {
                  const isWinner = r.total === maxTotal && maxTotal > 0 && r.complete;
                  const percentage = Math.max(2, (r.total / theoreticalMax) * 100);
                  return (
                    <div key={r.id} className="w-full">
                      <div className="flex justify-between items-end mb-2 text-sm">
                        <span className={`truncate mr-4 ${isWinner ? 'text-white font-semibold' : 'text-white/70 font-medium'}`}>{r.name}</span>
                        <span className={`font-mono shrink-0 ${isWinner ? 'text-[#e0ff22] font-black' : 'text-white/50'}`}>{r.total}</span>
                      </div>
                      <div className="w-full h-2 md:h-3 bg-black/50 rounded-full overflow-hidden flex">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 0.8, delay: i * 0.1, ease: 'easeOut' }}
                          className={`h-full rounded-full relative ${isWinner ? 'bg-[#e0ff22] shadow-[0_0_15px_rgba(224,255,34,0.5)]' : 'bg-white/20'}`}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:gap-6">
            <AnimatePresence mode="popLayout">
              {results.filter(r => r.total > 0).map((r, i) => {
                const isWinner = r.total === maxTotal && maxTotal > 0 && r.complete;
                if (!isWinner) return null; // Only show winner card to save space, or show all if needed. 
                // Given the chart handles the breakdown, let's just feature the winner prominently.
                return (
                  <motion.div 
                    layout
                    key={r.id}
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                    className="relative p-6 md:p-8 lg:p-10 rounded-2xl border transition-all duration-500 overflow-hidden border-[#e0ff22] bg-[#e0ff22]/5 shadow-[0_0_30px_rgba(224,255,34,0.1)] w-full"
                  >
                    <div data-ignore-export="true" className="absolute top-0 right-0 w-32 h-32 bg-[#e0ff22]/20 rounded-full blur-[50px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 md:gap-6 relative z-10">
                      <div>
                        <div className="text-[10px] font-mono font-black tracking-widest text-[#e0ff22] mb-2 uppercase">{t.bestChoice}</div>
                        <h3 className="text-2xl md:text-3xl font-black text-white break-words">{r.name}</h3>
                      </div>
                      <div className="flex items-end gap-2 shrink-0">
                        <span className="text-5xl md:text-6xl font-mono font-black leading-none text-[#e0ff22]">
                          {r.total}
                        </span>
                        <span className="text-[10px] md:text-xs opacity-50 uppercase tracking-widest pb-1 md:pb-2 font-mono">{t.score}</span>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
            
            {results.length > 0 && results.every(r => r.total === 0) && (
              <div className="text-xs md:text-sm opacity-50 font-mono border border-white/5 rounded-2xl p-6 md:p-8 text-center bg-[#0f0f0f]">
                {t.emptyScores}
              </div>
            )}
          </div>
        </section>

      </main>

      {/* MOBILE EXPORT OVERLAY */}
      <AnimatePresence>
        {exportedImage && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 overflow-y-auto"
            onClick={() => setExportedImage(null)}
          >
            <div className="max-w-md w-full flex flex-col items-center gap-6" onClick={e => e.stopPropagation()}>
              <p className="text-white text-sm font-mono text-center">
                {lang === 'ar' ? 'اضغط مطولاً على الصورة لحفظها' : 'Long press the image to save'}
              </p>
              <img src={exportedImage} alt="Decisify Result" className="w-full rounded-2xl shadow-[0_0_50px_rgba(224,255,34,0.15)] border border-white/10" />
              <button 
                onClick={() => setExportedImage(null)}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full font-semibold transition-colors"
              >
                {lang === 'ar' ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
