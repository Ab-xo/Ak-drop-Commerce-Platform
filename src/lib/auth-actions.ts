"use server";

import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { z } from "zod";

// Validation schemas
const signUpSchema = z
  .object({
    fullName: z.string().min(2, "Full name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(16, "Username must be less than 16 characters"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

const signInSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export async function signUp(formData: FormData) {
  const supabase = await createServerSupabaseClient();

  const rawFormData = {
    fullName: formData.get("fullName") as string,
    email: formData.get("email") as string,
    username: formData.get("username") as string,
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirmPassword") as string,
  };

  // Validate form data
  const validatedFields = signUpSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.issues[0].message,
    };
  }

  const { fullName, email, username, password } = validatedFields.data;

  // Check if username already exists
  const { data: existingUser } = await supabase
    .from("user_profiles")
    .select("username")
    .eq("username", username)
    .single();

  if (existingUser) {
    return {
      error: "Username is already taken. Please choose another.",
    };
  }

  // Sign up user
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        username: username,
      },
    },
  });

  if (error) {
    return {
      error: error.message,
    };
  }

  // Update user profile with username and full name
  if (data.user) {
    await supabase
      .from("user_profiles")
      .upsert({
        user_id: data.user.id,
        email: data.user.email,
        full_name: fullName,
        username,
      })
      .eq("user_id", data.user.id);
  }

  redirect("/auth/verify-email");
}

export async function signIn(formData: FormData) {
  const supabase = await createServerSupabaseClient();

  const rawFormData = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  // Validate form data
  const validatedFields = signInSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.issues[0].message,
    };
  }

  const { email, password } = validatedFields.data;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      error: "Invalid email or password. Please try again.",
    };
  }

  redirect("/");
}

export async function signOut() {
  const supabase = await createServerSupabaseClient();
  
  // Sign out from Supabase
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    console.error("Sign out error:", error);
    return { error: error.message };
  }
  
  // Redirect to home page
  redirect("/");
}

export async function signOutClient() {
  // This is a server action that will be called from client components
  // It properly handles the sign-out and clears all session data
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  
  return { success: true };
}
