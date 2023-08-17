import {expect} from "chai";
import "dotenv/config";
import {beforeEach} from "mocha";
import {DirectSecp256k1HdWallet} from "@cosmjs/proto-signing";
import {SigningStargateClient} from "@cosmjs/stargate";

describe('Axalio smart ft', () => {
    let wallet: DirectSecp256k1HdWallet;
    let client: SigningStargateClient;
    beforeEach(async () => {
        wallet = await DirectSecp256k1HdWallet.fromMnemonic(process.env.ZNET_MNEMONIC || "");
        client = await SigningStargateClient.connectWithSigner(process.env.ZNET_NODE || "", wallet);
    });

    it(`Init success`, async () => {
        const chainId = await client.getChainId();
        expect(chainId).to.be.eq("coreum-devnet-1");
    })
})