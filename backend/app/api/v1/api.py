"""API v1 router - aggregates all endpoint routers."""
from fastapi import APIRouter

from app.api.v1.endpoints import auth, categories, brands, operating_systems, tags, files, dashboard

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth.router, tags=["auth"])
api_router.include_router(categories.router, tags=["categories"])
api_router.include_router(brands.router, tags=["brands"])
api_router.include_router(operating_systems.router, tags=["operating-systems"])
api_router.include_router(tags.router, tags=["tags"])
api_router.include_router(files.router, tags=["files"])
api_router.include_router(dashboard.router, tags=["dashboard"])
