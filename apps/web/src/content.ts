import type { Locale } from '@khidma/shared';

/**
 * Website copy. Deliberately separate from the app's translation bundle: the
 * app labels controls, the site has to argue a case, and mixing the two makes
 * both worse. Authored in each language rather than translated from French,
 * so the Arabic reads as Arabic.
 */
export interface SiteCopy {
  meta: {
    title: string;
    description: string;
    proTitle: string;
    proDescription: string;
    ogLocale: string;
  };
  /** ctaShort is used below 560px, where the full label wraps to three lines. */
  nav: { trades: string; how: string; pros: string; cta: string; ctaShort: string; forCustomers: string };
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    primaryCta: string;
    secondaryCta: string;
    note: string;
  };
  proof: { trades: string; cities: string; free: string; verified: string };
  how: { title: string; subtitle: string; steps: { title: string; body: string }[] };
  trades: { title: string; subtitle: string; all: string; budgetFrom: string };
  cities: { title: string; subtitle: string; andMore: string };
  trust: { title: string; items: { title: string; body: string }[] };
  proTeaser: { title: string; body: string; cta: string; bullets: string[] };
  faq: { title: string; items: { q: string; a: string }[] };
  footer: {
    tagline: string;
    product: string;
    company: string;
    legal: string;
    links: { about: string; contact: string; terms: string; privacy: string; help: string };
    rights: string;
    languageLabel: string;
  };
  pro: {
    hero: { eyebrow: string; title: string; subtitle: string; cta: string; ctaShort: string; note: string };
    value: { title: string; items: { title: string; body: string }[] };
    pricing: {
      title: string;
      subtitle: string;
      monthly: string;
      yearly: string;
      perMonth: string;
      perYear: string;
      excludingVat: string;
      includingVat: string;
      quotes: string;
      trades: string;
      cities: string;
      citiesAll: string;
      headStart: string;
      noHeadStart: string;
      seats: string;
      choose: string;
      popular: string;
      vatNote: string;
      trialNote: string;
    };
    how: { title: string; steps: { title: string; body: string }[] };
    faq: { title: string; items: { q: string; a: string }[] };
  };
}

