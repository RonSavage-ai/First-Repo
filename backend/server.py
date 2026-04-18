from fastapi import FastAPI, APIRouter, HTTPException, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import httpx

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# SerpAPI key for Google Shopping
SERPAPI_KEY = os.environ.get('SERPAPI_KEY', '')

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

class ProductResult(BaseModel):
    id: str
    title: str
    price: Optional[str] = None
    extracted_price: Optional[float] = None
    source: Optional[str] = None
    link: Optional[str] = None
    thumbnail: Optional[str] = None
    rating: Optional[float] = None
    reviews: Optional[int] = None
    delivery: Optional[str] = None
    immersive_token: Optional[str] = None  # Token to fetch direct store link

class SearchResponse(BaseModel):
    products: List[ProductResult]
    query: str
    total_results: int

class SearchHistory(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    query: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    results_count: int


# Routes
@api_router.get("/")
async def root():
    return {"message": "Thread Mart API - Clothing Marketplace"}

@api_router.get("/search", response_model=SearchResponse)
async def search_products(
    q: str = Query(..., min_length=1, description="Search query for clothing"),
    num: int = Query(20, ge=1, le=100, description="Number of results")
):
    """Search for clothing products using Google Shopping via SerpAPI"""
    
    if not SERPAPI_KEY:
        raise HTTPException(status_code=500, detail="SerpAPI key not configured")
    
    try:
        async with httpx.AsyncClient() as http_client:
            # Append "clothing" to ensure results are clothing-related
            clothing_query = f"{q} clothing apparel"
            params = {
                "engine": "google_shopping",
                "q": clothing_query,
                "api_key": SERPAPI_KEY,
                "num": num,
                "gl": "us",
                "hl": "en",
                "tbs": "cat:166"  # Category filter for Apparel & Accessories
            }
            
            response = await http_client.get(
                "https://serpapi.com/search",
                params=params,
                timeout=30.0
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail="Search API error")
            
            data = response.json()
            
            shopping_results = data.get("shopping_results", [])
            
            products = []
            for idx, item in enumerate(shopping_results):
                # Store the immersive token for fetching direct links later
                immersive_token = item.get("immersive_product_page_token", "")
                
                product = ProductResult(
                    id=str(idx),
                    title=item.get("title", ""),
                    price=item.get("price", ""),
                    extracted_price=item.get("extracted_price"),
                    source=item.get("source", ""),
                    link="",  # Will be fetched via /product-link endpoint
                    thumbnail=item.get("thumbnail", ""),
                    rating=item.get("rating"),
                    reviews=item.get("reviews"),
                    delivery=item.get("delivery", ""),
                    immersive_token=immersive_token
                )
                products.append(product)
            
            # Save search to history
            search_record = SearchHistory(
                query=q,
                results_count=len(products)
            )
            doc = search_record.model_dump()
            doc['timestamp'] = doc['timestamp'].isoformat()
            await db.search_history.insert_one(doc)
            
            return SearchResponse(
                products=products,
                query=q,
                total_results=len(products)
            )
            
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Search request timed out")
    except Exception as e:
        logger.error(f"Search error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/trending")
async def get_trending_searches():
    """Get trending/popular search terms for clothing"""
    trending = [
        "vintage denim jacket",
        "oversized hoodie",
        "cargo pants streetwear",
        "minimalist white sneakers",
        "leather crossbody bag",
        "linen summer dress",
        "graphic tee y2k",
        "wide leg trousers"
    ]
    return {"trending": trending}

@api_router.get("/product-link")
async def get_product_link(token: str = Query(..., description="Immersive product page token")):
    """Get the direct store link for a product using its immersive token"""
    
    if not SERPAPI_KEY:
        raise HTTPException(status_code=500, detail="SerpAPI key not configured")
    
    if not token:
        raise HTTPException(status_code=400, detail="Token is required")
    
    try:
        async with httpx.AsyncClient() as http_client:
            params = {
                "engine": "google_immersive_product",
                "page_token": token,
                "api_key": SERPAPI_KEY
            }
            
            response = await http_client.get(
                "https://serpapi.com/search",
                params=params,
                timeout=30.0
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail="Failed to fetch product details")
            
            data = response.json()
            
            # Get stores from product_results
            if "product_results" in data and "stores" in data["product_results"]:
                stores = data["product_results"]["stores"]
                if stores and len(stores) > 0:
                    # Return the first store's direct link
                    first_store = stores[0]
                    return {
                        "link": first_store.get("link", ""),
                        "store": first_store.get("name", ""),
                        "price": first_store.get("price", "")
                    }
            
            raise HTTPException(status_code=404, detail="No direct link found for this product")
            
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Request timed out")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Product link error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/search-history", response_model=List[SearchHistory])
async def get_search_history(limit: int = Query(10, ge=1, le=50)):
    """Get recent search history"""
    history = await db.search_history.find(
        {}, 
        {"_id": 0}
    ).sort("timestamp", -1).limit(limit).to_list(limit)
    
    for item in history:
        if isinstance(item['timestamp'], str):
            item['timestamp'] = datetime.fromisoformat(item['timestamp'])
    
    return history

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return status_checks

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
