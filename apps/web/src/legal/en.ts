import type { LegalChrome, LegalCopy } from './types.js';

/**
 * The English legal texts: translations of the Dutch pages, which are the
 * authoritative ones. Each page says so, because a translation that quietly
 * claims equal standing is a problem waiting for a dispute.
 *
 * Kept section-for-section with nl.ts, and a test enforces that: a document
 * with a paragraph in one language and not the other is not a translation.
 */
export const CHROME_EN: LegalChrome = {
  pageNames: {
    TERMS: 'Terms of use',
    PRIVACY: 'Privacy statement',
    DISCLAIMER: 'Disclaimer',
    COOKIES: 'Cookie statement',
  },
  lastUpdated: 'Last updated',
  incompleteTitle: 'Not finished yet',
  incompleteBody:
    'Buurklus is not yet registered as a company. These details belong here and are still missing. Until they are filled in, this document is incomplete and no rights can be derived from it.',
  incompleteFields: {
    legalName: 'the name of the company behind Buurklus',
    kvk: 'the Chamber of Commerce number',
    vatId: 'the VAT identification number',
    address: 'the registered address',
    email: 'the email address for privacy questions',
    dpoEmail: 'the data protection officer',
  },
  backToSite: 'Back to Buurklus',
  otherDocuments: 'Other documents',
  languageNote:
    'This is a translation. Where the Dutch and English texts differ, the Dutch text prevails.',
  tables: {
    data: 'What',
    purpose: 'Why',
    basis: 'Lawful basis',
    period: 'How long',
    reason: 'Why that period',
    right: 'Right',
    how: 'How to use it',
    processor: 'Party',
    role: 'What they do for us',
    location: 'Where',
  },
  rights: [
    {
      right: 'Access (art. 15)',
      how: 'In the app under Privacy and data → Download your data. You get a file with everything we hold, straight away.',
    },
    {
      right: 'Portability (art. 20)',
      how: 'That same file is JSON: readable by a person and usable by another system.',
    },
    {
      right: 'Rectification (art. 16)',
      how: 'Your name, email and profile you change yourself in the app. If something else is wrong, email us.',
    },
    {
      right: 'Erasure (art. 17)',
      how: 'In the app under Privacy and data → Delete account. This cannot be undone.',
    },
    {
      right: 'Restriction (art. 18)',
      how: 'If you think we are processing something we should not, email us. We pause the processing while we look into it.',
    },
    {
      right: 'Objection (art. 21)',
      how: 'You can object by email to processing based on legitimate interest, such as fraud prevention.',
    },
    {
      right: 'Withdrawing consent (art. 7(3))',
      how: 'Only relevant to marketing email. One switch in the app, and your account keeps working.',
    },
  ],
  processors: [
    {
      processor: 'SMS provider',
      role: 'Sends the sign-in code to your phone. Receives your number and the code, nothing else.',
      location: 'EU (still to be contracted)',
    },
    {
      processor: 'Hosting provider',
      role: 'Runs the servers and the database Buurklus lives on.',
      location: 'EU (still to be contracted)',
    },
    {
      processor: 'Payment provider',
      role: 'Handles subscription payments. Not active now: Buurklus is free and nothing is charged.',
      location: 'EU (still to be contracted)',
    },
    {
      processor: 'Push notifications (Apple, Google)',
      role: 'Delivers notifications to your phone. Receives a device token and the text of the notification.',
      location: 'United States, under the EU standard contractual clauses',
    },
  ],
  dataCategories: [
    {
      data: 'Your mobile number',
      purpose: 'Signing you in and recognising your account. You sign in with a code by SMS, without a password.',
      basis: 'Performance of the contract (art. 6(1)(b))',
    },
    {
      data: 'Your name and email address',
      purpose: 'Making you recognisable to the tradesperson you invite, and reaching you about a job.',
      basis: 'Performance of the contract',
    },
    {
      data: 'The job you post: description, photos, municipality, address, budget',
      purpose:
        'Showing tradespeople what the work involves so they can quote. Your street address is shared only with the tradesperson you award the job to.',
      basis: 'Performance of the contract',
    },
    {
      data: 'Quotes and messages',
      purpose: 'Making the conversation between you and the tradesperson possible, and keeping it while the job runs.',
      basis: 'Performance of the contract',
    },
    {
      data: 'Reviews you write',
      purpose: 'Showing other customers what earlier customers thought of a tradesperson.',
      basis: 'Performance of the contract',
    },
    {
      data: 'Business details of tradespeople: Chamber of Commerce number, VAT id, IBAN',
      purpose:
        'Checking that a tradesperson really is registered and — if there is ever anything to pay — invoicing.',
      basis: 'Performance of the contract and legal obligation (art. 6(1)(c))',
    },
    {
      data: 'When and from which IP address you agreed to the terms',
      purpose: 'Being able to demonstrate which text you accepted, and when.',
      basis: 'Legal obligation (art. 7(1)) and legitimate interest',
    },
    {
      data: 'Sign-in codes, sessions and device tokens',
      purpose: 'Keeping you signed in safely and delivering notifications.',
      basis: 'Performance of the contract',
    },
    {
      data: 'Invoices and payment records',
      purpose: 'Bookkeeping and the statutory retention period for tax records.',
      basis: 'Legal obligation (art. 52 AWR)',
    },
    {
      data: 'Consent for marketing email',
      purpose: 'Sending you something about Buurklus occasionally, if you asked for it.',
      basis: 'Consent (art. 6(1)(a))',
    },
  ],
};

