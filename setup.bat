@echo off
echo 🚀 AutoRiven API Setup Script
echo ==============================

:: Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js (v16+) first.
    exit /b 1
)

:: Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install npm first.
    exit /b 1
)

echo ✅ Node.js and npm are installed

:: Install dependencies
echo 📦 Installing dependencies...
npm install

:: Copy environment file
if not exist .env (
    echo 🔧 Creating environment file...
    copy .env.example .env
    echo ⚠️  Please update the .env file with your configuration
) else (
    echo ℹ️  Environment file already exists
)

:: Build the application
echo 🔨 Building application...
npm run build

echo.
echo ✅ Setup completed!
echo.
echo Next steps:
echo 1. Update the .env file with your database and Elasticsearch configuration
echo 2. Make sure PostgreSQL and Elasticsearch are running
echo 3. Run 'npm run seed' to create initial users (optional)
echo 4. Run 'npm run start:dev' to start the development server
echo.
echo Default admin credentials (after running seed):
echo   Email: admin@autoriven.com
echo   Password: Admin@123
echo.
echo API will be available at: http://localhost:3000/api
echo Health check: http://localhost:3000/api/health

pause
