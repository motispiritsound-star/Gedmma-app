/**
 * Het design system: toegankelijkheid is hier geen extraatje maar het punt.
 * Deze tests controleren de dingen die in de praktijk misgaan: labels die niet
 * aan hun veld hangen, fouten die een schermlezer niet hoort, en knoppen zonder
 * naam.
 */
import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Etiket, Kaart, Kerncijfer, Keuzeveld, Knop, Laden, Leegstaat, Melding, Veld } from '../src/ontwerp/index.tsx';

describe('Veld', () => {
  test('label hoort bij het invoerveld', () => {
    render(<Veld label="E-mailadres" />);
    const invoer = screen.getByLabelText('E-mailadres');
    expect(invoer.tagName).toBe('INPUT');
  });

  test('uitleg wordt gekoppeld met aria-describedby', () => {
    render(<Veld label="Wachtwoord" uitleg="Minimaal 12 tekens." />);
    const invoer = screen.getByLabelText('Wachtwoord');
    const beschrijving = invoer.getAttribute('aria-describedby');
    expect(beschrijving).toBeTruthy();
    expect(document.getElementById(beschrijving!.split(' ')[0]!)?.textContent).toBe('Minimaal 12 tekens.');
  });

  test('een fout is een alert en markeert het veld als ongeldig', () => {
    render(<Veld label="Bedrag" fout="Vul een bedrag in" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Vul een bedrag in');
    expect(screen.getByLabelText('Bedrag')).toHaveAttribute('aria-invalid', 'true');
  });

  test('een verplicht veld is als zodanig gemarkeerd', () => {
    render(<Veld label="Naam" verplicht />);
    expect(screen.getByLabelText(/Naam/)).toBeRequired();
  });
});

describe('Keuzeveld', () => {
  test('label en opties werken', async () => {
    render(
      <Keuzeveld
        label="Btw"
        opties={[
          { waarde: '21', tekst: '21 procent' },
          { waarde: '9', tekst: '9 procent' },
        ]}
      />,
    );
    const keuze = screen.getByLabelText('Btw') as HTMLSelectElement;
    await userEvent.selectOptions(keuze, '9');
    expect(keuze.value).toBe('9');
  });
});

describe('Knop', () => {
  test('is standaard type button, zodat hij geen formulier verstuurt', () => {
    render(<Knop>Opslaan</Knop>);
    expect(screen.getByRole('button', { name: 'Opslaan' })).toHaveAttribute('type', 'button');
  });

  test('bezig maakt hem onbruikbaar en meldt dat aan hulpsoftware', () => {
    render(<Knop bezig>Versturen</Knop>);
    const knop = screen.getByRole('button', { name: 'Versturen' });
    expect(knop).toBeDisabled();
    expect(knop).toHaveAttribute('aria-busy', 'true');
  });

  test('reageert op klikken', async () => {
    let geklikt = 0;
    render(<Knop onClick={() => (geklikt += 1)}>Klik</Knop>);
    await userEvent.click(screen.getByRole('button', { name: 'Klik' }));
    expect(geklikt).toBe(1);
  });
});

describe('Melding', () => {
  test('een fout is een alert, de rest een status', () => {
    const { rerender } = render(<Melding soort="fout" titel="Mis">tekst</Melding>);
    expect(screen.getByRole('alert')).toHaveTextContent('Mis');
    rerender(<Melding soort="goed">gelukt</Melding>);
    expect(screen.getByRole('status')).toHaveTextContent('gelukt');
  });
});

describe('Laden en leeg', () => {
  test('laden meldt zich aan een schermlezer', () => {
    render(<Laden tekst="Bezig met laden" />);
    expect(screen.getByRole('status')).toHaveTextContent('Bezig met laden');
  });

  test('een lege lijst legt uit wat je kunt doen', () => {
    render(<Leegstaat titel="Nog geen facturen" uitleg="Maak je eerste factuur." />);
    expect(screen.getByText('Nog geen facturen')).toBeTruthy();
    expect(screen.getByText('Maak je eerste factuur.')).toBeTruthy();
  });
});

describe('Kaart en kerncijfer', () => {
  test('de kaarttitel is een kop, zodat de pagina te navigeren is', () => {
    render(<Kaart titel="Omzet">inhoud</Kaart>);
    expect(screen.getByRole('heading', { name: 'Omzet' })).toBeTruthy();
  });

  test('een kerncijfer koppelt zijn uitleg aan de waarde', () => {
    render(<Kerncijfer label="Winst" waarde="1.234,00" uitleg="Omzet min kosten." />);
    const waarde = screen.getByText('1.234,00');
    const beschrijving = waarde.getAttribute('aria-describedby');
    expect(document.getElementById(beschrijving!)?.textContent).toBe('Omzet min kosten.');
  });

  test('een etiket toont zijn tekst', () => {
    render(<Etiket soort="goed">Betaald</Etiket>);
    expect(screen.getByText('Betaald')).toBeTruthy();
  });
});
