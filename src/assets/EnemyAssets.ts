import * as THREE from 'three';
import { COLORS, ENEMY } from '../core/Constants.js';
import { EnemyType } from '../core/Types.js';

/**
 * Simplified Veil Entity Geometries
 * Using reliable Three.js primitives that always render correctly
 */
export class EnemyAssets {
  static createVeilEntity(type: EnemyType): THREE.Group {
    const group = new THREE.Group();

    switch (type) {
      case EnemyType.BASIC:
        this.createBasicEntity(group);
        break;
      case EnemyType.FAST:
        this.createFastEntity(group);
        break;
      case EnemyType.ECHO:
        this.createEchoEntity(group);
        break;
      case EnemyType.HEAVY:
        this.createHeavyEntity(group);
        break;
      case EnemyType.SPLIT:
        this.createSplitEntity(group);
        break;
    }

    return group;
  }

  /**
   * Basic Entity - Simple box with internal core
   */
  private static createBasicEntity(group: THREE.Group): void {
    // Outer wireframe box
    const outerGeometry = new THREE.BoxGeometry(ENEMY.SIZE, ENEMY.SIZE, ENEMY.SIZE);
    const outerMaterial = new THREE.MeshBasicMaterial({
      color: COLORS.WIREFRAME_WHITE,
      wireframe: true,
      transparent: true,
      opacity: 0.8
    });
    const outer = new THREE.Mesh(outerGeometry, outerMaterial);
    group.add(outer);

    // Inner solid core
    const innerGeometry = new THREE.BoxGeometry(ENEMY.SIZE * 0.4, ENEMY.SIZE * 0.4, ENEMY.SIZE * 0.4);
    const innerMaterial = new THREE.MeshBasicMaterial({
      color: COLORS.WIREFRAME_WHITE,
      transparent: true,
      opacity: 0.4
    });
    const inner = new THREE.Mesh(innerGeometry, innerMaterial);
    group.add(inner);

    // Corner markers (8 small spheres at corners)
    const cornerGeometry = new THREE.SphereGeometry(ENEMY.SIZE * 0.15, 8, 8);
    const cornerMaterial = new THREE.MeshBasicMaterial({
      color: COLORS.WIREFRAME_WHITE,
      wireframe: true,
      transparent: true,
      opacity: 0.6
    });

    const corners = [
      [1, 1, 1], [1, 1, -1], [1, -1, 1], [1, -1, -1],
      [-1, 1, 1], [-1, 1, -1], [-1, -1, 1], [-1, -1, -1]
    ];

    corners.forEach(c => {
      const corner = new THREE.Mesh(cornerGeometry, cornerMaterial);
      corner.position.set(
        c[0] * ENEMY.SIZE * 0.5,
        c[1] * ENEMY.SIZE * 0.5,
        c[2] * ENEMY.SIZE * 0.5
      );
      group.add(corner);
    });
  }

