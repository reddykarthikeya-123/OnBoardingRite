from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.routers import dashboard, projects, checklists, requisitions, eligibility

app = FastAPI(
    title=settings.APP_NAME,
    debug=settings.DEBUG
)

# CORS (Allow Frontend)
origins = [
    "http://localhost:5173", # Vite Dev Server
    "http://localhost:5174", # Vite alternate port
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": f"Welcome to {settings.APP_NAME} Backend"}

app.include_router(dashboard.router, prefix="/api/v1/dashboard", tags=["dashboard"])
app.include_router(projects.router, prefix="/api/v1/projects", tags=["projects"])
app.include_router(checklists.router, prefix="/api/v1/projects", tags=["checklists"])
app.include_router(requisitions.router, prefix="/api/v1/projects", tags=["requisitions"])
app.include_router(eligibility.router, prefix="/api/v1/eligibility-rules", tags=["eligibility"])

