

window.onload = function () {
    loadChatHistory();
    loadServices();
  };
  
  let recognition;
  
  if ('webkitSpeechRecognition' in window) {
    recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    
    recognition.onstart = function () {
      console.log('Voice recognition started...');
    };
  
    recognition.onresult = function (event) {
      const userMessage = event.results[0][0].transcript;
      addMessage('user', userMessage);
      setTimeout(() => {
        const botMessage = "I heard: " + userMessage;
        addMessage('bot', botMessage);
      }, 1000);
      saveChatHistory();
    };
  
    recognition.onerror = function (event) {
      console.log('Error occurred in recognition: ' + event.error);
    };
  
    recognition.onend = function () {
      console.log('Voice recognition ended');
    };
  }
  
  function toggleChat() {
    const chat = document.getElementById('chat-container');
    chat.classList.toggle('hidden');
    if (!chat.classList.contains('hidden')) {
      showWelcomeMessage();
    }
  }

  
  function goBack() {
    window.history.back();
  }
  
  let aboutData = [];

  // Fetch data from about.json
  window.onload = () => {
    fetch('about.json')
      .then(response => response.json())
      .then(data => {
        aboutData = data;
      })
      .catch(err => {
        console.error("Error loading about.json:", err);
      });
  };

  function sendMessage() {
    const input = document.getElementById("user-input");
    let userText = input.value.trim();

    // Remove any punctuation (like periods, commas, etc.) from the end of the input text
    userText = userText.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "");

    if (!userText) return;

    appendMessage("user", userText);
    input.value = "";

    // Wait until the data is loaded
    if (aboutData.length === 0) {
      appendMessage("bot", "Bot data is still loading. Please wait...");
      return;
    }

    // Search for a match in aboutData
    const match = aboutData.find(item =>
      item.question.toLowerCase() === userText.toLowerCase()
    );

    // If a match is found, send a random response from the available answers
    if (match) {
      const randomAnswer = match.answers[Math.floor(Math.random() * match.answers.length)];
      appendMessage("bot", randomAnswer);
    } else {
    // Fallback to backend LLM using /chat endpoint
    fetch("http://localhost:5000/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ question: userText })
    })
    .then(response => response.json())
    .then(data => {
      appendMessage("bot", data.answer);
    })
    .catch(error => {
      appendMessage("bot", "Sorry, an error occurred while contacting the server.");
      console.error("Error fetching from backend:", error);
    });
  }
}

  

  function appendMessage(sender, message) {
    const box = document.getElementById("chat-box");
    const msg = document.createElement("div");
    msg.className = `chat-message ${sender}`;
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    msg.innerHTML = `<span>${message}</span><div class="timestamp">${time}</div>`;
    box.appendChild(msg);
    box.scrollTop = box.scrollHeight;
  }

  // Voice recognition functionality
  // let recognition;

  if ('webkitSpeechRecognition' in window) {
    recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      const userSpeech = event.results[0][0].transcript;
      document.getElementById("user-input").value = userSpeech;
      sendMessage();
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
    };
  }

  function startVoiceRecognition() {
    if (recognition) {
      recognition.start();
    }
  }
  
  function showWelcomeMessage() {
    const chatBox = document.getElementById('chat-box');
    const welcomeMessage = document.getElementById('welcome-message');
    welcomeMessage.style.display = "block";
    document.getElementById('chat-buttons').style.display = "block";
  }
  
  function buttonClick(buttonName) {
    const chatBox = document.getElementById('chat-box');
    addMessage('bot', `You clicked: ${buttonName}`);
    if (buttonName === 'Services') {
      displayServiceButtons();
    }
  }
  
  function addMessage(sender, text) {
    const chatBox = document.getElementById('chat-box');
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('chat-message', sender);
    messageDiv.innerHTML = formatMessage(sender, text);
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
    return messageDiv;
  }
  
  function formatMessage(sender, text) {
    const timestamp = new Date().toLocaleTimeString([], {
      hour: '2-digit', minute: '2-digit'
    });
    return `${text}<span class="timestamp">${timestamp}</span>`;
  }
  
  function saveChatHistory() {
    const chatBox = document.getElementById('chat-box');
    const messages = [];
    chatBox.querySelectorAll('.chat-message').forEach(msg => {
      const sender = msg.classList.contains('user') ? 'user' : 'bot';
      const rawText = msg.childNodes[0].textContent;
      messages.push({ sender: sender, text: rawText });
    });
    localStorage.setItem('chatHistory', JSON.stringify(messages));
  }
  
  function loadChatHistory() {
    const history = localStorage.getItem('chatHistory');
    if (!history) return;
    const messages = JSON.parse(history);
    messages.forEach(msg => {
      addMessage(msg.sender, msg.text);
    });
  }
  
  // Fetch services from services.json file
  function loadServices() {
    fetch('services.json')
      .then(response => response.json())
      .then(data => {
        window.servicesData = data;  // Storing services data globally
      })
      .catch(error => console.error('Error loading services:', error));
  }
  
  function displayServiceButtons() {
    const serviceButtonsContainer = document.getElementById('service-buttons');
    serviceButtonsContainer.innerHTML = '';  // Clear previous buttons
    
    window.servicesData.forEach(serviceCategory => {
      const categoryButton = document.createElement('button');
      categoryButton.textContent = serviceCategory.service_name;
      categoryButton.onclick = () => displayServiceDetails(serviceCategory);
      serviceButtonsContainer.appendChild(categoryButton);
    });
  }
  
  function displayServiceDetails(serviceCategory) {
    const serviceButtonsContainer = document.getElementById('service-buttons');
    serviceButtonsContainer.innerHTML = '';  // Clear category buttons
  
    serviceCategory.services.forEach(service => {
      const serviceButton = document.createElement('button');
      serviceButton.textContent = service.service_detail;
      serviceButton.onclick = () => showServiceDescription(service);
      serviceButtonsContainer.appendChild(serviceButton);
    });
  }
  
  function showServiceDescription(service) {
    addMessage('bot', `${service.service_detail}: ${service.description}`);
    saveChatHistory();
  }
  
  // Handle button click from main buttons
