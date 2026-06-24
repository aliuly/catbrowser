
.PHONY: help prices.json

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## ' Makefile | sort | \
	  awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-30s\033[0m %s\n", $$1, $$2}'

prices.json: price_api.py Makefile
	python3 price_api.py region=eu-de,eu-nl > $@

