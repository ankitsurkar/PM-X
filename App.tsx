import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  ArrowRight, 
  CheckCircle2, 
  Linkedin, 
  Youtube, 
  Mail, 
  Phone,
  Loader2,
  Menu,
  X,
  Calendar,
  Briefcase,
  User,
  Users,
  Quote,
  Download,
  ExternalLink
} from 'lucide-react';

// Firebase Imports
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';

/**
 * PRODUCTION NOTE:
 * When deploying to Vercel/Netlify, set these in your environment variables.
 * We access them safely here to avoid build warnings in certain environments.
 */
const getEnvVar = (key: string) => {
  try {
    // @ts-ignore - Accessing Vite env safely
    return import.meta.env[key] || "";
  } catch (e) {
    return "";
  }
};

const firebaseConfig = {
  apiKey: getEnvVar('VITE_FIREBASE_API_KEY'),
  authDomain: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnvVar('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: getEnvVar('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnvVar('VITE_FIREBASE_SENDER_ID'),
  appId: getEnvVar('VITE_FIREBASE_APP_ID')
};

// Fallback for preview environment (crucial for the current editor)
const getInitialConfig = () => {
  // @ts-ignore
  if (typeof __firebase_config !== 'undefined' && __firebase_config) {
    // @ts-ignore
    return JSON.parse(__firebase_config);
  }
  return firebaseConfig;
};

const app = initializeApp(getInitialConfig());
const auth = getAuth(app);
const db = getFirestore(app);
// @ts-ignore
const appId = typeof __app_id !== 'undefined' ? __app_id : 'stepsmart-prod';

// --- Form Validation Schema ---
const enrollmentSchema = z.object({
  fullName: z.string().min(2, { message: "Name is required." }),
  email: z.string().email({ message: "Invalid email address." }),
  phone: z.string().min(10, { message: "Invalid phone number." }),
  intent: z.enum(["brochure", "enroll"]),
});

// --- High-Fidelity Logo Component ---
const Logo = ({ className = "h-10" }) => (
  <div className={`flex items-center gap-3 ${className}`}>
    <div className="h-full aspect-square">
      <svg viewBox="0 0 100 100" className="h-full w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path 
          d="M50 10L18 28.5V71.5L50 90L82 71.5V45" 
          stroke="#188ab2" 
          strokeWidth="10" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
        <path 
          d="M32 78L88 22" 
          stroke="#188ab2" 
          strokeWidth="10" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
        <path 
          d="M88 22H65M88 22V45" 
          stroke="#188ab2" 
          strokeWidth="10" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
        <path 
          d="M30 48L42 36" 
          stroke="#188ab2" 
          strokeWidth="10" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
        <path 
          d="M45 68L62 51" 
          stroke="#188ab2" 
          strokeWidth="10" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
      </svg>
    </div>
    <div className="flex flex-col leading-none">
      <span className="font-bold text-2xl tracking-tight text-[#188ab2]">STEPSMART</span>
      <span className="text-[7px] font-bold text-slate-500 tracking-[0.2em] uppercase mt-0.5">Your Steps To Success</span>
    </div>
  </div>
);

const Button = ({ children, className, variant = "primary", isLoading, ...props }: any) => {
  const baseStyles = "inline-flex items-center justify-center rounded-md px-6 py-2.5 font-semibold transition-all duration-200 focus:outline-none disabled:opacity-50 active:scale-95";
  const variants: any = {
    primary: "bg-[#188ab2] text-white hover:bg-[#157a9d] shadow-sm",
    secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200",
    outline: "border border-slate-200 text-slate-600 hover:border-[#188ab2] hover:text-[#188ab2] bg-white shadow-sm"
  };
  
  return (
    <button className={`${baseStyles} ${variants[variant]} ${className}`} disabled={isLoading} {...props}>
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
};

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [enrollmentStatus, setEnrollmentStatus] = useState('idle');
  const [formIntent, setFormIntent] = useState('enroll'); 

  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (e) { console.error("Firebase Auth Error", e); }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(enrollmentSchema),
    defaultValues: { intent: 'enroll' }
  });

  const onSubmit = async (data: any) => {
    if (!user) {
      alert("System initializing. Please wait a moment and try again.");
      return;
    }
    setEnrollmentStatus('loading');
    try {
      const enrollmentsRef = collection(db, 'artifacts', appId, 'public', 'data', 'leads');
      await addDoc(enrollmentsRef, {
        ...data,
        userId: user.uid,
        submittedAt: serverTimestamp(),
      });
      setEnrollmentStatus('success');
      if (data.intent === 'brochure') {
        setTimeout(() => {
          window.open('https://www.stepsmart.net/brochure.pdf', '_blank');
        }, 1000);
      }
    } catch (err) {
      setEnrollmentStatus('error');
    }
  };

  const handleActionClick = (intent: string) => {
    setFormIntent(intent);
    setValue('intent', intent as any);
    const element = document.getElementById('form-container');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-[#188ab2]/10">
      <nav className="fixed top-0 z-50 w-full bg-white/90 backdrop-blur-md border-b border-slate-100">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <Logo className="h-10" />
          <div className="hidden md:flex items-center gap-10 text-sm font-semibold text-slate-600">
            <a href="#about" className="hover:text-[#188ab2] transition-colors">About Us</a>
            <a href="#accelerator" className="hover:text-[#188ab2] transition-colors">Mentorship Accelerator</a>
            <a href="#mentors" className="hover:text-[#188ab2] transition-colors">Mentors</a>
            <Button variant="primary" onClick={() => document.getElementById('enroll').scrollIntoView({ behavior: 'smooth' })}>
              Get Started
            </Button>
          </div>
          <button className="md:hidden p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="h-6 w-6 text-[#188ab2]" /> : <Menu className="h-6 w-6 text-[#188ab2]" />}
          </button>
        </div>
      </nav>

      {/* Mobile Nav */}
      {isMenuOpen && (
        <div className="md:hidden fixed top-20 left-0 w-full bg-white border-b border-slate-100 z-40 p-6 flex flex-col gap-4 shadow-xl animate-fade-in">
          <a href="#about" onClick={() => setIsMenuOpen(false)} className="font-bold">About Us</a>
          <a href="#accelerator" onClick={() => setIsMenuOpen(false)} className="font-bold">Mentorship Accelerator</a>
          <a href="#mentors" onClick={() => setIsMenuOpen(false)} className="font-bold">Mentors</a>
          <Button variant="primary" onClick={() => { setIsMenuOpen(false); handleActionClick('enroll'); }}>Enroll Now</Button>
        </div>
      )}

      <section className="pt-44 pb-28 md:pt-56 md:pb-40 bg-white">
        <div className="container mx-auto px-6 text-center max-w-5xl">
          <h1 className="text-5xl md:text-8xl font-extrabold tracking-tight mb-8 leading-[1.05] text-slate-900">
            Helping Professionals make <br />
            <span className="text-[#188ab2]">smarter moves with AI</span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-500 mb-12 max-w-2xl mx-auto leading-relaxed">
            Transition into high-growth Product Management roles with expert guidance, practical roadmaps, and AI-powered learning.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a 
              href="https://chat.whatsapp.com/BCeLjXhQHrxFxOlxkb7DPc" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-md px-10 py-4 font-semibold transition-all duration-200 bg-[#188ab2] text-white hover:bg-[#157a9d] shadow-sm text-lg"
            >
              Join Our Community <ExternalLink className="ml-2 h-5 w-5" />
            </a>
          </div>
        </div>
      </section>

      <section id="about" className="py-24 bg-slate-50 border-y border-slate-100">
        <div className="container mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Our Mission & Vision</h2>
            <p className="text-lg text-slate-600 leading-relaxed">
              StepSmart was founded with a simple but powerful idea: learning is most effective when guided by experienced mentors who have walked the path before you.
            </p>
            <p className="text-lg text-slate-600 leading-relaxed font-semibold italic text-[#188ab2]">
              "If a student has the skills and domain knowledge, they deserve a step at their dream job."
            </p>
            <p className="text-slate-600 leading-relaxed">
              We're building a community for students and professionals where support, mentorship, and progress go hand in hand.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Expert Mentors", icon: <Users className="h-6 w-6" /> },
              { label: "Practical Roadmaps", icon: <CheckCircle2 className="h-6 w-6" /> },
              { label: "Industry Partners", icon: <Briefcase className="h-6 w-6" /> },
              { label: "Weekly Growth", icon: <Calendar className="h-6 w-6" /> }
            ].map((box, i) => (
              <div key={i} className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm text-center flex flex-col items-center justify-center">
                <div className="text-[#188ab2] mb-4">{box.icon}</div>
                <span className="font-bold text-slate-900">{box.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="accelerator" className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight text-slate-900">The PM-X Mentorship Accelerator</h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto font-medium">
              Designed specifically for <span className="text-[#188ab2] underline decoration-[#188ab2]/30 underline-offset-8">non-PMs</span> who want to transition to Product Management.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            {[
              { title: "Personalized Coaching", desc: "Weekly 1:1 sessions to unblock your specific career challenges." },
              { title: "Real-World Projects", desc: "Build a portfolio of PM case studies using AI-driven tools." },
              { title: "Interview Guarantee", desc: "Mock interviews and referrals to land your first high-growth role." }
            ].map((card, i) => (
              <div key={i} className="bg-slate-50 p-10 rounded-2xl border border-slate-100 hover:border-[#188ab2]/40 transition-all group shadow-sm">
                <h3 className="text-xl font-bold mb-4 group-hover:text-[#188ab2] transition-colors">{card.title}</h3>
                <p className="text-slate-500 leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="mentors" className="py-24 bg-slate-50">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-16 text-slate-900">Meet the Mentors</h2>
          <div className="grid md:grid-cols-2 gap-10 max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm flex flex-col items-center">
              <div className="w-24 h-24 bg-slate-100 rounded-full mb-6 flex items-center justify-center border-2 border-white shadow-md">
                <User className="h-12 w-12 text-slate-400" />
              </div>
              <h3 className="text-2xl font-bold mb-1 text-slate-900">Sahil</h3>
              <p className="text-[#188ab2] text-sm font-bold uppercase tracking-widest mb-4">Lead Mentor</p>
              <p className="text-slate-500 leading-relaxed italic">"Helping professionals break barriers into product roles."</p>
            </div>
            <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm flex flex-col items-center">
              <div className="w-24 h-24 bg-slate-100 rounded-full mb-6 flex items-center justify-center border-2 border-white shadow-md">
                <User className="h-12 w-12 text-slate-400" />
              </div>
              <h3 className="text-2xl font-bold mb-1 text-slate-900">Ankit</h3>
              <p className="text-[#188ab2] text-sm font-bold uppercase tracking-widest mb-4">Growth Strategist</p>
              <p className="text-slate-500 leading-relaxed italic">"Mastering recruitment cycles for senior pivots."</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-16 text-slate-900">What Our Mentees Say</h2>
          <div className="grid md:grid-cols-3 gap-8 text-left">
            {[
              { name: "Bharat", text: "Stepsmart changed my career. They helped me figure out what to focus on." },
              { name: "Rohit", text: "Gave me step-by-step guidance and mock interviews that felt real." },
              { name: "Nishtha Jain", text: "Ankit helped me break down a vague case study into actionable chunks." }
            ].map((t, i) => (
              <div key={i} className="bg-slate-50 p-8 rounded-2xl border border-slate-100">
                <Quote className="text-[#188ab2]/20 h-10 w-10 mb-6" />
                <p className="text-slate-600 italic mb-8 leading-relaxed">"{t.text}"</p>
                <div className="font-bold text-slate-900">{t.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="enroll" className="py-24 bg-slate-900 text-white relative">
        <div className="container mx-auto px-6 max-w-6xl text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-12">Ready to Start Your Journey?</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
            <button 
              onClick={() => handleActionClick('brochure')}
              className={`flex flex-col items-center p-10 bg-slate-800 border-2 rounded-3xl transition-all group ${formIntent === 'brochure' ? 'border-[#188ab2]' : 'border-slate-700 hover:border-[#188ab2]/50'}`}
            >
              <Download className={`h-10 w-10 mb-4 group-hover:scale-110 transition-transform ${formIntent === 'brochure' ? 'text-[#188ab2]' : 'text-slate-400'}`} />
              <h3 className="text-xl font-bold mb-2 text-balance">Download Accelerator Brochure</h3>
              <p className="text-slate-400 text-sm">Get the curriculum and roadmap details.</p>
            </button>
            <button 
              onClick={() => handleActionClick('enroll')}
              className={`flex flex-col items-center p-10 bg-slate-800 border-2 rounded-3xl transition-all group ${formIntent === 'enroll' ? 'border-[#188ab2]' : 'border-slate-700 hover:border-[#188ab2]/50'}`}
            >
              <Briefcase className={`h-10 w-10 mb-4 group-hover:scale-110 transition-transform ${formIntent === 'enroll' ? 'text-[#188ab2]' : 'text-slate-400'}`} />
              <h3 className="text-xl font-bold mb-2 text-balance">Enroll for PM-X Accelerator</h3>
              <p className="text-slate-400 text-sm">Register for the next batch or masterclass.</p>
            </button>
          </div>

          <div id="form-container" className="max-w-xl mx-auto bg-white rounded-3xl p-8 md:p-12 text-slate-900 shadow-2xl scroll-mt-24">
            {enrollmentStatus === 'success' ? (
              <div className="text-center py-12">
                <div className="bg-green-100 text-green-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h3 className="text-3xl font-bold mb-4">{formIntent === 'brochure' ? "Brochure Ready!" : "Success!"}</h3>
                <p className="text-slate-600 mb-8">{formIntent === 'brochure' ? "Download started." : "We'll contact you soon."}</p>
                <Button variant="outline" className="w-full" onClick={() => setEnrollmentStatus('idle')}>Back</Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 text-left">
                <input type="hidden" {...register("intent")} />
                <div className="space-y-4">
                  <div>
                    <input {...register("fullName")} placeholder="Full Name" className="w-full px-5 py-4 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-[#188ab2]" />
                    {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName.message}</p>}
                  </div>
                  <div>
                    <input {...register("email")} type="email" placeholder="Email Address" className="w-full px-5 py-4 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-[#188ab2]" />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                  </div>
                  <div>
                    <input {...register("phone")} placeholder="WhatsApp Number" className="w-full px-5 py-4 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-[#188ab2]" />
                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
                  </div>
                </div>
                <Button type="submit" className="w-full py-5 text-xl font-bold" isLoading={enrollmentStatus === 'loading'}>
                  {formIntent === 'brochure' ? 'Get Brochure Now' : 'Join Accelerator Batch'}
                </Button>
              </form>
            )}
          </div>
        </div>
      </section>

      <footer className="bg-white py-12 border-t border-slate-100 text-center">
        <div className="container mx-auto px-6">
          <Logo className="h-10 mb-8 mx-auto justify-center" />
          <div className="flex justify-center gap-8 mb-8 text-slate-400">
            <a href="#" className="hover:text-[#188ab2] transition-colors"><Linkedin /></a>
            <a href="#" className="hover:text-[#188ab2] transition-colors"><Youtube /></a>
            <a href="mailto:administrator@stepsmart.net" className="hover:text-[#188ab2] transition-colors"><Mail /></a>
          </div>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">© 2026 StepSmart. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
