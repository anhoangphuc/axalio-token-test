use crate::msg::{AmountResponse, InstantiateMsg, ExecuteMsg, QueryMsg};
use crate::error::ContractError;
use crate::state::{AIRDROP_USER, STATE, State};
use coreum_wasm_sdk::assetft;
use coreum_wasm_sdk::core::{CoreumMsg, CoreumQueries};
use cosmwasm_std::{entry_point, to_binary, Binary, Deps, QueryRequest, StdResult };
use cosmwasm_std::{Coin, DepsMut, Env, MessageInfo, Response, Uint128};
use cw2::set_contract_version;
use std::ops::{Add};
use coreum_wasm_sdk::assetft::TokenResponse;

const CONTRACT_NAME: &str = "axalio-ft";
const CONTRACT_VERSION: &str = env!("CARGO_PKG_VERSION");


#[cfg_attr(not(feature = "library"), entry_point)]
pub fn query(deps: Deps<CoreumQueries>, _env: Env, msg: QueryMsg) -> StdResult<Binary> {
    match msg {
        QueryMsg::Token {} => token(deps),
        QueryMsg::MintedForAirdrop { user_addr } => minted_for_airdrop(deps, user_addr),
    }
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn execute(
    deps: DepsMut<CoreumQueries>,
    _env: Env,
    info: MessageInfo,
    msg: ExecuteMsg,
) -> Result<Response<CoreumMsg>, ContractError> {
    match msg {
        ExecuteMsg::MintForAirdrop { user_addr, amount } => mint_for_airdrop(deps, info, amount, user_addr),
        ExecuteMsg::ReceiveAirdrop {} => receive_airdrop(deps, info),
    }
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn instantiate(
    deps: DepsMut<CoreumQueries>,
    env: Env,
    info: MessageInfo,
    msg: InstantiateMsg,
) -> Result<Response<CoreumMsg>, ContractError> {
    // set_contract_version(deps.storage, CONTRACT_NAME, CONTRACT_VERSION)?;
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
    };

    STATE.save(deps.storage, &state)?;

    Ok(Response::new()
        .add_attribute("owner", state.owner)
        .add_attribute("denom", state.denom)
        .add_message(issue_msg))
}

// ********** TRANSACTIONS **********

fn mint_for_airdrop(
    deps: DepsMut<CoreumQueries>,
    info: MessageInfo,
    amount: Uint128,
    user_addr: String,
) -> Result<Response<CoreumMsg>, ContractError> {
    let mut state = STATE.load(deps.storage)?;
    if info.sender != state.owner {
        return Err(ContractError::Unauthorized {});
    }

    let user = deps.api.addr_validate(&user_addr)?;
    let airdrop_amount = AIRDROP_USER.load(deps.storage, &user);
    let new_amount = match airdrop_amount {
        Ok(x) => x.add(amount),
        _ => amount,
    };

    let msg = CoreumMsg::AssetFT(assetft::Msg::Mint {
        coin: Coin::new(new_amount.into(), state.denom.clone())
    });

    AIRDROP_USER.save(deps.storage, &user, &new_amount)?;

    Ok(Response::new()
        .add_attribute("method", "mint_for_airdrop")
        .add_attribute("denom", state.denom)
        .add_attribute("amount", amount.to_string())
        .add_attribute("user_addr", user_addr)
        .add_message(msg)
    )
}

fn receive_airdrop(deps: DepsMut<CoreumQueries>, info: MessageInfo) -> Result<Response<CoreumMsg>, ContractError> {
    let state = STATE.load(deps.storage)?;
    let airdrop_amount = AIRDROP_USER.load(deps.storage, &info.sender);
    let airdrop_amount: Uint128 = match airdrop_amount {
        Ok(x) => {
            if x == Uint128::from(0 as u128) {
                return Err(ContractError::CustomError {
                    val: "already airdropped".into(),
                });
            } else {
                x
            }
        }
        _ => return Err(ContractError::CustomError {
                val: "not airdrop user".into(),
            })
    };
    let send_msg = cosmwasm_std::BankMsg::Send {
        to_address: info.sender.clone().into(),
        amount: vec![Coin {
            amount: airdrop_amount,
            denom: state.denom.clone(),
        }],
    };

    AIRDROP_USER.save(deps.storage, &info.sender, &Uint128::from(0 as u128))?;


    Ok(Response::new()
        .add_attribute("method", "receive_airdrop")
        .add_attribute("denom", state.denom)
        .add_attribute("amount", airdrop_amount.to_string())
        .add_attribute("user", info.sender.to_string())
        .add_message(send_msg))
}

// ********** Queries **********
fn token(deps: Deps<CoreumQueries>) -> StdResult<Binary> {
    let state = STATE.load(deps.storage)?;
    let request: QueryRequest<CoreumQueries> = CoreumQueries::AssetFT(assetft::Query::Token {denom: state.denom}).into();
    let res: assetft::TokenResponse = deps.querier.query(&request)?;
    to_binary(&res)
}

fn minted_for_airdrop(deps: Deps<CoreumQueries>, user_addr: String) -> StdResult<Binary> {
    let state = STATE.load(deps.storage)?;
    let user_addr = deps.api.addr_validate(&user_addr)?;
    let airdrop_amount = AIRDROP_USER.load(deps.storage, &user_addr);
    let res = match airdrop_amount {
        Ok(x) => AmountResponse { amount: x },
        _ => AmountResponse { amount: Uint128::from(0 as u128) },
    };
    to_binary(&res)
}
