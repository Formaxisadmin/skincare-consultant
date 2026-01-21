'use client';

export default function Footer() {
  return (
    <footer className="bg-[var(--color-page-background)] border-t border-[var(--color-border-subtle)] mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-[rgba(92,64,51,0.6)]">
            © 2026 Atla Beauty. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-sm transition-colors" style={{ color: '#5C4033' }}>
              Privacy Policy
            </a>
            <a href="#" className="text-sm transition-colors" style={{ color: '#5C4033' }}>
              Terms of Use
            </a>
            <a href="#" className="text-sm transition-colors" style={{ color: '#5C4033' }}>
              Accessibility
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

