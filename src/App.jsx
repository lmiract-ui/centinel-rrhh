import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Volume2, VolumeX, ChevronRight, ChevronLeft, 
  Loader2, ShieldCheck, EyeOff, MessageSquare,
  Zap, Database, Target, TrendingUp, Shield, CheckCircle2, Search, 
  Clock, ArrowRight, AlertCircle, Check, XCircle, FileText, Send, BarChart3
} from 'lucide-react';

// --- CONFIGURACIÓN ---
const APP_ID = 'centinel_run_flotas_final_v5';
const SIM_STEP_COUNT = 9; 
const INACTIVITY_LIMIT = 40000; 
const TRANSITION_PAUSE = 2500; 

const WEBAPP_URL = "https://script.google.com/macros/s/AKfycbyrd5JmMVNaETbAU6umpo01Osu6idbIPK4yR9prkvDoIHxnSKGneK94pERsnU245V80/exec";
const WHATSAPP_NUMBER = "5493513140103"; 

const PSYCHO_MESSAGES = [
  "La forma en que pensás importa más que la respuesta final.",
  "La claridad es lograda con dedicación",
  "Lo complejo se ordena con criterio, no con velocidad.",
  "La coherencia es una decisión.",
  "La estructura es invisible hasta que falta.",
  "No todo ajuste requiere un cambio radical.",
  "El foco se define antes de empezar.",
  "Las decisiones pequeñas construyen resultados grandes.",
  "No todo lo que parece urgente es importante.",
  "El estándar es interno."
];

// --- APP PRINCIPAL ---

