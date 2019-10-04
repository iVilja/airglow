#!/bin/bash
set -e

mkdir -p ./tmp
wget https://himota.moon.moe/gpg-keys/commoon-bot.gpg.enc --quiet -O ./tmp/bot.gpg.enc
openssl aes-256-cbc -K $commoon_bot_key -iv $commoon_bot_iv \
    -in ./tmp/bot.gpg.enc -out ./tmp/bot.gpg -d
gpg --import ./tmp/bot.gpg
git config --global user.email "bot@moon.moe"
git config --global user.name "Bot Commoon"
git config --global commit.gpgsign true
