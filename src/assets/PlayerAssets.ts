import * as THREE from 'three';
import { COLORS, PLAYER } from '../core/Constants.js';

/**
 * Enhanced Convergence Engine (Player Ship)
 * Octahedron-based with procedural detail layers
 */
export class PlayerAssets {
  static createConvergenceEngine(): THREE.Group {
    const group = new THREE.Group();

    // Core octahedron (main body)
    const coreGeometry = new THREE.OctahedronGeometry(PLAYER.SIZE, 0);
    const coreMaterial = new THREE.MeshBasicMaterial({
      color: COLORS.AMBER,
      wireframe: true,
      transparent: true,
      opacity: 0.9
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    group.add(core);

    // Inner glow shell (smaller octahedron)
    const glowGeometry = new THREE.OctahedronGeometry(PLAYER.SIZE * 0.5, 1);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: COLORS.AMBER,
      transparent: true,
      opacity: 0.4
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    group.add(glow);

    // Outer wireframe cage (larger, more detailed)
    const cageGeometry = new THREE.OctahedronGeometry(PLAYER.SIZE * 1.4, 1);
    const cageMaterial = new THREE.MeshBasicMaterial({
      color: COLORS.AMBER,
      wireframe: true,
      transparent: true,
      opacity: 0.2
    });
    const cage = new THREE.Mesh(cageGeometry, cageMaterial);
    group.add(cage);

    // Convergence rings (orbiting the core)
    const ringGeometry = new THREE.TorusGeometry(PLAYER.SIZE * 1.8, 0.05, 8, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: COLORS.AMBER,
      transparent: true,
      opacity: 0.5
    });

    const ring1 = new THREE.Mesh(ringGeometry, ringMaterial);
    ring1.rotation.x = Math.PI / 2;
    ring1.userData.rotationSpeed = { x: 0.02, y: 0, z: 0 };
    ring1.userData.isRing = true;
    group.add(ring1);

    const ring2 = new THREE.Mesh(ringGeometry, ringMaterial.clone());
    ring2.rotation.y = Math.PI / 2;
    ring2.userData.rotationSpeed = { x: 0, y: 0.015, z: 0 };
    ring2.userData.isRing = true;
    group.add(ring2);

    // Forward convergence spikes
    const spikeGeometry = new THREE.ConeGeometry(0.2, PLAYER.SIZE * 1.5, 4);
    const spikeMaterial = new THREE.MeshBasicMaterial({
      color: COLORS.AMBER,
      wireframe: true,
      transparent: true,
      opacity: 0.6
    });

    for (let i = 0; i < 4; i++) {
      const spike = new THREE.Mesh(spikeGeometry, spikeMaterial);
      const angle = (i / 4) * Math.PI * 2;
      spike.position.set(
        Math.cos(angle) * PLAYER.SIZE * 0.8,
        Math.sin(angle) * PLAYER.SIZE * 0.8,
        PLAYER.SIZE * 0.5
      );
      spike.rotation.z = angle - Math.PI / 2;
      spike.rotation.x = Math.PI / 4;
      group.add(spike);
    }

    group.userData.core = core;
    group.userData.glow = glow;
    group.userData.cage = cage;

    return group;
  }

  static updateConvergenceEngine(group: THREE.Group, velocity: THREE.Vector3, convergence: number): void {
    // Rotate outer cage based on velocity
    if (group.userData.cage) {
      group.userData.cage.rotation.x = velocity.y * 0.5;
      group.userData.cage.rotation.z = -velocity.x * 0.5;
    }

    // Enhanced pulse glow based on convergence
    if (group.userData.glow) {
      const glowMat = group.userData.glow.material as THREE.MeshBasicMaterial;
      const pulseSpeed = 2 + convergence * 4;
      const pulse = Math.sin(Date.now() * 0.001 * pulseSpeed) * 0.5 + 0.5;
      glowMat.opacity = 0.2 + convergence * 0.5 + pulse * 0.2;

      // Change color based on convergence
      if (convergence >= 0.95) {
        glowMat.color.setHex(COLORS.THREAT_RED);
      } else if (convergence >= 0.7) {
        glowMat.color.setHex(COLORS.AMBER);
      } else {
        glowMat.color.setHex(COLORS.DEPTH_BLUE);
      }
    }

    // Pulse core with convergence
    if (group.userData.core) {
      const coreMat = group.userData.core.material as THREE.MeshBasicMaterial;
      const scale = 1 + convergence * 0.2;
      group.userData.core.scale.set(scale, scale, scale);

      // Core color shift
      if (convergence >= 0.95) {
        coreMat.color.setHex(COLORS.THREAT_RED);
      } else if (convergence >= 0.7) {
        coreMat.color.setHex(COLORS.AMBER);
      } else {
        coreMat.color.setHex(COLORS.DEPTH_BLUE);
      }
    }

    // Accelerate ring rotation with convergence
    group.children.forEach(child => {
      if (child.userData.isRing) {
        const speedMultiplier = 1 + convergence * 3;
        child.rotation.x += child.userData.rotationSpeed.x * speedMultiplier;
        child.rotation.y += child.userData.rotationSpeed.y * speedMultiplier;
        child.rotation.z += child.userData.rotationSpeed.z * speedMultiplier;

        // Ring color shift
        if (child instanceof THREE.Mesh) {
          const ringMat = child.material as THREE.MeshBasicMaterial;
          if (convergence >= 0.95) {
            ringMat.color.setHex(COLORS.THREAT_RED);
          } else if (convergence >= 0.7) {
            ringMat.color.setHex(COLORS.AMBER);
          } else {
            ringMat.color.setHex(COLORS.DEPTH_BLUE);
          }
        }
      }
    });
  }
}
