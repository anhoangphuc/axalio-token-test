use cosmwasm_std::Uint128;
use schemars::JsonSchema;
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct AmountResponse {
    pub amount: Uint128,
}