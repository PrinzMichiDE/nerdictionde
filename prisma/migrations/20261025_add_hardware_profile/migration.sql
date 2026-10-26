-- Add hardware profile fields to TwitchUser
ALTER TABLE "TwitchUser" ADD COLUMN IF NOT EXISTS "hardware_profile" JSONB;
ALTER TABLE "TwitchUser" ADD COLUMN IF NOT EXISTS "hardware_profile_enabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "TwitchUser" ADD COLUMN IF NOT EXISTS "hardware_profile_version" INTEGER NOT NULL DEFAULT 1;

COMMENT ON COLUMN "TwitchUser"."hardware_profile" IS 'User hardware profile: { cpu, gpu, ram, monitor, psu, resolution, refreshRate }';
COMMENT ON COLUMN "TwitchUser"."hardware_profile_enabled" IS 'Opt-in for hardware compatibility checks on reviews';
COMMENT ON COLUMN "TwitchUser"."hardware_profile_version" IS 'Optimistic locking version for hardware profile updates';