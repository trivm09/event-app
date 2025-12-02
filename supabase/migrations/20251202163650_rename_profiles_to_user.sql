/*
  # Rename Table: profiles → user

  ## Overview
  This migration renames the `profiles` table to `user` along with all dependent objects
  including indexes, triggers, functions, and RLS policies.

  ## PostgreSQL/Supabase Specifics
  This migration is written for PostgreSQL (used by Supabase). The syntax includes:
  - ALTER TABLE...RENAME TO for table renaming
  - Automatic renaming of associated indexes and constraints
  - Manual renaming of triggers and functions
  - Recreation of RLS policies with new table reference

  ## Changes Made
  1. Rename table: `profiles` → `user`
  2. Rename indexes to match new table name
  3. Drop and recreate triggers with new table reference
  4. Drop and recreate RLS policies referencing new table name
  5. Update trigger function to reference new table name

  ## Prerequisites & Warnings
  - **CRITICAL**: This will temporarily disable RLS policies during migration
  - **IMPORTANT**: All active connections using old table name will fail
  - **NOTE**: Application code must be updated simultaneously
  - **BACKUP**: Ensure recent backup exists before running
  - **DOWNTIME**: Consider maintenance window for production systems

  ## Impact Analysis
  - Foreign key from auth.users remains intact (auto-updated)
  - Existing data preserved (no data loss)
  - Application requires code update to reference 'user' table
  - Indexes automatically renamed by PostgreSQL
  - RLS policies must be recreated

  ## Rollback
  To rollback, run: ALTER TABLE "user" RENAME TO profiles;
  Then recreate policies with 'profiles' references
*/

-- Step 1: Rename the table
-- PostgreSQL automatically renames associated indexes
ALTER TABLE profiles RENAME TO "user";

-- Step 2: Rename indexes explicitly for clarity
ALTER INDEX IF EXISTS profiles_email_idx RENAME TO user_email_idx;
ALTER INDEX IF EXISTS profiles_is_admin_idx RENAME TO user_is_admin_idx;

-- Step 3: Drop old trigger (references old table name)
DROP TRIGGER IF EXISTS update_profiles_updated_at ON "user";

-- Step 4: Recreate trigger with new table name
CREATE TRIGGER update_user_updated_at
  BEFORE UPDATE ON "user"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Step 5: Drop old trigger for profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Step 6: Update the profile creation function to use new table name
CREATE OR REPLACE FUNCTION create_profile_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public."user" (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Recreate trigger with updated function
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_profile_for_new_user();

-- Step 8: Drop old RLS policies
DROP POLICY IF EXISTS "Users can view own profile" ON "user";
DROP POLICY IF EXISTS "Users can update own profile" ON "user";
DROP POLICY IF EXISTS "Users can create own profile" ON "user";
DROP POLICY IF EXISTS "Users can delete own profile" ON "user";

-- Step 9: Recreate RLS policies with new table reference
CREATE POLICY "Users can view own record"
  ON "user"
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own record"
  ON "user"
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id 
    AND is_admin = (SELECT is_admin FROM "user" WHERE id = auth.uid())
  );

CREATE POLICY "Users can create own record"
  ON "user"
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete own record"
  ON "user"
  FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

-- Verification: Confirm table exists with new name
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user'
  ) THEN
    RAISE EXCEPTION 'Table rename failed: user table does not exist';
  END IF;
  
  RAISE NOTICE 'Table successfully renamed from profiles to user';
END $$;
