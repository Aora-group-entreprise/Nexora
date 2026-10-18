# Nexora — Plan produit et construction

> **Nom de travail : Nexora.** Le nom définitif et l'identité visuelle restent à décider.
> **Objectif :** construire une plateforme légère pour aider les créateurs à améliorer leurs contenus, adapter leurs messages à différents publics et organiser leur présence en ligne.
> **Contrainte principale :** viser 0 coût obligatoire au départ, avec un premier déploiement statique sur Cloudflare Pages.

## 1. Positionnement

**Promesse :** l'assistant des créateurs internationaux.

Public prioritaire de la première version :
- créateurs de contenu et influenceurs indépendants ;
- entrepreneurs et petites marques ;
- utilisateurs qui publient sur plusieurs réseaux sociaux.

La plateforme aide à préparer et améliorer le contenu. Elle ne promet pas de prédire la viralité, d'augmenter automatiquement les vues ou de publier sur les réseaux sociaux sans intégrations autorisées.

## 2. Les trois modules

### A. Content Intelligence

Premières fonctionnalités possibles côté navigateur :
- charger une image et afficher ses dimensions, son format et son poids ;
- vérifier les dimensions, la durée et le poids d'une vidéo lorsque le navigateur peut lire ses métadonnées ;
- analyser un texte pour sa longueur, ses répétitions simples et sa lisibilité ;
- proposer des recommandations fondées sur des règles explicites ;
- laisser l'utilisateur choisir une plateforme ou un format cible.

Limites : aucune promesse d'analyse sémantique ou visuelle avancée sans une technologie capable de la fournir. Les contrôles techniques ne doivent pas être présentés comme une prédiction de performance.

### B. Cultural Bridge

Première version :
- saisir ou coller un texte ;
- choisir la langue source, la langue cible et le ton souhaité ;
- proposer des outils de reformulation et des modèles locaux clairement identifiés ;
- copier facilement le résultat.

Une traduction fiable et polyvalente ne doit pas être simulée. Les langues et fonctions réellement prises en charge seront documentées. Une API ou un modèle externe ne sera envisagé qu'après étude du coût, de la confidentialité et de l'intérêt utilisateur.

### C. Digital Identity

Première version :
- composer localement une fiche de créateur ;
- ajouter, modifier, réordonner et supprimer des liens sociaux ;
- prévisualiser et copier la fiche ;
- valider la forme des URL et ouvrir les liens pour vérification manuelle.

