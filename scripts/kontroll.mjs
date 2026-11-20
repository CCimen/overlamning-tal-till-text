// Publik text: nekar om sidans källa eller byggda filer innehåller något som inte får stå i ett publikt förråd.
// Användning: node scripts/kontroll.mjs [sökväg ...]   (utan sökväg: src, astro.config.mjs, dist om den finns, och README.md)
// Skriptet ligger utanför src/ eftersom det självt innehåller orden det letar efter.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';

const MONSTER = [
	// Kort-id. eneo-test (och genitiven eneo-tests), eneo-module-kit och eneo-prod är produktnamn, inte kort.
	['kort-id', /\beneo-(?!(?:tests?|module|prod)\b)[a-z0-9]{4,6}\b/],
	['kort-id', /v3q5/],
	['beslutsnummer', /\bdom \d/],
	['beslutsnummer', /rulings/],
	['internt planord', /\bK3\b/],
	['granskarnamn', /\bSol\b|Astra|Codex|Gemini|Neon|gpt-/],
	['personnamn', /Alexander/],
	['sökväg', /\/Users\//],
];
const TEXT = new Set(['.md', '.mdx', '.astro', '.ts', '.js', '.mjs', '.json', '.css', '.html', '.svg', '.txt', '.xml']);

function* filer(sokvag) {
	if (statSync(sokvag).isDirectory()) {
		for (const namn of readdirSync(sokvag)) yield* filer(join(sokvag, namn));
	} else if (TEXT.has(extname(sokvag))) {
		yield sokvag;
	}
}

const argument = process.argv.slice(2);
const sokvagar = argument.length ? argument : ['src', 'astro.config.mjs', 'dist', 'README.md'].filter((s) => existsSync(s));
let traffar = 0;
let antal = 0;
for (const sokvag of sokvagar) {
	for (const fil of filer(sokvag)) {
		antal++;
		readFileSync(fil, 'utf8')
			.split('\n')
			.forEach((rad, i) => {
				for (const [vad, monster] of MONSTER) {
					const m = rad.match(monster);
					if (!m) continue;
					traffar++;
					const bit = rad.slice(Math.max(0, m.index - 40), m.index + m[0].length + 40).trim();
					console.error(`${fil}:${i + 1}:${m.index + 1}: ${vad} "${m[0]}" i: …${bit}…`);
				}
			});
	}
}
if (traffar) {
	console.error(`kontroll: ${traffar} träffar. Rätta texten; lätta inte på mönstren.`);
	process.exit(1);
}
console.log(`kontroll: ${antal} filer i ${sokvagar.join(', ')} utan träffar.`);
