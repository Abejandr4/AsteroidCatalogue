// src/components/OrbitSimulator.jsx
import React, { useState, useEffect, Suspense, useRef } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { Line, Text, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

// This is now the INITIAL state for the planet colors
const INITIAL_PLANET_COLORS = {
  "Mercury": "#a0a0a0",
  "Venus": "#d4a06a",
  "Earth": "#06b6d4",
  "Mars": "#ff4d4d",
  "Jupiter": "#ffc300",
  "Saturn": "#e6d5a8",
  "Uranus": "#a8e6e6",
  "Neptune": "#6a82d4",
};

// Background component for space
function SpaceBackground() {
  const texture = useLoader(THREE.TextureLoader, `${import.meta.env.BASE_URL}8k_stars_milky_way.jpg`);
  return (
    <mesh>
      <sphereGeometry args={[500, 60, 40]} />
      <meshBasicMaterial map={texture} side={THREE.BackSide} />
    </mesh>
  );
}

function Sun() {
  const sunTexture = useLoader(THREE.TextureLoader, `${import.meta.env.BASE_URL}2k_sun.jpg`);
  return (
    <>
      <mesh>
        <sphereGeometry args={[0.2, 32, 32]} />
        <meshBasicMaterial map={sunTexture} />
        <Text position={[0, 0.3, 0]} fontSize={0.2} color="white" anchorX="center">Sun</Text>
      </mesh>
      <pointLight position={[0, 0, 0]} color="var(--color-primary)" intensity={3} distance={100} />
    </>
  );
}

// Scene now accepts the full color objects as props and hideOrbits state
function Scene({ planetColors, asteroidColor, hideOrbits, hiddenAsteroids, targetAsteroid }) {
  const [orbits, setOrbits] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchOrbits() {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}orbitas_3d.json`);
        if (!response.ok) throw new Error('orbitas_3d.json not found.');
        const data = await response.json();
        setOrbits(data);
      } catch (e) {
        setError(e.message);
      }
    }
    fetchOrbits();
  }, []);

  return (
    <>
      <SpaceBackground />
      <Sun />

      {Object.entries(orbits).map(([nombre, orbitData]) => {
        if (!orbitData.coordenadas || orbitData.coordenadas.length === 0) return null;
        
        // Check if the orbit belongs to a planet using the passed colors object
        const isPlanet = planetColors.hasOwnProperty(nombre);
        
        // Hide asteroid if it's in the hidden list and hideOrbits is active
        if (!isPlanet && hideOrbits && targetAsteroid && nombre !== targetAsteroid && hiddenAsteroids.current.includes(nombre)) {
          return null;
        }
        
        // Assign color dynamically
        const color = isPlanet ? planetColors[nombre] : asteroidColor;

        // NUEVO: Define la posición para la etiqueta de texto usando el primer punto de la órbita.
        const textPosition = orbitData.coordenadas[0];

        // NUEVO: Se usa un Fragment (<>) para devolver la Línea y el Texto juntos.
        return (
          <React.Fragment key={nombre}>
            <Line
              points={orbitData.coordenadas.map(p => new THREE.Vector3(p[0], p[1], p[2]))}
              color={color}
              lineWidth={isPlanet ? 1.5 : 1}
            />
            {/* NUEVO: Se añade el componente <Text> para mostrar el nombre */}
            <Text
              // Se posiciona en el primer punto de la órbita con un pequeño desplazamiento hacia arriba
              position={[textPosition[0], textPosition[1] + 0.15, textPosition[2]]}
              fontSize={isPlanet ? 0.25 : 0.1} // Nombres de planetas más grandes
              color="white"
              anchorX="left"
              anchorY="middle"
            >
              {nombre}
            </Text>
          </React.Fragment>
        );
      })}
      {error && <Text position={[0, 0, 0]} color="var(--color-danger)" fontSize={0.2} anchorX="center">{error}</Text>}
    </>
  );
}

function OrbitSimulator({ onReturn, targetAsteroid }) {
  const [planetColors, setPlanetColors] = useState(INITIAL_PLANET_COLORS);
  const [asteroidColor, setAsteroidColor] = useState('#8c949fff');
  const [canvasKey, setCanvasKey] = useState(0);
  const [hideOrbits, setHideOrbits] = useState(false);
  
  // Use ref to store fixed hidden asteroids
  const hiddenAsteroids = useRef([]);
  const isInitialized = useRef(false);

  // Initialize hidden asteroids once when orbits are loaded
  useEffect(() => {
    if (!isInitialized.current) {
      async function initHiddenAsteroids() {
        try {
          const response = await fetch(`${import.meta.env.BASE_URL}orbitas_3d.json`);
          if (response.ok) {
            const data = await response.json();
            const allOrbitNames = Object.keys(data);
            
            // Filter out planets to get only asteroids
            const asteroidNames = allOrbitNames.filter(
              name => !INITIAL_PLANET_COLORS.hasOwnProperty(name)
            );
            
            // Generate fixed random list using deterministic seed
            const seededRandom = (seed) => {
              let x = Math.sin(seed++) * 10000;
              return x - Math.floor(x);
            };
            
            const shuffled = [...asteroidNames];
            for (let i = shuffled.length - 1; i > 0; i--) {
              const j = Math.floor(seededRandom(i + 42) * (i + 1));
              [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            
            // Store 99 asteroids to hide (or less if there aren't that many)
            hiddenAsteroids.current = shuffled.slice(0, Math.min(99, asteroidNames.length));
            isInitialized.current = true;
          }
        } catch (e) {
          console.error('Error loading orbits for hiding:', e);
        }
      }
      
      initHiddenAsteroids();
    }
  }, []);

  // Auto-refresh 1 second after opening
  useEffect(() => {
    const timer = setTimeout(() => {
      setCanvasKey(prev => prev + 1);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  // Handler to update a specific planet's color
  const handlePlanetColorChange = (planetName, newColor) => {
    setPlanetColors(prevColors => ({
      ...prevColors,
      [planetName]: newColor,
    }));
  };

  // Handler to refresh - reload everything
  const handleRefresh = () => {
    setPlanetColors(INITIAL_PLANET_COLORS);
    setAsteroidColor('#8c949fff');
    setCanvasKey(prev => prev + 1); // Force complete Canvas remount
  };

  // Toggle hide orbits
  const toggleHideOrbits = () => {
    setHideOrbits(prev => !prev);
  };

  return (
    <div className="simulatorWrapper">
      <div className="controlsPanel">
        {/* Asteroid control on the left */}
        <div className="controlItem">
          <label htmlFor="asteroidColor">Asteroids</label>
          <input
            type="color"
            id="asteroidColor"
            value={asteroidColor}
            onChange={(e) => setAsteroidColor(e.target.value)}
          />
        </div>
        
        {/* Vertical divider */}
        <div style={{ width: '1px', height: '60px', backgroundColor: 'var(--color-border)' }}></div>

        {/* Planet grid on the right */}
        <div className="planetsGrid">
          {Object.entries(planetColors).map(([name, color]) => (
            <div className="controlItem" key={name}>
              <label htmlFor={`${name}-color`}>{name}</label>
              <input
                type="color"
                id={`${name}-color`}
                value={color}
                onChange={(e) => handlePlanetColorChange(name, e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Bottom right buttons */}
      <div className="simulatorButtons">
        <button className="simulatorActionButton refreshButton" onClick={handleRefresh}>
          ↻ Recargar
        </button>
        <button className="simulatorActionButton refreshButton" onClick={onReturn}>
          Mostrar detalles
        </button>
        <button className='simulatorActionButton refreshButton' onClick={toggleHideOrbits}>
          {hideOrbits ? 'Mostar otros asteroides' : 'Ocultar otros asteroides'}
        </button>
      </div>

      <Suspense fallback={<div className="text-white">Loading Simulator...</div>}>
        <Canvas key={canvasKey} camera={{ position: [20, 20, 20], fov: 75, near: 0.1, far: 1000 }}>
          <Scene 
            planetColors={planetColors} 
            asteroidColor={asteroidColor}
            hideOrbits={hideOrbits}
            hiddenAsteroids={hiddenAsteroids}
            targetAsteroid={targetAsteroid}
          />
          
          <OrbitControls minDistance={1} maxDistance={80} target={[0,-0.2,0]} />
          
        </Canvas>
      </Suspense>
    </div>
  );
}

export default OrbitSimulator;