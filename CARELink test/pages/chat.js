function appendChatMessage(container, text, kind) {
  const msgDiv = document.createElement('div');
  msgDiv.className = `message ${kind}`;
  msgDiv.textContent = text;
  container.appendChild(msgDiv);
  container.scrollTop = container.scrollHeight;
}

function initChat() {
  const form = document.getElementById('chatForm');
  const input = document.getElementById('chatInput');
  const messages = document.getElementById('chatMessages');
  if (!form || !input || !messages) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const msg = (input.value || '').trim();
    if (!msg) return;

    appendChatMessage(messages, msg, 'user');
    input.value = '';
    input.focus();

    // Simulated support response (placeholder for real chat backend).
    window.setTimeout(() => {
      appendChatMessage(messages, "Thank you for sharing. We're here to listen.", 'support');
    }, 900);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initChat);
} else {
  initChat();
}

