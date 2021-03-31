#!/bin/bash
set -e

mkdir -p ./tmp
wget https://himota.moon.moe/gpg-keys/commoon-bot.gpg.enc --quiet -O ./tmp/bot.gpg.enc
openssl aes-256-cbc -K $COMMOON_BOT_KEY -iv $COMMOON_BOT_IV \
    -in ./tmp/bot.gpg.enc -out ./tmp/bot.gpg -d
gpg --import ./tmp/bot.gpg
git config --global user.email "bot@moon.moe"
git config --global user.name "Bot Commoon"
git config --global commit.gpgsign true