export const LEGAL_EN: LegalCopy = {
  PRIVACY: {
    title: 'Privacy statement',
    metaDescription:
      'What Buurklus processes about you, why, how long we keep it and what you can do about it.',
    intro:
      'Buurklus brings households and tradespeople together. That needs some data about you — and no more than that. Below is exactly what we process, why, for how long, and what you can do about it.',
    sections: [
      {
        heading: 'Who is responsible',
        paragraphs: [
          'The controller is the party that decides what happens to your data. For Buurklus that is:',
        ],
        generated: 'operator',
      },
      {
        heading: 'What we process and why',
        paragraphs: [
          'Every row below also names the lawful basis: the reason we are allowed to process it. For nearly everything that is "performance of the contract" — without your phone number we cannot sign you in, and without your job description nobody can write you a quote.',
          'Consent appears exactly once, and that is not an accident. Consent has to be something you can freely refuse and withdraw at any time. That works for marketing email, and it does not work for your phone number — which is why we do not call the latter consent.',
        ],
        generated: 'dataCategories',
      },
      {
        heading: 'What we do not do',
        list: [
          'We do not sell your data. Not to anyone, and not as anonymised "market research" either.',
          'We set no advertising or tracking cookies and use no analytics that follow you across websites.',
          'We load no fonts, maps or scripts from third-party servers. The site fetches everything from our own domains, so your browser never contacts a party you did not ask for.',
          'We take no decisions about you based solely on automated processing that affect you.',
        ],
      },
      {
        heading: 'Who we share data with',
        paragraphs: [
          'Two kinds. First, other users: a tradesperson who sees your job in their area gets your description, your municipality and your district. Your street address and phone number reach them only once you award them the job. In the other direction, you see a tradesperson’s business name, their Chamber of Commerce check and their reviews.',
          'Second, processors: parties that carry something out for us and may do nothing with your data for themselves. We sign a data processing agreement with each of them.',
        ],
        generated: 'processors',
      },
      {
        heading: 'Transfers outside the European Economic Area',
        paragraphs: [
          'The Buurklus servers are in the EU. One part falls outside it: push notifications go through Apple and Google, who are in the United States. The European Commission’s standard contractual clauses apply to that. If you would rather avoid it, turn push notifications off; the rest of the app carries on working.',
        ],
      },
      {
        heading: 'How long we keep things',
        paragraphs: [
          'Every period below is actually carried out by a clean-up task that runs nightly. The list comes from the same place in the code as that task, so this page cannot promise a deletion that never happens.',
        ],
        generated: 'retention',
      },
      {
        heading: 'Your rights',
        paragraphs: [
          'You have the rights below, and you do not have to give a reason for using them. What can be done in the app happens immediately; for anything else we respond within 30 days.',
        ],
        generated: 'rights',
      },
      {
        heading: 'What happens when you delete your account',
        paragraphs: [
          'Your name, phone number, email address, address, photos and message texts are erased. The account itself stays as an empty shell, because things hang off it that are not yours alone.',
          'Your reviews stay, without your name and without the text: the rating is the tradesperson’s reputation and the basis on which other customers choose. The other half of a conversation is not yours to erase. And invoices have to be kept for seven years under Dutch tax law; those are detached from your account but not destroyed. The GDPR expressly allows this (art. 17(3)).',
        ],
      },
      {
        heading: 'Security',
        paragraphs: [
          'Traffic to the app and the website runs over TLS. Sign-in codes and session tokens are stored only as hashes, so they are useless in a breach. We hold no passwords, because you sign in with a code by SMS. Access to the database is limited to those who need it to run the service.',
          'Absolute security does not exist. If you find a vulnerability, report it to us before you share it elsewhere; we will respond, and we will not come after you.',
        ],
      },
      {
        heading: 'Age',
        paragraphs: [
          'You have to be 16 or older to open an account. That is the age Dutch implementing law sets for services like this one. We ask you to confirm it when you sign up; we do not verify it, and we would rather say so here than pretend otherwise.',
          'If you know a child under 16 has an account, tell us. We will delete it.',
        ],
      },
      {
        heading: 'Changes',
        paragraphs: [
          'If this statement changes it gets a new date, and we ask you to agree again the next time you sign in. We record which version you accepted, so it is always clear which text applied to you.',
        ],
      },
      {
        heading: 'Making a complaint',
        paragraphs: [
          'If you disagree with something, email us first — that is usually quicker. If we cannot resolve it, you have the right to complain to the Dutch Data Protection Authority. You always have that right, including if you never contacted us first.',
        ],
      },
    ],
  },

  TERMS: {
    title: 'Terms of use',
    metaDescription:
      'The agreement between you and Buurklus: what we do and do not do, what it costs, and where you stand.',
    intro:
      'These are the arrangements between you and Buurklus. They apply from the moment you create an account. Read them once — they are kept short, and they are about your money and your work.',
    sections: [
      {
        heading: 'Who we are',
        generated: 'operator',
      },
      {
        heading: 'What Buurklus is, and above all what it is not',
        paragraphs: [
          'Buurklus is a place where customers describe a job and tradespeople reply with a quote. We bring you together. That is where our role ends.',
          'The agreement about the work is between you and the tradesperson, or between you and the customer, directly. We are not a party to it. We do not carry out work, we do not supervise it, we do not set prices and we do not collect money for the job. If something goes wrong with the work, that is a matter between you and the other party.',
          'That also means: we do not guarantee that a tradesperson does good work, turns up on time or carries insurance. What we do is check that a tradesperson has supplied a Chamber of Commerce number, and show reviews from earlier customers. That is information to base your choice on, not an endorsement from us.',
        ],
      },
      {
        heading: 'Your account',
        list: [
          'You must be 16 or older.',
          'One account per person or business. Your account is yours; you give your sign-in codes to nobody.',
          'The details you provide are accurate. A tradesperson supplies the Chamber of Commerce number they are actually registered under.',
          'You may delete your account at any time, in the app, with no notice period and no reason.',
        ],
      },
      {
        heading: 'If you post a job',
        paragraphs: [
          'Describe the job as fully as you can: it saves questions and produces more useful quotes. Your street address and phone number stay hidden from tradespeople until you award the job to one of them.',
          'A job accepts at most six quotes. That is deliberate: more quotes do not make the choice better, and they mostly mean tradespeople putting work into a reply for nothing.',
          'You are not committed to anything. If no quote suits you, do not award the job and withdraw it.',
        ],
      },
      {
        heading: 'If you are a tradesperson',
        list: [
          'You need a valid Chamber of Commerce number. That applies to sole traders too.',
          'Browsing jobs costs nothing. Only when you send a quote does one come off your monthly allowance.',
          'If the customer withdraws the job before awarding it, you get that quote back. If you simply lose to a competitor, you do not: you paid for the opportunity, not the outcome.',
          'Your quote is a real offer. Put in it what the customer can expect, and stand by it.',
          'You finish the job with the customer, not through us. You invoice the customer directly. We take no commission on your turnover.',
        ],
      },
      {
        heading: 'What it costs',
        paragraphs: [
          'Right now, nothing. Buurklus is free for customers and for tradespeople. There is no subscription, no commission, and we do not ask you for payment details.',
          'That will not last forever — a platform that costs nothing will one day not exist. If we start charging, the following applies, and we will hold to it: you hear about it at least 30 days in advance, by email and in the app; nothing is ever charged automatically; and without your explicit agreement your account stays free, with the same monthly allowance as now.',
          'If you do start paying later, the prices shown in the app at that time apply, excluding VAT. Paid subscriptions can be cancelled monthly.',
        ],
      },
      {
        heading: 'Reviews',
        paragraphs: [
          'Only a customer who had a job completed can review that job, and only once. That is precisely why reviews on Buurklus are worth something.',
          'Write what you think, including when it is not flattering. We do not remove a review because a tradesperson is unhappy with it. We do remove reviews that are abusive, contain other people’s personal data, or are demonstrably about something other than the job that was done. The tradesperson gets one public right of reply.',
        ],
      },
      {
        heading: 'What is not allowed',
        list: [
          'Posting fake jobs, or posting a job on someone else’s behalf without their knowledge.',
          'Passing yourself off as another business, or using a Chamber of Commerce number that is not yours.',
          'Buying, selling, trading or writing your own reviews.',
          'Approaching other users about anything other than the job you are in contact about.',
          'Scraping, overloading or attempting to break into the service.',
          'Posting discriminatory, threatening or otherwise unlawful content.',
        ],
        paragraphs: [
          'If you do any of these, we can block or delete your account. Where something is serious, we report it to the police.',
        ],
      },
      {
        heading: 'Liability',
        paragraphs: [
          'We do our best to keep Buurklus working, but we do not promise uninterrupted availability or flawless operation. Maintenance, outages and bugs are part of it.',
          'We are not liable for damage arising from the work itself, from the arrangements you make with the other party, or from the conduct of other users. That is the point of everything above: we are not a party to that agreement.',
          'To the extent we would be liable, that liability is limited to the amount you paid Buurklus in the preceding twelve months. While Buurklus is free, that is zero. This limitation does not apply in the case of intent or deliberate recklessness on our part, nor where the law does not allow it — for instance in the case of death or personal injury.',
          'If you are a consumer, nothing in these terms affects your mandatory statutory rights.',
        ],
      },
      {
        heading: 'Ending it',
        paragraphs: [
          'You can stop at any time by deleting your account. We can end an account if you breach these terms, or if we stop running Buurklus. In that last case we will say so at least 30 days in advance, so you can download your data and finish any jobs in progress.',
        ],
      },
      {
        heading: 'Complaints and disputes',
        paragraphs: [
          'If you have a complaint about Buurklus itself, email us. We respond on the substance within 30 days.',
          'If we cannot resolve it, you can go to the Dutch courts. Dutch law applies to these terms. If you are a consumer, you may also go to the courts in the country where you live, and you can use the European ODR platform.',
        ],
      },
      {
        heading: 'Changes',
        paragraphs: [
          'We may change these terms. The changed version gets a new date and we ask you to agree again the next time you sign in. If you do not agree, you can delete your account; the old terms continue to apply to what happened before.',
        ],
      },
    ],
  },

  DISCLAIMER: {
    title: 'Disclaimer',
    metaDescription:
      'What Buurklus does and does not stand behind: the role of the platform, the information on the site and the prices.',
    intro:
      'A short summary of what Buurklus does and does not stand behind. This belongs with the terms of use and does not replace them.',
    sections: [
      {
        heading: 'We are not the one doing the work',
        paragraphs: [
          'Buurklus does not carry out jobs and is not a party to the agreement between a customer and a tradesperson. Price, planning, execution, warranty and payment are arranged between you.',
        ],
      },
      {
        heading: 'What the Chamber of Commerce check does and does not mean',
        paragraphs: [
          'A tradesperson supplies a Chamber of Commerce number when they sign up. That says the business exists and is registered. It says nothing about competence, insurance, financial health or how the work will turn out. For larger jobs, ask for references, proof of insurance and a written confirmation of the order yourself.',
        ],
      },
      {
        heading: 'Prices on this site are indications',
        paragraphs: [
          'The guide prices per trade are there to give you a sense of the order of magnitude, so you can post a job. They are not quotes and no rights can be derived from them. What a job costs appears in the tradesperson’s quote.',
        ],
      },
      {
        heading: 'Reviews are customers’ opinions',
        paragraphs: [
          'Reviews come from customers who actually had the job completed. They are their experiences and their words, not a judgement by Buurklus. We check who is allowed to review, not whether they are right.',
        ],
      },
      {
        heading: 'Information and availability',
        paragraphs: [
          'We do our best to keep the information on this site correct and current, but we cannot guarantee that everything is complete and accurate at all times. No rights can be derived from obvious errors.',
          'Buurklus may be temporarily unreachable due to maintenance or an outage. We aim for as little interruption as possible, but we do not promise uninterrupted availability.',
        ],
      },
      {
        heading: 'Links to other sites',
        paragraphs: [
          'Where there is a link to somebody else’s website, that site is not ours and we are not responsible for its content or its privacy policy.',
        ],
      },
    ],
  },

  COOKIES: {
    title: 'Cookie statement',
    metaDescription:
      'Buurklus sets no tracking cookies. What is stored on your device, and why.',
    intro:
      'This page is shorter than you are used to, because there is not much to report: Buurklus sets no tracking cookies and does not measure your behaviour.',
    sections: [
      {
        heading: 'No cookie banner, and why not',
        paragraphs: [
          'Consent is needed for cookies and similar techniques that are not strictly necessary: advertising cookies, analytics that recognise you, social plug-ins. We use none of them. What is left is the technique needed to keep you signed in, and that requires no consent (art. 11.7a(3) of the Dutch Telecommunications Act).',
          'A banner asking for consent to something that needs no consent is not extra care, it is noise. So there is not one.',
        ],
      },
      {
        heading: 'What is on your device',
        list: [
          'In the app: your session tokens, in your phone’s secure storage (Keychain on iOS, Keystore on Android). That keeps you signed in without an SMS code every time.',
          'In the browser version of the app: the same tokens, in localStorage. That is less well protected than a phone’s secure storage, which is why we recommend the app if you have it.',
          'Your language choice, so the site does not start in Dutch every time when you want English.',
        ],
        paragraphs: [
          'Nothing else. Sign out or delete your account and all of it is cleared.',
        ],
      },
      {
        heading: 'No external scripts or fonts',
        paragraphs: [
          'The website loads fonts, images and scripts only from our own domains. So no request goes to Google Fonts, an ad network or an analytics provider when you open this page. That is deliberate: such a request hands your IP address to a party you have nothing to do with, before you have been able to choose anything.',
        ],
      },
      {
        heading: 'If this changes',
        paragraphs: [
          'If we ever measure something that needs consent, we will ask for it first, with a choice you can genuinely refuse, and it will be described here before it is switched on.',
        ],
      },
    ],
  },
};
