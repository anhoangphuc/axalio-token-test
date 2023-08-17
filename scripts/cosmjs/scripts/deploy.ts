import 'dotenv/config'
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing"
import { HdPath, stringToPath } from "@cosmjs/crypto"
import { GasPrice, QueryClient, SigningStargateClient, StargateClient, calculateFee, createProtobufRpcClient, decodeCosmosSdkDecFromProto, isMsgSendEncodeObject } from "@cosmjs/stargate";
import { MsgStoreCodeEncodeObject, SigningCosmWasmClient, setupWasmExtension } from "@cosmjs/cosmwasm-stargate";
import { InstantiateMsg } from "../ts/AxalioSmartFT.types";
import { readFile } from "fs/promises";
import { coreum, cosmos } from 'coreum';
import { MsgInstantiateContract, MsgStoreCode } from 'cosmjs-types/cosmwasm/wasm/v1/tx';

const coreumAccountPrefix = "testcore"; // the address prefix (different for different chains/environments)
const coreumHDPath = "m/44'/990'/0'/0/0"; // coreum HD path (same for all chains/environments)
const coreumDenom = "utestcore"; // core denom (different for different chains/environments)
const coreumRpcEndpoint = "https://full-node.testnet-1.coreum.dev:26657"; // rpc endpoint (different for different chains/environments)
const senderMnemonic = process.env.MNEMONIC; // put mnemonic here


const main = async () => {
    const wallet = await generateKey(senderMnemonic)
    const [sender] = await wallet.getAccounts();
    const client = await SigningStargateClient.connectWithSigner(coreumRpcEndpoint, wallet);
    console.log("With client, chain id:", await client.getChainId(), ", height:", await client.getHeight())

    const { createRPCQueryClient, createRPCMsgClient } = coreum.ClientFactory;
    const coreumClient = await createRPCQueryClient({ rpcEndpoint: coreumRpcEndpoint });

    const fee = await coreumClient.coreum.feemodel.v1.minGasPrice({
        afterBlocks: 10
    })

    console.log("Fee:", fee)


    console.log(
        "Alice balances:",
        await client.getAllBalances((await wallet.getAccounts())[0].address), // <-- replace with your generated address
    )

    const gasPrice = GasPrice.fromString(`${decodeCosmosSdkDecFromProto(fee.minGasPrice.amount).toFloatApproximation()}${fee.minGasPrice.denom || ""}`);

    const senderClient = await SigningCosmWasmClient.connectWithSigner(
        coreumRpcEndpoint,
        wallet,
        {
            gasPrice,
        }
    );

    const wasm = await readFile(__dirname + "/../../../artifacts/axalio_smart_ft.wasm");

    // const a: MsgStoreCodeEncodeObject = {
    //     typeUrl: "/cosmwasm.wasm.v1.MsgStoreCode",
    //     value: MsgStoreCode.fromPartial({
    //         wasmByteCode: wasm,
    //         sender: sender.address,
    //     })
    // }

    // const gasLimit = await senderClient.simulate(sender.address, [a], "Axalio-smart-ft")

    // const { codeId } = await senderClient.upload(sender.address, wasm, calculateFee(gasLimit, gasPrice), "Axalio-smart-ft")
    const { codeId } = await senderClient.upload(sender.address, wasm, "auto", "Axalio-smart-ft")



    // const codeId = 547; // Here we put the code id of the contract that we uploaded on the Coreum blockchain.
    const instantiateMsg: InstantiateMsg = { airdrop_amount: "1000000", initial_amount: "100000000", precision: 6, subunit: "uaxa", symbol: "AXA" };
    const instantiateResult = await senderClient.instantiate(sender.address, codeId, instantiateMsg, "axalio-smart-ft", "auto", {
        funds: [
            { amount: "10000000", denom: coreumDenom }
        ]
    });

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