  /**
   * Fast Entity - Elongated dart shape
   */
  private static createFastEntity(group: THREE.Group): void {
    // Main body - stretched octahedron
    const bodyGeometry = new THREE.OctahedronGeometry(ENEMY.SIZE * 0.4, 0);
    const bodyMaterial = new THREE.MeshBasicMaterial({
      color: COLORS.WIREFRAME_WHITE,
      wireframe: true,
      transparent: true,
      opacity: 0.8
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.scale.set(1, 1, 2.5); // Elongate in Z
    group.add(body);

    // Wing-like protrusions
    const wingGeometry = new THREE.ConeGeometry(ENEMY.SIZE * 0.3, ENEMY.SIZE * 0.8, 4);
    const wingMaterial = new THREE.MeshBasicMaterial({
      color: COLORS.WIREFRAME_WHITE,
      wireframe: true,
      transparent: true,
      opacity: 0.5
    });

    const wing1 = new THREE.Mesh(wingGeometry, wingMaterial);
    wing1.position.set(ENEMY.SIZE * 0.4, 0, 0);
    wing1.rotation.z = Math.PI / 2;
    group.add(wing1);

    const wing2 = new THREE.Mesh(wingGeometry, wingMaterial.clone());
    wing2.position.set(-ENEMY.SIZE * 0.4, 0, 0);
    wing2.rotation.z = -Math.PI / 2;
    group.add(wing2);

    // Rear engine glow
    const engineGeometry = new THREE.SphereGeometry(ENEMY.SIZE * 0.25, 8, 8);
    const engineMaterial = new THREE.MeshBasicMaterial({
      color: 0x808080,
      transparent: true,
      opacity: 0.5
    });
    const engine = new THREE.Mesh(engineGeometry, engineMaterial);
    engine.position.z = -ENEMY.SIZE * 0.8;
    group.add(engine);
  }

  /**
   * Echo Entity - Multiple floating fragments
   */
  private static createEchoEntity(group: THREE.Group): void {
    // Multiple small fragments in a ring
    const fragmentCount = 6;
    const fragmentGeometry = new THREE.OctahedronGeometry(ENEMY.SIZE * 0.25, 0);
    const fragmentMaterial = new THREE.MeshBasicMaterial({
      color: COLORS.DEPTH_BLUE,
      wireframe: true,
      transparent: true,
      opacity: 0.7
    });

    for (let i = 0; i < fragmentCount; i++) {
      const fragment = new THREE.Mesh(fragmentGeometry, fragmentMaterial.clone());
      const angle = (i / fragmentCount) * Math.PI * 2;
      fragment.position.set(
        Math.cos(angle) * ENEMY.SIZE * 0.6,
        Math.sin(angle) * ENEMY.SIZE * 0.6,
        (Math.random() - 0.5) * ENEMY.SIZE * 0.3
      );
      fragment.userData.phaseOffset = angle;
      group.add(fragment);
    }

    // Central core
    const coreGeometry = new THREE.IcosahedronGeometry(ENEMY.SIZE * 0.35, 0);
    const coreMaterial = new THREE.MeshBasicMaterial({
      color: COLORS.DEPTH_BLUE,
      transparent: true,
      opacity: 0.4
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    core.userData.isCore = true;
    group.add(core);
  }

  /**
   * Heavy Entity - Large fortress-like structure
   */
  private static createHeavyEntity(group: THREE.Group): void {
    // Main block
    const mainGeometry = new THREE.BoxGeometry(
      ENEMY.SIZE * 1.4,
      ENEMY.SIZE * 1.4,
      ENEMY.SIZE * 1.4
    );
    const mainMaterial = new THREE.MeshBasicMaterial({
      color: COLORS.THREAT_RED,
      wireframe: true,
      transparent: true,
      opacity: 0.8
    });
    const main = new THREE.Mesh(mainGeometry, mainMaterial);
    group.add(main);

    // Armor plates on sides
    const plateGeometry = new THREE.BoxGeometry(
      ENEMY.SIZE * 0.3,
      ENEMY.SIZE * 0.8,
      ENEMY.SIZE * 0.3
    );
    const plateMaterial = new THREE.MeshBasicMaterial({
      color: COLORS.THREAT_RED,
      transparent: true,
      opacity: 0.4
    });

    for (let i = 0; i < 4; i++) {
      const plate = new THREE.Mesh(plateGeometry, plateMaterial.clone());
      const angle = (i / 4) * Math.PI * 2;
      plate.position.set(
        Math.cos(angle) * ENEMY.SIZE * 0.85,
        Math.sin(angle) * ENEMY.SIZE * 0.85,
        0
      );
      plate.rotation.z = angle + Math.PI / 2;
      group.add(plate);
    }

    // Core reactor
    const coreGeometry = new THREE.DodecahedronGeometry(ENEMY.SIZE * 0.4, 0);
    const coreMaterial = new THREE.MeshBasicMaterial({
      color: COLORS.THREAT_RED,
      transparent: true,
      opacity: 0.5
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    core.userData.isCore = true;
    group.add(core);
  }

  /**
   * Split Entity - Torus with orbiting spheres
   */
  private static createSplitEntity(group: THREE.Group): void {
    // Main torus knot
    const torusGeometry = new THREE.TorusGeometry(
      ENEMY.SIZE * 0.5,
      ENEMY.SIZE * 0.15,
      8,
      16
    );
    const torusMaterial = new THREE.MeshBasicMaterial({
      color: COLORS.WIREFRAME_WHITE,
      wireframe: true,
      transparent: true,
      opacity: 0.7
    });
    const torus = new THREE.Mesh(torusGeometry, torusMaterial);
    group.add(torus);

    // Orbiting spheres
    const orbGeometry = new THREE.SphereGeometry(ENEMY.SIZE * 0.2, 8, 8);
    const orbMaterial = new THREE.MeshBasicMaterial({
      color: COLORS.WIREFRAME_WHITE,
      transparent: true,
      opacity: 0.5
    });

    const orb1 = new THREE.Mesh(orbGeometry, orbMaterial.clone());
    orb1.position.set(ENEMY.SIZE * 0.7, 0, 0);
    orb1.userData.isOrb = true;
    orb1.userData.orbitAngle = 0;
    group.add(orb1);

    const orb2 = new THREE.Mesh(orbGeometry, orbMaterial.clone());
    orb2.position.set(-ENEMY.SIZE * 0.5, 0, 0);
    orb2.userData.isOrb = true;
    orb2.userData.orbitAngle = Math.PI;
    group.add(orb2);

    const orb3 = new THREE.Mesh(orbGeometry, orbMaterial.clone());
    orb3.position.set(0, ENEMY.SIZE * 0.5, 0);
    orb3.userData.isOrb = true;
    orb3.userData.orbitAngle = Math.PI / 2;
    group.add(orb3);
  }

  /**
   * Update animation for special entity types
   */
  static updateEntity(group: THREE.Group, type: EnemyType, time: number, convergence: number = 0): void {
    // Apply convergence glow effect to all enemies
    if (convergence >= 0.95) {
      group.children.forEach(child => {
        if (child instanceof THREE.Mesh) {
          const mat = child.material as THREE.MeshBasicMaterial;
          mat.color.setHex(COLORS.THREAT_RED);
          if (!mat.wireframe) {
            mat.opacity = Math.min(1, mat.opacity + 0.2);
          }
        }
      });
    } else if (convergence >= 0.7) {
      group.children.forEach(child => {
        if (child instanceof THREE.Mesh) {
          const mat = child.material as THREE.MeshBasicMaterial;
          mat.color.setHex(COLORS.AMBER);
        }
      });
    } else {
      // Reset colors when not converged
      group.children.forEach(child => {
        if (child instanceof THREE.Mesh) {
          const mat = child.material as THREE.MeshBasicMaterial;
          if (type === EnemyType.ECHO) {
            mat.color.setHex(COLORS.DEPTH_BLUE);
          } else if (type === EnemyType.HEAVY) {
            mat.color.setHex(COLORS.THREAT_RED);
          } else {
            mat.color.setHex(COLORS.WIREFRAME_WHITE);
          }
        }
      });
    }

    if (type === EnemyType.ECHO) {
      // Phase fragments in and out
      group.children.forEach(child => {
        if (child.userData.phaseOffset !== undefined && child instanceof THREE.Mesh) {
          const mat = child.material as THREE.MeshBasicMaterial;
          const phase = Math.sin(time * 0.003 + child.userData.phaseOffset);
          mat.opacity = 0.3 + phase * 0.3;
          child.position.z = (Math.random() - 0.5) * ENEMY.SIZE * 0.5;
        }
        if (child.userData.isCore) {
          const scale = 1 + Math.sin(time * 0.005) * 0.2;
          child.scale.set(scale, scale, scale);
        }
      });
    }

    if (type === EnemyType.HEAVY) {
      // Pulse core
      group.children.forEach(child => {
        if (child.userData.isCore && child instanceof THREE.Mesh) {
          const mat = child.material as THREE.MeshBasicMaterial;
          const pulse = Math.sin(time * 0.002) * 0.5 + 0.5;
          mat.opacity = 0.3 + pulse * 0.3;
          const scale = 1 + convergence * 0.3;
          child.scale.set(scale, scale, scale);
        }
      });
    }

    if (type === EnemyType.SPLIT) {
      // Orbit the spheres
      group.children.forEach(child => {
        if (child.userData.isOrb) {
          child.userData.orbitAngle += 0.02 + convergence * 0.03;
          const radius = ENEMY.SIZE * 0.6;
          child.position.x = Math.cos(child.userData.orbitAngle) * radius;
          child.position.y = Math.sin(child.userData.orbitAngle) * radius * 0.8;
        }
      });
    }

    if (type === EnemyType.FAST) {
      // Jitter animation for fast enemies
      group.children.forEach(child => {
        if (child instanceof THREE.Mesh && !child.userData.engine) {
          child.rotation.x += 0.1;
          child.rotation.y += 0.05;
        }
      });
    }
  }
}
