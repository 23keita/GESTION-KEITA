# 🚀 API de Gestion de Tâches en Équipe

API backend robuste et sécurisée pour une application de gestion de tâches, construite avec Node.js, Express et MongoDB. Ce projet met l'accent sur une architecture propre, la sécurité et la testabilité.

## ✨ Fonctionnalités

*   **Authentification Utilisateur** : Inscription et connexion sécurisées avec des tokens JWT.
*   **Gestion des Équipes** : Création d'équipes, ajout/retrait de membres, et gestion des permissions basées sur les rôles (leader vs. membre).
*   **Gestion des Tâches** : Opérations CRUD complètes (Créer, Lire, Mettre à jour, Supprimer) pour les tâches.
*   **Assignation et Permissions** : Assigner des tâches à des utilisateurs et gérer les permissions de modification/suppression.
*   **Pagination et Filtrage** : Récupération efficace des listes de tâches avec pagination (`page`, `limit`) et filtres (`status`, `priority`).
*   **Sécurité Renforcée** : Ensemble de middlewares pour protéger contre les vulnérabilités web courantes (XSS, injection NoSQL, etc.).
*   **Tests d'Intégration** : Suite de tests complète avec Jest et Supertest pour garantir la fiabilité de l'API.

---

## 🛠️ Tech Stack

*   **Backend** : Node.js, Express.js
*   **Base de données** : MongoDB avec Mongoose
*   **Authentification** : JSON Web Token (JWT), bcrypt
*   **Tests** : Jest, Supertest, MongoDB Memory Server
*   **Sécurité** : Helmet, CORS, Express Rate Limit, HPP, Express Mongo Sanitize
*   **Logging & Debugging** : Morgan
*   **Variables d'environnement** : Dotenv

---

## ⚙️ Installation et Démarrage

### 1. Prérequis

*   Node.js (version 18 ou supérieure)
*   MongoDB (localement ou via un service comme MongoDB Atlas)

### 2. Cloner le projet

```bash
git clone <URL_DU_REPO>
cd gestion-taches-equipe
```

### 3. Installer les dépendances

```bash
npm install
```

### 4. Variables d'Environnement

Créez un fichier `.env` à la racine du projet en copiant le fichier `.env.example` et en remplissant les valeurs.

```bash
cp .env.example .env
```

*   `NODE_ENV`: L'environnement d'exécution (`development` ou `production`).
*   `PORT`: Le port sur lequel le serveur écoutera.
*   `MONGO_URI`: L'URI de connexion à votre base de données MongoDB.
*   `JWT_SECRET`: Une chaîne de caractères secrète pour signer les tokens JWT.
*   `FRONTEND_URL`: L'URL de votre application frontend (pour la configuration CORS en production).

### 5. Lancer l'application

*   **En mode développement (avec rechargement automatique)** :
    ```bash
    npm run dev
    ```
*   **En mode production** :
    ```bash
    npm start
    ```

---

## 🧪 Tests

Le projet inclut une suite de tests d'intégration complète pour valider tous les endpoints et la logique de permissions.

Pour lancer les tests :
```bash
npm test
```
Les tests utilisent une base de données en mémoire pour s'assurer qu'ils n'affectent pas vos données de développement.

---

## 📡 Endpoints de l'API

### Authentification (`/api/auth`)

| Méthode | Endpoint         | Description                   | Authentification |
| :------ | :--------------- | :---------------------------- | :--------------- |
| `POST`  | `/register`      | Inscription d'un utilisateur. | ❌ Non requise   |
| `POST`  | `/login`         | Connexion et obtention du JWT.| ❌ Non requise*  |

### Tâches (`/api/tasks`)

| Méthode  | Endpoint         | Description                                                                                             | Authentification |
| :------- | :--------------- | :------------------------------------------------------------------------------------------------------ | :--------------- |
| `GET`    | `/`              | Lister les tâches avec filtres (`status`, `priority`) et pagination (`page`, `limit`).                  | ✅ Requise       |
| `POST`   | `/`              | Créer une nouvelle tâche.                                                                               | ✅ Requise       |
| `PUT`    | `/:id`           | Mettre à jour une tâche. Seul l'admin, l'auteur ou l'assigné peut le faire.                             | ✅ Requise       |
| `DELETE` | `/:id`           | Supprimer une tâche. Seul l'admin ou l'auteur peut le faire.                                            | ✅ Requise       |

### Équipes (`/api/teams`)

| Méthode  | Endpoint                  | Description                                | Permissions      |
| :------- | :------------------------ | :----------------------------------------- | :--------------- |
| `GET`    | `/`                       | Lister les équipes de l'utilisateur.       | ✅ Requise       |
| `POST`   | `/`                       | Créer une nouvelle équipe.                 | ✅ Requise       |
| `GET`    | `/:id`                    | Obtenir les détails d'une équipe.          | Membre           |
| `DELETE` | `/:id`                    | Supprimer une équipe.                      | Leader           |
| `POST`   | `/:id/members`            | Ajouter un membre à une équipe.            | Leader           |
| `DELETE` | `/:id/members/:memberId`  | Retirer un membre d'une équipe.            | Leader           |

---

## 🛡️ Sécurité

L'application intègre plusieurs middlewares pour renforcer la sécurité :

*   **Helmet** : Définit divers en-têtes HTTP pour sécuriser l'application.
*   **CORS** : Gère les autorisations de requêtes Cross-Origin, configuré de manière stricte pour la production.
*   **Express Rate Limit** : Limite le nombre de requêtes par IP pour prévenir les attaques par force brute.
*   **Express Mongo Sanitize** : Nettoie les données des requêtes pour prévenir les injections NoSQL.
*   **HPP (HTTP Parameter Pollution)** : Protège contre la pollution des paramètres HTTP.

---

## 🌍 Déploiement

Le projet est prêt à être déployé sur des plateformes comme Render.

1.  Poussez votre code sur un dépôt GitHub.
2.  Sur Render, créez un nouveau **Web Service** et connectez votre dépôt.
3.  Configurez les commandes suivantes :
    *   **Build Command**: `npm install`
    *   **Start Command**: `npm start`
4.  Ajoutez vos variables d'environnement (`MONGO_URI`, `JWT_SECRET`, `NODE_ENV=production`, `FRONTEND_URL`) dans l'interface de Render.
5.  Cliquez sur "Create Web Service". Render se chargera du reste, y compris du déploiement automatique lors de nouveaux commits sur votre branche principale.

*\*Note sur l'authentification : Les routes `/login` et `/register` sont publiques car un utilisateur ne peut pas être déjà authentifié pour s'inscrire ou se connecter. La colonne "Authentification" indique si un token JWT valide est requis pour accéder à la route.*

---

## ✍️ Auteur

*   **Antoine**
*   Contact : votre.email@example.com
