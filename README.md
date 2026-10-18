# Nexora

**Nexora est le nom de travail** d'une plateforme web légère destinée aux créateurs de contenu. Le nom définitif reste à décider.

## Vision

Aider les créateurs à améliorer leurs contenus, adapter leurs messages à différents publics et organiser leur présence sur plusieurs réseaux sociaux — dans un seul espace.

## Modules prévus

- **Content Intelligence** — contrôles techniques d'images et de vidéos, analyse textuelle simple et recommandations pratiques.
- **Cultural Bridge** — outils de reformulation et d'adaptation des messages à différents publics et langues, en indiquant clairement les limites des fonctions prises en charge.
- **Digital Identity** — création locale d'une fiche de créateur et organisation de ses liens sociaux.

## Principes du MVP

- Commencer par une application statique hébergée sur Cloudflare Pages.
- Viser zéro coût obligatoire pour la première version.
- Traiter les fichiers dans le navigateur lorsque c'est possible.
- Ne pas exiger de compte, de base de données, de backend ou d'API payante au départ.
- Construire de vraies fonctionnalités, pas seulement une maquette.
- Être responsive et utilisable sur mobile comme sur ordinateur.
- Ne pas promettre de viralité ni de fonctions qui ne sont pas réellement implémentées.

Certaines fonctions avancées, comme une traduction IA fiable ou des pages de profil publiques persistantes, pourront demander une architecture ou un service supplémentaire. Elles ne seront pas promises avant d'avoir évalué leurs coûts et leurs contraintes.

## Structure actuelle

Le dépôt contient le squelette statique initial :
- `index.html` — structure de la page d'accueil et des quatre vues de navigation ;
- `styles.css` — mise en page adaptative pour ordinateur, tablette et mobile ;
- `app.js` — navigation côté navigateur, tiroir mobile, fermeture par voile/Escape et navigation avec l'historique ;
- `favicon.svg` — icône du site ;
- `scripts/verify-static.py` — vérifications statiques sans dépendances.

La navigation responsive est en place : barre latérale complète sur grand écran, rail compact sur tablette et menu tiroir avec voile de fermeture sur petit écran. Les commandes de navigation disposent aussi de noms accessibles. Content Intelligence dispose maintenant d'une première version fonctionnelle : analyse locale des dimensions, du poids, du format et du ratio des images ; lecture des métadonnées vidéo prises en charge ; analyse de base des textes (caractères, mots, hashtags, mentions, phrases et répétitions simples). Les recommandations reposent sur des règles explicites et un format cible sélectionnable. Cultural Bridge dispose maintenant d'une adaptation locale du ton (clair, amical, professionnel, engageant) avec des modèles français, anglais et malagasy, d'un mini phrasebook de 10 expressions prédéfinies dans ces trois langues, et d'une copie avec solution de repli pour les navigateurs anciens. Ce n'est pas un traducteur universel ni une IA. Digital Identity propose maintenant un éditeur de fiche local avec nom, pseudo, phrase courte, présentation et jusqu'à 20 liens sociaux ; aperçu en direct ; validation stricte des URL HTTPS ; sauvegarde locale ; import/export JSON ; copie d'un résumé ; et effacement avec confirmation. Les données ne sont pas publiées et restent dans le stockage local du navigateur.

Les contrôles automatisés vérifient la structure, les ressources locales, les libellés accessibles de la navigation, les bases du comportement responsive, les commandes Content Intelligence et Cultural Bridge, ainsi que les principaux contrôles de Digital Identity (validation HTTPS, limites de champs et d'URL, stockage local, aperçu, import/export JSON et message d'erreur honnête si l'effacement échoue). Ils contrôlent aussi la navigation avec l'historique et la protection des liens externes ouverts dans un nouvel onglet. GitHub Actions installe Playwright/Chromium et exécute également des tests de fumée dans un vrai navigateur : navigation, analyse de texte, refus des fichiers de mauvais type, reformulation, phrasebook malagasy, sauvegarde/rechargement de la fiche, validation des liens et menu mobile. Le dernier workflow navigateur vérifié a réussi ; le contrôle supplémentaire des fichiers de déploiement Cloudflare Pages vient d'être ajouté et doit réussir lui aussi. Une vérification manuelle sur de vrais téléphones et navigateurs reste nécessaire. Les fichiers choisis sont traités dans le navigateur, avec une limite de 20 Mo par fichier ; ils ne sont pas envoyés à un serveur. Une inspection visuelle réelle dans plusieurs navigateurs et tailles d'écran reste nécessaire avant de considérer l'interface comme validée sur tous les appareils.

## Vérifications

Lancer le contrôle statique local depuis la racine du dépôt :

```bash
python scripts/verify-static.py
node --check app.js
```

Le workflow GitHub Actions `.github/workflows/static-checks.yml` exécute les contrôles statiques, les vérifications des fichiers de déploiement Cloudflare Pages et les tests Playwright sur Chromium lors des événements configurés. Pour lancer les vérifications locales :

```bash
python scripts/verify-static.py
python scripts/verify-deployment.py
node --check app.js
node --check tests/browser-smoke.cjs
```

Les tests automatisés ne remplacent pas une inspection manuelle sur de vrais appareils.

## Plan de construction

Lire [docs/PRODUCT_PLAN.md](docs/PRODUCT_PLAN.md) pour le positionnement, le périmètre du MVP, les phases de développement et les critères d'acceptation.

## Déploiement

Cloudflare Pages est la cible de déploiement initiale. Le fichier `_headers` ajoute des en-têtes HTTP de sécurité et `scripts/verify-deployment.py` vérifie leur présence ainsi que le guide de configuration. Consulte [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) pour les paramètres exacts : dépôt GitHub, branche `main`, commande `exit 0` et dossier de sortie `.`. Le projet n'a pas encore été publié sur un compte Cloudflare ; la configuration et les tests de l'URL publiée restent à faire. Les limites de l'offre gratuite et les besoins réels devront être vérifiés avant le lancement public.
