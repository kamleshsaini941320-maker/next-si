const STORAGE_KEY = "nextSIAllChats";

let chats = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
let activeChatId = null;

// Dashboard खोलना
function showDashboard() {
  document.querySelector(".welcome-banner").style.display = "none";

  const dashboard = document.getElementById("chatDashboard");

  dashboard.classList.add("chat-active");
  dashboard.style.display = "flex";
}

// Home पर वापस जाना
function showHome() {
  document.querySelector(".welcome-banner").style.display = "block";
  document.getElementById("chatDashboard").style.display = "none";
}

// पुराने Chat History को सुरक्षित रखना
const oldHistory = localStorage.getItem("nextSIChatHistory");

if (chats.length === 0 && oldHistory) {
  try {
    chats.push({
      id: Date.now(),
      title: "Old Chat",
      date: new Date().toISOString(),
      messages: JSON.parse(oldHistory)
    });
  } catch (e) {
    console.log("Old history could not be loaded");
  }
}

function saveAllChats() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
}

function createChat() {
  const chat = {
    id: Date.now(),
    title: "New Chat",
    date: new Date().toISOString(),
    messages: []
  };

  chats.unshift(chat);
  activeChatId = chat.id;

  saveAllChats();
  return chat;
}

function getActiveChat() {
  return chats.find(chat => chat.id === activeChatId);
}

function saveChatHistory() {
  const chat = getActiveChat();
  if (!chat) return;

  const box = document.getElementById("messages");

  chat.messages = Array.from(box.children).map(msg => ({
    text: msg.textContent,
    type: msg.className.replace("message ", "")
  }));

  const firstUser = chat.messages.find(m => m.type === "user");

  if (firstUser && chat.title === "New Chat") {
    chat.title = firstUser.text.replace("You: ", "").slice(0, 30);
  }

  chat.date = new Date().toISOString();

  saveAllChats();
}

