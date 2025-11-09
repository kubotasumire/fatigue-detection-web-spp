import { useEffect, useRef, useState } from 'react';
import * as BABYLON from '@babylonjs/core';

/**
 * Babylon.js シーン管理カスタムフック
 */
export const useBabylonScene = (containerRef) => {
  const sceneRef = useRef(null);
  const engineRef = useRef(null);
  const cameraRef = useRef(null);
  const initializingRef = useRef(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!containerRef?.current) return;

    // 既に初期化済みの場合はスキップ
    if (sceneRef.current || initializingRef.current) return;

    initializingRef.current = true;
    console.log('🎮 Starting Babylon.js scene initialization...');

    try {
      // Babylon.js エンジンの作成
      const engine = new BABYLON.Engine(containerRef.current, true, {
        antialias: true,
        preserveDrawingBuffer: true,
      });

      console.log('✨ Babylon.js engine created successfully');

      // シーンの作成
      const scene = new BABYLON.Scene(engine);
      scene.background = new BABYLON.Color3(0.06, 0.06, 0.18); // #0f0f2e に相当

      console.log('🎬 Scene created');

      // ライティング
      const ambientLight = new BABYLON.HemisphericLight('ambientLight', new BABYLON.Vector3(1, 1, 0), scene);
      ambientLight.intensity = 0.8;

      const directionalLight = new BABYLON.PointLight('directionalLight', new BABYLON.Vector3(10, 15, 10), scene);
      directionalLight.intensity = 0.8;
      directionalLight.range = 1000;

      const sideLight = new BABYLON.PointLight('sideLight', new BABYLON.Vector3(-10, 8, 5), scene);
      sideLight.intensity = 0.4;
      sideLight.range = 1000;

      console.log('💡 Lights added');

      // グリッド用メッシュ（床）
      const ground = BABYLON.MeshBuilder.CreateGround('ground', { width: 200, height: 200 }, scene);
      ground.position.y = -0.1;

      const groundMat = new BABYLON.StandardMaterial('groundMat', scene);
      groundMat.diffuse = new BABYLON.Color3(0.1, 0.1, 0.24);
      groundMat.specularColor = new BABYLON.Color3(0, 0, 0);
      ground.material = groundMat;

      console.log('🌍 Ground created');

      // カメラの設定
      const camera = new BABYLON.UniversalCamera('camera', new BABYLON.Vector3(0, 8, 15), scene);
      camera.attachControl(containerRef.current, true);
      camera.setTarget(new BABYLON.Vector3(0, 2, 0));
      camera.angularSensibility = 1000;
      camera.inertia = 0.7;

      console.log('📷 Camera set');

      // 参照を保存
      sceneRef.current = scene;
      engineRef.current = engine;
      cameraRef.current = camera;

      // ウィンドウリサイズ対応
      const handleResize = () => {
        engine.resize();
      };

      window.addEventListener('resize', handleResize);

      // レンダリングループ
      engine.runRenderLoop(() => {
        scene.render();
      });

      console.log('▶️ Render loop started');
      console.log('✅ Babylon.js scene initialized successfully!');
      console.log('🎥 Camera position:', { x: 0, y: 8, z: 15 });

      setIsInitialized(true);

      return () => {
        window.removeEventListener('resize', handleResize);
        engine.dispose();
      };
    } catch (error) {
      console.error('❌ Error initializing Babylon.js scene:', error);
      initializingRef.current = false;
    }
  }, [containerRef]);

  return {
    scene: sceneRef.current,
    engine: engineRef.current,
    camera: cameraRef.current,
    isInitialized,
  };
};

/**
 * クイズブース オブジェクト作成ヘルパー
 */
export const createQuizBooth = (scene, position, id) => {
  const group = new BABYLON.TransformNode(`booth_${id}`, scene);

  // ブースの柱
  const pole = BABYLON.MeshBuilder.CreateCylinder('pole', { diameter: 0.5, height: 3, tessellation: 16 }, scene);
  pole.position = new BABYLON.Vector3(0, 1.5, 0);

  const poleMat = new BABYLON.StandardMaterial(`poleMat_${id}`, scene);
  poleMat.diffuse = new BABYLON.Color3(0.29, 0.62, 1);
  poleMat.emissiveColor = new BABYLON.Color3(0.13, 0.33, 1);
  pole.material = poleMat;

  pole.parent = group;

  // ブースの看板
  const sign = BABYLON.MeshBuilder.CreateBox('sign', { width: 1.5, height: 1.2, depth: 0.2 }, scene);
  sign.position = new BABYLON.Vector3(0, 3, 0);

  const signMat = new BABYLON.StandardMaterial(`signMat_${id}`, scene);
  signMat.diffuse = new BABYLON.Color3(1, 0.84, 0);
  signMat.emissiveColor = new BABYLON.Color3(1, 0.58, 0);
  sign.material = signMat;

  sign.parent = group;

  // ヒットボックス（インタラクション用）
  const hitbox = BABYLON.MeshBuilder.CreateSphere('hitbox', { diameter: 6 }, scene);
  hitbox.position = new BABYLON.Vector3(0, 2, 0);
  hitbox.isVisible = false;

  // カスタムデータを保存
  hitbox.metadata = { quizId: id, type: 'quiz-booth' };
  hitbox.parent = group;

  // グループの位置設定
  group.position = new BABYLON.Vector3(position.x, position.y, position.z);
  group.metadata = { quizId: id, type: 'quiz-booth' };

  return group;
};

export default useBabylonScene;
