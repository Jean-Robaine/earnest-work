# Focus Flow Journal

Build une application web de focus + journal de travail

Je veux construire une application web appelée Focus (nom provisoire).

L’objectif est extrêmement simple :

Permettre à une personne de définir une durée totale de travail, travailler par blocs de 30 minutes, faire une pause de 5 minutes entre les blocs, puis demander à l’utilisateur ce qu’il a accompli après chaque bloc et enregistrer automatiquement son travail dans un journal quotidien.

L’application doit être simple, premium, minimaliste et très agréable à utiliser.



1. CONTRAINTES TECHNIQUES IMPORTANTES

Construis l’application comme une web app locale et open source.

Je veux pouvoir la publier gratuitement.

Stack souhaitée

React

TypeScript

Vite

Tailwind CSS

composants UI modernes et accessibles

LocalStorage ou IndexedDB pour la persistance

PWA si possible

IMPORTANT

Pour cette première version :

PAS de backend

PAS de Supabase

PAS de Firebase

PAS de base de données distante

PAS d’authentification

PAS de création de compte

PAS d’API externe

PAS de service payant

PAS d’envoi de données vers un serveur

Toutes les données utilisateur doivent rester localement dans le navigateur.

L’application doit fonctionner même sans connexion Internet une fois chargée/installée si cela est possible avec l’architecture PWA.

Le projet doit être facilement exportable et hébergeable gratuitement, par exemple sur GitHub Pages.



2. CONCEPT GLOBAL

L’utilisateur arrive sur l’application.

Il voit immédiatement :

Combien de temps veux-tu travailler ?

Avec plusieurs choix :

30 min

1 h

1 h 30

2 h

3 h

Personnalisé

Il choisit par exemple :

1 h

Puis clique sur :

Commencer

L’application calcule automatiquement les sessions nécessaires.

IMPORTANT :

Le temps de pause ne compte PAS dans le temps de travail demandé.

Exemple :

Objectif = 1 h

Le système doit créer :

30 min travail
→ compte rendu
→ 5 min pause
→ 25 min travail
→ compte rendu
→ terminé

Donc :

60 minutes de travail réel + 5 minutes de pause.



3. LOGIQUE DU TIMER

La durée standard d’une session de travail est de :

30 minutes

La durée standard d’une pause est de :

5 minutes

Mais la dernière session doit être adaptée au temps de travail restant.

Exemples :

Objectif 30 min

30 min travail
→ compte rendu
→ terminé

Objectif 40 min

30 min travail
→ compte rendu
→ 5 min pause
→ 10 min travail
→ compte rendu
→ terminé

Objectif 1 h

30 min travail
→ compte rendu
→ 5 min pause
→ 30 min travail
→ compte rendu
→ terminé

ATTENTION : l’exemple donné précédemment “30 - 5 - 25” correspond à 55 minutes de temps total mais seulement 55 minutes de travail ? Non : pour un objectif de 1 h de travail, il faut bien faire 30 + 30 minutes de travail, avec une pause de 5 minutes entre les deux.

Donc l’application doit raisonner en temps de travail, pas en temps total.

Objectif 1 h 15

30 min travail
→ compte rendu
→ 5 min pause
→ 30 min travail
→ compte rendu
→ 5 min pause
→ 15 min travail
→ compte rendu
→ terminé

Objectif 2 h

30
→ pause 5
→ 30
→ pause 5
→ 30
→ pause 5
→ 30
→ terminé

La dernière pause ne doit évidemment PAS être lancée après la dernière session.



4. MACHINE À ÉTATS DU TIMER

Le timer doit être conçu comme une vraie machine à états.

États possibles :

IDLE

WORKING

AWAITING_LOG

BREAK

COMPLETED

Exemple :

IDLE
↓
WORKING
↓
AWAITING_LOG
↓
BREAK
↓
WORKING
↓
AWAITING_LOG
↓
COMPLETED

Le passage d’un état à l’autre doit être fiable.



5. TIMER

Pendant une session de travail, afficher très clairement :

29:42

et :

FOCUS

Ajouter éventuellement une petite indication :

Session 1 / 3

et :

Objectif : 1 h 30

Afficher également la progression globale.

Exemple :

60 / 90 min

avec une barre de progression.



6. FIABILITÉ DU TIMER

IMPORTANT :

