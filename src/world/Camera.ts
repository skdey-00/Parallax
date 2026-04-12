import * as THREE from 'three';

export class GameCamera {
  private camera: THREE.PerspectiveCamera;

  constructor() {
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    // Fixed camera position
    this.camera.position.set(0, 0, 150);
    this.camera.lookAt(0, 0, 0);
  }

  update(playerPosition: THREE.Vector3, delta: number): void {
    // Camera is fixed, player rotates instead
    // Slight camera movement for depth feel
    const targetX = playerPosition.x * 0.05;
    const targetY = playerPosition.y * 0.05;
    this.camera.lookAt(targetX, targetY, 0);
  }

  onResize(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  getThreeCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  dispose(): void {
    // Nothing to dispose
  }
}
