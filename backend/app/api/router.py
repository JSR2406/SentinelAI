from fastapi import APIRouter
from app.api.repos import router as repos_router
from app.api.scans import router as scans_router
from app.api.attack_graph import router as attack_graph_router
from app.api.ai import router as ai_router
from app.api.reports import router as reports_router
from app.api.notifications import router as notifications_router
from app.api.github import router as github_router

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(repos_router)
api_router.include_router(scans_router)
api_router.include_router(attack_graph_router)
api_router.include_router(ai_router)
api_router.include_router(reports_router)
api_router.include_router(notifications_router)

# Include github auth router directly at root or under /api/v1
root_router = APIRouter()
root_router.include_router(api_router)
root_router.include_router(github_router)
