let currentFile = null;
let conversationHistory = []; // Stores {role: 'user'|'model', content: '...'}

const chatWindow = document.getElementById('chat-window');
const userInput = document.getElementById('user-input');
const previewContainer = document.getElementById('image-preview-container');
const previewImg = document.getElementById('preview-img');

// 1. Handle Image Selection
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        currentFile = file;
        previewImg.src = URL.createObjectURL(file);
        previewContainer.classList.remove('hidden');
        userInput.placeholder = "Describe the issue (optional)...";
        userInput.focus();
    }
}

function clearImage() {
    currentFile = null;
    previewContainer.classList.add('hidden');
    document.getElementById('file-input').value = ""; // Reset input
    userInput.placeholder = "Type a message...";
}

function handleEnter(e) {
    if (e.key === 'Enter') sendMessage();
}

// 2. Send Message
async function sendMessage() {
    const text = userInput.value.trim();
    
    if (!text && !currentFile) return;

    // A. Add User Message to UI
    addMessageToUI("user", text, currentFile ? URL.createObjectURL(currentFile) : null);
    
    // Update History (We store text, not images, to keep JSON light)
    conversationHistory.push({ role: "user", content: text || "[Uploaded an Image]" });

    // Prepare Data for Backend
    const formData = new FormData();
    formData.append("message", text || "Analyze this image.");
    formData.append("history", JSON.stringify(conversationHistory)); // Send context
    if (currentFile) {
        formData.append("file", currentFile);
    }

    // Clear Input
    userInput.value = "";
    clearImage();
    
    // Show Loading Bubble
    const loadingId = addLoadingBubble();
    scrollToBottom();

    try {
        // B. Call Backend
        const res = await fetch("http://127.0.0.1:8000/chat", {
            method: "POST",
            body: formData
        });

        const data = await res.json();
        
        // Remove Loading
        document.getElementById(loadingId).remove();

        // C. Add Bot Response
        const reply = data.reply || "Sorry, I couldn't process that.";
        addMessageToUI("bot", reply);
        
        // Update History
        conversationHistory.push({ role: "model", content: reply });

    } catch (err) {
        document.getElementById(loadingId).remove();
        addMessageToUI("bot", "⚠️ Error connecting to server.");
    }
    
    scrollToBottom();
}

// --- UI Helper Functions ---

function addMessageToUI(role, text, imageUrl = null) {
    const div = document.createElement('div');
    div.className = `message ${role}-message`;

    let contentHtml = "";
    
    // Display Image if present
    if (imageUrl) {
        contentHtml += `<img src="${imageUrl}" class="chat-image" />`;
    }

    // Format Text (Simple bolding)
    const formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
    
    if (text) {
        contentHtml += `<div class="bubble">${formattedText}</div>`;
    }

    div.innerHTML = contentHtml;
    chatWindow.appendChild(div);
}

function addLoadingBubble() {
    const id = "loading-" + Date.now();
    const div = document.createElement('div');
    div.id = id;
    div.className = "message bot-message";
    div.innerHTML = `<div class="bubble" style="color: #6b7280; font-style: italic;">Thinking...</div>`;
    chatWindow.appendChild(div);
    return id;
}

function scrollToBottom() {
    chatWindow.scrollTop = chatWindow.scrollHeight;
}