Limite technique : une application purement statique ne fournit pas à elle seule des pages publiques persistantes uniques pour chaque utilisateur. Avant de promettre des pages hébergées partageables, choisir une architecture compatible avec la contrainte de coût (par exemple stockage local/export au MVP, puis évaluation d'un service de données gratuit si nécessaire).

## 3. Principes techniques

- Priorité à HTML, CSS et JavaScript natifs pour le premier MVP, sauf raison concrète de choisir une dépendance.
- Hébergement statique sur Cloudflare Pages, sous réserve des limites de l'offre.
- Traitement local des fichiers lorsque c'est possible ; ne pas téléverser les fichiers vers un serveur par défaut.
- Pas de compte obligatoire, de base de données, de backend ni d'API payante pour le premier MVP.
- Aucun secret ou clé privée dans le code client.
- Interface responsive, accessible au clavier et utilisable sur les téléphones Android anciens et récents.
- Messages d'erreur utiles, états vides, validation des entrées et limites de taille explicites.
- Pas de collecte de données ni d'analytique distante par défaut.
- Documenter toute dépendance externe et son coût éventuel.

## 4. Phases de construction

### Phase 0 — Inspection et spécification
- vérifier l'état du dépôt et sa branche par défaut ;
- garder le nom Nexora comme nom de travail ;
- valider le périmètre MVP et les limites ;
- définir les critères d'acceptation.

### Phase 1 — Socle de l'application
- créer une structure simple et maintenable ;
- définir le système de navigation et les composants partagés ;
- concevoir l'accueil et le tableau de bord ;
- mettre en place les styles responsive et les états d'erreur.

### Phase 2 — Content Intelligence
- [x] Interface d'analyse locale pour images, vidéos et textes ;
- [x] Dimensions, format déclaré, poids et ratio des images ;
- [x] Lecture des dimensions, durée et poids des vidéos lorsque le navigateur le permet ;
- [x] Analyse textuelle simple : caractères, mots, hashtags, mentions, phrases et répétitions ;
- [x] Choix d'un format cible et recommandations fondées sur des règles explicites ;
- [x] Limite de 20 Mo par fichier et traitement local sans téléversement ;
- [ ] Tester manuellement plusieurs formats de médias et plusieurs tailles d'écran dans de vrais navigateurs ;
- [ ] Corriger les problèmes révélés par ces tests.

### Phase 3 — Cultural Bridge
- [x] interface de reformulation et de résultat ;
- [x] normalisation locale du texte et styles simples (clair, amical, professionnel, engageant) ;
- [x] mini phrasebook de 10 expressions prédéfinies en français, anglais et malagasy ;
- [x] copie du résultat avec solution de repli pour les navigateurs plus anciens ;
- [x] limites clairement annoncées : pas de traduction libre ni de prétendue IA ;
- [ ] vérifier manuellement la reformulation, les expressions et la copie dans de vrais navigateurs ;
- [ ] faire relire les traductions du phrasebook par des locuteurs compétents avant lancement public.

### Phase 4 — Digital Identity
- éditeur local de fiche ;
- gestion et validation des liens ;
- prévisualisation, export et partage par les moyens pris en charge ;
- décision documentée pour de futures pages publiques persistantes.

### Phase 5 — Qualité et déploiement
- tests fonctionnels et responsive ;
- contrôle de la console et des erreurs ;
- vérification de confidentialité des fichiers ;
- vérification du chargement sur connexion lente ;
- configuration de Cloudflare Pages ;
- test du déploiement publié.

### Phase 6 — Validation et monétisation
- obtenir des retours d'utilisateurs réels ;
- mesurer les usages sans collecte intrusive ;
- améliorer les fonctions les plus utiles ;
- n'étudier publicité, produits numériques ou fonctions payantes qu'après validation du besoin et des conditions applicables.

## 5. Critères d'acceptation du MVP

- Les trois modules sont accessibles depuis une interface cohérente.
- Chaque contrôle visible réalise une action réelle ; aucun bouton factice.
- Les limites de chaque outil sont expliquées à l'utilisateur.
- Les fichiers sont traités localement lorsque cela est prévu et ne sont pas envoyés en arrière-plan.
- Les entrées invalides, formats non pris en charge et erreurs sont gérés clairement.
- Le site fonctionne sur petits écrans et ordinateurs.
- Le site peut être déployé en statique sans service payant obligatoire.
- Le README explique comment lancer, tester et déployer le projet.

## 6. Méthode de travail

Pour chaque phase :
1. analyser l'état du code et les risques ;
2. établir les tâches et critères de réussite ;
3. implémenter une tranche limitée ;
4. tester et vérifier les régressions ;
5. corriger les défauts ;
6. documenter ce qui est terminé et ce qui reste.

Ne pas commencer la phase suivante si les critères essentiels de la phase courante échouent.

## 7. Hors périmètre initial

- réseau social ou messagerie ;
- publication automatique sur toutes les plateformes ;
- détection universelle de faux comptes ;
- prédiction de viralité ;
- comptes et synchronisation multiappareils ;
- IA payante sans validation préalable ;
- statistiques centralisées nécessitant un backend ;
- application mobile native.

## 8. Première étape technique

Le dépôt est actuellement un point de départ presque vide. La prochaine étape est de créer le squelette statique et une première interface responsive, après validation de ce plan. Les fonctions seront ensuite implémentées et testées une par une.
