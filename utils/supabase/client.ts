import { createBrowserClient } from "@supabase/ssr";

const getEnv = (key: string): string => {
  if (typeof import.meta !== "undefined" && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key];
  }
  const proc = (globalThis as any).process;
  if (proc?.env && proc.env[key]) {
    return proc.env[key];
  }
  return "";
};

const supabaseUrl =
  getEnv("NEXT_PUBLIC_SUPABASE_URL") ||
  getEnv("VITE_SUPABASE_URL") ||
  "https://gvsfmatvpoinnkipcyjh.supabase.co";

const supabaseKey =
  getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY") ||
  getEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY") ||
  getEnv("VITE_SUPABASE_ANON_KEY") ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2c2ZtYXR2cG9pbm5raXBjeWpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM2NTI0OTcsImV4cCI6MjEwOTIyODQ5N30.GRWgfB3HnK-zTCMrkr8ug66FXD9X2A49K1X_NvY7fKo";

export const createClient = () =>
  createBrowserClient(supabaseUrl, supabaseKey);
