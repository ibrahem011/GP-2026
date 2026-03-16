with open(".env.local", "w") as f:
    f.write("""NEXT_PUBLIC_SUPABASE_URL=https://aaaaaaaabbbbbbbbcccc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhYWFhYWFiYmJiYmJiY2NjYyIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjU1NzE4MTAyLCJleHAiOjE5NzEyOTQxMDJ9.1234567890abcdef
NEXT_PUBLIC_IS_MOCK_MODE=true
""")
