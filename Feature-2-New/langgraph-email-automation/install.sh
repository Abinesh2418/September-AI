#!/bin/bash

echo "🎯 Feature-2: Gmail Ticket System - Installation & Setup"
echo "========================================================"

# Check Python
echo "📋 Checking Python installation..."
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    echo "✅ $PYTHON_VERSION found"
else
    echo "❌ Python 3 not found. Please install Python 3.7+"
    exit 1
fi

# Install required packages
echo "📦 Installing required Python packages..."
pip3 install --upgrade pip

# Core packages
pip3 install requests groq fastapi uvicorn python-dotenv email-mime-fix

echo "✅ Python packages installed"

# Check .env file
echo "🔧 Checking configuration..."
if [ -f ".env" ]; then
    echo "✅ .env file found"
else
    echo "❌ .env file not found"
    echo "📋 Creating .env template..."
    cat > .env << 'EOF'
# Gmail Configuration (REQUIRED)
MY_EMAIL=sharang.23ad@kct.ac.in
GMAIL_APP_PASSWORD=your_16_character_app_password_here

# AI API Keys (REQUIRED)
GROQ_API_KEY=your_groq_api_key_here
GOOGLE_API_KEY=your_google_api_key_here

# Staff Email Routing (Configure as needed)
SOFTWARE_SECURITY_OFFICER=security@company.com
IT_HELPDESK_MANAGER=itmanager@company.com
HR_COORDINATOR=hr@company.com
PROCUREMENT_OFFICER=procurement@company.com
NETWORK_ADMIN=network@company.com
EOF
    echo "📝 Template .env created - PLEASE UPDATE WITH YOUR CREDENTIALS"
fi

echo ""
echo "🚀 Installation Complete!"
echo "========================================"
echo ""
echo "📋 NEXT STEPS:"
echo "1. Configure Gmail App Password:"
echo "   - Go to: https://myaccount.google.com/security"
echo "   - Enable 2-Step Verification"
echo "   - Generate App Password for 'Mail'"
echo "   - Update .env: GMAIL_APP_PASSWORD=your_password"
echo ""
echo "2. Get API Keys:"
echo "   - GROQ API: https://console.groq.com/"
echo "   - Google API: https://console.cloud.google.com/"
echo ""
echo "3. Update staff emails in .env file"
echo ""
echo "4. Run the system:"
echo "   ./start_system.sh"
echo ""
echo "📊 Web Dashboard will be at: http://localhost:8000"
echo ""