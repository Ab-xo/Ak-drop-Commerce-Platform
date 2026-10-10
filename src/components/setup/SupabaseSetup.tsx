'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, ExternalLink, Copy, Check } from 'lucide-react';
import { useState } from 'react';

export default function SupabaseSetup() {
  const [copied, setCopied] = useState(false);

  const envTemplate = `# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Site Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(envTemplate);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary/20 px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-center mb-6"
          >
            {/* AK ECOMM Logo */}
            <div className="flex items-center">
              <div className="relative">
                <span className="text-3xl font-black tracking-tight text-foreground">A</span>
                <span className="text-3xl font-black tracking-tight text-foreground relative">
                  K
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary transform rotate-45"></div>
                </span>
              </div>
              <div className="w-px h-6 bg-border mx-3"></div>
              <span className="text-xl font-semibold tracking-wide text-foreground/90 uppercase">ECOMM</span>
            </div>
          </motion.div>
          
          <div className="flex items-center justify-center gap-3 mb-4">
            <AlertTriangle className="w-8 h-8 text-yellow-500" />
            <h1 className="text-2xl font-bold text-foreground">Setup Required</h1>
          </div>
          <p className="text-foreground/60">Supabase configuration needed to continue</p>
        </div>

        {/* Setup Instructions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-card border border-border rounded-2xl p-8 shadow-lg space-y-6"
        >
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Quick Setup Steps:</h2>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">1</div>
                <div>
                  <p className="font-medium">Create a Supabase Project</p>
                  <p className="text-sm text-foreground/60">Go to supabase.com and create a new project</p>
                  <a 
                    href="https://supabase.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline text-sm mt-1"
                  >
                    Open Supabase <ExternalLink size={14} />
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">2</div>
                <div>
                  <p className="font-medium">Get Your Credentials</p>
                  <p className="text-sm text-foreground/60">Go to Settings → API in your Supabase dashboard</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">3</div>
                <div className="flex-1">
                  <p className="font-medium">Update Environment Variables</p>
                  <p className="text-sm text-foreground/60 mb-3">Copy this template to your .env.local file:</p>
                  
                  <div className="relative">
                    <pre className="bg-background border border-border rounded-lg p-4 text-sm overflow-x-auto">
                      <code>{envTemplate}</code>
                    </pre>
                    <button
                      onClick={copyToClipboard}
                      className="absolute top-2 right-2 p-2 bg-foreground/10 hover:bg-foreground/20 rounded-md transition-colors"
                      title="Copy to clipboard"
                    >
                      {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">4</div>
                <div>
                  <p className="font-medium">Run the Database Schema</p>
                  <p className="text-sm text-foreground/60">Copy and run the SQL from supabase-schema.sql in your Supabase SQL Editor</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">5</div>
                <div>
                  <p className="font-medium">Restart the Development Server</p>
                  <p className="text-sm text-foreground/60">Stop and restart your Next.js development server</p>
                  <code className="inline-block bg-background border border-border rounded px-2 py-1 text-sm mt-1">
                    npm run dev
                  </code>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-6">
            <p className="text-sm text-foreground/60">
              Need help? Check out the{' '}
              <a href="/SETUP-UPDATED.md" className="text-primary hover:underline">
                detailed setup guide
              </a>
              {' '}for more information.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}