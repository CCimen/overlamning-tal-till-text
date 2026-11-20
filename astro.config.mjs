// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightThemeFlexoki from 'starlight-theme-flexoki';

// Statisk sida på svenska. Lägesdatan läses ur src/data/lage.json vid bygget; bygget hämtar inget.
export default defineConfig({
	integrations: [
		starlight({
			title: 'Tal till text i produktion',
			defaultLocale: 'root',
			locales: { root: { label: 'Svenska', lang: 'sv' } },
			customCss: ['./src/styles/sajt.css'],
			plugins: [starlightThemeFlexoki()],
			sidebar: [
				{ label: 'Ta över arbetet', link: '/' },
				{ label: 'Vägen till produktion', slug: 'vagen-till-produktion' },
				{
					label: 'Nu: eneo-test',
					items: [
						{ label: 'Första leveransen till eneo-test', slug: 'forsta-leveransen' },
						{ label: 'Gallring', slug: 'gallring' },
					],
				},
				{
					label: 'Efter eneo-test (pausat)',
					items: [
						{ label: 'Space och ägande', slug: 'space-och-agande' },
						{ label: 'MFA i Eneo', slug: 'mfa' },
						{ label: 'MFA med OneGate', slug: 'onegate' },
					],
				},
			],
		}),
	],
});
