import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xzdpfnyvsgzdiuuamujv.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6ZHBmbnl2c2d6ZGl1dWFtdWp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1MDQ1MjcsImV4cCI6MjA4NjA4MDUyN30.7Q3lwaHB_gsbP5f62261hLwloGpbFglNnKlsEDnhO7U'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