function buttonClick(buttonText) {
  if (buttonText === "Services") {
    showServicesPage();
  } else {
    appendMessage("user", buttonText);
    appendMessage("bot", `You clicked on ${buttonText}.`);
  }
}

// Navigate to services page and load categories
function showServicesPage() {
    fetch("services.json")
      .then(response => response.json())
      .then(data => {
        const container = document.getElementById("service-buttons");
        container.innerHTML = ""; // clear existing
        data.forEach(service => {
          const btn = document.createElement("button");
          btn.textContent = service.service_name;
          btn.onclick = () => showServiceDetails(service);
          container.appendChild(btn);
        });
        switchPage("services-page");
      });
  }

// Navigate to service details page
function showServiceDetails(service) {
    const detailContainer = document.getElementById("service-detail-buttons");
    detailContainer.innerHTML = "";
    service.services.forEach(item => {
      const btn = document.createElement("button");
      btn.textContent = item.service_detail;
      btn.title = item.description;
      btn.onclick = () => {
        showServiceDescription(item.service_detail, item.description);
      };      
      detailContainer.appendChild(btn);
    });
    switchPage("service-detail-page");
  }

  function showServiceDescription(title, description) {
    document.getElementById("service-title").textContent = title;
    document.getElementById("service-description-text").textContent = description;
    switchPage("service-description-page");
  }
  

// Page switching logic
function switchPage(pageId) {
    document.querySelectorAll(".chat-page").forEach(p => p.classList.add("hidden"));
    document.getElementById(pageId).classList.remove("hidden");
  }
  
// Back button behavior
function showMainPage() {
  switchPage("main-page");
}
function showServiceCategories() {
  switchPage("services-page");
}
function goBack() {
  switchPage("main-page");
}

// Handle button click from main buttons
function buttonClick(buttonText) {
  if (buttonText === "Services") {
    showServicesPage();
  } else if (buttonText === "Contacts") {
    showContactsPage();
  } else if (buttonText === "Chatbots") {
    showChatbotsPage();  // ✅ New handler for Chatbots
  } else {
    appendMessage("user", buttonText);
    appendMessage("bot", `You clicked on ${buttonText}.`);
  }
}

