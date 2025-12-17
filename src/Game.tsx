import React, { useState, useEffect, useRef } from "react";

const HexIceGame = () => {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState("countdown"); // countdown, playing, p1won, p2won
  const [countdown, setCountdown] = useState(3);
  const [hexGrid, setHexGrid] = useState([]);
  const [canvasSize, setCanvasSize] = useState(800);

  // 게임 설정
  const HEX_SIZE = 35;
  const HEX_LAYERS = 4;
  const PENGUIN_RADIUS = 15;
  const MOVE_SPEED = 0.3;
  const FRICTION = 0.75;

  // 펭귄 상태
  const penguinRef = useRef({
    p1: {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      dead: false,
      falling: false,
      fallStartTime: 0,
    },
    p2: {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      dead: false,
      falling: false,
      fallStartTime: 0,
    },
  });

  const lastTimeRef = useRef(Date.now());
  const hexGridRef = useRef([]);
  const BASE_CANVAS_SIZE = 800;

  const keysRef = useRef({
    w: false,
    a: false,
    s: false,
    d: false,
    ArrowUp: false,
    ArrowLeft: false,
    ArrowDown: false,
    ArrowRight: false,
  });

  // 육각형 좌표를 픽셀 좌표로 변환
  const hexToPixel = (q, r) => {
    const x = HEX_SIZE * ((3 / 2) * q);
    const y = HEX_SIZE * ((Math.sqrt(3) / 2) * q + Math.sqrt(3) * r);
    return { x, y };
  };

  // 픽셀 좌표를 육각형 좌표로 변환
  const pixelToHex = (x, y) => {
    const q = ((2 / 3) * x) / HEX_SIZE;
    const r = ((-1 / 3) * x + (Math.sqrt(3) / 3) * y) / HEX_SIZE;
    return axialRound(q, r);
  };

  const axialRound = (q, r) => {
    let s = -q - r;
    let rq = Math.round(q);
    let rr = Math.round(r);
    let rs = Math.round(s);

    const q_diff = Math.abs(rq - q);
    const r_diff = Math.abs(rr - r);
    const s_diff = Math.abs(rs - s);

    if (q_diff > r_diff && q_diff > s_diff) {
      rq = -rr - rs;
    } else if (r_diff > s_diff) {
      rr = -rq - rs;
    }

    return { q: rq, r: rr, s: -rq - rr };
  };

  // 육각형 그리기
  const drawHex = (ctx, x, y, size, hex) => {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      const hx = x + size * Math.cos(angle);
      const hy = y + size * Math.sin(angle);
      if (i === 0) ctx.moveTo(hx, hy);
      else ctx.lineTo(hx, hy);
    }
    ctx.closePath();

    if (hex.state === 1) {
      ctx.fillStyle = "#a8daff";
    } else if (hex.state === 2) {
      ctx.fillStyle = "#6eb5ff";
    } else if (hex.state === 3) {
      const elapsed = Date.now() - hex.fallTime;
      const shake = Math.sin(elapsed * 0.02) * 3;
      ctx.save();
      ctx.translate(shake, shake);
      ctx.fillStyle = "#ff9999";
      ctx.fill();
      ctx.strokeStyle = "#ff6666";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
      return;
    }

    ctx.fill();
    ctx.strokeStyle = "#5599dd";
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  // 펭귄 그리기
  const drawPenguin = (ctx, x, y, color, falling, fallStartTime) => {
    if (falling) {
      const elapsed = Date.now() - fallStartTime;
      const fallProgress = Math.min(elapsed / 800, 1);
      const scale = 1 - fallProgress * 0.7;
      const alpha = 1 - fallProgress;
      const rotation = fallProgress * Math.PI * 2;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.scale(scale, scale);
      ctx.translate(-x, -y);
    }

    // 그림자 (펭귄 밑에)
    ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
    ctx.beginPath();
    ctx.ellipse(
      x,
      y + 22,
      PENGUIN_RADIUS * 1.2,
      PENGUIN_RADIUS * 0.4,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // 날개 (뒤쪽)
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(x - 12, y + 2, 5, 10, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + 12, y + 2, 5, 10, 0.3, 0, Math.PI * 2);
    ctx.fill();

    // 다리
    ctx.fillStyle = "#FFA500";
    ctx.beginPath();
    ctx.ellipse(x - 5, y + 18, 4, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + 5, y + 18, 4, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // 몸
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(x, y, PENGUIN_RADIUS, PENGUIN_RADIUS * 1.2, 0, 0, Math.PI * 2);
    ctx.fill();

    // 배
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.ellipse(
      x,
      y + 3,
      PENGUIN_RADIUS * 0.6,
      PENGUIN_RADIUS * 0.8,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // 눈
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(x - 5, y - 5, 4, 0, Math.PI * 2);
    ctx.arc(x + 5, y - 5, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.arc(x - 5, y - 5, 2, 0, Math.PI * 2);
    ctx.arc(x + 5, y - 5, 2, 0, Math.PI * 2);
    ctx.fill();

    // 부리
    ctx.fillStyle = "#FFA500";
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 3, y + 3);
    ctx.lineTo(x + 3, y + 3);
    ctx.closePath();
    ctx.fill();

    if (falling) {
      ctx.restore();
    }
  };

  // 충돌 처리
  const handleCollision = (p1, p2) => {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < PENGUIN_RADIUS * 2 && dist > 0) {
      const nx = dx / dist;
      const ny = dy / dist;

      const dvx = p1.vx - p2.vx;
      const dvy = p1.vy - p2.vy;
      const dvn = dvx * nx + dvy * ny;

      if (dvn > 0) {
        const impulse = dvn * 0.5;
        p1.vx -= impulse * nx;
        p1.vy -= impulse * ny;
        p2.vx += impulse * nx;
        p2.vy += impulse * ny;
      }

      const overlap = PENGUIN_RADIUS * 2 - dist;
      const separateX = nx * overlap * 0.5;
      const separateY = ny * overlap * 0.5;
      p1.x -= separateX;
      p1.y -= separateY;
      p2.x += separateX;
      p2.y += separateY;
    }
  };

  // 카운트다운 함수
  const startCountdown = () => {
    setGameState("countdown");
    setCountdown(3);

    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 0) {
          clearInterval(countdownInterval);
          setGameState("playing");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // 초기화
  useEffect(() => {
    const grid = [];
    for (let q = -HEX_LAYERS; q <= HEX_LAYERS; q++) {
      for (let r = -HEX_LAYERS; r <= HEX_LAYERS; r++) {
        const s = -q - r;
        if (Math.abs(s) <= HEX_LAYERS) {
          grid.push({
            q,
            r,
            s,
            state: 1,
            stateChangeTime: 0,
            fallTime: 0,
          });
        }
      }
    }

    setHexGrid(grid);
    hexGridRef.current = grid;

    const pos1 = hexToPixel(-2, 2);
    const pos2 = hexToPixel(2, -2);
    penguinRef.current.p1 = {
      x: pos1.x,
      y: pos1.y,
      vx: 0,
      vy: 0,
      dead: false,
      falling: false,
      fallStartTime: 0,
    };
    penguinRef.current.p2 = {
      x: pos2.x,
      y: pos2.y,
      vx: 0,
      vy: 0,
      dead: false,
      falling: false,
      fallStartTime: 0,
    };

    startCountdown();
  }, []);

  // 캔버스 크기 조정
  useEffect(() => {
    const updateCanvasSize = () => {
      // 헤더와 여백을 고려하여 사용 가능한 높이 계산
      const headerHeight = 200; // 헤더 + 여백
      const availableHeight = window.innerHeight - headerHeight;
      const availableWidth = window.innerWidth - 100; // 좌우 여백

      // 정사각형 유지하면서 더 작은 쪽에 맞춤
      const size = Math.min(availableHeight, availableWidth, 800);
      setCanvasSize(Math.max(400, size)); // 최소 400px
    };

    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);
    return () => window.removeEventListener("resize", updateCanvasSize);
  }, []);

  // 게임 루프
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || hexGrid.length === 0) return;

    const ctx = canvas.getContext("2d");

    let animationId;
    const gameLoop = () => {
      if (gameState !== "playing") {
        lastTimeRef.current = Date.now();
        animationId = requestAnimationFrame(gameLoop);
        return;
      }

      const currentTime = Date.now();
      const deltaTime = Math.min(
        (currentTime - lastTimeRef.current) / 16.67,
        3
      ); // 60fps 기준, 최대 3배 제한
      lastTimeRef.current = currentTime;

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const scale = (canvas.width / BASE_CANVAS_SIZE) * 1.15; // 스케일 계산

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#e6f7ff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.scale(scale, scale);

      // 육각형 그리드 업데이트 및 그리기
      const newGrid = hexGridRef.current.map((hex) => {
        const pos = hexToPixel(hex.q, hex.r);

        if (hex.state === 3) {
          const elapsed = currentTime - hex.fallTime;

          if (elapsed < 1500) {
            drawHex(ctx, pos.x, pos.y, HEX_SIZE, hex);
            return hex;
          } else if (elapsed < 3000) {
            const fallElapsed = elapsed - 1500;
            const fallProgress = Math.min(fallElapsed / 1500, 1);
            const scale = 1 - fallProgress * 0.8;
            const alpha = 1 - fallProgress;
            const rotation = fallProgress * Math.PI * 4;

            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.translate(pos.x, pos.y);
            ctx.rotate(rotation);
            ctx.scale(scale, scale);

            // 원점 기준으로 그리기
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
              const angle = (Math.PI / 3) * i;
              const hx = HEX_SIZE * Math.cos(angle);
              const hy = HEX_SIZE * Math.sin(angle);
              if (i === 0) ctx.moveTo(hx, hy);
              else ctx.lineTo(hx, hy);
            }
            ctx.closePath();
            ctx.fillStyle = "#ff9999";
            ctx.fill();
            ctx.strokeStyle = "#ff6666";
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.restore();
            return hex;
          } else {
            return { ...hex, state: 4 };
          }
        }

        if (hex.state !== 4) {
          drawHex(ctx, pos.x, pos.y, HEX_SIZE, hex);
        }

        return hex;
      });

      // 펭귄 이동
      const p1 = penguinRef.current.p1;
      const p2 = penguinRef.current.p2;

      if (!p1.dead && !p1.falling) {
        if (keysRef.current.w) p1.vy -= MOVE_SPEED * deltaTime;
        if (keysRef.current.s) p1.vy += MOVE_SPEED * deltaTime;
        if (keysRef.current.a) p1.vx -= MOVE_SPEED * deltaTime;
        if (keysRef.current.d) p1.vx += MOVE_SPEED * deltaTime;

        p1.x += p1.vx * deltaTime;
        p1.y += p1.vy * deltaTime;
        p1.vx *= Math.pow(FRICTION, deltaTime);
        p1.vy *= Math.pow(FRICTION, deltaTime);
      }

      if (!p2.dead && !p2.falling) {
        if (keysRef.current.ArrowUp) p2.vy -= MOVE_SPEED * deltaTime;
        if (keysRef.current.ArrowDown) p2.vy += MOVE_SPEED * deltaTime;
        if (keysRef.current.ArrowLeft) p2.vx -= MOVE_SPEED * deltaTime;
        if (keysRef.current.ArrowRight) p2.vx += MOVE_SPEED * deltaTime;

        p2.x += p2.vx * deltaTime;
        p2.y += p2.vy * deltaTime;
        p2.vx *= Math.pow(FRICTION, deltaTime);
        p2.vy *= Math.pow(FRICTION, deltaTime);
      }

      if (!p1.dead && !p2.dead && !p1.falling && !p2.falling) {
        handleCollision(p1, p2);
      }

      // 타일 체크
      [p1, p2].forEach((penguin, idx) => {
        if (penguin.dead) return;

        // 그림자 중앙 (발 위치) 기준으로 타일 판정
        const hexCoord = pixelToHex(penguin.x, penguin.y + 22);
        const hexIndex = newGrid.findIndex(
          (h) => h.q === hexCoord.q && h.r === hexCoord.r
        );

        if (hexIndex === -1) {
          if (!penguin.falling) {
            penguin.falling = true;
            penguin.fallStartTime = currentTime;
          }

          const fallElapsed = currentTime - penguin.fallStartTime;
          if (fallElapsed > 800) {
            penguin.dead = true;
            setGameState(idx === 0 ? "p2won" : "p1won");
            return;
          }
          return;
        }

        const hex = newGrid[hexIndex];

        if (hex.state === 3) {
          const elapsed = currentTime - hex.fallTime;
          if (elapsed >= 1500) {
            if (!penguin.falling) {
              penguin.falling = true;
              penguin.fallStartTime = currentTime;
            }

            const fallElapsed = currentTime - penguin.fallStartTime;
            if (fallElapsed > 800) {
              penguin.dead = true;
              setGameState(idx === 0 ? "p2won" : "p1won");
              return;
            }
          }
          return;
        }

        if (hex.state === 4) {
          if (!penguin.falling) {
            penguin.falling = true;
            penguin.fallStartTime = currentTime;
          }

          const fallElapsed = currentTime - penguin.fallStartTime;
          if (fallElapsed > 800) {
            penguin.dead = true;
            setGameState(idx === 0 ? "p2won" : "p1won");
            return;
          }
          return;
        }

        const timeSinceStateChange = currentTime - hex.stateChangeTime;

        if (hex.state === 1) {
          newGrid[hexIndex] = {
            ...hex,
            state: 2,
            stateChangeTime: currentTime,
          };
        } else if (hex.state === 2 && timeSinceStateChange > 1500) {
          newGrid[hexIndex] = {
            ...hex,
            state: 3,
            fallTime: currentTime,
          };
        }
      });

      hexGridRef.current = newGrid;
      setHexGrid(newGrid);

      if (!p1.dead)
        drawPenguin(ctx, p1.x, p1.y, "#ff6b6b", p1.falling, p1.fallStartTime);
      if (!p2.dead)
        drawPenguin(ctx, p2.x, p2.y, "#4dabf7", p2.falling, p2.fallStartTime);

      ctx.restore();

      animationId = requestAnimationFrame(gameLoop);
    };

    gameLoop();

    return () => cancelAnimationFrame(animationId);
  }, [gameState]);

  // 키보드 이벤트
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key in keysRef.current) {
        e.preventDefault();
        keysRef.current[e.key] = true;
      }
    };

    const handleKeyUp = (e) => {
      if (e.key in keysRef.current) {
        e.preventDefault();
        keysRef.current[e.key] = false;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  const resetGame = () => {
    const grid = [];
    for (let q = -HEX_LAYERS; q <= HEX_LAYERS; q++) {
      for (let r = -HEX_LAYERS; r <= HEX_LAYERS; r++) {
        const s = -q - r;
        if (Math.abs(s) <= HEX_LAYERS) {
          grid.push({
            q,
            r,
            s,
            state: 1,
            stateChangeTime: 0,
            fallTime: 0,
          });
        }
      }
    }
    setHexGrid(grid);
    hexGridRef.current = grid;

    const pos1 = hexToPixel(-2, 2);
    const pos2 = hexToPixel(2, -2);
    penguinRef.current.p1 = {
      x: pos1.x,
      y: pos1.y,
      vx: 0,
      vy: 0,
      dead: false,
      falling: false,
      fallStartTime: 0,
    };
    penguinRef.current.p2 = {
      x: pos2.x,
      y: pos2.y,
      vx: 0,
      vy: 0,
      dead: false,
      falling: false,
      fallStartTime: 0,
    };

    startCountdown();
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-blue-100 to-blue-200 overflow-hidden">
      <div className="flex flex-col items-center justify-evenly h-full">
        <div
          className="bg-white border-4 border-blue-400 rounded-lg shadow-xl p-6 flex flex-col justify-center"
          style={{ width: canvasSize + 8 }}
        >
          <h1 className="text-3xl font-bold text-center mb-2 text-blue-900">
            🐧 펭귄 아이스 배틀 🐧
          </h1>
          <div className="space-y-1">
            <div className="flex items-center justify-center text-sm text-gray-600">
              <div className="flex-1 text-right">
                <span className="font-bold text-red-500">
                  플레이어 1 (빨강)
                </span>
                : WASD
              </div>
              <span className="mx-4">|</span>
              <div className="flex-1 text-left">
                <span className="font-bold text-blue-500">
                  플레이어 2 (파랑)
                </span>
                : 화살표 키
              </div>
            </div>

            <p className="text-sm text-center text-gray-600">
              얼음 위를 지나다니며 상대방을 떨어뜨리세요! 얼음은 두 번 밟으면
              사라집니다.
            </p>
          </div>
        </div>

        <div className="relative">
          <canvas
            ref={canvasRef}
            width={canvasSize}
            height={canvasSize}
            className="border-4 border-blue-400 rounded-lg shadow-xl bg-white"
          />

          {gameState === "countdown" && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 rounded-lg">
              <div
                key={countdown}
                className="text-white text-9xl font-bold animate-fade-in"
              >
                {countdown === 0 ? "GO!" : countdown}
              </div>
            </div>
          )}

          {gameState !== "playing" && gameState !== "countdown" && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
              <div className="bg-white rounded-lg shadow-2xl p-8 text-center">
                <h2 className="text-4xl font-bold mb-6 text-blue-900">
                  {gameState === "p1won"
                    ? "🎉 플레이어 1 승리! 🎉"
                    : "🎉 플레이어 2 승리! 🎉"}
                </h2>
                <button
                  onClick={resetGame}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-10 rounded-lg transition-colors text-xl"
                >
                  🔄 다시 시작
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HexIceGame;
