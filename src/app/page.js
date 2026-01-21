'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Brain, Sparkles, Target, Shield, ArrowRight, CheckCircle, Clock, Award, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ImageWithFallback } from '@/components/ui/ImageWithFallback';

const readSavedProgressStatus = () => {
  if (typeof window === 'undefined') return false;
  try {
    const savedProgress = localStorage.getItem('questionnaire-progress');
    if (!savedProgress) return false;
    const parsed = JSON.parse(savedProgress);
    const hasResponses = parsed?.responses && Object.keys(parsed.responses).length > 0;
    const hasStep = typeof parsed?.step === 'number' && parsed.step > 0;
    return Boolean(hasResponses || hasStep);
  } catch (error) {
    return false;
  }
};

export default function HomePage() {
  const router = useRouter();
  const [hasSavedProgress, setHasSavedProgress] = useState(false);
  const [resumePromptOpen, setResumePromptOpen] = useState(false);

  const refreshSavedProgress = useCallback(() => {
    setHasSavedProgress(readSavedProgressStatus());
  }, []);

  useEffect(() => {
    refreshSavedProgress();
  }, [refreshSavedProgress]);

  const handleStartClick = () => {
    const latest = readSavedProgressStatus();
    setHasSavedProgress(latest);
    if (latest) {
      setResumePromptOpen(true);
    } else {
      router.push('/consultation');
    }
  };

  const handleContinue = () => {
    setResumePromptOpen(false);
    router.push('/consultation');
  };

  const handleStartNew = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('questionnaire-progress');
      localStorage.removeItem('questionnaire-consultation-id');
    }
    setResumePromptOpen(false);
    router.push('/consultation');
  };

  return (
    <div>
      {/* Hero Section */}
      <section
        className="relative overflow-hidden bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: 'url(/atla%20method%20page%20image.png)',
          minHeight: '600px'
        }}
      >
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-black/20"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="max-w-xl">
            {/* Badge - Separate from white background */}
            <div className="mb-4">
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full"
                style={{
                  backgroundColor: 'var(--color-base-white)',
                  border: '1px solid var(--color-border-subtle)',
                }}
              >
                <Sparkles size={14} style={{ color: 'var(--color-action-primary)' }} />
                <span className="text-xs" style={{ color: 'var(--color-text-primary)' }}>Intelligent Skincare Analysis</span>
              </div>
            </div>
            
            {/* Text Content with white background */}
            <div className="flex flex-col justify-center gap-3 bg-white rounded-lg p-7 shadow-lg">
              {/* Heading & Subheading Container */}
              <div className="flex flex-col gap-2.5">
                <h1 style={{ color: 'var(--color-text-primary)' }} className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
                  Your Personal<br />Skincare Guide
                </h1>
                
                <p className="text-lg opacity-90 max-w-lg" style={{ color: 'var(--color-text-primary)' }}>
                  Get a hyper-personalized skincare routine. Our advanced system analyzes 12+ skin
                  factors and explains exactly why each product was chosen for you.
                </p>
              </div>
              
              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 mt-1">
                <button
                  onClick={handleStartClick}
                  className="group px-7 py-3.5 rounded uppercase tracking-wider flex items-center justify-center gap-2 hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 text-sm"
                  style={{
                    backgroundColor: 'var(--color-action-primary)',
                    color: 'var(--color-text-on-action)',
                    fontWeight: 700,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-action-hover)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-action-primary)';
                  }}
                >
                  Start Free Analysis
                  <ArrowRight
                    size={18}
                    className="transform group-hover:translate-x-1 transition-transform"
                  />
                </button>
                <Link
                  href="/view-report"
                  className="px-7 py-3.5 rounded uppercase tracking-wider flex items-center justify-center gap-2 hover:shadow-lg transition-all duration-300 text-sm"
                  style={{
                    backgroundColor: 'transparent',
                    color: 'var(--color-text-primary)',
                    border: '2px solid var(--color-text-primary)',
                    fontWeight: 700,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                    e.currentTarget.style.transform = 'translateY(-4px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <FileText size={18} />
                  VIEW SAVED REPORTS
                </Link>
              </div>
              
              {/* Trust Indicators Container */}
              <div className="flex flex-col gap-2 mt-1">
                <div className="flex items-center gap-5 flex-wrap">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={18} style={{ color: 'var(--color-action-primary)' }} />
                    <span className="text-xs" style={{ color: 'var(--color-text-primary)' }}>Free Consultation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={18} style={{ color: 'var(--color-action-primary)' }} />
                    <span className="text-xs" style={{ color: 'var(--color-text-primary)' }}>3~Minute Quiz</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award size={18} style={{ color: 'var(--color-action-primary)' }} />
                    <span className="text-xs" style={{ color: 'var(--color-text-primary)' }}>Personalized Results</span>
                  </div>
                </div>
                
                {/* Disclaimer */}
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg max-w-lg mt-1">
                  <div className="flex items-start gap-2.5">
                    <Shield size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-amber-900 mb-1">Important Disclaimer</p>
                      <p className="text-xs text-amber-800 leading-relaxed">
                        The recommendations provided are <strong>not a medical prescription</strong>. They are suggestions based on your questionnaire responses and are for informational purposes only. Please consult a dermatologist or healthcare provider for medical advice.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20" style={{ backgroundColor: 'var(--color-base-white)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* FIX: Centering logic applied to container */}
          <div className="flex flex-col items-center text-center mb-8 gap-3">
            <h2 className="text-4xl font-bold" style={{ color: 'var(--color-text-primary)' }}>How It Works</h2>
            {/* FIX: Explicitly centered subheading */}
            <p className="text-xl opacity-70 max-w-2xl mx-auto text-center" style={{ color: 'var(--color-text-primary)' }}>
              Smart analysis meets personalized recommendations
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <StepCard
              number="01"
              icon={<Target size={32} style={{ color: 'var(--color-action-primary)' }} />}
              title="Answer Questions"
              description="Tell us about your skin type, concerns, lifestyle, and goals through a quick and easy quiz."
            />

            <StepCard
              number="02"
              icon={<Brain size={32} style={{ color: 'var(--color-action-primary)' }} />}
              title="Smart Analysis"
              description="Our algorithm analyzes 12+ factors including compatibility, ingredient interactions, and concern priorities."
            />

            <StepCard
              number="03"
              icon={<Sparkles size={32} style={{ color: 'var(--color-action-primary)' }} />}
              title="Get Your Routine"
              description="Receive a personalized morning & evening routine with detailed explanations for every product choice."
            />
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20" style={{ backgroundColor: 'var(--color-tint-rose-warm)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div
              className="rounded-2xl overflow-hidden shadow-xl"
              style={{ border: '8px solid var(--color-base-white)' }}
            >
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1760960067586-3999b9aae844?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxza2luY2FyZSUyMGxhYm9yYXRvcnklMjBzY2llbmNlfGVufDF8fHx8MTc2NDA2ODU1MXww&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Skincare science"
                className="w-full h-[400px] object-cover"
              />
            </div>
            {/* FIX: Using flex-col with explicit gap for separation */}
            <div className="flex flex-col gap-5">
              <h2 className="text-4xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Why Atla Beauty Is Different</h2>
              
              <div className="flex flex-col gap-4">
                <FeatureItem
                  icon={<Shield size={24} style={{ color: 'var(--color-action-primary)' }} />}
                  title="Transparent & Educational"
                  description="We don't just recommend products—we explain the science behind every choice so you understand your skin."
                />
                
                <FeatureItem
                  icon={<Brain size={24} style={{ color: 'var(--color-action-primary)' }} />}
                  title="Smart Compatibility Checks"
                  description="Our system checks ingredient compatibility to help avoid potential irritation or conflicts between products."
                />
                
                <FeatureItem
                  icon={<Target size={24} style={{ color: 'var(--color-action-primary)' }} />}
                  title="Priority-Based Approach"
                  description="We tackle your biggest concern first, then layer in secondary goals for maximum effectiveness."
                />
              </div>

              <div className="mt-2">
                <button
                  onClick={handleStartClick}
                  className="px-8 py-4 rounded uppercase tracking-wider hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300"
                style={{
                  backgroundColor: 'var(--color-action-primary)',
                  color: 'var(--color-text-on-action)',
                  fontWeight: 700,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-action-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-action-primary)';
                }}
              >
                  Get My Routine Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20" style={{ backgroundColor: 'var(--color-base-white)', display: 'none' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 gap-2 flex flex-col">
            <h2 className="text-4xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Real Results, Real People</h2>
            <p className="text-xl opacity-70" style={{ color: 'var(--color-text-primary)' }}>See what our customers are saying</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <TestimonialCard
              quote="The 'Why This?' explanations changed everything. I finally understand what my skin needs."
              author="Sarah M."
              concern="Acne & Dark Spots"
            />

            <TestimonialCard
              quote="After years of trial and error, this gave me a routine that actually works. The results are visible!"
              author="Jessica L."
              concern="Anti-Aging"
            />

            <TestimonialCard
              quote="I love that it's not overwhelming. Just the essentials, explained perfectly."
              author="Maya P."
              concern="Sensitive Skin"
            />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section
        className="py-20"
        style={{ backgroundColor: 'var(--color-tint-lilac-cool)' }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center gap-4">
          <h2 className="text-4xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Ready to Find Your Skincare Routine?</h2>
          <p className="text-xl opacity-80" style={{ color: 'var(--color-text-primary)' }}>
            Join thousands who have discovered their personalized skincare routine
          </p>
          <button
            onClick={handleStartClick}
            className="px-12 py-5 rounded uppercase tracking-wider hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-lg"
            style={{
              backgroundColor: 'var(--color-action-primary)',
              color: 'var(--color-text-on-action)',
              fontWeight: 700,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-action-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-action-primary)';
            }}
          >
            Start Your Free Analysis
          </button>
          <p className="text-sm opacity-60" style={{ color: 'var(--color-text-primary)' }}>No credit card required • Takes 3-5 minutes</p>
        </div>
      </section>

      {/* Resume Dialog */}
      <Dialog open={resumePromptOpen} onOpenChange={setResumePromptOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Continue where you left off?</DialogTitle>
            <DialogDescription>
              We found a saved consultation from your last visit. Pick up where you left off or start fresh.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              onClick={handleStartNew}
              className="px-5 py-2.5 rounded-lg border-2 font-semibold transition-colors"
              style={{ 
                borderColor: '#5C4033',
                color: '#5C4033',
                backgroundColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(92, 64, 51, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              Start New
            </button>
            <button
              onClick={handleContinue}
              className="px-5 py-2.5 rounded-lg bg-[var(--color-action-primary)] text-white font-semibold hover:shadow-lg transition-all"
              style={{ backgroundColor: 'var(--color-action-primary)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-action-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-action-primary)';
              }}
            >
              Continue
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper Components

function StepCard({ number, icon, title, description }) {
  return (
    <div
      className="p-8 rounded-xl text-center relative group hover:shadow-xl transition-all duration-300"
      style={{
        backgroundColor: 'var(--color-base-white)',
        border: '2px solid var(--color-border-subtle)',
      }}
    >
      <div
        className="absolute -top-4 left-8 px-4 py-1 rounded-full text-sm"
        style={{
          backgroundColor: 'var(--color-action-primary)',
          color: 'var(--color-text-on-action)',
          fontWeight: 700,
        }}
      >
        {number}
      </div>
      
      <div className="mb-4 flex justify-center transform group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      
      <h3 className="mb-4 text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{title}</h3>
      <p className="opacity-70 mt-2" style={{ color: 'var(--color-text-primary)' }}>{description}</p>
    </div>
  );
}

function FeatureItem({ icon, title, description }) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 mt-1">{icon}</div>
      <div>
        <h4 className="mb-3 text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{title}</h4>
        <p className="opacity-70 mt-2" style={{ color: 'var(--color-text-primary)' }}>{description}</p>
      </div>
    </div>
  );
}

function TestimonialCard({ quote, author, concern }) {
  return (
    <div
      className="p-8 rounded-xl hover:shadow-xl transition-all duration-300"
      style={{
        backgroundColor: 'var(--color-base-white)',
        border: '1px solid var(--color-border-subtle)',
      }}
    >
      <div className="mb-6">
        <div className="flex gap-1 mb-4">
          {[...Array(5)].map((_, i) => (
            <span key={i} style={{ color: 'var(--color-action-primary)' }}>★</span>
          ))}
        </div>
        <p className="italic" style={{ color: 'var(--color-text-primary)' }}>"{quote}"</p>
      </div>
      
      <div>
        <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{author}</div>
        <div className="text-sm opacity-60" style={{ color: 'var(--color-text-primary)' }}>{concern}</div>
      </div>
    </div>
  );
}
