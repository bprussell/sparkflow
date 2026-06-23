import React from "react";
import { Sparkles } from "lucide-react";

export default function AuthLayout({ icon: Icon, title, subtitle, footer, children }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: 'linear-gradient(135deg, #050d1a 0%, #0a1628 40%, #0d1f38 70%, #081420 100%)' }}
    >
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-10">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #3b82f6, #06b6d4)' }}>
            <Sparkles className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="font-heading font-800 text-white text-xl tracking-tight">Idea Pipeline</span>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)' }}
        >
          <div className="text-center mb-8">
            <div
              className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
            >
              <Icon className="w-6 h-6 text-white" aria-hidden="true" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">{title}</h1>
            {subtitle && <p className="text-white/50 mt-1.5 text-sm">{subtitle}</p>}
          </div>
          {children}
        </div>

        {footer && (
          <p className="text-center text-sm text-white/40 mt-6">{footer}</p>
        )}
      </div>
    </div>
  );
}