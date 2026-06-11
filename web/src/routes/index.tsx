import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { EssayAnalysisResult } from "mature-ts/analyze";
import type { ChangeEvent, FormEvent, ReactNode } from "react";
import { useId, useMemo, useState } from "react";

import { analyzeEssayServer } from "../server/analyze.functions";

export const Route = createFileRoute("/")({
  component: EssayWorkbench,
});

const samplePlaceholder =
  "Wklej wypracowanie maturalne albo wczytaj plik .txt. Analiza obejmie pelne kryteria CKE dla wypracowania.";

type AnalyzeEssayVariables = {
  text: string;
  specNeeds: boolean;
};

const classes = {
  shell:
    "mx-auto min-h-screen w-full max-w-[1480px] px-0 py-0 sm:px-2.5 sm:py-2.5 lg:px-4 lg:py-[22px]",
  topbar:
    "flex flex-col items-stretch gap-6 px-3 py-4 sm:px-0 lg:flex-row lg:items-end lg:justify-between lg:pb-5 lg:pt-[18px]",
  eyebrow:
    "mb-1.5 mt-0 text-[0.72rem] font-extrabold uppercase leading-none text-[#094f4b]",
  workbench:
    "grid items-start gap-0 lg:grid-cols-[minmax(380px,0.92fr)_minmax(440px,1.08fr)] lg:gap-3.5",
  panel:
    "border border-[#d9d1c2] bg-[#fbfaf6]/95 shadow-none sm:shadow-[0_24px_60px_rgba(44,38,27,0.12)]",
  panelTitle: "m-0 text-base font-bold leading-[1.2] text-[#1d2524]",
  metaLabel: "text-[0.74rem] font-bold uppercase leading-tight text-[#67716d]",
} as const;

function EssayWorkbench() {
  const fileInputId = useId();
  const specNeedsId = useId();
  const [essayText, setEssayText] = useState("");
  const [specNeeds, setSpecNeeds] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const analyzeEssay = useMutation<
    EssayAnalysisResult,
    Error,
    AnalyzeEssayVariables
  >({
    mutationFn: (data) => analyzeEssayServer({ data }),
  });
  const stats = useMemo(() => essayStats(essayText), [essayText]);
  const error = fileError ?? getErrorMessage(analyzeEssay.error);

  function submitEssay(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFileError(null);
    analyzeEssay.mutate({ text: essayText, specNeeds });
  }

  async function loadTextFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".txt")) {
      setFileError("Wczytaj plik z rozszerzeniem .txt.");
      event.currentTarget.value = "";
      return;
    }

    setFileError(null);
    analyzeEssay.reset();
    setEssayText(await file.text());
  }

  return (
    <main className={classes.shell}>
      <section className={classes.topbar} aria-label="Podsumowanie narzedzia">
        <div>
          <p className={classes.eyebrow}>Mature essay grader</p>
          <h1 className="m-0 font-serif text-[2rem] font-bold leading-[0.98] text-[#1d2524] sm:text-[2.65rem] xl:text-[3.35rem]">
            Panel oceny wypracowania
          </h1>
        </div>
        <div
          className="flex flex-wrap justify-stretch gap-2 lg:justify-end"
          aria-label="Statystyki tekstu"
        >
          <Metric label="Znaki" value={stats.characters.toString()} />
          <Metric label="Slowa" value={stats.words.toString()} />
          <Metric label="Akapity" value={stats.paragraphs.toString()} />
        </div>
      </section>

      <div className={classes.workbench}>
        <form
          className={`${classes.panel} grid grid-rows-[auto_minmax(360px,54vh)_auto_auto] border-x-0 sm:border-x lg:sticky lg:top-4 lg:min-h-[calc(100vh-132px)] lg:grid-rows-[auto_minmax(420px,1fr)_auto_auto]`}
          onSubmit={submitEssay}
        >
          <div className="flex flex-col items-stretch justify-between gap-4 border-b border-[#d9d1c2] p-[18px] lg:flex-row lg:items-start">
            <div>
              <h2 className={classes.panelTitle}>Tekst pracy</h2>
              <p className="mb-0 mt-1.5 text-[0.88rem] leading-[1.4] text-[#67716d]">
                Analiza uruchamia kryteria 1, 2, 3a, 3b, 3c, 4a, 4b i 4c.
              </p>
            </div>
            <label
              className="inline-flex min-h-10 w-full flex-none cursor-pointer items-center justify-center border border-[#0e6f68] bg-transparent px-3.5 font-extrabold leading-none text-[#094f4b] transition duration-150 ease-out hover:-translate-y-px sm:w-auto"
              htmlFor={fileInputId}
            >
              Wczytaj .txt
            </label>
            <input
              id={fileInputId}
              className="sr-only"
              type="file"
              accept=".txt,text/plain"
              onChange={loadTextFile}
            />
          </div>

          <textarea
            className="min-h-[420px] w-full resize-y border-0 bg-[#fffdf8] p-[18px] leading-[1.55] text-[#1d2524] outline-none focus:shadow-[inset_0_0_0_3px_rgba(14,111,104,0.25)]"
            aria-label="Tresc wypracowania"
            value={essayText}
            onChange={(event) => setEssayText(event.currentTarget.value)}
            placeholder={samplePlaceholder}
          />

          <div className="flex flex-col items-stretch justify-between gap-4 border-t border-[#d9d1c2] px-[18px] py-3.5 lg:flex-row lg:items-center">
            <label
              className="inline-flex items-center gap-2.5 text-[0.88rem] font-bold leading-[1.3] text-[#1d2524]"
              htmlFor={specNeedsId}
            >
              <input
                id={specNeedsId}
                className="h-[18px] w-[18px] accent-[#0e6f68]"
                type="checkbox"
                checked={specNeeds}
                onChange={(event) => setSpecNeeds(event.currentTarget.checked)}
              />
              Progi CKE dla dysleksji/dysortografii/dysgrafii
            </label>
            <button
              className="inline-flex min-h-10 w-full cursor-pointer items-center justify-center border border-[#0e6f68] bg-[#0e6f68] px-3.5 font-extrabold leading-none text-white transition duration-150 ease-out hover:-translate-y-px hover:border-[#094f4b] hover:bg-[#094f4b] disabled:cursor-wait disabled:opacity-70 sm:w-auto"
              type="submit"
              disabled={analyzeEssay.isPending}
            >
              {analyzeEssay.isPending ? "Analizuje..." : "Ocen wypracowanie"}
            </button>
          </div>

          {error ? (
            <p
              className="m-0 border-t border-[#9c3f1f]/20 bg-[#9c3f1f]/10 px-[18px] py-3 font-extrabold text-[#9c3f1f]"
              role="alert"
            >
              {error}
            </p>
          ) : null}
        </form>

        <section
          className={`${classes.panel} min-h-[360px] border-x-0 p-3.5 sm:border-x lg:min-h-[calc(100vh-132px)]`}
          aria-live="polite"
        >
          {analyzeEssay.data ? (
            <Results result={analyzeEssay.data} />
          ) : (
            <EmptyResults />
          )}
        </section>
      </div>
    </main>
  );
}

