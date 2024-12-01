#!/bin/bash
for folder in ./plugins/*; do
    cd $folder
    cargo build
    cd ../..
done