NE PAS simplement faire diminuer une variable de 1 chaque seconde.

Utiliser des timestamps pour calculer le temps restant.

Pourquoi ?

Si l’utilisateur :

change d’onglet

verrouille son téléphone

revient après plusieurs secondes

recharge la page

le timer doit rester cohérent.

Le système doit enregistrer :

startedAt

endsAt

duration

currentState

Puis recalculer le temps restant à partir de l’heure actuelle.

Si l’utilisateur recharge la page pendant une session, l’application doit restaurer automatiquement l’état du timer.



7. FIN D’UNE SESSION

Quand le timer arrive à zéro :

Afficher une transition claire.

Exemple :

Session terminée.

Puis :

Qu’as-tu fait pendant ces 30 minutes ?

Avec une grande zone de texte.

Placeholder :

Écris ce que tu as accompli pendant cette session…

Ajouter un bouton :

Enregistrer

IMPORTANT :

La pause ne commence PAS tant que l’utilisateur n’a pas enregistré son compte rendu.



8. COMPTE RENDU

Chaque session doit enregistrer :

date

heure de début

heure de fin

durée

texte écrit par l’utilisateur

Exemple :

09:00 — 09:30



J'ai construit la landing page et corrigé les erreurs du formulaire.

Le texte doit être sauvegardé immédiatement dans le stockage local.



9. PAUSE

Après avoir enregistré le compte rendu :

Si du temps de travail reste :

lancer automatiquement la pause de 5 minutes.

Écran :

PAUSE

04:32

Texte secondaire :

Profite de ces quelques minutes.

Afficher également :

Prochaine session : 30 min

La pause doit être automatique.

À la fin de la pause :

passer automatiquement à la prochaine session de travail.

Pas besoin de bouton “commencer”.



10. SON DE FIN

Ajouter un système de notification sonore.

Dans les paramètres :

Son de fin de session

Toggle :

ON / OFF

Si ON :

jouer un petit son lorsque :

une session de travail se termine

une pause se termine

Le son doit être discret et agréable.

Ne pas utiliser de fichier audio externe si possible.

Privilégier Web Audio API ou une solution locale afin qu’il n’y ait aucune dépendance externe.

Prévoir plusieurs sons si cela reste simple :

Ding

Bell

Soft

Et un contrôle de volume.

IMPORTANT :

Respecter les restrictions des navigateurs concernant l’audio. Ne pas essayer de contourner les politiques d’autoplay.



11. FIN DE L’OBJECTIF

Lorsque tout le temps de travail demandé est terminé :

Afficher un écran de fin.

Exemple :

Travail terminé.

1 h 30 de focus

3 sessions

Puis :

Beau travail. Prends une vraie pause maintenant.

Bouton :

Voir ma journée



12. JOURNAL QUOTIDIEN

Créer une page appelée :

Ma journée

Chaque date correspond à une page/journal.

Exemple :

3 septembre 2026

Temps travaillé
1 h 30

Sessions
3

Puis afficher les sessions dans l’ordre chronologique.

Exemple :

09:00 — 09:30

J’ai travaillé sur ma landing page.

09:35 — 10:05

J’ai construit le système de timer.

10:10 — 10:40

J’ai corrigé les bugs.



13. NAVIGATION ENTRE LES JOURS

En haut du journal :

← Jour précédent

3 septembre

Jour suivant →

Si aucun travail n’existe pour une date :

Afficher quelque chose de propre :

Rien enregistré pour cette journée.

Permettre à l’utilisateur de revenir à aujourd’hui avec :

Aujourd’hui



14. PAGE D’ACCUEIL

La homepage doit être extrêmement simple.

Au centre :

Combien de temps veux-tu travailler ?

Puis les choix :

30 min
1 h
1 h 30
2 h
3 h

Puis :

Personnalisé

Pour personnalisé :

permettre de sélectionner :

heures

minutes

Puis :

Commencer une session



15. AFFICHER LA SESSION PRÉVUE

Avant de commencer, montrer un petit résumé.

Exemple :

Ton plan

Focus
30 min

Pause
5 min

Focus
30 min

Pause
5 min

Focus
30 min

Total de travail :

1 h 30

Temps réel estimé :

1 h 40

Cela permet à l’utilisateur de comprendre son programme.



16. PARAMÈTRES

Créer une page Settings.

Options :

Son

