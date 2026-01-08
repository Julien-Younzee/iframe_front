# ############################################## Import des modules ##############################################

import numpy as np
import os
from PIL import Image
from pydantic import BaseModel, Field
from typing import Optional, Literal
from google import genai
from google.genai import types
from fastapi import FastAPI, HTTPException
import uvicorn
import tempfile
import io
import base64


# ######################################### Configuration FastAPI ##############################################

app = FastAPI(title="VTO Iframe API", version="1.0.0")

# CONFIG
GENAI_API_KEY = os.getenv("GENAI_API_KEY")
GEMINI_MODEL = "gemini-3-pro-image-preview"


# ######################################### Modèles Pydantic ##############################################

class VTORequestWithAvatar(BaseModel):
    """Requête pour utilisateur avec compte (avatar existant)"""
    avatar_base64: str = Field(..., description="Avatar existant en base64")
    vetement_base64: str = Field(..., description="Vêtement à essayer en base64")


class VTORequestWithSelfie(BaseModel):
    """Requête pour utilisateur sans compte (génération d'avatar)"""
    selfie_base64: str = Field(..., description="Selfie de l'utilisateur en base64")
    vetement_base64: str = Field(..., description="Vêtement à essayer en base64")
    sexe: Literal["homme", "femme"] = Field(..., description="Sexe de l'utilisateur")
    taille_cm: int = Field(..., ge=100, le=250, description="Taille en cm")
    poids_kg: int = Field(..., ge=30, le=300, description="Poids en kg")
    taille_haut: str = Field(..., description="Taille de haut (XS, S, M, L, XL, XXL)")
    taille_bas: str = Field(..., description="Taille de bas (XS, S, M, L, XL, XXL)")


class VTOResponse(BaseModel):
    """Réponse contenant l'image générée"""
    success: bool
    image_base64: str = Field(..., description="Image générée en base64 (avec préfixe data:image/png;base64,)")
    message: Optional[str] = None


# ######################################### Fonctions utilitaires ##############################################

def clean_base64(base64_data: str) -> str:
    """Nettoie les données base64 en retirant le préfixe data:image si présent"""
    if base64_data.startswith('data:image'):
        return base64_data.split(',')[1]
    return base64_data


def create_temp_png_from_base64(base64_data: str, prefix: str = "temp_") -> tuple[str, tuple]:
    """Crée un fichier PNG temporaire à partir de données base64"""
    try:
        # Nettoyer les données base64
        clean_data = clean_base64(base64_data)
        
        # Décoder l'image base64
        image_bytes = base64.b64decode(clean_data)
        
        # Convertir en PIL
        input_image_pil = Image.open(io.BytesIO(image_bytes))
        
        # Convertir en RGB si nécessaire
        if input_image_pil.mode != 'RGB':
            input_image_pil = input_image_pil.convert('RGB')
        
        # Créer un fichier temporaire PNG
        temp_file = tempfile.NamedTemporaryFile(suffix='.png', prefix=prefix, delete=False)
        input_image_pil.save(temp_file, format='PNG')
        temp_file.close()
        
        print(f"Fichier PNG temporaire créé: {temp_file.name}")
        return temp_file.name, input_image_pil.size
        
    except Exception as e:
        raise ValueError(f"Erreur lors de la création du fichier temporaire: {e}")


