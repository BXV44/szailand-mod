# 🤖 ModBot — Bot Discord Complet

## 🚀 Déploiement sur Railway

### Étapes:
1. Crée un compte sur [railway.app](https://railway.app)
2. **New Project** → **Deploy from GitHub repo** (ou upload le dossier)
3. Dans les **Variables**, ajoute:
   - `TOKEN` = ton token Discord
   - `PREFIX` = `!` (ou autre)
   - `OWNER1` = `1222217828770516992`
   - `OWNER2` = `1371573736054194356`
4. Le bot démarre automatiquement !

---

## 📋 Commandes

### 🔨 Modération
| Commande | Description |
|----------|-------------|
| `ban @user [raison]` | Bannir un membre |
| `unban <id> [raison]` | Débannir |
| `banall` | Bannir tous les membres (owner) |
| `unbanall` | Débannir tous (owner) |
| `kick @user [raison]` | Kick |
| `mute @user <durée> [raison]` | Timeout (ex: 10m, 2h, 1d) |
| `unmute @user` | Enlever timeout |
| `warn @user [raison]` | Avertir |
| `lock [#salon]` | Verrouiller |
| `unlock [#salon]` | Déverrouiller |
| `slowmode <sec>` | Mode lent |
| `xclear <1-100>` | Purger messages |
| `massiverole <add\|remove> @role` | Rôle en masse |
| `temprole @user @role <durée>` | Rôle temporaire |
| `untemprole @user @role` | Annuler rôle temp |
| `voicemove @user #vocal` | Déplacer en vocal |
| `blacklist @user` | Blacklister du bot |
| `unblacklist @user` | Retirer blacklist |

### 🛡️ Protection
| Commande | Description |
|----------|-------------|
| `antiraid <on\|off\|threshold\|log\|status>` | Antiraid |
| `antilink <on\|off\|discord\|action\|log\|status>` | Antilink |

### 🎫 Tickets
| Commande | Description |
|----------|-------------|
| `ticket panel` | Envoyer le panel de tickets (avec GIF) |
| `ticket setup #logs @role` | Configurer les tickets |
| `ticket close` | Fermer un ticket |
| `ticket add @user` | Ajouter un utilisateur |
| `ticket remove @user` | Retirer un utilisateur |

### 💾 Backup
| Commande | Description |
|----------|-------------|
| `backup create` | Créer une sauvegarde |
| `backup load <id>` | Restaurer une sauvegarde |
| `backup list` | Liste des sauvegardes |
| `backup delete <id>` | Supprimer une sauvegarde |

### ⚙️ Gestion (Owners)
| Commande | Description |
|----------|-------------|
| `whitelist @user` | Mettre en admin bot |
| `unwl @user` | Retirer whitelist |
| `watch` | Voir whitelist & owners |
| `prefix <nouveau>` | Changer le prefix |
| `setname <nom>` | Changer le nom du bot |
| `setpic <url>` | Changer l'avatar |
| `serverlist` | Liste des serveurs |
| `updatedm <message>` | DM aux owners de serveurs |
| `update <version>` | Annonce de mise à jour |
| `owner` | Voir les owners |

### 🎉 Welcome
| Commande | Description |
|----------|-------------|
| `welcome set #salon` | Configurer le salon |
| `welcome on / off` | Activer/désactiver |
| `welcome message <texte>` | Message ({user} {server} {count}) |
| `welcome title <texte>` | Titre de l'embed |
| `welcome image <url>` | Image de l'embed |
| `welcome footer <texte>` | Footer |
| `welcome ping` | Toggle ping du membre |
| `welcome autorole @role` | Rôle auto à l'arrivée |
| `welcome test` | Tester le message |

### 🔧 Utilitaire
| Commande | Description |
|----------|-------------|
| `help` | Liste des commandes |
| `adminlist` | Liste des admins |
| `botlist` | Liste des bots |
| `wiki <recherche>` | Recherche Wikipedia |
| `vc [@user]` | Info salon vocal |
| `user [@user]` | Info utilisateur |
| `speed` | Ping du bot |
| `snipe` | Dernier message supprimé |
| `serverinfo` | Info du serveur |

---

## 🔑 Owners
Les owners sont **1222217828770516992** et **1371573736054194356**.
Ils ont accès à toutes les commandes sans restriction.

## 📁 Structure
```
modbot/
├── index.js          # Point d'entrée
├── package.json
├── Procfile          # Pour Railway
├── events/           # Événements Discord
├── moderation/       # Commandes de modération
├── antiraid/         # Antiraid & Antilink
├── backup/           # Système de backup
├── gestion/          # Gestion du bot
├── utilitaire/       # Commandes utilitaires
├── welcome/          # Système de bienvenue
├── utils/            # Utilitaires (data, embeds...)
└── data/             # Données JSON (auto-créé)
```
