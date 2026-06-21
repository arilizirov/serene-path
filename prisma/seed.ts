import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "../src/features/accounts/password";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set — create .env (see .env.example).");
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

type Localized = { en: string; he: string; fr: string };

type SeedTherapist = {
  email: string;
  name: string;
  title: string;
  bio: Localized;
  skills: string[];
  modalities: string[];
  languages: string[];
  credentials: string;
  sessionPrice: string;
  rules: Array<{ weekday: number; startMinute: number; endMinute: number }>;
};

// Whole-hour helper for readability (minutes from local midnight).
const h = (hour: number) => hour * 60;

const THERAPISTS: SeedTherapist[] = [
  {
    email: "maya.cohen@example.com",
    name: "Maya Cohen",
    title: "Clinical Psychologist",
    bio: {
      en: "I help adults navigate anxiety, burnout, and life transitions with a warm, practical CBT approach.",
      he: "אני מלווה מבוגרים בהתמודדות עם חרדה, שחיקה ומעברים בחיים בגישה חמה ומעשית מבית ה-CBT.",
      fr: "J'accompagne les adultes face à l'anxiété, l'épuisement et les transitions de vie avec une approche TCC chaleureuse.",
    },
    skills: ["anxiety", "burnout", "life-transitions", "CBT"],
    modalities: ["individual"],
    languages: ["he", "en"],
    credentials: "Ph.D. Clinical Psychology, licensed (IL)",
    sessionPrice: "320.00",
    rules: [
      { weekday: 0, startMinute: h(9), endMinute: h(14) },
      { weekday: 2, startMinute: h(16), endMinute: h(20) },
    ],
  },
  {
    email: "daniel.haddad@example.com",
    name: "Daniel Haddad",
    title: "Couples & Family Therapist",
    bio: {
      en: "I work with couples and families to rebuild communication and trust after conflict.",
      he: "אני עובד עם זוגות ומשפחות לשיקום התקשורת והאמון לאחר משברים.",
      fr: "Je travaille avec les couples et les familles pour reconstruire la communication et la confiance après un conflit.",
    },
    skills: ["couples", "family", "communication", "conflict"],
    modalities: ["couples", "family"],
    languages: ["he", "en", "fr"],
    credentials: "M.A. Marriage & Family Therapy",
    sessionPrice: "380.00",
    rules: [
      { weekday: 1, startMinute: h(10), endMinute: h(18) },
      { weekday: 3, startMinute: h(10), endMinute: h(15) },
    ],
  },
  {
    email: "noa.levi@example.com",
    name: "Noa Levi",
    title: "Trauma-Informed Counselor",
    bio: {
      en: "Trauma-informed, body-aware support for grief, PTSD, and difficult life events.",
      he: "ליווי מותאם-טראומה ומודע-גוף לאבל, פוסט-טראומה ואירועי חיים קשים.",
      fr: "Un accompagnement tenant compte du trauma et du corps pour le deuil, le TSPT et les événements de vie difficiles.",
    },
    skills: ["trauma", "grief", "PTSD", "somatic"],
    modalities: ["individual"],
    languages: ["he", "en"],
    credentials: "M.S.W., trauma certification",
    sessionPrice: "300.00",
    rules: [
      { weekday: 0, startMinute: h(8), endMinute: h(12) },
      { weekday: 4, startMinute: h(13), endMinute: h(19) },
    ],
  },
];

async function main() {
  // Dev admin account. Refuse to seed a known default password into production.
  if (
    process.env.NODE_ENV === "production" &&
    !process.env.SEED_ADMIN_PASSWORD
  ) {
    throw new Error(
      "Refusing to seed a default admin password in production — set SEED_ADMIN_PASSWORD.",
    );
  }
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "admin-dev-password";
  await prisma.user.upsert({
    where: { email: "admin@serenepath.local" },
    update: {},
    create: {
      email: "admin@serenepath.local",
      name: "Admin",
      role: "ADMIN",
      passwordHash: await hashPassword(adminPassword),
    },
  });
  console.log(`seeded admin: admin@serenepath.local (pw: ${adminPassword})`);

  for (const t of THERAPISTS) {
    await prisma.user.upsert({
      where: { email: t.email },
      update: {},
      create: {
        email: t.email,
        name: t.name,
        role: "THERAPIST",
        locale: "he",
        therapist: {
          create: {
            title: t.title,
            bio: t.bio,
            skills: t.skills,
            modalities: t.modalities,
            languages: t.languages,
            credentials: t.credentials,
            sessionPrice: t.sessionPrice,
            status: "VERIFIED",
            rules: { create: t.rules },
          },
        },
      },
    });
    console.log(`seeded therapist: ${t.name}`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
