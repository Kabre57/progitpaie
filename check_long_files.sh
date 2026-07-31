#!/bin/bash

# Script pour identifier les fichiers de code source dépassant un certain nombre de lignes.
# Utilisation: ./check_long_files.sh [CHEMIN_DU_PROJET] [LIMITE_DE_LIGNES]

PROJECT_PATH=${1:-"."}
LINE_LIMIT=${2:-500}

echo "Vérification des fichiers de code dans '$PROJECT_PATH' dépassant $LINE_LIMIT lignes..."
echo "-------------------------------------------------------------------"

find "$PROJECT_PATH" -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) \
-not -path "*/node_modules/*" \
-not -path "*/.next/*" \
-not -path "*/dist/*" \
-not -path "*/build/*" \
-not -path "*/out/*" \
-print0 | while IFS= read -r -d $'' file; do
    LINE_COUNT=$(wc -l < "$file")
    if [ "$LINE_COUNT" -gt "$LINE_LIMIT" ]; then
        echo "$file: $LINE_COUNT lignes"
    fi
done

echo "-------------------------------------------------------------------"
echo "Vérification terminée."
