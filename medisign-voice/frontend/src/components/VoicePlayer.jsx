import { useLanguage } from '../context/LanguageContext';
import { playMessageVoice } from '../utils/voice';

export default function VoicePlayer({ request, text, label, onPlay }) {
  const { lang } = useLanguage();
  const displayText = text || request?.improvedMessage || request?.rawMessage;

  const handlePlay = () => {
    if (onPlay) onPlay(request || { improvedMessage: displayText });
    else if (request) playMessageVoice(request, lang);
    else playMessageVoice({ improvedMessage: displayText }, lang);
  };

  return (
    <button type="button" className="btn btn-voice" onClick={handlePlay}>
      🔊 {label || 'Play'}
    </button>
  );
}
