export type CategorySeed = {
  slug: string;
  nameNl: string;
  nameEn: string;
  descriptionNl: string;
  descriptionEn: string;
  colorToken: string;
  icon: string;
};

export const CATEGORIES: CategorySeed[] = [
  {
    slug: "nature",
    nameNl: "Natuur",
    nameEn: "Nature",
    descriptionNl: "Buiten kijken, ontdekken en zorgen voor wat groeit en leeft.",
    descriptionEn: "Looking, discovering and caring for what grows and lives outdoors.",
    colorToken: "--color-cat-nature",
    icon: "leaf",
  },
  {
    slug: "science",
    nameNl: "Wetenschap",
    nameEn: "Science",
    descriptionNl: "Vragen stellen, proefjes doen en zelf uitvinden hoe iets werkt.",
    descriptionEn: "Asking questions, running experiments and working out how things work.",
    colorToken: "--color-cat-science",
    icon: "flask",
  },
  {
    slug: "movement",
    nameNl: "Beweging",
    nameEn: "Movement",
    descriptionNl: "Rennen, klimmen, dansen en het lichaam uitdagen.",
    descriptionEn: "Running, climbing, dancing and challenging the body.",
    colorToken: "--color-cat-movement",
    icon: "run",
  },
  {
    slug: "creativity",
    nameNl: "Creativiteit",
    nameEn: "Creativity",
    descriptionNl: "Maken, tekenen, bouwen en bedenken wat er nog niet is.",
    descriptionEn: "Making, drawing, building and imagining what does not exist yet.",
    colorToken: "--color-cat-creativity",
    icon: "palette",
  },
  {
    slug: "cooking",
    nameNl: "Koken",
    nameEn: "Cooking",
    descriptionNl: "Samen eten maken, proeven en leren wat lekker en gezond is.",
    descriptionEn: "Making food together, tasting and learning what is tasty and healthy.",
    colorToken: "--color-cat-cooking",
    icon: "pot",
  },
  {
    slug: "practical",
    nameNl: "Praktische vaardigheden",
    nameEn: "Practical skills",
    descriptionNl: "Repareren, verzorgen en zelf oplossen wat kapot of rommelig is.",
    descriptionEn: "Repairing, maintaining and fixing what is broken or messy.",
    colorToken: "--color-cat-practical",
    icon: "wrench",
  },
  {
    slug: "entrepreneurship",
    nameNl: "Ondernemen",
    nameEn: "Entrepreneurship",
    descriptionNl: "Een idee bedenken, uitrekenen en echt uitvoeren.",
    descriptionEn: "Coming up with an idea, working out the numbers and actually doing it.",
    colorToken: "--color-cat-entrepreneurship",
    icon: "lightbulb",
  },
  {
    slug: "family",
    nameNl: "Gezinsband",
    nameEn: "Family connection",
    descriptionNl: "Tijd samen die je je later nog herinnert.",
    descriptionEn: "Time together that you still remember later.",
    colorToken: "--color-cat-family",
    icon: "home",
  },
  {
    slug: "community",
    nameNl: "Bijdragen aan anderen",
    nameEn: "Social contribution",
    descriptionNl: "Iets doen waar de buurt of een ander beter van wordt.",
    descriptionEn: "Doing something that makes the neighbourhood or someone else better off.",
    colorToken: "--color-cat-community",
    icon: "hands",
  },
  {
    slug: "history",
    nameNl: "Geschiedenis en cultuur",
    nameEn: "History and culture",
    descriptionNl: "Ontdekken wat er was voordat jij er was.",
    descriptionEn: "Discovering what was here before you were.",
    colorToken: "--color-cat-history",
    icon: "column",
  },
];

export type SkillSeed = { slug: string; nameNl: string; nameEn: string; descriptionNl: string; descriptionEn: string; icon: string };