def generate_avatar_from_selfie(selfie_base64: str, sexe: str, taille_cm: int, 
                                poids_kg: int, taille_haut: str, taille_bas: str, IMC: int) -> np.ndarray:
    """Génère un avatar full-body à partir d'un selfie et des mensurations"""
    if not GENAI_API_KEY:
        raise ValueError("Clé API Gemini manquante")
    
    client = genai.Client(api_key=GENAI_API_KEY)
    
    # Construction du prompt pour générer l'avatar
    prompt = f"""
Based on the selfie and the clothes I provide, generate an ultra-realistic human model with the following characteristics:

    Specifications:
        - Physical characteristics
            Gender: {sexe}
            Height: {taille_cm} cm
            Weight: {poids_kg} kg
            BMI: {IMC}
            Upper body size: {taille_haut}
            Lower body size: {taille_bas}

        - Posture
            Body straight, arms along the body, neutral pose
            Neutral facial expression
            Hair : same like the selfie
            No jewelry or accessories
            
        - Background and image quality
            Soft, even studio lighting
            High-definition photorealistic rendering
            Uniforme background with color #fffcf0, no graphic elements, no shadows, no decor, no text
            
        - Clothing
            Black t-shirt, White straight-cut pants, black leather shoes are the base clothing
            Add or replace the equivalent clothing with the one provide (no nudity)

The avatar should look like a professional model photo, maintaining the person's face identity while creating a proportionally accurate full-body representation.
"""
    
    temp_files = []
    
    try:
        # Créer le fichier temporaire pour le selfie
        selfie_data = clean_base64(selfie_base64)
        selfie_temp_path, _ = create_temp_png_from_base64(selfie_data, "selfie_")
        temp_files.append(selfie_temp_path)
        selfie_image = Image.open(selfie_temp_path)
        
        print("Génération de l'avatar via Gemini...")
        
        # Appel à l'API Gemini
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=[selfie_image, prompt],
            config=types.GenerateContentConfig(
                image_config=types.ImageConfig(
                    aspect_ratio="9:16",
                    image_size="2K",
                )
            )
        )
        
        # Récupérer l'image générée
        image_parts = [
            part.inline_data.data
            for part in response.candidates[0].content.parts
            if part.inline_data
        ]
        
        if image_parts:
            image_pil = Image.open(io.BytesIO(image_parts[0]))
            
            # Convertir en RGBA pour préserver la transparence
            if image_pil.mode != 'RGBA':
                image_pil = image_pil.convert('RGBA')
            
            img = np.array(image_pil)
            print(f"Avatar généré - Shape: {img.shape}, Mode: RGBA")
            return img
        else:
            raise ValueError("Aucune image générée par Gemini pour l'avatar")
            
    except Exception as e:
        print(f"Erreur API Gemini (avatar): {e}")
        raise ValueError(f"Erreur lors de la génération de l'avatar: {e}")
    
    finally:
        # Supprimer tous les fichiers temporaires
        for temp_file in temp_files:
            try:
                os.unlink(temp_file)
                print(f"Fichier temporaire supprimé: {temp_file}")
            except Exception as e:
                print(f"Erreur lors de la suppression du fichier temporaire {temp_file}: {e}")


def generate_vto_gemini(avatar_base64: str, vetement_base64: str) -> np.ndarray:
    """Génère le try-on virtuel via l'API Gemini"""
    if not GENAI_API_KEY:
        raise ValueError("Clé API Gemini manquante")
        
    client = genai.Client(api_key=GENAI_API_KEY)
    
    prompt = """
Based on the model I provide, replace the existing clothes with the clothing item provided, following these rules:

- Posture:
    Must remain the same and adapted to the clothing item
    
- Face:
    Must remain exactly the same
    Respect all hair details
    
- Clothing:
    Apply the provided clothing item to the model
    Adjust the size to fit the model properly
    Maintain the original style and cut of the clothing
    Ensure proper layering if applicable
    Keep any original clothes that don't conflict with the new item

- Background and image quality:
    Soft, even studio lighting
    High-definition photorealistic rendering
    Definition: Portrait 9:16 (1080x1920 pixels)
    Uniform background with color #fffcf0, no graphic elements, no shadows, no decor, no text
"""
    
    temp_files = []
    images_to_send = []
    
    try:
        # Créer le fichier temporaire pour l'avatar
        avatar_data = clean_base64(avatar_base64)
        model_temp_path, _ = create_temp_png_from_base64(avatar_data, "model_")
        temp_files.append(model_temp_path)
        model_image = Image.open(model_temp_path)
        images_to_send.append(model_image)
        
        # Ajouter le vêtement
        vetement_data = clean_base64(vetement_base64)
        clothing_temp_path, _ = create_temp_png_from_base64(vetement_data, "clothing_")
        temp_files.append(clothing_temp_path)
        clothing_image = Image.open(clothing_temp_path)
        images_to_send.append(clothing_image)
        
        print(f"Gemini - Nombre total d'images à envoyer: {len(images_to_send)}")
        images_to_send.append(prompt)
        
        # Appel à l'API Gemini
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=images_to_send,
            config=types.GenerateContentConfig(
                image_config=types.ImageConfig(
                    aspect_ratio="9:16",
                    image_size="2K",
                )
            )
        )
        
        # Récupérer l'image générée
        image_parts = [
            part.inline_data.data
            for part in response.candidates[0].content.parts
            if part.inline_data
        ]
        
        if image_parts:
            image_pil = Image.open(io.BytesIO(image_parts[0]))
            
            # Convertir en RGBA pour préserver la transparence
            if image_pil.mode != 'RGBA':
                image_pil = image_pil.convert('RGBA')
            
            img = np.array(image_pil)
            print(f"Gemini - Image générée - Shape: {img.shape}, Mode: RGBA")
            return img
        else:
            raise ValueError("Aucune image générée par Gemini")
            
    except Exception as e:
        print(f"Erreur API Gemini: {e}")
        raise ValueError(f"Erreur lors de l'appel à l'API Gemini: {e}")
    
    finally:
        # Supprimer tous les fichiers temporaires
        for temp_file in temp_files:
            try:
                os.unlink(temp_file)
                print(f"Fichier temporaire supprimé: {temp_file}")
            except Exception as e:
                print(f"Erreur lors de la suppression du fichier temporaire {temp_file}: {e}")


