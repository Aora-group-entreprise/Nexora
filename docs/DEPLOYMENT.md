# Déploiement de Nexora sur Cloudflare Pages

Ce guide concerne la version actuelle de Nexora : un site HTML, CSS et JavaScript statique, sans compilation, serveur applicatif, compte utilisateur ni API distante obligatoire.

## 1. Configuration attendue

| Paramètre Cloudflare Pages | Valeur |
| --- | --- |
| Fournisseur Git | GitHub |
| Dépôt | `Aora-group-entreprise/Nexora` |
| Branche de production | `main` |
| Framework preset | Aucun / None |
| Root directory | Laisser vide (racine du dépôt) |
| Build command | `exit 0` |
| Build output directory | `.` |
| Variables d'environnement | Aucune |

Le dossier publié doit contenir directement `index.html`, `styles.css`, `app.js`, `favicon.svg` et `_headers`. Ne choisis pas `public`, `dist` ou `build` : ces dossiers ne sont pas générés par ce projet.

## 2. Créer le projet Pages

1. Ouvre le tableau de bord Cloudflare : https://dash.cloudflare.com/
2. Va dans **Workers & Pages**, puis crée une application Pages reliée à Git.
3. Connecte GitHub et sélectionne `Aora-group-entreprise/Nexora`.
4. Configure les paramètres du tableau ci-dessus, avec `main` comme branche de production.
5. Lance le déploiement initial et attends la fin du build.
6. Ouvre l'URL `*.pages.dev) indiquée par Cloudflare.

**Important :** choisis l'intégration Git dès le départ. Cloudflare indique qu'un projet créé avec Git integration ne peut pas être converti ensuite en projet Direct Upload. Les prochains commits poussés sur `main` déclencheront normalement de nouveaux déploiements.

## 3. Vérifications après publication

Sur l'URL publiée, vérifie :

- [ ] la page d'accueil s'affiche sans 404 ;
- [ ] le CSS, le JavaScript et le favicon se chargent ;
- [ ] les quatre vues et le bouton retour/avance du navigateur fonctionnent ;
- [ ] Content Intelligence traite un texte, une image et une vidéo locale ;
- [ ] Cultural Bridge fonctionne sans requête réseau ;
- [ ] Digital Identity sauvegarde localement, recharge après actualisation et exporte/import un JSON ;
- [ ] le menu mobile s'ouvre et se ferme ;
- [ ] la console du navigateur ne présente pas d'erreur ;
- [ ] les outils réseau ne montrent pas de téléversement des fichiers choisis ;
- [ ] les en-têtes de sécurité du fichier `_headers` sont présents dans les réponses.

Effectue aussi un essai sur un téléphone Android et un navigateur de bureau. Les tests Playwright dans GitHub Actions ne remplacent pas ces contrôles sur de vrais appareils.

## 4. Confidentialité et limites

- Les analyses d'image/vidéo/texte sont exécutées dans le navigateur.
- La fiche Digital Identity est conservée dans le stockage local du navigateur ; elle n'est pas publiée et ne se synchronise pas entre appareils.
- Cultural Bridge utilise des modèles et expressions intégrés ; ce n'est pas une traduction IA universelle.
- Aucun secret, mot de passe ou clé API ne doit être ajouté au code public.
- L'hébergement peut rester dans les limites gratuites selon l'usage et les conditions de Cloudflare, mais ne promets pas un coût nul permanent sans vérifier les conditions en vigueur.

## 5. En cas d'échec

1. Vérifie que la branche de production est `main`.
2. Vérifie que le dossier de sortie est `.` et que `index.html` se trouve à la racine.
3. Consulte les logs de build/déploiement Cloudflare.
4. Vérifie la dernière exécution du workflow GitHub Actions avant de publier un nouveau changement.
5. Corrige le problème, pousse le correctif sur `main`, puis refais les tests publiés.

Documentation officielle :
- [Git integration](https://developers.cloudflare.com/pages/get-started/git-integration/)
- [Build configuration](https://developers.cloudflare.com/pages/configuration/build-configuration/)
- [Custom headers](https://developers.cloudflare.com/pages/configuration/headers/)
