import { Redirect } from 'expo-router';

/**
 * Alles wat geen bestaande route is, gaat terug naar het begin. Dat vangt
 * kapotte deeplinks op, en zorgt dat de webversie ook werkt wanneer hij niet
 * in de hoofdmap van een domein staat.
 */
export default function NietGevonden() {
  return <Redirect href="/" />;
}