function Results({ result }: { result: EssayAnalysisResult }) {
  return (
    <>
      <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-[minmax(160px,1fr)_repeat(8,minmax(64px,auto))]">
        <div className="border border-[#d9d1c2] bg-[#f7f4ec] p-3.5">
          <p className={classes.eyebrow}>Suma</p>
          <strong className="block font-serif text-[2.65rem] leading-[0.95] text-[#1d2524]">
            {result.totalScore}
          </strong>
          <span className={classes.metaLabel}>1 + 2 + 3 + 4 / 35</span>
        </div>
        <ScorePill label="1" value={result.formal.points1} max={1} />
        <ScorePill label="2" value={result.literary.points2} max={16} />
        <ScorePill label="3a" value={result.structure.points3a} max={3} />
        <ScorePill label="3b" value={result.coherence.points3b} max={3} />
        <ScorePill label="3c" value={result.style.points3c} max={1} />
        <ScorePill label="4a" value={result.language.points4a} max={7} />
        <ScorePill label="4b" value={result.orthography.points4b} max={2} />
        <ScorePill label="4c" value={result.punctuation.points4c} max={2} />
      </div>

      <ResultSection
        title="1 Spelnienie formalnych warunkow polecenia"
        meta={`${result.formal.points1}/1`}
      >
        <p className="m-0 p-3.5 leading-[1.48] text-[#67716d]">
          {result.formal.reasoning}
        </p>
        <dl className="m-0 grid grid-cols-1 gap-px border-t border-[#d9d1c2] bg-[#d9d1c2] sm:grid-cols-2">
          <MiniFact
            label="Brak bledu kardynalnego"
            value={result.formal.noCardinalError ? "tak" : "nie"}
          />
          <MiniFact
            label="Lektura obowiazkowa"
            value={result.formal.requiredReadingReferenced ? "tak" : "nie"}
          />
          <MiniFact
            label="Problem z polecenia"
            value={result.formal.addressesProblem ? "tak" : "nie"}
          />
          <MiniFact
            label="Argumentacja"
            value={result.formal.argumentative ? "tak" : "nie"}
          />
        </dl>
        <IssueList
          emptyLabel="Brak."
          items={result.formal.issues}
          render={(item) => (
            <>
              <strong>{item.criterion}</strong>
              {item.fragment ? <q>{item.fragment}</q> : null}
              <span>{item.reasoning}</span>
            </>
          )}
        />
      </ResultSection>

      <ResultSection
        title="2 Kompetencje literackie i kulturowe"
        meta={`${result.literary.points2}/16`}
      >
        <p className="m-0 p-3.5 leading-[1.48] text-[#67716d]">
          {result.literary.reasoning}
        </p>
        <dl className="m-0 grid grid-cols-1 gap-px border-t border-[#d9d1c2] bg-[#d9d1c2] sm:grid-cols-2">
          <MiniFact label="Utwory" value={result.literary.workUseLevel} />
          <MiniFact
            label="Argumentacja"
            value={result.literary.argumentationLevel}
          />
          <MiniFact label="Konteksty" value={result.literary.contextUseLevel} />
          <MiniFact
            label="Bledy rzeczowe"
            value={result.literary.factualErrors.length.toString()}
          />
        </dl>
        <IssueList
          emptyLabel="Brak bledow rzeczowych."
          items={result.literary.factualErrors}
          render={(item) => (
            <>
              <strong>{item.error}</strong>
              <q>{item.fragment}</q>
              <span>{item.reasoning}</span>
            </>
          )}
        />
      </ResultSection>

      <ResultSection
        title="3a Struktura wypowiedzi"
        meta={`${result.structure.contentOrganization} / ${result.structure.points3a}/3`}
      >
        <p className="m-0 p-3.5 leading-[1.48] text-[#67716d]">
          {result.structure.reasoning}
        </p>
        <dl className="m-0 grid grid-cols-1 gap-px border-t border-[#d9d1c2] bg-[#d9d1c2] sm:grid-cols-2">
          <MiniFact
            label="Usterka ogolna"
            value={result.structure.generalDivisionIssue ? "tak" : "nie"}
          />
          <MiniFact
            label="Usterka akapitow"
            value={result.structure.paragraphDivisionIssue ? "tak" : "nie"}
          />
        </dl>
        <IssueList
          emptyLabel="Brak."
          items={result.structure.issues}
          render={(item) => (
            <>
              <strong>{item.issue}</strong>
              <q>{item.fragment}</q>
              <span>{item.reasoning}</span>
            </>
          )}
        />
      </ResultSection>

      <ResultSection
        title="3b Spojnosc wypowiedzi"
        meta={`${result.coherence.level} / ${result.coherence.disturbanceCount} zaburzen`}
      >
        <p className="m-0 p-3.5 leading-[1.48] text-[#67716d]">
          {result.coherence.reasoning}
        </p>
        <dl className="m-0 grid grid-cols-1 gap-px border-t border-[#d9d1c2] bg-[#d9d1c2] sm:grid-cols-2">
          <MiniFact
            label="Wstep spojny"
            value={result.coherence.introCoherent ? "tak" : "nie"}
          />
          <MiniFact
            label="Zakonczenie spojne"
            value={result.coherence.conclusionCoherent ? "tak" : "nie"}
          />
        </dl>
        <IssueList
          emptyLabel="Brak."
          items={result.coherence.disturbances}
          render={(item) => (
            <>
              <strong>{item.issue}</strong>
              <q>{item.fragment}</q>
              <span>{item.reasoning}</span>
            </>
          )}
        />
      </ResultSection>

      <ResultSection title="3c Styl wypowiedzi" meta={result.style.styleClass}>
        <IssueList
          emptyLabel="Brak."
          items={result.style.issues}
          render={(item) => (
            <>
              <strong>{item.issue}</strong>
              <q>{item.fragment}</q>
              <span>{item.reasoning}</span>
            </>
          )}
        />
      </ResultSection>

      <ResultSection
        title="4a Zakres i poprawnosc srodkow jezykowych"
        meta={`${result.language.rangeClass} / ${result.language.bucket}`}
      >
        <IssueList
          emptyLabel="Brak."
          items={result.language.languageErrors}
          render={(item) => (
            <>
              <q>{item.error}</q>
              <span>{item.reasoning}</span>
            </>
          )}
        />
      </ResultSection>

      <ResultSection
        title="4b Poprawnosc ortograficzna"
        meta={`${result.orthography.orthographyErrors.length} bledow`}
      >
        <IssueList
          emptyLabel="Brak."
          items={result.orthography.orthographyErrors}
          render={(item) => (
            <>
              <q>{item.error}</q>
              <span>Poprawnie: {item.correct}</span>
            </>
          )}
        />
      </ResultSection>

      <ResultSection
        title="4c Poprawnosc interpunkcyjna"
        meta={`${result.punctuation.punctuationErrors.length} bledow / ${result.punctuation.points4c}/2`}
      >
        <IssueList
          emptyLabel="Brak."
          items={result.punctuation.punctuationErrors}
          render={(item) => (
            <>
              <strong>Pozycja {item.position}</strong>
              <q>{item.fragment}</q>
              <span>{item.suggestion}</span>
              <span>{item.reasoning}</span>
            </>
          )}
        />
      </ResultSection>
    </>
  );
}

