#!/usr/bin/env python3
"""
Fix key parity between en/ui.json, fr/ui.json, and es/ui.json.

Strategy:
1. EN is canonical for key structure
2. FR has a richer/different structure in many places - we need to reconcile
3. ES currently matches EN structure
4. Output: all three files with identical key structure

For sections where FR restructured keys (e.g. nested objects vs flat strings),
we need to pick ONE structure and apply it everywhere.

Decision: Use the RICHER structure (union of both), since FR added useful keys.
But keep EN key NAMES where there's a naming conflict (e.g. signUpLink vs signupLink).
"""

import json
import copy
import sys
import os

BASE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'content')

def load(locale):
    with open(os.path.join(BASE, locale, 'ui.json'), 'r', encoding='utf-8') as f:
        return json.load(f)

def save(locale, data):
    with open(os.path.join(BASE, locale, 'ui.json'), 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write('\n')

def get_keys(d, prefix=''):
    keys = set()
    for k, v in d.items():
        full = f'{prefix}{k}' if prefix else k
        if isinstance(v, dict):
            keys.update(get_keys(v, f'{full}.'))
        else:
            keys.add(full)
    return keys

def set_nested(d, path, value):
    """Set a value at a nested path like 'a.b.c'"""
    parts = path.split('.')
    for part in parts[:-1]:
        if part not in d or not isinstance(d[part], dict):
            d[part] = {}
        d = d[part]
    d[parts[-1]] = value

def get_nested(d, path):
    """Get a value at a nested path, return None if not found"""
    parts = path.split('.')
    for part in parts:
        if not isinstance(d, dict) or part not in d:
            return None
        d = d[part]
    return d

en = load('en')
fr = load('fr')
es = load('es')

# We'll build new versions of all three files with the SAME key structure.
# The canonical structure will be based on EN, but we'll add keys that FR has
# which are genuinely new (not just restructured versions of existing keys).

# First, let's build the unified structure based on EN as the skeleton,
# then carefully handle the FR differences.

new_en = copy.deepcopy(en)
new_fr = {}
new_es = copy.deepcopy(es)

# ============================================================
# SECTION BY SECTION RECONCILIATION
# ============================================================

# categories, chapters, exerciseTypes - identical structure, just translate
# These are fine as-is in EN and ES. FR matches structure.

# --- labels ---
# FR is missing: skipped, of, allMissions, completedMissions, hours
# EN is missing nothing here that FR has
# Fix: add missing keys to FR

# --- auth.login ---
# EN has: signUpLink (camelCase with capital U)
# FR has: signupLink (lowercase u) + extra: emailPlaceholder, passwordPlaceholder
# Decision: use EN key name (signUpLink), add placeholders to EN and ES

# --- auth.signup ---
# EN has: hasAccount, termsAccept
# FR has: alreadyHaveAccount, termsNotice + extras: usernamePlaceholder, emailPlaceholder,
#          passwordPlaceholder, confirmPasswordLabel, confirmPasswordPlaceholder, orContinueWith, googleButton
# Decision: use EN key names, add FR's extra keys to all

# --- auth.forgotPassword ---
# EN has: emailSent, emailSentSubtitle
# FR has: successMessage + extra: emailPlaceholder
# Decision: use EN key names, add emailPlaceholder

# --- auth.resetPassword ---
# EN has: newPasswordLabel, confirmPasswordLabel, success
# FR has: subtitle, passwordLabel, passwordPlaceholder, confirmPasswordLabel, confirmPasswordPlaceholder, successMessage
# Decision: use EN names, add FR extras

# --- auth.twoFactor ---
# EN has: resend
# FR has: resendCode, resendCountdown + codePlaceholder
# Decision: use EN key name (resend), add codePlaceholder and resendCountdown

# --- onboarding ---
# EN has flat: welcomeTitle, welcomeSubtitle, step1Title, etc.
# FR has nested: welcome.title, howItWorks.step1Title, chooseGoal, disclaimerIntro, allSet
# Decision: keep EN flat structure, add FR's extra sections (chooseGoal, disclaimerIntro, allSet)

# --- exercise ---
# EN has: SI.*, CM.*, IP.*, ST.*, feedback.correctHeadline1..3, etc., gasFeeNotice (string), gasFeeFirstTime, etc.
# FR has: instructions.SI/CM/IP/ST, feedback.correct (array), gasFeeNotice.firstTime/standard/etc., progress.*
# Decision: keep EN structure (with named sub-objects SI/CM/IP/ST), add FR extras

# --- gamification.achievements ---
# EN has just toastTitle/toastBody per achievement
# FR has title/description/toastTitle/toastBody per achievement
# Decision: add title and description to EN and ES

# --- gamification.streak ---
# FR has extra: streakLabel, streakDays, streakDays_plural
# EN has: day1 (FR doesn't)
# Decision: add FR extras to EN/ES, keep EN's day1

# --- gamification.tokens ---
# FR has extra: knowledgeTokens, ktAbbreviation, lowBalanceWarning, zeroBalanceWarning, negativeBalanceWarning
# Decision: add to EN and ES

# --- gamification.leaderboard ---
# FR has extra: rankChange_up, rankChange_down, rankChange_same
# Decision: add to EN and ES

# --- gamification.welcomeBack ---
# EN has: shortAbsence, oneWeekAbsence, twoWeekAbsence, longAbsence, generic
# FR has: variant1..variant5
# Decision: keep EN key names

# --- gamification.refresher vs conceptRefresher ---
# EN has: refresher.variant1..3
# FR has: conceptRefresher.variant1..3
# Decision: keep EN key name (refresher)

# --- gamification.postMission ---
# EN has: correct1..4, chapterComplete1..3, categoryComplete1..2
# FR has: completionMessages (array), chapterCompleteMessages (array), categoryCompleteMessages (array)
# Decision: keep EN structure (named keys)

# --- certificate ---
# EN has: headline, subheadline, completedOn, shareTitle, shareBody, downloadButton, shareButton, linkedInButton
# FR has: title, subtitle, completionStatement, dateLabel, shareButton, downloadButton, linkedinButton, toastTitle, toastBody, programName, verificationLabel
# Decision: keep EN key names, add FR extras

# --- social ---
# EN has: friendsList.*, publicProfile.*
# FR has: friends.*, profile.*
# Decision: keep EN key names (friendsList, publicProfile), add FR extras

# --- notifications ---
# EN has flat: achievement_unlocked, streak_milestone, etc.
# FR has nested: title, markAllRead, noNotifications, types.*, messages.*
# Decision: keep EN flat structure, add FR extras (title, markAllRead, types, messages)

# --- errors ---
# FR has extra: passwordTooShort, passwordMismatch, emailInvalid, requiredField
# Decision: add to EN and ES

# --- emptyStates ---
# EN has flat strings
# FR has nested objects with title/body/ctaLabel
# Decision: keep EN flat structure

# ============================================================
# NOW BUILD THE UNIFIED FILES
# ============================================================

# Start with deep copies of EN
new_en = copy.deepcopy(en)
new_es = copy.deepcopy(es)

# We'll build new_fr manually to match EN structure with FR translations

# Helper: for sections that match, just copy
def copy_section(section_name):
    """Sections where structure matches between EN and FR"""
    pass  # Already in en/es, fr will be rebuilt

# ---------- labels ----------
# Add missing keys to FR (they'll use EN structure)
# FR missing: skipped, of, allMissions, completedMissions, hours

# ---------- auth.login ----------
# Add placeholders from FR to EN and ES
new_en['auth']['login']['emailPlaceholder'] = "your@email.com"
new_en['auth']['login']['passwordPlaceholder'] = "Your password"
new_es['auth']['login']['emailPlaceholder'] = "tu@email.com"
new_es['auth']['login']['passwordPlaceholder'] = "Tu contraseña"

# ---------- auth.signup ----------
# Add FR extras to EN and ES
new_en['auth']['signup']['usernamePlaceholder'] = "Choose a username"
new_en['auth']['signup']['emailPlaceholder'] = "your@email.com"
new_en['auth']['signup']['passwordPlaceholder'] = "Minimum 8 characters"
new_en['auth']['signup']['confirmPasswordLabel'] = "Confirm password"
new_en['auth']['signup']['confirmPasswordPlaceholder'] = "Repeat your password"
new_en['auth']['signup']['orContinueWith'] = "or continue with"
new_en['auth']['signup']['googleButton'] = "Continue with Google"

new_es['auth']['signup']['usernamePlaceholder'] = "Elige un nombre de usuario"
new_es['auth']['signup']['emailPlaceholder'] = "tu@email.com"
new_es['auth']['signup']['passwordPlaceholder'] = "Mínimo 8 caracteres"
new_es['auth']['signup']['confirmPasswordLabel'] = "Confirmar contraseña"
new_es['auth']['signup']['confirmPasswordPlaceholder'] = "Repite tu contraseña"
new_es['auth']['signup']['orContinueWith'] = "o continúa con"
new_es['auth']['signup']['googleButton'] = "Continuar con Google"

# ---------- auth.forgotPassword ----------
new_en['auth']['forgotPassword']['emailPlaceholder'] = "your@email.com"
new_es['auth']['forgotPassword']['emailPlaceholder'] = "tu@email.com"

# ---------- auth.resetPassword ----------
new_en['auth']['resetPassword']['subtitle'] = "Choose a new secure password."
new_en['auth']['resetPassword']['passwordPlaceholder'] = "Minimum 8 characters"
new_en['auth']['resetPassword']['confirmPasswordPlaceholder'] = "Repeat your new password"

new_es['auth']['resetPassword']['subtitle'] = "Elige una nueva contraseña segura."
new_es['auth']['resetPassword']['passwordPlaceholder'] = "Mínimo 8 caracteres"
new_es['auth']['resetPassword']['confirmPasswordPlaceholder'] = "Repite tu nueva contraseña"

# ---------- auth.twoFactor ----------
new_en['auth']['twoFactor']['codePlaceholder'] = "000000"
new_en['auth']['twoFactor']['resendCountdown'] = "Resend available in {seconds}s"

new_es['auth']['twoFactor']['codePlaceholder'] = "000000"
new_es['auth']['twoFactor']['resendCountdown'] = "Reenvío disponible en {seconds}s"

# ---------- onboarding ----------
# Add FR's extra sections to EN and ES
new_en['onboarding']['chooseGoal'] = {
    "title": "What's your goal?",
    "subtitle": "This doesn't change the content — just the context.",
    "option1": "Understand what everyone's talking about",
    "option2": "Evaluate a potential investment",
    "option3": "Understand the technology in depth",
    "option4": "Just curious",
    "ctaLabel": "Continue"
}
new_en['onboarding']['disclaimerIntro'] = {
    "title": "An important note",
    "body": "Transcendence is an educational platform. Nothing here constitutes financial advice. We cover digital finance topics — honestly, without promising returns.",
    "ctaLabel": "Got it, let's start"
}
new_en['onboarding']['allSet'] = {
    "title": "All set.",
    "body": "Your first chapter is waiting. Every concept you master adds to your foundation — and foundations matter.",
    "ctaLabel": "Start my first mission"
}

new_es['onboarding']['chooseGoal'] = {
    "title": "¿Cuál es tu objetivo?",
    "subtitle": "Esto no cambia el contenido — solo el contexto.",
    "option1": "Entender de qué habla todo el mundo",
    "option2": "Evaluar una inversión potencial",
    "option3": "Entender la tecnología en profundidad",
    "option4": "Solo curiosidad",
    "ctaLabel": "Continuar"
}
new_es['onboarding']['disclaimerIntro'] = {
    "title": "Una nota importante",
    "body": "Transcendence es una plataforma educativa. Nada aquí constituye asesoría financiera. Cubrimos temas de finanzas digitales — con honestidad, sin prometer rendimientos.",
    "ctaLabel": "Entendido, comencemos"
}
new_es['onboarding']['allSet'] = {
    "title": "Todo listo.",
    "body": "Tu primer capítulo te espera. Cada concepto que domines se suma a tu base — y las bases importan.",
    "ctaLabel": "Comenzar mi primera misión"
}

# ---------- exercise ----------
# Add progress sub-section from FR
new_en['exercise']['progress'] = {
    "questionOf": "Question {current} of {total}",
    "missionProgress": "Mission {current} of {total}"
}
new_es['exercise']['progress'] = {
    "questionOf": "Pregunta {current} de {total}",
    "missionProgress": "Misión {current} de {total}"
}

# ---------- gamification.achievements ----------
# Add title and description from FR to EN and ES
achievement_en_extras = {
    "BLOCKCHAIN_BEGINNER": {"title": "Blockchain Foundations", "description": "Complete Category 1: Blockchain Foundations"},
    "CRYPTO_CURIOUS": {"title": "Crypto Curious", "description": "Complete Category 2: Crypto & Tokens"},
    "WALLET_WIZARD": {"title": "Wallet Wizard", "description": "Complete Category 3: Wallets & Gas"},
    "SMART_COOKIE": {"title": "Smart Cookie", "description": "Complete Category 4: Smart Contracts"},
    "NFT_NATIVE": {"title": "NFT Native", "description": "Complete Category 5: NFTs & Digital Ownership"},
    "DEFI_EXPLORER": {"title": "DeFi Explorer", "description": "Complete Category 6: DeFi & Beyond"},
    "FIRST_TOKENS": {"title": "First Tokens", "description": "Earn 10 Knowledge Tokens"},
    "TOKEN_COLLECTOR": {"title": "Token Collector", "description": "Earn 50 Knowledge Tokens"},
    "TOKEN_RICH": {"title": "Token Rich", "description": "Earn 100 Knowledge Tokens"},
    "GETTING_STARTED": {"title": "Getting Started", "description": "Reach a 3-day learning streak"},
    "WEEK_WARRIOR": {"title": "Week Warrior", "description": "Reach a 7-day learning streak"},
    "DEDICATED_LEARNER": {"title": "Dedicated Learner", "description": "Reach a 14-day learning streak"},
    "MONTHLY_MASTER": {"title": "Monthly Master", "description": "Reach a 30-day learning streak"},
}

achievement_es_extras = {
    "BLOCKCHAIN_BEGINNER": {"title": "Fundamentos Blockchain", "description": "Completa la Categoría 1: Fundamentos de Blockchain"},
    "CRYPTO_CURIOUS": {"title": "Curioso de las Crypto", "description": "Completa la Categoría 2: Crypto y Tokens"},
    "WALLET_WIZARD": {"title": "Mago de las Wallets", "description": "Completa la Categoría 3: Wallets y Gas"},
    "SMART_COOKIE": {"title": "Cerebro Conectado", "description": "Completa la Categoría 4: Smart Contracts"},
    "NFT_NATIVE": {"title": "Nativo de los NFTs", "description": "Completa la Categoría 5: NFTs y Propiedad Digital"},
    "DEFI_EXPLORER": {"title": "Explorador DeFi", "description": "Completa la Categoría 6: DeFi y Más Allá"},
    "FIRST_TOKENS": {"title": "Primeros Tokens", "description": "Gana 10 Knowledge Tokens"},
    "TOKEN_COLLECTOR": {"title": "Coleccionista de Tokens", "description": "Gana 50 Knowledge Tokens"},
    "TOKEN_RICH": {"title": "Rico en Conocimiento", "description": "Gana 100 Knowledge Tokens"},
    "GETTING_STARTED": {"title": "Empezando", "description": "Alcanza una racha de 3 días de aprendizaje"},
    "WEEK_WARRIOR": {"title": "Guerrero de la Semana", "description": "Alcanza una racha de 7 días de aprendizaje"},
    "DEDICATED_LEARNER": {"title": "Aprendiz Dedicado", "description": "Alcanza una racha de 14 días de aprendizaje"},
    "MONTHLY_MASTER": {"title": "Maestro del Mes", "description": "Alcanza una racha de 30 días de aprendizaje"},
}

for key, extras in achievement_en_extras.items():
    new_en['gamification']['achievements'][key]['title'] = extras['title']
    new_en['gamification']['achievements'][key]['description'] = extras['description']

for key, extras in achievement_es_extras.items():
    new_es['gamification']['achievements'][key]['title'] = extras['title']
    new_es['gamification']['achievements'][key]['description'] = extras['description']

# ---------- gamification.streak ----------
# Add FR extras
new_en['gamification']['streak']['streakLabel'] = "Current streak"
new_en['gamification']['streak']['streakDays'] = "{count} day"
new_en['gamification']['streak']['streakDays_plural'] = "{count} days"

new_es['gamification']['streak']['streakLabel'] = "Racha actual"
new_es['gamification']['streak']['streakDays'] = "{count} día"
new_es['gamification']['streak']['streakDays_plural'] = "{count} días"

# ---------- gamification.tokens ----------
# Add FR extras
new_en['gamification']['tokens']['knowledgeTokens'] = "Knowledge Tokens"
new_en['gamification']['tokens']['ktAbbreviation'] = "KT"
new_en['gamification']['tokens']['lowBalanceWarning'] = "Your balance is low. Complete a mission to top up."
new_en['gamification']['tokens']['zeroBalanceWarning'] = "Your balance is at 0. Complete this mission before starting a new one."
new_en['gamification']['tokens']['negativeBalanceWarning'] = "Negative balance. Complete this mission to clear your debt."

new_es['gamification']['tokens']['knowledgeTokens'] = "Knowledge Tokens"
new_es['gamification']['tokens']['ktAbbreviation'] = "KT"
new_es['gamification']['tokens']['lowBalanceWarning'] = "Tu saldo está bajo. Completa una misión para recargarlo."
new_es['gamification']['tokens']['zeroBalanceWarning'] = "Tu saldo está en 0. Completa esta misión antes de comenzar una nueva."
new_es['gamification']['tokens']['negativeBalanceWarning'] = "Saldo negativo. Completa esta misión para saldar tu deuda."

# ---------- gamification.leaderboard ----------
new_en['gamification']['leaderboard']['rankChange_up'] = "+{count} place"
new_en['gamification']['leaderboard']['rankChange_down'] = "-{count} place"
new_en['gamification']['leaderboard']['rankChange_same'] = "Rank unchanged"

new_es['gamification']['leaderboard']['rankChange_up'] = "+{count} puesto"
new_es['gamification']['leaderboard']['rankChange_down'] = "-{count} puesto"
new_es['gamification']['leaderboard']['rankChange_same'] = "Rango estable"

# ---------- certificate ----------
# Add FR extras
new_en['certificate']['title'] = "Certificate of Completion"
new_en['certificate']['subtitle'] = "Awarded to"
new_en['certificate']['completionStatement'] = "has successfully completed the entire Transcendence program — 6 categories, {chapterCount} chapters, {missionCount} missions."
new_en['certificate']['dateLabel'] = "Date of completion"
new_en['certificate']['toastTitle'] = "Certificate earned."
new_en['certificate']['toastBody'] = "Your proof of completion is ready to share."
new_en['certificate']['programName'] = "Transcendence — Blockchain Literacy"
new_en['certificate']['verificationLabel'] = "Verification"

new_es['certificate']['title'] = "Certificado de Finalización"
new_es['certificate']['subtitle'] = "Otorgado a"
new_es['certificate']['completionStatement'] = "ha completado con éxito el programa completo de Transcendence — 6 categorías, {chapterCount} capítulos, {missionCount} misiones."
new_es['certificate']['dateLabel'] = "Fecha de finalización"
new_es['certificate']['toastTitle'] = "Certificado obtenido."
new_es['certificate']['toastBody'] = "Tu prueba de finalización está lista para compartir."
new_es['certificate']['programName'] = "Transcendence — Alfabetización Blockchain"
new_es['certificate']['verificationLabel'] = "Verificación"

# ---------- social ----------
# Add FR extras to EN's friendsList and publicProfile
new_en['social']['friendsList']['friendsSince'] = "Friends since {date}"
new_en['social']['friendsList']['removeFriend'] = "Remove friend"
new_en['social']['friendsList']['blockUser'] = "Block"
new_en['social']['friendsList']['requestSent'] = "Request sent"
new_en['social']['friendsList']['friendCount'] = "{count} friend"
new_en['social']['friendsList']['friendCount_plural'] = "{count} friends"

new_es['social']['friendsList']['friendsSince'] = "Amigos desde {date}"
new_es['social']['friendsList']['removeFriend'] = "Eliminar amigo"
new_es['social']['friendsList']['blockUser'] = "Bloquear"
new_es['social']['friendsList']['requestSent'] = "Solicitud enviada"
new_es['social']['friendsList']['friendCount'] = "{count} amigo"
new_es['social']['friendsList']['friendCount_plural'] = "{count} amigos"

# Add FR profile extras to publicProfile
new_en['social']['publicProfile']['editProfile'] = "Edit profile"
new_en['social']['publicProfile']['longestStreak'] = "Longest streak"
new_en['social']['publicProfile']['tokenBalance'] = "KT balance"
new_en['social']['publicProfile']['achievementsUnlocked'] = "Achievements unlocked"
new_en['social']['publicProfile']['rank'] = "Rank"
new_en['social']['publicProfile']['shareProfile'] = "Share my profile"
new_en['social']['publicProfile']['statsTitle'] = "My stats"
new_en['social']['publicProfile']['bioPlaceholder'] = "Say something about yourself..."

new_es['social']['publicProfile']['editProfile'] = "Editar perfil"
new_es['social']['publicProfile']['longestStreak'] = "Mejor racha"
new_es['social']['publicProfile']['tokenBalance'] = "Saldo KT"
new_es['social']['publicProfile']['achievementsUnlocked'] = "Logros desbloqueados"
new_es['social']['publicProfile']['rank'] = "Rango"
new_es['social']['publicProfile']['shareProfile'] = "Compartir mi perfil"
new_es['social']['publicProfile']['statsTitle'] = "Mis estadísticas"
new_es['social']['publicProfile']['bioPlaceholder'] = "Di algo sobre ti..."

# ---------- notifications ----------
# Add FR extras (title, markAllRead, types, messages)
new_en['notifications']['title'] = "Notifications"
new_en['notifications']['markAllRead'] = "Mark all as read"
new_en['notifications']['noNotifications'] = "No notifications right now. Keep learning!"
new_en['notifications']['types'] = {
    "achievement_unlocked": "Achievement unlocked",
    "streak_milestone": "Streak milestone",
    "friend_request": "Friend request",
    "friend_accepted": "Friend request accepted",
    "mission_reminder": "Mission reminder",
    "level_up": "Level up",
    "token_earned": "Tokens earned",
    "gas_deducted": "Gas deducted",
    "system_message": "System message"
}
new_en['notifications']['messages'] = {
    "achievement_unlocked": "You just unlocked the \"{achievementTitle}\" achievement.",
    "streak_milestone": "Congratulations! You've reached a {days}-day streak.",
    "friend_request": "{username} sent you a friend request.",
    "friend_accepted": "{username} accepted your friend request.",
    "mission_reminder": "Your next mission is waiting. Don't break your streak!",
    "level_up": "You've reached level {level}. Keep going.",
    "token_earned": "You earned {amount} KT for completing this mission.",
    "gas_deducted": "-{amount} KT gas was deducted for this attempt.",
    "system_message": "{message}"
}

new_es['notifications']['title'] = "Notificaciones"
new_es['notifications']['markAllRead'] = "Marcar todo como leído"
new_es['notifications']['noNotifications'] = "Sin notificaciones por ahora. ¡Sigue aprendiendo!"
new_es['notifications']['types'] = {
    "achievement_unlocked": "Logro desbloqueado",
    "streak_milestone": "Hito de racha",
    "friend_request": "Solicitud de amistad",
    "friend_accepted": "Solicitud de amistad aceptada",
    "mission_reminder": "Recordatorio de misión",
    "level_up": "Subiste de nivel",
    "token_earned": "Tokens ganados",
    "gas_deducted": "Gas descontado",
    "system_message": "Mensaje del sistema"
}
new_es['notifications']['messages'] = {
    "achievement_unlocked": "Acabas de desbloquear el logro \"{achievementTitle}\".",
    "streak_milestone": "¡Felicidades! Has alcanzado una racha de {days} días.",
    "friend_request": "{username} te envió una solicitud de amistad.",
    "friend_accepted": "{username} aceptó tu solicitud de amistad.",
    "mission_reminder": "Tu próxima misión te espera. ¡No rompas tu racha!",
    "level_up": "Has alcanzado el nivel {level}. Sigue adelante.",
    "token_earned": "Ganaste {amount} KT por completar esta misión.",
    "gas_deducted": "-{amount} KT de gas fueron descontados por este intento.",
    "system_message": "{message}"
}

# ---------- errors ----------
# Add FR extras
new_en['errors']['passwordTooShort'] = "Your password must be at least 8 characters."
new_en['errors']['passwordMismatch'] = "The two passwords don't match."
new_en['errors']['emailInvalid'] = "Please enter a valid email address."
new_en['errors']['requiredField'] = "This field is required."

new_es['errors']['passwordTooShort'] = "Tu contraseña debe tener al menos 8 caracteres."
new_es['errors']['passwordMismatch'] = "Las dos contraseñas no coinciden."
new_es['errors']['emailInvalid'] = "Por favor ingresa una dirección de correo válida."
new_es['errors']['requiredField'] = "Este campo es obligatorio."

# ============================================================
# NOW BUILD FR TO MATCH THE NEW EN STRUCTURE
# ============================================================

# We'll walk the new_en structure and build new_fr with matching keys
def build_fr_from_en(en_obj, fr_old, path=''):
    """Build FR object matching EN structure, using FR translations where available"""
    result = {}
    for key, value in en_obj.items():
        current_path = f'{path}.{key}' if path else key
        if isinstance(value, dict):
            # Recurse
            fr_sub = fr_old.get(key, {}) if isinstance(fr_old, dict) else {}
            result[key] = build_fr_from_en(value, fr_sub, current_path)
        else:
            # Leaf node - try to find FR translation
            if isinstance(fr_old, dict) and key in fr_old:
                fr_val = fr_old[key]
                # If FR has a dict where EN has a string, use the EN value as placeholder
                if isinstance(fr_val, dict):
                    result[key] = f"[FR] {value}"
                else:
                    result[key] = fr_val
            else:
                # No direct match - mark for manual translation
                result[key] = f"[FR] {value}"

    return result

# But this simple approach won't handle all the FR restructuring.
# Let's be more surgical and build FR section by section.

new_fr = {}

# --- categories ---
new_fr['categories'] = copy.deepcopy(fr['categories'])

# --- chapters ---
new_fr['chapters'] = copy.deepcopy(fr['chapters'])

# --- exerciseTypes ---
new_fr['exerciseTypes'] = copy.deepcopy(fr['exerciseTypes'])

# --- labels ---
new_fr['labels'] = {}
fr_labels = fr['labels']
for key in new_en['labels']:
    if key in fr_labels:
        new_fr['labels'][key] = fr_labels[key]
    else:
        # Missing in FR - translate
        translations = {
            'skipped': 'Passé',
            'of': 'sur',
            'allMissions': 'Toutes les missions',
            'completedMissions': 'Missions terminées',
            'hours': 'h',
        }
        new_fr['labels'][key] = translations.get(key, f"[FR] {new_en['labels'][key]}")

# --- auth.login ---
new_fr['auth'] = {}
new_fr['auth']['login'] = {}
fr_login = fr['auth']['login']
for key in new_en['auth']['login']:
    if key in fr_login:
        new_fr['auth']['login'][key] = fr_login[key]
    elif key == 'signUpLink':
        # FR had 'signupLink'
        new_fr['auth']['login'][key] = fr_login.get('signupLink', "S'inscrire")
    elif key == 'emailPlaceholder':
        new_fr['auth']['login'][key] = fr_login.get('emailPlaceholder', 'votre@email.com')
    elif key == 'passwordPlaceholder':
        new_fr['auth']['login'][key] = fr_login.get('passwordPlaceholder', 'Votre mot de passe')
    else:
        new_fr['auth']['login'][key] = f"[FR] {new_en['auth']['login'][key]}"

# --- auth.signup ---
new_fr['auth']['signup'] = {}
fr_signup = fr['auth']['signup']
for key in new_en['auth']['signup']:
    if key in fr_signup:
        new_fr['auth']['signup'][key] = fr_signup[key]
    elif key == 'hasAccount':
        new_fr['auth']['signup'][key] = fr_signup.get('alreadyHaveAccount', 'Vous avez déjà un compte ?')
    elif key == 'termsAccept':
        new_fr['auth']['signup'][key] = fr_signup.get('termsNotice', "En vous inscrivant, vous acceptez nos Conditions d'utilisation et notre Politique de confidentialité.")
    else:
        new_fr['auth']['signup'][key] = f"[FR] {new_en['auth']['signup'][key]}"

# --- auth.forgotPassword ---
new_fr['auth']['forgotPassword'] = {}
fr_forgot = fr['auth']['forgotPassword']
for key in new_en['auth']['forgotPassword']:
    if key in fr_forgot:
        new_fr['auth']['forgotPassword'][key] = fr_forgot[key]
    elif key == 'emailSent':
        new_fr['auth']['forgotPassword'][key] = "Vérifiez votre boîte de réception"
    elif key == 'emailSentSubtitle':
        new_fr['auth']['forgotPassword'][key] = fr_forgot.get('successMessage', "Un e-mail de réinitialisation vous a été envoyé. Vérifiez votre boîte de réception.")
    elif key == 'emailPlaceholder':
        new_fr['auth']['forgotPassword'][key] = fr_forgot.get('emailPlaceholder', 'votre@email.com')
    else:
        new_fr['auth']['forgotPassword'][key] = f"[FR] {new_en['auth']['forgotPassword'][key]}"

# --- auth.resetPassword ---
new_fr['auth']['resetPassword'] = {}
fr_reset = fr['auth']['resetPassword']
for key in new_en['auth']['resetPassword']:
    if key in fr_reset:
        new_fr['auth']['resetPassword'][key] = fr_reset[key]
    elif key == 'newPasswordLabel':
        new_fr['auth']['resetPassword'][key] = fr_reset.get('passwordLabel', 'Nouveau mot de passe')
    elif key == 'success':
        new_fr['auth']['resetPassword'][key] = fr_reset.get('successMessage', 'Votre mot de passe a été mis à jour. Vous pouvez vous connecter.')
    elif key == 'subtitle':
        new_fr['auth']['resetPassword'][key] = fr_reset.get('subtitle', 'Choisissez un nouveau mot de passe sécurisé.')
    elif key == 'passwordPlaceholder':
        new_fr['auth']['resetPassword'][key] = fr_reset.get('passwordPlaceholder', 'Minimum 8 caractères')
    elif key == 'confirmPasswordPlaceholder':
        new_fr['auth']['resetPassword'][key] = fr_reset.get('confirmPasswordPlaceholder', 'Répétez votre nouveau mot de passe')
    else:
        new_fr['auth']['resetPassword'][key] = f"[FR] {new_en['auth']['resetPassword'][key]}"

# --- auth.twoFactor ---
new_fr['auth']['twoFactor'] = {}
fr_2fa = fr['auth']['twoFactor']
for key in new_en['auth']['twoFactor']:
    if key in fr_2fa:
        new_fr['auth']['twoFactor'][key] = fr_2fa[key]
    elif key == 'resend':
        new_fr['auth']['twoFactor'][key] = fr_2fa.get('resendCode', "Renvoyer le code")
    elif key == 'codePlaceholder':
        new_fr['auth']['twoFactor'][key] = fr_2fa.get('codePlaceholder', '000000')
    elif key == 'resendCountdown':
        new_fr['auth']['twoFactor'][key] = fr_2fa.get('resendCountdown', 'Renvoi possible dans {seconds}s')
    else:
        new_fr['auth']['twoFactor'][key] = f"[FR] {new_en['auth']['twoFactor'][key]}"

# --- onboarding ---
new_fr['onboarding'] = {}
fr_onb = fr['onboarding']
# EN flat keys -> FR translations
new_fr['onboarding']['welcomeTitle'] = fr_onb.get('welcome', {}).get('title', 'Bienvenue sur Transcendence')
new_fr['onboarding']['welcomeSubtitle'] = fr_onb.get('welcome', {}).get('subtitle', 'La blockchain expliquée à travers des missions courtes. Pas de jargon inutile, pas de capital requis.')
new_fr['onboarding']['step1Title'] = fr_onb.get('howItWorks', {}).get('step1Title', 'Des missions courtes')
new_fr['onboarding']['step1Body'] = fr_onb.get('howItWorks', {}).get('step1Body', 'Chaque mission dure 3 à 5 minutes. Avancez à votre rythme.')
new_fr['onboarding']['step2Title'] = fr_onb.get('howItWorks', {}).get('step2Title', 'Gagnez des Jetons de Connaissance')
new_fr['onboarding']['step2Body'] = fr_onb.get('howItWorks', {}).get('step2Body', 'Chaque mission réussie vous rapporte des KT. Votre solde reflète votre progression.')
new_fr['onboarding']['step3Title'] = fr_onb.get('howItWorks', {}).get('step3Title', 'Montez dans le classement')
new_fr['onboarding']['step3Body'] = fr_onb.get('howItWorks', {}).get('step3Body', 'Comparez votre progression avec d\'autres apprenants. La régularité prime sur la vitesse.')
new_fr['onboarding']['ctaStart'] = fr_onb.get('welcome', {}).get('ctaLabel', "C'est parti")
new_fr['onboarding']['firstMissionPrompt'] = fr_onb.get('allSet', {}).get('body', 'Votre premier chapitre vous attend. Chaque concept que vous maîtrisez s\'ajoute à votre base — et les bases, ça compte.')
new_fr['onboarding']['chooseGoal'] = {
    "title": fr_onb.get('chooseGoal', {}).get('title', 'Quel est votre objectif ?'),
    "subtitle": fr_onb.get('chooseGoal', {}).get('subtitle', 'Cela ne change pas le contenu — juste le contexte.'),
    "option1": fr_onb.get('chooseGoal', {}).get('option1', 'Comprendre ce dont tout le monde parle'),
    "option2": fr_onb.get('chooseGoal', {}).get('option2', 'Évaluer un investissement potentiel'),
    "option3": fr_onb.get('chooseGoal', {}).get('option3', 'Comprendre la technologie en profondeur'),
    "option4": fr_onb.get('chooseGoal', {}).get('option4', 'Juste curieux'),
    "ctaLabel": fr_onb.get('chooseGoal', {}).get('ctaLabel', 'Continuer'),
}
new_fr['onboarding']['disclaimerIntro'] = {
    "title": fr_onb.get('disclaimerIntro', {}).get('title', 'Une précision importante'),
    "body": fr_onb.get('disclaimerIntro', {}).get('body', "Transcendence est une plateforme éducative. Rien ici ne constitue un conseil financier. Nous traitons des sujets liés à la finance numérique — avec honnêteté, sans promesse de rendement."),
    "ctaLabel": fr_onb.get('disclaimerIntro', {}).get('ctaLabel', 'Compris, on commence'),
}
new_fr['onboarding']['allSet'] = {
    "title": fr_onb.get('allSet', {}).get('title', 'Tout est prêt.'),
    "body": fr_onb.get('allSet', {}).get('body', "Votre premier chapitre vous attend. Chaque concept que vous maîtrisez s'ajoute à votre base — et les bases, ça compte."),
    "ctaLabel": fr_onb.get('allSet', {}).get('ctaLabel', 'Commencer ma première mission'),
}

# --- exercise ---
new_fr['exercise'] = {}
fr_ex = fr['exercise']
# SI, CM, IP, ST sub-objects matching EN structure
# EN has: SI.instructionPrefix, SI.submitAnswer, SI.seeExplanation, SI.nextMission
new_fr['exercise']['SI'] = {
    "instructionPrefix": fr_ex.get('instructions', {}).get('SI', 'Lisez le scénario, puis répondez à la question.'),
    "submitAnswer": "Valider la réponse",
    "seeExplanation": "Voir l'explication",
    "nextMission": "Mission suivante",
}
new_fr['exercise']['CM'] = {
    "instructionPrefix": fr_ex.get('instructions', {}).get('CM', 'Associez chaque concept à sa définition.'),
    "matchAll": "Associez toutes les paires pour continuer.",
    "checkMatches": "Vérifier les associations",
    "allMatched": "Tout est associé !",
}
new_fr['exercise']['IP'] = {
    "instructionPrefix": fr_ex.get('instructions', {}).get('IP', 'Placez les éléments dans le bon ordre ou au bon endroit.'),
    "dragItems": "Glissez les éléments à leur place.",
    "checkPlacement": "Vérifier le placement",
    "allPlaced": "Tout est placé !",
}
new_fr['exercise']['ST'] = {
    "instructionPrefix": fr_ex.get('instructions', {}).get('ST', 'Suivez les étapes pour compléter la simulation.'),
    "step": "Étape {current} sur {total}",
    "chooseAnswer": "Choisissez une réponse pour continuer.",
    "nextStep": "Étape suivante",
    "lastStep": "Terminer la simulation",
}

# feedback - matching EN structure (named keys, not arrays)
fr_fb = fr_ex.get('feedback', {})
fr_correct_list = fr_fb.get('correct', [])
fr_incorrect_list = fr_fb.get('incorrect', [])
new_fr['exercise']['feedback'] = {
    "correctHeadline1": fr_correct_list[0] if len(fr_correct_list) > 0 else "Correct.",
    "correctHeadline2": fr_correct_list[1] if len(fr_correct_list) > 1 else "Bravo.",
    "correctHeadline3": fr_correct_list[2] if len(fr_correct_list) > 2 else "C'est ça !",
    "incorrectHeadline1": fr_incorrect_list[0] if len(fr_incorrect_list) > 0 else "Pas tout à fait.",
    "incorrectHeadline2": fr_incorrect_list[1] if len(fr_incorrect_list) > 1 else "Presque.",
    "incorrectHeadline3": fr_incorrect_list[2] if len(fr_incorrect_list) > 2 else "Pas cette fois.",
    "explanationLabel": fr_fb.get('correctExplanationLabel', 'Explication'),
    "keepGoing": "Continuez — vous assurez.",
    "almostThere": "Presque.",
    "niceWork": "Bien joué.",
}

# Gas fee strings - EN has flat strings, not nested object
fr_gas = fr_ex.get('gasFeeNotice', {})
new_fr['exercise']['gasFeeNotice'] = "Cette action coûte {amount} Jetons de Connaissance"
new_fr['exercise']['gasFeeFirstTime'] = fr_gas.get('firstTime', "Chaque tentative coûte 2 KT. C'est le gas — le même mécanisme que vous venez d'étudier. Votre solde a été mis à jour.") if isinstance(fr_gas, dict) else "Chaque tentative coûte 2 KT. C'est le gas — le même mécanisme que vous venez d'étudier. Votre solde a été mis à jour."
new_fr['exercise']['gasFeeStandard'] = fr_gas.get('standard', '−2 KT gas') if isinstance(fr_gas, dict) else '−2 KT gas'
new_fr['exercise']['gasFeeLowBalance'] = fr_gas.get('lowBalance', '−2 KT gas · Votre solde est faible. Terminez une mission pour le recharger.') if isinstance(fr_gas, dict) else '−2 KT gas · Votre solde est faible. Terminez une mission pour le recharger.'
new_fr['exercise']['gasFeeZeroBalance'] = fr_gas.get('zeroBalance', "−2 KT gas · Votre solde est à 0. Vous pouvez terminer cette mission, mais vous devrez le faire avant d'en commencer une nouvelle.") if isinstance(fr_gas, dict) else "−2 KT gas · Votre solde est à 0."
new_fr['exercise']['gasFeeNegativeBalance'] = fr_gas.get('negativeBalance', '−2 KT gas · Votre solde est négatif. Terminez cette mission pour gagner des jetons et effacer votre dette avant de continuer.') if isinstance(fr_gas, dict) else '−2 KT gas · Votre solde est négatif.'

# Progress
fr_progress = fr_ex.get('progress', {})
new_fr['exercise']['progress'] = {
    "questionOf": fr_progress.get('questionOf', 'Question {current} sur {total}'),
    "missionProgress": fr_progress.get('missionProgress', 'Mission {current} sur {total}'),
}

# --- gamification ---
new_fr['gamification'] = {}

# achievements
new_fr['gamification']['achievements'] = {}
fr_ach = fr['gamification']['achievements']
for ach_key in new_en['gamification']['achievements']:
    fr_a = fr_ach.get(ach_key, {})
    new_fr['gamification']['achievements'][ach_key] = {
        "title": fr_a.get('title', f"[FR] {new_en['gamification']['achievements'][ach_key]['title']}"),
        "description": fr_a.get('description', f"[FR] {new_en['gamification']['achievements'][ach_key]['description']}"),
        "toastTitle": fr_a.get('toastTitle', f"[FR] {new_en['gamification']['achievements'][ach_key]['toastTitle']}"),
        "toastBody": fr_a.get('toastBody', f"[FR] {new_en['gamification']['achievements'][ach_key]['toastBody']}"),
    }

# streak
fr_streak = fr['gamification']['streak']
new_fr['gamification']['streak'] = {}
for key in new_en['gamification']['streak']:
    if key in fr_streak:
        new_fr['gamification']['streak'][key] = fr_streak[key]
    elif key == 'streakContinued':
        new_fr['gamification']['streak'][key] = fr_streak.get('streakContinued', "Aujourd'hui compte. Revenez demain.")
    elif key == 'streakBroken':
        new_fr['gamification']['streak'][key] = fr_streak.get('streakBroken', "Vous avez manqué un jour. Ça arrive.")
    elif key == 'day1':
        new_fr['gamification']['streak'][key] = "Aujourd'hui compte. Revenez demain."
    elif key == 'streakLost':
        new_fr['gamification']['streak'][key] = fr_streak.get('streakBroken', "Vous avez manqué un jour. Ça arrive. Votre progression est exactement là où vous l'avez laissée — recommencez dès aujourd'hui.")
    else:
        new_fr['gamification']['streak'][key] = fr_streak.get(key, f"[FR] {new_en['gamification']['streak'][key]}")

# tokens
fr_tokens = fr['gamification']['tokens']
new_fr['gamification']['tokens'] = {}
for key in new_en['gamification']['tokens']:
    if key in fr_tokens:
        new_fr['gamification']['tokens'][key] = fr_tokens[key]
    else:
        new_fr['gamification']['tokens'][key] = f"[FR] {new_en['gamification']['tokens'][key]}"

# leaderboard
fr_lb = fr['gamification']['leaderboard']
new_fr['gamification']['leaderboard'] = {}
for key in new_en['gamification']['leaderboard']:
    if key in fr_lb:
        new_fr['gamification']['leaderboard'][key] = fr_lb[key]
    else:
        new_fr['gamification']['leaderboard'][key] = f"[FR] {new_en['gamification']['leaderboard'][key]}"

# welcomeBack - EN uses shortAbsence/oneWeekAbsence/etc, FR uses variant1..5
fr_wb = fr['gamification']['welcomeBack']
new_fr['gamification']['welcomeBack'] = {
    "shortAbsence": fr_wb.get('variant1', "Ravi de vous retrouver. Votre progression est exactement là où vous l'avez laissée."),
    "oneWeekAbsence": fr_wb.get('variant2', "Ça fait une semaine. Pas de souci — votre savoir n'expire pas."),
    "twoWeekAbsence": fr_wb.get('variant3', "Vous avez été absent un moment. Tout est encore là."),
    "longAbsence": fr_wb.get('variant4', "Bienvenue. Ça fait un moment, mais ce que vous avez appris n'est pas parti."),
    "generic": fr_wb.get('variant5', "De retour. Votre progression est intacte. Continuez."),
}

# refresher - EN uses refresher, FR used conceptRefresher
fr_ref = fr['gamification'].get('conceptRefresher', {})
new_fr['gamification']['refresher'] = {
    "variant1": fr_ref.get('variant1', "Avant de commencer, voici un rappel rapide de ce sur quoi cette mission s'appuie."),
    "variant2": fr_ref.get('variant2', "Ça fait un moment que vous n'avez pas abordé ce sujet. Un récapitulatif rapide avant de plonger."),
    "variant3": fr_ref.get('variant3', "Cette mission fait référence à quelque chose vu plus tôt. Voici l'idée clé — trente secondes, et vous êtes prêt."),
}

# postMission - EN has named keys, FR had arrays
fr_pm = fr['gamification']['postMission']
fr_comp = fr_pm.get('completionMessages', [])
fr_chap = fr_pm.get('chapterCompleteMessages', [])
fr_cat = fr_pm.get('categoryCompleteMessages', [])
new_fr['gamification']['postMission'] = {
    "correct1": fr_comp[0] if len(fr_comp) > 0 else "Correct. Une pièce supplémentaire dans le tableau.",
    "correct2": fr_comp[1] if len(fr_comp) > 1 else "Bien joué. Ce concept est maintenant le vôtre.",
    "correct3": fr_comp[2] if len(fr_comp) > 2 else "Réussi. On passe à la suite.",
    "correct4": fr_comp[3] if len(fr_comp) > 3 else "C'est ça. Vous venez d'ajouter quelque chose qui se capitalise.",
    "chapterComplete1": fr_chap[0] if len(fr_chap) > 0 else "Chapitre terminé.",
    "chapterComplete2": fr_chap[1] if len(fr_chap) > 1 else "Voilà pour ce chapitre.",
    "chapterComplete3": fr_chap[2] if len(fr_chap) > 2 else "Chapitre terminé. Prenez un moment.",
    "categoryComplete1": fr_cat[0] if len(fr_cat) > 0 else "Catégorie terminée.",
    "categoryComplete2": fr_cat[1] if len(fr_cat) > 1 else "Vous avez terminé cette catégorie.",
}

# --- reveals ---
new_fr['reveals'] = {}
fr_rev = fr['reveals']
for reveal_key in new_en['reveals']:
    fr_r = fr_rev.get(reveal_key, {})
    new_fr['reveals'][reveal_key] = {}
    for sub_key in new_en['reveals'][reveal_key]:
        if sub_key in fr_r:
            new_fr['reveals'][reveal_key][sub_key] = fr_r[sub_key]
        else:
            new_fr['reveals'][reveal_key][sub_key] = f"[FR] {new_en['reveals'][reveal_key][sub_key]}"

# --- disclaimer ---
new_fr['disclaimer'] = {}
fr_disc = fr['disclaimer']
for key in new_en['disclaimer']:
    if key in fr_disc:
        new_fr['disclaimer'][key] = fr_disc[key]
    else:
        new_fr['disclaimer'][key] = f"[FR] {new_en['disclaimer'][key]}"

# --- certificate ---
new_fr['certificate'] = {}
fr_cert = fr['certificate']
# Map FR keys to EN key names
cert_mapping = {
    'headline': ('title', "Vous avez terminé Transcendence."),
    'subheadline': ('subtitle', "Six catégories. 69 missions. Tout est fait."),
    'completedOn': ('dateLabel', "Date d'obtention"),
    'shareTitle': None,  # FR doesn't have this exact key
    'shareBody': None,
    'downloadButton': ('downloadButton', 'Télécharger en PDF'),
    'shareButton': ('shareButton', 'Partager mon certificat'),
    'linkedInButton': ('linkedinButton', 'Ajouter à LinkedIn'),
    'title': ('title', "Certificat d'accomplissement"),
    'subtitle': ('subtitle', 'Délivré à'),
    'completionStatement': ('completionStatement', "a complété avec succès l'intégralité du programme Transcendence — 6 catégories, {chapterCount} chapitres, {missionCount} missions."),
    'dateLabel': ('dateLabel', "Date d'obtention"),
    'toastTitle': ('toastTitle', 'Certificat obtenu.'),
    'toastBody': ('toastBody', 'Votre preuve de complétion est prête à être partagée.'),
    'programName': ('programName', 'Transcendence — Littératie Blockchain'),
    'verificationLabel': ('verificationLabel', 'Vérification'),
}
for key in new_en['certificate']:
    if key in fr_cert:
        new_fr['certificate'][key] = fr_cert[key]
    elif key == 'headline':
        new_fr['certificate'][key] = "Vous avez terminé Transcendence."
    elif key == 'subheadline':
        new_fr['certificate'][key] = "Six catégories. 69 missions. Tout est fait."
    elif key == 'completedOn':
        new_fr['certificate'][key] = fr_cert.get('dateLabel', "Date d'obtention")
    elif key == 'shareTitle':
        new_fr['certificate'][key] = "Partagez votre accomplissement"
    elif key == 'shareBody':
        new_fr['certificate'][key] = "Je viens de terminer Transcendence — un cours complet de littératie blockchain. 69 missions, zéro raccourci."
    elif key == 'linkedInButton':
        new_fr['certificate'][key] = fr_cert.get('linkedinButton', 'Ajouter à LinkedIn')
    else:
        new_fr['certificate'][key] = fr_cert.get(key, f"[FR] {new_en['certificate'][key]}")

# --- social ---
new_fr['social'] = {}
# friendsList - FR used 'friends'
fr_friends = fr['social'].get('friends', {})
new_fr['social']['friendsList'] = {
    "title": fr_friends.get('title', 'Amis'),
    "addFriend": fr_friends.get('addFriend', 'Ajouter un ami'),
    "searchPlaceholder": fr_friends.get('searchPlaceholder', "Rechercher par nom d'utilisateur"),
    "noFriendsYet": fr_friends.get('noFriendsYet', "Vous n'avez pas encore d'amis sur Transcendence. Invitez quelqu'un et apprenez ensemble."),
    "pendingRequests": fr_friends.get('pendingRequests', 'Demandes en attente'),
    "acceptButton": fr_friends.get('acceptRequest', 'Accepter'),
    "declineButton": fr_friends.get('declineRequest', 'Refuser'),
    "removeButton": "Retirer",
    "friendsSince": fr_friends.get('friendsSince', 'Amis depuis {date}'),
    "removeFriend": fr_friends.get('removeFriend', 'Retirer de mes amis'),
    "blockUser": fr_friends.get('blockUser', 'Bloquer'),
    "requestSent": fr_friends.get('requestSent', 'Demande envoyée'),
    "friendCount": fr_friends.get('friendCount', '{count} ami'),
    "friendCount_plural": fr_friends.get('friendCount_plural', '{count} amis'),
}

# publicProfile - FR used 'profile'
fr_profile = fr['social'].get('profile', {})
new_fr['social']['publicProfile'] = {
    "missions": fr_profile.get('missionsCompleted', 'Missions complétées'),
    "tokens": fr_profile.get('tokenBalance', 'Solde KT'),
    "streak": fr_profile.get('currentStreak', 'Série en cours'),
    "achievements": fr_profile.get('achievementsUnlocked', 'Succès débloqués'),
    "joinedDate": fr_profile.get('joinedDate', 'Membre depuis {date}'),
    "friendSince": "Amis depuis",
    "editProfile": fr_profile.get('editProfile', 'Modifier le profil'),
    "longestStreak": fr_profile.get('longestStreak', 'Meilleure série'),
    "tokenBalance": fr_profile.get('tokenBalance', 'Solde KT'),
    "achievementsUnlocked": fr_profile.get('achievementsUnlocked', 'Succès débloqués'),
    "rank": fr_profile.get('rank', 'Rang'),
    "shareProfile": fr_profile.get('shareProfile', 'Partager mon profil'),
    "statsTitle": fr_profile.get('statsTitle', 'Mes statistiques'),
    "bioPlaceholder": fr_profile.get('bioPlaceholder', 'Dites quelque chose sur vous...'),
}

# --- notifications ---
new_fr['notifications'] = {}
fr_notif = fr['notifications']
# Flat keys from EN
for key in ['achievement_unlocked', 'streak_milestone', 'friend_request', 'friend_accepted',
            'mission_reminder', 'level_up', 'token_earned', 'gas_deducted', 'system_message']:
    types_val = fr_notif.get('types', {}).get(key, '')
    flat_val = fr_notif.get(key, '') if not isinstance(fr_notif.get(key), dict) else ''
    # Prefer flat if it exists (old FR had flat too), otherwise use types
    # Actually, old FR only had the flat structure for these, but new FR restructured.
    # The current FR file has both flat AND types.* - we see types.* in the file.
    # For our new structure matching EN, we use the flat keys
    new_fr['notifications'][key] = fr_notif.get('types', {}).get(key, new_en['notifications'][key])

# Add the new nested keys
new_fr['notifications']['title'] = fr_notif.get('title', 'Notifications')
new_fr['notifications']['markAllRead'] = fr_notif.get('markAllRead', 'Tout marquer comme lu')
new_fr['notifications']['noNotifications'] = fr_notif.get('noNotifications', 'Aucune notification pour le moment. Continuez à apprendre !')
new_fr['notifications']['types'] = {}
fr_types = fr_notif.get('types', {})
for key in new_en['notifications']['types']:
    new_fr['notifications']['types'][key] = fr_types.get(key, f"[FR] {new_en['notifications']['types'][key]}")
new_fr['notifications']['messages'] = {}
fr_msgs = fr_notif.get('messages', {})
for key in new_en['notifications']['messages']:
    new_fr['notifications']['messages'][key] = fr_msgs.get(key, f"[FR] {new_en['notifications']['messages'][key]}")

# --- errors ---
new_fr['errors'] = {}
fr_err = fr['errors']
for key in new_en['errors']:
    if key in fr_err:
        new_fr['errors'][key] = fr_err[key]
    else:
        new_fr['errors'][key] = f"[FR] {new_en['errors'][key]}"

# --- emptyStates ---
# EN has flat strings, FR has nested objects. Use EN structure.
new_fr['emptyStates'] = {}
fr_es_states = fr['emptyStates']
for key in new_en['emptyStates']:
    fr_val = fr_es_states.get(key, {})
    if isinstance(fr_val, str):
        new_fr['emptyStates'][key] = fr_val
    elif isinstance(fr_val, dict):
        # FR had nested {title, body, ctaLabel} - flatten to just the body
        new_fr['emptyStates'][key] = fr_val.get('body', f"[FR] {new_en['emptyStates'][key]}")
    else:
        new_fr['emptyStates'][key] = f"[FR] {new_en['emptyStates'][key]}"

# ============================================================
# VERIFY AND SAVE
# ============================================================

en_keys = get_keys(new_en)
fr_keys = get_keys(new_fr)
es_keys = get_keys(new_es)

print(f"EN keys: {len(en_keys)}")
print(f"FR keys: {len(fr_keys)}")
print(f"ES keys: {len(es_keys)}")

# Check mismatches
en_not_fr = en_keys - fr_keys
fr_not_en = fr_keys - en_keys
en_not_es = en_keys - es_keys
es_not_en = es_keys - en_keys

if en_not_fr:
    print(f"\nEN keys missing from FR ({len(en_not_fr)}):")
    for k in sorted(en_not_fr):
        print(f"  {k}")

if fr_not_en:
    print(f"\nFR keys missing from EN ({len(fr_not_en)}):")
    for k in sorted(fr_not_en):
        print(f"  {k}")

if en_not_es:
    print(f"\nEN keys missing from ES ({len(en_not_es)}):")
    for k in sorted(en_not_es):
        print(f"  {k}")

if es_not_en:
    print(f"\nES keys missing from EN ({len(es_not_en)}):")
    for k in sorted(es_not_en):
        print(f"  {k}")

if en_keys == fr_keys == es_keys:
    print("\nAll three files have identical key structures!")
else:
    print("\nMISMATCH DETECTED - fixing...")
    # Add any missing keys
    all_keys = en_keys | fr_keys | es_keys
    for key in sorted(all_keys):
        if key not in en_keys:
            val = get_nested(new_fr, key) or get_nested(new_es, key)
            set_nested(new_en, key, f"[EN] {val}" if val else "[EN] TODO")
        if key not in fr_keys:
            val = get_nested(new_en, key)
            set_nested(new_fr, key, f"[FR] {val}" if val else "[FR] TODO")
        if key not in es_keys:
            val = get_nested(new_en, key)
            set_nested(new_es, key, f"[ES] {val}" if val else "[ES] TODO")

    # Re-check
    en_keys = get_keys(new_en)
    fr_keys = get_keys(new_fr)
    es_keys = get_keys(new_es)
    print(f"\nAfter fix: EN={len(en_keys)}, FR={len(fr_keys)}, ES={len(es_keys)}")
    if en_keys == fr_keys == es_keys:
        print("All three files now have identical key structures!")

# Save
save('en', new_en)
save('fr', new_fr)
save('es', new_es)
print("\nFiles saved successfully.")

# Check for [FR], [EN], [ES] placeholders
for locale, data in [('en', new_en), ('fr', new_fr), ('es', new_es)]:
    keys = get_keys(data)
    placeholders = []
    for k in sorted(keys):
        val = get_nested(data, k)
        if isinstance(val, str) and val.startswith(f'[{locale.upper()}]'):
            placeholders.append(k)
    if placeholders:
        print(f"\n{locale.upper()} has {len(placeholders)} placeholder translations:")
        for p in placeholders:
            print(f"  {p}")