const fr: SiteCopy = {
  meta: {
    title: 'Khidma — Trouvez un artisan de confiance au Maroc',
    description:
      "Décrivez vos travaux et recevez jusqu'à 6 devis gratuits d'artisans et d'entreprises vérifiés, partout au Maroc. Gratuit et sans engagement.",
    proTitle: 'Khidma Pro — Recevez des demandes de clients près de chez vous',
    proDescription:
      "Développez votre activité avec des demandes qualifiées dans vos métiers et vos villes. Abonnement mensuel, 14 jours d'essai gratuit.",
    ogLocale: 'fr_MA',
  },
  nav: {
    trades: 'Métiers',
    how: 'Comment ça marche',
    pros: 'Vous êtes professionnel',
    cta: 'Publier une demande',
    ctaShort: 'Publier',
    forCustomers: 'Vous cherchez un artisan',
  },
  hero: {
    eyebrow: 'Gratuit pour les particuliers',
    title: 'Trouvez le bon professionnel, près de chez vous',
    subtitle:
      "Décrivez vos travaux en deux minutes. Des artisans et des entreprises vérifiés de votre ville vous envoient leurs devis. Vous comparez, vous choisissez.",
    primaryCta: 'Publier une demande',
    secondaryCta: 'Voir les métiers',
    note: 'Sans engagement · Vos coordonnées ne sont partagées qu’avec le professionnel que vous choisissez',
  },
  proof: {
    trades: 'métiers couverts',
    cities: 'villes au Maroc',
    free: 'gratuit pour les clients',
    verified: 'entreprises vérifiées par ICE',
  },
  how: {
    title: 'Comment ça marche',
    subtitle: 'Trois étapes, et vous avez de quoi comparer.',
    steps: [
      {
        title: 'Décrivez vos travaux',
        body: "Le métier, la ville, quelques photos si vous en avez. Deux minutes suffisent, et c'est gratuit.",
      },
      {
        title: 'Recevez jusqu’à 6 devis',
        body: "Les professionnels de votre région vous répondent avec un prix, un délai et ce qui est inclus. Généralement sous 24 heures.",
      },
      {
        title: 'Choisissez en confiance',
        body: "Comparez les prix, les avis et l'expérience. Le professionnel retenu reçoit alors vos coordonnées, pas avant.",
      },
    ],
  },
  trades: {
    title: 'Tous les métiers du bâtiment et des services',
    subtitle: 'De la petite réparation au chantier complet.',
    all: 'Et bien d’autres',
    budgetFrom: 'à partir de',
  },
  cities: {
    title: 'Partout au Maroc',
    subtitle: 'De Tanger à Dakhla, dans les grandes villes comme dans les villes moyennes.',
    andMore: 'et {{count}} autres villes',
  },
  trust: {
    title: 'Pourquoi Khidma',
    items: [
      {
        title: 'Des entreprises vérifiées',
        body: "Chaque société professionnelle fournit son ICE, l'identifiant public de son entreprise. Vous pouvez le vérifier vous-même.",
      },
      {
        title: 'Des avis qui veulent dire quelque chose',
        body: "Seul un client dont les travaux sont terminés peut laisser un avis, et une seule fois. Pas d'avis achetés.",
      },
      {
        title: 'Votre adresse reste privée',
        body: "Tant que vous n'avez pas choisi, les professionnels voient votre quartier, pas votre adresse ni votre numéro.",
      },
      {
        title: 'Aucune commission',
        body: "Khidma ne prend rien sur vos travaux. Vous payez le professionnel directement, comme vous en convenez avec lui.",
      },
    ],
  },
  proTeaser: {
    title: 'Vous êtes artisan ou société de services ?',
    body: "Recevez des demandes qualifiées dans vos métiers et vos villes, et remplissez votre agenda sans démarchage.",
    cta: 'Découvrir Khidma Pro',
    bullets: [
      'Des demandes de clients réels, près de chez vous',
      'Vous répondez quand la demande vous intéresse',
      'Abonnement mensuel, sans commission sur vos chantiers',
      '14 jours d’essai gratuit, sans carte bancaire',
    ],
  },
  faq: {
    title: 'Questions fréquentes',
    items: [
      {
        q: 'Combien ça coûte pour un particulier ?',
        a: "Rien. Publier une demande, recevoir des devis et échanger avec les professionnels est entièrement gratuit. Ce sont les professionnels qui s'abonnent.",
      },
      {
        q: 'Combien de devis vais-je recevoir ?',
        a: "Jusqu'à six. Au-delà, la demande n'accepte plus de réponses, pour que vous gardiez une décision gérable.",
      },
      {
        q: 'Qui voit mon adresse et mon numéro ?',
        a: "Uniquement le professionnel dont vous acceptez le devis. Avant cela, les autres voient votre ville et votre quartier, rien de plus.",
      },
      {
        q: 'Comment se passe le paiement des travaux ?',
        a: "Directement entre vous et le professionnel, selon ce que vous convenez. Khidma n'intervient pas dans le paiement et ne prend aucune commission.",
      },
      {
        q: 'Et si je change d’avis ?',
        a: "Vous pouvez annuler votre demande tant que vous n'avez pas accepté de devis. Les professionnels qui avaient répondu sont prévenus et remboursés.",
      },
    ],
  },
  footer: {
    tagline: 'La plateforme qui met en relation les Marocains avec des artisans et des entreprises de confiance.',
    product: 'Le service',
    company: 'Khidma',
    legal: 'Informations légales',
    links: {
      about: 'À propos',
      contact: 'Contact',
      terms: "Conditions d'utilisation",
      privacy: 'Confidentialité',
      help: 'Aide',
    },
    rights: 'Tous droits réservés.',
    languageLabel: 'Langue',
  },
  pro: {
    hero: {
      eyebrow: 'Pour les artisans et les entreprises',
      title: 'Remplissez votre agenda, sans démarchage',
      subtitle:
        "Des clients décrivent leurs travaux chaque jour dans votre ville. Recevez les demandes qui correspondent à vos métiers et répondez à celles qui vous intéressent.",
      cta: 'Commencer l’essai gratuit',
      ctaShort: 'Essai gratuit',
      note: '14 jours offerts · Sans carte bancaire · Résiliable à tout moment',
    },
    value: {
      title: 'Ce que vous obtenez',
      items: [
        {
          title: 'Des demandes qualifiées',
          body: "Le client a déjà décrit ses travaux, sa ville et son budget. Vous savez à quoi vous répondez avant de vous déplacer.",
        },
        {
          title: 'Vous choisissez vos chantiers',
          body: "Consulter les demandes ne coûte rien. Vous ne dépensez un devis que lorsque vous décidez de répondre.",
        },
        {
          title: 'Aucune commission',
          body: "Vous facturez votre client directement. Khidma ne prend rien sur le montant de vos travaux.",
        },
        {
          title: 'Un profil qui vous fait gagner',
          body: "Vos avis, vos années d'expérience et votre ICE vérifié apparaissent à côté de chaque devis.",
        },
      ],
    },
    pricing: {
      title: 'Des formules simples',
      subtitle: 'Vous payez pour recevoir les demandes, jamais un pourcentage de vos chantiers.',
      monthly: 'Mensuel',
      yearly: 'Annuel',
      perMonth: '/ mois',
      perYear: '/ an',
      excludingVat: 'HT',
      includingVat: 'TTC',
      quotes: 'devis par mois',
      trades: 'métiers',
      cities: 'villes',
      citiesAll: 'Villes illimitées',
      headStart: 'Accès aux demandes {{minutes}} min avant',
      noHeadStart: 'Accès aux demandes de votre zone',
      seats: 'comptes collaborateurs',
      choose: 'Choisir cette formule',
      popular: 'Le plus choisi',
      vatNote: 'Prix hors taxes. TVA 20 % ajoutée à la facturation.',
      trialNote: 'Chaque nouveau compte démarre avec {{days}} jours d’essai et {{credits}} devis offerts.',
    },
    how: {
      title: 'Comment démarrer',
      steps: [
        { title: 'Créez votre profil', body: "Vos métiers, vos villes, votre ICE ou votre CIN. Comptez dix minutes." },
        { title: 'Recevez les demandes', body: "Celles qui correspondent à vos métiers et à votre zone d'intervention arrivent dans l'application." },
        { title: 'Envoyez vos devis', body: "Un prix, un délai, ce qui est inclus. Le client compare et vous répond." },
      ],
    },
    faq: {
      title: 'Questions fréquentes',
      items: [
        {
          q: 'Qu’est-ce qu’un devis dans ma formule ?',
          a: "Chaque réponse envoyée à un client consomme un devis de votre quota mensuel. Consulter les demandes ne coûte rien.",
        },
        {
          q: 'Que se passe-t-il si je ne gagne pas le chantier ?',
          a: "Le devis reste consommé : vous avez payé pour l'opportunité, pas pour le résultat. En revanche, si le client annule sa demande avant d'attribuer les travaux, votre devis vous est remboursé.",
        },
        {
          q: 'Puis-je changer de formule ?',
          a: "Oui, à tout moment depuis l'application. Le changement prend effet immédiatement et vos devis restants sont conservés.",
        },
        {
          q: 'Faut-il une entreprise enregistrée ?',
          a: "Une société fournit son ICE. Un auto-entrepreneur ou un artisan en nom propre peut s'inscrire avec sa CIN.",
        },
        {
          q: 'Comment se passe le paiement de l’abonnement ?',
          a: "Par carte bancaire via CMI, ou par virement pour les entreprises qui facturent sur compte. Vous recevez une facture avec la TVA.",
        },
      ],
    },
  },
};

