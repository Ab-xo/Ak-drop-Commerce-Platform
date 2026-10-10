'use client';

import { motion } from 'framer-motion';
import { Mail, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary/20 px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md text-center"
      >
        {/* Success Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="flex justify-center mb-6"
        >
          <div className="relative">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
              <Mail className="w-12 h-12 text-primary" />
            </div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
          </div>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-card border border-border rounded-2xl p-8 shadow-lg"
        >
          <h1 className="text-2xl font-bold text-foreground mb-4">
            Check Your Email
          </h1>
          
          <p className="text-foreground/60 mb-6">
            We've sent a verification link to your email address. 
            Please click the link in the email to verify your account and complete the signup process.
          </p>

          <div className="bg-background border border-border rounded-lg p-4 mb-6">
            <p className="text-sm text-foreground/80">
              <strong className="text-foreground">Didn't receive the email?</strong>
              <br />
              Check your spam folder or wait a few minutes. It might take up to 5 minutes to arrive.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Link
              href="/auth/signin"
              className="block w-full bg-primary text-primary-foreground py-3 px-4 rounded-lg font-semibold hover:opacity-90 transition-opacity"
            >
              Go to Sign In
            </Link>
            
            <Link
              href="/"
              className="block w-full bg-background border border-border text-foreground py-3 px-4 rounded-lg font-medium hover:bg-foreground/5 transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </motion.div>

        {/* Additional Help */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-6 text-sm text-foreground/60"
        >
          Need help?{' '}
          <Link href="/contact" className="text-primary hover:underline">
            Contact Support
          </Link>
        </motion.p>
      </motion.div>
    </div>
  );
}
