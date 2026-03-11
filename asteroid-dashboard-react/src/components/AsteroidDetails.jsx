// src/components/AsteroidDetails.jsx
import React, { useState, useEffect } from 'react';
import useAsteroidStore from '../store';
import { motion, AnimatePresence } from 'framer-motion';
import OrbitSimulator from './OrbitSimulator';
import AsteroidAIInsights from './AsteroidAIInsights';

// --- Reusable Popup Component ---
function InfoPopup({ content, onClose }) {
  if (!content) return null;

  return (
    <motion.div
      className="infoPopupOverlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="infoPopupContent"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="infoPopupTitle">{content.title}</h3>
        <p className="infoPopupDescription">{content.description}</p>
        <button onClick={onClose} className="infoPopupCloseButton">Got it</button>
      </motion.div>
    </motion.div>
  );
}

// --- Reusable Module Button Component ---
const ModuleButton = ({ label, value, onClick, unit = '' }) => (
  <motion.button
    className="moduleButton"
    onClick={onClick}
    whileTap={{ scale: 0.95 }}
  >
    <div className="dataLabel">{label}</div>
    <div className="dataValue">
      {value}
      {unit && <span className="dataUnit"> {unit}</span>}
    </div>
  </motion.button>
);

// --- Definiciones de Contenido para Popups ---
const POPUP_DEFINITIONS = {
  MOID: {
    title: 'Distancia mínima de intersección orbital (MOID)',
    description: 'El MOID es la distancia mínima entre las órbitas de dos cuerpos. En este caso, representa lo más cerca que la órbita del asteroide llega a la órbita de la Tierra. Un valor menor indica un mayor potencial de acercamiento. Se mide en Unidades Astronómicas (AU).',
  },
  PERIHELION: {
    title: 'Distancia de Perihelio (q)',
    description: 'Este es el punto en la órbita del asteroide donde se encuentra más cerca del Sol. Un perihelio pequeño significa que el asteroide se adentra profundamente en el sistema solar interior. Se mide en Unidades Astronómicas (AU).',
  },
  APHELION: {
    title: 'Distancia de Afelio (ad)',
    description: 'Este es el punto en la órbita del asteroide donde se encuentra más alejado del Sol. La distancia de afelio define el límite exterior del recorrido del asteroide. Se mide en Unidades Astronómicas (AU).',
  },
  DIAMETER: {
    title: 'Diámetro Estimado',
    description: 'Este es el diámetro estimado del asteroide, medido en kilómetros. El tamaño se estima a menudo basándose en su brillo (magnitud absoluta) y su reflectividad (albedo), ya que las mediciones directas son poco comunes.',
  },
  ROTATION: {
    title: 'Periodo de Rotación',
    description: 'Es el tiempo que tarda el asteroide en completar una rotación completa sobre su eje. Nos da una idea de la duración del "día" en el asteroide y se mide en horas.',
  },
  MAGNITUDE: {
    title: 'Magnitud Absoluta (H)',
    description: 'La Magnitud Absoluta es una medida del brillo intrínseco de un asteroide. Es el brillo que tendría si se viera desde una distancia estándar. Un número menor significa un objeto más brillante (y probablemente más grande).',
  },
  ALBEDO: {
    title: 'Albedo',
    description: 'El albedo mide la reflectividad de la superficie del asteroide. Es un valor entre 0 (perfectamente negro, absorbe toda la luz) y 1 (perfectamente blanco, refleja toda la luz). Ayuda a estimar el tamaño y la composición del asteroide.',
  },
  HAZARD: {
    title: 'Asteroide Potencialmente Peligroso (PHA)',
    description: 'Un asteroide se clasifica como "Potencialmente Peligroso" si su Distancia Mínima de Intersección de Órbita (MOID) con la Tierra es menor a 0.05 AU y su magnitud absoluta (H) es de 22.0 o más brillante. Esta clasificación no significa que un impacto sea inminente, solo que requiere un monitoreo cuidadoso.',
  },
};

