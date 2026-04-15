"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  Scale, 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck, 
  FileText, 
  Calculator, 
  BarChart3, 
  Zap, 
  Globe, 
  Lock
} from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export default function Home() {
  const targetRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.8]);

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-slate-950 font-sans selection:bg-emerald-500/30 overflow-x-hidden">
      {/* Navigation */}
      <header className="px-6 lg:px-12 h-20 flex items-center justify-between bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/60 sticky top-0 z-50">
        <Link className="flex items-center gap-3 transition-transform hover:scale-105" href="/">
          <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-emerald-600 shadow-lg shadow-emerald-200 dark:shadow-none text-white">
            <Scale className="h-6 w-6" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white leading-none">Portal 360</span>
            <span className="text-[10px] font-bold text-emerald-600 tracking-[0.2em] uppercase mt-1">Sosercom SaaS</span>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-10">
          {['Servicios', 'Empresas', 'Tecnología', 'Nosotros'].map((item) => (
            <Link 
              key={item}
              className="text-sm font-semibold text-slate-600 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 transition-all relative group" 
              href={`#${item.toLowerCase()}`}
            >
              {item}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-emerald-500 transition-all group-hover:w-full"></span>
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <Link href="/login">
            <Button variant="ghost" className="hidden sm:inline-flex font-semibold text-slate-700 dark:text-slate-300">
              Iniciar Sesión
            </Button>
          </Link>
          <Link href="/login">
            <Button className="bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white rounded-xl px-6 h-11 font-semibold transition-all hover:shadow-xl hover:shadow-emerald-500/20 active:scale-95">
              Acceso Corporativo
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section ref={targetRef} className="relative w-full pt-20 pb-32 md:pt-40 md:pb-48 flex items-center justify-center overflow-hidden">
          {/* Animated Background Gradients */}
          <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-400/20 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-[10%] left-[-5%] w-[400px] h-[400px] bg-blue-400/10 rounded-full blur-[100px]"></div>
          
          <motion.div 
            style={{ opacity, scale }}
            className="container px-4 md:px-6 relative z-10 mx-auto text-center"
          >
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="flex flex-col items-center space-y-10"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50/50 px-4 py-1.5 text-xs font-bold text-emerald-700 uppercase tracking-widest">
                <Zap className="w-3 h-3 fill-emerald-500" />
                Nueva Plataforma 2026
              </div>

              <h1 className="text-5xl font-black tracking-tight sm:text-6xl md:text-7xl lg:text-8xl max-w-5xl text-slate-900 dark:text-white leading-[1.1]">
                Gestión <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-emerald-500 to-cyan-500">360 Grados</span> de su Capital.
              </h1>

              <p className="mx-auto max-w-2xl text-lg md:text-xl text-slate-500 dark:text-slate-400 leading-relaxed">
                El ecosistema digital líder para empresas que exigen precisión absoluta en Auditoría Jurídica, Contabilidad Estratégica y Cumplimiento Tributario.
              </p>

              <div className="flex flex-col sm:flex-row gap-5 pt-6">
                <Link href="/login">
                  <Button size="lg" className="h-16 px-10 rounded-2xl bg-slate-950 text-white hover:bg-slate-800 text-lg font-bold shadow-2xl shadow-slate-200 transition-all active:scale-95 group">
                    Comenzar Ahora
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Button variant="outline" size="lg" className="h-16 px-10 rounded-2xl border-slate-200 hover:bg-slate-100 text-lg font-semibold transition-all">
                  Ver Video Demo
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="pt-12 grid grid-cols-2 md:grid-cols-4 gap-8 opacity-40 grayscale group hover:grayscale-0 hover:opacity-100 transition-all duration-700">
                <div className="flex items-center gap-2 font-black text-slate-400 text-sm italic tracking-tighter uppercase">LegalTech</div>
                <div className="flex items-center gap-2 font-black text-slate-400 text-sm italic tracking-tighter uppercase">AuditPro</div>
                <div className="flex items-center gap-2 font-black text-slate-400 text-sm italic tracking-tighter uppercase">Sosercom.Cloud</div>
                <div className="flex items-center gap-2 font-black text-slate-400 text-sm italic tracking-tighter uppercase">TaxInsight</div>
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* Value Prop Section */}
        <section id="servicios" className="w-full py-32 bg-slate-50 dark:bg-slate-900/50 relative overflow-hidden">
           <div className="container px-4 md:px-6 mx-auto relative z-10">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-8">
                <h2 className="text-4xl font-black text-slate-900 dark:text-white leading-tight">
                  Un solo portal. <br />
                  <span className="text-emerald-600">Control total</span> de su organización.
                </h2>
                <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
                  Elimine la fricción entre departamentos. Nuestra arquitectura multi-tenant permite una colaboración fluida entre abogados, contadores y directivos.
                </p>
                <div className="grid sm:grid-cols-2 gap-6">
                  {[
                    { icon: ShieldCheck, title: "Jurídico", desc: "Gestión de causas y contratos." },
                    { icon: Calculator, title: "Contable", desc: "Balance en tiempo real." },
                    { icon: BarChart3, title: "Tributario", desc: "Proyecciones y DDJJ." },
                    { icon: Lock, title: "Seguridad", desc: "Cifrado nivel bancario." }
                  ].map((item, i) => (
                    <motion.div 
                      key={i}
                      whileHover={{ x: 5 }}
                      className="flex gap-4 p-4 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700"
                    >
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
                        <item.icon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white">{item.title}</h4>
                        <p className="text-xs text-slate-500">{item.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="relative group">
                <div className="absolute -inset-4 bg-gradient-to-tr from-emerald-500 to-cyan-500 rounded-[2rem] opacity-20 blur-2xl group-hover:opacity-30 transition-opacity"></div>
                <div className="relative bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700 aspect-video flex items-center justify-center font-bold text-emerald-600 text-xl tracking-widest">
                   {/* This would be an image/demo in a real app */}
                   DASHBOARD PREVIEW
                </div>
              </div>
            </div>
           </div>
        </section>

        {/* Global Reach Section */}
        <section id="tecnología" className="w-full py-32 bg-white dark:bg-slate-950">
          <div className="container px-4 md:px-6 mx-auto text-center space-y-16">
            <div className="space-y-4">
              <h2 className="text-4xl font-black text-slate-900 dark:text-white">Infraestructura de Clase Mundial</h2>
              <p className="mx-auto max-w-2xl text-slate-500">Desplegado sobre Firebase y Google Cloud, garantizando redundancia y latencia mínima.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-12">
              {[
                { icon: Globe, title: "Acceso Global", desc: "Su portal disponible 24/7 desde cualquier parte del mundo." },
                { icon: CheckCircle2, title: "99.9% Uptime", desc: "Compromiso de disponibilidad para operaciones críticas." },
                { icon: FileText, title: "Audit Log", desc: "Trazabilidad completa de cada acción realizada en el sistema." }
              ].map((item, i) => (
                <div key={i} className="space-y-4">
                  <div className="mx-auto w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center border border-slate-100 dark:border-slate-700">
                    <item.icon className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-bold">{item.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Footer Section */}
        <section className="w-full py-20 px-6 container mx-auto">
          <div className="bg-slate-900 rounded-[3rem] p-12 md:p-20 text-center space-y-8 relative overflow-hidden">
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(16,185,129,0.1),_transparent_70%)]"></div>
             <h2 className="text-4xl md:text-5xl font-black text-white relative z-10">Simplifique su éxito hoy.</h2>
             <p className="text-slate-400 max-w-xl mx-auto relative z-10">Únase a las cientos de empresas que ya transformaron su gestión administrativa con Sosercom.</p>
             <div className="flex justify-center relative z-10">
                <Link href="/login">
                  <Button size="lg" className="h-16 px-12 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xl font-bold transition-transform active:scale-95 shadow-xl shadow-emerald-500/20">
                    Probar Gratis
                  </Button>
                </Link>
             </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 py-20 border-t border-slate-100 dark:border-slate-900">
        <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="space-y-6 md:col-span-1">
            <Link className="flex items-center gap-2" href="/">
              <Scale className="h-6 w-6 text-emerald-600" />
              <span className="font-bold text-xl tracking-tighter text-slate-900 dark:text-white uppercase">Portal 360</span>
            </Link>
            <p className="text-sm leading-relaxed">
              La plataforma definitiva para la armonía entre el cumplimiento legal y la eficiencia financiera.
            </p>
          </div>
          
          <div>
            <h4 className="text-slate-900 dark:text-white font-bold mb-6 text-sm uppercase tracking-widest">Ecosistema</h4>
            <ul className="space-y-4 text-sm font-medium">
              <li><Link href="#" className="hover:text-emerald-600 transition-colors">Jurídico</Link></li>
              <li><Link href="#" className="hover:text-emerald-600 transition-colors">Contable</Link></li>
              <li><Link href="#" className="hover:text-emerald-600 transition-colors">Tributario</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-slate-900 dark:text-white font-bold mb-6 text-sm uppercase tracking-widest">Recursos</h4>
            <ul className="space-y-4 text-sm font-medium">
              <li><Link href="#" className="hover:text-emerald-600 transition-colors">Blog Jurídico</Link></li>
              <li><Link href="#" className="hover:text-emerald-600 transition-colors">Guías Fiscales</Link></li>
              <li><Link href="#" className="hover:text-emerald-600 transition-colors">API Docs</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-slate-900 dark:text-white font-bold mb-6 text-sm uppercase tracking-widest">Contacto</h4>
            <div className="space-y-4 text-sm font-medium">
              <p>Av. Principal 1234, Santiago, Chile</p>
              <p>soporte@sosercom.com</p>
              <p>+56 2 2345 6789</p>
            </div>
          </div>
        </div>
        
        <div className="container mx-auto px-6 mt-20 pt-10 border-t border-slate-100 dark:border-slate-900 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-xs font-bold text-slate-400">© 2026 Portal 360 Jurídico, Contable y Tributario. Powered by Sosercom.</p>
          <div className="flex items-center gap-8">
            <Link href="#" className="text-xs font-bold hover:text-emerald-600">Privacidad</Link>
            <Link href="#" className="text-xs font-bold hover:text-emerald-600">Términos</Link>
            <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1 rounded-full text-[10px] font-black text-emerald-600 border border-emerald-100 dark:border-emerald-500/20 uppercase tracking-tighter">
              Status: Operational
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
