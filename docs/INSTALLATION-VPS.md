# Déploiement cabinetAI sur VPS OVH (Ubuntu)

## 1. Mise à jour du système
```sh
sudo apt update && sudo apt upgrade -y
```

## 2. Installer les outils essentiels
```sh
sudo apt install -y git curl unzip
```

## 3. Installer Docker
```sh
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

## 4. Installer Docker Compose
```sh
sudo apt install -y docker-compose
```

## 5. (Optionnel) Sécuriser le serveur avec UFW
```sh
sudo apt install -y ufw
sudo ufw allow OpenSSH
sudo ufw allow 3000/tcp   # backend
sudo ufw allow 4200/tcp   # frontend
sudo ufw allow 27017/tcp  # MongoDB si besoin
sudo ufw enable
```

## 6. Cloner le projet cabinetAI
```sh
git clone <URL_DE_TON_REPO_GIT>
cd cabinetAI
```


## 7. Préparer la configuration frontend (config.json)

Le frontend Angular lit l’URL de l’API backend depuis un fichier `config.json` monté dans le conteneur Docker.

1. Crée un fichier `frontend/config.json` à la racine du projet (ou adapte le chemin dans le docker-compose si besoin) :
   ```json
   {
     "apiUrl": "http://<IP_VPS>:3000/api"
   }
   ```
   Remplace `<IP_VPS>` par l’adresse publique de ton serveur.

2. Ce fichier sera monté automatiquement dans le conteneur frontend grâce à la section `volumes:` du `docker-compose.prod.yml` :
   ```yaml
   frontend:
     # ...
     volumes:
       - ./frontend/config.json:/usr/share/nginx/html/assets/config.json:ro
   ```

## 8. Lancer l’application avec Docker Compose
```sh
sudo docker-compose -f docker-compose.prod.yml up -d
```

---

**Remarques** :
- Remplace `<URL_DE_TON_REPO_GIT>` par l’URL de ton dépôt Git.
- Prépare tes fichiers `.env` si besoin avant le lancement.
- Les ports 3000 (backend), 4200 (frontend) et 27017 (MongoDB) doivent être ouverts si accès externe nécessaire.
- Pour vérifier les logs :
  ```sh
  sudo docker-compose -f docker-compose.prod.yml logs -f
  ```
- Pour changer l’URL de l’API backend sans rebuild l’image, il suffit de modifier le fichier `frontend/config.json` sur le serveur puis de relancer le conteneur frontend :
  ```sh
  sudo docker-compose -f docker-compose.prod.yml restart frontend
  ```
