#!/bin/bash

# Script de test pour l'API des traitements par patient

echo "=== Test de l'API Patient Treatments ==="
echo

# Configuration
BASE_URL="http://localhost:3000/api"

echo "1. Test: Récupération d'un patient spécifique"
echo "GET $BASE_URL/patients/[FIRST_PATIENT_ID]"

# Récupérer le premier patient pour avoir un ID valide
FIRST_PATIENT=$(curl -s "$BASE_URL/patients?page=1&limit=1" | grep -o '"_id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$FIRST_PATIENT" ]; then
    echo "Premier patient trouvé: $FIRST_PATIENT"
    echo
    
    echo "Détails du patient:"
    curl -s "$BASE_URL/patients/$FIRST_PATIENT" | jq '.firstName, .lastName, .patientNumber, .dateOfBirth'
    echo
    
    echo "2. Test: Récupération des traitements du patient"
    echo "GET $BASE_URL/treatments/patient/$FIRST_PATIENT"
    
    TREATMENTS=$(curl -s "$BASE_URL/treatments/patient/$FIRST_PATIENT")
    TREATMENT_COUNT=$(echo $TREATMENTS | jq '.treatments | length')
    
    echo "Nombre de traitements trouvés: $TREATMENT_COUNT"
    echo
    
    if [ "$TREATMENT_COUNT" -gt 0 ]; then
        echo "Premier traitement:"
        echo $TREATMENTS | jq '.treatments[0] | {treatmentDate, dent, description, honoraire, recu}'
        echo
        
        echo "Calcul des totaux:"
        TOTAL_HONORAIRES=$(echo $TREATMENTS | jq '[.treatments[].honoraire] | add')
        TOTAL_RECU=$(echo $TREATMENTS | jq '[.treatments[].recu] | add')
        BALANCE=$(echo "$TOTAL_HONORAIRES - $TOTAL_RECU" | bc)
        
        echo "Total honoraires: $TOTAL_HONORAIRES DT"
        echo "Total reçu: $TOTAL_RECU DT"
        echo "Balance: $BALANCE DT"
    else
        echo "Aucun traitement trouvé pour ce patient"
    fi
else
    echo "Erreur: Aucun patient trouvé dans la base de données"
fi

echo
echo "=== Fin des tests ==="