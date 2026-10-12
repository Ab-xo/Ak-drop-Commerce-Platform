"use server";

import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { z } from "zod";

const usernameSchema = z
  .string()
  .trim()
  .min(3, "Username must be at least 3 characters")
  .max(16, "Username must be less than 16 characters")
  .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores");

const signUpSchema = z
  .object({
    fullName: z.string().trim().min(2, "Full name must be at least 2 characters").max(80, "Full name is too long"),
    email: z.string().trim().toLowerCase().email("Please enter a valid email address"),
    username: usernameSchema,
    password: z
      .string()
      .min(10, "Password must be at least 10 characters")
      .regex(/[a-z]/, "Password must contain a lowercase letter")
      .regex(/[A-Z]/, "Password must contain an uppercase letter")
      .regex(/[0-9]/, "Password must contain a number")
      .regex(/[^a-zA-Z0-9]/, "Password must contain a special character"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

const signInSchema = z.object({
  email: z.string().trim().toLowerCase().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export async function signUp(formData: FormData) {
  const supabase = await createServerSupabaseClient();
  const rawFormData = {
    fullName: String(formData.get("fullName") ?? ""),
    email: String(formData.get("email") ?? ""),
    username: String(formData.get("username") ?? "").toLowerCase(),
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  };

  const validatedFields = signUpSchema.safeParse(rawFormData);
  if (!validatedFields.success) return { error: validatedFields.error.issues[0].message };

  const { fullName, email, username, password } = validatedFields.data;
  const { data: existingUser, error: lookupError } = await supabase
    .from("user_profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (lookupError) return { error: "Unable to check username availability. Please try again." };
  if (existingUser) return { error: "Username is already taken. Please choose another." };

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName, username } },
  });

  if (error) {
    if (error.message.toLowerCase().includes("already registered")) {
      return { error: "An account with this email already exists. Try signing in." };
    }
    return { error: error.message };
  }

  if (data.user) {
    const { error: profileError } = await supabase.from("user_profiles").upsert(
      {
        id: data.user.id,
        email: data.user.email,
        full_name: fullName,
        username,
        is_active: true,
      },
      { onConflict: "id" },
    );
    if (profileError) console.error("Profile creation error:", profileError.message);
  }

  redirect("/auth/verify-email");
}

export async function signIn(formData: FormData) {
  const supabase = await createServerSupabaseClient();
  const validatedFields = signInSchema.safeParse({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });

  if (!validatedFields.success) return { error: validatedFields.error.issues[0].message };

  const { error } = await supabase.auth.signInWithPassword(validatedFields.data);
  if (error) return { error: "Invalid email or password. Please try again." };
  redirect("/");
}

export async function signOut() {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("Sign out error:", error.message);
    return { error: "Unable to sign out. Please try again." };
  }
  redirect("/");
}

export async function signOutClient() {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signOut();
  return error ? { error: "Unable to sign out. Please try again." } : { success: true };
}
