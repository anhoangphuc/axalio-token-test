use coreum_wasm_sdk::assetft::TokenResponse;
use cosmwasm_schema::{cw_serde, QueryResponses};
use cosmwasm_std::Uint128;

#[cw_serde]
pub struct AmountResponse {
    pub amount: Uint128,
}

#[cw_serde]
pub struct InstantiateMsg {
    pub symbol: String,
    pub subunit: String,
    pub precision: u32,
    pub initial_amount: Uint128,
    pub airdrop_amount: Uint128,
}

#[cw_serde]
pub enum MigrateMsg {
}


#[cw_serde]
pub enum ExecuteMsg {
    MintForAirdrop { amount: u128 },
    ReceiveAirdrop {},
}

#[cw_serde]
#[derive(QueryResponses)]
pub enum QueryMsg {
    #[returns(TokenResponse)]
    Token {},

    #[returns(AmountResponse)]
    MintedForAirdrop {},
}
