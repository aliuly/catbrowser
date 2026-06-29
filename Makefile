
.PHONY: help public/prices.json dev build preview install

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## ' Makefile | sort | \
	  awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-30s\033[0m %s\n", $$1, $$2}'

public/prices.json: price_api.py Makefile
	@mkdir -p public
	python3 price_api.py > $@

node_modules: package.json
	npm install
	@touch $@

install: node_modules ## Install npm dependencies

dev: node_modules ## Start Vite dev server
	npm run dev

build: node_modules ## Build for production
	npm run build

preview: build ## Preview production build locally
	npm run preview

test: node_modules ## Run tests
	npm run test

