-- Chip-intake fit-form matching fields (INTAKE_BUILD_SPEC §6b/§7).
-- All columns are nullable or have defaults, so existing TherapistProfile rows
-- stay valid without any backfill. NOT run here — applied by the deploy.

-- CreateEnum
CREATE TYPE "ReligiousAlignment" AS ENUM ('SECULAR', 'MASORTI', 'DATI', 'HAREDI');

-- CreateEnum
CREATE TYPE "AvailabilityTag" AS ENUM ('WEEKDAY_DAY', 'EVENINGS', 'WEEKENDS');

-- AlterTable
ALTER TABLE "TherapistProfile" ADD COLUMN     "religiousAlignment" "ReligiousAlignment",
ADD COLUMN     "offersSlidingScale" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "acceptsInsurance" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "acceptsSoldierSubsidy" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "availabilityTags" "AvailabilityTag"[] DEFAULT ARRAY[]::"AvailabilityTag"[],
ADD COLUMN     "acceptingNewClients" BOOLEAN NOT NULL DEFAULT true;
