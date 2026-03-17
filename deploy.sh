#!/bin/bash
set -e

# ============================================
# Ornate Solar — EC2 Docker Deployment Script
# ============================================
# Usage:
#   ./deploy.sh <EC2_IP> <PEM_FILE_PATH>
#
# Example:
#   ./deploy.sh 13.234.56.78 ~/Downloads/ornate-key.pem

EC2_IP=$1
PEM_FILE=$2
EC2_USER="ubuntu"
APP_DIR="/home/$EC2_USER/ornate-app"

if [ -z "$EC2_IP" ] || [ -z "$PEM_FILE" ]; then
  echo "Usage: ./deploy.sh <EC2_IP> <PEM_FILE_PATH>"
  exit 1
fi

echo "🚀 Deploying Ornate Solar to $EC2_IP..."

# Step 1: Setup EC2 instance (install Docker & Docker Compose)
echo "📦 Step 1: Installing Docker on EC2..."
ssh -i "$PEM_FILE" -o StrictHostKeyChecking=no "$EC2_USER@$EC2_IP" << 'REMOTE_SETUP'
  # Update system
  sudo apt-get update -y
  sudo apt-get install -y ca-certificates curl gnupg

  # Install Docker
  if ! command -v docker &> /dev/null; then
    sudo install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    sudo chmod a+r /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt-get update -y
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    sudo usermod -aG docker $USER
    echo "Docker installed successfully!"
  else
    echo "Docker already installed."
  fi

  # Install Docker Compose standalone (fallback)
  if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
  fi

  # Create app directory
  mkdir -p ~/ornate-app
REMOTE_SETUP

# Step 2: Copy project files to EC2
echo "📁 Step 2: Copying project files to EC2..."
rsync -avz --progress \
  -e "ssh -i $PEM_FILE -o StrictHostKeyChecking=no" \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='dist' \
  --exclude='.git' \
  --exclude='.env' \
  --exclude='.env.local' \
  ./ "$EC2_USER@$EC2_IP:$APP_DIR/"

# Step 3: Copy env file
echo "🔐 Step 3: Copying environment file..."
scp -i "$PEM_FILE" -o StrictHostKeyChecking=no .env.production "$EC2_USER@$EC2_IP:$APP_DIR/.env"

# Step 4: Build and start containers
echo "🐳 Step 4: Building and starting Docker containers..."
ssh -i "$PEM_FILE" -o StrictHostKeyChecking=no "$EC2_USER@$EC2_IP" << REMOTE_DEPLOY
  cd $APP_DIR

  # Replace placeholder IP in .env
  sed -i "s/<YOUR_EC2_IP>/$EC2_IP/g" .env

  # Build and start
  docker compose down 2>/dev/null || true
  docker compose build --no-cache
  docker compose up -d

  # Wait for DB to be ready
  echo "Waiting for database..."
  sleep 10

  # Run Prisma migrations and seed
  docker compose exec -T api sh -c "cd /app/apps/api && npx prisma migrate deploy"
  docker compose exec -T api sh -c "cd /app/apps/api && npx prisma db seed"

  echo ""
  echo "✅ Deployment complete!"
  echo "🌐 Frontend: http://$EC2_IP"
  echo "🔌 API:      http://$EC2_IP/api"
  echo ""
  docker compose ps
REMOTE_DEPLOY

echo ""
echo "🎉 Done! Your app is live at http://$EC2_IP"
