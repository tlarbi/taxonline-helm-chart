import aioboto3
from app.core.config import settings


class S3Service:
    def __init__(self):
        self.session = aioboto3.Session()
        self.bucket = settings.S3_BUCKET

    def _client(self):
        return self.session.client(
            "s3",
            endpoint_url=settings.S3_ENDPOINT,
            aws_access_key_id=settings.S3_ACCESS_KEY,
            aws_secret_access_key=settings.S3_SECRET_KEY,
            region_name=settings.S3_REGION,
            use_ssl=settings.S3_USE_SSL,
        )

    async def upload(self, key: str, data: bytes, content_type: str = "application/octet-stream"):
        async with self._client() as s3:
            await s3.put_object(Bucket=self.bucket, Key=key, Body=data, ContentType=content_type)

    async def download(self, key: str) -> bytes:
        async with self._client() as s3:
            response = await s3.get_object(Bucket=self.bucket, Key=key)
            return await response["Body"].read()

    async def delete(self, key: str):
        async with self._client() as s3:
            await s3.delete_object(Bucket=self.bucket, Key=key)

    async def get_presigned_url(self, key: str, expires: int = 3600) -> str:
        async with self._client() as s3:
            return await s3.generate_presigned_url(
                "get_object",
                Params={"Bucket": self.bucket, "Key": key},
                ExpiresIn=expires,
            )


s3_service = S3Service()
