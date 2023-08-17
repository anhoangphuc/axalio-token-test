import {expect} from "chai";
import "dotenv/config";
import {beforeEach} from "mocha";
import {AccountData, DirectSecp256k1HdWallet} from "@cosmjs/proto-signing";
import {decodeCosmosSdkDecFromProto, GasPrice, SigningStargateClient} from "@cosmjs/stargate";
import {InstantiateResult, SigningCosmWasmClient} from "@cosmjs/cosmwasm-stargate";
import {readFile} from "fs/promises";
import {ExecuteMsg, InstantiateMsg, QueryMsg} from "../ts/AxalioSmartFT.types";
import {coreum} from "coreum";
import {stringToPath} from "@cosmjs/crypto";
import {senderMnemonic} from "../scripts/utils";

describe('Axalio smart ft', () => {
    let wallet: DirectSecp256k1HdWallet;
    let stargateClient: SigningStargateClient;
    let wasmClient: SigningCosmWasmClient;
    let admin: AccountData;
    let instantiateResult: InstantiateResult;
    beforeEach(async () => {
        const coreumEndpoint = process.env.ZNET_NODE || "";
        const coreumAccountPrefix = "devcore"; // the address prefix (different for different chains/environments)
        const coreumHDPath = "m/44'/990'/0'/0/0"; // coreum HD path (same for all chains/environments)
        wallet = await DirectSecp256k1HdWallet.fromMnemonic(process.env.ZNET_MNEMONIC || "", { prefix: coreumAccountPrefix, hdPaths: [stringToPath(coreumHDPath)]});
        [admin] = await  wallet.getAccounts();
        stargateClient = await SigningStargateClient.connectWithSigner(coreumEndpoint, wallet);

        const coreumClient = await coreum.ClientFactory.createRPCQueryClient({ rpcEndpoint: coreumEndpoint });
        const fee = await coreumClient.coreum.feemodel.v1.minGasPrice({
            afterBlocks: 10
        })
        const gasPrice = GasPrice.fromString(`${decodeCosmosSdkDecFromProto(fee.minGasPrice.amount).toFloatApproximation()}${fee.minGasPrice.denom || ""}`);

        wasmClient = await SigningCosmWasmClient.connectWithSigner(
            coreumEndpoint,
            wallet,
            {
                gasPrice,
            }
        );
        const axalioWasm = await readFile("../../target/wasm32-unknown-unknown/release/axalio_smart_ft.wasm");
        const { codeId } = await wasmClient.upload(admin.address, axalioWasm, 'auto', 'Axalio-smart-ft');
        const instantiateMsg: InstantiateMsg = { airdrop_amount: "1000000", initial_amount: "100000000", precision: 6, subunit: "uaxa", symbol: "AXA" };
        instantiateResult = await wasmClient.instantiate(admin.address, codeId, instantiateMsg, "axalio-smart-ft", "auto", {
            funds: [
                { amount: "10000000", denom: 'udevcore' }
            ]
        });
    });

    it(`Init success`, async () => {
        const chainId = await stargateClient.getChainId();
        expect(chainId).to.be.eq("coreum-devnet-1");
        expect(instantiateResult.height).to.be.gt(1);
    });

    it(`Mint for airdrop success`, async () => {
        const mintForAirdropMsg: ExecuteMsg = { mint_for_airdrop: { amount: "100000000" }};
        await wasmClient.execute(admin.address, instantiateResult.contractAddress, mintForAirdropMsg, "auto" );
        const mintedForAirdropMsg: QueryMsg = { minted_for_airdrop: {} };
        const mintedForAirdrop = await wasmClient.queryContractSmart(instantiateResult.contractAddress, mintedForAirdropMsg);
        expect(mintedForAirdrop.amount).to.be.eq("200000000");
    })
})