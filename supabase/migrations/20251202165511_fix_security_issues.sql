/*
  # Fix Security and Performance Issues

  ## Overview
  This migration addresses critical security and performance issues identified in the database:
  1. Optimize RLS policies to prevent re-evaluation of auth functions
  2. Remove unused indexes
  3. Fix function search paths for security
  4. Update function implementations for better performance

  ## Security Issues Fixed
  
  ### 1. RLS Policy Optimization
  - Replace `auth.uid()` with `(SELECT auth.uid())` in all policies
  - This prevents re-evaluation for each row, improving performance at scale
  - Applies to: SELECT, INSERT, UPDATE, DELETE policies
  
  ### 2. Function Search Path Security
  - Add explicit schema qualification to prevent search_path attacks
  - Set stable search_path for security-sensitive functions
  - Applies to: update_updated_at_column, create_profile_for_new_user
  
  ### 3. Index Optimization
  - Remove unused indexes that add overhead without benefit
  - users_email_idx: Email uniqueness is already enforced by constraint
  - users_is_admin_idx: Low cardinality boolean doesn't benefit from index
  
  ## Performance Improvements
  - Reduced query planning overhead from RLS policies
  - Eliminated unnecessary index maintenance
  - Improved function execution security and stability
  
  ## Important Notes
  - All changes are backwards compatible
  - No data loss or schema changes
  - RLS remains fully functional with better performance
  - Functions retain same behavior with enhanced security
*/

-- =====================================================
-- STEP 1: Drop and Recreate RLS Policies with Optimized auth.uid()
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own record" ON users;
DROP POLICY IF EXISTS "Users can update own record" ON users;
DROP POLICY IF EXISTS "Users can create own record" ON users;
DROP POLICY IF EXISTS "Users can delete own record" ON users;

-- Recreate policies with optimized auth.uid() calls
-- Using (SELECT auth.uid()) prevents re-evaluation for each row

CREATE POLICY "Users can view own record"
  ON users
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = id);

CREATE POLICY "Users can update own record"
  ON users
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK (
    (SELECT auth.uid()) = id 
    AND is_admin = (SELECT is_admin FROM users WHERE id = (SELECT auth.uid()))
  );

CREATE POLICY "Users can create own record"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = id);

CREATE POLICY "Users can delete own record"
  ON users
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = id);

-- =====================================================
-- STEP 2: Remove Unused Indexes
-- =====================================================

-- Drop email index (uniqueness already enforced by UNIQUE constraint)
DROP INDEX IF EXISTS users_email_idx;

-- Drop is_admin index (low cardinality boolean field, not beneficial)
DROP INDEX IF EXISTS users_is_admin_idx;

-- =====================================================
-- STEP 3: Fix Function Search Paths for Security
-- =====================================================

-- Update update_updated_at_column with explicit schema and stable search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Update create_profile_for_new_user with explicit schema and stable search_path
CREATE OR REPLACE FUNCTION public.create_profile_for_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$;

-- =====================================================
-- STEP 4: Verification
-- =====================================================

DO $$
DECLARE
  policy_count INTEGER;
  index_count INTEGER;
BEGIN
  -- Verify all 4 RLS policies exist
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'users'
    AND policyname IN (
      'Users can view own record',
      'Users can update own record',
      'Users can create own record',
      'Users can delete own record'
    );
  
  IF policy_count != 4 THEN
    RAISE EXCEPTION 'Expected 4 RLS policies, found %', policy_count;
  END IF;
  
  -- Verify unused indexes are removed
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND tablename = 'users'
    AND indexname IN ('users_email_idx', 'users_is_admin_idx');
  
  IF index_count > 0 THEN
    RAISE EXCEPTION 'Unused indexes still exist: %', index_count;
  END IF;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Security fixes applied successfully:';
  RAISE NOTICE '  ✓ RLS policies optimized with (SELECT auth.uid())';
  RAISE NOTICE '  ✓ Unused indexes removed (2)';
  RAISE NOTICE '  ✓ Functions secured with stable search_path';
  RAISE NOTICE '  ✓ All % policies verified', policy_count;
  RAISE NOTICE '========================================';
END $$;
