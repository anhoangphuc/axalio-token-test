/**
* This file was automatically generated by @cosmwasm/ts-codegen@0.35.3.
* DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
* and run the @cosmwasm/ts-codegen generate command to regenerate this file.
*/

export type Uint128 = string;
export interface InstantiateMsg {
  initial_amount: Uint128;
  precision: number;
  subunit: string;
  symbol: string;
}
export type ExecuteMsg = {
  mint_for_airdrop: {
    amount: Uint128;
    user_addr: string;
  };
} | {
  receive_airdrop: {};
};
export type QueryMsg = {
  token: {};
} | {
  minted_for_airdrop: {
    user_addr: string;
  };
};
export type MigrateMsg = string;
export interface AmountResponse {
  amount: Uint128;
}
export interface TokenResponse {
  token: Token;
  [k: string]: unknown;
}
export interface Token {
  burn_rate: string;
  denom: string;
  description?: string | null;
  features?: number[] | null;
  issuer: string;
  precision: number;
  send_commission_rate: string;
  subunit: string;
  symbol: string;
  version: number;
  [k: string]: unknown;
}