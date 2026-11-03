-- DayFork Initial Schema: opportunities, branches, ai_paths

CREATE TABLE IF NOT EXISTS opportunities (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,              -- 'YYYY-MM-DD'
    title TEXT NOT NULL,             -- Tên cơ hội (vd: "Chiều rảnh rỗi")
    time_minutes INTEGER DEFAULT 0,  -- Tài nguyên thời gian (phút)
    money_amount INTEGER DEFAULT 0,  -- Tài nguyên tiền mặt (VNĐ)
    created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_opportunities_date ON opportunities(date);

CREATE TABLE IF NOT EXISTS branches (
    id TEXT PRIMARY KEY,
    opportunity_id TEXT NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
    name TEXT NOT NULL,              -- Tên nhánh (vd: "Đi bộ công viên")
    cost_time INTEGER DEFAULT 0,     -- Tiêu hao thời gian (phút)
    cost_money INTEGER DEFAULT 0,    -- Tiêu hao tiền (VNĐ)
    outcome TEXT DEFAULT '',         -- Nhận lại (văn bản tự do)
    is_chosen INTEGER DEFAULT 0,     -- 1: Nhánh user đã chọn thực tế, 0: Nhánh bỏ qua
    created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_branches_opp_id ON branches(opportunity_id);

CREATE TABLE IF NOT EXISTS ai_paths (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,              -- 'YYYY-MM-DD'
    perspective TEXT NOT NULL,       -- 'best' | 'comfort'
    branch_selections TEXT NOT NULL, -- JSON: [{ opportunity_id, branch_id, reflection }]
    summary TEXT DEFAULT '',         -- Lời đúc kết ngắn của AI cho cả ngày
    created_at INTEGER NOT NULL,
    UNIQUE(date, perspective)
);
CREATE INDEX IF NOT EXISTS idx_ai_paths_date ON ai_paths(date);

