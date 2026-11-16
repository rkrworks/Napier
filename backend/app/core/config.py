from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    PROJECT_NAME: str = "NAPIER AI Engine"
    PORT: int = 8000
    SUPABASE_URL: str | None = None
    SUPABASE_KEY: str | None = None
    SERPAPI_KEY: str | None = None
    SERPAPI_GL: str = "in"
    REDIS_URL: str | None = None
    CACHE_TTL_SECONDS: int = 2700  # 45 min; clamped to 30-60 min
    ALLOWED_ORIGINS: str = (
        "http://localhost:3000,"
        "http://127.0.0.1:3000,"
        "https://napier-frontend-phi.vercel.app,"
        "https://rkrworks.github.io"
    )

    @field_validator("CACHE_TTL_SECONDS")
    @classmethod
    def _clamp_ttl(cls, v: int) -> int:
        return max(1800, min(3600, v))

    @property
    def origins(self) -> list[str]:
        raw = self.ALLOWED_ORIGINS.strip()
        if raw == "*":
            return ["*"]
        base_defaults = [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "https://napier-frontend-phi.vercel.app",
            "https://rkrworks.github.io",
        ]
        parsed = [o.strip().rstrip("/") for o in raw.split(",") if o.strip()]
        for default_origin in base_defaults:
            if default_origin not in parsed:
                parsed.append(default_origin)
        return parsed


settings = Settings()
