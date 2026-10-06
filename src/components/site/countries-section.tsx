"use client";

import * as React from "react";
import { Globe2 } from "lucide-react";
import Link from "next/link";
import { useGroupsFilter } from "@/lib/store";
import type { CountryDTO } from "@/lib/types";
import { REGIONS } from "@/lib/constants";

export function CountriesSection({ countries }: { countries: CountryDTO[] }) {
  const setCountry = useGroupsFilter((s) => s.setCountry);
  const region = useGroupsFilter((s) => s.region);
  const setRegion = useGroupsFilter((s) => s.setRegion);

  const filtered = React.useMemo(() => {
    if (!region) return countries;
    return countries.filter((c) => c.region === region);
  }, [countries, region]);

  function pick(id: string) {
    setCountry(id);
    document.getElementById("grupos")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <section id="paises" className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-14 sm:py-16">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Grupos por país hispanohablante
            </h2>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              Filtra comunidades por región. Desde España hasta el Cono Sur: elige tu país y únete a la conversación.
            </p>
          </div>
        </div>

        {/* Region tabs */}
        <div className="cg-scroll mt-5 flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setRegion(null)}
            className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
              !region
                ? "border-primary bg-primary text-primary-foreground"
                : "bg-background hover:bg-accent"
            }`}
          >
            Todos
          </button>
          {REGIONS.map((r) => (
            <button
              key={r}
              onClick={() => setRegion(region === r ? null : r)}
              className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
                region === r
                  ? "border-primary bg-primary text-primary-foreground"
                  : "bg-background hover:bg-accent"
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filtered.map((c) => (
            <Link
              key={c.id}
              href={`/pais/${c.code}`}
              className="group flex items-center gap-3 rounded-xl border bg-card p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="text-2xl leading-none">{c.flag}</span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">{c.name}</span>
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Globe2 className="h-3 w-3" />
                  {c.groupCount} {c.groupCount === 1 ? "grupo" : "grupos"}
                </span>
              </span>
            </Link>
          ))}
          {filtered.length === 0 && (
            <p className="col-span-full py-8 text-center text-sm text-muted-foreground">
              Sin países en esta región todavía.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