let chatbotData = {};

// Load chatbot data from chatbot.json on page load
function loadChatbots() {
  fetch("chatbot.json")
    .then(res => res.json())
    .then(data => {
      chatbotData = data[0];  // Since chatbot.json is an array with one big object
    })
    .catch(err => {
      console.error("Error loading chatbot data:", err);
    });
}

// Show chatbot names on click of Chatbots button
function showChatbotsPage() {
  const container = document.getElementById("chatbot-list-buttons");
  container.innerHTML = "";

  Object.keys(chatbotData).forEach(key => {
    const bot = chatbotData[key];
    const btn = document.createElement("button");
    btn.textContent = bot.name;
    btn.onclick = () => showChatbotDetail(key);
    container.appendChild(btn);
  });

  switchPage("chatbots-page");
}

// Show chatbot detail page
function showChatbotDetail(key) {
  const bot = chatbotData[key];
  document.getElementById("chatbot-title").textContent = bot.name;
  document.getElementById("chatbot-description-text").innerHTML = generateChatbotHTML(bot);
  switchPage("chatbot-detail-page");
}

function generateChatbotHTML(bot) {
  let html = `<p><strong>Description:</strong> ${bot.description || ''}</p>`;

  if (bot.features) {
    html += `<h3>Features:</h3><ul>`;
    bot.features.forEach(f => html += `<li>${f}</li>`);
    html += `</ul>`;
  }

  if (bot.key_features) {
    html += `<h3>Key Features:</h3><ul>`;
    Object.entries(bot.key_features).forEach(([k, v]) => {
      html += `<li><strong>${k}:</strong> ${v}</li>`;
    });
    html += `</ul>`;
  }

  if (bot.benefits) {
    html += `<h3>Benefits:</h3>`;
    if (Array.isArray(bot.benefits)) {
      html += `<ul>`;
      bot.benefits.forEach(b => html += `<li>${b}</li>`);
      html += `</ul>`;
    } else {
      html += `<ul>`;
      Object.entries(bot.benefits).forEach(([k, v]) => {
        html += `<li><strong>${k}:</strong> ${v}</li>`;
      });
      html += `</ul>`;
    }
  }

  if (bot.customized_solutions || bot.customizable_solutions || bot.customization_options) {
    html += `<h3>Custom Solutions:</h3><ul>`;
    const customBlock = bot.customized_solutions || bot.customizable_solutions || bot.customization_options;
    if (Array.isArray(customBlock)) {
      customBlock.forEach(c => html += `<li>${c}</li>`);
    } else {
      Object.entries(customBlock).forEach(([k, v]) => {
        html += `<li><strong>${k}:</strong> ${v}</li>`;
      });
    }
    html += `</ul>`;
  }

  if (bot.how_it_works) {
    html += `<h3>How It Works:</h3><ul>`;
    Object.entries(bot.how_it_works).forEach(([k, v]) => {
      html += `<li><strong>${k}:</strong> ${v}</li>`;
    });
    html += `</ul>`;
  }

  if (bot.terms_of_use) {
    html += `<h3>Terms of Use:</h3><ul>`;
    Object.entries(bot.terms_of_use).forEach(([k, v]) => {
      html += `<li><strong>${k}:</strong> ${v}</li>`;
    });
    html += `</ul>`;
  }

  return html;
}


// Back navigation
function showChatbotList() {
  switchPage("chatbots-page");
}

// Call loadChatbots on window load
window.addEventListener("load", () => {
  loadChatbots();
});

  
  // Show Contacts Page
  function showContactsPage() {
    switchPage("contacts-page");
  }
  
  // Update the page switch logic
  function switchPage(pageId) {
    document.querySelectorAll(".chat-page").forEach(p => p.classList.add("hidden"));
    document.getElementById(pageId).classList.remove("hidden");
  }
  
  // Back button for Contacts page
  function showMainPage() {
    switchPage("main-page");
  }
  
  document.getElementById("user-input").addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      sendMessage();
    }
  });
  

  