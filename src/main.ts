import { Game } from './engine/Game.js';
import { PlayerColor } from './engine/types.js';
import { BoardRenderer } from './renderer/BoardRenderer.js';
import { InputHandler } from './renderer/InputHandler.js';
import { NotationParser } from './engine/NotationParser.js';

function main() {
  const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
  if (!canvas) {
    throw new Error('Canvas element not found');
  }

  const turnIndicator = document.getElementById('turnIndicator') as HTMLElement;
  if (!turnIndicator) {
    throw new Error('Turn indicator element not found');
  }

  const endTurnBtn = document.getElementById('endTurnBtn') as HTMLButtonElement;
  if (!endTurnBtn) {
    throw new Error('End turn button not found');
  }

  const victoryOverlay = document.getElementById('victoryOverlay');
  if (!victoryOverlay) {
    throw new Error('Victory overlay not found');
  }

  const victoryMessage = document.getElementById('victoryMessage');
  if (!victoryMessage) {
    throw new Error('Victory message not found');
  }

  const startOverBtn = document.getElementById('startOverBtn') as HTMLButtonElement;
  if (!startOverBtn) {
    throw new Error('Start over button not found');
  }

  const actionButtons = document.getElementById('actionButtons');
  if (!actionButtons) {
    throw new Error('Action buttons container not found');
  }

  const toggleTargetsBtn = document.getElementById('toggleTargetsBtn') as HTMLButtonElement;
  if (!toggleTargetsBtn) {
    throw new Error('Toggle targets button not found');
  }

  const currentNotation = document.getElementById('currentNotation');
  if (!currentNotation) {
    throw new Error('Current notation display not found');
  }

  const notationTextInput = document.getElementById('notationTextInput') as HTMLInputElement;
  if (!notationTextInput) {
    throw new Error('Notation text input not found');
  }

  const resetBoardBtn = document.getElementById('resetBoardBtn') as HTMLButtonElement;
  if (!resetBoardBtn) {
    throw new Error('Reset board button not found');
  }

  const debugBtn = document.getElementById('debugBtn') as HTMLButtonElement;
  if (!debugBtn) {
    throw new Error('Debug button not found');
  }

  let debugView = false;

  // Initialize game
  const game = new Game();
  const renderer = new BoardRenderer(canvas);
  const inputHandler = new InputHandler(canvas, game, renderer, () => {
    render();
  });

  // Set up end turn button
  inputHandler.setupEndTurnButton(endTurnBtn);

  // Set up start over button
  startOverBtn.addEventListener('click', () => {
    game.reset();
    render();
  });

  // Set up action buttons
  toggleTargetsBtn.addEventListener('click', () => {
    const nextMode = game.getActionMode() === 'move' ? 'ability' : 'move';
    game.setActionMode(nextMode);
    render();
  });

  debugBtn.addEventListener('click', () => {
    debugView = !debugView;
    debugBtn.classList.toggle('active', debugView);
    debugBtn.textContent = debugView ? 'Debug (on)' : 'Debug';
    render();
  });

  // Set up reset board button
  resetBoardBtn.addEventListener('click', () => {
    const notation = notationTextInput.value.trim();
    if (notation) {
      if (NotationParser.validate(notation)) {
        game.reset(notation);
        notationTextInput.value = '';
        render();
      } else {
        alert('Invalid notation format. Please check your input.\nExample: White: {L:D1, B:E1}; Black: {L:D7, B:E7}');
      }
    } else {
      // Reset to default if no notation provided
      game.reset();
      render();
    }
  });

  // Render function
  function render() {
    renderer.render(game, { debug: debugView });
    
    // Update notation display
    if (currentNotation) {
      currentNotation.textContent = game.generateNotation();
    }
    
    // Update action buttons visibility and state
    const selectedPiece = game.getSelectedPiece();
    if (selectedPiece) {
      if (actionButtons) {
        actionButtons.classList.remove('hidden');
      }
      const isJailed = !selectedPiece.canUseAbility(game.board);
      const canUseAbility = selectedPiece.hasActiveAbility() && !isJailed;
      toggleTargetsBtn.disabled = !canUseAbility;
      const isMoveMode = game.getActionMode() === 'move';
      toggleTargetsBtn.textContent = isMoveMode
        ? (isJailed ? 'Jailed!' : 'Show Ability Targets')
        : 'Show Move Targets';
      toggleTargetsBtn.classList.toggle('mode-move', isMoveMode);
      toggleTargetsBtn.classList.toggle('mode-ability', !isMoveMode);
    } else {
      if (actionButtons) {
        actionButtons.classList.add('hidden');
      }
    }
    
    if (game.gameOver && game.winner) {
      const winnerText = game.winner === PlayerColor.White ? 'White' : 'Black';
      if (victoryMessage) {
        victoryMessage.textContent = `${winnerText} Wins!`;
      }
      if (victoryOverlay) {
        victoryOverlay.classList.remove('hidden');
      }
      endTurnBtn.disabled = true;
      if (actionButtons) {
        actionButtons.classList.add('hidden');
      }
    } else {
      if (victoryOverlay) {
        victoryOverlay.classList.add('hidden');
      }
      endTurnBtn.disabled = false;
      renderer.updateTurnIndicator(turnIndicator, game.currentTurn);
    }
  }

  // Handle window resize
  window.addEventListener('resize', () => {
    renderer.updateDimensions(game);
    render();
  });

  // Initial render
  render();
}

// Start the game when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}