const ar: SiteCopy = {
  meta: {
    title: 'خدمة — اعثر على حرفي موثوق في المغرب',
    description:
      'صف الأشغال التي تحتاجها واحصل على ما يصل إلى 6 عروض أسعار مجانية من حرفيين وشركات موثقة في جميع أنحاء المغرب. مجانًا وبدون التزام.',
    proTitle: 'خدمة برو — استقبل طلبات العملاء بالقرب منك',
    proDescription:
      'طوّر نشاطك بطلبات حقيقية في مهنك ومدنك. اشتراك شهري مع 14 يومًا تجربة مجانية.',
    ogLocale: 'ar_MA',
  },
  nav: {
    trades: 'المهن',
    how: 'كيف يعمل',
    pros: 'أنت محترف',
    cta: 'انشر طلبًا',
    ctaShort: 'انشر طلبًا',
    forCustomers: 'تبحث عن حرفي',
  },
  hero: {
    eyebrow: 'مجاني للأفراد',
    title: 'اعثر على المحترف المناسب بالقرب منك',
    subtitle:
      'صف أشغالك في دقيقتين. حرفيون وشركات موثقة من مدينتك يرسلون لك عروض أسعارهم. تقارن، ثم تختار.',
    primaryCta: 'انشر طلبًا',
    secondaryCta: 'تصفح المهن',
    note: 'بدون التزام · لا تُشارَك معلومات الاتصال بك إلا مع المحترف الذي تختاره',
  },
  proof: {
    trades: 'مهنة مغطاة',
    cities: 'مدينة في المغرب',
    free: 'مجاني للعملاء',
    verified: 'شركات موثقة بالمعرف الموحد',
  },
  how: {
    title: 'كيف يعمل',
    subtitle: 'ثلاث خطوات، ويصبح لديك ما تقارن به.',
    steps: [
      {
        title: 'صف أشغالك',
        body: 'المهنة، المدينة، وبعض الصور إن توفرت. دقيقتان تكفيان، والأمر مجاني.',
      },
      {
        title: 'استقبل حتى 6 عروض',
        body: 'يجيبك محترفو منطقتك بالسعر والأجل وما يشمله العرض. عادةً خلال 24 ساعة.',
      },
      {
        title: 'اختر بثقة',
        body: 'قارن الأسعار والتقييمات والخبرة. المحترف الذي تختاره هو وحده من يتوصل بمعلومات الاتصال بك، وليس قبل ذلك.',
      },
    ],
  },
  trades: {
    title: 'جميع مهن البناء والخدمات',
    subtitle: 'من الإصلاح البسيط إلى الورش الكاملة.',
    all: 'والمزيد',
    budgetFrom: 'ابتداءً من',
  },
  cities: {
    title: 'في جميع أنحاء المغرب',
    subtitle: 'من طنجة إلى الداخلة، في المدن الكبرى والمتوسطة على حد سواء.',
    andMore: 'و{{count}} مدينة أخرى',
  },
  trust: {
    title: 'لماذا خدمة',
    items: [
      {
        title: 'شركات موثقة',
        body: 'كل شركة محترفة تقدم معرفها الموحد للمقاولة، وهو معطى عمومي يمكنك التحقق منه بنفسك.',
      },
      {
        title: 'تقييمات لها معنى',
        body: 'لا يترك التقييم إلا عميل انتهت أشغاله، ومرة واحدة فقط. لا تقييمات مشتراة.',
      },
      {
        title: 'عنوانك يبقى خاصًا',
        body: 'قبل أن تختار، يرى المحترفون حيّك فقط، لا عنوانك ولا رقم هاتفك.',
      },
      {
        title: 'بدون أي عمولة',
        body: 'خدمة لا تقتطع شيئًا من أشغالك. تؤدي للمحترف مباشرة، حسب ما تتفقان عليه.',
      },
    ],
  },
  proTeaser: {
    title: 'هل أنت حرفي أو شركة خدمات؟',
    body: 'استقبل طلبات حقيقية في مهنك ومدنك، واملأ جدولك دون بحث عن الزبناء.',
    cta: 'اكتشف خدمة برو',
    bullets: [
      'طلبات من عملاء حقيقيين بالقرب منك',
      'ترد فقط عندما يهمك الطلب',
      'اشتراك شهري، بدون عمولة على أوراشك',
      '14 يومًا تجربة مجانية، بدون بطاقة بنكية',
    ],
  },
  faq: {
    title: 'أسئلة شائعة',
    items: [
      {
        q: 'كم يكلف الأمر بالنسبة للفرد؟',
        a: 'لا شيء. نشر الطلب وتلقي العروض والتواصل مع المحترفين مجاني بالكامل. المحترفون هم من يشتركون.',
      },
      {
        q: 'كم عرضًا سأتلقى؟',
        a: 'ما يصل إلى ستة. بعدها يتوقف الطلب عن قبول الردود، حتى يبقى القرار في متناولك.',
      },
      {
        q: 'من يرى عنواني ورقمي؟',
        a: 'المحترف الذي تقبل عرضه وحده. قبل ذلك يرى الآخرون مدينتك وحيّك، لا أكثر.',
      },
      {
        q: 'كيف يتم أداء ثمن الأشغال؟',
        a: 'مباشرة بينك وبين المحترف، حسب اتفاقكما. خدمة لا تتدخل في الأداء ولا تأخذ أي عمولة.',
      },
      {
        q: 'وإن غيّرت رأيي؟',
        a: 'يمكنك إلغاء طلبك ما دمت لم تقبل أي عرض. يُشعَر المحترفون الذين ردّوا ويُعاد لهم رصيدهم.',
      },
    ],
  },
  footer: {
    tagline: 'المنصة التي تربط المغاربة بحرفيين وشركات موثوقة.',
    product: 'الخدمة',
    company: 'خدمة',
    legal: 'معلومات قانونية',
    links: {
      about: 'من نحن',
      contact: 'اتصل بنا',
      terms: 'شروط الاستخدام',
      privacy: 'الخصوصية',
      help: 'المساعدة',
    },
    rights: 'جميع الحقوق محفوظة.',
    languageLabel: 'اللغة',
  },
  pro: {
    hero: {
      eyebrow: 'للحرفيين والشركات',
      title: 'املأ جدولك دون البحث عن الزبناء',
      subtitle:
        'كل يوم يصف عملاء أشغالهم في مدينتك. استقبل الطلبات المطابقة لمهنك، ورد على ما يهمك منها.',
      cta: 'ابدأ التجربة المجانية',
      ctaShort: 'تجربة مجانية',
      note: '14 يومًا مجانًا · بدون بطاقة بنكية · يمكن الإلغاء في أي وقت',
    },
    value: {
      title: 'ما الذي تحصل عليه',
      items: [
        {
          title: 'طلبات واضحة',
          body: 'العميل وصف أشغاله ومدينته وميزانيته مسبقًا. تعرف على ماذا ترد قبل أن تتنقل.',
        },
        {
          title: 'أنت تختار أوراشك',
          body: 'الاطلاع على الطلبات مجاني. لا تستهلك عرضًا إلا حين تقرر الرد.',
        },
        {
          title: 'بدون أي عمولة',
          body: 'تفوتر عميلك مباشرة. خدمة لا تقتطع شيئًا من مبلغ أشغالك.',
        },
        {
          title: 'ملف يكسب لك الثقة',
          body: 'تقييماتك وسنوات خبرتك ومعرفك الموحد الموثق تظهر بجانب كل عرض ترسله.',
        },
      ],
    },
    pricing: {
      title: 'باقات بسيطة',
      subtitle: 'تؤدي مقابل استقبال الطلبات، لا نسبة من أوراشك.',
      monthly: 'شهري',
      yearly: 'سنوي',
      perMonth: '/ شهريًا',
      perYear: '/ سنويًا',
      excludingVat: 'دون الضريبة',
      includingVat: 'مع الضريبة',
      quotes: 'عرض سعر شهريًا',
      trades: 'مهن',
      cities: 'مدن',
      citiesAll: 'مدن غير محدودة',
      headStart: 'الوصول للطلبات قبل {{minutes}} دقيقة',
      noHeadStart: 'الوصول لطلبات منطقتك',
      seats: 'حسابات للموظفين',
      choose: 'اختيار هذه الباقة',
      popular: 'الأكثر اختيارًا',
      vatNote: 'الأسعار دون احتساب الضريبة. تضاف الضريبة على القيمة المضافة 20% عند الفوترة.',
      trialNote: 'كل حساب جديد يبدأ بـ{{days}} يومًا تجربة و{{credits}} عروض مجانية.',
    },
    how: {
      title: 'كيف تبدأ',
      steps: [
        { title: 'أنشئ ملفك', body: 'مهنك، مدنك، ومعرفك الموحد أو بطاقتك الوطنية. عشر دقائق تكفي.' },
        { title: 'استقبل الطلبات', body: 'تصلك في التطبيق الطلبات المطابقة لمهنك ولنطاق تدخلك.' },
        { title: 'أرسل عروضك', body: 'سعر، أجل، وما يشمله العرض. العميل يقارن ثم يجيبك.' },
      ],
    },
    faq: {
      title: 'أسئلة شائعة',
      items: [
        {
          q: 'ما المقصود بعرض السعر في باقتي؟',
          a: 'كل رد ترسله لعميل يستهلك عرضًا من حصتك الشهرية. الاطلاع على الطلبات مجاني.',
        },
        {
          q: 'ماذا لو لم أكسب الورش؟',
          a: 'يبقى العرض مستهلكًا: أنت تؤدي مقابل الفرصة لا مقابل النتيجة. لكن إن ألغى العميل طلبه قبل إسناد الأشغال، يُعاد لك رصيدك.',
        },
        {
          q: 'هل يمكنني تغيير الباقة؟',
          a: 'نعم، في أي وقت من التطبيق. يسري التغيير فورًا وتحتفظ بعروضك المتبقية.',
        },
        {
          q: 'هل يلزم أن تكون لدي شركة مسجلة؟',
          a: 'الشركة تقدم معرفها الموحد. أما المقاول الذاتي أو الحرفي باسمه الشخصي فيسجل ببطاقته الوطنية.',
        },
        {
          q: 'كيف يتم أداء الاشتراك؟',
          a: 'ببطاقة بنكية عبر CMI، أو بتحويل بنكي للشركات التي تفوتر على حساب. تتوصل بفاتورة تتضمن الضريبة.',
        },
      ],
    },
  },
};

