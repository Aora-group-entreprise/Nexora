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

## Plan de construction

Lire [docs/PRODUCT_PLAN.md](docs/PRODUCT_PLAN.md) pour le positionnement, le périmètre du MVP, les phases de développement et les critères d'acceptation. Les tests de fumée locaux sans dépendances peuvent être lancés avec `python scripts/verify-static.py` ; la syntaxe JavaScript est vérifiée avec `node --check app.js`.

## État du projet

Le squelette statique initial est en place : interface responsive, navigation entre les vues, icône, styles et tests de fumée sans dépendances. Les trois vues de modules indiquent clairement qu'elles sont encore en construction ; elles ne prétendent pas fournir déjà les analyses, traductions ou pages publiques finales. Les fonctions métier seront implémentées et testées progressivement.

## Hébergement envisagé

Cloudflare Pages est la cible de déploiement initiale. Les limites de l'offre gratuite et les besoins réels du projet devront être vérifiés avant le lancement public.
