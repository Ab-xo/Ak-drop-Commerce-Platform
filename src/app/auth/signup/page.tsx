'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Eye, EyeOff, User, Mail, Lock, UserCheck } from 'lucide-react';
import { signUp } from '@/lib/auth-actions';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function SignUpPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true);
    
    try {
      const result = await signUp(formData);
      
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success('Account created successfully! Please check your email to verify your account.');
      }
    } catch (error) {
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        toast.error(error.message || 'Failed to sign up with Google. Please try again.');
        setIsGoogleLoading(false);
      }
      // On success, Supabase redirects the browser — no need to reset loading
    } catch (error) {
      toast.error('Failed to sign up with Google. Please try again.');
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary/20 px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
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
          
          <h1 className="text-2xl font-bold text-foreground mb-2">Create Your Account</h1>
          <p className="text-foreground/60">Join AK ECOMM and discover premium products</p>
        </div>

        {/* Sign Up Form */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-card border border-border rounded-2xl p-8 shadow-lg"
        >
          <form action={handleSubmit} className="space-y-6">
            {/* Full Name */}
            <div className="space-y-2">
              <label htmlFor="fullName" className="text-sm font-medium text-foreground">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground/40" size={20} />
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="Enter your full name"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground/40" size={20} />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Username */}
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium text-foreground">
                Username
              </label>
              <div className="relative">
                <UserCheck className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground/40" size={20} />
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="Choose a username"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground/40" size={20} />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="w-full pl-10 pr-12 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="Create a password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-foreground/40 hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground/40" size={20} />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  className="w-full pl-10 pr-12 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-foreground/40 hover:text-foreground transition-colors"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-primary-foreground py-3 px-4 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-border"></div>
            <span className="px-4 text-sm text-foreground/60">or</span>
            <div className="flex-1 border-t border-border"></div>
          </div>

          {/* Google Sign Up */}
          <button
            onClick={handleGoogleSignUp}
            disabled={isGoogleLoading}
            className="w-full flex items-center justify-center gap-3 bg-background border border-border py-3 px-4 rounded-lg font-medium hover:bg-foreground/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {isGoogleLoading ? 'Signing up...' : 'Continue with Google'}
          </button>

          {/* Sign In Link */}
          <p className="mt-6 text-center text-sm text-foreground/60">
            Already have an account?{' '}
            <Link href="/auth/signin" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}