const en: SiteCopy = {
  meta: {
    title: 'Khidma — Find a trusted tradesperson in Morocco',
    description:
      'Describe your job and receive up to 6 free quotes from verified tradespeople and companies across Morocco. Free, with no commitment.',
    proTitle: 'Khidma Pro — Receive customer requests near you',
    proDescription:
      'Grow your business with qualified requests in your trades and your cities. Monthly subscription, 14-day free trial.',
    ogLocale: 'en_MA',
  },
  nav: {
    trades: 'Trades',
    how: 'How it works',
    pros: 'For professionals',
    cta: 'Post a job',
    ctaShort: 'Post a job',
    forCustomers: 'Looking for a tradesperson',
  },
  hero: {
    eyebrow: 'Free for households',
    title: 'Find the right professional, close to home',
    subtitle:
      'Describe your job in two minutes. Verified tradespeople and companies in your city send you their quotes. You compare, you choose.',
    primaryCta: 'Post a job',
    secondaryCta: 'Browse trades',
    note: 'No commitment · Your contact details go only to the professional you choose',
  },
  proof: {
    trades: 'trades covered',
    cities: 'cities in Morocco',
    free: 'free for customers',
    verified: 'businesses verified by ICE',
  },
  how: {
    title: 'How it works',
    subtitle: 'Three steps, and you have something to compare.',
    steps: [
      {
        title: 'Describe your job',
        body: 'The trade, the city, a few photos if you have them. Two minutes is enough, and it costs nothing.',
      },
      {
        title: 'Receive up to 6 quotes',
        body: 'Professionals in your area reply with a price, a timescale and what is included. Usually within 24 hours.',
      },
      {
        title: 'Choose with confidence',
        body: 'Compare prices, reviews and experience. Only the professional you pick receives your contact details, and not before.',
      },
    ],
  },
  trades: {
    title: 'Every building and service trade',
    subtitle: 'From a small repair to a full renovation.',
    all: 'And many more',
    budgetFrom: 'from',
  },
  cities: {
    title: 'Across Morocco',
    subtitle: 'From Tangier to Dakhla, in the major cities and the mid-sized ones alike.',
    andMore: 'and {{count}} more cities',
  },
  trust: {
    title: 'Why Khidma',
    items: [
      {
        title: 'Verified businesses',
        body: 'Every professional company supplies its ICE, the public identifier of a Moroccan business. You can check it yourself.',
      },
      {
        title: 'Reviews that mean something',
        body: 'Only a customer whose work is finished can leave a review, and only once. No bought ratings.',
      },
      {
        title: 'Your address stays private',
        body: 'Until you choose, professionals see your district — not your address and not your number.',
      },
      {
        title: 'No commission',
        body: 'Khidma takes nothing from your job. You pay the professional directly, on the terms you agree between you.',
      },
    ],
  },
  proTeaser: {
    title: 'Are you a tradesperson or a service company?',
    body: 'Receive qualified requests in your trades and your cities, and fill your diary without chasing work.',
    cta: 'Discover Khidma Pro',
    bullets: [
      'Requests from real customers near you',
      'Reply only when a job interests you',
      'Monthly subscription, no commission on your work',
      '14-day free trial, no card needed',
    ],
  },
  faq: {
    title: 'Frequently asked questions',
    items: [
      {
        q: 'What does it cost a household?',
        a: 'Nothing. Posting a job, receiving quotes and messaging professionals is entirely free. It is the professionals who subscribe.',
      },
      {
        q: 'How many quotes will I get?',
        a: 'Up to six. After that the job stops accepting replies, so your decision stays manageable.',
      },
      {
        q: 'Who sees my address and phone number?',
        a: 'Only the professional whose quote you accept. Before that, the others see your city and district, nothing more.',
      },
      {
        q: 'How is the work paid for?',
        a: 'Directly between you and the professional, on whatever terms you agree. Khidma takes no part in the payment and no commission.',
      },
      {
        q: 'What if I change my mind?',
        a: 'You can cancel your request at any point before you accept a quote. Professionals who replied are notified and refunded.',
      },
    ],
  },
  footer: {
    tagline: 'The platform connecting people in Morocco with tradespeople and companies they can trust.',
    product: 'The service',
    company: 'Khidma',
    legal: 'Legal',
    links: {
      about: 'About',
      contact: 'Contact',
      terms: 'Terms of use',
      privacy: 'Privacy',
      help: 'Help',
    },
    rights: 'All rights reserved.',
    languageLabel: 'Language',
  },
  pro: {
    hero: {
      eyebrow: 'For tradespeople and companies',
      title: 'Fill your diary without chasing work',
      subtitle:
        'Customers describe their jobs in your city every day. Receive the requests that match your trades, and reply to the ones worth your time.',
      cta: 'Start the free trial',
      ctaShort: 'Free trial',
      note: '14 days free · No card needed · Cancel any time',
    },
    value: {
      title: 'What you get',
      items: [
        {
          title: 'Qualified requests',
          body: 'The customer has already described the work, the city and the budget. You know what you are quoting before you travel.',
        },
        {
          title: 'You pick your jobs',
          body: 'Browsing requests costs nothing. You only spend a quote when you decide to reply.',
        },
        {
          title: 'No commission',
          body: 'You invoice your customer directly. Khidma takes nothing from the value of your work.',
        },
        {
          title: 'A profile that wins work',
          body: 'Your reviews, your years of experience and your verified ICE appear beside every quote you send.',
        },
      ],
    },
    pricing: {
      title: 'Simple plans',
      subtitle: 'You pay to receive the requests, never a percentage of your jobs.',
      monthly: 'Monthly',
      yearly: 'Yearly',
      perMonth: '/ month',
      perYear: '/ year',
      excludingVat: 'excl. VAT',
      includingVat: 'incl. VAT',
      quotes: 'quotes per month',
      trades: 'trades',
      cities: 'cities',
      citiesAll: 'Unlimited cities',
      headStart: '{{minutes}}-minute head start on new jobs',
      noHeadStart: 'Access to jobs in your area',
      seats: 'staff accounts',
      choose: 'Choose this plan',
      popular: 'Most popular',
      vatNote: 'Prices exclude tax. 20% Moroccan VAT is added at invoicing.',
      trialNote: 'Every new account starts with {{days}} days of trial and {{credits}} free quotes.',
    },
    how: {
      title: 'Getting started',
      steps: [
        { title: 'Create your profile', body: 'Your trades, your cities, and your ICE or CIN. About ten minutes.' },
        { title: 'Receive requests', body: 'Jobs matching your trades and your travel radius arrive in the app.' },
        { title: 'Send your quotes', body: 'A price, a timescale, what is included. The customer compares and replies.' },
      ],
    },
    faq: {
      title: 'Frequently asked questions',
      items: [
        {
          q: 'What counts as a quote in my plan?',
          a: 'Every reply you send a customer uses one quote from your monthly allowance. Browsing requests costs nothing.',
        },
        {
          q: 'What happens if I do not win the job?',
          a: 'The quote stays spent: you paid for the opportunity, not the outcome. If the customer cancels before awarding the work, though, your quote is refunded.',
        },
        {
          q: 'Can I change plan?',
          a: 'Yes, at any time from the app. The change takes effect immediately and your remaining quotes are kept.',
        },
        {
          q: 'Do I need a registered company?',
          a: 'A company supplies its ICE. A sole trader or auto-entrepreneur can register with their CIN instead.',
        },
        {
          q: 'How is the subscription paid?',
          a: 'By bank card through CMI, or by transfer for companies that invoice on account. You receive an invoice showing the VAT.',
        },
      ],
    },
  },
};

export const COPY: Record<Locale, SiteCopy> = { fr, ar, en };
