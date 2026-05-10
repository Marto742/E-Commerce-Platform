@echo off
echo Starting Meilisearch on http://localhost:7700
"%~dp0meilisearch.exe" --db-path "%~dp0meilisearch-data" --master-key "meilisearch-dev-key" --env development