function AsteroidDetails() {
  const { selectedAsteroid } = useAsteroidStore();
  const [popupContent, setPopupContent] = useState(null);
  // CHANGED: showSimulator is now true by default
  const [showSimulator, setShowSimulator] = useState(true);
  const [simulatorKey, setSimulatorKey] = useState(0);

  useEffect(() => {
    if (selectedAsteroid) {
      // CHANGED: When a new asteroid is selected, we default back to the simulator view
      setShowSimulator(true);
      setSimulatorKey((prev) => prev + 1);
    }
  }, [selectedAsteroid]);

  if (!selectedAsteroid) {
    return (
      <div className="detailsPanel welcomeMessage">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <p className="welcomeSubtitle">Selecciona un asteroide para ver sus datos</p>
        </motion.div>
      </div>
    );
  }

  // Logic to show the Simulator by default
  if (showSimulator) {
    return (
      <div className="simulatorContainer" style={{ position: 'relative', height: '100%' }}>        
        <OrbitSimulator 
          key={simulatorKey} 
          targetAsteroid={selectedAsteroid.full_name || selectedAsteroid.identificador}
          onReturn={() => setShowSimulator(false)}
        />
      </div>
    );
  }

  const isHazardous = selectedAsteroid.es_peligroso === true || selectedAsteroid.es_peligroso === 'Y';

  return (
    <>
      <AnimatePresence>
        {popupContent && <InfoPopup content={popupContent} onClose={() => setPopupContent(null)} />}
      </AnimatePresence>
      
      <motion.div 
        key={selectedAsteroid.identificador}
        className="detailsPanel"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="detailsHeader">
          <h1 className="detailsTitle">{selectedAsteroid.full_name || selectedAsteroid.identificador}</h1>
          {/* CHANGED: This button now returns the user to the default Orbit view */}
          <button className="simulatorButton" onClick={() => setShowSimulator(true)}>
            ← Regresar a la órbita
          </button>
        </div>
        
        {/* <AsteroidAIInsights className="AI" asteroid={selectedAsteroid} /> */}

        <div className='moduleGroup'>
          <h2 className="moduleGroupTitle">Distancias y órbita</h2>
          <p className='infoDetails'>(Dale click a las cajas para más información)</p>
          <div className="moduleGrid">
            <ModuleButton label="Distancia mínima de intersección orbital (MOID)" value={selectedAsteroid.distancia_min_orbita_au?.toFixed(4) || 'Sin asignar'} unit="UA" onClick={() => setPopupContent(POPUP_DEFINITIONS.MOID)} />
            <ModuleButton label="Perihelio (la más cercana al Sol)" value={selectedAsteroid.q?.toFixed(3) || 'Sin asignar'} unit="UA" onClick={() => setPopupContent(POPUP_DEFINITIONS.PERIHELION)} />
            <ModuleButton label="Afelio (la más lejana al Sol)" value={selectedAsteroid.ad?.toFixed(3) || 'Sin asignar'} unit="UA" onClick={() => setPopupContent(POPUP_DEFINITIONS.APHELION)} />
            <ModuleButton label="Periodo orbital" value={selectedAsteroid.periodo_orbital_anios?.toFixed(2) || 'Sin asignar'} unit="años" />
          </div>
        </div>

        <div className="moduleGroup">
          <h2 className="moduleGroupTitle">Características físicas</h2>
          <div className="moduleGrid">
            <ModuleButton label="Diámetro estimado" value={selectedAsteroid.diameter?.toFixed(2) || 'Sin asignar'} unit="km" onClick={() => setPopupContent(POPUP_DEFINITIONS.DIAMETER)} />
            <ModuleButton label="Periodo de rotación" value={selectedAsteroid.periodo_rotacion_horas?.toFixed(2) || 'Sin asignar'} unit="horas" onClick={() => setPopupContent(POPUP_DEFINITIONS.ROTATION)} />
          </div>
        </div>
        
        <div className="moduleGroup2">
          <h2 className="moduleGroupTitle">Luminancia y Peligro</h2>
          <div className="moduleGrid">
            <ModuleButton label="Magnitud absoluta" value={selectedAsteroid.magnitud_absoluta?.toFixed(2) || 'Sin asignar'} onClick={() => setPopupContent(POPUP_DEFINITIONS.MAGNITUDE)} />
            <ModuleButton label="Albedo" value={selectedAsteroid.albedo || 'Sin asignar'} onClick={() => setPopupContent(POPUP_DEFINITIONS.ALBEDO)} />
            <ModuleButton label="Nivel de peligro" value={isHazardous ? 'PHA (peligroso)' : 'No es PHA (no es peligroso)'} onClick={() => setPopupContent(POPUP_DEFINITIONS.HAZARD)} />
          </div>
        </div>
      </motion.div>
    </>
  );
}

export default AsteroidDetails;