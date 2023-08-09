############ AXALIO README ##############
# README #

Repo is for Axalio's Proof of Reserves consensus, asset-backed true-store-of-value blockchain on the Coreum network. Methodology is git flow with access control. Branching strategies, all devs pull from develop as base and work with 
within feature branch. All feature branch are push and Pull Request (PR) is created for merge to Develop. Admin merges develop code to master/release.

### What is this repository for? ###

* Smart contracts, COSMWASM
* v 0.9.9
* [Learn Markdown](https://bitbucket.org/tutorials/markdowndemo)

### How do I get set up? ###

* CLONE REPO - git clone https://axalio-dev-admin@bitbucket.org/axalio-dev/axalio-dev-coreum-smartcontracts.git

* Step 1: Switch to your repository's directory
	cd /path/to/your/repo
	
* SStep 2: Connect your existing repository to Bitbucket
	git remote add origin https://axalio-dev-admin@bitbucket.org/axalio-dev/axalio-dev-coreum-smartcontracts.git
	git push -u origin develop

* How to run tests - TBD
* CICD Deployment instructions - TBD

### Contribution guidelines ###

* Writing tests - TBD
* Code review - before code is merge will be code review and upon approval code will be merged to develop branch
* Other guidelines

### Who do I talk to? ###

* Repo owner or admin - sam@axalio.com | john@axalio.com
* Other community or team contact

# About the Coreum Blockchain ecosystem

Coreum addresses the existing limitations of the current blockchains and empowers a solid foundation for future decentralized projects. Coreum’s unique approach is to provide built-in, on-chain solutions to process transactions in a deterministic way to ensure fast, secure, cheap and a green network for a variety of use-cases.

The chain is designed to solve real-world problems at scale by providing native token management systems and Decentralized  Exchange (DEX), while being fully decentralized. In addition to the built-on-chain solutions, Coreum uses WebAssembly (WASM) to process smart contracts, and utilizes the Tendermint Byzantine Fault Tolerance (BFT) consensus mechanism and Cosmos SDK’s  proven Bonded Proof of Stake (BPoS).

Read more on [our website](https://www.coreum.com) and [documentation portal](https://docs.coreum.dev).

## Build and Play

Coreum blockchain is  still undergoing development and all the features are going to be added progressively over time.
Everyone is encouraged to run a chain locally for development and testing purposes.

Entire process of running local chain is automated by our tooling. The only prerequisites are:
- `docker` installed from your favorite package manager
- `go 1.18` or newer installed and available in your `PATH`