Son de fin :
ON / OFF

Volume

Type de son

Préférences

Durée de focus par défaut :
30 min

Durée de pause par défaut :
5 min

Données

Exporter mes données

Exporter les données en JSON.

Importer mes données

Permettre de restaurer les données depuis un fichier JSON.

Supprimer toutes mes données

Avec une confirmation forte avant suppression.

Texte :

Cette action supprimera définitivement toutes les données enregistrées sur cet appareil.



17. STOCKAGE LOCAL

Créer une couche dédiée de stockage.

Par exemple :

storage.ts

Ne pas mettre toute la logique LocalStorage directement dans les composants React.

Créer des fonctions propres :

getTodayJournal()

getJournal(date)

saveSession(session)

getAllJournals()

saveTimerState()

getTimerState()

clearTimerState()

exportData()

importData()

clearAllData()

Si IndexedDB est utilisé, créer également une couche d’abstraction propre.

L’objectif est de pouvoir remplacer facilement le système de stockage plus tard.



18. STRUCTURE DES DONNÉES

Prévoir une structure similaire à :

type Session = {

  id: string;

  date: string;

  startedAt: string;

  endedAt: string;

  durationSeconds: number;

  note: string;

};



type DayJournal = {

  date: string;

  totalFocusedSeconds: number;

  sessions: Session[];

};



type TimerState = {

  state: "IDLE" | "WORKING" | "AWAITING_LOG" | "BREAK" | "COMPLETED";

  goalSeconds: number;

  completedWorkSeconds: number;

  currentSessionDurationSeconds: number;

  currentSessionStartedAt: string | null;

  currentSessionEndsAt: string | null;

  sessionNumber: number;

  totalSessions: number;

};

Tu peux adapter cette structure si nécessaire, mais garde une architecture propre et typée.



19. RESPONSIVE DESIGN

L’application doit être pensée mobile-first.

Elle doit fonctionner parfaitement sur :

smartphone

tablette

ordinateur

Sur mobile :

le timer doit prendre une place importante.

Exemple :

        FOCUS



        29:42



    Session 1 / 3



████████░░░░░░



      [Pause]

Ne pas surcharger l’écran.



20. DESIGN

Je veux une esthétique :

minimaliste / premium / calme / moderne / productive.

Inspiration générale :

Linear

Arc

Raycast

Apple

Notion

Mais ne copie pas leur design.

Le produit doit avoir sa propre identité.

Éviter :

gradients excessifs

animations inutiles

50 boutons

couleurs criardes

dashboards complexes

Priorité :

lisibilité + calme + concentration.



21. ANIMATIONS

Utiliser des animations très légères.

Par exemple :

transition lors du changement de mode

apparition du formulaire de compte rendu

progression douce de la barre

transition entre Focus et Pause

Pas d’animation permanente qui pourrait distraire l’utilisateur pendant son travail.



22. ACCESSIBILITÉ

Prévoir :

boutons suffisamment grands sur mobile

contraste correct

navigation clavier

labels accessibles

textarea facilement utilisable

pas uniquement de couleur pour transmettre une information

Le timer doit être lisible rapidement.



23. NOTIFICATIONS

Si possible sans dépendance externe :

prévoir une notification navigateur lorsque :

une session se termine

une pause se termine

Mais cela doit rester optionnel et respecter les permissions du navigateur.

Ne jamais empêcher l’application de fonctionner si les notifications sont refusées.



24. INSTALLATION PWA

Configurer l’application comme une PWA si possible.

Ajouter :

manifest

icône

nom de l’application

thème

mode standalone

service worker

L’objectif est que l’utilisateur puisse ajouter l’application à son écran d’accueil.



25. HORS LIGNE

L’application doit pouvoir fonctionner hors ligne après son installation/chargement initial.

Toutes les fonctionnalités principales doivent fonctionner sans serveur :

timer

compte rendu

journal

paramètres

export

import



26. ROUTES

Prévoir une architecture de pages claire.

Par exemple :

/

Accueil

/focus

Timer

/today

Journal du jour

/day/:date

Journal d’une journée spécifique

/settings

Paramètres



27. NAVIGATION

Sur desktop :

sidebar ou navigation discrète.

Sur mobile :

navigation simple.

Les trois destinations principales :

Focus

Ma journée

Paramètres

Le bouton Focus doit être facilement accessible.