function renderFormattedText(container, text) {
  text = text.replace(/\\\*/g, "*");
  text = text.replace(/\s*(#{1,3})\s*/g, "\n$1 ");
  text = text.replace(/(^|[\s।.!?])\*(?!\*)\s+/g, "$1\n• ");
  text = text.replace(/(\*\*[^*]+\*\*:)\s*/g, "$1\n");

  const lines = text.split("\n");

  lines.forEach(line => {
    const trimmed = line.trim();

    if (!trimmed) return;

    let element;
    let content = trimmed;

    const heading = trimmed.match(/^#{1,3}\s*(.*)/);
    const number = trimmed.match(/^(\d+)\.\s+(.*)/);

    if (heading) {
      element = document.createElement("h3");
      content = heading[1];
    }
    else if (number) {
      element = document.createElement("p");
      content = number[1] + ". " + number[2];
    }
    else {
      element = document.createElement("p");
    }

    const parts = content.split(/(\*\*.*?\*\*)/g);

    parts.forEach(part => {
      if (part.startsWith("**") && part.endsWith("**")) {
        const bold = document.createElement("strong");
        bold.textContent = part.slice(2, -2);
        element.appendChild(bold);
      } else {
        element.appendChild(document.createTextNode(part));
      }
    });

    container.appendChild(element);
  });
}
function addMessage(text, type) {
  const box = document.getElementById("messages");
  const msg = document.createElement("div");

  msg.className = "message " + type;

  const content = document.createElement("span");

  if (type === "bot") {
    renderFormattedText(content, text);
  } else {
    content.textContent = text;
  }

  msg.appendChild(content);

  if (type === "bot") {
    // Copy Button
    const copyBtn = document.createElement("button");
    copyBtn.className = "copy-btn";
    copyBtn.title = "Copy";

    const copyIcon = `
      <svg viewBox="0 0 24 24" width="19" height="19"
        fill="none" stroke="currentColor" stroke-width="1.8"
        stroke-linecap="round" stroke-linejoin="round">
        <rect x="8" y="8" width="13" height="13" rx="2"/>
        <path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>
      </svg>`;

    copyBtn.innerHTML = copyIcon;

    copyBtn.onclick = async function () {
      try {
        await navigator.clipboard.writeText(text);
        copyBtn.textContent = "Copied!";

        setTimeout(() => {
          copyBtn.innerHTML = copyIcon;
        }, 2000);
      } catch (error) {
        copyBtn.textContent = "Failed";
      }
    };

    msg.appendChild(copyBtn);

    // Speak Button
    const speakBtn = document.createElement("button");
    speakBtn.className = "copy-btn";
    speakBtn.title = "Speak";

    speakBtn.innerHTML = `
      <svg viewBox="0 0 24 24" width="19" height="19"
        fill="none" stroke="currentColor" stroke-width="1.8"
        stroke-linecap="round" stroke-linejoin="round">
        <path d="M11 5 6 9H3v6h3l5 4z"/>
        <path d="M15.5 8.5a5 5 0 0 1 0 7"/>
        <path d="M19 5a10 10 0 0 1 0 14"/>
      </svg>`;

    speakBtn.onclick = function () {
      if (!("speechSynthesis" in window)) {
        alert("Voice output is not supported.");
        return;
      }

      window.speechSynthesis.cancel();

      const speech = new SpeechSynthesisUtterance(text);

      speech.lang = /[\u0900-\u097F]/.test(text)
        ? "hi-IN"
        : "en-US";

      speech.rate = 1;
      speech.pitch = 1;

      window.speechSynthesis.speak(speech);
    };

    msg.appendChild(speakBtn);

    // Stop Button
    const stopBtn = document.createElement("button");
    stopBtn.className = "copy-btn";
    stopBtn.title = "Stop Voice";

    stopBtn.innerHTML = `
      <svg viewBox="0 0 24 24" width="19" height="19"
        fill="currentColor">
        <rect x="5" y="5" width="14" height="14" rx="2"/>
      </svg>`;

    stopBtn.onclick = function () {
      window.speechSynthesis.cancel();
    };

    msg.appendChild(stopBtn);
  }

  box.appendChild(msg);
  box.scrollTop = box.scrollHeight;

  saveChatHistory();
}

function displayChat(chat) {
  const box = document.getElementById("messages");
  box.innerHTML = "";

  chat.messages.forEach(msg => {
    const element = document.createElement("div");

    element.className = "message " + msg.type;
    element.textContent = msg.text;

    box.appendChild(element);
  });

  box.scrollTop = box.scrollHeight;
}

function loadChatHistory() {
  if (chats.length === 0) {
    createChat();

    addMessage(
      "Hello! 👋 Welcome to Next SI AI. Ask me anything!",
      "bot"
    );

    return;
  }

  activeChatId = chats[0].id;
  displayChat(chats[0]);
}
// Next SI AI Memory System

const MEMORY_KEY = "nextSIMemories";

function getMemories() {
  return JSON.parse(localStorage.getItem(MEMORY_KEY) || "[]");
}

function saveMemory(memory) {
  const memories = getMemories();

  if (!memory.trim()) return;

  memories.push({
    id: Date.now(),
    text: memory.trim()
  });

  localStorage.setItem(MEMORY_KEY, JSON.stringify(memories));
}

function deleteMemory(id) {
  const memories = getMemories().filter(
    memory => memory.id !== id
  );

  localStorage.setItem(MEMORY_KEY, JSON.stringify(memories));
}

// Delete All Memories
function clearMemories() {
  if (confirm("क्या आप सभी Memories हटाना चाहते हैं?")) {
    localStorage.removeItem(MEMORY_KEY);
    alert("All memories deleted!");
    showMemories();
  }
}

// Save Memory manually
function saveMemoryPrompt() {
  const memory = prompt("क्या याद रखना है?");

  if (memory && memory.trim()) {
    saveMemory(memory);
    alert("🧠 Memory saved successfully!");
  }
}

// View Saved Memories
function showMemories() {
  const box = document.getElementById("messages");
  box.innerHTML = "";

  const heading = document.createElement("h2");
  heading.textContent = "🧠 My Memories";
  box.appendChild(heading);

  const memories = getMemories();

  if (memories.length === 0) {
    box.append("No memories saved yet.");
    return;
  }

  memories.forEach(memory => {
    const item = document.createElement("div");
    item.className = "history-item";

    const text = document.createElement("p");
    text.textContent = memory.text;

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "🗑️ Delete";

    deleteBtn.onclick = () => {
      deleteMemory(memory.id);
      showMemories();
    };

    item.appendChild(text);
    item.appendChild(deleteBtn);
    box.appendChild(item);
  });

  const clearBtn = document.createElement("button");
  clearBtn.textContent = "Delete All Memories 🗑️";
  clearBtn.onclick = clearMemories;

  box.appendChild(clearBtn);
}

async function sendMessage() {
  const input = document.getElementById("question");
  const text = input.value.trim();

  if (!text) return;

  if (!getActiveChat()) createChat();

  addMessage("You: " + text, "user");
  input.value = "";

  const thinking = document.createElement("div");
  thinking.className = "message bot";
  thinking.textContent = "AI सोच रहा है... ⏳";

  document.getElementById("messages").appendChild(thinking);

  try {
    const response = await fetch(
      "https://next-si-ai.kamleshsaini941320.workers.dev/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: text,
          memories: getMemories().map(memory => memory.text)
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(JSON.stringify(data.details || data));
    }

    const rawAnswer = data.answer || "";

    const suggestionMatch = rawAnswer.match(
      /MEMORY_SUGGESTION:\s*(.+)/i
    );

    const cleanAnswer = rawAnswer.replace(
      /^\s*MEMORY_SUGGESTION:.*$/im,
      ""
    ).trim();

    thinking.remove();

    addMessage(cleanAnswer, "bot");

    // Ask permission to save memory
    if (suggestionMatch) {
      const suggestedMemory = suggestionMatch[1].trim();

      if (
        suggestedMemory &&
        confirm("🧠 क्या इस बात को Memory में सेव करना चाहते हैं?\n\n" + suggestedMemory)
      ) {
        saveMemory(suggestedMemory);
        alert("✅ Memory Saved Successfully!");
      }
    }

  } catch (error) {
    thinking.remove();

    addMessage(
      "Connection Error: " + error.message,
      "bot"
    );

    console.error("Next SI Error:", error);
  }
}

function quickAsk(text) {
  document.getElementById("question").value = text;
  document.getElementById("question").focus();
}

function newChat() {
  const chat = createChat();

  displayChat(chat);

  addMessage(
    "Hello! 👋 Welcome to Next SI AI. Ask me anything!",
    "bot"
  );
}
function openChat(id) {
  const chat = chats.find(c => c.id === id);

  if (!chat) return;

  activeChatId = id;
  displayChat(chat);
}

function deleteChat(id) {
  if (!confirm("क्या आप यह Chat Delete करना चाहते हैं?")) return;

  chats = chats.filter(chat => chat.id !== id);

  if (activeChatId === id) {
    if (chats.length > 0) {
      activeChatId = chats[0].id;
      displayChat(chats[0]);
    } else {
      const chat = createChat();
      displayChat(chat);
    }
  }

  saveAllChats();
  showHistory();
}

function showHistory() {
  const box = document.getElementById("messages");
  box.innerHTML = "";

  const heading = document.createElement("h2");
  heading.textContent = "💬 Chat History";
  box.appendChild(heading);

  // Search Chat History
  const searchBox = document.createElement("input");
  searchBox.type = "text";
  searchBox.placeholder = "🔍 Search chats...";
  searchBox.id = "chatSearch";
  searchBox.style.width = "90%";
  searchBox.style.padding = "12px";
  searchBox.style.margin = "10px 0";
  searchBox.style.borderRadius = "8px";

  box.appendChild(searchBox);

  if (chats.length === 0) {
    box.append("No chat history found.");
    return;
  }

  searchBox.addEventListener("input", function () {
    const query = this.value.toLowerCase();

    document.querySelectorAll(".history-item").forEach(item => {
      const title = item.querySelector("h3").textContent.toLowerCase();
      const messages = item.dataset.search || "";

      item.style.display =
        title.includes(query) || messages.includes(query)
          ? "block"
          : "none";
    });
  });

  chats.forEach(chat => {
    const item = document.createElement("div");
    item.className = "history-item";

    item.dataset.search = [
      chat.title,
      ...(chat.messages || []).map(msg => msg.text)
    ].join(" ").toLowerCase();

    const title = document.createElement("h3");
    title.textContent = chat.title || "New Chat";

    const date = document.createElement("p");
    date.textContent = new Date(chat.date).toLocaleString();

    // Export Chat Button
    const exportBtn = document.createElement("button");
    exportBtn.textContent = "📥 Export Chat";

    exportBtn.onclick = () => {
      const chatText = (chat.messages || [])
        .map(msg => msg.text)
        .join("\n\n");

      const blob = new Blob([chatText], {
        type: "text/plain;charset=utf-8"
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");

      a.href = url;
      a.download = (chat.title || "Next-SI-Chat") + ".txt";

      a.click();
      URL.revokeObjectURL(url);
    };

    // Open Button
    const openBtn = document.createElement("button");
    openBtn.textContent = "Open Chat 💬";
    openBtn.onclick = () => openChat(chat.id);

    // Rename Button
    const renameBtn = document.createElement("button");
    renameBtn.textContent = "Rename ✏️";

    renameBtn.onclick = () => {
      const newName = prompt("Enter new chat name:", chat.title);

      if (newName && newName.trim()) {
        chat.title = newName.trim().slice(0, 50);
        saveAllChats();
        showHistory();
      }
    };

    // Delete Button
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete 🗑️";
    deleteBtn.onclick = () => deleteChat(chat.id);

    item.appendChild(title);
    item.appendChild(date);
    item.appendChild(openBtn);
    item.appendChild(exportBtn);
    item.appendChild(renameBtn);
    item.appendChild(deleteBtn);

    box.appendChild(item);
  });
}
// Page Load पर Chat History खोलना
window.addEventListener("DOMContentLoaded", loadChatHistory);

// Dark / Light Mode
function toggleTheme() {
  document.body.classList.toggle("light-mode");

  const isLight = document.body.classList.contains("light-mode");

  document.getElementById("themeBtn").textContent =
    isLight ? "🌙 Dark Mode" : "☀️ Light Mode";

  localStorage.setItem("nextSITheme", isLight ? "light" : "dark");
}

// Load saved theme
if (localStorage.getItem("nextSITheme") === "light") {
  document.body.classList.add("light-mode");

  document.addEventListener("DOMContentLoaded", function () {
    const themeBtn = document.getElementById("themeBtn");

    if (themeBtn) {
      themeBtn.textContent = "🌙 Dark Mode";
    }
  });
}

// Voice Input
function startVoiceInput() {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    alert("Voice Input is not supported. Please use Chrome.");
    return;
  }

  const recognition = new SpeechRecognition();

  recognition.lang = "hi-IN";
  recognition.continuous = false;
  recognition.interimResults = false;

  const voiceBtn = document.getElementById("voiceBtn");
  const input = document.getElementById("question");

  const micIcon = `
    <svg viewBox="0 0 24 24" width="22" height="22"
      fill="none" stroke="currentColor" stroke-width="1.8"
      stroke-linecap="round" stroke-linejoin="round">
      <rect x="9" y="2" width="6" height="12" rx="3"/>
      <path d="M5 10a7 7 0 0 0 14 0"/>
      <path d="M12 17v5M9 22h6"/>
    </svg>
  `;

  recognition.onstart = function () {
    voiceBtn.innerHTML = micIcon;
    voiceBtn.classList.add("listening");
    voiceBtn.title = "Listening...";
  };

  recognition.onresult = function (event) {
    input.value = event.results[0][0].transcript;
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 150) + "px";
  };

  recognition.onerror = function () {
    alert("Microphone error. Please check microphone permission.");
  };

  recognition.onend = function () {
    voiceBtn.innerHTML = micIcon;
    voiceBtn.classList.remove("listening");
    voiceBtn.title = "Voice Input";
  };

  recognition.start();
}

// Sidebar
function toggleSidebar() {
  document.body.classList.toggle("sidebar-open");
}

function closeSidebar() {
  document.body.classList.remove("sidebar-open");
}
