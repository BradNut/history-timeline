export interface ClassifyResult {
	topicId: number;
	subtopicId: number | null;
}

type TopicRow = { id: number; slug: string };
type SubtopicRow = { id: number; topicId: number; slug: string };

type Rule = {
	keywords: string[];
	topicSlug: string;
	subtopicSlug: string | null;
};

const RULES: Rule[] = [
	// Musical > Jazz
	{ keywords: ['jazz', 'bebop', 'swing music', 'blues musician', 'big band'], topicSlug: 'musical', subtopicSlug: 'jazz' },
	// Musical > Classical
	{ keywords: ['classical music', 'composer', 'symphony', 'orchestra', 'opera', 'baroque', 'concerto', 'conductor'], topicSlug: 'musical', subtopicSlug: 'classical' },
	// Musical > Rock
	{ keywords: ['rock music', 'rock musician', 'heavy metal', 'punk rock', 'alternative rock', 'hard rock', 'indie rock', 'grunge'], topicSlug: 'musical', subtopicSlug: 'rock' },
	// Musical > Pop
	{ keywords: ['pop music', 'pop singer', 'rhythm and blues', 'soul music', 'funk music', 'disco', 'hip-hop', 'hip hop', 'rappers', 'electronic music', 'country music', 'folk music'], topicSlug: 'musical', subtopicSlug: 'pop' },
	// Musical (generic — keep last among musical rules)
	{ keywords: ['musician', 'singer', 'songwriter', 'vocalist', 'guitarist', 'drummer', 'bassist', 'band member', 'record label', 'music'], topicSlug: 'musical', subtopicSlug: null },

	// Scientific > Physics
	{ keywords: ['physicist', 'quantum', 'nuclear physics', 'particle physics', 'thermodynamic', 'relativity', 'electromagnetism'], topicSlug: 'scientific', subtopicSlug: 'physics' },
	// Scientific > Biology
	{ keywords: ['biologist', 'zoologist', 'botanist', 'ecologist', 'geneticist', 'microbiologist', 'evolutionary', 'paleontologist', 'naturalist'], topicSlug: 'scientific', subtopicSlug: 'biology' },
	// Scientific > Chemistry
	{ keywords: ['chemist', 'chemistry', 'biochemist', 'molecular biology', 'periodic table'], topicSlug: 'scientific', subtopicSlug: 'chemistry' },
	// Scientific > Astronomy
	{ keywords: ['astronomer', 'astronaut', 'cosmologist', 'astrophysicist', 'nasa', 'space exploration', 'moon landing', 'planetary', 'telescope'], topicSlug: 'scientific', subtopicSlug: 'astronomy' },
	// Scientific (generic)
	{ keywords: ['scientist', 'inventor', 'engineer', 'mathematician', 'geologist', 'archaeologist', 'anthropologist', 'science', 'technology', 'computer scientist'], topicSlug: 'scientific', subtopicSlug: null },

	// Historical > Wars
	{ keywords: ['world war', 'civil war', 'battle of', 'military conflict', 'armed forces', 'naval battle', 'siege of', 'war of'], topicSlug: 'historical', subtopicSlug: 'wars' },
	// Historical > Politics
	{ keywords: ['prime minister', 'president of', 'head of state', 'head of government', 'chancellor of', 'political party'], topicSlug: 'historical', subtopicSlug: 'politics' },
	// Historical > Exploration
	{ keywords: ['explorer', 'expedition', 'discovery', 'navigation', 'cartographer', 'colonization'], topicSlug: 'historical', subtopicSlug: 'exploration' },
	// Historical > Revolution
	{ keywords: ['revolution', 'uprising', 'independence movement', 'liberation movement', 'coup'], topicSlug: 'historical', subtopicSlug: 'revolution' },
	// Historical (generic)
	{ keywords: ['general', 'admiral', 'military', 'colonial', 'ancient', 'medieval', 'empire', 'dynasty', 'monarch', 'king', 'queen', 'historical'], topicSlug: 'historical', subtopicSlug: null },

	// Cultural > Film
	{ keywords: ['film', 'cinema', 'movie', 'actor', 'actress', 'film director', 'screenwriter', 'animated'], topicSlug: 'cultural', subtopicSlug: 'film' },
	// Cultural > Literature
	{ keywords: ['novelist', 'poet', 'author', 'playwright', 'writer', 'literature', 'short story'], topicSlug: 'cultural', subtopicSlug: 'literature' },
	// Cultural > Art
	{ keywords: ['painter', 'sculptor', 'artist', 'visual art', 'photography', 'architecture', 'drawing'], topicSlug: 'cultural', subtopicSlug: 'art' },
	// Cultural > Theatre
	{ keywords: ['theatre', 'theater', 'broadway', 'stage actor', 'musical theatre', 'opera singer', 'ballet'], topicSlug: 'cultural', subtopicSlug: 'theatre' },
	// Cultural (generic)
	{ keywords: ['cultural', 'entertainment', 'television', 'comedian', 'presenter', 'broadcaster'], topicSlug: 'cultural', subtopicSlug: null },

	// Political > Elections
	{ keywords: ['election', 'referendum', 'ballot', 'voting'], topicSlug: 'political', subtopicSlug: 'elections' },
	// Political > Treaties
	{ keywords: ['treaty', 'peace agreement', 'armistice', 'accord'], topicSlug: 'political', subtopicSlug: 'treaties' },
	// Political > Legislation
	{ keywords: ['legislation', 'law', 'act of parliament', 'constitutional', 'congress', 'senate', 'parliament'], topicSlug: 'political', subtopicSlug: 'legislation' },
	// Political > Diplomacy
	{ keywords: ['diplomat', 'ambassador', 'foreign minister', 'diplomacy', 'international relations', 'embassy'], topicSlug: 'political', subtopicSlug: 'diplomacy' },
	// Political (generic)
	{ keywords: ['politician', 'statesman', 'government', 'minister', 'senator', 'representative', 'political'], topicSlug: 'political', subtopicSlug: null },

	// Sporting > Football
	{ keywords: ['nfl', 'nba', 'baseball player', 'basketball player', 'american football', 'rugby', 'cricket', 'ice hockey', 'association football'], topicSlug: 'sporting', subtopicSlug: 'football' },
	// Sporting > Athletics
	{ keywords: ['athletics', 'marathon', 'sprinter', 'track and field', 'swimmer', 'cycling', 'boxer', 'wrestling', 'martial artist', 'gymnast'], topicSlug: 'sporting', subtopicSlug: 'athletics' },
	// Sporting > Tennis
	{ keywords: ['tennis', 'golfer', 'badminton', 'squash player'], topicSlug: 'sporting', subtopicSlug: 'tennis' },
	// Sporting > Olympics
	{ keywords: ['olympic', 'paralympic', 'world championship', 'world cup winner'], topicSlug: 'sporting', subtopicSlug: 'olympics' },
	// Sporting (generic)
	{ keywords: ['sportsperson', 'athlete', 'coach', 'sport', 'racing driver', 'jockey', 'footballer', 'soccer'], topicSlug: 'sporting', subtopicSlug: null }
];

export function classifyCategory(
	rawCategory: string,
	topicRows: TopicRow[],
	subtopicRows: SubtopicRow[]
): ClassifyResult | null {
	const lower = rawCategory.toLowerCase();

	for (const rule of RULES) {
		const keywordMatch = rule.keywords.some((kw) => lower.includes(kw.toLowerCase()));
		if (!keywordMatch) continue;

		const topic = topicRows.find((t) => t.slug === rule.topicSlug);
		if (!topic) continue;

		if (rule.subtopicSlug === null) {
			return { topicId: topic.id, subtopicId: null };
		}

		const subtopic = subtopicRows.find(
			(s) => s.topicId === topic.id && s.slug === rule.subtopicSlug
		);

		return { topicId: topic.id, subtopicId: subtopic?.id ?? null };
	}

	return null;
}
