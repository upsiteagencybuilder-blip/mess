# 🚀 Vercel Deployment Guide — মেস সেটল

এই গাইড অনুসরণ করে আপনি আপনার সাইটটি Vercel-এ লাইভ করতে পারবেন।

## ধাপ ১: PostgreSQL ডাটাবেস তৈরি করুন

Vercel-এ SQLite কাজ করে না (serverless), তাই PostgreSQL দরকার। বিনামূল্যে একটি ডাটাবেস তৈরি করুন:

### অপশন A: Neon (推荐 — সবচেয়ে সহজ)
1. https://neon.tech এ যান → Sign up (GitHub দিয়ে)
2. "New Project" → নাম দিন "mess-settl"
3. Region: Singapore (সবচেয়ে কাছের)
4. "Create project" ক্লিক করুন
5. **Connection string কপি করুন** (যেমন: `postgresql://user:pass@ep-xxx.sin1.aws.neon.tech/mess-settl?sslmode=require`)

### অপশন B: Vercel Postgres
1. Vercel Dashboard → Storage → Create Database → Postgres
2. নাম দিন "mess-settl-db"
3. তৈরি হলে connection string স্বয়ংক্রিয়ভাবে env vars-এ যাবে

### অপশন C: Supabase
1. https://supabase.com এ যান → New Project
2. Database password সেট করুন
3. Settings → Database → Connection string কপি করুন

---

## ধাপ ২: GitHub-এ কোড পুশ করুন

```bash
# প্রজেক্ট ফোল্ডারে যান
cd /home/z/my-project

# Git রিপোজিটরি ইনিশিয়ালাইজ করুন (যদি না করা থাকে)
git init
git add -A
git commit -m "Production ready: mess management platform"

# GitHub-এ পুশ করুন
git remote add origin https://github.com/YOUR_USERNAME/mess-settl.git
git branch -M main
git push -u origin main
```

---

## ধাপ ৩: Vercel-এ ডিপ্লয় করুন

1. https://vercel.com এ যান → "Add New" → "Project"
2. আপনার GitHub রিপোজিটরি সিলেক্ট করুন (`mess-settl`)
3. "Import" ক্লিক করুন

### Environment Variables সেট করুন:
"Environment Variables" সেকশনে নিচের ভেরিয়েবলগুলো যোগ করুন:

| Name | Value | Environment |
|------|-------|-------------|
| `DATABASE_URL` | আপনার PostgreSQL connection string (ধাপ ১ থেকে) | Production, Preview, Development |
| `SESSION_SECRET` | একটি র্যান্ডম ৩২-অক্ষরের স্ট্রিং (নিচে কমান্ড) | Production, Preview, Development |
| `SEED_DB` | `true` (প্রথমবার ডেমো ডেটা লোড করতে) | Production |

SESSION_SECRET তৈরি করতে:
```bash
openssl rand -hex 32
```

4. "Deploy" ক্লিক করুন
5. ৫-১০ মিনিট অপেক্ষা করুন (বিল্ড হবে)

---

## ধাপ ৪: ডিপ্লয়মেন্ট যাচাই করুন

ডিপ্লয় সম্পন্ন হলে:
1. Vercel আপনাকে একটি URL দেবে (যেমন: `https://mess-settl.vercel.app`)
2. সেই URL ভিজিট করুন
3. লগইন করুন: `admin@mess.com` / পাসওয়ার্ড: `123456`

### সমস্যা হলে:
- Vercel Dashboard → আপনার প্রজেক্ট → "Logs" চেক করুন
- "Build Logs" এ কোনো ত্রুটি আছে কিনা দেখুন

---

## ধাপ ৫: কাস্টম ডোমেইন (ঐচ্ছিক)

1. Vercel Dashboard → Settings → Domains
2. আপনার ডোমেইন যোগ করুন (যেমন: `messsettl.com`)
3. DNS রেকর্ড আপডেট করুন (Vercel নির্দেশনা দেবে)
4. SSL স্বয়ংক্রিয়ভাবে কনফিগার হবে

---

## ডেমো অ্যাকাউন্টসমূহ

| রোল | ইমেইল | পাসওয়ার্ড |
|------|--------|-----------|
| অ্যাডমিন | admin@mess.com | 123456 |
| মালিক | rahim@mess.com | 123456 |
| টেন্যান্ট | tanvir@tenant.com | 123456 |
| স্টাফ | staff@mess.com | 123456 |

---

## প্রোডাকশন টিপস

### ডেমো ডেটা মুছে ফেলা:
প্রথমবার `SEED_DB=true` সেট করলে ডেমো ডেটা লোড হবে। এরপর এটি `false` করে দিন।

### নতুন ডেটা যোগ:
অ্যাডমিন হিসেবে লগইন করে নতুন মেস/ইউজার যোগ করুন।

### Firebase Analytics:
Firebase Console (https://console.firebase.google.com/project/mess-a4049/analytics) এ রিয়েল-টাইম ইউজার ডেটা দেখুন।

### ব্যাকআপ:
নিয়মিত ডাটাবেস ব্যাকআপ নিন:
```bash
# Neon ড্যাশবোর্ড থেকে ব্যাকআপ ডাউনলোড করুন
# অথবা pg_dump ব্যবহার করুন
```

---

## টেকনিক্যাল আর্কিটেকচার

- **Frontend**: Next.js 16 + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Next.js API Routes (serverless)
- **Database**: PostgreSQL (Neon/Vercel Postgres)
- **ORM**: Prisma
- **Maps**: Leaflet + OpenStreetMap
- **Analytics**: Firebase Analytics
- **Hosting**: Vercel (serverless)

### ফাইল স্ট্রাকচার:
```
prisma/
  schema.prisma        # SQLite (local dev)
  schema.prod.prisma   # PostgreSQL (production)
  seed.ts              # Demo data seeder
scripts/
  vercel-build.sh      # Vercel build script (swaps schema)
src/
  app/api/             # API routes
  components/          # React components
  lib/                 # Shared libraries
  store/               # Zustand stores
vercel.json            # Vercel config
```
