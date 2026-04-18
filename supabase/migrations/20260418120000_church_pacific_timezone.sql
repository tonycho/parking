-- Church schedules use US Pacific; align DB default and existing rows.
ALTER TABLE notification_settings
  ALTER COLUMN timezone SET DEFAULT 'America/Los_Angeles';

UPDATE notification_settings
  SET timezone = 'America/Los_Angeles'
  WHERE timezone IS DISTINCT FROM 'America/Los_Angeles';