export const SKILLS: SkillSeed[] = [
  { slug: "creativity", nameNl: "Creativiteit", nameEn: "Creativity", descriptionNl: "Nieuwe ideeen bedenken en uitvoeren.", descriptionEn: "Coming up with new ideas and carrying them out.", icon: "palette" },
  { slug: "problem-solving", nameNl: "Probleemoplossen", nameEn: "Problem-solving", descriptionNl: "Een probleem opdelen en stap voor stap aanpakken.", descriptionEn: "Breaking a problem down and tackling it step by step.", icon: "puzzle" },
  { slug: "communication", nameNl: "Communicatie", nameEn: "Communication", descriptionNl: "Vertellen, vragen stellen en echt luisteren.", descriptionEn: "Telling, asking and really listening.", icon: "speech" },
  { slug: "nature-awareness", nameNl: "Natuurbewustzijn", nameEn: "Nature awareness", descriptionNl: "Zien wat er buiten gebeurt en waarom het ertoe doet.", descriptionEn: "Noticing what happens outdoors and why it matters.", icon: "leaf" },
  { slug: "movement", nameNl: "Beweging", nameEn: "Movement", descriptionNl: "Kracht, balans en uithoudingsvermogen.", descriptionEn: "Strength, balance and stamina.", icon: "run" },
  { slug: "practical-independence", nameNl: "Praktische zelfstandigheid", nameEn: "Practical independence", descriptionNl: "Zelf dingen kunnen maken, verzorgen en repareren.", descriptionEn: "Being able to make, maintain and repair things yourself.", icon: "wrench" },
  { slug: "financial-literacy", nameNl: "Omgaan met geld", nameEn: "Financial literacy", descriptionNl: "Rekenen met prijzen, kosten en keuzes.", descriptionEn: "Working with prices, costs and choices.", icon: "coin" },
  { slug: "teamwork", nameNl: "Samenwerken", nameEn: "Teamwork", descriptionNl: "Taken verdelen en op elkaar rekenen.", descriptionEn: "Dividing tasks and relying on each other.", icon: "hands" },
  { slug: "citizenship", nameNl: "Burgerschap", nameEn: "Citizenship", descriptionNl: "Meedoen en zorgen voor de omgeving en elkaar.", descriptionEn: "Taking part and caring for your surroundings and each other.", icon: "flag" },
  { slug: "curiosity", nameNl: "Nieuwsgierigheid", nameEn: "Curiosity", descriptionNl: "Vragen blijven stellen en onderzoeken.", descriptionEn: "Keeping asking questions and investigating.", icon: "spark" },
];

export type MaterialSeed = { slug: string; nameNl: string; nameEn: string; commonlyAvailable?: boolean };

export const MATERIALS: MaterialSeed[] = [
  { slug: "paper", nameNl: "Papier", nameEn: "Paper" },
  { slug: "pencils", nameNl: "Potloden of stiften", nameEn: "Pencils or markers" },
  { slug: "scissors", nameNl: "Schaar", nameEn: "Scissors" },
  { slug: "glue", nameNl: "Lijm", nameEn: "Glue" },
  { slug: "tape", nameNl: "Plakband", nameEn: "Tape" },
  { slug: "cardboard", nameNl: "Karton of dozen", nameEn: "Cardboard or boxes" },
  { slug: "string", nameNl: "Touw of draad", nameEn: "String or twine" },
  { slug: "ruler", nameNl: "Liniaal of meetlint", nameEn: "Ruler or tape measure" },
  { slug: "notebook", nameNl: "Notitieboekje", nameEn: "Notebook" },
  { slug: "phone-camera", nameNl: "Telefoon met camera", nameEn: "Phone with a camera" },
  { slug: "timer", nameNl: "Timer of klok", nameEn: "Timer or clock" },
  { slug: "kitchen-scale", nameNl: "Weegschaal", nameEn: "Kitchen scale" },
  { slug: "measuring-cup", nameNl: "Maatbeker", nameEn: "Measuring cup" },
  { slug: "pan", nameNl: "Pan", nameEn: "Saucepan" },
  { slug: "knife-child-safe", nameNl: "Kindveilig mes", nameEn: "Child-safe knife" },
  { slug: "vegetables", nameNl: "Groenten", nameEn: "Vegetables" },
  { slug: "red-cabbage", nameNl: "Rodekool", nameEn: "Red cabbage" },
  { slug: "baking-soda", nameNl: "Baksoda", nameEn: "Baking soda" },
  { slug: "lemon", nameNl: "Citroen", nameEn: "Lemon" },
  { slug: "oats-and-dates", nameNl: "Havermout en dadels", nameEn: "Oats and dates" },
  { slug: "jar", nameNl: "Glazen pot", nameEn: "Glass jar" },
  { slug: "wood-scraps", nameNl: "Stukjes hout", nameEn: "Wood offcuts" },
  { slug: "bamboo-sticks", nameNl: "Bamboestokjes of holle stengels", nameEn: "Bamboo sticks or hollow stems" },
  { slug: "gloves", nameNl: "Handschoenen", nameEn: "Gloves" },
  { slug: "rubbish-bag", nameNl: "Vuilniszak", nameEn: "Rubbish bag" },
  { slug: "needle-and-thread", nameNl: "Naald en draad", nameEn: "Needle and thread" },
  { slug: "button", nameNl: "Knoop", nameEn: "Button" },
  { slug: "screwdriver", nameNl: "Schroevendraaier", nameEn: "Screwdriver" },
  { slug: "bicycle", nameNl: "Fiets", nameEn: "Bicycle" },
  { slug: "bicycle-pump", nameNl: "Fietspomp", nameEn: "Bicycle pump" },
  { slug: "chalk", nameNl: "Stoepkrijt", nameEn: "Pavement chalk" },
  { slug: "ball", nameNl: "Bal", nameEn: "Ball" },
  { slug: "rope", nameNl: "Springtouw", nameEn: "Skipping rope" },
  { slug: "cushions", nameNl: "Kussens en dekens", nameEn: "Cushions and blankets" },
  { slug: "seeds", nameNl: "Zaden", nameEn: "Seeds" },
  { slug: "soil", nameNl: "Potgrond", nameEn: "Potting soil" },
  { slug: "water", nameNl: "Water", nameEn: "Water" },
  { slug: "coins", nameNl: "Klein budget in contant geld", nameEn: "A small cash budget" },
  { slug: "old-photo", nameNl: "Oude familiefoto", nameEn: "An old family photo" },
  { slug: "books-or-internet", nameNl: "Boek of naslagwerk", nameEn: "A book or reference source" },
  { slug: "stick", nameNl: "Rechte stok", nameEn: "A straight stick" },
  { slug: "stones", nameNl: "Steentjes", nameEn: "Small stones" },
  { slug: "plastic-bottle", nameNl: "Lege plastic fles", nameEn: "Empty plastic bottle" },
  { slug: "shoebox", nameNl: "Schoenendoos", nameEn: "Shoebox" },
];

