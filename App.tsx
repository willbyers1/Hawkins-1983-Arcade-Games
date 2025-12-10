import React, { useState, useEffect, useRef } from 'react';
import { GameState } from './types';
import { PacManGame } from './components/PacManGame';
import { MarioGame } from './components/MarioGame';
import { Scanlines } from './components/Scanlines';
import { Gamepad2, Ghost, Volume2, VolumeX } from 'lucide-react';

const App: React.FC = () => {
  // --- STATE YÖNETİMİ ---
  const [gameStarted, setGameStarted] = useState(false); // Siyah giriş ekranı için
  const [currentScreen, setCurrentScreen] = useState<GameState>(GameState.MENU);
  const [isMuted, setIsMuted] = useState(false); // Ses durumu artık burada yönetiliyor
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // --- OYUNU BAŞLATMA (İLK TIKLAMA) ---
  const initGame = () => {
    // 1. Müzik dosyasını doğru yoldan yükle
    audioRef.current = new Audio('/Hawkins-1983-Arcade-Games/kids.mp3');
    audioRef.current.loop = true;
    audioRef.current.volume = 0.5;

    // 2. Müziği başlat (Kullanıcı tıkladığı için izin verilir)
    if (!isMuted) {
      audioRef.current.play().catch(e => console.log("Müzik başlatma hatası:", e));
    }

    // 3. Menüyü göster
    setGameStarted(true);
  };

  // --- SES KONTROLÜ ---
  // isMuted veya currentScreen değişince ne olacağını yönetir
  useEffect(() => {
    if (!audioRef.current || !gameStarted) return;

    if (isMuted) {
      // Eğer sessize alındıysa her durumda durdur
      audioRef.current.pause();
    } else {
      // Ses açıksa:
      // Sadece MENÜDEYKEN ana müziği çal.
      // Oyuna girince ana müziği durdur (Oyunun kendi müziği çalacak)
      if (currentScreen === GameState.MENU) {
        audioRef.current.play().catch(e => console.log("Oynatma hatası:", e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isMuted, currentScreen, gameStarted]);

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  // --- EKRANLARI GÖSTERME ---
  const renderScreen = () => {
    switch (currentScreen) {
      case GameState.PACMAN:
        // isMuted bilgisini oyuna gönderiyoruz
        // @ts-ignore (PacmanGame'de prop tanımı eksikse hata vermesin diye)
        return <PacManGame onBack={() => setCurrentScreen(GameState.MENU)} isMuted={isMuted} />;
      
      case GameState.MARIO:
        // isMuted bilgisini oyuna gönderiyoruz
        // @ts-ignore (MarioGame'de prop tanımı eksikse hata vermesin diye)
        return <MarioGame onBack={() => setCurrentScreen(GameState.MENU)} isMuted={isMuted} />;
      
      case GameState.MENU:
      default:
        return (
          <div className="relative z-10 flex flex-col items-center justify-center h-full w-full p-8 text-center">
            <header className="mb-12 animate-pulse">
              <h1 className="font-stranger text-6xl md:text-8xl text-red-600 text-glow-red mb-2 tracking-tighter">
                STRANGER
              </h1>
              <h1 className="font-stranger text-6xl md:text-8xl text-red-600 text-glow-red tracking-widest uppercase scale-x-110 transform origin-center">
                GAMES
              </h1>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
              <button
                onClick={() => setCurrentScreen(GameState.PACMAN)}
                className="group relative bg-slate-900/80 border-2 border-slate-700 hover:border-yellow-400 p-8 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,0,0.3)] flex flex-col items-center gap-4 overflow-hidden"
              >
                <div className="absolute inset-0 bg-yellow-900/10 group-hover:bg-yellow-900/20 transition-colors"></div>
                <Ghost size={64} className="text-yellow-400 group-hover:animate-bounce" />
                <h2 className="font-retro text-2xl text-yellow-400 z-10">WAFFLE-MAN</h2>
                <p className="font-mono text-sm text-slate-400 z-10">
                  Collect the Eggos. Avoid the Demodogs.
                </p>
                <div className="mt-4 px-4 py-2 bg-yellow-600/20 text-yellow-400 rounded text-xs font-bold font-retro animate-pulse">
                  INSERT COIN
                </div>
              </button>

              <button
                onClick={() => setCurrentScreen(GameState.MARIO)}
                className="group relative bg-slate-900/80 border-2 border-slate-700 hover:border-red-600 p-8 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-[0_0_30px_rgba(255,0,0,0.3)] flex flex-col items-center gap-4 overflow-hidden"
              >
                <div className="absolute inset-0 bg-red-900/10 group-hover:bg-red-900/20 transition-colors"></div>
                <Gamepad2 size={64} className="text-red-500 group-hover:animate-spin" />
                <h2 className="font-retro text-2xl text-red-500 z-10">SUPER HOPPER</h2>
                <p className="font-mono text-sm text-slate-400 z-10">
                  Jump through the Upside Down. Find the portal.
                </p>
                <div className="mt-4 px-4 py-2 bg-red-900/20 text-red-500 rounded text-xs font-bold font-retro animate-pulse">
                  INSERT COIN
                </div>
              </button>
            </div>

            <footer className="absolute bottom-8 text-slate-600 font-mono text-xs">
              HAWKINS ARCADE © 1985
            </footer>
          </div>
        );
    }
  };

  // --- SİYAH GİRİŞ EKRANI (CLICK TO START) ---
  if (!gameStarted) {
    return (
      <div 
        onClick={initGame}
        className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center cursor-pointer"
      >
        <Scanlines />
        <h1 className="font-stranger text-6xl md:text-8xl text-red-600 text-glow-red animate-pulse mb-8">
          HAWKINS ARCADE
        </h1>
        <p className="font-retro text-white text-xl md:text-2xl animate-bounce">
          CLICK TO START
        </p>
      </div>
    );
  }

  // --- ANA OYUN EKRANI ---
  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-black to-black opacity-80 z-0"></div>

      <Scanlines />
      
      {/* GLOBAL MUTE BUTONU (Her yerde görünür, oyunu resetlemez) */}
      <button
        onClick={toggleMute}
        className="absolute top-4 right-4 z-50 p-2 text-white/50 hover:text-white transition-colors bg-black/20 rounded-full hover:bg-black/50"
      >
        {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
      </button>

      <main className="relative z-10 w-full h-full">
        {renderScreen()}
      </main>
    </div>
  );
};

export default App;