export default function App() {
  const [view, setView] = useState('context'); 
  const [prefStep, setPrefStep] = useState(0); 
  const [simStep, setSimStep] = useState(1);   
  
  const [isMuted, setIsMuted] = useState(false);
  const [showPsychoMessage, setShowPsychoMessage] = useState(false);
  const [currentPsychoText, setCurrentPsychoText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState(null);
  const [inactivityWarning, setInactivityWarning] = useState(false);
  const [lastInteraction, setLastInteraction] = useState(Date.now());
  const [showAIWarning, setShowAIWarning] = useState(false);
  const [hasSeenAIWarning, setHasSeenAIWarning] = useState(false);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10); 

  const [state, setState] = useState(() => {
    const saved = localStorage.getItem(APP_ID);
    return saved ? JSON.parse(saved) : {
      answers: {},
      profileScores: { estrategia: 0, disciplina: 0, sistema: 0, orientacionEconomica: 0, toleranciaRiesgo: 0, autonomia: 0, enfoqueConsultivo: 0 },
      contact: { name: '', city: '', email: '', phone: '', linkedin: '' }
    };
  });

  useEffect(() => {
    if (!window.jspdf) {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const playTick = useCallback(() => {
    if (isMuted) return;
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.015, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.1);
    } catch (e) {}
  }, [isMuted]);

  useEffect(() => {
    localStorage.setItem(APP_ID, JSON.stringify(state));
  }, [state]);

  const recordInteraction = () => {
    setLastInteraction(Date.now());
    setInactivityWarning(false);
  };

  const updateProfile = (scores) => {
    setState(prev => {
      const newScores = { ...prev.profileScores };
      Object.keys(scores).forEach(key => { newScores[key] = (newScores[key] || 0) + scores[key]; });
      return { ...prev, profileScores: newScores };
    });
  };

  // --- PDF GENERATOR ---
  const generatePDF = () => {
    if (!window.jspdf) return;
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const { contact, answers } = state;

    doc.setFillColor(15, 15, 15);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(211, 253, 0); 
    doc.setFontSize(22);
    doc.text("CENTINEL", 20, 25);
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text("REPORTE DE RESPUESTAS - PROCESO DE SELECCIÓN", 20, 32);

    doc.setTextColor(40, 40, 40);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("INFORMACIÓN PERSONAL", 20, 55);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Nombre: ${contact.name || '---'}`, 20, 65);
    doc.text(`Email: ${contact.email || '---'}`, 20, 72);
    doc.text(`Ciudad: ${contact.city || '---'}`, 20, 79);
    doc.text(`WhatsApp: ${contact.phone || '---'}`, 20, 86);

    let y = 100;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("RESPUESTAS DEL TEST", 20, y);
    doc.line(20, y + 2, 190, y + 2);
    y += 15;

    const allQuestions = {
      pref_modalidad: "Modalidad Operativa",
      pref_ingreso: "Esquema de Compensación",
      pref_monotributo: "Condición Fiscal",
      pref_follow: "Estrategia de Seguimiento",
      pref_prio: "Prioridad ante Notificaciones",
      pref_tech: "Resolución de Imprevistos",
      pref_obj: "Manejo de Objeción Precio",
      pref_ethics: "Ética y Cierre",
      sim_priorizacion: "Criterio de Foco (Leads)",
      sim_organizacion: "Método de Organización",
      sim_objecion: "Respuesta al Cliente (GPS)",
      sim_bajoRendimiento: "Análisis de Resultados",
      sim_autonomia: "Plan de Autonomía",
      sim_variable: "Adaptación al Modelo Variable"
    };

    doc.setFontSize(9);
    Object.entries(allQuestions).forEach(([key, label]) => {
      if (answers[key]) {
        if (y > 270) { doc.addPage(); y = 25; }
        doc.setFont("helvetica", "bold");
        doc.text(`${label}:`, 20, y);
        doc.setFont("helvetica", "normal");
        const valText = doc.splitTextToSize(String(Array.isArray(answers[key]) ? answers[key].join(", ") : answers[key]), 160);
        doc.text(valText, 25, y + 5);
        y += (valText.length * 5) + 10;
      }
    });

    doc.save(`Centinel_Reporte_${contact.name?.replace(/\s/g, '_')}.pdf`);
  };

  const handleWhatsAppSend = () => {
    const msg = `Hola Centinel, envío mi reporte de respuestas de la simulación RUN Flotas.\n\n*Candidato:* ${state.contact.name}`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // --- NAVEGACIÓN ---
  
  const handlePreFilterNext = () => {
    playTick();
    if (prefStep < 9) {
      setPrefStep(prev => prev + 1);
      window.scrollTo(0, 0);
    } else {
      setView('bridge');
    }
  };

  const handleSimulationNext = (scores = {}) => {
    playTick();
    recordInteraction();
    updateProfile(scores);

    if (simStep < SIM_STEP_COUNT) {
      setCurrentPsychoText(PSYCHO_MESSAGES[phraseIndex]);
      setShowPsychoMessage(true);
      setTimeout(() => {
        setSimStep(prev => prev + 1);
        setPhraseIndex(prev => (prev + 1) % PSYCHO_MESSAGES.length);
        setShowPsychoMessage(false);
        window.scrollTo(0, 0);
      }, TRANSITION_PAUSE);
    } else {
      submitFinal();
    }
  };

  const submitFinal = async () => {
    try {
      setIsSubmitting(true);
      const payload = {
        secret: "centinelgrupoplur30718400844",
        createdAt: new Date().toISOString(),
        contact: state.contact,
        simulation: state.answers,
        profileScores: state.profileScores,
        userAgent: navigator.userAgent
      };
      await fetch(WEBAPP_URL, { method: "POST", mode: "no-cors", body: JSON.stringify(payload) });
      setView("final");
    } catch (e) {
      setView("final");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- COMPONENTES ---

  const Background = () => (
    <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-0">
      <div className="absolute inset-0 bg-[#0f0f0f]" />
      <svg className="w-full h-full"><pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse"><path d="M 80 0 L 0 0 0 80" fill="none" stroke="#1e3a8a" strokeWidth="1"/></pattern><rect width="100%" height="100%" fill="url(#grid)" /></svg>
    </div>
  );

  const Header = () => (
    <header className="fixed top-0 left-0 w-full p-6 md:p-8 flex justify-between items-center z-40 bg-gradient-to-b from-[#0f0f0f] to-transparent">
      <div className="text-sm font-bold tracking-[0.4em] text-white uppercase">CENTINEL</div>
      <button onClick={() => setIsMuted(!isMuted)} className="p-2 text-white/40 hover:text-white transition-colors">
        {isMuted ? <VolumeX size={16}/> : <Volume2 size={16}/>}
      </button>
    </header>
  );

  const selectPrefOption = (key, label, isEliminatory = false) => {
    setState(p => ({ ...p, answers: { ...p.answers, [key]: label } }));
    if (isEliminatory) { setView('rejected'); return; }
    setTimeout(handlePreFilterNext, 400);
  };

  // --- VISTAS ---

  if (view === 'context') return (
    <div className="min-h-screen bg-[#0f0f0f] text-white flex items-center justify-center p-6 relative overflow-y-auto">
      <Background />
      <div className="max-w-4xl space-y-12 relative z-10">
        <h1 className="text-[#d3fd00] text-3xl md:text-5xl leading-tight font-bold">Centinel Flotas ofrece soluciones de rastreo y gestión vehicular pensadas para empresas que necesitan control real.</h1>
        <div className="grid md:grid-cols-2 gap-8 text-white border-l border-zinc-800 pl-8">
          <ul className="space-y-4 font-bold">
            <li className="flex items-center gap-3"><Zap className="text-[#d3fd00]"/> Dispositivos profesionales.</li>
            <li className="flex items-center gap-3"><Database className="text-[#d3fd00]"/> Software robusto.</li>
            <li className="flex items-center gap-3"><CheckCircle2 className="text-[#d3fd00]"/> Pago único (sin abono).</li>
          </ul>
        </div>
        <button onClick={() => setView('prefilter')} className="px-16 py-5 bg-[#d3fd00] text-black font-bold uppercase text-xs hover:bg-white transition-all shadow-xl">Avanzar</button>
      </div>
    </div>
  );

  if (view === 'prefilter') return (
    <div className="min-h-screen bg-[#0f0f0f] text-white flex flex-col items-center justify-center p-6 relative overflow-y-auto">
      <Background />
      <Header />
      <div className="max-w-xl w-full relative z-10">
        <AnimatePresence mode="wait">
          <motion.div key={prefStep} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
            {prefStep === 0 ? (
              <div className="space-y-8">
                <span className="text-[#d3fd00] text-[10px] tracking-widest uppercase font-bold flex items-center gap-2"><Target size={14} /> Recruitment Phase</span>
                <h1 className="text-4xl font-bold">Evaluación de criterio y <span className="text-[#d3fd00]">decisiones.</span></h1>
                <p className="text-white/60">No buscamos respuestas de manual. Buscamos tu instinto real.</p>
                <button onClick={handlePreFilterNext} className="px-10 py-5 border border-white/20 hover:border-[#d3fd00] uppercase text-xs font-bold transition-all">Iniciar Evaluación</button>
              </div>
            ) : prefStep === 5 ? (
              <div className="space-y-8">
                 <div className="flex justify-between border-b border-white/10 pb-4">
                    <h2 className="text-2xl text-[#d3fd00] font-bold">Dilema de Prioridad</h2>
                    <span className="text-xs font-mono">00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}</span>
                 </div>
                 <p className="text-white font-bold">Tenés 3 notificaciones al mismo tiempo. ¿Cuál atendés primero?</p>
                 {["CEO Corporación (64 u): Revisó presupuesto y pidió llamado.", "Dueño Logística (12 u): Robo total hace 15 min.", "Referido VIP (30 u): Llamar apenas puedas."].map(o => (
                    <button key={o} onClick={() => { setState(p => ({...p, answers: {...p.answers, pref_prio: o}})); handlePreFilterNext(); }} className="w-full text-left p-6 border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] hover:border-[#d3fd00]/40 transition-all font-bold mb-3">{o}</button>
                 ))}
              </div>
            ) : prefStep === 9 ? (
              <div className="space-y-8">
                <h2 className="text-2xl text-[#d3fd00] font-bold">Auto-Evaluación Final</h2>
                <PrefilterChecklist onComplete={(c) => c < 3 ? setView('rejected') : handlePreFilterNext()} />
              </div>
            ) : (
              <div className="space-y-8">
                <h2 className="text-2xl border-b border-white/10 pb-4 text-[#d3fd00] font-bold">
                    {prefStep === 1 ? "Esquema Operativo" : prefStep === 2 ? "Plan de Compensación" : prefStep === 3 ? "Condición Profesional" : prefStep === 4 ? "Cuando el cliente se enfría" : prefStep === 6 ? "Imprevistos Técnicos" : prefStep === 7 ? "Manejo de Objeciones" : "Expectativas Reales"}
                </h2>
                <div className="grid gap-3">
                  {(prefStep === 1 ? ["Remoto con 2 presenciales semanales me sirve.", "Solo acepto trabajo 100% remoto.", "Busco una oficina para ir todos los días."] :
                    prefStep === 2 ? ["Es el modelo que busco para no tener techo.", "Prefiero un sueldo fijo que me dé seguridad."] :
                    prefStep === 3 ? ["Puedo facturar como monotributista.", "No tengo ni planeo gestionar facturación."] :
                    prefStep === 4 ? ["Le escribo con franqueza: 'Si tus prioridades cambiaron...'", "Dejo de insistir. Foco en quien tiene hambre hoy.", "Le sigo mandando data útil cada un par de días."] :
                    prefStep === 6 ? ["Llamo a su teléfono para avisar y empiezo por voz.", "Escribo un mail pidiendo reprogramar.", "Espero a que el servicio se restablezca."] :
                    prefStep === 7 ? ["“Si el precio es lo más importante, tal vez otra opción sea mejor.”", "“Entiendo. Antes de hablar de precio, ¿con qué nos compara?”", "“Podemos armar una versión diferente para acercar el número.”"] :
                    ["Explico el roadmap y ofrezco solución intermedia.", "Le digo que sí lo tenemos para cerrar el mes.", "Le sugiero esperar 3 meses para firmar."]
                  ).map((l, i) => (
                    <button key={i} onClick={() => selectPrefOption(`pref_${prefStep}`, l, (prefStep === 1 && i > 0) || (prefStep === 2 && i > 0) || (prefStep === 3 && i > 0) || (prefStep === 6 && i === 2) || (prefStep === 8 && i === 1))} className="w-full text-left p-6 border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] hover:border-[#d3fd00]/40 transition-all font-bold text-white">{l}</button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      <AIWarningModal isOpen={showAIWarning} onConfirm={() => { setShowAIWarning(false); setHasSeenAIWarning(true); }} />
    </div>
  );

  if (view === 'bridge') return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-6 text-center">
      <div className="max-w-md space-y-8">
        <ShieldCheck className="text-[#d3fd00] mx-auto" size={60} />
        <h2 className="text-3xl text-[#d3fd00] font-bold">Validación Completa.</h2>
        <p className="text-white/80 font-bold">Estás habilitado para la simulación técnica estratégica.</p>
        <button className="w-full px-10 py-5 bg-[#d3fd00] text-black font-bold uppercase text-xs" onClick={() => setView('simulation')}>Comenzar Simulación</button>
      </div>
    </div>
  );

  // SIMULACIÓN TÉCNICA - CORREGIDA ESTÉTICAMENTE
  if (view === 'simulation') return (
    <div className="min-h-screen bg-[#0f0f0f] py-36 px-6 relative overflow-y-auto">
      <Background />
      <Header />
      <div className="max-w-4xl mx-auto relative z-10">
        <AnimatePresence mode="wait">
          {!showPsychoMessage ? (
            <motion.div key={simStep} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}>
              
              {simStep === 1 && (
                <div className="text-center space-y-10">
                  <h1 className="text-3xl md:text-5xl font-bold text-white">Es una conversación</h1>
                  <p className="text-white/60 text-lg">Queremos entender cómo pensás cuando tomás decisiones reales de negocio.</p>
                  <button onClick={() => handleSimulationNext({})} className="px-14 py-4 bg-[#d3fd00] text-black font-bold uppercase text-xs">Empezar</button>
                </div>
              )}

              {simStep === 2 && (
                <div className="space-y-10">
                   <h2 className="text-2xl text-white font-bold leading-relaxed">En Centinel con 1m ingresan alrededor de 580 leads de los cuales 200 son oportunidades potables por mes. Es bastante volumen. En la práctica, solo podés trabajar bien una parte.</h2>
                   <p className="text-[#d3fd00] uppercase tracking-widest text-xs font-bold">Si tuvieras que priorizar, ¿qué mirarías primero?</p>
                   <div className="grid gap-3">
                     {["Tamaño de flota (impacto económico)", "Urgencia o problema declarado", "Velocidad de contacto", "Armar un sistema de clasificación antes de llamar", "Analizar datos antes de decidir"].map(o => (
                       <button key={o} onClick={() => { setState(p => ({...p, answers: {...p.answers, sim_priorizacion: o}})); handleSimulationNext({ estrategia: 2 }); }} className="w-full text-left p-6 border border-white/10 bg-white/[0.02] hover:border-[#d3fd00]/40 transition-all font-bold text-white">{o}</button>
                     ))}
                   </div>
                </div>
              )}

              {simStep === 3 && (
                <div className="space-y-8">
                  <h2 className="text-2xl text-[#d3fd00] font-bold">Contanos cómo organizarías tu semana para manejar alto volumen sin perder calidad.</h2>
                  <textarea onChange={e => setState(p => ({...p, answers: {...p.answers, sim_organizacion: e.target.value}}))} className="w-full h-48 bg-transparent border border-zinc-800 p-6 focus:border-[#d3fd00] outline-none text-white font-normal" placeholder="Tu método de organización..." />
                  <div className="flex justify-end"><NavigationButton onClick={() => handleSimulationNext({ sistema: 2 })} disabled={!state.answers.sim_organizacion} /></div>
                </div>
              )}

              {simStep === 4 && (
                <div className="space-y-8">
                  <div className="p-8 border-l-4 border-[#d3fd00] bg-white/[0.02] italic text-white/90">"Ya tengo GPS y sos más caro."<p className="text-[10px] not-italic text-white/40 uppercase mt-4">--- Empresa con 12 vehículos</p></div>
                  <h2 className="text-2xl text-[#d3fd00] font-bold">¿Cómo seguirías esa conversación?</h2>
                  <textarea onChange={e => setState(p => ({...p, answers: {...p.answers, sim_objecion: e.target.value}}))} className="w-full h-48 bg-transparent border border-zinc-800 p-6 focus:border-[#d3fd00] outline-none text-white font-normal" placeholder="Tu respuesta para el cliente..." />
                  <div className="flex justify-end"><NavigationButton onClick={() => handleSimulationNext({ enfoqueConsultivo: 2 })} disabled={!state.answers.sim_objecion} /></div>
                </div>
              )}

              {simStep === 5 && (
                <div className="space-y-12 max-w-xl mx-auto">
                   <h2 className="text-2xl text-[#d3fd00] font-bold">Números Reales</h2>
                   <div className="space-y-8">
                     <EconomicInput label="¿Cuánto te gustaría ganar en 12 meses? (ARS)" onChange={v => setState(p => ({...p, answers: {...p.answers, sim_income: v}}))} />
                     <EconomicInput label="¿Cuál fue tu mejor mes de ventas?" onChange={v => setState(p => ({...p, answers: {...p.answers, sim_bestMonth: v}}))} />
                   </div>
                   <div className="flex justify-end pt-6"><NavigationButton onClick={() => handleSimulationNext({ orientacionEconomica: 2 })} disabled={!state.answers.sim_income} /></div>
                </div>
              )}

              {simStep === 6 && (
                <div className="space-y-10">
                   <p className="text-white/60 italic">Primer mes, llamadas y reuniones estuvieron pero los cierres no aparecieron.</p>
                   <h2 className="text-2xl text-[#d3fd00] font-bold">¿Qué analizás antes de cambiar algo?</h2>
                   <div className="grid gap-3">
                      {["El tipo de empresas a las que le dediqué energía.", "La calidad real de mis conversaciones.", "En qué etapa del proceso se caen.", "La claridad de la propuesta de valor.", "Si estoy empujando demasiado rápido.", "Si el volumen está afectando mi foco.", "Nada todavía. Sostengo 30 días y observo patrón."].map(o => {
                        const sel = (state.answers.sim_bajoRendimiento || []).includes(o);
                        return (<button key={o} onClick={() => { const cur = state.answers.sim_bajoRendimiento || []; const next = sel ? cur.filter(x=>x!==o) : [...cur, o]; setState(p=>({...p, answers:{...p.answers, sim_bajoRendimiento: next}})) }} className={`w-full p-6 text-left border transition-all font-bold ${sel ? 'border-[#d3fd00] bg-[#d3fd00]/5 text-[#d3fd00]' : 'border-white/5 bg-white/[0.02] text-white'}`}>{o}</button>);
                      })}
                   </div>
                   <div className="flex justify-end pt-4"><NavigationButton onClick={() => handleSimulationNext({})} disabled={!state.answers.sim_bajoRendimiento?.length} /></div>
                </div>
              )}

              {simStep === 7 && (
                <div className="space-y-10">
                  <h2 className="text-2xl text-[#d3fd00] font-bold uppercase tracking-widest">Autonomía Real</h2>
                  <p className="text-white/80 font-bold italic">100% remoto. Sin control horario. Métricas claras. 2 encuentros presenciales.</p>
                  <textarea onChange={e => setState(p => ({...p, answers: {...p.answers, sim_autonomia: e.target.value}}))} className="w-full h-48 bg-transparent border border-zinc-800 p-6 focus:border-[#d3fd00] outline-none text-white font-normal" placeholder="¿Cómo te organizarías para sostener rendimiento?" />
                  <div className="flex justify-end"><NavigationButton onClick={() => handleSimulationNext({ autonomia: 2 })} disabled={!state.answers.sim_autonomia} /></div>
                </div>
              )}

              {simStep === 8 && (
                <div className="space-y-10">
                  <h2 className="text-2xl text-white font-bold">¿Qué cambia en tu forma de trabajar cuando el ingreso depende solo de resultados?</h2>
                  <div className="grid gap-3">
                    {["Intensifico el cierre de oportunidades calientes", "Refuerzo mi propia prospección", "Ajusto mi sistema de métricas personal", "Cambio mi enfoque para acelerar decisiones", "Sostengo el proceso, confío en la estadística"].map(o => (
                      <button key={o} onClick={() => { setState(p => ({...p, answers: {...p.answers, sim_variable: o}})); handleSimulationNext({ orientacionEconomica: 2 }); }} className="w-full p-6 border border-white/5 bg-white/[0.02] text-white hover:border-[#d3fd00] transition-all text-left font-bold">{o}</button>
                    ))}
                  </div>
                </div>
              )}

              {simStep === 9 && (
                <div className="space-y-10">
                  <h2 className="text-2xl text-[#d3fd00] font-bold uppercase tracking-widest">Cierre de Proceso</h2>
                  <div className="grid md:grid-cols-2 gap-8">
                    {[{l:'Nombre Completo',k:'name'}, {l:'Email',k:'email'}, {l:'WhatsApp',k:'phone'}, {l:'Ciudad',k:'city'}].map(f => (
                      <div key={f.k} className="space-y-2">
                        <label className="text-[10px] uppercase text-white/50 font-bold">{f.l}</label>
                        <input onChange={e => setState(p => ({...p, contact: {...p.contact, [f.k]: e.target.value}}))} className="w-full bg-transparent border-b border-zinc-800 p-3 outline-none focus:border-[#d3fd00] text-white font-bold" />
                      </div>
                    ))}
                  </div>
                  <button onClick={() => handleSimulationNext({})} disabled={isSubmitting || !state.contact.name} className="w-full py-5 bg-[#d3fd00] text-black font-bold uppercase text-xs flex items-center justify-center gap-3 mt-12">
                    {isSubmitting ? <Loader2 className="animate-spin" /> : 'Finalizar y Enviar'}
                  </button>
                </div>
              )}

            </motion.div>
          ) : (
            <motion.div key="psycho" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center min-h-[50vh] text-center p-6"><p className="text-xl md:text-2xl font-extralight text-white italic max-w-2xl leading-relaxed">"{currentPsychoText}"</p></motion.div>
          )}
        </AnimatePresence>
      </div>
      <footer className="fixed bottom-0 left-0 w-full p-8 flex justify-between items-end z-40 pointer-events-none font-bold"><div className="hidden md:block text-[9px] text-white/40 uppercase tracking-[0.3em] font-bold">Confidencial. Centinel B2B.</div></footer>
    </div>
  );

  // VISTA FINAL
  if (view === 'final') return (
    <div className="min-h-screen bg-black flex items-center justify-center p-8 text-center relative overflow-hidden">
      <Background />
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-12 max-w-lg relative z-10">
        <ShieldCheck className="text-[#d3fd00] mx-auto" size={64} />
        <div className="space-y-4">
          <h2 className="text-3xl text-white font-bold uppercase tracking-widest">¡Proceso Registrado!</h2>
          <p className="text-white/60 font-bold leading-relaxed">Tus respuestas han sido enviadas. Para finalizar, descarga el PDF y envíalo por WhatsApp para coordinar la reunión.</p>
        </div>
        <div className="grid gap-6">
          <button onClick={generatePDF} className="w-full py-5 bg-white text-black font-bold uppercase flex items-center justify-center gap-3 border-b-4 border-zinc-400 font-bold"><FileText size={20} /> Descargar Reporte PDF</button>
          <button onClick={handleWhatsAppSend} className="w-full py-5 bg-[#25D366] text-white font-bold uppercase flex items-center justify-center gap-3 border-b-4 border-[#128c7e] font-bold"><Send size={20} /> Enviar por WhatsApp</button>
        </div>
      </motion.div>
    </div>
  );

  if (view === 'rejected') return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-6 text-center font-bold">
      <div className="max-w-md space-y-6">
        <XCircle className="text-red-500 mx-auto" size={60} />
        <h2 className="text-2xl text-white font-bold">Perfil no compatible</h2>
        <p className="text-white/50">Buscamos un enfoque comercial distinto para esta etapa. Gracias por tu sinceridad.</p>
      </div>
    </div>
  );

  return null;
}

// --- AUXILIARES ---

const AIWarningModal = ({ isOpen, onConfirm }) => (
  <AnimatePresence>{isOpen && (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#0f0f0f]/98 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.98 }} animate={{ scale: 1 }} className="max-w-md w-full border border-zinc-800 p-10 space-y-10 bg-[#111] shadow-2xl">
        <div className="flex items-center space-x-3 text-[#d3fd00] font-bold font-bold font-bold font-bold font-bold font-bold font-bold"><MessageSquare size={20}/><h3 className="text-xs uppercase tracking-[0.3em] font-bold">Aviso de Integridad</h3></div>
        <div className="space-y-6 text-white text-sm leading-relaxed font-normal"><p>Este proceso evalúa cómo pensás vos.</p><p>El uso de IA para responder generará una respuesta detectable. Preferimos autenticidad.</p></div>
        <button onClick={onConfirm} className="w-full py-5 bg-zinc-800 text-white text-[10px] uppercase font-bold hover:bg-white hover:text-black transition-all">Entiendo, sigo por mi cuenta</button>
      </motion.div>
    </motion.div>
  )}</AnimatePresence>
);

const EconomicInput = ({ label, onChange }) => (
  <div className="space-y-2">
    <label className="text-[10px] text-white/60 uppercase tracking-widest block font-bold">{label}</label>
    <input type="number" onChange={e => onChange(e.target.value)} className="w-full bg-transparent border-b border-zinc-800 py-3 text-3xl text-white focus:border-[#d3fd00] outline-none font-bold" />
  </div>
);

const NavigationButton = ({ onClick, disabled }) => (
  <button onClick={onClick} disabled={disabled} className="flex items-center space-x-3 bg-[#d3fd00] text-black px-10 py-4 text-[10px] uppercase font-bold hover:bg-white transition-all disabled:opacity-30"><span>Continuar</span> <ChevronRight size={14} /></button>
);

function PrefilterChecklist({ onComplete }) {
  const [sel, setSel] = useState([]);
  const items = ["Gestiono mi propio embudo sin supervisión constante.", "Prefiero ingresos variables altos que fijos bajos.", "Considero que el seguimiento es el 80% de la venta.", "Me siento cómodo negociando con dueños de empresas."];
  const toggle = (i) => setSel(p => p.includes(i) ? p.filter(x => x !== i) : [...p, i]);
  return (
    <div className="space-y-6">
      <div className="grid gap-3 font-bold">{items.map(t => (
        <div key={t} onClick={() => toggle(t)} className={`flex items-center space-x-4 p-5 border transition-all cursor-pointer rounded-sm ${sel.includes(t) ? 'border-[#d3fd00] bg-[#d3fd00]/5 text-white font-bold' : 'border-white/5 bg-white/[0.01] text-white/40'}`}>
          <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${sel.includes(t) ? 'bg-[#d3fd00] border-[#d3fd00]' : 'border-white/20'}`}>{sel.includes(t) && <Check size={10} className="text-black stroke-[4]"/>}</div>
          <span className="text-sm font-normal leading-snug">{t}</span>
        </div>
      ))}</div>
      <button onClick={() => onComplete(sel.length)} disabled={sel.length === 0} className={`w-full mt-4 px-8 py-5 font-bold transition-all rounded-sm uppercase tracking-[0.2em] text-[10px] font-bold ${sel.length >= 3 ? 'bg-[#d3fd00] text-black shadow-lg' : 'bg-white/5 text-white/20'}`}>{sel.length >= 3 ? "Finalizar" : `Faltan ${3 - sel.length}`}</button>
    </div>
  );
}