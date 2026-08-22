DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename LOOP
    RAISE NOTICE '%', r.tablename;
  END LOOP;
END $$;
