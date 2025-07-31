# Docker Installation Instructions

Since this is WSL (Windows Subsystem for Linux), you have two options:

## Option 1: Install Docker Desktop (Recommended for WSL)

1. Download and install Docker Desktop for Windows from:
   https://www.docker.com/products/docker-desktop/

2. During installation, make sure "Use WSL 2 instead of Hyper-V" is selected

3. After installation, Docker will be available in your WSL environment

## Option 2: Install Docker Engine in WSL (if you prefer)

Run these commands in your WSL terminal:

```bash
# Update package lists
sudo apt-get update

# Install dependencies
sudo apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# Add Docker's official GPG key
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Set up the repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Update package lists again
sudo apt-get update

# Install Docker Engine
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Add your user to the docker group
sudo usermod -aG docker $USER

# Start Docker service
sudo service docker start
```

## After Installation

Test Docker with:
```bash
docker --version
docker compose version
```

Then you can run the database population script:
```bash
docker compose up -d postgres
npx tsx scripts/populate-database.ts
```

## Note

If you're using WSL, Docker Desktop is generally the easier option as it handles the integration between Windows and WSL automatically.