/**
 * De routes en het geraamte van de applicatie.
 *
 * Drie toestanden: niet aangemeld (alleen aanmelden en registreren), aangemeld
 * maar nog geen administratie gekozen (onboarding), en aan het werk.
 */
import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useApp } from './context/App.tsx';
import { Laden } from './ontwerp/index.tsx';
import { Schil } from './schermen/Schil.tsx';
import { Aanmelden } from './schermen/Aanmelden.tsx';
import { Onboarding } from './schermen/Onboarding.tsx';

const Dashboard = lazy(() => import('./schermen/Dashboard.tsx').then((m) => ({ default: m.Dashboard })));
const Facturen = lazy(() => import('./schermen/Facturen.tsx').then((m) => ({ default: m.Facturen })));
const FactuurScherm = lazy(() => import('./schermen/Factuur.tsx').then((m) => ({ default: m.FactuurScherm })));
const Relaties = lazy(() => import('./schermen/Relaties.tsx').then((m) => ({ default: m.Relaties })));
const Inkoop = lazy(() => import('./schermen/Inkoop.tsx').then((m) => ({ default: m.Inkoop })));
const Bank = lazy(() => import('./schermen/Bank.tsx').then((m) => ({ default: m.Bank })));
const Uren = lazy(() => import('./schermen/Uren.tsx').then((m) => ({ default: m.Uren })));
const Rapporten = lazy(() => import('./schermen/Rapporten.tsx').then((m) => ({ default: m.Rapporten })));
const Instellingen = lazy(() => import('./schermen/Instellingen.tsx').then((m) => ({ default: m.Instellingen })));

export function App() {
  const { ik, bezig, administratieId, t } = useApp();

  if (bezig) {
    return (
      <div className="inhoud">
        <Laden tekst={t('algemeen.laden')} />
      </div>
    );
  }

  if (!ik?.aangemeld || !ik.gebruiker?.mfaVoldaan) {
    return <Aanmelden />;
  }

  if (!administratieId) {
    return <Onboarding />;
  }

  return (
    <Schil>
      <Suspense fallback={<Laden tekst={t('algemeen.laden')} />}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/facturen" element={<Facturen />} />
          <Route path="/facturen/nieuw" element={<FactuurScherm />} />
          <Route path="/facturen/:id" element={<FactuurScherm />} />
          <Route path="/relaties" element={<Relaties />} />
          <Route path="/inkoop" element={<Inkoop />} />
          <Route path="/bank" element={<Bank />} />
          <Route path="/uren/*" element={<Uren />} />
          <Route path="/cijfers/*" element={<Rapporten />} />
          <Route path="/instellingen/*" element={<Instellingen />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Schil>
  );
}