function EmptyResults() {
  return (
    <div className="grid min-h-[360px] place-content-center justify-items-center border border-dashed border-[#d9d1c2] bg-[#f7f4ec] p-7 text-center lg:min-h-[calc(100vh-162px)]">
      <p className={classes.eyebrow}>Wynik</p>
      <h2 className={classes.panelTitle}>Gotowe na pierwsza analize.</h2>
      <p className="mb-0 mt-2.5 max-w-[390px] leading-normal text-[#67716d]">
        Po ocenie zobaczysz tu punktacje, kryteria CKE oraz listy wskazanych
        fragmentow.
      </p>
    </div>
  );
}

function ResultSection({
  title,
  meta,
  children,
}: {
  title: string;
  meta: string;
  children: ReactNode;
}) {
  return (
    <article className="mt-2.5 border border-[#d9d1c2] bg-[#fffdf8]">
      <header className="flex items-center justify-between gap-3 border-b border-[#d9d1c2] bg-[#f7f4ec] px-3.5 py-3">
        <h2 className={classes.panelTitle}>{title}</h2>
        <span className="text-right text-[0.82rem] font-extrabold text-[#094f4b]">
          {meta}
        </span>
      </header>
      {children}
    </article>
  );
}

function MiniFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#fffdf8] px-3.5 py-2.5">
      <dt className="text-[0.76rem] font-extrabold uppercase text-[#67716d]">
        {label}
      </dt>
      <dd className="mb-0 mt-0.5 font-extrabold">{value}</dd>
    </div>
  );
}

