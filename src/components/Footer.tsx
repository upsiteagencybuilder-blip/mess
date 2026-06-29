"use client";

import { Github, Heart, Home } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-slate-900 text-slate-300">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-6 sm:flex-row">
        <div className="flex items-center gap-2 text-sm">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-500/15 text-teal-400">
            <Home className="h-4 w-4" />
          </span>
          <span className="font-semibold text-white">মেস সেটল</span>
          <span className="text-slate-500">·</span>
          <span className="text-slate-400">
            মেস ম্যানেজমেন্ট ও সিট ফাইন্ডার প্ল্যাটফর্ম
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs text-slate-400">
          <span>তৈরি হয়েছে</span>
          <Heart className="h-3.5 w-3.5 fill-rose-500 text-rose-500" />
          <span>দিয়ে · Next.js · Three.js · Prisma</span>
        </div>
      </div>
    </footer>
  );
}
