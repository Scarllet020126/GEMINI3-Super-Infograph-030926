import React, { useState, useEffect } from "react";
import {
  Upload,
  FileText,
  Settings,
  Download,
  Moon,
  Sun,
  Languages,
  Palette,
  Loader2,
  CheckCircle2,
  ChevronDown,
  Play,
  Share2,
  ShieldCheck
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { PAINTER_STYLES } from "./lib/styles";
import { runIngestion, runExtraction, runPlanning, runQA, generateAudioSummary, generateSocialThread, factCheckTopics } from "./lib/gemini";
import { InfographicCard } from "./components/InfographicCard";

type AgentConfig = {
  id: string;
  name: string;
  model: string;
  prompt: string;
};

const DEFAULT_AGENTS: AgentConfig[] = [
  {
    id: 'ingestion',
    name: 'Ingestion & Chunking',
    model: 'gemini-3-flash-preview',
    prompt: 'Clean up the following article, remove noise, and chunk it into logical sections. Return the cleaned text.'
  },
  {
    id: 'extraction',
    name: 'Topic Extraction (30 Topics)',
    model: 'gemini-3-flash-preview',
    prompt: 'Extract exactly 30 key topics from the text. Return a JSON array of objects with topic_id, title_en, title_zh, summary_en, summary_zh, why_it_matters_en, why_it_matters_zh.'
  },
  {
    id: 'planning',
    name: 'Planning & Composing Infographics',
    model: 'gemini-3-flash-preview',
    prompt: 'For each of the 30 topics provided, assign a suggested_infographic_type (timeline, flowchart, comparison, checklist, layered) and generate a "data" array with label_en, label_zh, value_en, value_zh. Return the updated JSON array.'
  },
  {
    id: 'qa',
    name: 'QA & Finalizing',
    model: 'gemini-3-flash-preview',
    prompt: 'Review the 30 topics for consistency. Also generate exactly 20 comprehensive follow-up questions. Return a final JSON object with { topics, follow_up_questions }.'
  }
];

export default function App() {
  const [article, setArticle] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [data, setData] = useState<any>(null);

  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [language, setLanguage] = useState<"en" | "zh">("en");
  const [painterStyleId, setPainterStyleId] = useState("default");
  const [showStyleMenu, setShowStyleMenu] = useState(false);

  const [agents, setAgents] = useState<AgentConfig[]>(DEFAULT_AGENTS);
  const [pipelineResults, setPipelineResults] = useState<Record<string, any>>({});
  const [currentStep, setCurrentStep] = useState<string>("");
  const [showConfig, setShowConfig] = useState(false);

  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [socialThread, setSocialThread] = useState<string | null>(null);
  const [factCheck, setFactCheck] = useState<any>(null);
  const [isGeneratingExtra, setIsGeneratingExtra] = useState<string | null>(null);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  useEffect(() => {
    const style =
      PAINTER_STYLES.find((s) => s.id === painterStyleId) || PAINTER_STYLES[0];
    const root = document.documentElement;

    if (painterStyleId !== "default") {
      root.style.setProperty("--p-bg", style.theme.bg);
      root.style.setProperty("--p-text", style.theme.text);
      root.style.setProperty("--p-card-bg", style.theme.cardBg);
      root.style.setProperty("--p-border", style.theme.border);
    } else {
      root.style.removeProperty("--p-bg");
      root.style.removeProperty("--p-text");
      root.style.removeProperty("--p-card-bg");
      root.style.removeProperty("--p-border");
    }

    root.style.setProperty("--p-primary", style.theme.primary);
    root.style.setProperty("--p-secondary", style.theme.secondary);
    root.style.setProperty("--p-font", style.theme.font);
    root.style.setProperty("--p-radius", style.theme.radius);
    root.style.setProperty("--p-shadow", style.theme.shadow);
  }, [painterStyleId]);

  const handleGenerate = async () => {
    if (!article.trim()) return;
    setIsGenerating(true);
    setData(null);
    setPipelineResults({});
    setAudioUrl(null);
    setSocialThread(null);
    setFactCheck(null);
    
    try {
      setCurrentStep('ingestion');
      const ingestionResult = await runIngestion(article, agents[0].model, agents[0].prompt);
      setPipelineResults(prev => ({ ...prev, ingestion: ingestionResult }));

      setCurrentStep('extraction');
      const extractionResult = await runExtraction(ingestionResult, agents[1].model, agents[1].prompt);
      setPipelineResults(prev => ({ ...prev, extraction: extractionResult }));

      setCurrentStep('planning');
      const planningResult = await runPlanning(extractionResult, agents[2].model, agents[2].prompt);
      setPipelineResults(prev => ({ ...prev, planning: planningResult }));

      setCurrentStep('qa');
      const qaResult = await runQA(planningResult, agents[3].model, agents[3].prompt);
      setPipelineResults(prev => ({ ...prev, qa: qaResult }));
      
      setData(qaResult);
    } catch (error) {
      console.error(error);
      alert('Pipeline failed at step: ' + currentStep);
    } finally {
      setIsGenerating(false);
      setCurrentStep('');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setArticle(event.target?.result as string);
    };
    reader.readAsText(file);
  };

  const handleGenerateAudio = async () => {
    if (!data) return;
    setIsGeneratingExtra('audio');
    try {
      const base64 = await generateAudioSummary(data.topics);
      if (base64) setAudioUrl(`data:audio/mp3;base64,${base64}`);
    } catch (e) {
      console.error(e);
    }
    setIsGeneratingExtra(null);
  };

  const handleGenerateSocial = async () => {
    if (!data) return;
    setIsGeneratingExtra('social');
    try {
      const text = await generateSocialThread(data.topics, agents[0].model);
      setSocialThread(text);
    } catch (e) {
      console.error(e);
    }
    setIsGeneratingExtra(null);
  };

  const handleFactCheck = async () => {
    if (!data) return;
    setIsGeneratingExtra('factcheck');
    try {
      const result = await factCheckTopics(data.topics, agents[0].model);
      setFactCheck(result);
    } catch (e) {
      console.error(e);
    }
    setIsGeneratingExtra(null);
  };

  const downloadHtml = () => {
    const htmlContent = document.documentElement.outerHTML;
    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "infographics.html";
    a.click();
  };

  const downloadMarkdown = () => {
    if (!data) return;
    let md = `# Infographics (30 Topics)\n\n`;
    data.topics.forEach((t: any) => {
      md += `## ${language === "en" ? t.title_en : t.title_zh}\n`;
      md += `**${t.suggested_infographic_type}**\n\n`;
      md += `${language === "en" ? t.summary_en : t.summary_zh}\n\n`;
      md += `### Why it matters\n`;
      const why = language === "en" ? t.why_it_matters_en : t.why_it_matters_zh;
      why?.forEach((w: string) => {
        md += `- ${w}\n`;
      });
      md += `\n### Data Points\n`;
      t.data?.forEach((d: any) => {
        md += `- **${language === "en" ? d.label_en : d.label_zh}**: ${language === "en" ? d.value_en : d.value_zh}\n`;
      });
      md += `\n---\n\n`;
    });

    md += `# Follow-up Questions\n\n`;
    data.follow_up_questions?.forEach((q: any, i: number) => {
      md += `${i + 1}. ${language === "en" ? q.question_en : q.question_zh}\n`;
    });

    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "infographics.md";
    a.click();
  };

  const downloadPdf = () => {
    window.print();
  };

  return (
    <div className="min-h-screen painter-wrapper">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-opacity-80 border-b border-current border-opacity-10 painter-bg-secondary bg-opacity-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Palette className="w-6 h-6 painter-primary" />
            <h1 className="font-bold text-xl tracking-tight">
              Infographic Code Factory
            </h1>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <button 
              onClick={() => setShowConfig(!showConfig)}
              className={`p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${showConfig ? 'painter-bg-primary text-white' : ''}`}
              title="Pipeline Configuration"
            >
              <Settings className="w-5 h-5" />
            </button>

            <div className="relative">
              <button
                onClick={() => setShowStyleMenu(!showStyleMenu)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-sm font-medium"
              >
                <Palette className="w-4 h-4" />
                <span className="hidden md:inline">
                  Style:{" "}
                  {PAINTER_STYLES.find((s) => s.id === painterStyleId)?.name}
                </span>
                <ChevronDown className="w-4 h-4" />
              </button>

              <AnimatePresence>
                {showStyleMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-56 max-h-96 overflow-y-auto painter-card shadow-xl z-50 p-1"
                  >
                    {PAINTER_STYLES.map((style) => (
                      <button
                        key={style.id}
                        onClick={() => {
                          setPainterStyleId(style.id);
                          setShowStyleMenu(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm rounded-md hover:bg-black/5 dark:hover:bg-white/5 ${painterStyleId === style.id ? "painter-bg-primary text-white" : ""}`}
                      >
                        {style.name}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              onClick={() => setLanguage((l) => (l === "en" ? "zh" : "en"))}
              className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              title="Toggle Language"
            >
              <Languages className="w-5 h-5" />
            </button>

            <button
              onClick={() =>
                setTheme((t) => (t === "light" ? "dark" : "light"))
              }
              className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              title="Toggle Theme"
            >
              {theme === "light" ? (
                <Moon className="w-5 h-5" />
              ) : (
                <Sun className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <AnimatePresence>
          {showConfig && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8 overflow-hidden"
            >
              <div className="painter-card p-6">
                <h3 className="text-xl font-bold mb-4">Agent Pipeline Configuration</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {agents.map((agent, i) => (
                    <div key={agent.id} className="p-4 rounded-lg border border-current border-opacity-20 bg-black/5 dark:bg-white/5">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-bold text-sm">{i + 1}. {agent.name}</h4>
                        <select 
                          value={agent.model} 
                          onChange={e => {
                            const newAgents = [...agents];
                            newAgents[i].model = e.target.value;
                            setAgents(newAgents);
                          }}
                          className="p-1 text-xs rounded border border-current border-opacity-20 bg-transparent"
                        >
                          <option value="gemini-3-flash-preview">gemini-3-flash-preview</option>
                          <option value="gemini-2.5-flash">gemini-2.5-flash</option>
                          <option value="gemini-3.1-pro-preview">gemini-3.1-pro-preview</option>
                        </select>
                      </div>
                      <textarea 
                        value={agent.prompt}
                        onChange={e => {
                          const newAgents = [...agents];
                          newAgents[i].prompt = e.target.value;
                          setAgents(newAgents);
                        }}
                        className="w-full p-2 text-xs rounded border border-current border-opacity-20 bg-transparent h-24 resize-none focus:outline-none focus:border-opacity-50"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!data && !isGenerating && Object.keys(pipelineResults).length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto mt-12"
          >
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold mb-4">
                Transform Articles into Visuals
              </h2>
              <p className="opacity-80 text-lg">
                Paste your article below to automatically extract 30 key topics
                and generate a stunning interactive infographic webpage.
              </p>
            </div>

            <div className="painter-card p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <label className="font-semibold flex items-center gap-2">
                  <FileText className="w-5 h-5 painter-primary" />
                  Article Content
                </label>
                <label className="cursor-pointer flex items-center gap-2 text-sm px-3 py-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                  <Upload className="w-4 h-4" />
                  Upload File
                  <input
                    type="file"
                    accept=".txt,.md"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </label>
              </div>
              <textarea
                value={article}
                onChange={(e) => setArticle(e.target.value)}
                placeholder="Paste your regulatory article, compliance guide, or long-form content here..."
                className="w-full h-64 p-4 rounded-md bg-transparent border-2 border-current border-opacity-20 focus:border-opacity-50 focus:outline-none resize-none"
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={!article.trim()}
              className="w-full py-4 rounded-xl painter-bg-primary text-white font-bold text-lg shadow-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              Generate 30 Infographics
            </button>
          </motion.div>
        )}

        {(isGenerating || Object.keys(pipelineResults).length > 0) && !data && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 py-12">
            <div className="flex flex-col gap-4">
              <h3 className="text-2xl font-bold mb-4">Agentic Pipeline Status</h3>
              {agents.map((agent) => {
                const isActive = currentStep === agent.id;
                const isPast = Object.keys(pipelineResults).includes(agent.id);
                
                return (
                  <div key={agent.id} className={`flex items-center gap-3 p-4 rounded-lg painter-card ${isActive ? 'border-2 border-blue-500 shadow-lg' : ''} ${!isActive && !isPast ? 'opacity-50' : ''}`}>
                    {isPast ? (
                      <CheckCircle2 className="w-6 h-6 painter-primary shrink-0" />
                    ) : isActive ? (
                      <Loader2 className="w-6 h-6 painter-primary animate-spin shrink-0" />
                    ) : (
                      <div className="w-6 h-6 rounded-full border-2 border-current border-opacity-20 shrink-0" />
                    )}
                    <div>
                      <span className={`font-bold ${isActive ? 'painter-primary' : ''}`}>{agent.name}</span>
                      <p className="text-xs opacity-70 mt-1">Model: {agent.model}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="flex flex-col gap-4">
              <h3 className="text-2xl font-bold mb-4">Live Results</h3>
              <div className="painter-card p-4 h-[400px] overflow-y-auto font-mono text-xs bg-black/5 dark:bg-white/5">
                {currentStep && !pipelineResults[currentStep] && (
                  <div className="flex items-center gap-2 text-blue-500 mb-4">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Waiting for {agents.find(a => a.id === currentStep)?.name}...
                  </div>
                )}
                {Object.entries(pipelineResults).reverse().map(([step, result]) => (
                  <div key={step} className="mb-6">
                    <div className="font-bold text-sm mb-2 capitalize text-blue-500 border-b border-current border-opacity-20 pb-1">
                      {step} Output:
                    </div>
                    <pre className="whitespace-pre-wrap break-words opacity-80">
                      {typeof result === 'string' ? result : JSON.stringify(result, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {data && !isGenerating && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-4">
              <div>
                <h2 className="text-3xl font-bold mb-2">
                  {language === "en" ? "30 Key Concepts" : "30 個核心概念"}
                </h2>
                <p className="opacity-80">
                  {language === "en"
                    ? "Extracted and visualized from your article."
                    : "從您的文章中提取並視覺化。"}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={downloadHtml}
                  className="flex items-center gap-2 px-4 py-2 rounded-md painter-card hover:opacity-80 transition-opacity text-sm font-medium"
                >
                  <Download className="w-4 h-4" /> HTML
                </button>
                <button
                  onClick={downloadMarkdown}
                  className="flex items-center gap-2 px-4 py-2 rounded-md painter-card hover:opacity-80 transition-opacity text-sm font-medium"
                >
                  <Download className="w-4 h-4" /> Markdown
                </button>
                <button
                  onClick={downloadPdf}
                  className="flex items-center gap-2 px-4 py-2 rounded-md painter-card hover:opacity-80 transition-opacity text-sm font-medium"
                >
                  <Download className="w-4 h-4" /> PDF
                </button>
              </div>
            </div>

            {/* Additional AI Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
              <div className="painter-card p-4 flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 rounded-full painter-bg-primary text-white flex items-center justify-center">
                  <Play className="w-6 h-6 ml-1" />
                </div>
                <h3 className="font-bold">Executive Audio Summary</h3>
                <p className="text-sm opacity-80 flex-1">Generate a 2-minute TTS audio briefing of the top insights.</p>
                {audioUrl ? (
                  <audio controls src={audioUrl} className="w-full mt-2 h-10" />
                ) : (
                  <button 
                    onClick={handleGenerateAudio}
                    disabled={isGeneratingExtra !== null}
                    className="w-full py-2 rounded painter-bg-primary text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isGeneratingExtra === 'audio' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Generate Audio'}
                  </button>
                )}
              </div>

              <div className="painter-card p-4 flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 rounded-full painter-bg-primary text-white flex items-center justify-center">
                  <Share2 className="w-6 h-6" />
                </div>
                <h3 className="font-bold">Social Media Thread</h3>
                <p className="text-sm opacity-80 flex-1">Create an engaging 5-part Twitter/LinkedIn thread.</p>
                {socialThread ? (
                  <div className="w-full mt-2 text-left text-xs bg-black/5 dark:bg-white/5 p-2 rounded h-24 overflow-y-auto whitespace-pre-wrap">
                    {socialThread}
                  </div>
                ) : (
                  <button 
                    onClick={handleGenerateSocial}
                    disabled={isGeneratingExtra !== null}
                    className="w-full py-2 rounded painter-bg-primary text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isGeneratingExtra === 'social' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Generate Thread'}
                  </button>
                )}
              </div>

              <div className="painter-card p-4 flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 rounded-full painter-bg-primary text-white flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="font-bold">Fact-Check & Grounding</h3>
                <p className="text-sm opacity-80 flex-1">Verify the top 3 claims using Google Search Grounding.</p>
                {factCheck ? (
                  <div className="w-full mt-2 text-left text-xs bg-black/5 dark:bg-white/5 p-2 rounded h-24 overflow-y-auto whitespace-pre-wrap">
                    {factCheck.text}
                  </div>
                ) : (
                  <button 
                    onClick={handleFactCheck}
                    disabled={isGeneratingExtra !== null}
                    className="w-full py-2 rounded painter-bg-primary text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isGeneratingExtra === 'factcheck' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Run Fact-Check'}
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 mb-16">
              {data.topics?.map((topic: any, index: number) => (
                <InfographicCard
                  key={topic.topic_id || index}
                  topic={topic}
                  language={language}
                />
              ))}
            </div>

            <div className="mt-20 pt-12 border-t border-current border-opacity-20">
              <h2 className="text-3xl font-bold mb-8 text-center">
                {language === "en" ? "20 Follow-up Questions" : "20 個後續問題"}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
                {data.follow_up_questions?.map((q: any, i: number) => (
                  <div
                    key={i}
                    className="painter-card p-4 flex gap-4 items-start"
                  >
                    <span className="font-bold painter-primary text-xl opacity-50">
                      {i + 1}
                    </span>
                    <p className="font-medium pt-1">
                      {language === "en" ? q.question_en : q.question_zh}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
