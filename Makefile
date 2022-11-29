server:
	npx webpack serve
	
dev:
	npx webpack

prod:
	npx webpack --mode=production

install:
	npm ci

link:
	npm link

publish:
	npm publish --dry-run

lint:
	npx eslint .
