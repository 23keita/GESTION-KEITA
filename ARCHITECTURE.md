# Architecture du Projet de Gestion de Tâches

Ce document détaille l'architecture du backend de l'application, son organisation et le flux logique d'une requête HTTP, de sa réception à la réponse envoyée au client.

## 1. Philosophie de Conception

L'architecture est basée sur le principe de **Séparation des Préoccupations** (Separation of Concerns). Chaque partie de l'application a une responsabilité unique, ce qui rend le code :
*   **Modulaire** : Facile à comprendre et à modifier de manière isolée.
*   **Testable** : Chaque unité (contrôleur, service) peut être testée indépendamment.
*   **Scalable** : Facile à faire évoluer en ajoutant de nouvelles fonctionnalités sans perturber l'existant.

## 2. Structure des Dossiers

La structure des dossiers est organisée par fonctionnalité et par rôle technique.

```
/
├── /config/
│   └── db.js               # Logique de connexion à la base de données MongoDB.
├── /controllers/
│   ├── authController.js   # Logique métier pour l'authentification (inscription, connexion).
│   ├── taskController.js   # Logique métier pour les opérations CRUD sur les tâches.
│   └── teamController.js   # Logique métier pour la gestion des équipes (création, membres, etc.).
├── /middlewares/
│   ├── authMiddleware.js   # Vérifie le token JWT et protège les routes.
│   ├── errorMiddleware.js  # Gère les erreurs de manière centralisée.
│   └── mongoSanitize.middleware.js # Middleware de sécurité contre les injections NoSQL.
├── /models/
│   ├── User.js             # Schéma Mongoose pour les utilisateurs.
│   ├── Task.js             # Schéma Mongoose pour les tâches.
│   └── Team.js             # Schéma Mongoose pour les équipes.
├── /routes/
│   ├── authRoutes.js       # Définit les endpoints (URLs) pour l'authentification.
│   ├── taskRoutes.js       # Endpoints pour les tâches (CRUD, filtres, pagination).
│   └── teamRoutes.js       # Endpoints pour les équipes (CRUD, gestion des membres).
├── .env                    # Fichier (ignoré par Git) contenant les secrets et variables de config.
├── .env.example            # Modèle pour le fichier .env.
├── .gitignore              # Spécifie les fichiers à ignorer par Git.
├── api.test.js             # Tests d'intégration pour tous les endpoints de l'API.
├── app.js                  # Configure l'application Express (middlewares, routes).
├── server.js               # Point d'entrée : connecte la BDD et démarre le serveur.
└── package.json            # Dépendances et scripts du projet.
```

---

## 3. Flux d'une Requête API (Étape par Étape)

Prenons l'exemple d'un utilisateur qui veut créer une nouvelle tâche en envoyant une requête `POST` à `/api/tasks`.

### Étape 1 : Point d'Entrée (`server.js`)

1.  Le serveur Node.js est lancé via `npm run dev` ou `npm start`.
2.  `server.js` est exécuté.
3.  `dotenv.config()` charge les variables du fichier `.env` dans `process.env`.
4.  La fonction `connectDB()` est appelée pour établir la connexion avec la base de données MongoDB Atlas.
5.  Si la connexion réussit, `app.listen(PORT)` démarre le serveur HTTP et le met en écoute sur le port spécifié.

### Étape 2 : Application Express et Middlewares (`app.js`)

1.  La requête `POST /api/tasks` arrive sur le serveur.
2.  Elle traverse la chaîne de middlewares configurés dans `app.js` dans l'ordre :
    *   `helmet()` : Ajoute des en-têtes de sécurité.
    *   `cors()` : Vérifie que la requête provient d'une origine autorisée.
    *   `rateLimit()` : Vérifie que l'adresse IP n'a pas dépassé le quota de requêtes.
    *   `express.json()` et `express.urlencoded()` : Parsent le corps de la requête (le payload JSON) et le rendent disponible dans `req.body`.
    *   `mongoSanitizeMiddleware` (de `mongoSanitize.middleware.js`) : "Nettoie" `req.body` pour prévenir les injections.
    *   `hpp()` : Protège contre la pollution des paramètres HTTP.

