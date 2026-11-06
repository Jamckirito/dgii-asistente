import time
from collections import defaultdict
from fastapi import HTTPException, status


class UserRateLimiter:
    """
    Rate limiter en memoria por usuario (sliding window).
    Por defecto: máximo 20 peticiones por minuto por usuario.
    """

    def __init__(self, max_requests: int = 20, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.user_requests: dict[str, list[float]] = defaultdict(list)

    def check(self, user_id: str) -> None:
        now = time.time()
        timestamps = self.user_requests[user_id]

        # Limpiar marcas de tiempo fuera de la ventana
        cutoff = now - self.window_seconds
        self.user_requests[user_id] = [t for t in timestamps if t > cutoff]

        if len(self.user_requests[user_id]) >= self.max_requests:
            retry_after = int(self.window_seconds - (now - self.user_requests[user_id][0]))
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Has excedido el límite de {self.max_requests} extracciones por minuto. Inténtalo de nuevo en {retry_after} segundos.",
                headers={"Retry-After": str(max(1, retry_after))},
            )

        self.user_requests[user_id].append(now)


# Instancia global del rate limiter para el backend
extraction_rate_limiter = UserRateLimiter(max_requests=20, window_seconds=60)
