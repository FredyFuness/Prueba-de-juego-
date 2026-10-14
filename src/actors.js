import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as skeletonClone } from 'three/addons/utils/SkeletonUtils.js';

// Real skinned Soldier humanoid and Idle/Walk/Run animation are bundled locally.
// Original animation and geometry: Three.js examples / Mugen87.
// Preserve author attribution, do not copy any licensed superhero models.
const PRIMARY='./assets/models/soldier.glb';
const SECONDARY='./assets/models/cesium-man.glb';
const accented = new THREE.MeshStandardMaterial({color:0x9bf2ff,emissive:0x3dd6ff,emissiveIntensity:1.7,metalness:.4,roughness:.24});
const visorMat = new THREE.MeshPhysicalMaterial({color:0x152a39,metalness:.85,roughness:.24,clearcoat:.8,clearcoatRoughness:.12});
const chrome = new THREE.MeshPhysicalMaterial({color:0x637986,metalness:.82,roughness:.33,clearcoat:.75,clearcoatRoughness:.22});
function download(url){
 return new Promise((resolve,reject)=>new GLTFLoader().load(url,resolve,undefined,reject));
}
function paintMaterial(original,hostile=false){
 const source=Array.isArray(original)?original[0]:original;
 // Keep authored diffuse and normal maps: replacing them with a flat single
 // material was the main reason the previous humanoid looked like a silhouette.
 const out=new THREE.MeshPhysicalMaterial({
  color:hostile?0xa18787:0x91a9b8,
  map:source?.map??null,
  normalMap:source?.normalMap??null,
  roughnessMap:source?.roughnessMap??null,
  metalnessMap:source?.metalnessMap??null,
  metalness:hostile?.25:.34,
  roughness:hostile?.64:.49,
  clearcoat:hostile?.18:.43,
  clearcoatRoughness:.28,
  side:THREE.DoubleSide,
  skinning:true
 });
 return out;
}
function addVisualDetails(host,hostile=false){
 const group=new THREE.Group();
 host.add(group);
 const helmet=new THREE.Mesh(new THREE.SphereGeometry(.325,19,15),visorMat);
 helmet.position.set(0,2.31,0);
 helmet.scale.set(1,1.11,1.03);
 group.add(helmet);
 const glass=new THREE.Mesh(new THREE.SphereGeometry(.268,17,9,0,Math.PI*2,0,Math.PI*.56),
  hostile?new THREE.MeshStandardMaterial({color:0xb93c49,emissive:0x7d1828,emissiveIntensity:.7,metalness:.52,roughness:.2}):chrome);
 glass.position.set(0,2.30,-.108);
 glass.rotation.x=Math.PI*.36;
 glass.scale.set(1,.51,1);
 group.add(glass);
 const glowMat=hostile
  ?new THREE.MeshBasicMaterial({color:0xff6d7c})
  :accented;
 const lens=new THREE.Mesh(new THREE.BoxGeometry(.42,.063,.037),glowMat);
 lens.position.set(0,2.36,-.313);
 group.add(lens);
 const collar=new THREE.Mesh(new THREE.TorusGeometry(.3,.066,7,23),visorMat);
 collar.position.set(0,1.97,0);collar.rotation.x=Math.PI/2;
 group.add(collar);
 const crest=new THREE.Mesh(new THREE.TorusGeometry(.15,.026,6,27),hostile?glowMat:accented);
 crest.position.set(0,1.49,-.38);crest.scale.y=.66;
 group.add(crest);
 if(!hostile){
  const shoulder=new THREE.Mesh(new THREE.TorusGeometry(.67,.07,6,28,Math.PI),chrome);
  shoulder.position.set(0,1.89,.03);shoulder.rotation.x=-Math.PI/2;
  group.add(shoulder);
  const light=new THREE.PointLight(0xa7e7ff,2.35,8,2);
  light.position.set(0,2.9,1.45);group.add(light);
 }
 return group;
}
function createSkinned(asset,host,hostile=false,cape=null){
 const root=skeletonClone(asset.scene);
 const originMaterials=new Map();
 root.traverse(o=>{
  if(o.isMesh||o.isSkinnedMesh){
   if(!originMaterials.has(o.material))originMaterials.set(o.material,paintMaterial(o.material,hostile));
   o.material=originMaterials.get(o.material);
   o.castShadow=!hostile;
   o.receiveShadow=false;
   o.frustumCulled=false;
  }
 });
 root.updateMatrixWorld(true);
 const bounds=new THREE.Box3().setFromObject(root);
 const center=bounds.getCenter(new THREE.Vector3());
 const box=bounds.getSize(new THREE.Vector3());
 if(!Number.isFinite(box.y)||box.y<.01)throw new Error('Invalid humanoid glTF bounds');
 const scale=2.65/box.y;
 root.scale.setScalar(scale);
 root.position.set(-center.x*scale,-bounds.min.y*scale,-center.z*scale);
 root.rotation.y=Math.PI;
 const mixer=new THREE.AnimationMixer(root);
 const actions={};
 for(const clip of asset.animations) {
  const key=clip.name.toLowerCase();
  actions[key]=mixer.clipAction(clip);
  actions[key].enabled=true;
  actions[key].play();
  actions[key].weight=/idle/i.test(key)?1:0;
 }
 const names=Object.keys(actions);
 const idle=names.find(n=>/idle/.test(n))||names.find(n=>!/pose/.test(n));
 const walk=names.find(n=>/walk/.test(n))||idle;
 const run=names.find(n=>/run/.test(n))||walk;
 if(idle&&actions[idle])actions[idle].weight=1;
 const previous=host.children.slice();
 previous.forEach(o=>{o.visible=o===cape;});
 host.add(root);
 const details=addVisualDetails(host,hostile);
 return {root,details,mixer,actions,idle,walk,run,host,previous,cape};
}
export function createActorSystem({player,getEnemies,notify,cape}){
 let asset=null,hero=null,opponents=[],loading=null;
 const info={loaded:false,error:null,characters:0,animations:[],asset:'none'};
 const detach=rig=>{
  rig.host.remove(rig.root,rig.details);
  rig.previous.forEach(o=>o.visible=true);
 };
 function attach(){
  if(!asset)return;
  if(hero)detach(hero);
  for(const rig of opponents)detach(rig);
  opponents=[];
  hero=createSkinned(asset,player,false,cape);
  for(const enemy of getEnemies()){
   if(enemy.alive)opponents.push(createSkinned(asset,enemy.root,true));
  }
  info.loaded=true;info.characters=opponents.length+1;
 }
 async function start(){
  if(loading)return loading;
  loading=(async()=>{
   try{
    try{asset=await download(PRIMARY);info.asset='soldier.glb';}
    catch(primaryError){console.warn('Soldier model unavailable, loading Cesium fallback',primaryError);
      asset=await download(SECONDARY);info.asset='cesium-man.glb';}
    info.animations=asset.animations.map(c=>c.name);
    attach();
    notify?.('HUMANOIDES Y ANIMACIONES 3D LISTOS',2);
   }catch(error){info.error=String(error?.message||error);
    console.warn('Skinned animation unavailable: falling back to procedural characters',error);
   }
   return {...info};
  })();
  return loading;
 }
 function refresh(){if(asset)attach();}
 function animateRig(rig,dt,speed,gliding=false,attacking=false){
  const idle=rig.actions[rig.idle],walk=rig.actions[rig.walk],run=rig.actions[rig.run];
  const walking=THREE.MathUtils.clamp(speed/6.5,0,1);
  const running=THREE.MathUtils.clamp((speed-7)/4,0,1);
  if(idle)idle.weight=THREE.MathUtils.damp(idle.weight,1-walking,8,dt);
  if(walk&&walk!==idle)walk.weight=THREE.MathUtils.damp(walk.weight,walking*(1-running),8,dt);
  if(run&&run!==walk&&run!==idle)run.weight=THREE.MathUtils.damp(run.weight,running,8,dt);
  if(walk&&walk!==idle)walk.timeScale=Math.max(.55,Math.min(1.6,speed/6.5));
  if(run&&run!==idle)run.timeScale=Math.max(.8,Math.min(1.6,speed/10));
  // On models without a dedicated idle, keep animation active; zero weights
  // exposes rest T-pose (especially visible in older sample models).
  if(walk===idle&&idle)idle.weight=1;
  rig.mixer.update(dt);
  rig.root.rotation.x=THREE.MathUtils.damp(rig.root.rotation.x,gliding?-.19:attacking?-.07:0,7,dt);
 }
 function update(dt,{speed=0,gliding=false,attacking=false}={}){
  if(!info.loaded||!hero)return;
  animateRig(hero,dt,speed,gliding,attacking);
  for(const rig of opponents){
   if(!rig.host.parent)continue;
   animateRig(rig,dt,rig.host.userData.movingSpeed||0);
  }
 }
 return {start,refresh,update,get loaded(){return info.loaded;},get state(){return {...info};}};
}
