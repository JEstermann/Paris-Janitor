#!/bin/bash
set -e

echo "Exécution de la seed..."
node --experimental-global-webcrypto src/seed.js

echo "Démarrage du serveur..."
exec node --experimental-global-webcrypto src/app.js
