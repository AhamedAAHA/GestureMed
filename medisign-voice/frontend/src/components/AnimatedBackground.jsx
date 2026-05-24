import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function AnimatedBackground({ variant = 'landing' }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, mount.clientWidth / mount.clientHeight, 0.1, 1000);
    camera.position.z = 30;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const particles = [];
    const geometry = new THREE.SphereGeometry(0.15, 8, 8);
    const colors = [0x0ea5e9, 0x22d3ee, 0x38bdf8, 0x67e8f9];

    for (let i = 0; i < 80; i++) {
      const material = new THREE.MeshBasicMaterial({
        color: colors[i % colors.length],
        transparent: true,
        opacity: 0.6,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(
        (Math.random() - 0.5) * 60,
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 30
      );
      scene.add(mesh);
      particles.push({ mesh, speed: 0.01 + Math.random() * 0.02 });
    }

    const pulseGeo = new THREE.TorusGeometry(8, 0.05, 8, 100);
    const pulseMat = new THREE.MeshBasicMaterial({ color: 0x0ea5e9, transparent: true, opacity: 0.3 });
    const pulse = new THREE.Mesh(pulseGeo, pulseMat);
    pulse.rotation.x = Math.PI / 2;
    scene.add(pulse);

    let frameId;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      particles.forEach(({ mesh, speed }) => {
        mesh.position.y += speed;
        mesh.rotation.x += 0.01;
        if (mesh.position.y > 25) mesh.position.y = -25;
      });
      pulse.scale.setScalar(1 + Math.sin(Date.now() * 0.002) * 0.08);
      pulse.rotation.z += 0.003;
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, [variant]);

  return (
    <div className="animated-bg" ref={mountRef}>
      <div className="heartbeat-line" />
      <div className="floating-icons">
        <span className="float-icon">🩺</span>
        <span className="float-icon">💊</span>
        <span className="float-icon">❤️</span>
        <span className="float-icon">🏥</span>
      </div>
    </div>
  );
}