export type InterestSeed = { slug: string; nameNl: string; nameEn: string; emoji: string; categorySlug: string };

export const INTERESTS: InterestSeed[] = [
  { slug: "animals", nameNl: "Dieren", nameEn: "Animals", emoji: "🦔", categorySlug: "nature" },
  { slug: "outdoors", nameNl: "Buiten zijn", nameEn: "Being outdoors", emoji: "🌳", categorySlug: "nature" },
  { slug: "experiments", nameNl: "Proefjes", nameEn: "Experiments", emoji: "🧪", categorySlug: "science" },
  { slug: "space-and-weather", nameNl: "Ruimte en weer", nameEn: "Space and weather", emoji: "🌤️", categorySlug: "science" },
  { slug: "sport", nameNl: "Sport", nameEn: "Sport", emoji: "⚽", categorySlug: "movement" },
  { slug: "dance", nameNl: "Dansen", nameEn: "Dancing", emoji: "💃", categorySlug: "movement" },
  { slug: "drawing", nameNl: "Tekenen", nameEn: "Drawing", emoji: "✏️", categorySlug: "creativity" },
  { slug: "building", nameNl: "Knutselen en bouwen", nameEn: "Crafting and building", emoji: "🧱", categorySlug: "creativity" },
  { slug: "cooking", nameNl: "Koken", nameEn: "Cooking", emoji: "🥕", categorySlug: "cooking" },
  { slug: "baking", nameNl: "Bakken", nameEn: "Baking", emoji: "🧁", categorySlug: "cooking" },
  { slug: "fixing", nameNl: "Repareren", nameEn: "Fixing things", emoji: "🔧", categorySlug: "practical" },
  { slug: "gardening", nameNl: "Tuinieren", nameEn: "Gardening", emoji: "🌱", categorySlug: "practical" },
  { slug: "money-and-ideas", nameNl: "Geld en ideeen", nameEn: "Money and ideas", emoji: "💡", categorySlug: "entrepreneurship" },
  { slug: "inventing", nameNl: "Uitvinden", nameEn: "Inventing", emoji: "⚙️", categorySlug: "entrepreneurship" },
  { slug: "games-together", nameNl: "Samen spelen", nameEn: "Playing together", emoji: "🎲", categorySlug: "family" },
  { slug: "stories", nameNl: "Verhalen", nameEn: "Stories", emoji: "📖", categorySlug: "family" },
  { slug: "helping", nameNl: "Anderen helpen", nameEn: "Helping others", emoji: "🤝", categorySlug: "community" },
  { slug: "neighbourhood", nameNl: "De buurt", nameEn: "The neighbourhood", emoji: "🏘️", categorySlug: "community" },
  { slug: "history", nameNl: "Vroeger", nameEn: "The past", emoji: "🏺", categorySlug: "history" },
  { slug: "museums", nameNl: "Musea", nameEn: "Museums", emoji: "🖼️", categorySlug: "history" },
];

