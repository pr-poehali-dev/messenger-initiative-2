ALTER TABLE t_p96043827_messenger_initiative.users
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

CREATE UNIQUE INDEX IF NOT EXISTS users_username_idx
ON t_p96043827_messenger_initiative.users (LOWER(username));
