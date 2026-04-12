import * as THREE from 'three';
import { COLORS } from '../core/Constants.js';

export class GameScene {
  private scene: THREE.Scene;
  private gridHelper!: THREE.GridHelper;
  private debris: THREE.Mesh[] = [];
  private depthLayers: THREE.Group[] = [];

  constructor() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);
    this.setupScene();
  }

  private setupScene(): void {
    // Simple fog for depth
    this.scene.fog = new THREE.Fog(0x000000, 50, 300);

    // Main grid at Z=0 for reference
    this.createGrid();

    // Create floating debris for depth perception
    this.createDebris();

    // Create depth reference shapes
    this.createDepthReferences();
  }

  private createGrid(): void {
    this.gridHelper = new THREE.GridHelper(400, 40, 0x1a1a1a, 0x0a0a0a);
    this.gridHelper.position.y = -20;
    this.scene.add(this.gridHelper);
  }

  private createDebris(): void {
    const debrisCount = 50;
    const geometries = [
      new THREE.BoxGeometry(2, 2, 2),
      new THREE.TetrahedronGeometry(1.5),
      new THREE.OctahedronGeometry(1),
    ];

    const material = new THREE.MeshBasicMaterial({
      color: 0x333333,
      wireframe: true,
      transparent: true,
      opacity: 0.3
    });

    for (let i = 0; i < debrisCount; i++) {
      const geometry = geometries[Math.floor(Math.random() * geometries.length)];
      const mesh = new THREE.Mesh(geometry, material.clone());

      // Spawn debris in visible area (between Z=-100 and Z=80)
      mesh.position.set(
        (Math.random() - 0.5) * 300,
        (Math.random() - 0.5) * 200,
        -100 + Math.random() * 180
      );

      // Random scale
      const scale = 0.5 + Math.random() * 2;
      mesh.scale.set(scale, scale, scale);

      // Random rotation
      mesh.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );

      // Opacity based on Z (fade when far)
      const depth = (mesh.position.z + 100) / 180; // 0 to 1
      const meshMat = mesh.material as THREE.MeshBasicMaterial;
      meshMat.opacity = 0.1 + depth * 0.3;

      // Store rotation speed
      mesh.userData.rotSpeed = {
        x: (Math.random() - 0.5) * 0.001,
        y: (Math.random() - 0.5) * 0.001
      };

      this.debris.push(mesh);
      this.scene.add(mesh);
    }
  }

  private createDepthReferences(): void {
    // Add some distant reference shapes
    const depths = [-50, 0, 50];

    depths.forEach(depth => {
      const geometry = new THREE.IcosahedronGeometry(8, 0);
      const material = new THREE.MeshBasicMaterial({
        color: 0x40C0FF,
        wireframe: true,
        transparent: true,
        opacity: 0.1
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(
        (Math.random() - 0.5) * 200,
        (Math.random() - 0.5) * 100,
        depth
      );

      this.depthLayers.push(mesh as any);
      this.scene.add(mesh);
    });
  }

  update(time: number): void {
    // Slowly rotate debris
    this.debris.forEach((mesh) => {
      mesh.rotation.x += (mesh.userData.rotSpeed as any).x;
      mesh.rotation.y += (mesh.userData.rotSpeed as any).y;
    });

    // Subtle grid pulse
    const gridPulse = 0.15 + Math.sin(time * 0.3) * 0.05;
    (this.gridHelper.material as any).opacity = gridPulse;
  }

  getThreeScene(): THREE.Scene {
    return this.scene;
  }

  dispose(): void {
    this.debris.forEach(mesh => {
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    });

    this.depthLayers.forEach(mesh => {
      (mesh as any).geometry.dispose();
      ((mesh as any).material as THREE.Material).dispose();
    });

    this.gridHelper.dispose();
  }
}
