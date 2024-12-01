#!/bin/bash
for folder in ./plugins/*; do
    cd $folder
    cargo build
    cd ../..
    cp target/wasm32-unknown-unknown/debug/*.wasm plugin_builds/
done