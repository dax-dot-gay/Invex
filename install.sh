mkdir -p invex-client/certs invex-server/certs

openssl req -x509 -newkey rsa:4096 -keyout invex-client/certs/key.pem -out invex-client/certs/cert.pem -sha256 -days 3650 -nodes -subj "/C=US/ST=NewYork/L=NewYork/CN=Invex"
openssl req -x509 -newkey rsa:4096 -keyout invex-server/certs/key.pem -out invex-server/certs/cert.pem -sha256 -days 3650 -nodes -subj "/C=US/ST=NewYork/L=NewYork/CN=Invex"
rustup target add wasm32-unknown-unknown
cargo install cargo-watch
curl -s https://get.extism.org/cli | sh -s -- -q -y