28. ÉTATS VIDES

Prévoir de vrais états vides.

Exemple journal :

Ta journée est encore vide.



Lance une session pour commencer à construire ton historique.

Bouton :

Commencer à travailler



29. GESTION DES CAS LIMITES

Prévoir les cas suivants :

L’utilisateur recharge la page pendant le focus

→ restaurer le timer.

L’utilisateur ferme puis revient

→ recalculer le temps restant grâce aux timestamps.

Le timer arrive à zéro alors que la page était en arrière-plan

→ afficher l’état correct au retour.

L’utilisateur quitte pendant une pause

→ reprendre la pause au bon moment.

L’utilisateur ferme après une session mais avant d’écrire

→ conserver l’état AWAITING_LOG.

L’utilisateur écrit puis recharge avant de cliquer sur enregistrer

→ idéalement conserver temporairement le texte saisi localement.

L’utilisateur demande 0 minute

→ empêcher le lancement.

L’utilisateur demande une durée très longue

→ limiter raisonnablement ou gérer proprement.



30. IMPORTANT : PAS DE COMPLEXITÉ INUTILE

Je veux une vraie V1 utilisable.

Ne construis pas maintenant :

système de comptes

social

classement

abonnement

paiement

IA

synchronisation cloud

équipe

partage de journal

calendrier complexe

tâches

to-do list

intégrations externes

Ces fonctionnalités pourront éventuellement arriver plus tard.

La V1 doit faire une seule chose extrêmement bien :

aider quelqu’un à travailler par blocs et garder une trace de ce qu’il a réellement fait.



31. ARCHITECTURE DU CODE

Le code doit être propre et maintenable.

Séparer :

UI

logique du timer

logique de stockage

logique de génération des sessions

types

utilitaires

Créer par exemple :

src/

  components/

  pages/

  hooks/

  services/

  utils/

  types/

  lib/

Créer un hook dédié au timer, par exemple :

useTimer()

Créer une logique séparée pour générer le planning :

buildFocusPlan(totalSeconds)

Cette fonction doit recevoir une durée totale de travail et retourner les blocs de travail/pause.

Exemple :

buildFocusPlan(3600)

doit produire :

WORK 1800

BREAK 300

WORK 1800

et non compter la pause dans les 3600 secondes de travail.



32. TESTS

Ajouter des tests unitaires pour la logique la plus importante.

Tester notamment :

30 min

40 min

60 min

75 min

90 min

120 min

Vérifier que :

le temps de travail total correspond exactement à l’objectif

aucune pause n’est créée après la dernière session

la dernière session correspond au temps restant

les timestamps sont correctement utilisés



33. DONNÉES ET CONFIDENTIALITÉ

Afficher discrètement dans les paramètres :

Tes données sont stockées uniquement sur cet appareil. L’application n’envoie pas ton journal vers un serveur.

Ne jamais envoyer le contenu des journaux vers une API externe.



34. PREMIER LANCEMENT

Au premier lancement, aucune inscription.

L’utilisateur arrive directement sur l’application.

Éventuellement afficher une petite phrase :

Work with intention.
Keep the proof.

Mais garde le wording facilement modifiable.



35. CRITÈRE DE RÉUSSITE

À la fin de cette génération, je veux pouvoir :

ouvrir l’application

choisir 1 h

démarrer

travailler pendant le timer

recevoir le son à la fin

écrire ce que j’ai fait

enregistrer

voir une pause de 5 min

reprendre automatiquement

terminer la deuxième session

voir mon objectif terminé

ouvrir “Ma journée”

voir mes deux sessions enregistrées

fermer/recharger la page pendant une session

retrouver mon timer exactement au bon état

exporter mes données

importer mes données sur un autre navigateur/appareil



36. AVANT DE CODER

Avant de commencer, analyse cette spécification et identifie les éventuelles incohérences techniques.

Ne me demande pas de créer un backend.

Si une fonctionnalité est impossible sans serveur, propose une alternative locale gratuite.

Puis construis directement la V1.

Priorité absolue :

fonctionnement du timer > persistance des données > expérience utilisateur > design > fonctionnalités secondaires.

Ne rajoute pas de fonctionnalités non demandées.

À la fin, vérifie que l’application compile correctement et corrige les erreurs éventuelles.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/c2345eda-3503-4043-8fe7-8d56e0969558).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
