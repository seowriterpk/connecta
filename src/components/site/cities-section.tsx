"use client";

import * as React from "react";
import { Building2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Reveal } from "@/components/site/reveal";

interface CityDTO {
  city: string;
  slug: string;
  groupCount: number;
  countryCode: string;
  countryFlag: string;
}

export function CitiesSection({ cities }: { cities: CityDTO[] }) {
  if (cities.length === 0) return null;

  return (
    <section id="ciudades" className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-14 sm:py-16">
        <Reveal>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
                <Building2 className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Grupos por ciudad
                </h2>
                <p className="text-sm text-muted-foreground">
                  Encuentra comunidades activas en tu ciudad. {cities.length} ciudades disponibles.
                </p>
              </div>
            </div>
          </div>
        </Reveal>

        <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {cities.map((c, i) => (
            <Reveal key={c.slug} delay={i * 0.03}>
              <Link
                href={`/ciudad/${c.slug}`}
                className="group flex items-center gap-3 rounded-xl border bg-card p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <span className="text-2xl leading-none">{c.countryFlag}</span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{c.city}</span>
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Building2 className="h-3 w-3" />
                    {c.groupCount} {c.groupCount === 1 ? "grupo" : "grupos"}
                  </span>
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
