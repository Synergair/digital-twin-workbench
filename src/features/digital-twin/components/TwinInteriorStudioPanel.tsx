import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Button from '@/components/ui/button';
import { V2Surface } from '@/components/dashboard/v2/primitives';
import type { TwinUnit } from '../types';

type RoomBlock = {
  name: string;
  x: number;
  z: number;
  width: number;
  depth: number;
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const buildRooms = (unit: TwinUnit | null) => {
  const area = unit?.area_m2 ? unit.area_m2 : 82;
  const width = clamp(Math.sqrt(area) * 0.9, 6.5, 15);
  const depth = clamp(area / width, 5.5, 12);
  const halfW = width / 2;
  const halfD = depth / 2;

  const rooms: RoomBlock[] = [
    { name: 'Salon', x: -halfW * 0.15, z: -halfD * 0.1, width: width * 0.55, depth: depth * 0.6 },
    { name: 'Cuisine', x: halfW * 0.35, z: -halfD * 0.2, width: width * 0.3, depth: depth * 0.35 },
    { name: 'Chambre', x: -halfW * 0.25, z: halfD * 0.25, width: width * 0.4, depth: depth * 0.35 },
    { name: 'Bureau', x: halfW * 0.35, z: halfD * 0.3, width: width * 0.28, depth: depth * 0.3 },
  ];

  if (unit?.unit_type === 'studio_plus') {
    rooms.splice(2, 2, { name: 'Studio', x: 0, z: halfD * 0.1, width: width * 0.5, depth: depth * 0.4 });
  }

  return { width, depth, rooms };
};

export function TwinInteriorStudioPanel({ unit }: { unit: TwinUnit | null }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const runtimeRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    controls: OrbitControls;
    frame: number;
    systemGroup: THREE.Group;
    furnitureGroup: THREE.Group;
  } | null>(null);
  const [showFurniture, setShowFurniture] = useState(true);
  const [showSystems, setShowSystems] = useState(true);

  const plan = useMemo(() => buildRooms(unit), [unit]);

  useEffect(() => {
    if (!canvasRef.current || !wrapperRef.current) {
      return;
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafb);

    const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.set(plan.width * 0.8, plan.width * 0.6, plan.depth * 0.9);
    scene.add(camera);

    const controls = new OrbitControls(camera, canvasRef.current);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.minDistance = plan.width * 0.6;
    controls.maxDistance = plan.width * 2.2;
    controls.maxPolarAngle = Math.PI / 2.1;

    const ambient = new THREE.HemisphereLight(0xffffff, 0xdfe7ec, 0.9);
    scene.add(ambient);
    const directional = new THREE.DirectionalLight(0xffffff, 0.65);
    directional.position.set(4, 8, 2);
    scene.add(directional);

    const floorGeometry = new THREE.BoxGeometry(plan.width, 0.15, plan.depth);
    const floorMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.75, metalness: 0.05 });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.set(0, -0.075, 0);
    scene.add(floor);

    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xe6eef1, roughness: 0.7 });
    plan.rooms.forEach((room) => {
      const wallGeometry = new THREE.BoxGeometry(room.width, 0.4, 0.08);
      const wall = new THREE.Mesh(wallGeometry, wallMaterial);
      wall.position.set(room.x, 0.2, room.z - room.depth / 2);
      scene.add(wall);
    });

    const systemGroup = new THREE.Group();
    scene.add(systemGroup);
    const furnitureGroup = new THREE.Group();
    scene.add(furnitureGroup);

    const resize = () => {
      const { width, height } = wrapperRef.current!.getBoundingClientRect();
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    resize();

    const observer = new ResizeObserver(resize);
    observer.observe(wrapperRef.current);

    const tick = () => {
      controls.update();
      renderer.render(scene, camera);
      runtimeRef.current!.frame = window.requestAnimationFrame(tick);
    };

    runtimeRef.current = {
      renderer,
      scene,
      camera,
      controls,
      frame: window.requestAnimationFrame(tick),
      systemGroup,
      furnitureGroup,
    };

    return () => {
      observer.disconnect();
      if (runtimeRef.current?.frame) {
        window.cancelAnimationFrame(runtimeRef.current.frame);
      }
      renderer.dispose();
      scene.clear();
      runtimeRef.current = null;
    };
  }, [plan.depth, plan.width, plan.rooms]);

  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!runtime) {
      return;
    }
    const systemGroup = runtime.systemGroup;
    systemGroup.clear();
    if (!showSystems) {
      return;
    }
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x1f9f9b });
    const points = [
      new THREE.Vector3(-plan.width * 0.35, 0.35, -plan.depth * 0.2),
      new THREE.Vector3(0, 0.35, -plan.depth * 0.1),
      new THREE.Vector3(plan.width * 0.25, 0.35, plan.depth * 0.2),
    ];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    systemGroup.add(new THREE.Line(geometry, lineMaterial));
  }, [plan.depth, plan.width, showSystems]);

  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!runtime) {
      return;
    }
    const furnitureGroup = runtime.furnitureGroup;
    furnitureGroup.clear();
    if (!showFurniture) {
      return;
    }
    const furnitureMaterial = new THREE.MeshStandardMaterial({ color: 0xd4d9df, roughness: 0.6 });
    const sofa = new THREE.Mesh(new THREE.BoxGeometry(plan.width * 0.18, 0.2, plan.depth * 0.18), furnitureMaterial);
    sofa.position.set(-plan.width * 0.2, 0.1, -plan.depth * 0.05);
    furnitureGroup.add(sofa);
    const table = new THREE.Mesh(new THREE.BoxGeometry(plan.width * 0.12, 0.08, plan.depth * 0.12), furnitureMaterial);
    table.position.set(0, 0.07, -plan.depth * 0.08);
    furnitureGroup.add(table);
  }, [plan.depth, plan.width, showFurniture]);

  return (
    <V2Surface title="Studio interieur" subtitle="Vue unit pour calibration espace et systemes.">
      <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--semantic-text-subtle)]">
        <Button type="button" size="sm" variant={showSystems ? 'primary' : 'secondary'} onClick={() => setShowSystems((prev) => !prev)}>
          Systemes
        </Button>
        <Button
          type="button"
          size="sm"
          variant={showFurniture ? 'primary' : 'secondary'}
          onClick={() => setShowFurniture((prev) => !prev)}
        >
          Mobilier
        </Button>
        <span>Plan ajuste selon {unit?.unit_number ?? 'unite'}.</span>
      </div>
      <div ref={wrapperRef} className="mt-4 h-[320px] rounded-2xl border border-[var(--semantic-border)] bg-white/70">
        <canvas ref={canvasRef} className="h-full w-full" />
      </div>
      <div className="mt-3 grid gap-2 text-xs text-[var(--semantic-text-subtle)] sm:grid-cols-2">
        {plan.rooms.map((room) => (
          <div key={room.name} className="rounded-xl border border-[var(--semantic-border)] bg-[var(--panel-soft)] px-3 py-2">
            <p className="font-semibold text-[var(--semantic-text)]">{room.name}</p>
            <p>
              {room.width.toFixed(1)}m x {room.depth.toFixed(1)}m
            </p>
          </div>
        ))}
      </div>
    </V2Surface>
  );
}
