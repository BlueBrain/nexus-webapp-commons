.PHONY: build test clean

ME=`id -u`:`id -g`

dshell:
	@echo "Running a Docker shell... 🐚"
	@docker-compose run --rm --user ${ME} --entrypoint bash nexus-sdk

install:
	@echo "Installing project's dependencies... 🚀"
	@yarn && yarn lerna bootstrap

build:
	@echo "Building packages... 👷"
	@yarn lerna run build

test:
	@echo "Running tests... 🛫🛬"
	@yarn test --coverage

lint:
	@echo "Linting... ✨"
	@yarn lint

prettier:
	@echo "Prettier... 💅"
	@yarn prettier -c ./src/**/*.ts

clean:
	@echo "Cleaning... 🗑"
	@yarn lerna clean && yarn clean