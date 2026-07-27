export const NOTIFICATION_SOUNDS_MAP = {
  'Default Pulse': 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3',
  'Neural Ping': 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
  'Digital Alert': 'https://assets.mixkit.co/active_storage/sfx/1004/1004-preview.mp3',
  'Success Chime': 'https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3',
  'Ambient Bell': 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3'
};

export const playNotificationSound = (soundName = 'Default Pulse') => {
  const url = NOTIFICATION_SOUNDS_MAP[soundName] || NOTIFICATION_SOUNDS_MAP['Default Pulse'];
  const audio = new Audio(url);
  audio.play().catch(err => {
    console.warn('Audio playback prevented by browser policy. Interaction required.', err);
  });
};
