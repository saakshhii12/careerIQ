export const speak = (text, onEnd) => {
  if (!window.speechSynthesis) return;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);

  utterance.lang = "en-US";
  utterance.rate = 0.95;
  utterance.pitch = 1;

  const voices = window.speechSynthesis.getVoices();

  if (voices.length > 0) {
    utterance.voice = voices[0];
  }

  utterance.onend = () => {
    if (onEnd) {
      onEnd();
    }
  };

  window.speechSynthesis.speak(utterance);
};