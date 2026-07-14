import React from "react";
import Link from "next/link";

const ARTICLES = [
  { slug: "diagnosing-line-height", title: "Diagnosing Line-Height Toxicity in Web Apps", date: "2026-07-10", author: "Dr. Typo", summary: "An evaluation of vertical layout stress in dense data views." },
  { slug: "mono-vs-sans-compounds", title: "Synthesis of Monospaced Compounds in UI Designs", date: "2026-07-05", author: "Lab Analyst", summary: "Analyzing user performance when reading technical code blocks." },
];

export default function PillsPage() {
  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8 space-y-8">
      {/* Route Header */}
      <div className="border border-zinc-800 bg-zinc-950 p-6 rounded-lg">
        <h1 className="font-haas text-2xl font-bold text-glow-cyan text-[#00cece]">
          PILLS // TYPOGRAPHIC_INSIGHTS
        </h1>
        <p className="text-zinc-500 text-xs font-haas mt-1">
          Articles and scientific analysis regarding font usage, rendering performance, and layout diagnostics.
        </p>
      </div>

      <div className="space-y-6">
        {ARTICLES.map((article) => (
          <div key={article.slug} className="border border-zinc-800 bg-zinc-950 p-6 rounded-lg space-y-3">
            <div className="flex justify-between items-center text-xs font-haas">
              <span className="text-[#ff3131] font-bold">WRITER: {article.author.toUpperCase()}</span>
              <span className="text-zinc-600">DATE: {article.date}</span>
            </div>

            <h2 className="font-haas text-base font-bold text-zinc-200 hover:text-[#00cece] transition-colors">
              <Link id={`link-post-${article.slug}`} href={`/prescriptions/${article.slug}`}>
                {article.title}
              </Link>
            </h2>

            <p className="text-zinc-400 text-xs leading-relaxed">{article.summary}</p>

            <div className="pt-2 border-t border-zinc-900 flex justify-end">
              <Link 
                id={`btn-read-${article.slug}`}
                href={`/prescriptions/${article.slug}`} 
                className="font-haas text-xs text-[#00cece] hover:underline"
              >
                READ_DIAGNOSIS() &gt;&gt;
              </Link>
            </div>
          </div>
        ))}
      </div>
       <p className="font-star text-4xl"> questo praticmaante e il blog con filtri etc </p>
    </div>
  );
}
