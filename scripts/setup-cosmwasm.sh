# Check rustup installed, if not, then we installed it
# we redirect the result of command to not show in the screen

echo "START INSTALLING RUSTUP"
if rustup help > /dev/null; then
  echo "Rustup installed"
else
  echo "Rustup not installed. Start installing rustup"
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
  source "$HOME/.cargo/env"
fi

echo "------------------------------"
echo "START SETUP COSMWASM ENVIRONMENT"
rustup target add wasm32-unknown-unknown
cargo install cosmwasm-check
//TODO Check mac version, if M1 chip, add config to ~/.cargo/config
cargo install -f beaker

if [ $? -eq 0 ]; then
  echo "INSTALLING SUCCESS"
else
  echo "INSTALLING FAILED"
fi