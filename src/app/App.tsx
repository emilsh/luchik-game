import { useCallback, useEffect, useState } from 'react';
import type { Screen } from './routes';
import { useProgress } from './useProgress';
import { audio } from '../game/systems/AudioManager';
import { input } from '../game/systems/InputController';
import { unlockSpeech } from '../game/systems/Speech';
import { MainMenu } from '../components/MainMenu';
import { LevelSelect } from '../components/LevelSelect';
import { GameScreen } from '../components/GameScreen';
import { Collection } from '../components/Collection';
import { ParentDashboard } from '../components/ParentDashboard';

export function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'menu' });
  const save = useProgress();

  // Звук и речь в Safari разрешены только после жеста пользователя.
  useEffect(() => {
    input.attachKeyboard();
    let unlocked = false;
    const unlock = () => {
      audio.unlock();
      if (!unlocked) unlockSpeech();
      unlocked = true;
    };
    window.addEventListener('pointerdown', unlock, true);
    window.addEventListener('keydown', unlock, true);

    // Никакой прокрутки, «резинки» и масштабирования жестами во время игры.
    const noScroll = (e: TouchEvent) => {
      const t = e.target as Element | null;
      if (!t || !t.closest('.scrollable')) e.preventDefault();
    };
    const noGesture = (e: Event) => e.preventDefault();
    const noMenu = (e: Event) => {
      const t = e.target as Element | null;
      if (!t || !t.closest('input')) e.preventDefault();
    };
    document.addEventListener('touchmove', noScroll, { passive: false });
    document.addEventListener('gesturestart', noGesture);
    document.addEventListener('contextmenu', noMenu);
    return () => {
      window.removeEventListener('pointerdown', unlock, true);
      window.removeEventListener('keydown', unlock, true);
      document.removeEventListener('touchmove', noScroll);
      document.removeEventListener('gesturestart', noGesture);
      document.removeEventListener('contextmenu', noMenu);
    };
  }, []);

  useEffect(() => {
    audio.setSound(save.settings.sound);
    audio.setMusic(save.settings.music);
  }, [save.settings.sound, save.settings.music]);

  useEffect(() => {
    if (screen.name === 'game') audio.stopMusic();
    else audio.startMusic();
  }, [screen.name]);

  const go = useCallback((s: Screen) => {
    audio.play('click');
    setScreen(s);
  }, []);

  switch (screen.name) {
    case 'menu':
      return <MainMenu go={go} />;
    case 'levels':
      return <LevelSelect go={go} />;
    case 'game':
      return <GameScreen key={screen.levelId} levelId={screen.levelId} go={go} />;
    case 'collection':
      return <Collection go={go} />;
    case 'parents':
      return <ParentDashboard go={go} />;
  }
}
