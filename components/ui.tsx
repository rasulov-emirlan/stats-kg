import type { ReactNode } from "react";

export function Section({
  kicker,
  title,
  children,
  lead,
}: {
  kicker: string;
  title: string;
  lead?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="mx-auto max-w-5xl px-4 pt-16">
      <div className="border-t-2 border-ink pt-3">
        <p className="kicker text-g500">{kicker}</p>
        <h2 className="mt-1 text-2xl font-bold sm:text-3xl">{title}</h2>
        {lead ? <p className="mt-3 max-w-[70ch] text-g800">{lead}</p> : null}
      </div>
      <div className="mt-8">{children}</div>
    </section>
  );
}

export function StatTile({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="border border-g300 bg-paper p-4">
      <p className="text-sm text-g500">{label}</p>
      <p className="mt-1 font-heading text-3xl font-bold">{value}</p>
      {note ? <p className="mt-1 text-xs text-g500">{note}</p> : null}
    </div>
  );
}

export function InsightCard({
  figure,
  title,
  children,
  method,
}: {
  figure: string;
  title: string;
  children: ReactNode;
  method?: ReactNode;
}) {
  return (
    <div className="flex flex-col border border-g300 p-5">
      <p className="font-heading text-4xl font-bold text-red">{figure}</p>
      <h3 className="mt-2 text-lg font-bold">{title}</h3>
      <div className="mt-2 text-sm text-g800">{children}</div>
      {method ? <MethodNote>{method}</MethodNote> : null}
    </div>
  );
}

export function MethodNote({ children }: { children: ReactNode }) {
  return (
    <details className="method mt-auto pt-4">
      <summary className="kicker text-g500 transition-colors duration-150 hover:text-red">
        как посчитано
      </summary>
      <div className="mt-2 border-l-2 border-g300 pl-3 text-xs text-g500">{children}</div>
    </details>
  );
}

export function NoData() {
  return (
    <div className="border border-dashed border-g300 p-8 text-center text-sm text-g500">
      Источник данных сейчас недоступен — блок вернётся при следующем обновлении.
    </div>
  );
}

export function ExportLinks({ csv, json }: { csv?: string; json?: string }) {
  return (
    <p className="kicker mt-3 flex gap-4 text-g500">
      {csv ? (
        <a href={csv} className="transition-colors duration-150 hover:text-red">
          ↓ CSV
        </a>
      ) : null}
      {json ? (
        <a
          href={json}
          rel="nofollow"
          className="transition-colors duration-150 hover:text-red"
        >
          {"{ } JSON"}
        </a>
      ) : null}
    </p>
  );
}
