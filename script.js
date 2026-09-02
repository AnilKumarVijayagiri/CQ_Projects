const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');
const aprilStar = document.querySelector('.april-star');
const aprilPanel = document.querySelector('#april-panel');

menuToggle.addEventListener('click', () => {
	const isOpen = navLinks.classList.toggle('open');
	menuToggle.setAttribute('aria-expanded', isOpen);
	menuToggle.textContent = isOpen ? 'Close' : 'Menu';
});

navLinks.querySelectorAll('a').forEach((link) => {
	link.addEventListener('click', () => {
		navLinks.classList.remove('open');
		menuToggle.setAttribute('aria-expanded', 'false');
		menuToggle.textContent = 'Menu';
	});
});

aprilStar.addEventListener('click', () => {
	const isOpen = !aprilPanel.hidden;
	aprilPanel.hidden = isOpen;
	aprilStar.setAttribute('aria-expanded', String(!isOpen));
	aprilStar.setAttribute('aria-label', isOpen ? 'Open April portfolio assistant' : 'Close April portfolio assistant');
});

const aprilForm = document.querySelector('#april-form');
const aprilPrompt = document.querySelector('#april-prompt');
const aprilMessages = document.querySelector('.april-messages');

function addAprilMessage(text, type) {
	const message = document.createElement('div');
	message.className = `april-message april-message-${type}`;
	message.textContent = text;
	aprilMessages.appendChild(message);
	aprilMessages.scrollTop = aprilMessages.scrollHeight;
}

aprilForm.addEventListener('submit', async (event) => {
	event.preventDefault();
	const prompt = aprilPrompt.value.trim();
	if (!prompt) return;
	addAprilMessage(prompt, 'user');
	aprilPrompt.value = '';
	addAprilMessage('Thinking...', 'ai');
	const thinkingMessage = aprilMessages.lastElementChild;
	try {
		const response = await fetch('/api/april', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ prompt })
		});
		const data = await response.json();
		if (!response.ok) throw new Error(data.error?.message || 'Gemini could not answer right now.');
		thinkingMessage.textContent = data.candidates?.[0]?.content?.parts?.[0]?.text || 'I could not find an answer in the portfolio context.';
	} catch (error) {
		thinkingMessage.classList.add('april-message-error');
		thinkingMessage.textContent = error.message;
	}
});
