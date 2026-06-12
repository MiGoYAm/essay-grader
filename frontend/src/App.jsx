import './App.css'
import { useState, useEffect } from 'react';

const scoreItems = [
  { key: 'formal', label: '1', max: 1, getValue: (result) => result.formal.points1 },
  { key: 'literary', label: '2', max: 16, getValue: (result) => result.literary.points2 },
  { key: 'structure', label: '3a', max: 3, getValue: (result) => result.structure.points3a },
  { key: 'coherence', label: '3b', max: 3, getValue: (result) => result.coherence.points3b },
  { key: 'style', label: '3c', max: 1, getValue: (result) => result.style.points3c },
  { key: 'language', label: '4a', max: 7, getValue: (result) => result.language.points4a },
  { key: 'orthography', label: '4b', max: 2, getValue: (result) => result.orthography.points4b },
  { key: 'punctuation', label: '4c', max: 2, getValue: (result) => result.punctuation.points4c },
];

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!isLoading) return;

    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
    };
  }, [isLoading]);

  function handleSubmit(formData) {
    if (isLoading) return;

    const url = formData.get("text") ? "http://localhost:3000/" : "http://localhost:3000/file";

    setIsLoading(true);

    fetch(url, {
      method: "POST",
      body: formData 
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Response status: ${response.status}`);
        }

        return response.json();
      })
      .then((data) => {
        setResult(data);
      })
      .catch((error) => console.error("Error fetching data:", error))
      .finally(() => setIsLoading(false));
  }

  if (result) {
    return (
      <ResultsPage
        result={result}
        onReset={() => setResult(null)}
      />
    );
  }

  return (
    <div className="container">
      <h1>
        Oceń swoją rozprawkę szkolną za pomocą AI!
      </h1>

      <form onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.target);
          handleSubmit(formData);
      }}>
        {/* <label htmlFor='topic'>Podaj Treść tematu rozprawki</label><br/>
        <input name='topic' id='topic' disabled={isLoading} /><br/> */}

        <label htmlFor='text'>
          Podaj Treść Rozprawki
          <textarea name='text' id='text' disabled={isLoading}></textarea>
        </label>

        <div className="seperator">
          <div/>
          <span>lub</span>
          <div/>
        </div>

        <label htmlFor='file'>
          Wybierz plik<br/>
          <input name='file' id='file' type='file' disabled={isLoading}/>
        </label>

        <button type='submit' disabled={isLoading}>
          Sprawdź
        </button>
      </form>

      {isLoading && <LoadingOverlay />}
    </div>
  )
}

function ResultsPage({ result, onReset }) {
  const totalRows = [
    ['Suma', '1 + 2 + 3a + 3b + 3c + 4a + 4b + 4c'],
    ['Punkty', `${result.totalScore}/35`],
  ];

  return (
    <main className="resultsPage">
      <section className="resultsHero" aria-labelledby="results-title">
        <div>
          <h1 id="results-title">Ocena rozprawki</h1>
          <p className="resultsIntro">
            Punktacja i szczegóły zostały ułożone według kryteriów CKE zwracanych przez backend.
          </p>
        </div>

        <div className="totalScore" aria-label={`Suma punktów ${result.totalScore} na 35`}>
          <span>{result.totalScore}</span>
          <strong>/35</strong>
        </div>
      </section>

      <section className="resultMeta" aria-label="Informacje o pracy">
        <MetaTile label="Liczba wyrazów" value={result.wordCount} />
        <MetaTile
          label="Kompozycja i język"
          value={result.compositionAndLanguageScored ? 'oceniane' : '0 pkt (<300 wyrazów)'}
        />
        <button className="secondaryButton" type="button" onClick={onReset}>
          Sprawdź inną rozprawkę
        </button>
      </section>

      <section className="scoreGrid" aria-label="Punkty za kryteria">
        {scoreItems.map((item) => (
          <ScoreTile
            key={item.key}
            label={item.label}
            value={item.getValue(result)}
            max={item.max}
          />
        ))}
      </section>

      <section className="resultsLayout" aria-label="Szczegółowa punktacja">
        <ResultCard title="Próg 300 słów">
          <ScoreTable rows={[
            ['Wymóg', 'Minimum 300 wyrazów'],
            ['Liczba wyrazów', result.wordCount],
            ['Kompozycja i język', result.compositionAndLanguageScored ? 'oceniane' : '0 pkt (<300 wyrazów)'],
          ]} />
        </ResultCard>

        <ResultCard title="1 SFWP" score={`${result.formal.points1}/1`}>
          <ScoreTable rows={[
            ['Kryterium', '1 Spełnienie formalnych warunków polecenia'],
            ['Brak błędu kardynalnego', yesNo(result.formal.noCardinalError)],
            ['Lektura obowiązkowa', yesNo(result.formal.requiredReadingReferenced)],
            ['Dotyczy problemu', yesNo(result.formal.addressesProblem)],
            ['Argumentacyjna', yesNo(result.formal.argumentative)],
            ['Plan/punkty', yesNo(result.formal.planOrBulletForm)],
            ['Punkty 1', result.formal.points1],
          ]} />
          <Reasoning title="Uzasadnienie" text={result.formal.reasoning} />
          <DetailList
            title="Uwagi formalne"
            items={result.formal.issues}
            emptyText="Brak."
            renderItem={(item) => (
              <>
                <strong>{item.criterion}</strong>
                {item.fragment ? <Quote text={item.fragment} /> : null}
                <span>{item.reasoning}</span>
              </>
            )}
          />
        </ResultCard>

        <ResultCard title="2 KLiK" score={`${result.literary.points2}/16`}>
          <ScoreTable rows={[
            ['Kryterium', '2 Kompetencje literackie i kulturowe'],
            ['Utwory', result.literary.workUseLevel],
            ['Argumentacja', result.literary.argumentationLevel],
            ['Konteksty', result.literary.contextUseLevel],
            ['Erudycja', yesNo(result.literary.erudition)],
            ['Błędy rzeczowe', result.literary.factualErrors.length],
            ['Punkty bazowe', result.literary.basePoints2],
            ['Punkty 2', result.literary.points2],
          ]} />
          <Reasoning title="Uzasadnienie" text={result.literary.reasoning} />
          <DetailList
            title="Błędy rzeczowe"
            items={result.literary.factualErrors}
            emptyText="Brak błędów rzeczowych."
            renderItem={(item) => (
              <>
                <strong>{item.error}</strong>
                <Quote text={item.fragment} />
                <span>{item.reasoning}</span>
              </>
            )}
          />
        </ResultCard>

        <ResultCard title="3a Struktura wypowiedzi" score={`${result.structure.points3a}/3`}>
          <ScoreTable rows={[
            ['Kryterium', '3a Struktura wypowiedzi'],
            ['Organizacja', result.structure.contentOrganization],
            ['Usterka ogólna', yesNo(result.structure.generalDivisionIssue)],
            ['Usterka akapitów', yesNo(result.structure.paragraphDivisionIssue)],
            ['Punkty 3a', result.structure.points3a],
          ]} />
          <Reasoning title="Uzasadnienie" text={result.structure.reasoning} />
          <DetailList
            title="Uwagi do struktury"
            items={result.structure.issues}
            emptyText="Brak."
            renderItem={(item) => (
              <>
                <strong>{item.issue}</strong>
                <Quote text={item.fragment} />
                <span>{item.reasoning}</span>
              </>
            )}
          />
        </ResultCard>

        <ResultCard title="3b Spójność wypowiedzi" score={`${result.coherence.points3b}/3`}>
          <ScoreTable rows={[
            ['Kryterium', '3b Spójność wypowiedzi'],
            ['Poziom', result.coherence.level],
            ['Zaburzenia', result.coherence.disturbanceCount],
            ['Wstęp spójny', yesNo(result.coherence.introCoherent)],
            ['Zakończenie spójne', yesNo(result.coherence.conclusionCoherent)],
            ['Punkty 3b', result.coherence.points3b],
          ]} />
          <Reasoning title="Uzasadnienie" text={result.coherence.reasoning} />
          <DetailList
            title="Zaburzenia spójności"
            items={result.coherence.disturbances}
            emptyText="Brak."
            renderItem={(item) => (
              <>
                <strong>{item.issue}</strong>
                <Quote text={item.fragment} />
                <span>{item.reasoning}</span>
              </>
            )}
          />
        </ResultCard>

        <ResultCard title="3c Styl wypowiedzi" score={`${result.style.points3c}/1`}>
          <ScoreTable rows={[
            ['Kryterium', '3c Styl wypowiedzi'],
            ['Ocena', result.style.styleClass],
            ['Punkty 3c', result.style.points3c],
          ]} />
          <DetailList
            title="Problemy stylistyczne"
            items={result.style.issues}
            emptyText="Brak."
            renderItem={(item) => (
              <>
                <strong>{item.issue}</strong>
                <Quote text={item.fragment} />
                <span>{item.reasoning}</span>
              </>
            )}
          />
        </ResultCard>

        <ResultCard title="4a Zakres i poprawność środków językowych" score={`${result.language.points4a}/7`}>
          <ScoreTable rows={[
            ['Kryterium', '4a Zakres i poprawność środków językowych'],
            ['Zakres', result.language.rangeClass],
            ['Błędy językowe', result.language.languageErrors.length],
            ['Przedział CKE', result.language.bucket],
            ['Punkty 4a', result.language.points4a],
          ]} />
          <DetailList
            title="Błędy językowe"
            items={result.language.languageErrors}
            emptyText="Brak."
            renderItem={(item) => (
              <>
                <Quote text={item.error} />
                <span>{item.reasoning}</span>
              </>
            )}
          />
        </ResultCard>

        <ResultCard title="4b Poprawność ortograficzna" score={`${result.orthography.points4b}/2`}>
          <ScoreTable rows={[
            ['Kryterium', '4b Poprawność ortograficzna'],
            ['Błędy ortograficzne', result.orthography.orthographyErrors.length],
            ['Punkty 4b', result.orthography.points4b],
          ]} />
          <DetailList
            title="Błędy ortograficzne"
            items={result.orthography.orthographyErrors}
            emptyText="Brak."
            renderItem={(item) => (
              <>
                <Quote text={item.error} />
                <span>Poprawnie: {item.correct}</span>
              </>
            )}
          />
        </ResultCard>

        <ResultCard title="4c Poprawność interpunkcyjna" score={`${result.punctuation.points4c}/2`}>
          <ScoreTable rows={[
            ['Kryterium', '4c Poprawność interpunkcyjna'],
            ['Błędy interpunkcyjne', result.punctuation.punctuationErrors.length],
            ['Punkty 4c', result.punctuation.points4c],
          ]} />
          <DetailList
            title="Błędy interpunkcyjne"
            items={result.punctuation.punctuationErrors}
            emptyText="Brak."
            renderItem={(item) => (
              <>
                <strong>Pozycja {item.position}</strong>
                <Quote text={item.fragment} />
                <span>Propozycja: {item.suggestion}</span>
                <span>{item.reasoning}</span>
              </>
            )}
          />
        </ResultCard>

        <ResultCard title="Suma" score={`${result.totalScore}/35`}>
          <ScoreTable rows={totalRows} />
        </ResultCard>
      </section>
    </main>
  );
}

function MetaTile({ label, value }) {
  return (
    <div className="metaTile">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ScoreTile({ label, value, max }) {
  return (
    <article className="scoreTile">
      <span>Kryterium {label}</span>
      <strong>{value}/{max}</strong>
    </article>
  );
}

function ResultCard({ title, score, children }) {
  return (
    <article className="resultCard">
      <header className="resultCardHeader">
        <h2>{title}</h2>
        {score ? <span>{score}</span> : null}
      </header>
      {children}
    </article>
  );
}

function ScoreTable({ rows }) {
  return (
    <table className="scoreTable">
      <tbody>
        {rows.map(([label, value]) => (
          <tr key={label}>
            <th scope="row">{label}</th>
            <td>{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Reasoning({ title, text }) {
  if (!text) return null;

  return (
    <section className="reasoningBlock">
      <h3>{title}</h3>
      <p>{text}</p>
    </section>
  );
}

function DetailList({ title, items, emptyText, renderItem }) {
  return (
    <section className="detailList">
      <h3>{title}</h3>
      {items.length > 0 ? (
        <ol>
          {items.map((item, index) => (
            <li key={index}>
              {renderItem(item)}
            </li>
          ))}
        </ol>
      ) : (
        <p className="emptyText">{emptyText}</p>
      )}
    </section>
  );
}

function Quote({ text }) {
  return <q>{text}</q>;
}

function yesNo(value) {
  return value ? 'tak' : 'nie';
}

function LoadingOverlay() {
  const [dots, setDots] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev + 1) % 4);
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="loadingOverlay">
      <p>
        Przetwarzanie
        {'.'.repeat(dots)}
        <span style={{ color: 'transparent' }}>{'.'.repeat(4 - dots)}</span>
      </p>
    </div>
  );
}

export default App
