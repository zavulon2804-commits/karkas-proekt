---
name: karkas-publish
description: Публикация Каркас-Проекта — сборка, проверка, коммит в main, push на GitHub и обновление копии на claude.ai. Использовать, когда правка готова и проверена.
---
# karkas-publish

1. `bash tools/publish.sh "Описание на русском"` — соберёт, проверит (karkas-check), закоммитит в main и запушит. Остановится, если проверка не прошла.
2. Обновить копию на claude.ai: инструмент Artifact, `file_path` = `dist/artifact.html` (абсолютный путь), `url` = https://claude.ai/artifact/KxJ1LC4oycDUgcE3T1H6Ek. Файл уже без обёртки документа — ничего не вырезать вручную.
3. В подписи коммита добавить строку Claude-Session, если её требует системная подсказка (скрипт ставит только Co-Authored-By).
