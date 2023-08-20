use cosmwasm_schema::cw_serde;
use cosmwasm_std::{Addr, Uint128};
use cw_storage_plus::{Item, Map};
#[cw_serde]
pub struct State {
    pub owner: String,
    pub denom: String,
    pub airdrop_amount: Uint128,
    pub minted_for_airdrop: Uint128,
}

pub const STATE: Item<State> = Item::new("state");
pub const AIRDROP_USER: Map<&Addr, Uint128> = Map::new("airdrop_user");
