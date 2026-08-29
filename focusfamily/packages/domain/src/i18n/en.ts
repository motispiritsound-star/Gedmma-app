/**
 * English copy. Every string is reviewed against the non-diagnostic and
 * non-shaming blocklists by `i18n.test.ts`; that test is the reason this file
 * says "what got in the way" rather than anything clinical.
 */
export const en = {
  'app.name': 'FocusFamily',
  'app.tagline': 'Time together, agreed together',
  'app.intro':
    'FocusFamily helps a family agree on device-free moments and keep them together. Grown-ups take part on the same terms as the children.',

  // ---- provenance -------------------------------------------------------
  'source.self_reported.label': 'Told by us',
  'source.self_reported.explanation':
    'Someone in the family typed this in. It is what you remember, not what a device counted.',
  'source.app_observed.label': 'Seen by FocusFamily',
  'source.app_observed.explanation':
    'FocusFamily watched its own timer for this. It knows about focus moments in this app, nothing else.',
  'source.os_verified.label': 'Reported by the phone',
  'source.os_verified.explanation':
    'The operating system reported this after everyone involved agreed to it. It is a total per broad category, never a list of apps or sites.',
  'source.simulated.label': 'Example data',
  'source.simulated.explanation':
    'This is made-up demo data so you can see how a screen looks. It is not about anyone in this family.',
  'confidence.low': 'Rough indication',
  'confidence.medium': 'Reasonable indication',
  'confidence.high': 'Measured',

  // ---- authorisation ----------------------------------------------------
  'authz.allowed': 'Allowed',
  'authz.capability_not_offered':
    'FocusFamily does not offer this. Reading messages, browsing history or live location is not part of the product.',
  'authz.unknown_action': 'Unknown action',
  'authz.admin_only': 'Only support staff can open this, and never family content.',
  'authz.admin_has_no_family_access': 'Support staff cannot open family content.',
  'authz.guardian_only': 'A grown-up in the family does this step.',
  'authz.other_family': 'This belongs to another family.',
  'authz.not_permitted': 'Not available for this account.',
  'authz.child_not_permitted': 'A grown-up in the family does this step together with you.',
  'authz.self_only': 'You can only do this for yourself.',
  'authz.no_membership': 'You are not part of this family yet.',

  // ---- consent ----------------------------------------------------------
  'consent.effective': 'Everyone involved has agreed.',
  'consent.missing_self': 'You have not agreed to this yet.',
  'consent.missing_guardian': 'A grown-up still has to agree to this.',
  'consent.missing_child_assent':
    'We also ask the person it is about. Nothing is measured until they say yes.',
  'consent.not_required_simulated': 'Example data needs no agreement.',
  'consent.statement.account.basic':
    'We keep your name, your language and who is in your family so the app works.',
  'consent.statement.measurement.self_report':
    'You may type in your own screen time, sleep and mood. You can stop at any time.',
  'consent.statement.measurement.app_observed':
    'FocusFamily records when a focus moment starts, pauses and ends. Only inside this app.',
  'consent.statement.measurement.os_verified':
    'The phone reports daily totals per broad category. Never which app, which site or which message.',
  'consent.statement.notifications.push':
    'We may send you a reminder. Quiet hours always win.',
  'consent.statement.insights.weekly_review':
    'We put your week together into a conversation agenda for the family.',
  'consent.statement.ai.assistant':
    'An AI helper may suggest one small change, using only the totals listed here. It is off unless you turn it on.',
  'consent.withdraw.hint':
    'Turning this off stops the measurement straight away. Everything already collected can be deleted from the same screen.',

  // ---- baseline ---------------------------------------------------------
  'baseline.not_started': 'Your quiet first week has not started yet.',
  'baseline.active':
    'Quiet first week. We are not suggesting anything yet - just get used to the app and talk about it.',
  'baseline.complete': 'Your first week is done. You can build your agreement now.',

  // ---- agreements -------------------------------------------------------
  'agreement.issue.no_rules': 'Add at least one thing you agree on.',
  'agreement.issue.adults_not_included':
    'At least one line has to apply to the grown-ups too. That is how this app works.',
  'agreement.issue.children_only_context':
    'This part of the day only asks something of the children. Add a line for the grown-ups.',
  'agreement.issue.window_too_long':
    'That window covers most of the day. Shorter moments are easier to keep.',
  'agreement.not_activatable': 'This agreement is not ready yet.',
  'agreement.member_required': 'Choose who this line is about.',
  'agreement.window_incomplete': 'Fill in both a start and an end time.',
  'agreement.variation.8_10': 'For the youngest',
  'agreement.variation.11_13': 'For 11 to 13',
  'agreement.variation.14_17': 'For 14 to 17',
  'agreement.variation.adult': 'For the grown-ups',

  'template.meals.text': 'While we eat, all phones are in the basket in the hall.',
  'template.meals.repair':
    'If someone forgets, they put it away and we carry on eating. Nothing else happens.',
  'template.homework.text':
    'Homework hour is quiet for everyone: no video, no messages, grown-ups included.',
  'template.homework.repair': 'If it does not work today, we try again tomorrow.',
  'template.bedtime.text':
    'From nine in the evening every phone charges in the kitchen, ours as well.',
  'template.bedtime.repair': 'Forgot? Take it downstairs when you notice.',
  'template.bedrooms.text': 'Bedrooms stay screen-free at night for all of us.',
  'template.bedrooms.repair': 'We remind each other kindly, once.',
  'template.school.text': 'We install a new app together and look at it for five minutes.',
  'template.school.repair': 'Installed something already? Show us and we look at it together.',
  'template.family_activities.text':
    'Once every weekend we do something together with no screens.',
  'template.family_activities.repair': 'A busy weekend happens. Then we pick a new moment.',

  // ---- focus ------------------------------------------------------------
  'focus.not_a_participant': 'You are not part of this focus moment.',
  'focus.title.dinner': 'Dinner together',
  'focus.title.homework': 'Homework hour',
  'focus.title.bedtime': 'Winding down',
  'focus.title.family_time': 'Family time',
  'focus.title.custom': 'Our own moment',
  'focus.start': 'Start together',
  'focus.pause': 'Pause',
  'focus.resume': 'Carry on',
  'focus.complete': 'We did it',
  'focus.abandon': 'Stop for now',
  'focus.offline_note':
    'No connection? The timer keeps running on this device and syncs later.',
  'focus.pause.someone_needed_me': 'Someone needed me',
  'focus.pause.urgent_call': 'A call that could not wait',
  'focus.pause.schoolwork': 'Something for school',
  'focus.pause.changed_my_mind': 'We changed our minds',
  'focus.pause.other': 'Something else',
  'focus.pause.prompt': 'No problem. What came up?',

  // ---- check-ins --------------------------------------------------------
  'checkin.title': 'How was today?',
  'checkin.intro': 'Three short questions. Your answers stay yours unless you share them.',
  'checkin.sleep': 'Roughly how many hours did you sleep?',
  'checkin.mood': 'How did today feel?',
  'checkin.conflict': 'Was there friction about screens today?',
  'checkin.mood.1': 'A tough one',
  'checkin.mood.2': 'Not my best',
  'checkin.mood.3': 'In between',
  'checkin.mood.4': 'Pretty good',
  'checkin.mood.5': 'Really good',
  'checkin.conflict.none': 'No',
  'checkin.conflict.a_little': 'A little',
  'checkin.conflict.quite_a_bit': 'Quite a bit',
  'checkin.share': 'Share this with the family',
  'checkin.private_note': 'Your note stays private unless you tick the box.',
  'copy.clinical_or_shaming': 'This wording is not something we put in front of a family.',

  // ---- weekly review ----------------------------------------------------
  'review.title': 'Your week together',
  'review.intro':
    'No grades and no totals to beat. Read it out loud at the table and pick one thing.',
  'review.well.focus_moments': 'You finished focus moments together.',
  'review.well.adults_joined': 'The grown-ups joined in.',
  'review.well.goal_progress': 'Your shared goal moved forward.',
  'review.well.checkins': 'Someone filled in how their day went.',
  'review.well.you_showed_up': 'You opened the app together. That is a start.',
  'review.talk.what_was_easy': 'What was easy to keep this week?',
  'review.talk.what_got_in_the_way': 'What got in the way when it did not work?',
  'review.talk.tense_moment': 'There was some friction. What happened just before it?',
  'review.talk.adults_next_week': 'How do the grown-ups join in more next week?',
  'review.talk.one_change': 'What is one small thing we change for next week?',
  'review.figure.focus_moments_completed': 'Focus moments finished',
  'review.figure.focus_moments_started': 'Focus moments started',
  'review.figure.average_sleep': 'Average sleep (hours)',
  'review.figure.average_mood': 'Average feeling (1-5)',
  'review.figure.active_agreements': 'Agreements in force',
  'review.data_note.no_os_data':
    'This week uses what you told us and what the app timer saw. No phone reported anything.',
  'review.data_note.mixed_with_os':
    'This week mixes what you told us, what the app timer saw and what the phone reported. Each number says which.',

  // ---- goals and celebration -------------------------------------------
  'goal.kind.device_free_dinners': 'Device-free dinners',
  'goal.kind.screen_free_evenings': 'Screen-free evenings',
  'goal.kind.shared_activities': 'Things we did together',
  'goal.kind.bedtime_routine': 'Winding down on time',
  'goal.kind.outdoor_time': 'Time outdoors',
  'celebration.goal.title': 'You reached it together',
  'celebration.goal.body': 'Your family got there. This card stays in your family only.',
  'celebration.goal.body_everyone':
    'Everyone joined in, grown-ups included. This card stays in your family only.',
  'celebration.private_note': 'Nobody outside your family sees this.',

  // ---- recommendations --------------------------------------------------
  'recommendation.add_adult_rule.title': 'Add one line for the grown-ups',
  'recommendation.add_adult_rule.body':
    'Pick one thing you already ask of the children and write it for yourselves too.',
  'recommendation.add_adult_rule.reason':
    'Your active agreement has no line that applies to a grown-up.',
  'recommendation.invite_second_guardian.title': 'Invite the other grown-up',
  'recommendation.invite_second_guardian.body':
    'Agreements hold better when both grown-ups can see and edit them.',
  'recommendation.invite_second_guardian.reason': 'There is one grown-up on this account.',
  'recommendation.shorten_focus.title': 'Try a shorter moment',
  'recommendation.shorten_focus.body':
    'Halve the length for a week. A short moment you finish beats a long one you stop.',
  'recommendation.shorten_focus.reason':
    'Fewer than half of the focus moments you started were finished.',
  'recommendation.schedule_dinner.title': 'Put one dinner in the calendar',
  'recommendation.schedule_dinner.body':
    'One fixed evening a week is enough to start with. Pick the easiest one.',
  'recommendation.schedule_dinner.reason': 'There is no shared meal moment scheduled yet.',
  'recommendation.bedtime_charging.title': 'Move the chargers out of the bedrooms',
  'recommendation.bedtime_charging.body':
    'Charge every phone in one spot downstairs, yours as well. Many families find evenings calmer.',
  'recommendation.bedtime_charging.reason':
    'The sleep hours typed in this week were shorter than eight on average, and there is no agreement about charging yet.',
  'recommendation.good_week.title': 'Talk about what worked',
  'recommendation.good_week.body':
    'You finished focus moments this week. Ask everyone which one they would keep.',
  'recommendation.good_week.reason': 'Focus moments were finished this week.',
  'recommendation.engine_note':
    'This suggestion comes from a fixed set of rules, using only the facts listed underneath it.',

  // ---- adapters and native ---------------------------------------------
  'adapter.mock.not_a_measurement':
    'This device shows example data. Nothing here is about a real person.',
  'adapter.mock.not_authorized': 'Example data is switched off for this device.',
  'adapter.ios.not_authorized': 'Screen Time access has not been granted on this iPhone.',
  'adapter.android.no_usage_access': 'Usage access has not been granted on this phone.',
  'adapter.android.shield_unsupported':
    'Android cannot pause other apps for us. A focus moment here is a promise we keep together.',
  'adapter.none.platform_unsupported':
    'This device cannot report screen time to us. You can type in your own numbers instead.',
  'adapter.none.self_report_instead': 'Type in your own numbers instead.',
  'native.ios.requires_family_controls_entitlement':
    'Apple has to grant this app the Family Controls entitlement before an iPhone can report totals.',
  'native.ios.requires_development_build':
    'Screen Time access needs a development build; it does not work in Expo Go.',
  'native.ios.category_granularity_only':
    'Apple reports broad categories only. FocusFamily never receives a list of apps.',
  'native.ios.no_per_app_detail_shared': 'Per-app detail stays on the device.',
  'native.android.requires_usage_access':
    'Android asks you to grant usage access in Settings. We take you there and explain why first.',
  'native.android.no_third_party_shield':
    'Android has no supported way for us to pause other apps.',
  'native.android.oem_variation':
    'Some manufacturers change or remove these figures. Then we show nothing rather than a guess.',

  // ---- notifications ----------------------------------------------------
  'notification.channel_off': 'Notifications are off for this account.',
  'notification.category_off': 'This kind of notification is switched off.',
  'notification.quiet_hours': 'Held back until quiet hours end.',
  'notification.security': 'Account security message.',
  'notification.ok': 'Sent.',
  'notification.category.focus_reminder': 'Focus moment starting',
  'notification.category.checkin_invite': 'Check-in reminder',
  'notification.category.weekly_review_ready': 'Weekly review ready',
  'notification.category.agreement_change_proposed': 'Someone proposed a change',
  'notification.category.celebration': 'Something to celebrate',
  'notification.category.account_security': 'Account security',

  // ---- billing ----------------------------------------------------------
  'billing.upgrade_needed': 'This is part of Family Premium.',
  'billing.unknown_session': 'We could not find that checkout.',
  'billing.plan.free': 'Free',
  'billing.plan.family_premium': 'Family Premium',
  'billing.plan.sponsored': 'Sponsored by an employer or school',
  'billing.free_forever':
    'One agreement, focus moments, check-ins, the weekly review, export and deletion are free and stay free.',
  'billing.no_ads': 'No advertising, and we never sell data about your family.',
  'billing.test_mode': 'Test mode. No money moves.',

  // ---- data rights ------------------------------------------------------
  'rights.export.title': 'Download your data',
  'rights.export.body': 'A JSON file with everything we hold about you.',
  'rights.export.ready': 'Your file is ready. The link works for seven days.',
  'rights.export.download': 'Download',
  'action.saved': 'Saved.',
  'rights.deletion.title': 'Delete data',
  'rights.deletion.body':
    'We wait seven days so you can change your mind, then it is gone for good.',
  'rights.deletion.scheduled': 'Deletion is scheduled. You can cancel it until then.',
  'rights.not_collected.title': 'What we never hold',
  'rights.consent_history.title': 'What was agreed, and when',
  'id.format': 'That identifier is not valid.',
  'time.format': 'Use a time like 19:30.',
} as const;

export type MessageKey = keyof typeof en;
