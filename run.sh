cd invex-server
cargo watch -x 'run' &
cd ../invex-client
yarn
yarn dev --host 0.0.0.0 --port 8080 --no-clear-screen &
cd ..
sleep infinity