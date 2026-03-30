#!/usr/bin/env bash
set -euo pipefail

TARGET_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/public/models"
mkdir -p "$TARGET_DIR"

curl -L -o "$TARGET_DIR/house.glb" https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/House/glTF-Binary/House.glb
curl -L -o "$TARGET_DIR/sponza.glb" https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Sponza/glTF-Binary/Sponza.glb
curl -L -o "$TARGET_DIR/box-textured.glb" https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BoxTextured/glTF-Binary/BoxTextured.glb

echo "Downloaded models to $TARGET_DIR"
