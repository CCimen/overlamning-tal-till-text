// Länkkontrollen: varje intern länk i den byggda sidan pekar på en sida som finns, och ett #fragment på ett id på den sidan.
// Användning: node scripts/lankar.mjs [dist]   (körs i postbuild)
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const rot = process.argv[2] || 'dist';
const sidor = new Map(); // '/vagen-till-produktion/' -> html
(function las(mapp) {
	for (const namn of readdirSync(mapp)) {
		const fil = join(mapp, namn);
		if (statSync(fil).isDirectory()) las(fil);
		else if (namn === 'index.html') sidor.set('/' + relative(rot, mapp).split('\\').join('/') + (mapp === rot ? '' : '/'), readFileSync(fil, 'utf8'));
	}
})(rot);
const ider = (html) => new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
let fel = 0;
let antal = 0;
for (const [sida, html] of sidor) {
	for (const [, href] of html.matchAll(/<a\s[^>]*?href="([^"]+)"/g)) {
		if (/^(https?:|mailto:)/.test(href)) continue;
		antal++;
		const [vag, fragment] = href.replace(/&amp;/g, '&').split('#');
		const mal = vag === '' ? sida : vag.endsWith('/') ? vag : vag + '/';
		const malHtml = sidor.get(mal);
		const fil = join(rot, decodeURIComponent(vag));
		if (!malHtml && !(vag && existsSync(fil) && statSync(fil).isFile())) {
			console.error(`${sida}: länken ${href} pekar på en sida som inte finns`);
			fel++;
		} else if (fragment && malHtml && !ider(malHtml).has(decodeURIComponent(fragment))) {
			console.error(`${sida}: länken ${href} pekar på #${decodeURIComponent(fragment)}, som inte finns på ${mal}`);
			fel++;
		}
	}
}
if (fel) {
	console.error(`länkar: ${fel} trasiga av ${antal} interna länkar.`);
	process.exit(1);
}
console.log(`länkar: ${antal} interna länkar på ${sidor.size} sidor, alla hela.`);
