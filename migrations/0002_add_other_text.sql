-- Add non-quantifiable context note to opportunities
ALTER TABLE opportunities ADD COLUMN other_text TEXT DEFAULT '';

