/*
  # Rename Table: user → users

  ## Overview
  This migration renames the `user` table to `users` (pluralized for standard convention)
  along with all dependent objects including indexes, triggers, functions, and RLS policies.

  ## SQL Standard Syntax
  PostgreSQL (Supabase): ALTER TABLE "user" RENAME TO users;
  MySQL: RENAME TABLE `user` TO `users`;
  SQL Server: EXEC sp_rename 'user', 'users';
  
  ## Important Considerations
  1. Data Integrity: All data is preserved during rename (zero data loss)
  2. Foreign Keys: PostgreSQL automatically updates foreign key references
  3. Active Connections: Queries using old table name will fail immediately
  4. Indexes: PostgreSQL automatically renames associated indexes
  5. Triggers/Functions: Must be manually updated to reference new table name
  6. RLS Policies: Must be dropped and recreated with new table reference
  7. Application Code: Must be updated simultaneously with migration
  8. Reserved Keywords: "users" is not a reserved word, no quotes needed

  ## Changes Made
  1. Rename table: `user` → `users`
  2. Rename indexes to match new table name
  3. Drop and recreate triggers with new table reference
  4. Drop and recreate RLS policies referencing new table name
  5. Update trigger function to reference new table name

  ## Rollback Command
  To rollback: ALTER TABLE users RENAME TO "user";
*/

-- Step 1: Rename the table
-- PostgreSQL syntax (used by Supabase)
ALTER TABLE "user" RENAME TO users;

-- Note: Alternative syntaxes for other database systems:
-- MySQL: RENAME TABLE `user` TO `users`;
-- SQL Server: EXEC sp_rename 'dbo.user', 'users';
-- Oracle: ALTER TABLE "user" RENAME TO users;

-- Step 2: Rename indexes to match convention
ALTER INDEX IF EXISTS user_email_idx RENAME TO users_email_idx;
ALTER INDEX IF EXISTS user_is_admin_idx RENAME TO users_is_admin_idx;

-- Step 3: Drop old trigger
DROP TRIGGER IF EXISTS update_user_updated_at ON users;

-- Step 4: Recreate trigger with new table name
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Step 5: Drop and recreate the profile creation trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Step 6: Update the profile creation function to use new table name
CREATE OR REPLACE FUNCTION create_profile_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_profile_for_new_user();

-- Step 8: Drop old RLS policies
DROP POLICY IF EXISTS "Users can view own record" ON users;
DROP POLICY IF EXISTS "Users can update own record" ON users;
DROP POLICY IF EXISTS "Users can create own record" ON users;
DROP POLICY IF EXISTS "Users can delete own record" ON users;

-- Step 9: Recreate RLS policies with new table reference
CREATE POLICY "Users can view own record"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own record"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id 
    AND is_admin = (SELECT is_admin FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Users can create own record"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete own record"
  ON users
  FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

-- Step 10: Verification
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'users'
  ) THEN
    RAISE EXCEPTION 'Table rename failed: users table does not exist';
  END IF;
  
  -- Verify RLS is still enabled
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'users' 
    AND rowsecurity = true
  ) THEN
    RAISE EXCEPTION 'RLS is not enabled on users table';
  END IF;
  
  RAISE NOTICE 'Table successfully renamed from user to users with all dependencies updated';
END $$;
