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

La navigation responsive est en place : barre latérale complète sur grand écran, rail compact sur tablette et menu tiroir avec voile de fermeture sur petit écran. Les commandes de navigation disposent aussi de noms accessibles. Les trois modules restent des écrans d'introduction ; leurs fonctions métier seront implémentées et testées dans les étapes suivantes.

Les contrôles automatisés vérifient la structure, les ressources locales, les libellés accessibles de la navigation et les bases du comportement responsive. Une inspection visuelle réelle dans plusieurs navigateurs et tailles d'écran reste nécessaire avant de considérer l'interface comme validée sur tous les appareils.

## Vérifications

Lancer le contrôle statique local depuis la racine du dépôt :

```bash
python scripts/verify-static.py
node --check app.js
```

Le workflow GitHub Actions `.github/workflows/static-checks.yml` exécute les contrôles prévus lors des événements configurés. Les vérifications de structure ne remplacent pas encore des tests de navigateur réels.

## Plan de construction

Lire [docs/PRODUCT_PLAN.md](docs/PRODUCT_PLAN.md) pour le positionnement, le périmètre du MVP, les phases de développement et les critères d'acceptation.

## Hébergement envisagé

Cloudflare Pages est la cible de déploiement initiale. Les limites de l'offre gratuite et les besoins réels du projet devront être vérifiés avant le lancement public.
