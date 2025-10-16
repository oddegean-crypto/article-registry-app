from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from datetime import datetime
import os
from dotenv import load_dotenv
import csv
import io

load_dotenv()

app = FastAPI()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
client = AsyncIOMotorClient(MONGO_URL)
db = client.article_registry
articles_collection = db.articles

# Pydantic models
class Article(BaseModel):
    articleCode: str
    colorCode: Optional[str] = ""
    treatmentName: Optional[str] = ""
    articleName: Optional[str] = ""
    colorName: Optional[str] = ""
    supplier: Optional[str] = ""
    supplierCode: Optional[str] = ""
    section: Optional[str] = ""
    season: Optional[str] = ""
    suppArtCode: Optional[str] = ""
    composition: Optional[str] = ""
    weave: Optional[str] = ""
    stretch: Optional[str] = ""
    construction: Optional[str] = ""
    weightGSM: Optional[str] = ""
    widthCM: Optional[str] = ""
    dyeType: Optional[str] = ""
    careLabel: Optional[str] = ""
    barcodeQR: Optional[str] = ""
    basePriceEUR: Optional[str] = ""
    extraFields: Optional[Dict[str, Any]] = {}

class ArticleResponse(Article):
    id: str
    createdAt: datetime
    updatedAt: datetime

class BulkArticleRequest(BaseModel):
    articles: List[Article]
    mode: str = "append"  # append or replace

# Helper function to convert ObjectId to string
def article_helper(article) -> dict:
    return {
        "id": str(article["_id"]),
        "articleCode": article.get("articleCode", ""),
        "colorCode": article.get("colorCode", ""),
        "treatmentName": article.get("treatmentName", ""),
        "articleName": article.get("articleName", ""),
        "colorName": article.get("colorName", ""),
        "supplier": article.get("supplier", ""),
        "supplierCode": article.get("supplierCode", ""),
        "section": article.get("section", ""),
        "season": article.get("season", ""),
        "suppArtCode": article.get("suppArtCode", ""),
        "composition": article.get("composition", ""),
        "weave": article.get("weave", ""),
        "stretch": article.get("stretch", ""),
        "construction": article.get("construction", ""),
        "weightGSM": article.get("weightGSM", ""),
        "widthCM": article.get("widthCM", ""),
        "dyeType": article.get("dyeType", ""),
        "careLabel": article.get("careLabel", ""),
        "barcodeQR": article.get("barcodeQR", ""),
        "basePriceEUR": article.get("basePriceEUR", ""),
        "extraFields": article.get("extraFields", {}),
        "createdAt": article.get("createdAt"),
        "updatedAt": article.get("updatedAt"),
    }

@app.get("/api/")
async def root():
    return {"message": "Article Registry API", "version": "1.0.0"}

@app.get("/api/health")
async def health_check():
    try:
        await client.admin.command('ping')
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Database connection failed: {str(e)}")

# Get all articles
@app.get("/api/articles", response_model=List[ArticleResponse])
async def get_articles(search: Optional[str] = None, limit: int = 1000):
    try:
        query = {}
        if search:
            search_pattern = {"$regex": search, "$options": "i"}
            query = {
                "$or": [
                    {"articleCode": search_pattern},
                    {"articleName": search_pattern},
                    {"colorCode": search_pattern},
                    {"colorName": search_pattern},
                    {"treatmentName": search_pattern},
                    {"section": search_pattern},
                    {"season": search_pattern},
                ]
            }
        
        articles = await articles_collection.find(query).limit(limit).to_list(limit)
        return [article_helper(article) for article in articles]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Get single article by ID
@app.get("/api/articles/{article_id}", response_model=ArticleResponse)
async def get_article(article_id: str):
    try:
        if not ObjectId.is_valid(article_id):
            raise HTTPException(status_code=404, detail="Article not found")
            
        article = await articles_collection.find_one({"_id": ObjectId(article_id)})
        if not article:
            raise HTTPException(status_code=404, detail="Article not found")
        return article_helper(article)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Create single article
@app.post("/api/articles", response_model=ArticleResponse)
async def create_article(article: Article):
    try:
        article_dict = article.dict()
        article_dict["createdAt"] = datetime.utcnow()
        article_dict["updatedAt"] = datetime.utcnow()
        
        result = await articles_collection.insert_one(article_dict)
        new_article = await articles_collection.find_one({"_id": result.inserted_id})
        return article_helper(new_article)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Bulk import articles from CSV
@app.post("/api/articles/bulk")
async def bulk_import_articles(request: BulkArticleRequest):
    try:
        if request.mode == "replace":
            # Delete all existing articles
            await articles_collection.delete_many({})
        
        inserted_count = 0
        updated_count = 0
        
        for article_data in request.articles:
            article_dict = article_data.dict()
            
            # Check if article already exists (by articleCode, colorCode, treatmentName)
            existing = await articles_collection.find_one({
                "articleCode": article_dict["articleCode"],
                "colorCode": article_dict["colorCode"],
                "treatmentName": article_dict["treatmentName"]
            })
            
            if existing:
                # Update existing article
                article_dict["updatedAt"] = datetime.utcnow()
                article_dict["createdAt"] = existing.get("createdAt", datetime.utcnow())
                await articles_collection.update_one(
                    {"_id": existing["_id"]},
                    {"$set": article_dict}
                )
                updated_count += 1
            else:
                # Insert new article
                article_dict["createdAt"] = datetime.utcnow()
                article_dict["updatedAt"] = datetime.utcnow()
                await articles_collection.insert_one(article_dict)
                inserted_count += 1
        
        return {
            "success": True,
            "inserted": inserted_count,
            "updated": updated_count,
            "total": len(request.articles)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Update article
@app.put("/api/articles/{article_id}", response_model=ArticleResponse)
async def update_article(article_id: str, article: Article):
    try:
        article_dict = article.dict()
        article_dict["updatedAt"] = datetime.utcnow()
        
        result = await articles_collection.update_one(
            {"_id": ObjectId(article_id)},
            {"$set": article_dict}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Article not found")
        
        updated_article = await articles_collection.find_one({"_id": ObjectId(article_id)})
        return article_helper(updated_article)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Delete article
@app.delete("/api/articles/{article_id}")
async def delete_article(article_id: str):
    try:
        result = await articles_collection.delete_one({"_id": ObjectId(article_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Article not found")
        return {"success": True, "message": "Article deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Delete all articles
@app.delete("/api/articles")
async def delete_all_articles():
    try:
        result = await articles_collection.delete_many({})
        return {"success": True, "deleted": result.deleted_count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
