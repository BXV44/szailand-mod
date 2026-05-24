# 🔨 Bot Mod — Szailand

Bot de modération et de bienvenue pour **discord.gg/szailand**.

## 📦 Variables Railway

| Variable | Obligatoire | Description |
|----------|-------------|-------------|
| `TOKEN` | ✅ | Token du bot Discord |
| `WELCOME_CHANNEL_ID` | ✅ | ID du salon de bienvenue |

## 🔒 Accès

Pour utiliser ce bot, l'utilisateur doit :
1. Être membre du serveur **discord.gg/Zhq5cJUkR5**
2. Avoir le rôle **ACCES BOT** (donné par le Bot Status)

## 📋 Commandes (préfixe `+`)

| Commande | Permission | Description |
|----------|-----------|-------------|
| `+ban @user [raison]` | Admin | Bannir un membre |
| `+unban <ID>` | Admin | Débannir par ID |
| `+bl @user` | Admin | Blacklister du bot |
| `+unbl @user` | Admin | Retirer de la blacklist |
| `+help` | Tous | Voir les commandes |

## 🎉 Welcome

Quand un membre rejoint : le bot le mentionne dans le salon de bienvenue, puis supprime le message après **3 secondes**.

## ⚠️ Notes

- La blacklist est **en mémoire** (reset au redémarrage).
- Ce bot doit être **dans le serveur szailand** (`1505662196665811024`) pour vérifier les accès.