export type BadgeSeed = {
  slug: string;
  nameNl: string;
  nameEn: string;
  descriptionNl: string;
  descriptionEn: string;
  icon: string;
  scope: "FAMILY" | "CHILD";
  criteria: "QUESTS_COMPLETED" | "CATEGORY_COMPLETED" | "SKILL_PRACTISED" | "CATEGORIES_EXPLORED" | "REFLECTIONS_WRITTEN";
  threshold: number;
  categorySlug?: string;
  skillSlug?: string;
};

export const BADGES: BadgeSeed[] = [
  { slug: "first-adventure", nameNl: "Eerste avontuur", nameEn: "First adventure", descriptionNl: "Jullie eerste quest is afgerond.", descriptionEn: "Your first quest is complete.", icon: "flag", scope: "FAMILY", criteria: "QUESTS_COMPLETED", threshold: 1 },
  { slug: "five-adventures", nameNl: "Vijf avonturen", nameEn: "Five adventures", descriptionNl: "Vijf quests samen afgerond.", descriptionEn: "Five quests completed together.", icon: "medal", scope: "FAMILY", criteria: "QUESTS_COMPLETED", threshold: 5 },
  { slug: "ten-adventures", nameNl: "Tien avonturen", nameEn: "Ten adventures", descriptionNl: "Tien quests samen afgerond.", descriptionEn: "Ten quests completed together.", icon: "trophy", scope: "FAMILY", criteria: "QUESTS_COMPLETED", threshold: 10 },
  { slug: "explorer", nameNl: "Ontdekker", nameEn: "Explorer", descriptionNl: "Vijf verschillende categorieen geprobeerd.", descriptionEn: "Five different categories tried.", icon: "compass", scope: "FAMILY", criteria: "CATEGORIES_EXPLORED", threshold: 5 },
  { slug: "all-round-explorer", nameNl: "Alleskunner", nameEn: "All-round explorer", descriptionNl: "Alle tien categorieen geprobeerd.", descriptionEn: "All ten categories tried.", icon: "globe", scope: "FAMILY", criteria: "CATEGORIES_EXPLORED", threshold: 10 },
  { slug: "reflector", nameNl: "Nadenker", nameEn: "Reflector", descriptionNl: "Vijf reflectievragen beantwoord.", descriptionEn: "Five reflection questions answered.", icon: "thought", scope: "FAMILY", criteria: "REFLECTIONS_WRITTEN", threshold: 5 },
  { slug: "child-first-step", nameNl: "Op pad", nameEn: "On the way", descriptionNl: "Voor het eerst meegedaan aan een quest.", descriptionEn: "Took part in a quest for the first time.", icon: "boot", scope: "CHILD", criteria: "QUESTS_COMPLETED", threshold: 1 },
  { slug: "nature-friend", nameNl: "Natuurvriend", nameEn: "Nature friend", descriptionNl: "Drie natuurquests meegedaan.", descriptionEn: "Took part in three nature quests.", icon: "leaf", scope: "CHILD", criteria: "CATEGORY_COMPLETED", threshold: 3, categorySlug: "nature" },
  { slug: "kitchen-hand", nameNl: "Keukenhulp", nameEn: "Kitchen hand", descriptionNl: "Twee kookquests meegedaan.", descriptionEn: "Took part in two cooking quests.", icon: "pot", scope: "CHILD", criteria: "CATEGORY_COMPLETED", threshold: 2, categorySlug: "cooking" },
  { slug: "helping-hand", nameNl: "Helpende hand", nameEn: "Helping hand", descriptionNl: "Twee quests gedaan waar een ander beter van werd.", descriptionEn: "Two quests that made someone else better off.", icon: "hands", scope: "CHILD", criteria: "CATEGORY_COMPLETED", threshold: 2, categorySlug: "community" },
  { slug: "problem-solver", nameNl: "Probleemoplosser", nameEn: "Problem solver", descriptionNl: "Drie keer een quest gedaan die probleemoplossen traint.", descriptionEn: "Three quests that build problem-solving.", icon: "puzzle", scope: "CHILD", criteria: "SKILL_PRACTISED", threshold: 3, skillSlug: "problem-solving" },
  { slug: "maker", nameNl: "Maker", nameEn: "Maker", descriptionNl: "Drie creatieve quests meegedaan.", descriptionEn: "Took part in three creative quests.", icon: "palette", scope: "CHILD", criteria: "CATEGORY_COMPLETED", threshold: 3, categorySlug: "creativity" },
];
