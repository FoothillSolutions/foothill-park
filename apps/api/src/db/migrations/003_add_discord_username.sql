-- Add discord_username column to store BambooHR's customDiscordName (username string).
-- discord_id stays as the numeric Discord snowflake ID (from seed data).
-- discord_username is what the guild member search uses for DMs.

ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS discord_username VARCHAR(100);