### Étape 3 : Routage (`/routes/taskRoutes.js`)

1.  Express cherche une route qui correspond à `/api/tasks`.
2.  Dans `app.js`, la ligne `app.use('/api/tasks', require('./routes/taskRoutes'))` dirige la requête vers le routeur des tâches.
3.  Dans `routes/taskRoutes.js`, le routeur trouve la ligne `router.route('/').post(createTask)`.
4.  Avant d'atteindre `createTask`, la requête passe par le middleware `protect` (défini via `router.use(protect)`).

### Étape 4 : Middleware d'Authentification (`/middlewares/authMiddleware.js`)

1.  Le middleware `protect` s'exécute.
2.  Il extrait le token JWT de l'en-tête `Authorization: Bearer <token>`.
3.  Il vérifie la validité du token avec `jwt.verify()` en utilisant le `JWT_SECRET`.
4.  Si le token est valide, il décode l'ID de l'utilisateur.
5.  Il récupère l'utilisateur complet depuis la base de données (`User.findById(...)`) et l'attache à l'objet de requête : `req.user`.
6.  Il appelle `next()` pour passer au maillon suivant : le contrôleur.

### Étape 5 : Logique Métier du Contrôleur (`/controllers/taskController.js`)

1.  La fonction `createTask(req, res)` est exécutée.
2.  Elle accède aux données envoyées par le client via `req.body` et à l'utilisateur authentifié via `req.user`.
3.  Elle effectue la validation métier (ex: vérifier que le titre n'est pas vide).
4.  Elle interagit avec le modèle Mongoose pour créer un nouveau document dans la base de données.

### Étape 6 : Interaction avec la Base de Données (`/models/Task.js`)

1.  Le contrôleur appelle `Task.create({...})`.
2.  Mongoose utilise le schéma défini dans `models/Task.js` pour valider les données (types, champs obligatoires, etc.).
3.  Si les données sont valides, Mongoose traduit l'appel en une commande `insertOne` pour MongoDB.
4.  La base de données insère le document et renvoie le document créé.

### Étape 7 : Réponse au Client

1.  Le contrôleur reçoit le document de la tâche nouvellement créée.
2.  Il formate une réponse JSON et l'envoie au client avec un code de statut approprié : `res.status(201).json(newTask)`.

---

## 4. Gestion des Erreurs

Le système de gestion des erreurs est centralisé et robuste.

*   **Erreurs Asynchrones** : Le package `express-async-handler` est utilisé pour envelopper les fonctions des contrôleurs. Il se charge de "catcher" toute erreur survenant dans une fonction `async` et de la passer automatiquement au middleware de gestion d'erreurs via `next(error)`.

*   **Route Non Trouvée (404)** : Si une requête ne correspond à aucune route définie, elle atteint le middleware 404 dans `app.js`, qui crée une erreur `Error('Route non trouvée')` et la passe au gestionnaire d'erreurs.

*   **Gestionnaire d'Erreurs Final (`/middlewares/errorMiddleware.js`)** : C'est le tout dernier middleware dans `app.js`. Il reçoit toutes les erreurs (validation, base de données, autorisation, etc.). Il formate une réponse d'erreur JSON standardisée et l'envoie au client, en s'assurant que des informations sensibles (comme les stack traces) ne sont pas envoyées en production.

---

## 5. Tests

L'architecture est conçue pour être facilement testable.

*   **Isolation** : Le fichier `server.js` (qui se connecte à la BDD et démarre le serveur) est séparé de `app.js` (qui ne fait que configurer Express). Cela permet d'importer `app` dans les tests sans démarrer un vrai serveur ni se connecter à la vraie base de données.
*   **Base de Données en Mémoire** : Le fichier `api.test.js` utilise `mongodb-memory-server` pour créer une base de données MongoDB éphémère pour chaque session de test. Cela garantit que les tests sont rapides, reproductibles et n'affectent pas les données de développement.
*   **Requêtes HTTP Simulées** : `supertest` est utilisé pour envoyer des requêtes HTTP à l'application `app` et vérifier les réponses (codes de statut, corps JSON) sans avoir besoin d'un réseau.
