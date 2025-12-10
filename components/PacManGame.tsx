import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ArrowLeft, RotateCcw, Volume2, VolumeX } from 'lucide-react';

interface PacManGameProps {
  onBack: () => void;
}

const MAP = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,0],
  [0,1,0,0,1,0,0,0,1,0,1,0,0,0,1,0,0,1,1,0],
  [0,3,0,0,1,0,0,0,1,0,1,0,0,0,1,0,0,1,3,0],
  [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
  [0,1,0,0,1,0,1,0,0,0,0,0,1,0,1,0,0,1,1,0],
  [0,1,1,1,1,0,1,1,1,0,1,1,1,0,1,1,1,1,1,0],
  [0,0,0,0,1,0,0,0,2,2,2,0,0,0,1,0,0,0,0,0],
  [0,2,2,2,1,0,2,2,2,8,2,2,2,0,1,2,2,2,2,0],
  [0,0,0,0,1,0,2,0,0,2,0,0,2,0,1,0,0,0,0,0],
  [0,1,1,1,1,1,1,1,2,9,2,1,1,1,1,1,1,1,1,0],
  [0,1,0,0,1,0,0,0,1,0,1,0,0,0,1,0,0,1,1,0],
  [0,1,1,0,1,1,1,1,1,0,1,1,1,1,1,0,1,1,1,0],
  [0,0,1,0,1,0,1,0,0,0,0,0,1,0,1,0,1,0,0,0],
  [0,1,1,1,1,0,1,1,1,0,1,1,1,0,1,1,1,1,1,0],
  [0,3,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0,3,0],
  [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];
const TILE_SIZE = 24;
const PACMAN_SPEED = 2;
const GHOST_SPEED = 1;
const CORNER_ASSIST = 8;

export const PacManGame: React.FC<PacManGameProps> = ({ onBack }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [win, setWin] = useState(false);
  
  // Bildirim State'i
  const [showLevelUp, setShowLevelUp] = useState(false);
  
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const keysPressed = useRef<Set<string>>(new Set());
  const gameState = useRef({
    player: { x: 0, y: 0, dir: { x: 0, y: 0 }, nextDir: { x: 0, y: 0 }, angle: 0 },
    ghosts: [] as { x: number, y: number, color: string, dir: { x: number, y: number } }[],
    map: JSON.parse(JSON.stringify(MAP)),
    dotsRemaining: 0,
    frameCount: 0,
    active: true,
    currentScore: 0,
    currentLevel: 1
  });

  useEffect(() => {
    audioRef.current = new Audio('/Starcourt - Kyle Dixon & Michael Stein - Stranger Things 3  Lakeshore Records - Lakeshore Records (1).mp3'); 
    audioRef.current.loop = true;
    audioRef.current.volume = 0.5;

    const tryPlay = async () => {
      if (audioRef.current && !isMuted && gameState.current.active) {
        try { await audioRef.current.play(); } catch (e) { console.log(e); }
      }
    };
    tryPlay();

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, []);

  useEffect(() => {
    if (!audioRef.current) return;
    if (isMuted) audioRef.current.pause();
    else if (gameState.current.active && !gameOver && !win) audioRef.current.play().catch(()=>{});
  }, [isMuted, gameOver, win]);
  
  const toggleMute = () => setIsMuted(!isMuted);

  // Bu fonksiyon SADECE oyun ilk başladığında veya öldüğünde çağrılacak.
  // Level atladığında ÇAĞRILMAYACAK.
  const resetLevel = useCallback(() => {
    let pStart = { x: 10, y: 10 };
    let gStarts: {x:number, y:number}[] = [];
    let dots = 0;
    const newMap = JSON.parse(JSON.stringify(MAP));

    for(let r=0; r<MAP.length; r++) {
      for(let c=0; c<MAP[0].length; c++) {
        if(MAP[r][c] === 9) pStart = { x: c, y: r };
        if(MAP[r][c] === 8) gStarts.push({ x: c, y: r });
        if(MAP[r][c] === 1 || MAP[r][c] === 3) dots++;
      }
    }

    gameState.current.player = {
      x: pStart.x * TILE_SIZE + TILE_SIZE/2,
      y: pStart.y * TILE_SIZE + TILE_SIZE/2,
      dir: { x: 0, y: 0 },
      nextDir: { x: 0, y: 0 },
      angle: 0
    };

    const ghosts = gStarts.map((s, i) => ({
      x: s.x * TILE_SIZE + TILE_SIZE/2,
      y: s.y * TILE_SIZE + TILE_SIZE/2,
      color: i === 0 ? '#FF0000' : i === 1 ? '#00FFFF' : '#FFB8FF',
      dir: { x: Math.random() > 0.5 ? 1 : -1, y: 0 }
    }));

    gameState.current.ghosts = ghosts;
    gameState.current.map = newMap;
    gameState.current.dotsRemaining = dots;
    gameState.current.active = true;
    gameState.current.currentLevel = 1;
    keysPressed.current.clear();
    
    if(audioRef.current && !isMuted) audioRef.current.play().catch(()=>{});
  }, [isMuted]);

  useEffect(() => {
    resetLevel(); // Sadece ilk yüklemede çalışır
    
    const handleKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if(["arrowup","arrowdown","arrowleft","arrowright", " ", "w","a","s","d"].includes(k)) {
          if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight", " "].includes(e.key)) e.preventDefault();
      }
      if (!gameState.current.active) return;
      keysPressed.current.add(k);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key.toLowerCase());
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    let animationFrameId: number;

    const gameLoop = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      if (!gameState.current.active) {
        if(audioRef.current) audioRef.current.pause();
        animationFrameId = requestAnimationFrame(gameLoop);
        return;
      }

      gameState.current.frameCount++;
      const { player, ghosts, map } = gameState.current;
      const isWall = (c: number, r: number) => {
        if (r < 0 || r >= map.length || c < 0 || c >= map[0].length) return true;
        return map[r][c] === 0;
      };

      // --- HAREKET ---
      let wantX = 0;
      let wantY = 0;

      if (keysPressed.current.has('arrowup') || keysPressed.current.has('w')) wantY = -1;
      else if (keysPressed.current.has('arrowdown') || keysPressed.current.has('s')) wantY = 1;
      if (keysPressed.current.has('arrowleft') || keysPressed.current.has('a')) wantX = -1;
      else if (keysPressed.current.has('arrowright') || keysPressed.current.has('d')) wantX = 1;

      if (wantX !== 0) player.nextDir = { x: wantX, y: 0 };
      if (wantY !== 0) player.nextDir = { x: 0, y: wantY };
      if (wantX === 0 && wantY === 0) {
          player.nextDir = { x: 0, y: 0 };
      }

      const col = Math.floor(player.x / TILE_SIZE);
      const row = Math.floor(player.y / TILE_SIZE);
      const cellCenterX = col * TILE_SIZE + TILE_SIZE / 2;
      const cellCenterY = row * TILE_SIZE + TILE_SIZE / 2;
      const diffX = Math.abs(player.x - cellCenterX);
      const diffY = Math.abs(player.y - cellCenterY);

      const canTurn = (dx: number, dy: number) => !isWall(col + dx, row + dy);

      if (player.nextDir.x === 0 && player.nextDir.y === 0) {
          if (diffX <= PACMAN_SPEED && diffY <= PACMAN_SPEED) {
              player.x = cellCenterX;
              player.y = cellCenterY;
              player.dir = { x: 0, y: 0 };
          }
      } 
      else if (player.nextDir.x !== 0 || player.nextDir.y !== 0) {
          if ((player.nextDir.x === -player.dir.x && player.nextDir.x !== 0) || 
              (player.nextDir.y === -player.dir.y && player.nextDir.y !== 0)) {
               player.dir = player.nextDir;
          } 
          else {
              const nearCenterX = diffX <= CORNER_ASSIST;
              const nearCenterY = diffY <= CORNER_ASSIST;

              if (player.nextDir.x !== 0 && nearCenterY && canTurn(player.nextDir.x, 0)) {
                  player.y = cellCenterY;
                  player.dir = player.nextDir;
              }
              else if (player.nextDir.y !== 0 && nearCenterX && canTurn(0, player.nextDir.y)) {
                  player.x = cellCenterX;
                  player.dir = player.nextDir;
              }
          }
      }

      const nextX = player.x + player.dir.x * PACMAN_SPEED;
      const nextY = player.y + player.dir.y * PACMAN_SPEED;
      
      const lookAhead = 12; 
      const checkCol = Math.floor((nextX + player.dir.x * lookAhead) / TILE_SIZE);
      const checkRow = Math.floor((nextY + player.dir.y * lookAhead) / TILE_SIZE);

      if (!isWall(checkCol, checkRow)) {
          player.x = nextX;
          player.y = nextY;
      } else {
          if (diffX < PACMAN_SPEED && diffY < PACMAN_SPEED) {
              player.x = cellCenterX;
              player.y = cellCenterY;
          }
      }

      // YEM YEME VE LEVEL ATLAMA MANTIĞI
      const curCol = Math.floor(player.x / TILE_SIZE);
      const curRow = Math.floor(player.y / TILE_SIZE);
      if (curRow >= 0 && curRow < map.length && curCol >= 0 && curCol < map[0].length) {
         let scoreGain = 0;
         if (map[curRow][curCol] === 1) {
            map[curRow][curCol] = 2; // Yendi olarak işaretle
            scoreGain = 10;
            gameState.current.dotsRemaining--;
         } else if (map[curRow][curCol] === 3) {
            map[curRow][curCol] = 2; // Yendi olarak işaretle
            scoreGain = 50;
            gameState.current.dotsRemaining--;
         }

         if (scoreGain > 0) {
            gameState.current.currentScore += scoreGain;
            setScore(gameState.current.currentScore);
            
            // HER 300 PUANDA BİR LEVEL ATLA
            // Yemleri YENİLEMEDEN, pozisyonu SIFIRLAMADAN
            if (gameState.current.currentScore >= gameState.current.currentLevel * 300) {
                 // Level arttır
                 gameState.current.currentLevel++;
                 setLevel(gameState.current.currentLevel); // UI update
                 
                 // Bildirimi göster (1 saniye sonra kapa)
                 setShowLevelUp(true);
                 setTimeout(() => setShowLevelUp(false), 1000);

                 // YENİ HAYALET EKLE (Oyun Durmadan)
                 let placed = false;
                 let attempts = 0;
                 while(!placed && attempts < 50) {
                    const rr = Math.floor(Math.random() * (MAP.length - 2)) + 1;
                    const rc = Math.floor(Math.random() * (MAP[0].length - 2)) + 1;
                    const pCol = Math.floor(player.x / TILE_SIZE);
                    const pRow = Math.floor(player.y / TILE_SIZE);
                    // Oyuncuya çok yakın spawn olmasın
                    const dist = Math.sqrt(Math.pow(rr - pRow, 2) + Math.pow(rc - pCol, 2));
                    
                    if (gameState.current.map[rr][rc] !== 0 && dist > 6) {
                        gameState.current.ghosts.push({
                            x: rc * TILE_SIZE + TILE_SIZE/2,
                            y: rr * TILE_SIZE + TILE_SIZE/2,
                            color: '#FF8800', 
                            dir: { x: Math.random() > 0.5 ? 1 : -1, y: 0 }
                        });
                        placed = true;
                    }
                    attempts++;
                 }
            }
         }
      }

      // Tüm yemler biterse oyun burada "Win" olmuyor, sonsuz devam ediyor (Kullanıcı isteği)
      // Ancak skor kazanacak yem kalmazsa level atlayamaz.
      // Kullanıcının "yemler yenilenmesin" isteğine sadık kalındı.

      // Hayaletler
      ghosts.forEach(g => {
        const gNextX = g.x + g.dir.x * GHOST_SPEED;
        const gNextY = g.y + g.dir.y * GHOST_SPEED;
        const gCol = Math.floor(gNextX / TILE_SIZE);
        const gRow = Math.floor(gNextY / TILE_SIZE);
        const gOffsetX = gNextX - (Math.floor(gNextX/TILE_SIZE)*TILE_SIZE + TILE_SIZE/2);
        const gOffsetY = gNextY - (Math.floor(gNextY/TILE_SIZE)*TILE_SIZE + TILE_SIZE/2);
        const gDist = Math.sqrt(gOffsetX*gOffsetX + gOffsetY*gOffsetY);

        let changeDir = false;
        const gLeadX = gNextX + g.dir.x * 11;
        const gLeadY = gNextY + g.dir.y * 11;
        if (isWall(Math.floor(gLeadX/TILE_SIZE), Math.floor(gLeadY/TILE_SIZE))) changeDir = true;
        else if (gDist <= GHOST_SPEED && Math.random() < 0.3) {
           const openPaths = [
             !isWall(gCol+1, gRow), !isWall(gCol-1, gRow),
             !isWall(gCol, gRow+1), !isWall(gCol, gRow-1)
           ].filter(Boolean).length;
           if (openPaths > 2) changeDir = true;
        }

        if (changeDir) {
           const currentGCol = Math.floor(g.x / TILE_SIZE);
           const currentGRow = Math.floor(g.y / TILE_SIZE);
           g.x = currentGCol * TILE_SIZE + TILE_SIZE/2;
           g.y = currentGRow * TILE_SIZE + TILE_SIZE/2;
           const dirs = [{x:1, y:0}, {x:-1, y:0}, {x:0, y:1}, {x:0, y:-1}];
           const validDirs = dirs.filter(d => !isWall(currentGCol + d.x, currentGRow + d.y));
           if (validDirs.length > 0) {
             const nonReverse = validDirs.filter(d => d.x !== -g.dir.x || d.y !== -g.dir.y);
             g.dir = nonReverse.length > 0 ? nonReverse[Math.floor(Math.random() * nonReverse.length)] : validDirs[Math.floor(Math.random() * validDirs.length)];
           }
        } else {
           g.x = gNextX;
           g.y = gNextY;
        }

        const dist = Math.sqrt(Math.pow(g.x - player.x, 2) + Math.pow(g.y - player.y, 2));
        if (dist < TILE_SIZE * 0.8) {
           setLives(l => {
             const newLives = l - 1;
             if (newLives <= 0) {
               setGameOver(true);
               gameState.current.active = false;
             } 
             else {
                // Sadece ölünce reset atılıyor
                resetLevel();
             }
             return newLives;
           });
        }
      });

      // Çizim
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for(let r=0; r<map.length; r++) {
        for(let c=0; c<map[0].length; c++) {
          const val = map[r][c];
          const x = c * TILE_SIZE;
          const y = r * TILE_SIZE;
          if (val === 0) {
            ctx.strokeStyle = '#000088';
            ctx.lineWidth = 2;
            ctx.strokeRect(x + 4, y + 4, TILE_SIZE - 8, TILE_SIZE - 8);
          } else if (val === 1) {
            ctx.fillStyle = '#FFD700';
            ctx.fillRect(x + TILE_SIZE/2 - 2, y + TILE_SIZE/2 - 2, 4, 4);
          } else if (val === 3) {
            ctx.fillStyle = '#FFA500';
            ctx.beginPath();
            ctx.arc(x + TILE_SIZE/2, y + TILE_SIZE/2, 6, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      ghosts.forEach(g => {
        ctx.fillStyle = g.color;
        ctx.beginPath();
        ctx.arc(g.x, g.y, 10, Math.PI, 0);
        ctx.lineTo(g.x + 10, g.y + 10);
        ctx.lineTo(g.x - 10, g.y + 10);
        ctx.fill();
        ctx.fillStyle = 'white';
        ctx.fillRect(g.x - 5, g.y - 3, 3, 3);
        ctx.fillRect(g.x + 2, g.y - 3, 3, 3);
      });
      const isMoving = player.dir.x !== 0 || player.dir.y !== 0;
      ctx.fillStyle = '#FFFF00';
      ctx.beginPath();
      const mouth = isMoving ?
      (Math.sin(gameState.current.frameCount * 0.2) + 1) * 0.2 * Math.PI : 0.2 * Math.PI;
      let angle = 0;
      if (player.dir.x === 1) angle = 0;
      if (player.dir.x === -1) angle = Math.PI;
      if (player.dir.y === 1) angle = Math.PI/2;
      if (player.dir.y === -1) angle = -Math.PI/2;
      
      if (!isMoving) {
        if (keysPressed.current.has('arrowright') || keysPressed.current.has('d')) angle = 0;
        else if (keysPressed.current.has('arrowleft') || keysPressed.current.has('a')) angle = Math.PI;
        else if (keysPressed.current.has('arrowdown') || keysPressed.current.has('s')) angle = Math.PI/2;
        else if (keysPressed.current.has('arrowup') || keysPressed.current.has('w')) angle = -Math.PI/2;
      }

      ctx.arc(player.x, player.y, 11, angle + mouth, angle + 2*Math.PI - mouth);
      ctx.lineTo(player.x, player.y);
      ctx.fill();

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(animationFrameId);
    };
  }, [resetLevel]); 

  const handleReset = () => {
    setScore(0);
    setLives(3);
    setLevel(1);
    gameState.current.currentScore = 0;
    setGameOver(false);
    setWin(false);
    resetLevel();
  };

  return (
    <div className="relative flex flex-col items-center justify-center h-full w-full bg-slate-900 font-retro">
      <div className="absolute top-4 left-4 flex gap-4 z-10">
        <button onClick={onBack} className="flex items-center gap-2 text-white hover:text-red-500 transition-colors">
          <ArrowLeft /> Back to Arcade
        </button>
      </div>

      <div className="absolute top-4 right-4 flex gap-4 z-10">
        <button onClick={toggleMute} className="flex items-center gap-2 text-white hover:text-yellow-400 transition-colors p-2 bg-black/50 rounded-full">
          {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
        </button>
      </div>

      <div className="mb-4 text-center">
        <h2 className="text-yellow-400 text-2xl mb-2 animate-pulse">WAFFLE-MAN</h2>
        <div className="flex gap-8 text-white">
          <p>SCORE: {score}</p>
          <p>LEVEL: {level}</p>
          <p>LIVES: {lives}</p>
        </div>
      </div>

      <div className="relative border-4 border-slate-700 rounded-lg p-1 bg-black shadow-[0_0_20px_rgba(255,0,0,0.3)]">
        <canvas 
          ref={canvasRef} 
          width={MAP[0].length * TILE_SIZE} 
          height={MAP.length * TILE_SIZE}
          className="block"
        />
        
        {/* LEVEL UP BİLDİRİMİ */}
        {showLevelUp && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
             <div className="bg-yellow-400/80 text-black font-bold text-4xl px-8 py-4 rounded animate-bounce shadow-[0_0_30px_rgba(255,255,0,0.8)]">
                LEVEL UP!
             </div>
          </div>
        )}

        {(gameOver || win) && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-center z-30">
            <h3 className={`text-4xl mb-4 ${win ? 'text-green-500' : 'text-red-600'}`}>
              {win ? 'GAME COMPLETED!' : 'GAME OVER'}
            </h3>
            <p className="text-white mb-6">Final Score: {score}</p>
            <button 
              onClick={handleReset}
              className="px-6 py-3 bg-red-700 hover:bg-red-600 text-white rounded flex items-center gap-2 transition"
            >
              <RotateCcw size={16} /> Play Again
            </button>
          </div>
        )}
      </div>
      
      <div className="mt-4 text-slate-500 text-xs text-center">
        HOLD KEYS TO MOVE
      </div>
    </div>
  );
};