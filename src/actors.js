import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js';

// Real skinned and interpolated glTF geometry replaces primitives when loaded.
// CC BY 4.0 model: CesiumMan © 2017 Cesium. Logo/trademark textures not used.
const LOCAL_URL='./assets/models/cesium-man.glb';
const MIRROR_URL='https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/CesiumMan/glTF-Binary/CesiumMan.glb';
const MAX_ENEMIES=8;
const suit=new THREE.MeshPhysicalMaterial({color:0x233a4b,roughness:.42,metalness:.5,clearcoat:.68,clearcoatRoughness:.24,side:THREE.DoubleSide});
const armor=new THREE.MeshPhysicalMaterial({color:0x546b77,roughness:.3,metalness:.78,clearcoat:.9,clearcoatRoughness:.2,side:THREE.DoubleSide});
const enemySuit=new THREE.MeshStandardMaterial({color:0x53404b,roughness:.57,metalness:.33,side:THREE.DoubleSide});
const enemyArmor=new THREE.MeshStandardMaterial({color:0x81505f,roughness:.46,metalness:.55,side:THREE.DoubleSide});
const glow=new THREE.MeshBasicMaterial({color:0x62efff});
const threat=new THREE.MeshBasicMaterial({color:0xff5f72});
function loadGLB(url) {
 return new Promise((resolve,reject)=>{
  const loader=new GLTFLoader();
  loader.load(url,resolve,undefined,reject);
 });
}
function makeBody(source,enemy=false) {
 const model=cloneSkeleton(source.scene);
 const container=new THREE.Group();
 container.add(model);
 // The mesh is skinned and has organic silhouette/real animation; remove
 // original textures to avoid display of third-party logos and trademarks.
 let i=0;
 model.traverse(object=>{
  if(object.isMesh || object.isSkinnedMesh) {
   const base=enemy?(i++%4===0?enemyArmor:enemySuit):(i++%4===0?armor:suit);
   object.material=base;
   object.castShadow=!enemy;
   object.receiveShadow=false;
   object.frustumCulled=false;
  }
 });
 model.updateMatrixWorld(true);
 const bounds=new THREE.Box3().setFromObject(model);
 const center=bounds.getCenter(new THREE.Vector3());
 const dimensions=bounds.getSize(new THREE.Vector3());
 const scale=2.66/Math.max(.1,dimensions.y);
 model.scale.setScalar(scale);
 model.position.set(-center.x*scale,-bounds.min.y*scale,-center.z*scale);
 // Cesium rig faces +Z in GLTF; NOCTURNE's forward is -Z.
 model.rotation.y=Math.PI;
 const mixer=new THREE.AnimationMixer(model);
 let walk=null;
 if(source.animations?.length) {
  const ranked=[...source.animations].sort((a,b)=>
   Number(/walk|run/i.test(b.name))-Number(/walk|run/i.test(a.name)));
  walk=mixer.clipAction(ranked[0]);
  walk.loop=THREE.LoopRepeat;
  walk.enabled=true;walk.play();walk.weight=0;
 }
 return {container,model,mixer,walk,baseScale:scale,forwardOffset:Math.PI};
}
function decorateActor(actor,enemy=false) {
 const a=actor.container;
 const rim=enemy?threat:glow;
 const arc=new THREE.Mesh(new THREE.TorusGeometry(.14,.018,5,22),rim);
 arc.position.set(0,1.52,-.47);arc.rotation.y=Math.PI;
 arc.visible=false; // only shown if body proportions support this placement
 a.add(arc);
 actor.marker=arc;
}
export function createActorSystem({player,enemies,getEnemies,showToast}) {
 const clones=[];
 let loaded=false,failed=false,hero=null;
 const reports={loaded:false,enemyModels:0,clips:[],fallback:true};
 async function start(){
  let gltf;
  try{
   gltf=await loadGLB(LOCAL_URL);
  }catch(localErr){
   try{gltf=await loadGLB(MIRROR_URL);}
   catch(err){
    failed=true;
    console.warn('Optional skinned hero asset unavailable; using original fallback.',err);
    return reports;
   }
  }
  hero=makeBody(gltf,false);
  // Keep the original procedural animation as a resilient fallback, not on screen.
  const oldChildren=[...player.children];
  oldChildren.forEach(o=>{o.visible=false;});
  decorateActor(hero);
  player.add(hero.container);
  const current=getEnemies();
  current.slice(0,MAX_ENEMIES).forEach((enemy,index)=>{
   const model=makeBody(gltf,true);
   const prev=[...enemy.root.children];
   prev.forEach(o=>{o.visible=false;});
   enemy.root.add(model.container);
   clones.push({enemy,actor:model});
   decorateActor(model,true);
  });
  reports.loaded=true;reports.fallback=false;
  reports.enemyModels=clones.length;
  reports.clips=gltf.animations.map(a=>a.name);
  loaded=true;
  if(showToast)showToast('MODELOS 3D ANIMADOS ACTIVADOS',2.5);
  return reports;
 }
 function update(dt,{speed=0,gliding=false,attacking=false,enemies=[]}={}){
  if(!loaded)return;
  if(hero.walk){
   hero.walk.weight=THREE.MathUtils.damp(hero.walk.weight,Math.min(1,speed/7.5),6,dt);
   hero.walk.timeScale=Math.max(.2,Math.min(2.3,speed/5.4));
  }
  hero.mixer.update(dt);
  hero.container.rotation.z=THREE.MathUtils.damp(hero.container.rotation.z,gliding?.12:0,8,dt);
  hero.container.rotation.x=THREE.MathUtils.damp(hero.container.rotation.x,gliding?-.27:attacking?-.11:0,7,dt);
  clones.forEach(({enemy,actor})=>{
   if(!enemy.alive)return;
   const moving=enemy.root.userData.movingSpeed||0;
   if(actor.walk){
    actor.walk.weight=THREE.MathUtils.damp(actor.walk.weight,moving>.1?.72:0,6,dt);
    actor.walk.timeScale=.75;
   }
   actor.mixer.update(dt);
   actor.container.rotation.z=THREE.MathUtils.damp(actor.container.rotation.z,enemy.hit>0?.12:0,11,dt);
  });
 }
 function onReset(){
  // Existing enemies are recreated on reset; clone new rigs without a second network load.
  clones.length=0;
  if(loaded){
   loaded=false;
   player.remove(hero.container);
   player.children.forEach(c=>c.visible=true);
   hero=null;
   return start();
  }
 }
 return {start,update,onReset,report:()=>({...reports,failed})};
}
