import 'dotenv/config'
import { SigningStargateClient } from "@cosmjs/stargate";
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { ExecuteMsg } from "../ts/AxalioSmartFT.types";
import { calculateGasPrice, coreumRpcEndpoint, generateKey, senderMnemonic } from './utils';
import { readFile } from 'fs/promises';

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

    const contractAddress = await readFile(__dirname+ "/../axalio_smart_ft.address", "utf-8");

    // mint for airdrop
    const mintForAirdrop: ExecuteMsg = { mint_for_airdrop: { amount: "1000000", user_addr: sender.address } };

    const mintResult = await senderClient.execute(sender.address, contractAddress, mintForAirdrop, "auto")
    console.log("Mint result:", { mintResult });
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});



