export const supabaseUrl = 'https://wcphiwxhikfwoukxkyoh.supabase.co';
export const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjcGhpd3hoaWtmd291a3hreW9oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5MTExMDksImV4cCI6MjA4ODQ4NzEwOX0.yA-11KIct6XYa5W4vs0YcrUyGN57Jav3sr-lILDhVug';

export const supabase = window.supabase ? window.supabase.createClient(supabaseUrl, supabaseKey) : null;
