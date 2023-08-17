import 'dotenv/config'
import { stringToPath } from "@cosmjs/crypto"
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing"
import { GasPrice, decodeCosmosSdkDecFromProto } from '@cosmjs/stargate';
import { coreum } from 'coreum';

export const coreumAccountPrefix = "testcore"; // the address prefix (different for different chains/environments)
export const coreumHDPath = "m/44'/990'/0'/0/0"; // coreum HD path (same for all chains/environments)
export const coreumDenom = "utestcore"; // core denom (different for different chains/environments)
export const coreumRpcEndpoint = "https://full-node.testnet-1.coreum.dev:26657"; // rpc endpoint (different for different chains/environments)
export const senderMnemonic = process.env.MNEMONIC; // put mnemonic here

export const generateKey = async (mnemonic?: string): Promise<DirectSecp256k1HdWallet> => {
    let wallet = (mnemonic && mnemonic != "") ?
        await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, { prefix: coreumAccountPrefix, hdPaths: [stringToPath(coreumHDPath)] }) :
        await DirectSecp256k1HdWallet.generate(24, { prefix: coreumAccountPrefix, hdPaths: [stringToPath(coreumHDPath)] })
    process.stdout.write(wallet.mnemonic)
    const accounts = await wallet.getAccounts()
    console.error("Mnemonic with 1st account:", accounts[0].address)
    return wallet;
}

export const calculateGasPrice = async (): Promise<GasPrice> => {
    const { createRPCQueryClient } = coreum.ClientFactory;
    const coreumClient = await createRPCQueryClient({ rpcEndpoint: coreumRpcEndpoint });
    const fee = await coreumClient.coreum.feemodel.v1.minGasPrice({
        afterBlocks: 10
    })
    console.log("Fee:", fee)
    const gasPrice = GasPrice.fromString(`${decodeCosmosSdkDecFromProto(fee.minGasPrice.amount).toFloatApproximation()}${fee.minGasPrice.denom || ""}`);
    return gasPrice;
}