def numpy_to_base64(img: np.ndarray) -> str:
    """Convertit une image numpy en base64 avec préfixe data:image"""
    try:
        # Conversion en PIL
        if len(img.shape) == 3 and img.shape[2] == 4:
            img_pil = Image.fromarray(img.astype(np.uint8), mode='RGBA')
        elif len(img.shape) == 3 and img.shape[2] == 3:
            img_pil = Image.fromarray(img.astype(np.uint8), mode='RGB')
        else:
            img_pil = Image.fromarray(img.astype(np.uint8), mode='L')
        
        # Conversion en base64
        buffer = io.BytesIO()
        img_pil.save(buffer, format='PNG')
        img_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
        
        return f"data:image/png;base64,{img_base64}"
        
    except Exception as e:
        raise ValueError(f"Erreur lors de la conversion en base64: {e}")


# ######################################### Endpoints FastAPI ##############################################

@app.get("/")
async def root():
    return {
        "message": "VTO Iframe API is running",
        "version": "2.0.0",
        "endpoints": {
            "with_avatar": "/vto/with-avatar",
            "with_selfie": "/vto/with-selfie"
        }
    }


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "gemini_configured": bool(GENAI_API_KEY)
    }


@app.post("/vto/with-avatar", response_model=VTOResponse)
async def vto_with_avatar(request: VTORequestWithAvatar):
    """
    Endpoint pour utilisateurs avec compte (avatar existant).
    
    Args:
        request: Avatar existant + vêtement à essayer
        
    Returns:
        VTOResponse: Image générée en base64
    """
    try:
        print("=== Workflow: Utilisateur avec avatar ===")
        
        # Génération du VTO directement
        print("Génération du VTO...")
        generated_img = generate_vto_gemini(
            request.avatar_base64,
            request.vetement_base64
        )
        
        # Conversion en base64
        print("Conversion en base64...")
        image_base64 = numpy_to_base64(generated_img)
        
        print("✓ Génération réussie")
        
        return VTOResponse(
            success=True,
            image_base64=image_base64,
            message="VTO généré avec succès"
        )
        
    except Exception as e:
        print(f"Erreur dans vto_with_avatar: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur lors de la génération: {str(e)}")


@app.post("/vto/with-selfie", response_model=VTOResponse)
async def vto_with_selfie(request: VTORequestWithSelfie):
    """
    Endpoint pour utilisateurs sans compte (génération d'avatar puis VTO).
    
    Args:
        request: Selfie + mensurations + vêtement à essayer
        
    Returns:
        VTOResponse: Image générée en base64
    """
    try:
        print("=== Workflow: Utilisateur sans avatar ===")
        print(f"Mensurations: {request.sexe}, {request.taille_cm}cm, {request.poids_kg}kg")
        IMC = round(float(request.poids_kg)/((float(request.taille_cm)/100) ** 2), 2)
        
        # Étape 1: Génération de l'avatar
        print("1. Génération de l'avatar à partir du selfie...")
        avatar_img = generate_avatar_from_selfie(
            request.selfie_base64,
            request.sexe,
            request.taille_cm,
            request.poids_kg,
            request.taille_haut,
            request.taille_bas,
            IMC
        )
        
        # Conversion de l'avatar en base64 pour l'étape suivante
        avatar_base64 = numpy_to_base64(avatar_img)
        
        # Étape 2: Génération du VTO avec l'avatar créé
        print("2. Génération du VTO avec le nouvel avatar...")
        generated_img = generate_vto_gemini(
            avatar_base64,
            request.vetement_base64
        )
        
        # Conversion finale en base64
        print("3. Conversion en base64...")
        image_base64 = numpy_to_base64(generated_img)
        
        print("✓ Génération réussie (avec création d'avatar)")
        
        return VTOResponse(
            success=True,
            image_base64=image_base64,
            message="Avatar créé et VTO généré avec succès"
        )
        
    except Exception as e:
        print(f"Erreur dans vto_with_selfie: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur lors de la génération: {str(e)}")


# ######################################### Lancement de l'application ##############################################

if __name__ == "__main__":
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000))
    )
