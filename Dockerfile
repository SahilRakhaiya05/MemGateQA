FROM node:20-slim AS frontend-build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM python:3.12-slim
WORKDIR /app
COPY server/requirements.txt server/requirements.txt
RUN pip install --no-cache-dir -r server/requirements.txt
COPY server/ server/
COPY data/ data/
COPY --from=frontend-build /app/dist dist/
ENV MEMGATEQA_MOCK=true
ENV VITE_MEMGATEQA_MOCK=true
EXPOSE 8788
CMD ["python", "server/cognee_bridge.py"]