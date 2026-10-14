import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as skeletonClone } from 'three/addons/utils/SkeletonUtils.js';

// Source: Khronos glTF Sample Assets / CesiumMan (© Cesium, CC BY 4.0).
// We discard all original materials and logos, retain the rig, silhouette and animation.
// A local build can bundle assets/models/cesium-man.glb. Until bundled, use the
// same public open-source sample through GitHub's raw content service.
const MODEL_URL='./assets/models/cesium-man.glb';
const FALLBACK_URL='https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/CesiumMan/glTF-Binary/CesiumMan.glb';
const heroFabric=new THREE.MeshPhysicalMaterial({color:0x101e2d,metalness:.24,roughness:.72,clearcoat:.25,side:THREE.DoubleSide});
const heroMetal=new THREE.MeshPhysicalMaterial({color:0x4d6472,metalness:.79,roughness:.28,clearcoat:.8,side:THREE.DoubleSide});
const hostileFabric=new THREE.MeshStandardMaterial({color:0x3a3037,metalness:.24,roughness:.76,side:THREE.DoubleSide});
const hostilePlate=new THREE.MeshStandardMaterial({color:0x6e4650,metalness:.68,roughness:.36,side:THREE.DoubleSide});
function download(url) {
 return new Promise((resolve,reject)=>{
  new GLTFLoader().load(url,resolve,undefined,reject);
 });
}
function createSkinnedActor(asset,host,hostile=false){
 const root=skeletonClone(asset.scene);
 root.traverse(object=>{
  if(object.isMesh||object.isSkinnedMesh){
   const name=object.name.toLowerCase();
   object.material=hostile
    ?(/armor|helmet|suit|metal|head/.test(name)?hostilePlate:hostileFabric)
    :(/armor|helmet|suit|metal|head/.test(name)?heroMetal:heroFabric);
   object.castShadow=!hostile;
   object.receiveShadow=false;
   object.frustumCulled=false;
  }
 });
 root.updateMatrixWorld(true);
 const bounds=new THREE.Box3().setFromObject(root);
 const center=bounds.getCenter(new THREE.Vector3());
 const box=bounds.getSize(new THREE.Vector3());
 if(!Number.isFinite(box.y)||box.y<.01)throw new Error('Invalid glTF model bounds');
 const size=2.65/box.y;
 root.scale.setScalar(size);
 root.position.set(-center.x*size,-bounds.min.y*size,-center.z*size);
 root.rotation.y=Math.PI;
 const mixer=new THREE.AnimationMixer(root);
 const clip=asset.animations.find(a=>/walk|run/i.test(a.name))||asset.animations[0];
 const action=clip?mixer.clipAction(clip):null;
 if(action){action.enabled=true;action.play();action.weight=0;}
 const previous=host.children.slice();
 previous.forEach(obj=>{obj.visible=false;});
 host.add(root);
 return {root,mixer,action,host,previous,hostile};
}
export function createActorSystem({player,getEnemies,notify}){
 let asset=null;
 let hero=null;
 let npc=[];
 let started=false;
 const state={loaded:false,loading:false,error:null,characters:0,animations:[],source:'original procedural'};
 function attach(){
  if(!asset)return;
  if(hero){
   hero.host.remove(hero.root);
   hero.previous.forEach(obj=>obj.visible=true);
  }
  for(const rig of npc){rig.host.remove(rig.root);rig.previous.forEach(obj=>obj.visible=true);}
  npc=[];
  hero=createSkinnedActor(asset,player,false);
  for(const enemy of getEnemies()){
   if(!enemy.alive)continue;
   npc.push(createSkinnedActor(asset,enemy.root,true));
  }
  state.loaded=true;state.characters=npc.length+1;
  state.source='CesiumMan / Khronos glTF Sample Assets / CC BY 4.0';
 }
 async function start(){
  if(started)return state;
  started=true;state.loading=true;
  try{
   try{asset=await download(MODEL_URL);}
   catch(_){asset=await download(FALLBACK_URL);}
   state.animations=asset.animations.map(a=>a.name);
   attach();
   notify?.('PERSONAJES 3D ANIMADOS ACTIVADOS',2.5);
  }catch(error){
   state.error=String(error?.message||error);
   console.warn('NOCTURNE: compatible skinned model unavailable, using built-in procedural actors.',error);
  }finally{state.loading=false;}
  return state;
 }
 function refresh(){
  if(asset){
   // Enemies are recreated on each restart. Remove the old rig and attach
   // new skinned actors without redownloading the 3D asset.
   attach();
  }
 }
 function update(dt,{speed=0,gliding=false,attacking=false}={}){
  if(!state.loaded||!hero)return;
  if(hero.action){
   hero.action.weight=THREE.MathUtils.damp(hero.action.weight,Math.min(.95,speed/7),6,dt);
   hero.action.timeScale=THREE.MathUtils.clamp(speed/5,0.25,1.7);
  }
  hero.mixer.update(dt);
  hero.root.rotation.x=THREE.MathUtils.damp(hero.root.rotation.x,gliding?-.22:attacking?-.08:0,7,dt);
  for(const rig of npc){
   if(rig.host.parent===null)continue;
   const moving=rig.host.userData.movingSpeed||0;
   if(rig.action){
    rig.action.weight=THREE.MathUtils.damp(rig.action.weight,moving>.1?.65:0,7,dt);
    rig.action.timeScale=.83;
   }
   rig.mixer.update(dt);
  }
 }
 return {start,refresh,update,get loaded(){return state.loaded;},get state(){return {...state};}};
}
