import 'dotenv/config'
import { GeneratedType, Registry } from "@cosmjs/proto-signing"
import { AminoTypes, SigningStargateClient } from "@cosmjs/stargate";
import { coreum, coreumAminoConverters, coreumProtoRegistry, cosmosAminoConverters, cosmosProtoRegistry } from 'coreum';
import { Decimal } from '@cosmjs/math';
import { generateKey, senderMnemonic, coreumRpcEndpoint, calculateGasPrice } from './utils';


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

    const protoRegistry: ReadonlyArray<[string, GeneratedType]> = [
        ...cosmosProtoRegistry,
        ...coreumProtoRegistry
    ];

    const aminoConverters = {
        ...cosmosAminoConverters,
        ...coreumAminoConverters
    };

    const registry = new Registry(protoRegistry);
    const aminoTypes = new AminoTypes(aminoConverters);

    const senderClient = await SigningStargateClient.connectWithSigner(coreumRpcEndpoint, wallet, {
        registry,
        aminoTypes,
        gasPrice,
    });


    const msgIssue = coreum.asset.ft.v1.MessageComposer.withTypeUrl.issue({
        burnRate: `${Decimal.zero(18).atomics}`,
        issuer: sender.address,
        symbol: 'AXA1',
        subunit: 'uaxa1',
        precision: 6,
        initialAmount: '100000000',
        description: 'Axalio',
        features: [0, 1, 2, 3, 4],
        sendCommissionRate: `${Decimal.fromUserInput("0.5", 18).atomics}`
    })

    const issueResult = await senderClient.signAndBroadcast(sender.address, [msgIssue], "auto")
    console.log("Instantiate result:", { issueResult });
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});



