import React, { useEffect, useRef, useState } from 'react';
import { LeaderboardModal } from './LeaderboardModal';
import { saveScore, signInGuest, signInWithGoogle, signOutUser, auth, getGlobalRank } from '../services/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { Snake, Food, Point } from '../game/types';
import { MAP_RADIUS, INITIAL_SNAKE_LENGTH, BASE_SPEED, BOOST_SPEED, FOOD_COUNT, BOT_COUNT, BOT_NAMES } from '../game/constants';
import { randomPoint, getDistance, lerpAngle, randomColor } from '../game/utils';
import { drawWorld } from '../game/renderer';
import { GameHUD } from './GameHUD';
import { GameMenu } from './GameMenu';
import { ExitModal, SignOutModal, GameOverModal } from './GameModals';

export default function Game() {
  // UI State
  const [gameState, setGameState] = useState<'MENU' | 'PLAYING' | 'GAMEOVER'>('MENU');
  const gameStateRef = useRef<'MENU' | 'PLAYING' | 'GAMEOVER'>('MENU');
  const [score, setScore] = useState(0);
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const playerNameRef = useRef('');
  const [user, setUser] = useState<User | null>(null);
  const userRef = useRef<User | null>(null);
  const [rank, setRank] = useState(1);
  const [globalRank, setGlobalRank] = useState<number | null>(null);
  const [totalPlayers, setTotalPlayers] = useState(BOT_COUNT + 1);
  const [selectedSkin, setSelectedSkin] = useState<string>('orange');
  const selectedSkinRef = useRef<string>('orange');
  const [customPattern, setCustomPattern] = useState<string[]>(['#FFFFFF', '#FF0000']);
  const [showSkinSelector, setShowSkinSelector] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  
  // Refs for game loop to avoid re-renders
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  const playerRef = useRef<Snake | null>(null);
  const botsRef = useRef<Snake[]>([]);
  const foodRef = useRef<Food[]>([]);
  const particlesRef = useRef<any[]>([]); // For explosion effects
  const mouseRef = useRef({ x: 0, y: 0, active: false });
  const joystickRef = useRef({ angle: 0, strength: 0, active: false });
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const cameraRef = useRef({ x: 0, y: 0, zoom: 1 });
  
  // --- INITIALIZATION ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      console.log("Auth state changed:", u);
      setUser(u);
      userRef.current = u;
      if (u && !u.isAnonymous) {
        // If we have a real user, update the name to their last name
        const nameParts = u.displayName ? u.displayName.trim().split(' ') : [];
        const lastName = nameParts.length > 0 ? nameParts[nameParts.length - 1] : `Player_${u.uid.slice(0,4)}`;
        setPlayerName(lastName);
        playerNameRef.current = lastName;
      } else if (u && !playerNameRef.current) {
        // Anonymous fallback
        const name = `Guest_${u.uid.substring(0, 4)}`;
        setPlayerName(name);
        playerNameRef.current = name;
      }
    });

    // Start Attract Mode (Background Game)
    initWorld();
    if (!requestRef.current) {
      requestRef.current = requestAnimationFrame(gameLoop);
    }

    return () => {
      unsubscribe();
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  const initWorld = () => {
    // Create Bots
    botsRef.current = Array.from({ length: BOT_COUNT }).map((_, i) => {
      const pos = randomPoint();
      const name = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)] + (Math.random() > 0.5 ? `_${Math.floor(Math.random()*100)}` : '');
      
      // Boss Bot (Index 0)
      if (i === 0) {
        const boss = createSnake(`bot_${i}`, pos.x, pos.y, "THE_BOSS", true, 'rainbow');
        // Make boss huge (20k points approx -> length ~ 1000)
        boss.length = 1000;
        boss.width = 40; // Max width
        boss.score = 20000;
        // Pre-fill segments for length
        const delayFrames = 3;
        const extraSegments = 1000 - INITIAL_SNAKE_LENGTH;
        for (let j = 0; j < extraSegments * delayFrames; j++) {
           boss.path.push({ x: pos.x, y: pos.y }); // Just stack them for now, they will spread out
        }
        return boss;
      }
      
      // Varied Bots
      const bot = createSnake(`bot_${i}`, pos.x, pos.y, name, true);
      // Randomize size
      if (Math.random() > 0.7) {
        bot.length = 50 + Math.random() * 200;
        bot.width = Math.min(40, 20 + Math.log(bot.length) * 2);
        bot.score = bot.length * 20;
      }
      return bot;
    });
    
    // Create Food
    foodRef.current = Array.from({ length: FOOD_COUNT }).map((_, i) => createFood(i));
    
    // Reset Particles
    particlesRef.current = [];
  };

  const initGame = () => {
    initWorld();
    
    // Create Player
    playerRef.current = createSnake('player', 0, 0, playerNameRef.current || 'You', false, selectedSkinRef.current);
    
    // Reset Camera
    cameraRef.current = { x: 0, y: 0, zoom: 1 };
    
    setScore(0);
    setGameState('PLAYING');
    gameStateRef.current = 'PLAYING';
  };

  const createSnake = (id: string, x: number, y: number, name: string, isBot: boolean, customSkin?: string): Snake => {
    const initialSegments = [];
    for (let i = 0; i < INITIAL_SNAKE_LENGTH; i++) {
      initialSegments.push({ x, y: y + i * 5 });
    }
    
    const skins: string[] = ['orange', 'blue', 'green', 'purple', 'red', 'rainbow', 'usa', 'germany', 'france', 'brazil', 'matrix', 'ghost'];
    const skin = isBot ? skins[Math.floor(Math.random() * skins.length)] : (customSkin || 'orange');

    const skinPatterns: Record<string, string[]> = {
      'orange': ['#FF8C00', '#FFA500', '#FFD700'],
      'blue': ['#0000CD', '#4169E1', '#87CEFA'],
      'green': ['#006400', '#32CD32', '#ADFF2F'],
      'purple': ['#4B0082', '#8A2BE2', '#DDA0DD'],
      'red': ['#8B0000', '#FF0000', '#FF6347'],
      'rainbow': ['#FF0000', '#FFA500', '#FFFF00', '#008000', '#0000FF', '#4B0082', '#EE82EE'],
      'usa': ['#B22234', '#FFFFFF', '#3C3B6E'],
      'germany': ['#000000', '#DD0000', '#FFCE00'],
      'france': ['#0055A4', '#FFFFFF', '#EF4135'],
      'brazil': ['#009c3b', '#ffdf00', '#002776'],
      'matrix': ['#000000', '#00FF00', '#003300'],
      'ghost': ['#FFFFFF20', '#FFFFFF40', '#FFFFFF60'], // Transparent
      'custom': customPattern
    };

    const pattern = skinPatterns[skin] || skinPatterns['orange'];

    return {
      id,
      x,
      y,
      angle: -Math.PI / 2,
      targetAngle: -Math.PI / 2,
      segments: initialSegments,
      length: INITIAL_SNAKE_LENGTH,
      width: 20, // Base width
      color: pattern[0], // Base color
      isBoosting: false,
      name,
      isBot,
      dead: false,
      score: 100, // Initial mass
      skin,
      pattern,
      boostAccumulator: 0
    };
  };

    const createFood = (id: number, x?: number, y?: number, value?: number): Food => {
    const isSpecial = Math.random() > 0.99;
    const pos = x !== undefined && y !== undefined ? {x, y} : randomPoint();
    const isDropped = value !== undefined;
    const finalValue = isDropped ? value : (isSpecial ? 20 : Math.floor(Math.random() * 4) + 1);
    
    return {
      id,
      x: pos.x,
      y: pos.y,
      size: Math.max(4, Math.min(finalValue * 2, 20)),
      color: isDropped ? randomColor() : (isSpecial ? '#FF00FF' : randomColor()),
      value: finalValue
    };
  };

  // --- GAME LOOP ---
  const gameLoop = () => {
    // Always run update and render to show background action in menu
    update();
    render();
    requestRef.current = requestAnimationFrame(gameLoop);
  };

  const update = () => {
    // 1. Update Player Input (Only if playing)
    if (gameStateRef.current === 'PLAYING' && playerRef.current) {
      handlePlayerInput();
    }
    
    // 2. Update All Snakes (Player + Bots)
    const allSnakes = [...botsRef.current];
    if (playerRef.current && !playerRef.current.dead) {
      allSnakes.push(playerRef.current);
    }
    
    allSnakes.forEach(snake => {
      if (snake.dead) return;
      
      // Bot Logic
      if (snake.isBot) updateBotAI(snake);
      
      // Movement Physics
      const speed = snake.isBoosting && snake.score > 110 ? BOOST_SPEED : BASE_SPEED;
      
      // Smooth turning (tighter for smaller snakes)
      const turnSpeed = Math.max(0.02, 0.12 - (snake.score * 0.000005));
      snake.angle = lerpAngle(snake.angle, snake.targetAngle, turnSpeed);
      
      // Move Head
      snake.x += Math.cos(snake.angle) * speed;
      snake.y += Math.sin(snake.angle) * speed;
      
      // Boundary Check (Circular)
      const distFromCenter = Math.sqrt(snake.x * snake.x + snake.y * snake.y);
      if (distFromCenter >= MAP_RADIUS) {
         killSnake(snake);
      }

      // Update Segments (Follow the leader / IK)
      snake.segments[0] = { x: snake.x, y: snake.y };
      const spacing = snake.width * 0.25; // Overlapping circles
      
      for (let i = 1; i < snake.segments.length; i++) {
        const prev = snake.segments[i - 1];
        const curr = snake.segments[i];
        const dx = prev.x - curr.x;
        const dy = prev.y - curr.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > spacing) {
          const angle = Math.atan2(dy, dx);
          curr.x = prev.x - Math.cos(angle) * spacing;
          curr.y = prev.y - Math.sin(angle) * spacing;
        }
      }
      
      // Boost Cost
      if (snake.isBoosting && snake.score > 110) {
        // Lose 15 mass per second (0.25 per frame at 60fps)
        snake.score -= 0.25;
        snake.boostAccumulator += 0.25 * 0.33; // 33% becomes pellets
        
        if (snake.boostAccumulator >= 1) {
          const dropValue = Math.floor(snake.boostAccumulator);
          snake.boostAccumulator -= dropValue;
          const tail = snake.segments[snake.segments.length - 1];
          if (tail) {
            dropFood(tail.x, tail.y, dropValue);
          }
        }
      } else {
        snake.isBoosting = false;
      }
      
      // Update length and width based on mass (score)
      const effectiveMass = Math.min(snake.score, 40000);
      snake.width = Math.max(20, 15 + Math.pow(effectiveMass, 0.35) * 1.5);
      const targetLength = Math.max(20, Math.floor(effectiveMass / 10));
      
      // Add or remove segments to match targetLength
      while (snake.segments.length < targetLength) {
        const last = snake.segments[snake.segments.length - 1];
        snake.segments.push({ x: last.x, y: last.y });
      }
      if (snake.segments.length > targetLength) {
        snake.segments.length = targetLength;
      }
      
      // Collision with Food
      for (let i = foodRef.current.length - 1; i >= 0; i--) {
        const f = foodRef.current[i];
        if (getDistance({ x: snake.x, y: snake.y }, f) < snake.width + f.size) {
          // Eat food
          snake.score += f.value;
          snake.length += f.value / 20; // Growth rate
          snake.width = Math.min(40, 20 + Math.log(snake.length) * 2); // Thicken up to a cap
          foodRef.current.splice(i, 1);
          // Respawn food elsewhere to keep world populated
          if (foodRef.current.length < FOOD_COUNT) {
            foodRef.current.push(createFood(Date.now() + Math.random()));
          }
        }
      }
    });

    // 3. Collision Detection (Snake vs Snake)
    checkCollisions();

    // 4. Update Particles
    updateParticles();

    // 5. Cleanup Dead Snakes
    botsRef.current = botsRef.current.filter(b => !b.dead);
    
    // Respawn Bots
    if (botsRef.current.length < BOT_COUNT) {
       const pos = randomPoint();
       const name = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)] + (Math.random() > 0.5 ? `_${Math.floor(Math.random()*100)}` : '');
       botsRef.current.push(createSnake(`bot_${Date.now()}`, pos.x, pos.y, name, true));
    }

    // 6. Update Camera
    if (playerRef.current && !playerRef.current.dead && gameStateRef.current === 'PLAYING') {
      // Smooth camera follow Player
      cameraRef.current.x += (playerRef.current.x - cameraRef.current.x) * 0.1;
      cameraRef.current.y += (playerRef.current.y - cameraRef.current.y) * 0.1;
      
      // Zoom out as snake grows
      const targetZoom = Math.max(0.15, 15 / Math.sqrt(Math.max(playerRef.current.score, 225)));
      cameraRef.current.zoom += (targetZoom - cameraRef.current.zoom) * 0.05;
    } else if (botsRef.current.length > 0) {
      // Attract Mode: Follow a random bot or the biggest bot
      const target = botsRef.current[0];
      if (target) {
        cameraRef.current.x += (target.x - cameraRef.current.x) * 0.05;
        cameraRef.current.y += (target.y - cameraRef.current.y) * 0.05;
        cameraRef.current.zoom += (0.8 - cameraRef.current.zoom) * 0.02;
      }
    }
    
    // 7. Update UI Data
    if (playerRef.current && gameStateRef.current === 'PLAYING') {
      setScore(Math.floor(playerRef.current.score));
      // Calculate rank
      const allScores = [playerRef.current, ...botsRef.current].sort((a, b) => b.score - a.score);
      const myRank = allScores.findIndex(s => s.id === 'player') + 1;
      setRank(myRank);
      setTotalPlayers(allScores.length);
    }
  };

  const handlePlayerInput = () => {
    const p = playerRef.current;
    if (!p || p.dead) return;

    if (joystickRef.current.active) {
      // Mobile / Joystick Input
      p.targetAngle = joystickRef.current.angle;
      p.isBoosting = joystickRef.current.strength > 0.8; // Auto boost if pushed hard? Or use button.
      // Let's use button for boost, joystick only for direction to be precise.
      // Actually, prompt says "On-screen Boost button".
      // So joystick is just angle.
    } else {
      // Mouse Input
      const dx = mouseRef.current.x - window.innerWidth / 2;
      const dy = mouseRef.current.y - window.innerHeight / 2;
      p.targetAngle = Math.atan2(dy, dx);
      p.isBoosting = keysRef.current[' '] || keysRef.current['Space'] || mouseRef.current.active; // Space or Click
    }
  };

  const updateBotAI = (bot: Snake) => {
    const allSnakes = [playerRef.current, ...botsRef.current].filter(s => s && !s.dead && s.id !== bot.id) as Snake[];
    
    // Default: Wander or maintain current direction with slight noise
    let targetAngle = bot.targetAngle + (Math.random() - 0.5) * 0.1;
    let shouldBoost = false;

    // 1. Avoidance (High Priority)
    let avoidX = 0;
    let avoidY = 0;
    let avoidanceActive = false;

    // Check map boundaries
    const distFromCenter = Math.sqrt(bot.x * bot.x + bot.y * bot.y);
    if (distFromCenter > MAP_RADIUS - 500) {
      // Steer towards center
      const angleToCenter = Math.atan2(-bot.y, -bot.x);
      avoidX += Math.cos(angleToCenter) * 5;
      avoidY += Math.sin(angleToCenter) * 5;
      avoidanceActive = true;
    }

    // Check other snakes
    for (const other of allSnakes) {
      // Check head collision risk
      const distToHead = getDistance(bot, other);
      if (distToHead < 300) {
         const angleAway = Math.atan2(bot.y - other.y, bot.x - other.x);
         const force = (300 - distToHead) / 300;
         avoidX += Math.cos(angleAway) * force * 10;
         avoidY += Math.sin(angleAway) * force * 10;
         avoidanceActive = true;
      }

      // Check body collision risk (simplified: check a few segments)
      // Checking every segment is too expensive. Check every 10th.
      for (let i = 0; i < other.segments.length; i += 10) {
        const seg = other.segments[i];
        const dist = getDistance(bot, seg);
        if (dist < 150) {
           const angleAway = Math.atan2(bot.y - seg.y, bot.x - seg.x);
           const force = (150 - dist) / 150;
           avoidX += Math.cos(angleAway) * force * 8;
           avoidY += Math.sin(angleAway) * force * 8;
           avoidanceActive = true;
        }
      }
    }

    // 2. Food Seeking (Lower Priority)
    let foodX = 0;
    let foodY = 0;
    let foundFood = false;
    
    if (!avoidanceActive) {
      let minFoodDist = 400; // Look radius
      let bestFood = null;
      
      for (const f of foodRef.current) {
        const d = getDistance(bot, f);
        if (d < minFoodDist) {
          minFoodDist = d;
          bestFood = f;
        }
      }
      
      if (bestFood) {
        const angleToFood = Math.atan2(bestFood.y - bot.y, bestFood.x - bot.x);
        foodX = Math.cos(angleToFood);
        foodY = Math.sin(angleToFood);
        foundFood = true;
      }
    }

    // Combine Forces
    if (avoidanceActive) {
      targetAngle = Math.atan2(avoidY, avoidX);
      shouldBoost = true; // Panic boost
    } else if (foundFood) {
      targetAngle = Math.atan2(foodY, foodX);
      shouldBoost = bot.length > 200; // Boost if big enough to afford it
    }

    // Smoothly turn towards target
    bot.targetAngle = targetAngle;
    bot.isBoosting = shouldBoost && bot.length > 10;
  };

  const checkCollisions = () => {
    const allSnakes = [playerRef.current, ...botsRef.current].filter(s => s && !s.dead) as Snake[];
    
    for (let i = 0; i < allSnakes.length; i++) {
      const s1 = allSnakes[i];
      
      // Check against other snakes
      for (let j = 0; j < allSnakes.length; j++) {
        if (i === j) continue;
        const s2 = allSnakes[j];
        
        // Head to Body Collision
        // Check s1 head against s2 body segments
        // Optimization: Check bounding box first or distance to s2 head
        
        // Head on Head
        const distHeads = getDistance(s1, s2);
        if (distHeads < (s1.width + s2.width) / 2) {
          // Head on collision
          if (s1.length < s2.length) {
            killSnake(s1);
          } else if (s2.length < s1.length) {
            killSnake(s2);
          } else {
            killSnake(s1);
            killSnake(s2);
          }
          continue; 
        }
        
        // Head on Body
        let hit = false;
        // Check every 2nd segment for performance
        // Start from segment 4 to avoid head-to-head immediate triggers
        for (let k = 4; k < s2.segments.length; k += 2) {
          const seg = s2.segments[k];
          if (getDistance(s1, seg) < (s1.width + s2.width) * 0.4) {
             killSnake(s1);
             hit = true;
             break;
          }
        }
        if (hit) break;
      }
    }
  };

  const killSnake = (snake: Snake) => {
    if (snake.dead) return;
    snake.dead = true;
    
    // Total mass dropped: ~40% of victim mass
    const totalValue = snake.score * 0.4; 
    const drops = Math.min(snake.segments.length, 100); // Cap number of drops
    const valuePerDrop = totalValue / drops;
    
    for (let i = 0; i < drops; i++) {
      const segIndex = Math.floor((i / drops) * snake.segments.length);
      const seg = snake.segments[segIndex];
      // Add some jitter to position
      const jitterX = (Math.random() - 0.5) * snake.width;
      const jitterY = (Math.random() - 0.5) * snake.width;
      dropFood(seg.x + jitterX, seg.y + jitterY, valuePerDrop);
    }
    
    // Particle Explosion
    createExplosion(snake.x, snake.y, snake.color);

    if (snake.id === 'player') {
      handleGameOver();
    }
  };

  const dropFood = (x: number, y: number, value: number) => {
    foodRef.current.push(createFood(Date.now() + Math.random(), x, y, value));
  };

  const createExplosion = (x: number, y: number, color: string) => {
    for (let i = 0; i < 20; i++) {
      particlesRef.current.push({
        x, y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        life: 1.0,
        color
      });
    }
  };

  const updateParticles = () => {
    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
      const p = particlesRef.current[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.05;
      if (p.life <= 0) particlesRef.current.splice(i, 1);
    }
  };

  const handleGameOver = () => {
    setGameState('GAMEOVER');
    gameStateRef.current = 'GAMEOVER';
    if (userRef.current && playerRef.current) {
      const finalScore = Math.floor(playerRef.current.score);
      saveScore(userRef.current, finalScore, playerRef.current.length, playerNameRef.current);
      getGlobalRank(finalScore).then(rank => setGlobalRank(rank));
    }
  };

  // --- RENDER ---
  const render = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const allSnakes = [...botsRef.current];
    if (playerRef.current) allSnakes.push(playerRef.current);
    const sortedSnakes = allSnakes.filter(s => s && !s.dead).sort((a, b) => (a?.id === 'player' ? 1 : -1));

    drawWorld(ctx, cameraRef.current, canvas.width, canvas.height, foodRef.current, sortedSnakes, particlesRef.current);
  };

  // --- EVENT LISTENERS ---
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    const handleKeyDown = (e: KeyboardEvent) => { keysRef.current[e.key] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keysRef.current[e.key] = false; };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(requestRef.current!);
    };
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    mouseRef.current = { x: e.clientX, y: e.clientY, active: mouseRef.current.active };
  };
  
  const handleMouseDown = () => { mouseRef.current.active = true; };
  const handleMouseUp = () => { mouseRef.current.active = false; };

  // --- LOGIN ---
  const handleLogin = async () => {
    try {
      const u = await signInGuest();
      setUser(u);
      userRef.current = u;
      initGame();
    } catch (e) {
      console.error(e);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const u = await signInWithGoogle();
      if (u) {
        setUser(u);
        userRef.current = u;
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
      setUser(null);
      userRef.current = null;
    } catch (e) {
      console.error(e);
    }
  };

  const handleStartGame = () => {
    if (!user) {
      handleLogin();
    } else {
      initGame();
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-zinc-900 text-white font-sans select-none">
      {/* GAME CANVAS */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 block touch-none"
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
      />

      {/* UI OVERLAY - HUD */}
      {gameState === 'PLAYING' && (
        <GameHUD 
          score={score}
          rank={rank}
          totalPlayers={totalPlayers}
          snakes={[playerRef.current, ...botsRef.current].filter(s => s !== null) as Snake[]}
          onExit={() => setShowExitModal(true)}
          onJoystickMove={(angle, strength) => {
            joystickRef.current = { 
              angle: angle ?? 0, 
              strength, 
              active: angle !== null 
            };
          }}
          onBoostStart={() => { keysRef.current[' '] = true; }}
          onBoostEnd={() => { keysRef.current[' '] = false; }}
        />
      )}

      {/* MENU SCREEN */}
      {gameState === 'MENU' && (
        <GameMenu 
          user={user}
          playerName={playerName}
          setPlayerName={(name) => {
            setPlayerName(name);
            playerNameRef.current = name;
          }}
          selectedSkin={selectedSkin}
          setSelectedSkin={(skin) => {
            setSelectedSkin(skin);
            selectedSkinRef.current = skin;
          }}
          customPattern={customPattern}
          setCustomPattern={setCustomPattern}
          showSkinSelector={showSkinSelector}
          setShowSkinSelector={setShowSkinSelector}
          onStartGame={handleStartGame}
          onGoogleLogin={handleGoogleLogin}
          onSignOut={() => setShowSignOutModal(true)}
          onOpenLeaderboard={() => setLeaderboardOpen(true)}
        />
      )}

      {/* MODALS */}
      <ExitModal 
        isOpen={showExitModal} 
        onClose={() => setShowExitModal(false)} 
        onConfirm={() => {
          setGameState('MENU');
          gameStateRef.current = 'MENU';
          setShowExitModal(false);
          cameraRef.current.zoom = 1;
        }}
      />

      <SignOutModal 
        isOpen={showSignOutModal} 
        onClose={() => setShowSignOutModal(false)} 
        onConfirm={() => {
          handleSignOut();
          setShowSignOutModal(false);
        }}
      />

      <GameOverModal 
        isOpen={gameState === 'GAMEOVER'}
        score={score}
        rank={rank}
        globalRank={globalRank}
        onPlayAgain={initGame}
        onMainMenu={() => setGameState('MENU')}
      />

      {/* LEADERBOARD MODAL */}
      <LeaderboardModal 
        isOpen={leaderboardOpen} 
        onClose={() => setLeaderboardOpen(false)} 
        currentScore={score}
      />
    </div>
  );
}
