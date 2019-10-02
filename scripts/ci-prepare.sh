#!/bin/bash
set -e

openssl aes-256-cbc -K $encrypted_ba2df4291512_key -iv $encrypted_ba2df4291512_iv \
    -in ./secure/bot.gpg.enc -out ./secure/bot.gpg -d
gpg --import ./secure/bot.gpg
git config --global user.email "bot@moon.moe"
git config --global user.name "Bot Commoon"
git config --global commit.gpgsign true
