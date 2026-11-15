#!/usr/bin/env bash
# Публикация: сборка → проверка → коммит в main → push. Копию на claude.ai обновляет Claude из dist/artifact.html.
# Запуск: bash tools/publish.sh "Описание изменений"
set -e
cd "$(dirname "$0")/.."
node build.mjs
node tools/check.cjs || { echo "Проверка не прошла — публикация остановлена. Если отличия ожидаемые: node tools/check.cjs --update"; exit 1; }
git add -A
git commit -q -F - <<MSG
$1

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_013MVDFv8yPsSn4VRppmmEAP
MSG
for i in 1 2 3 4; do git -c push.negotiate=true push -u origin main && break || sleep $((2**i)); done
echo "Готово. Копия для claude.ai: dist/artifact.html"