function IssueList<T>({
  items,
  emptyLabel,
  render,
}: {
  items: T[];
  emptyLabel: string;
  render: (item: T) => ReactNode;
}) {
  if (items.length === 0) {
    return (
      <p className="m-0 p-3.5 leading-[1.48] text-[#67716d]">{emptyLabel}</p>
    );
  }

  return (
    <ol className="m-0 grid list-none gap-px bg-[#d9d1c2] p-0">
      {items.map((item, index) => (
        <li
          className="grid gap-[7px] bg-[#fffdf8] px-3.5 py-3 leading-[1.42] text-[#67716d] [&_q]:[overflow-wrap:anywhere] [&_q]:font-extrabold [&_q]:text-[#094f4b] [&_strong]:text-[#1d2524]"
          key={index}
        >
          {render(item)}
        </li>
      ))}
    </ol>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex min-h-[52px] min-w-[84px] flex-1 basis-[92px] flex-col justify-center gap-0.5 border border-[#d9d1c2] bg-[#fbfaf6]/80 px-3 py-2 lg:flex-none">
      <span className={classes.metaLabel}>{label}</span>
      <strong className="text-[1.1rem] text-[#1d2524]">{value}</strong>
    </span>
  );
}

function ScorePill({
  label,
  value,
  max,
}: {
  label: string;
  value: number;
  max: number;
}) {
  return (
    <span className="inline-flex min-h-[52px] min-w-[84px] flex-col items-start justify-center gap-0.5 border border-[#d9d1c2] bg-[#f7f4ec] px-3 py-2">
      <span className={classes.metaLabel}>{label}</span>
      <strong className="text-[1.1rem] text-[#1d2524]">
        {value}/{max}
      </strong>
    </span>
  );
}

function essayStats(text: string) {
  const trimmed = text.trim();

  return {
    characters: text.length,
    words: trimmed ? trimmed.split(/\s+/).length : 0,
    paragraphs: trimmed ? trimmed.split(/\n\s*\n/).length : 0,
  };
}

function getErrorMessage(error: Error | null) {
  if (!error) return null;
  return error.message || "Nie udalo sie przeanalizowac wypracowania.";
}
