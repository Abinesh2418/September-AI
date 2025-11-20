import os
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import google.generativeai as genai
from dotenv import load_dotenv
from typing import List
import json

# 1. Setup
load_dotenv()
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Configure Gemini
api_key = os.getenv("GOOGLE_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

@app.post("/chat")
async def chat_endpoint(
    message: str = Form(...), 
    history: str = Form("[]"), # JSON string of past messages
    file: UploadFile = File(None)
):
    try:
        model = genai.GenerativeModel("gemini-2.5-flash")
        chat_history = json.loads(history)
        
        # Build the conversation context
        # We feed previous Q&A as text to keep it stateless and fast
        context_prompt = "You are an expert IT Support Agent. Here is the conversation so far:\n"
        for msg in chat_history:
            role = "User" if msg['role'] == 'user' else "AI"
            context_prompt += f"{role}: {msg['content']}\n"
        
        context_prompt += f"\nUser's New Request: {message}\n"
        
        # Prepare content for Gemini
        generation_content = [context_prompt]
        
        # If an image is uploaded, add it to the request
        if file:
            content = await file.read()
            generation_content.append({
                "mime_type": file.content_type, 
                "data": content
            })
            generation_content.append("\nAnalyze this image specifically in the context of our conversation.")

        # Generate Response
        response = model.generate_content(generation_content)
        
        return {"reply": response.text}

    except Exception as e:
        print(f"❌ Error: {e}")
        return {"reply": f"Error: {str(e)}"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)