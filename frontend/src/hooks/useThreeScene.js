import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

/**
 * Three.js シーン管理カスタムフック
 */
export const useThreeScene = (containerRef) => {
  console.log('🪝 useThreeScene hook called, containerRef:', !!containerRef?.current);

  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const initializingRef = useRef(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    console.log('useEffect: useThreeScene starting, containerRef.current:', !!containerRef?.current);
    if (!containerRef.current) {
      console.log('❌ containerRef.current is null, returning early');
      return;
    }

    // 既に初期化済みの場合はスキップ（useRefを使用してStrictMode対応）
    if (sceneRef.current || initializingRef.current) {
      console.log('⏭️ Skipping initialization:', { hasScene: !!sceneRef.current, initializing: initializingRef.current });
      return;
    }

    initializingRef.current = true;
    console.log('🎮 Starting Three.js scene initialization...');

    // コンテナサイズを取得（clientWidth/Height が 0 の場合は window サイズを使用）
    let containerWidth = containerRef.current.clientWidth;
    let containerHeight = containerRef.current.clientHeight;

    console.log('📏 Initial container size:', { containerWidth, containerHeight });

    // 0 の場合は window サイズを使用（初期レンダ時）
    if (containerWidth === 0 || containerHeight === 0) {
      containerWidth = window.innerWidth;
      containerHeight = window.innerHeight;
      console.log('⚠️ Container size was 0, using window size:', { containerWidth, containerHeight });
    }

    // シーン作成
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f0f2e); // より濃い紫青

    // カメラ設定
    const camera = new THREE.PerspectiveCamera(
      75,
      containerWidth / containerHeight,
      0.1,
      1000
    );
    // テスト用：カメラを近く、高い位置に配置して、全体が見えるようにする
    camera.position.set(0, 8, 15);
    camera.lookAt(0, 2, 0);
    console.log('📍 Camera position set to:', { x: 0, y: 8, z: 15 });

    // レンダラー設定
    console.log('📐 Using container dimensions:', {
      containerWidth,
      containerHeight,
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight
    });

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    console.log('✨ Renderer created successfully');

    renderer.setSize(containerWidth, containerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    console.log('🖥️ Renderer size set:', { width: containerWidth, height: containerHeight });

    // canvas 要素のスタイルを設定
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';

    containerRef.current.appendChild(renderer.domElement);
    console.log('📌 Canvas appended to DOM, canvas size:', {
      canvasWidth: renderer.domElement.width,
      canvasHeight: renderer.domElement.height,
      domWidth: renderer.domElement.style.width,
      domHeight: renderer.domElement.style.height
    });

    // 光源設定（複数の光源を追加して明るくする）
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 15, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // 追加の照明（側面から）
    const sideLight = new THREE.DirectionalLight(0xffffff, 0.4);
    sideLight.position.set(-10, 8, 5);
    scene.add(sideLight);

    // ポイントライト（中央）
    const pointLight = new THREE.PointLight(0xffffff, 0.6, 50);
    pointLight.position.set(0, 5, 0);
    scene.add(pointLight);

    // グリッド表示（デバッグ用）
    const gridHelper = new THREE.GridHelper(100, 50, 0x444466, 0x222244);
    gridHelper.position.y = 0;
    scene.add(gridHelper);

    // 床の配置
    const floorGeometry = new THREE.PlaneGeometry(200, 200);
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a3e,
      roughness: 0.8,
      metalness: 0
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.1;
    floor.receiveShadow = true;
    scene.add(floor);

    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;
    console.log('✅ Three.js scene initialized successfully!');
    console.log('📊 Scene objects:', scene.children.length);
    console.log('🎥 Camera position:', camera.position);
    console.log('👀 Camera looking at:', { x: 0, y: 0.5, z: 0 });
    console.log('🎨 Scene background:', scene.background.getHexString());
    console.log('📦 Scene children:', scene.children.map(c => ({ name: c.name, type: c.type })));
    setIsInitialized(true);

    // ウィンドウリサイズ対応
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    // アニメーションループ
    let frameCount = 0;
    const animate = () => {
      frameCount++;
      if (frameCount === 1) {
        console.log('🎬 Animation loop started - first frame rendering');
      }
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();
    console.log('▶️ Animation loop initialized');

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, [containerRef]);

  return {
    scene: sceneRef.current,
    camera: cameraRef.current,
    renderer: rendererRef.current,
    isInitialized
  };
};

/**
 * クイズブース オブジェクト作成ヘルパー
 */
export const createQuizBooth = (position, id) => {
  const group = new THREE.Group();

  // ブースの柱（太く、金属的）
  const poleGeometry = new THREE.CylinderGeometry(0.25, 0.25, 3, 16);
  const poleMaterial = new THREE.MeshStandardMaterial({
    color: 0x4a9eff,
    metalness: 0.5,
    roughness: 0.3,
    emissive: 0x2255ff,
    emissiveIntensity: 0.3
  });
  const pole = new THREE.Mesh(poleGeometry, poleMaterial);
  pole.castShadow = true;
  pole.position.y = 1.5;
  group.add(pole);

  // ブースの看板（大きく、明るく）
  const signGeometry = new THREE.BoxGeometry(1.5, 1.2, 0.2);
  const signMaterial = new THREE.MeshStandardMaterial({
    color: 0xffd700,
    emissive: 0xff9500,
    emissiveIntensity: 0.8,
    metalness: 0.3,
    roughness: 0.4
  });
  const sign = new THREE.Mesh(signGeometry, signMaterial);
  sign.castShadow = true;
  sign.position.y = 3;
  sign.userData.quizId = id;
  sign.userData.type = 'quiz-booth';
  group.add(sign);

  // 看板の周りの輝くライト効果（より明るく）
  const glowGeometry = new THREE.SphereGeometry(2.5, 32, 32);
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0xffd700,
    transparent: true,
    opacity: 0.2
  });
  const glow = new THREE.Mesh(glowGeometry, glowMaterial);
  glow.position.y = 2.8;
  group.add(glow);

  // インタラクティブ判定用の大きなヒットボックス
  const hitboxGeometry = new THREE.SphereGeometry(3, 32, 32);
  const hitboxMaterial = new THREE.MeshBasicMaterial({ visible: false });
  const hitbox = new THREE.Mesh(hitboxGeometry, hitboxMaterial);
  hitbox.userData.quizId = id;
  hitbox.userData.type = 'quiz-booth';
  group.add(hitbox);

  // グループ配置
  group.position.copy(position);
  group.userData.quizId = id;
  group.userData.type = 'quiz-booth';

  return group;
};

export default useThreeScene;
