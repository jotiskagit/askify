const promptForm = document.querySelector(".prompt-form");
const promptInput = document.querySelector(".prompt-input");
const chatsContainer = document.querySelector(".chats-container");
const container = document.querySelector(".container");
const fileInput = document.querySelector("#file-input");
const fileUploadWrapper = document.querySelector(".file-upload-wrapper");

const API_URL = "/api/gemini"; 

const chatHistory = [];
let userData = {message: "", file: {}};
let hasUserSentMessage = false;


const createMsgElement = (content, ...classes) => {
    const div = document.createElement("div");
    div.classList.add("message", ...classes);
    div.innerHTML = content;
    return div;
}

const scrollToBottom = () => {
    container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
}

const typingEffect = (text, textElement, botMsgDiv) => {
    textElement.textContent = "";
    const words = text.split(" ");
    let wordIndex = 0;
    const typingInterval = setInterval(() => {
      if(wordIndex < words.length) {
      textElement.textContent += (wordIndex === 0 ? "" : " ") + words[wordIndex++];
      botMsgDiv.classList.remove("loading");
      scrollToBottom();
      } else {
        clearInterval(typingInterval);
        textElement.textContent = text;
      }
    }, 40);
}

const generateResponse = async (botMsgDiv) => {
  const textElement = botMsgDiv.querySelector(".message-text");

  const userParts = [{ text: userData.message }];
  if (userData.file.data) {
    userParts.push({
      inline_data: {
        mime_type: userData.file.mime_type,
        data: userData.file.data,
      },
    });
  }

  chatHistory.push({
    role: "user",
    parts: userParts,
  });

  try {
   const response = await fetch(API_URL, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ contents: chatHistory }),
});


    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Unknown error");

    const responseText = data.candidates[0].content.parts[0].text
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .trim();

    typingEffect(responseText, textElement, botMsgDiv);

    chatHistory.push({
      role: "model",
      parts: [{ text: responseText }],
    });

  } catch (error) {
    console.error("API Error:", error);
    textElement.textContent = "Something went wrong. Try again.";
  } finally {
    document.querySelector('.app-header').classList.remove('hidden');
    userData = { message: "", file: {} };
  }
};



const handleFormSubmit = (e) => {
    e.preventDefault();
    const userMessage = promptInput.value.trim();
    if (!userMessage) return;

    if (!hasUserSentMessage) {
  hasUserSentMessage = true;
  document.getElementById("app-header").style.display = "none";
}

    promptInput.value = "";
    userData.message = userMessage;
    fileUploadWrapper.classList.remove("active", "img-attached", "file-attached");

    const userMsgHTML = `<p class="message-text"></p>
    ${userData.file.data ? (userData.file.isImage ? `<img src="data:${userData.file.mime_type};base64,${userData.file.data}" class="img-attachment" />` : `<p class="file-attachment"><span class="material-symbols-outlined">description</span>${userData.file.fileName}</p>`) : ""}`;
    
    const userMsgDiv = createMsgElement(userMsgHTML, "user-message");
    userMsgDiv.querySelector(".message-text").textContent = userMessage;
    chatsContainer.appendChild(userMsgDiv);
    scrollToBottom();

    setTimeout(() => {
        const botMsgHTML = `<img src="/images/bot_icon.png" class="bot-icon" /><p class="message-text">Just a sec...</p>`;
        const botMsgDiv = createMsgElement(botMsgHTML, "bot-message");
        chatsContainer.appendChild(botMsgDiv);
        scrollToBottom();
        generateResponse(botMsgDiv);
    }, 600);
}

fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if(!file) return; 

    const IsImage = file.type.startsWith("image/");
    const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
      fileInput.value = "";
      const base64String = e.target.result.split(",")[1];
      fileUploadWrapper.querySelector(".file-preview").src = e.target.result;
      fileUploadWrapper.classList.add("active", IsImage ? "img-attached" : "file-attached");
      
        userData.file = {
        fileName: file.name, data: base64String, mime_type: file.type,  isImage: IsImage
        };
    }
    
});

document.querySelector("#cancel-file-btn").addEventListener("click", () => {
    userData.file = {};
    fileUploadWrapper.classList.remove("active", "img-attached", "file-attached");

});

promptForm.addEventListener("submit", handleFormSubmit);
promptForm.querySelector("#attach-file-btn").addEventListener("click", () => fileInput.click());

const themeToggleBtn = document.getElementById("theme-toggle-btn");

// Check local storage for saved theme
if (localStorage.getItem("theme") === "light") {
  document.documentElement.classList.add("light-theme");
  themeToggleBtn.textContent = "dark_mode";
}

// Toggle theme on button click
themeToggleBtn.addEventListener("click", () => {
  document.documentElement.classList.toggle("light-theme");
  const isLight = document.documentElement.classList.contains("light-theme");

  // Update icon and save preference
  themeToggleBtn.textContent = isLight ? "dark_mode" : "light_mode";
  localStorage.setItem("theme", isLight ? "light" : "dark");
});

const deleteChatsBtn = document.getElementById("delete-chats-btn");

deleteChatsBtn.addEventListener("click", () => {
  const confirmed = confirm("Are you sure you want to delete all chats?");
  if (confirmed) {
    chatsContainer.innerHTML = "";
    hasUserSentMessage = false;
    document.getElementById("app-header").style.display = "block"; // show header again
  }
});

