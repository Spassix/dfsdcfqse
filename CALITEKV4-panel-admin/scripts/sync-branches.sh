#!/bin/bash

# Script pour synchroniser automatiquement les changements sur main et panel-admin
# Usage: ./scripts/sync-branches.sh [branche-source]
# Si aucune branche n'est spécifiée, utilise la branche actuelle

set -e  # Arrêter en cas d'erreur

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

# Vérifier qu'on est dans un dépôt Git
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    error "Ce script doit être exécuté dans un dépôt Git"
fi

# Récupérer la branche source (argument ou branche actuelle)
SOURCE_BRANCH="${1:-$(git branch --show-current)}"

# Vérifier que la branche source existe
if ! git rev-parse --verify "$SOURCE_BRANCH" > /dev/null 2>&1; then
    error "La branche '$SOURCE_BRANCH' n'existe pas"
fi

info "🔄 Synchronisation des branches main et panel-admin"
info "📦 Branche source: $SOURCE_BRANCH"

# Sauvegarder la branche actuelle
CURRENT_BRANCH=$(git branch --show-current)
info "📍 Branche actuelle: $CURRENT_BRANCH"

# Récupérer les dernières modifications
info "📥 Récupération des dernières modifications..."
git fetch origin || warning "Impossible de récupérer depuis origin (continuer quand même)"

# Fonction pour merger une branche dans une autre
merge_branch() {
    local TARGET_BRANCH=$1
    local SOURCE=$2
    
    info "🔄 Merge de '$SOURCE' dans '$TARGET_BRANCH'..."
    
    # Vérifier que la branche cible existe localement ou à distance
    if ! git rev-parse --verify "$TARGET_BRANCH" > /dev/null 2>&1; then
        # Essayer de créer la branche depuis origin
        if git rev-parse --verify "origin/$TARGET_BRANCH" > /dev/null 2>&1; then
            info "📦 Création de la branche locale '$TARGET_BRANCH' depuis origin..."
            git checkout -b "$TARGET_BRANCH" "origin/$TARGET_BRANCH" || git checkout "$TARGET_BRANCH"
        else
            warning "La branche '$TARGET_BRANCH' n'existe pas, création..."
            git checkout -b "$TARGET_BRANCH" || git checkout "$TARGET_BRANCH"
        fi
    else
        git checkout "$TARGET_BRANCH" || error "Impossible de basculer sur '$TARGET_BRANCH'"
    fi
    
    # Merger la branche source
    if git merge "$SOURCE" --no-edit --no-ff 2>&1; then
        success "Merge de '$SOURCE' dans '$TARGET_BRANCH' réussi"
    else
        error "Erreur lors du merge de '$SOURCE' dans '$TARGET_BRANCH'"
    fi
}

# Étape 1: Merger dans main
if [ "$SOURCE_BRANCH" != "main" ]; then
    merge_branch "main" "$SOURCE_BRANCH"
else
    info "⏭️  Branche source est 'main', pas besoin de merger"
    git checkout main || error "Impossible de basculer sur main"
fi

# Étape 2: Merger dans panel-admin
if [ "$SOURCE_BRANCH" != "panel-admin" ]; then
    merge_branch "panel-admin" "$SOURCE_BRANCH"
else
    info "⏭️  Branche source est 'panel-admin', pas besoin de merger"
    git checkout panel-admin || error "Impossible de basculer sur panel-admin"
fi

# Étape 3: Synchroniser main et panel-admin entre elles
info "🔄 Synchronisation mutuelle de main et panel-admin..."

# Merger panel-admin dans main pour s'assurer que main a tout
git checkout main
if git merge panel-admin --no-edit --no-ff 2>&1; then
    success "Synchronisation de panel-admin → main réussie"
else
    # Si déjà à jour, c'est OK
    if git merge-base --is-ancestor panel-admin main 2>/dev/null; then
        info "main est déjà à jour avec panel-admin"
    else
        error "Erreur lors de la synchronisation panel-admin → main"
    fi
fi

# Merger main dans panel-admin pour s'assurer que panel-admin a tout
git checkout panel-admin
if git merge main --no-edit --no-ff 2>&1; then
    success "Synchronisation de main → panel-admin réussie"
else
    # Si déjà à jour, c'est OK
    if git merge-base --is-ancestor main panel-admin 2>/dev/null; then
        info "panel-admin est déjà à jour avec main"
    else
        error "Erreur lors de la synchronisation main → panel-admin"
    fi
fi

# Retourner sur la branche originale
if [ "$CURRENT_BRANCH" != "main" ] && [ "$CURRENT_BRANCH" != "panel-admin" ]; then
    git checkout "$CURRENT_BRANCH" || warning "Impossible de retourner sur '$CURRENT_BRANCH'"
    info "📍 Retour sur la branche originale: $CURRENT_BRANCH"
else
    info "📍 Reste sur la branche: $(git branch --show-current)"
fi

# Afficher le résumé
echo ""
success "🎉 Synchronisation terminée avec succès!"
echo ""
info "📊 Résumé:"
echo "   - Branche source: $SOURCE_BRANCH"
echo "   - main: $(git log --oneline -1 main)"
echo "   - panel-admin: $(git log --oneline -1 panel-admin)"
echo ""
warning "💡 N'oubliez pas de pusher les changements:"
echo "   git push origin main"
echo "   git push origin panel-admin"
