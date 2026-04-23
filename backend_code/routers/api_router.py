from __future__ import annotations

import os
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
from openai import OpenAI

from models.schemas import (
    AppInfoResponse,
    ChatRequest,
    ChatResponse,
    HealthResponse,
)

router = APIRouter(tags=["api"])


def _build_system_prompt(profile: dict | None) -> str:
    profile_bits = []
    if profile:
        name = profile.get("name")
        birth_date = profile.get("birthDate")
        birth_time = profile.get("birthTime")
        birth_place = profile.get("birthPlace")
        intent = profile.get("intent")

        if name:
            profile_bits.append(f"Prénom: {name}")
        if birth_date:
            profile_bits.append(f"Date de naissance: {birth_date}")
        if birth_time:
            profile_bits.append(f"Heure de naissance: {birth_time}")
        if birth_place:
            profile_bits.append(f"Lieu de naissance: {birth_place}")
        if intent:
            profile_bits.append(f"Intention actuelle: {intent}")

    profile_text = "\n".join(profile_bits) if profile_bits else "Aucun profil fourni."

    return f"""
Tu es Sélénia Nocturne.

Tu réponds toujours en français.
Tu tutoies toujours.
Tu réponds tout de suite à la question.
Tu vas droit au but.
Tu ne fais jamais d’introduction polie.
Tu ne fais jamais de conclusion vide.
Tu ne fais jamais de résumé scolaire.
Tu ne parles jamais comme une coach, une psy, une prof ou une IA serviable.

INTERDIT :
- “Bien sûr”
- “Examinons”
- “Voici”
- “Il pourrait”
- “Tu pourrais”
- “Il est possible que”
- “n’hésite pas”
- “si tu ressens le besoin”
- toute réponse en 3 parties génériques
- toute réponse passe-partout applicable à n’importe qui

STYLE OBLIGATOIRE :
- humain
- direct
- incarné
- précis
- fluide
- simple
- jamais gnangnan
- jamais scolaire
- jamais générique
- jamais théâtral

Quand la personne demande une énergie, une guidance, une lecture ou un ressenti :
- tu réponds comme si tu captais SA vibe à elle
- tu donnes du vrai contenu tout de suite
- tu relies les choses ensemble naturellement
- tu évites les généralités molles
- tu évites les mots trop abstraits
- tu parles concret
- tu peux être intense, mais pas poétique pour rien
- tu écris comme une vraie personne qui voit clair, pas comme un article de blog

LONGUEUR :
- réponse courte à moyenne
- jamais remplissage
- jamais de sections numérotées automatiques sauf si demandé

PROFIL UTILISATEUR :
{profile_text}
""".strip()




@router.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    return HealthResponse(status="ok", timestamp=datetime.now(timezone.utc))


@router.get("/info", response_model=AppInfoResponse)
async def app_info() -> AppInfoResponse:
    return AppInfoResponse(
        name="Sélénia Nocturne",
        version="1.2.0",
        description="Plateforme de guidance psychique combinant Oracle, Astrologie et Numérologie.",
        features=[
            "Oracle",
            "Astrologie",
            "Numérologie",
            "Guidance personnalisée",
            "Chat IA via backend sécurisé",
        ],
    )


@router.post("/chat", response_model=ChatResponse)
async def chat(payload: ChatRequest) -> ChatResponse:
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    if not api_key:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY manquante sur le backend.")

    model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

    try:
        client = OpenAI(api_key=api_key)

        messages = [{"role": "system", "content": _build_system_prompt(payload.profile)}]

        for item in payload.history[-10:]:
            role = "assistant" if item.role == "assistant" else "user"
            messages.append({"role": role, "content": item.text})

        messages.append({"role": "user", "content": payload.message})

        response = client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=0.85,
            max_tokens=300,
            
        )

        reply = (response.choices[0].message.content or "").strip()

        if not reply:
            reply = "Je capte quelque chose, mais la réponse sort mal. Reviens avec la même question."

        return ChatResponse(reply=reply)

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Erreur chat: {str(exc)}")
