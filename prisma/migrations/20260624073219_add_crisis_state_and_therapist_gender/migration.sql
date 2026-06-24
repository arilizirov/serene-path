-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- AlterEnum
ALTER TYPE "IntakeState" ADD VALUE 'CRISIS';

-- AlterTable
ALTER TABLE "TherapistProfile" ADD COLUMN     "gender" "Gender";
