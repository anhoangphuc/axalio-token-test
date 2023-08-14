import 'dotenv/config'
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing"
import { HdPath, stringToPath } from "@cosmjs/crypto"
import { QueryClient, SigningStargateClient, StargateClient, createProtobufRpcClient, isMsgSendEncodeObject } from "@cosmjs/stargate";
import { SigningCosmWasmClient, setupWasmExtension } from "@cosmjs/cosmwasm-stargate";
import { InstantiateMsg } from "../ts/AxalioSmartFT.types";
import { open, readFile } from "fs/promises";

const coreumAccountPrefix = "testcore"; // the address prefix (different for different chains/environments)
const coreumHDPath = "m/44'/990'/0'/0/0"; // coreum HD path (same for all chains/environments)
const coreumDenom = "utestcore"; // core denom (different for different chains/environments)
const coreumRpcEndpoint = "https://full-node.testnet-1.coreum.dev:26657"; // rpc endpoint (different for different chains/environments)
const senderMnemonic = process.env.MNEMONIC; // put mnemonic here

// const httpClient = new HttpBatchClient(coreumRpcEndpoint);
// const tendermintClient = await Tendermint34Client.create(httpClient);
// const queryClient = QueryClient.withExtensions(tendermintClient, setupWasmExtension); 
// const rpcClient = createProtobufRpcClient(queryClient);

const main = async () => {
    const wallet = await generateKey(senderMnemonic)
    const [sender] = await wallet.getAccounts();
    const client = await SigningStargateClient.connectWithSigner(coreumRpcEndpoint, wallet);
    console.log("With client, chain id:", await client.getChainId(), ", height:", await client.getHeight())

    console.log(
        "Alice balances:",
        await client.getAllBalances((await wallet.getAccounts())[0].address), // <-- replace with your generated address
    )

    const senderClient = await SigningCosmWasmClient.connectWithSigner(
        coreumRpcEndpoint,
        wallet,
    );

    const wasm = await readFile(__dirname + "/../../../artifacts/axalio_smart_ft.wasm");

    const {codeId} = await senderClient.upload(sender.address, wasm, "auto", "Axalio-smart-ft")


    // const codeId = 547; // Here we put the code id of the contract that we uploaded on the Coreum blockchain.
    const instantiateMsg: InstantiateMsg = { airdrop_amount: "1000000", initial_amount: "100000000", precision: 6, subunit: "uaxa", symbol: "AXA" };
    const instantiateResult = await senderClient.instantiate(sender.address, codeId, instantiateMsg, "axalio-smart-ft", "auto", {});

    console.log("Instantiate result:", { instantiateResult });

}

const generateKey = async (mnemonic?: string): Promise<DirectSecp256k1HdWallet> => {
    let wallet = (mnemonic && mnemonic != "") ?
        await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, { prefix: coreumAccountPrefix, hdPaths: [stringToPath(coreumHDPath)] }) :
        await DirectSecp256k1HdWallet.generate(24, { prefix: coreumAccountPrefix, hdPaths: [stringToPath(coreumHDPath)] })
    process.stdout.write(wallet.mnemonic)
    const accounts = await wallet.getAccounts()
    console.error("Mnemonic with 1st account:", accounts[0].address)
    return wallet;
}


main().catch((error) => {
    console.error(error);
    process.exit(1);
});



