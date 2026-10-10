'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { User as SupabaseUser } from '@supabase/supabase-js';
import type { UserProfile } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { updateProfile } from '@/lib/actions/profile-actions';
import { 
  User, Mail, Phone, MapPin, Calendar, 
  Shield, Award, Edit3, Camera, Save, X
} from 'lucide-react';

interface ProfileSectionProps {
  user: SupabaseUser;
  profile: UserProfile | null;
}

export default function ProfileSection({ user, profile }: ProfileSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentProfile, setCurrentProfile] = useState(profile);
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    username: profile?.username || '',
    phone: profile?.phone || '',
    date_of_birth: profile?.date_of_birth || '',
    gender: profile?.gender || '',
  });

  const displayName = currentProfile?.full_name || user.user_metadata?.full_name || 'User';
  const avatarUrl = currentProfile?.avatar_url || user.user_metadata?.avatar_url;
  const memberSince = new Date(user.created_at || '').toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  });

  const handleSave = async () => {
    // Simple validation
    if (!formData.full_name || formData.full_name.trim().length < 2) {
      toast.error('Please enter a valid full name');
      return;
    }

    if (formData.username && formData.username.trim().length < 3) {
      toast.error('Username must be at least 3 characters');
      return;
    }

    setLoading(true);
    try {
      const result = await updateProfile(formData);
      
      if (result.error) {
        toast.error(result.error);
      } else {
        // Update local state immediately
        const updatedProfile = {
          ...currentProfile,
          ...formData,
          updated_at: new Date().toISOString(),
        };
        setCurrentProfile(updatedProfile);
        
        toast.success('Profile updated successfully! 🎉');
        setIsEditing(false);
        
        // Trigger a custom event to update navbar
        window.dispatchEvent(new CustomEvent('profileUpdated', {
          detail: updatedProfile
        }));
      }
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = () => {
    const parts = displayName.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0][0].toUpperCase();
  };

  const profileInfo = [
    {
      icon: User,
      label: 'Full Name',
      value: formData.full_name || 'Not set',
      color: 'from-purple-500/20 to-purple-600/10',
      iconColor: 'text-purple-400',
      editable: true,
      field: 'full_name',
      type: 'text',
      placeholder: 'Enter your full name',
    },
    {
      icon: User,
      label: 'Username',
      value: formData.username || 'Not set',
      color: 'from-blue-500/20 to-blue-600/10',
      iconColor: 'text-blue-400',
      editable: true,
      field: 'username',
      type: 'text',
      placeholder: 'Choose a username',
    },
    {
      icon: Mail,
      label: 'Email Address',
      value: user.email,
      color: 'from-cyan-500/20 to-cyan-600/10',
      iconColor: 'text-cyan-400',
      editable: false,
      field: 'email',
    },
    {
      icon: Phone,
      label: 'Phone Number',
      value: formData.phone || 'Not set',
      color: 'from-green-500/20 to-green-600/10',
      iconColor: 'text-green-400',
      editable: true,
      field: 'phone',
      type: 'tel',
      placeholder: '+1 (555) 000-0000',
    },
    {
      icon: Calendar,
      label: 'Date of Birth',
      value: formData.date_of_birth ? new Date(formData.date_of_birth).toLocaleDateString() : 'Not set',
      color: 'from-orange-500/20 to-orange-600/10',
      iconColor: 'text-orange-400',
      editable: true,
      field: 'date_of_birth',
      type: 'date',
    },
    {
      icon: User,
      label: 'Gender',
      value: formData.gender || 'Not set',
      color: 'from-pink-500/20 to-pink-600/10',
      iconColor: 'text-pink-400',
      editable: true,
      field: 'gender',
      type: 'select',
      options: ['Male', 'Female', 'Other', 'Prefer not to say'],
    },
  ];

  const achievements = [
    { icon: Shield, label: 'Verified Account', value: user.email_confirmed_at ? 'Active' : 'Pending', active: !!user.email_confirmed_at },
    { icon: Award, label: 'Premium Member', value: 'Active', active: true },
  ];

  return (
    <div className="space-y-6">
      {/* Profile Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl"
        style={{
          background: 'linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--secondary)) 100%)',
          border: '1px solid hsl(var(--border))',
        }}
      >
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl" />

        <div className="relative p-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Avatar */}
            <div className="relative group">
              {avatarUrl && !imageError ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-32 h-32 rounded-2xl object-cover shadow-2xl ring-4 ring-primary/20"
                  referrerPolicy="no-referrer"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-4xl font-bold text-white shadow-2xl ring-4 ring-primary/20">
                  {getInitials()}
                </div>
              )}
              
              {/* Camera overlay on hover */}
              <button className="absolute inset-0 bg-black/60 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="text-white" size={32} />
              </button>
            </div>

            {/* User Info */}
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-3xl font-bold text-foreground mb-2">
                {displayName}
              </h2>
              <p className="text-muted-foreground mb-4">{user.email}</p>
              
              {/* Achievement Badges */}
              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                {achievements.map((achievement, i) => {
                  const Icon = achievement.icon;
                  return (
                    <div
                      key={i}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        achievement.active
                          ? 'bg-green-500/10 text-green-500 ring-1 ring-green-500/20'
                          : 'bg-orange-500/10 text-orange-500 ring-1 ring-orange-500/20'
                      }`}
                    >
                      <Icon size={14} />
                      {achievement.label}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Edit Button */}
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
                isEditing
                  ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
                  : 'bg-primary text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/25'
              }`}
            >
              {isEditing ? (
                <>
                  <X size={18} />
                  Cancel
                </>
              ) : (
                <>
                  <Edit3 size={18} />
                  Edit Profile
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Profile Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {profileInfo.map((info, index) => {
          const Icon = info.icon;
          return (
            <motion.div
              key={info.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              className="relative group"
            >
              <div className="glass-card hover:shadow-xl transition-all">
                {/* Gradient background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${info.color} opacity-50 rounded-2xl`} />
                
                <div className="relative flex items-start gap-4">
                  {/* Icon */}
                  <div className="p-3 bg-background/50 rounded-xl">
                    <Icon size={24} className={info.iconColor} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground font-medium mb-1">
                      {info.label}
                    </p>
                    {isEditing && info.editable ? (
                      info.type === 'select' ? (
                        <select
                          value={formData[info.field as keyof typeof formData]}
                          onChange={(e) => setFormData(prev => ({ ...prev, [info.field as string]: e.target.value }))}
                          className="w-full px-3 py-2 bg-background/80 border border-border rounded-lg text-sm font-semibold text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                        >
                          <option value="">Select {info.label}</option>
                          {info.options?.map(opt => (
                            <option key={opt} value={opt.toLowerCase()}>{opt}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={info.type || 'text'}
                          value={formData[info.field as keyof typeof formData]}
                          onChange={(e) => setFormData(prev => ({ ...prev, [info.field as string]: e.target.value }))}
                          placeholder={info.placeholder}
                          className="w-full px-3 py-2 bg-background/80 border border-border rounded-lg text-sm font-semibold text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                        />
                      )
                    ) : (
                      <p className="text-base font-semibold text-foreground truncate">
                        {info.value}
                      </p>
                    )}
                  </div>

                  {/* Edit indicator */}
                  {info.editable && isEditing && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="p-1.5 bg-primary/10 rounded-lg"
                    >
                      <Edit3 size={14} className="text-primary" />
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Member Since Card (separate, non-editable) */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-card border-primary/20"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-xl">
            <Calendar className="text-primary" size={20} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-0.5">
              Member Since
            </p>
            <p className="text-lg font-bold text-foreground">
              {memberSince}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Save Button (shown when editing) */}
      {isEditing && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-end gap-3"
        >
          <button
            onClick={() => {
              setIsEditing(false);
              setFormData({
                full_name: currentProfile?.full_name || '',
                username: currentProfile?.username || '',
                phone: currentProfile?.phone || '',
                date_of_birth: currentProfile?.date_of_birth || '',
                gender: currentProfile?.gender || '',
              });
            }}
            className="px-6 py-3 bg-secondary text-secondary-foreground rounded-xl font-medium hover:opacity-80 transition-all flex items-center gap-2"
            disabled={loading}
          >
            <X size={18} />
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-all shadow-lg shadow-primary/25 flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Save size={18} />
                </motion.div>
                Saving...
              </>
            ) : (
              <>
                <Save size={18} />
                Save Changes
              </>
            )}
          </button>
        </motion.div>
      )}

      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card"
      >
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Award className="text-primary" size={20} />
          Account Insights
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Profile Completion', value: '85%', color: 'text-blue-400' },
            { label: 'Total Orders', value: '12', color: 'text-green-400' },
            { label: 'Loyalty Points', value: '450', color: 'text-purple-400' },
            { label: 'Reviews Given', value: '8', color: 'text-orange-400' },
          ].map((stat, i) => (
            <div key={i} className="text-center p-4 bg-secondary/30 rounded-xl">
              <p className={`text-2xl font-bold ${stat.color} mb-1`}>
                {stat.value}
              </p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
