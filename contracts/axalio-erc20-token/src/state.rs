use cosmwasm_std::Uint128;
use cw_storage_plus::Item;
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct State {
    pub owner: String,
    pub denom: String,
    pub airdrop_amount: Uint128,
    pub minted_for_airdrop: Uint128,
}

pub const STATE: Item<State> = Item::new("state");
