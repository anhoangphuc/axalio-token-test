import { SigningStargateClient } from "@cosmjs/stargate";
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { InstantiateMsg, ExecuteMsg } from "../ts/AxalioSmartFT.types";
import { readFile, writeFile } from "fs/promises";
import { senderMnemonic, coreumRpcEndpoint, coreumDenom, calculateGasPrice, generateKey } from "./utils";

const main = async () => {
    const wallet = await generateKey(senderMnemonic)
    const [sender] = await wallet.getAccounts();
    const client = await SigningStargateClient.connectWithSigner(coreumRpcEndpoint, wallet);
    console.log("With client, chain id:", await client.getChainId(), ", height:", await client.getHeight())
    console.log(
        "Alice balances:",
        await client.getAllBalances((await wallet.getAccounts())[0].address), // <-- replace with your generated address
    )

    // calculate gas price
    const gasPrice = await calculateGasPrice();

    // upload code
    const senderClient = await SigningCosmWasmClient.connectWithSigner(
        coreumRpcEndpoint,
        wallet,
        {
            gasPrice,
        }
    );
    const wasm = await readFile(__dirname + "/../../../artifacts/axalio_smart_ft.wasm");
    const { codeId } = await senderClient.upload(sender.address, wasm, "auto", "Axalio-smart-ft");

    // instantiate contract
    const instantiateMsg: InstantiateMsg = { airdrop_amount: "1000000", initial_amount: "100000000", precision: 6, subunit: "uaxa", symbol: "AXA" };
    const instantiateResult = await senderClient.instantiate(sender.address, codeId, instantiateMsg, "axalio-smart-ft", "auto", {
        funds: [
            { amount: "10000000", denom: coreumDenom }
        ]
    });
    console.log("Instantiate result:", { instantiateResult });

    await writeFile(__dirname + "/../axalio_smart_ft.address", instantiateResult.contractAddress);

    // mint for airdrop
    const mintForAirdrop: ExecuteMsg = { mint_for_airdrop: { amount: "1000000" } };

    const mintResult = await senderClient.execute(sender.address, instantiateResult.contractAddress, mintForAirdrop, "auto")
    console.log("Mint result:", { mintResult });


    // receive airdrop
    const receiveAirdrop: ExecuteMsg = { receive_airdrop: {} };

    const receiveResult = await senderClient.execute(sender.address, instantiateResult.contractAddress, receiveAirdrop, "auto")
    console.log("Receive result:", { receiveResult });

}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});



