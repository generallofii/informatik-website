document.addEventListener("DOMContentLoaded", () => {
  /* ============================================================
     GLOBAL CHESS CONFIGURATION
     ============================================================ */
  const boardEl = document.getElementById("board");
  const botStateEl = document.getElementById("bot-state");
  const thinkingCard = document.getElementById("bot-info-card");
  const moveLogEl = document.getElementById("move-log");
  const restartBtn = document.getElementById("restart-btn");
  
  const whiteCapturedEl = document.getElementById("white-captured");
  const blackCapturedEl = document.getElementById("black-captured");
  
  const diffButtons = document.querySelectorAll(".diff-btn");

  const game = new Chess();
  let selectedSquare = null;
  let moveHints = [];
  let botDifficulty = "medium"; // default: minimax depth 2
  let botIsThinking = false;

  // Unicode Chess Symbols Mapping
  const pieceSymbols = {
    'w': { 'k': '♔', 'q': '♕', 'r': '♖', 'b': '♗', 'n': '♘', 'p': '♙' },
    'b': { 'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟' }
  };

  const initialPieceCount = {
    'p': 8, 'n': 2, 'b': 2, 'r': 2, 'q': 1, 'k': 1
  };

  /* ============================================================
     BOARD RENDERING ENGINE
     ============================================================ */
  function renderBoard() {
    boardEl.innerHTML = "";
    const boardState = game.board();

    // Loop through 8 ranks (row 8 to row 1)
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const squareEl = document.createElement("div");
        const isLight = (r + c) % 2 === 0;
        
        // Convert array indices to algebraic chess coordinates (e.g. 0,0 is a8)
        const file = String.fromCharCode(97 + c);
        const rank = 8 - r;
        const notation = `${file}${rank}`;

        squareEl.className = `square ${isLight ? 'light-square' : 'dark-square'}`;
        squareEl.dataset.square = notation;

        const piece = boardState[r][c];
        if (piece) {
          const pieceEl = document.createElement("span");
          pieceEl.className = `piece ${piece.color === 'w' ? 'white' : 'black'}`;
          pieceEl.textContent = pieceSymbols[piece.color][piece.type];
          squareEl.appendChild(pieceEl);
        }

        // Selected highlight
        if (selectedSquare === notation) {
          squareEl.classList.add("selected");
        }

        // Highlight King if in check
        if (piece && piece.type === 'k' && piece.color === game.turn() && game.in_check()) {
          squareEl.classList.add("in-check");
        }

        // Bind interactive event click listener
        squareEl.addEventListener("click", () => handleSquareClick(notation));

        boardEl.appendChild(squareEl);
      }
    }

    renderCapturedPieces();
    updateStatusIndicators();
  }

  /* ============================================================
     INTERACTION / PLAY LOGIC
     ============================================================ */
  function handleSquareClick(square) {
    if (game.game_over() || botIsThinking || game.turn() === 'b') return;

    const piece = game.get(square);

    // If clicked square is target move hint
    if (moveHints.includes(square)) {
      makeMove(selectedSquare, square);
      selectedSquare = null;
      moveHints = [];
      
      // Let AI Bot respond
      if (!game.game_over()) {
        botIsThinking = true;
        thinkingCard.classList.add("thinking-active");
        botStateEl.textContent = "AI is thinking...";
        
        setTimeout(playBotMove, 500); // simulated thinking latency
      }
      return;
    }

    // Reset selection if clicking empty or opponent piece
    if (!piece || piece.color !== 'w') {
      selectedSquare = null;
      moveHints = [];
      renderBoard();
      return;
    }

    // Select piece and show move overlays
    selectedSquare = square;
    const moves = game.moves({ square: square, verbose: true });
    moveHints = moves.map(m => m.to);
    
    renderBoard();
    drawMoveHints(moves);
  }

  function drawMoveHints(moves) {
    moves.forEach(m => {
      const squareEl = document.querySelector(`[data-square="${m.to}"]`);
      if (squareEl) {
        const hint = document.createElement("div");
        // Distinguish standard moves from captures
        if (game.get(m.to)) {
          hint.className = "capture-hint";
        } else {
          hint.className = "move-hint";
        }
        squareEl.appendChild(hint);
      }
    });
  }

  function makeMove(from, to) {
    // Generate checkmate/check details before moving for the log
    const piece = game.get(from);
    const move = game.move({ from: from, to: to, promotion: 'q' }); // promote to queen automatically
    if (move) {
      logMove(move, piece.color);
      renderBoard();
    }
  }

  /* ============================================================
     MINIMAX CHESS AI BOT
     ============================================================ */
  function playBotMove() {
    let depth = 2; // medium
    if (botDifficulty === "easy") depth = 1;
    else if (botDifficulty === "hard") depth = 5;

    let bestMove;
    const moves = game.moves();
    
    if (moves.length > 0) {
      if (botDifficulty === "easy" && Math.random() < 0.25) {
        // Random moves occasionally on easy
        bestMove = moves[Math.floor(Math.random() * moves.length)];
      } else {
        bestMove = getBestMove(game, depth);
      }
      
      if (bestMove) {
        game.move(bestMove);
        // Find moving piece details for log
        const logDetail = game.history({ verbose: true }).pop();
        logMove(logDetail, 'b');
      }
    }

    botIsThinking = false;
    thinkingCard.classList.remove("thinking-active");
    botStateEl.textContent = "Your turn";
    renderBoard();

    // Check game over
    if (game.game_over()) {
      handleGameOver();
    }
  }

  function evaluateBoard(board) {
    let score = 0;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece) {
          let val = 0;
          if (piece.type === 'p') val = 10;
          else if (piece.type === 'n') val = 30;
          else if (piece.type === 'b') val = 30;
          else if (piece.type === 'r') val = 50;
          else if (piece.type === 'q') val = 90;
          else if (piece.type === 'k') val = 9000;
          
          // Positional factor: prioritize center board
          let centerBonus = 0;
          if (r >= 3 && r <= 4 && c >= 3 && c <= 4) centerBonus = 2.0;
          else if (r >= 2 && r <= 5 && c >= 2 && c <= 5) centerBonus = 0.8;
          
          const factor = (piece.color === 'w') ? 1 : -1;
          score += (val + centerBonus) * factor;
        }
      }
    }
    return score;
  }

  function minimax(gameInstance, depth, alpha, beta, isMaximizing) {
    if (depth === 0 || gameInstance.game_over()) {
      return evaluateBoard(gameInstance.board());
    }

    const moves = gameInstance.moves();
    if (isMaximizing) {
      let maxEval = -Infinity;
      for (let i = 0; i < moves.length; i++) {
        gameInstance.move(moves[i]);
        const evaluation = minimax(gameInstance, depth - 1, alpha, beta, false);
        gameInstance.undo();
        maxEval = Math.max(maxEval, evaluation);
        alpha = Math.max(alpha, evaluation);
        if (beta <= alpha) break;
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (let i = 0; i < moves.length; i++) {
        gameInstance.move(moves[i]);
        const evaluation = minimax(gameInstance, depth - 1, alpha, beta, true);
        gameInstance.undo();
        minEval = Math.min(minEval, evaluation);
        beta = Math.min(beta, evaluation);
        if (beta <= alpha) break;
      }
      return minEval;
    }
  }

  function getBestMove(gameInstance, depth) {
    const moves = gameInstance.moves();
    if (moves.length === 0) return null;
    
    let bestMove = null;
    let bestValue = Infinity; // Bot is black, wants to minimize evaluation score

    for (let i = 0; i < moves.length; i++) {
      gameInstance.move(moves[i]);
      const boardValue = minimax(gameInstance, depth - 1, -Infinity, Infinity, true);
      gameInstance.undo();
      
      if (boardValue < bestValue) {
        bestValue = boardValue;
        bestMove = moves[i];
      }
    }
    return bestMove;
  }

  /* ============================================================
     TALLIES & CAPTURED PIECES DISPLAY
     ============================================================ */
  function renderCapturedPieces() {
    // Current counts
    const currentCounts = {
      'w': { 'p': 0, 'n': 0, 'b': 0, 'r': 0, 'q': 0, 'k': 0 },
      'b': { 'p': 0, 'n': 0, 'b': 0, 'r': 0, 'q': 0, 'k': 0 }
    };

    game.board().forEach(row => {
      row.forEach(p => {
        if (p) {
          currentCounts[p.color][p.type]++;
        }
      });
    });

    whiteCapturedEl.innerHTML = "";
    blackCapturedEl.innerHTML = "";

    // Captured black pieces (taken by White)
    Object.keys(initialPieceCount).forEach(type => {
      const capturedCount = initialPieceCount[type] - currentCounts['b'][type];
      for (let i = 0; i < capturedCount; i++) {
        const pieceEl = document.createElement("span");
        pieceEl.className = "piece black";
        pieceEl.style.fontSize = "1.2rem";
        pieceEl.style.textShadow = "none";
        pieceEl.textContent = pieceSymbols['b'][type];
        whiteCapturedEl.appendChild(pieceEl);
      }
    });

    // Captured white pieces (taken by Bot)
    Object.keys(initialPieceCount).forEach(type => {
      const capturedCount = initialPieceCount[type] - currentCounts['w'][type];
      for (let i = 0; i < capturedCount; i++) {
        const pieceEl = document.createElement("span");
        pieceEl.className = "piece white";
        pieceEl.style.fontSize = "1.2rem";
        pieceEl.style.textShadow = "none";
        pieceEl.textContent = pieceSymbols['w'][type];
        blackCapturedEl.appendChild(pieceEl);
      }
    });
  }

  /* ============================================================
     LOG & UTILS
     ============================================================ */
  function logMove(move, color) {
    const turnLabel = color === 'w' ? 'White' : 'Black';
    const entry = document.createElement("div");
    entry.className = "log-entry";
    entry.innerHTML = `<span>${turnLabel}:</span> ${move.san} (${move.from} → ${move.to})`;
    moveLogEl.appendChild(entry);
    moveLogEl.scrollTop = moveLogEl.scrollHeight;
  }

  function updateStatusIndicators() {
    if (game.in_checkmate()) {
      botStateEl.textContent = "Checkmate!";
    } else if (game.in_draw() || game.in_stalemate()) {
      botStateEl.textContent = "Draw!";
    } else if (game.in_check()) {
      botStateEl.textContent = "Check!";
    }
  }

  function handleGameOver() {
    const checkmate = game.in_checkmate();
    const activeWinner = game.turn() === 'w' ? 'Black (AI)' : 'White (You)';
    const statusText = checkmate ? `Checkmate! ${activeWinner} wins.` : "Draw match!";
    botStateEl.textContent = statusText;
    
    // Inject alert entry
    const entry = document.createElement("div");
    entry.className = "log-entry";
    entry.style.color = "var(--accent-neon-pink)";
    entry.innerHTML = `<strong>Game Over:</strong> ${statusText}`;
    moveLogEl.appendChild(entry);
    moveLogEl.scrollTop = moveLogEl.scrollHeight;
  }

  /* ============================================================
     UI BINDINGS & ACTIONS
     ============================================================ */
  restartBtn.addEventListener("click", () => {
    game.reset();
    selectedSquare = null;
    moveHints = [];
    botIsThinking = false;
    thinkingCard.classList.remove("thinking-active");
    botStateEl.textContent = "Your turn";
    moveLogEl.innerHTML = '<div class="log-entry">Match started. Playing as <span>White</span>.</div>';
    renderBoard();
  });

  diffButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      diffButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      botDifficulty = btn.dataset.diff;
      
      const entry = document.createElement("div");
      entry.className = "log-entry";
      entry.style.color = "var(--accent-neon-purple)";
      entry.innerHTML = `Difficulty toggled to: <span>${botDifficulty.toUpperCase()}</span>`;
      moveLogEl.appendChild(entry);
      moveLogEl.scrollTop = moveLogEl.scrollHeight;
    });
  });

  // Init
  renderBoard();
});
