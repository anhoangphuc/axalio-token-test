use std::fmt::format;
use crate::msg::{AmountResponse, InstantiateMsg, ExecuteMsg, QueryMsg};
use crate::error::ContractError;
use crate::state::{STATE, State};
use coreum_wasm_sdk::assetft;
use coreum_wasm_sdk::core::{CoreumMsg, CoreumQueries};
use cosmwasm_std::{entry_point, to_binary, Binary, Deps, QueryRequest, StdResult, QueryResponse};
use cosmwasm_std::{Coin, DepsMut, Env, MessageInfo, Response, Uint128};
use cw2::set_contract_version;
use cw_storage_plus::Item;
use schemars::JsonSchema;
use serde::{Serialize, Deserialize};
use std::ops::{Add, Sub};
use std::os::macos::raw::stat;
use thiserror::Error;

const CONTRACT_NAME: &str = "axalio-ft";
const CONTRACT_VERSION: &str = env!("CARGO_PKG_VERSION");


#[cfg_attr(not(feature = "library"), entry_point)]
pub fn query(deps: Deps<CoreumQueries>, _env: Env, msg: QueryMsg) -> StdResult<Binary> {
    match msg {
        QueryMsg::Token {} => token(deps),
        QueryMsg::MintedForAirdrop {} => minted_for_airdrop(deps),
    }
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn execute(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    msg: ExecuteMsg,
) -> Result<Response<CoreumMsg>, ContractError> {
    match msg {
        ExecuteMsg::MintForAirdrop { amount } => mint_for_airdrop(deps, info, amount),
        ExecuteMsg::ReceiveAirdrop {} => receive_airdrop(deps, info),
    }
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn instantiate(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    msg: InstantiateMsg,
) -> Result<Response<CoreumMsg>, ContractError> {
    set_contract_version(deps.storage, CONTRACT_NAME, CONTRACT_VERSION)?;
    let issue_msg = CoreumMsg::AssetFT(assetft::Msg::Issue {
        symbol: msg.symbol,
        subunit: msg.subunit.clone(),
        precision: msg.precision,
        initial_amount: msg.initial_amount,
        description: None,
        features: Some(vec![0]),
        burn_rate: Some("0".into()),
        send_commission_rate: Some("0.1".into()),
    });

    let denom = format!("{}-{}", msg.subunit, env.contract.address).to_lowercase();

    let state = State {
        owner: info.sender.into(),
        denom,
        minted_for_airdrop: msg.initial_amount,
        airdrop_amount: msg.airdrop_amount,
    };

    STATE.save(deps.storage, &state)?;

    Ok(Response::new()
        .add_attribute("owner", state.owner)
        .add_attribute("denom", state.denom)
        .add_message(issue_msg))
}

// ********** TRANSACTIONS **********

fn mint_for_airdrop(
    deps: DepsMut,
    info: MessageInfo,
    amount: u128,
) -> Result<Response<CoreumMsg>, ContractError> {
    let mut state = STATE.load(deps.storage)?;
    if info.sender != state.owner {
        return Err(ContractError::Unauthorized {});
    }

    let msg = CoreumMsg::AssetFT(assetft::Msg::Mint {
        coin: Coin::new(amount, state.denom.clone())
    });

    state.minted_for_airdrop = state.minted_for_airdrop.add(Uint128::new(amount));
    STATE.save(deps.storage, &state)?;

    Ok(Response::new()
        .add_attribute("method", "mint_for_airdrop")
        .add_attribute("denom", state.denom)
        .add_attribute("amount", amount.to_string())
        .add_message(msg)
    )
}

fn receive_airdrop(deps: DepsMut, info: MessageInfo) -> Result<Response<CoreumMsg>, ContractError> {
    let mut state = STATE.load(deps.storage)?;
    if state.minted_for_airdrop < state.airdrop_amount {
        return Err(ContractError::CustomError {
            val: "not enough minted".into(),
        });
    }
    let send_msg = cosmwasm_std::BankMsg::Send {
        to_address: info.sender.into(),
        amount: vec![Coin {
            amount: state.airdrop_amount,
            denom: state.denom.clone(),
        }],
    };

    state.minted_for_airdrop = state.minted_for_airdrop.sub(state.airdrop_amount);
    STATE.save(deps.storage, &state)?;

    Ok(Response::new()
        .add_attribute("method", "receive_airdrop")
        .add_attribute("denom", state.denom)
        .add_attribute("amount", state.airdrop_amount.to_string())
        .add_message(send_msg))
}

// ********** Queries **********
fn token(deps: Deps<CoreumQueries>) -> StdResult<Binary> {
    let state = STATE.load(deps.storage)?;
    let request: QueryRequest<CoreumQueries> = CoreumQueries::AssetFT(assetft::Query::Token {denom: state.denom}).into();
    let res: assetft::TokenResponse = deps.querier.query(&request)?;
    to_binary(&res)
}

fn minted_for_airdrop(deps: Deps<CoreumQueries>) -> StdResult<Binary> {
    let state = STATE.load(deps.storage)?;
    let res = AmountResponse {
        amount: state.minted_for_airdrop,
    };
    to_binary(&res)
}