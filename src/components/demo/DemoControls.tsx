import { useDemo } from '@/context/demo.context';
import './DemoControls.css';

/**
 * Componente de controles flotantes para el DemoRunner
 * Muestra botones de play/pause/skip/reset, selector de velocidad e indicador de progreso
 */
export function DemoControls() {
  const {
    isRunning,
    isPaused,
    currentStep,
    currentScript,
    speed,
    startDemo,
    pauseDemo,
    resumeDemo,
    stopDemo,
    skipStep,
    setSpeed,
  } = useDemo();

  // No mostrar controles si no hay script activo
  if (!currentScript) {
    return null;
  }

  const totalSteps = currentScript.steps.length;
  const progress = totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 0;

  const handlePlayPause = () => {
    if (!isRunning) {
      // Si no está ejecutando, iniciar (aunque esto no debería pasar normalmente)
      startDemo(currentScript);
    } else if (isPaused) {
      resumeDemo();
    } else {
      pauseDemo();
    }
  };

  const handleReset = () => {
    stopDemo();
    // Reiniciar el script
    setTimeout(() => {
      startDemo(currentScript);
    }, 100);
  };

  return (
    <div className="demo-controls">
      <div className="demo-controls-header">
        <h3 className="demo-controls-title">Demo Runner</h3>
        <span className="demo-controls-progress">
          Paso {currentStep + 1} de {totalSteps}
        </span>
      </div>

      <div className="demo-controls-progress-bar">
        <div
          className="demo-controls-progress-fill"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="demo-controls-buttons">
        <button
          className="demo-controls-button demo-controls-button-primary"
          onClick={handlePlayPause}
          title={isPaused ? 'Reanudar' : isRunning ? 'Pausar' : 'Iniciar'}
        >
          {isPaused ? '▶️' : isRunning ? '⏸️' : '▶️'}
        </button>

        <button
          className="demo-controls-button"
          onClick={skipStep}
          disabled={!isRunning || currentStep >= totalSteps - 1}
          title="Saltar paso"
        >
          ⏭️
        </button>

        <button
          className="demo-controls-button"
          onClick={handleReset}
          title="Reiniciar"
        >
          🔁
        </button>

        <button
          className="demo-controls-button"
          onClick={stopDemo}
          title="Detener"
        >
          ⏹️
        </button>
      </div>

      <div className="demo-controls-speed">
        <label className="demo-controls-speed-label">Velocidad:</label>
        <select
          className="demo-controls-speed-select"
          value={speed}
          onChange={(e) => setSpeed(e.target.value as 'normal' | 'fast')}
        >
          <option value="normal">Normal</option>
          <option value="fast">Rápida</option>
        </select>
      </div>
    </div>
  );
}
