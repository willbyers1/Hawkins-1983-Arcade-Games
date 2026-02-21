import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Entity } from '../types';

interface MarioGameProps {
  onBack: () => void;
  isMuted: boolean;
}

const GRAVITY = 0.6;
const JUMP_FORCE = -12;
const MOVE_SPEED = 5;
const MAX_FALL_SPEED = 12;
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 450;
const LEVEL_LENGTH = 200; 

export const MarioGame: React.FC<MarioGameProps> = ({ onBack, isMuted }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'playing' | 'gameover' | 'won'>('playing');
  
  // Ses Referansı
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Oyun değişkenleri
  const playerRef = useRef<Entity>({
    x: 50, y: 300, width: 30, height: 30, vx: 0, vy: 0, color: '#ff3333'
  });
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const cameraRef = useRef({ x: 0 });

  const platformsRef = useRef<Entity[]>([]);
  const enemiesRef = useRef<Entity[]>([]);
  const goalRef = useRef<Entity>({ x: 0, y: 0, width: 30, height: 50, vx: 0, vy: 0, color: '#ff0000', type: 'exit' });

  // Bölümü Oluşturma
  const generateLevel = () => {
    const platforms: Entity[] = [];
    const enemies: Entity[] = [];

    for (let i = 0; i < LEVEL_LENGTH; i++) {
        const offset = i * 800;
        platforms.push({ x: offset, y: 400, width: 800, height: 50, vx:0, vy:0, color: '#2a1a1a' });
        
        if (i % 2 === 0) {
            platforms.push({ x: offset + 200, y: 320, width: 100, height: 20, vx:0, vy:0, color: '#4a3a3a' });
            platforms.push({ x: offset + 400, y: 250, width: 100, height: 20, vx:0, vy:0, color: '#4a3a3a' });
        } else {
            platforms.push({ x: offset + 150, y: 350, width: 50, height: 20, vx:0, vy:0, color: '#4a3a3a' });
            platforms.push({ x: offset + 300, y: 280, width: 150, height: 20, vx:0, vy:0, color: '#4a3a3a' });
            platforms.push({ x: offset + 600, y: 200, width: 100, height: 20, vx:0, vy:0, color: '#4a3a3a' });
        }

        if (i > 0) {
            enemies.push({ 
                x: offset + 300 + Math.random() * 200, 
                y: 370, width: 30, height: 30, vx: 2, vy: 0, color: '#331111', type: 'enemy' 
            });
            if (Math.random() > 0.5) {
                enemies.push({ 
                    x: offset + 600 + Math.random() * 100, 
                    y: 370, width: 30, height: 30, vx: -2, vy: 0, color: '#331111', type: 'enemy' 
                });
            }
        }
    }
    const endX = LEVEL_LENGTH * 800;
    platforms.push({ x: endX - 50, y: 300, width: 50, height: 100, vx:0, vy:0, color: '#880000' });
    platformsRef.current = platforms;
    enemiesRef.current = enemies;
    goalRef.current = { x: endX - 40, y: 250, width: 30, height: 50, vx: 0, vy: 0, color: '#ff0000', type: 'exit' };
  };

  // --- SES KURULUMU (DÜZELTİLDİ) ---
  useEffect(() => {
    audioRef.current = new Audio('/Hawkins-1983-Arcade-Games/breathe.mp3');
    audioRef.current.loop = true;
    audioRef.current.volume = 0.5;

    if (!isMuted) {
        audioRef.current.play().catch(e => console.log("Audio play error:", e));
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, []); 

  // --- SES KONTROLÜ (App.tsx'ten gelen emri dinler) ---
  useEffect(() => {
    if (!audioRef.current) return;
    
    if (isMuted || gameState !== 'playing') {
        audioRef.current.pause();
    } else {
        audioRef.current.play().catch(e => console.log("Resume error:", e));
    }
  }, [isMuted, gameState]);


  const resetGame = () => {
    playerRef.current = { x: 50, y: 300, width: 30, height: 30, vx: 0, vy: 0, color: '#ff3333' };
    cameraRef.current = { x: 0 };
    setGameState('playing');
    generateLevel(); 
  };

  useEffect(() => {
    generateLevel();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight", "Space", "KeyW", "KeyA", "KeyS", "KeyD"].includes(e.code)) {
            e.preventDefault();
        }
        keysRef.current[e.code] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => keysRef.current[e.code] = false;
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    let animationFrameId: number;

    const checkCollision = (r1: Entity, r2: Entity) => {
      return (
        r1.x < r2.x + r2.width && r1.x + r1.width > r2.x &&
        r1.y < r2.y + r2.height && r1.y + r1.height > r2.y
      );
    };

    const loop = () => {
      if (gameState !== 'playing') return;

      const player = playerRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!ctx || !canvas) return;

      // HAREKET
      if (keysRef.current['ArrowRight'] || keysRef.current['KeyD']) {
         if (player.vx < MOVE_SPEED) player.vx++;
      } else if (keysRef.current['ArrowLeft'] || keysRef.current['KeyA']) {
         if (player.vx > -MOVE_SPEED) player.vx--;
      } else {
         player.vx *= 0.8; 
      }

      if (player.vx > MOVE_SPEED) player.vx = MOVE_SPEED;
      if (player.vx < -MOVE_SPEED) player.vx = -MOVE_SPEED;
      player.x += player.vx;
      
      const visibleRange = 1000;
      platformsRef.current.forEach(plat => {
        if (Math.abs(plat.x - player.x) > visibleRange) return;
        if (checkCollision(player, plat)) {
          if (player.vx > 0) player.x = plat.x - player.width;
          else if (player.vx < 0) player.x = plat.x + plat.width;
          player.vx = 0;
        }
      });

      player.vy += GRAVITY;
      if (player.vy > MAX_FALL_SPEED) player.vy = MAX_FALL_SPEED;
      player.y += player.vy;
      
      let grounded = false;
      platformsRef.current.forEach(plat => {
        if (Math.abs(plat.x - player.x) > visibleRange) return;
        if (checkCollision(player, plat)) {
           const prevY = player.y - player.vy;
           if (prevY + player.height <= plat.y + 10) { 
              player.y = plat.y - player.height;
              grounded = true;
              player.vy = 0;
            } else if (prevY >= plat.y + plat.height) {
              player.y = plat.y + plat.height;
              player.vy = 0;
           }
        }
      });

      if ((keysRef.current['ArrowUp'] || keysRef.current['Space'] || keysRef.current['KeyW']) && grounded) {
         player.vy = JUMP_FORCE;
      }

      if (player.y > CANVAS_HEIGHT + 100) setGameState('gameover');

      // DÜŞMANLAR
      enemiesRef.current.forEach(enemy => {
        if (enemy.x < cameraRef.current.x - 100 || enemy.x > cameraRef.current.x + CANVAS_WIDTH + 100) return;
        enemy.x += enemy.vx;

        platformsRef.current.forEach(plat => {
          if (Math.abs(plat.x - enemy.x) > 200) return;
          if (checkCollision(enemy, plat)) {
             if (enemy.vx > 0) { enemy.x = plat.x - enemy.width; enemy.vx *= -1; }
             else if (enemy.vx < 0) { enemy.x = plat.x + plat.width; enemy.vx *= -1; }
          }
        });

        if (checkCollision(player, enemy)) {
           const wasAbove = (player.y - player.vy) + player.height <= enemy.y + (enemy.height * 0.5);
           if (player.vy > 0 && wasAbove) {
             player.vy = -8;
             enemy.y = 2000;
          } else {
             setGameState('gameover');
          }
        }
      });

      if (checkCollision(player, goalRef.current)) setGameState('won');

      // KAMERA
      const targetCamX = player.x - CANVAS_WIDTH / 3;
      cameraRef.current.x += (targetCamX - cameraRef.current.x) * 0.1;
      if (cameraRef.current.x < 0) cameraRef.current.x = 0;

      // ÇİZİM
      ctx.fillStyle = '#0f0f15';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.save();
      ctx.translate(-Math.floor(cameraRef.current.x), 0);
      
      ctx.fillStyle = '#3a2a2a';
      platformsRef.current.forEach(p => {
        if (p.x + p.width > cameraRef.current.x && p.x < cameraRef.current.x + CANVAS_WIDTH) {
            ctx.fillRect(p.x, p.y, p.width, p.height);
            ctx.strokeStyle = '#553333';
            ctx.lineWidth = 2;
            ctx.strokeRect(p.x, p.y, p.width, p.height);
        }
      });

      enemiesRef.current.forEach(e => {
        if(e.y > 1000) return;
        if (e.x + e.width > cameraRef.current.x && e.x < cameraRef.current.x + CANVAS_WIDTH) {
            ctx.fillStyle = e.color || '#000';
            ctx.fillRect(e.x, e.y, e.width, e.height);
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.moveTo(e.x + 5, e.y + 10);
            ctx.lineTo(e.x + 10, e.y + 20);
            ctx.lineTo(e.x + 15, e.y + 10);
            ctx.fill();
        }
      });

      ctx.fillStyle = goalRef.current.color || '#f00';
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#ff3300';
      ctx.fillRect(goalRef.current.x, goalRef.current.y, goalRef.current.width, goalRef.current.height);
      ctx.shadowBlur = 0;

      ctx.fillStyle = playerRef.current.color || '#f00';
      ctx.fillRect(player.x, player.y, player.width, player.height);
      ctx.fillStyle = '#cc0000';
      ctx.fillRect(player.x - 2, player.y - 5, player.width + 4, 10);
      
      ctx.restore();
      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(animationFrameId);
    };
  }, [gameState]);

  return (
    <div className="relative flex flex-col items-center justify-center h-full w-full bg-slate-900 font-retro">
      <div className="absolute top-4 left-4 flex gap-4 z-10">
        <button onClick={onBack} className="flex items-center gap-2 text-white hover:text-red-500 transition-colors">
          <ArrowLeft /> Back to Arcade
        </button>
      </div>

      <div className="mb-4 text-center">
        <h2 className="text-red-600 text-2xl mb-2 font-stranger tracking-widest text-glow-red">SUPER HOPPER</h2>
        <div className="text-slate-400 text-xs">ESCAPE THE UPSIDE DOWN</div>
      </div>

      <div className="relative border-4 border-slate-700 rounded-lg bg-black shadow-[0_0_20px_rgba(20,20,50,0.5)] overflow-hidden">
        <canvas 
          ref={canvasRef} 
          width={CANVAS_WIDTH} 
          height={CANVAS_HEIGHT}
          className="block w-full max-w-[800px]"
        />
        
        {(gameState !== 'playing') && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-center z-20">
              <h3 className={`text-4xl mb-4 font-stranger ${gameState === 'won' ?
            'text-blue-400 text-glow-blue' : 'text-red-600 text-glow-red'}`}>
              {gameState === 'won' ? 'PORTAL FOUND!' : 'YOU DIED'}
            </h3>
            <button 
              onClick={resetGame}
              className="px-6 py-3 bg-red-800 hover:bg-red-700 text-white rounded flex items-center gap-2 transition font-retro text-sm"
            >
               Try Again
            </button>
          </div>
        )}
      </div>
      
      <div className="mt-4 text-slate-500 text-xs text-center flex gap-8">
        <span>WASD / ARROWS: MOVE</span>
        <span>SPACE: JUMP</span>
      </div>
    </div>
  );
};