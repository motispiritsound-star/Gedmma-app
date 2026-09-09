import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/**
 * Eén melding per dag, op een tijd die de ouder kiest.
 *
 * De melding wordt lokaal op het toestel ingepland — er is geen server bij
 * betrokken en er gaat niets naar buiten. Dat is meteen de reden dat dit mag
 * bij een app voor kinderen: er wordt niemand gevolgd.
 */
export const HERINNERING_ID = 'slimvos-dagelijks';

const TEKSTEN = [
  { titel: 'Even oefenen?', tekst: 'Tien vragen en je dagdoel staat weer.' },
  { titel: 'Vos wacht op je', tekst: 'Er staat een ronde klaar.' },
  { titel: 'Nog even vandaag', tekst: 'Een paar minuten is genoeg om je reeks te houden.' },
];

export async function vraagToestemming(): Promise<boolean> {
  const bestaand = await Notifications.getPermissionsAsync();
  if (bestaand.granted) return true;
  if (!bestaand.canAskAgain) return false;
  const gevraagd = await Notifications.requestPermissionsAsync();
  return gevraagd.granted;
}

export async function zetHerinnering(uur: number, minuut = 0): Promise<boolean> {
  if (!(await vraagToestemming())) return false;
  await stopHerinnering();

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('herinnering', {
      name: 'Dagelijkse herinnering',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const bericht = TEKSTEN[Math.floor(Math.random() * TEKSTEN.length)];
  await Notifications.scheduleNotificationAsync({
    identifier: HERINNERING_ID,
    content: { title: bericht.titel, body: bericht.tekst },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: uur,
      minute: minuut,
      channelId: 'herinnering',
    },
  });
  return true;
}

export async function stopHerinnering(): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(HERINNERING_ID);
  } catch {
    // Er stond er nog geen; dat is prima.
  }
}

export async function staatAan(): Promise<boolean> {
  const ingepland = await Notifications.getAllScheduledNotificationsAsync();
  return ingepland.some((n) => n.identifier === HERINNERING_ID);
}
