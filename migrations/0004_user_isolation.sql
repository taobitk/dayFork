-- DayFork User Isolation: Associate opportunities & ai_paths with user_id

-- 1. Add user_id column to opportunities
ALTER TABLE opportunities ADD COLUMN user_id TEXT REFERENCES users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_opportunities_user_date ON opportunities(user_id, date);

-- 2. Clean up unassociated orphaned opportunities from single-user phase
DELETE FROM branches WHERE opportunity_id IN (SELECT id FROM opportunities WHERE user_id IS NULL);
DELETE FROM opportunities WHERE user_id IS NULL;

-- 3. Recreate ai_paths with user_id and composite UNIQUE(user_id, date, perspective)
CREATE TABLE IF NOT EXISTS ai_paths_new (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    perspective TEXT NOT NULL,
    branch_selections TEXT NOT NULL,
    summary TEXT DEFAULT '',
    created_at INTEGER NOT NULL,
    UNIQUE(user_id, date, perspective)
);
DROP TABLE IF EXISTS ai_paths;
ALTER TABLE ai_paths_new RENAME TO ai_paths;
CREATE INDEX IF NOT EXISTS idx_ai_paths_user_date ON ai_paths(user_id, date);

