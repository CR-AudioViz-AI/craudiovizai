# Javari Core Principles - Supabase Deployment Instructions

**Timestamp:** 2025-11-01 17:10 UTC

---

## 🎯 Quick Deployment (5 Minutes)

### Step 1: Access Supabase SQL Editor

1. Go to: https://supabase.com/dashboard/project/kteobfyferrukqeolofj
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 2: Execute Migration

1. Copy the entire contents from:
   - **GitHub:** https://raw.githubusercontent.com/CR-AudioViz-AI/craudiovizai-website/main/docs/javari-core-principles-schema.sql
   
2. Paste into the SQL Editor

3. Click **Run** (or press Ctrl/Cmd + Enter)

### Step 3: Verify Deployment

After running, execute this verification query:

```sql
-- Verify all tables were created
SELECT 
    schemaname,
    tablename,
    CASE 
        WHEN tablename = 'customer_preferences' THEN '✅ Response Mode Settings'
        WHEN tablename = 'customer_projects' THEN '✅ Project Organization'
        WHEN tablename = 'customer_assets' THEN '✅ Auto-Save System'
        WHEN tablename = 'asset_version_history' THEN '✅ Version Tracking'
        WHEN tablename = 'auto_documentation' THEN '✅ Auto-Documentation'
        WHEN tablename = 'customer_secrets_vault' THEN '✅ Secrets Vault'
        WHEN tablename = 'secrets_access_log' THEN '✅ Audit Log'
        WHEN tablename = 'customer_important_dates' THEN '✅ Important Dates'
        WHEN tablename = 'error_accountability_log' THEN '✅ Error Tracking'
        WHEN tablename = 'customer_credit_ledger' THEN '✅ Credit Ledger'
        WHEN tablename = 'javari_task_log' THEN '✅ Task Transparency'
        ELSE tablename
    END as description
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'customer_preferences',
    'customer_projects',
    'customer_assets',
    'asset_version_history',
    'auto_documentation',
    'customer_secrets_vault',
    'secrets_access_log',
    'customer_important_dates',
    'error_accountability_log',
    'customer_credit_ledger',
    'javari_task_log'
)
ORDER BY tablename;
```

**Expected Result:** 11 tables listed

---

## 📊 What Gets Created

**11 Core Tables:**
1. ✅ customer_preferences (Response modes)
2. ✅ customer_projects (Project organization)
3. ✅ customer_assets (Auto-save)
4. ✅ asset_version_history (Versions)
5. ✅ auto_documentation (Auto-docs)
6. ✅ customer_secrets_vault (Encrypted secrets)
7. ✅ secrets_access_log (Audit trail)
8. ✅ customer_important_dates (Relationship dates)
9. ✅ error_accountability_log (Error tracking)
10. ✅ customer_credit_ledger (Auto-credits)
11. ✅ javari_task_log (Transparency)

**Additional Infrastructure:**
- 25+ Performance indexes
- 11 RLS policies per table
- 3 Custom ENUM types
- 6 Auto-update triggers
- 1 Auto-create function for new users

---

## ⚠️ Important Notes

1. **Idempotent:** Safe to run multiple times (uses `IF NOT EXISTS`)
2. **No data loss:** Only creates new structures
3. **Production-ready:** Includes all security (RLS) and performance (indexes)
4. **Auto-defaults:** New users automatically get 'balanced' response mode

---

## 🔍 Troubleshooting

**If you see errors:**

1. **"type already exists"** - Normal, means ENUMs already created
2. **"table already exists"** - Normal, migration is idempotent
3. **"permission denied"** - Ensure you're logged in as database owner

**All errors starting with "relation already exists" are safe to ignore.**

---

## ✅ Success Criteria

After deployment, verify:
- [ ] All 11 tables appear in Table Editor
- [ ] RLS is enabled (shield icon on each table)
- [ ] New auth users automatically get default preferences
- [ ] No build errors or warnings

---

## 🚀 Next Steps

After successful deployment:
1. Confirm completion
2. We'll proceed to Step 3: System Prompts Configuration
3. Then Step 4: UI Settings Panel

---

**Need help?** The SQL is fully documented with comments explaining each section.
