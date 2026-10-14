import * as THREE from 'three';

// NOCTURNE / Act II encounter systems.
// Mobile-friendly low-poly GPU effects: projectiles, pickups, telegraphed boss,
// and a reusable EMP shockwave. No assets or shader packages required.
const cyan=new THREE.MeshBasicMaterial({color:0x5beaff,transparent:true,opacity:.8,depthWrite:false});
const red=new THREE.MeshBasicMaterial({color:0xff526b,transparent:true,opacity:.8,depthWrite:false});
const gold=new THREE.MeshBasicMaterial({color:0xffd88a,transparent:true,opacity:.85,depthWrite:false});
const coreMat=new THREE.MeshStandardMaterial({color:0x344d62,metalness:.82,roughness:.25});
const dark=new THREE.MeshStandardMaterial({color:0x132737,metalness:.65,roughness:.4});
const projectileGeo=new THREE.SphereGeometry(.22,10,8);
const ringGeo=new THREE.TorusGeometry(1,.045,5,48);
const clamp=THREE.MathUtils.clamp;
const groundY=.10;
export function createEncounter({scene,playerPosition,hurt,notify,onVictory,onScore}){
 const objects=[],projectiles=[],pickups=[],waves=[];
 let boss=null,phase=1,time=0;
 const uiBoss=document.getElementById('boss-hud');
 const bossBar=document.getElementById('boss-health-fill');
 const bossValue=document.getElementById('boss-health-value');
 const flash=document.getElementById('combat-flash');
 function register(obj){scene.add(obj);objects.push(obj);return obj;}
 function circle(x,z,color,opacity=.7){
  const m=new THREE.Mesh(ringGeo,color.clone());
  m.material.opacity=opacity;m.rotation.x=Math.PI/2;m.position.set(x,groundY,z);
  register(m);return m;
 }
 function impact(x,y,z,color=0xff7777){
  const mesh=new THREE.Mesh(new THREE.IcosahedronGeometry(.37,1),new THREE.MeshBasicMaterial({
    color,transparent:true,opacity:.68,wireframe:true
  }));
  mesh.position.set(x,y,z);register(mesh);
  waves.push({mesh,life:.42,duration:.42,expand:2.4,spin:true});
 }
 function shoot(source,goal,{speed=10,damage=9,tint=0xff5d6c,hostile=true}={}){
  if(phase===0||projectiles.length>22)return;
  const start=new THREE.Vector3(source.x,source.y??1.7,source.z);
  const aim=new THREE.Vector3(goal.x,goal.y??1.25,goal.z);
  const dir=aim.sub(start).normalize();
  const body=new THREE.Mesh(projectileGeo,new THREE.MeshBasicMaterial({color:tint}));
  body.position.copy(start);register(body);
  const halo=new THREE.PointLight(tint,.7,3.2,2);
  body.add(halo);
  projectiles.push({body,dir,speed,damage,life:4.7,hostile});
 }
 function dropHeal(x,z){
  if(pickups.length>=3||phase===0)return;
  const group=new THREE.Group();group.position.set(x,1.25,z);
  const gem=new THREE.Mesh(new THREE.IcosahedronGeometry(.55,1),
   new THREE.MeshStandardMaterial({color:0x7cf8ca,emissive:0x2effb2,emissiveIntensity:1.8,metalness:.4,roughness:.23}));
  group.add(gem);
  const halo=new THREE.Mesh(new THREE.TorusGeometry(.72,.045,5,26),cyan);
  halo.rotation.x=Math.PI/2;group.add(halo);
  register(group);pickups.push({group,gem,age:0,x,z});
 }
 function bossModel(){
  const group=new THREE.Group();
  const main=new THREE.Mesh(new THREE.IcosahedronGeometry(1.55,2),coreMat);
  main.scale.set(1.08,.96,.75);group.add(main);
  const skull=new THREE.Mesh(new THREE.IcosahedronGeometry(.84,1),dark);
  skull.position.set(0,.4,-1.02);group.add(skull);
  const eye=new THREE.Mesh(new THREE.TorusGeometry(.52,.095,8,30),red);
  eye.position.set(0,.39,-1.68);group.add(eye);
  const gem=new THREE.Mesh(new THREE.OctahedronGeometry(.4,1),new THREE.MeshStandardMaterial({
   color:0xffa6b0,emissive:0xff233e,emissiveIntensity:2.1
  }));
  gem.position.set(0,.39,-1.68);group.add(gem);
  const spike=new THREE.ConeGeometry(.38,1.65,10);
  for(const side of [-1,1]){
    const arm=new THREE.Mesh(new THREE.CylinderGeometry(.20,.43,2.4,9),coreMat);
    arm.rotation.z=side*.96;arm.position.set(side*1.8,.2,0);group.add(arm);
    const rotor=new THREE.Mesh(new THREE.TorusGeometry(.65,.17,7,20),coreMat);
    rotor.rotation.x=Math.PI/2;rotor.position.set(side*2.7,.85,0);
    group.add(rotor);
    const blade=new THREE.Mesh(new THREE.BoxGeometry(1.9,.06,.27),dark);
    blade.position.copy(rotor.position);group.add(blade);
    const cone=new THREE.Mesh(spike,coreMat);
    cone.rotation.z=side*Math.PI/2;cone.position.set(side*2.65,-.9,0);group.add(cone);
  }
  const beacon=new THREE.PointLight(0xff425b,2.8,15,2);
  beacon.position.set(0,.3,-2);group.add(beacon);
  return {group,eye,gem,beacon};
 }
 function startBoss(){
  if(phase!==1)return;
  phase=2;
  const parts=bossModel();
  parts.group.position.set(0,4.6,-49);
  register(parts.group);
  const warn=circle(0,-49,red,.65);
  boss={...parts,warning:warn,hp:16,maxHp:16,active:true,clock:0,shot:2.2,
    blast:5.3,warningTime:0,blastTime:0,step:0,phase2:false};
  uiBoss?.classList.remove('hidden');
  notify('ACTO II · EL CENTINELA DESPERTÓ. ENCUÉNTRALO AL NORTE',4.6);
  dropHeal(-3,-34);
  updateBossUI();
 }
 function updateBossUI(){
  if(!boss)return;
  const percent=clamp(boss.hp/boss.maxHp*100,0,100);
  if(bossBar)bossBar.style.width=percent+'%';
  if(bossValue)bossValue.textContent=Math.ceil(boss.hp)+' / '+boss.maxHp;
 }
 function hitBoss(amount=1){
  if(phase!==2||!boss?.active)return false;
  const d=Math.hypot(playerPosition.x-boss.group.position.x,playerPosition.z-boss.group.position.z);
  if(d>6.2||playerPosition.y>8)return false;
  boss.hp=Math.max(0,boss.hp-amount);
  boss.eye.material.opacity=.5;
  boss.group.scale.setScalar(1.07);
  onScore?.(60*amount);
  impact(boss.group.position.x,boss.group.position.y,boss.group.position.z,0xffd99a);
  if(!boss.phase2&&boss.hp<=boss.maxHp/2){
   boss.phase2=true;
   boss.shot=.25;
   notify('CENTINELA · MODO FURIA ACTIVADO',2.4);
  }
  updateBossUI();
  if(boss.hp<=0){
   boss.active=false;phase=3;
   scene.remove(boss.group,boss.warning);
   uiBoss?.classList.add('hidden');
   onScore?.(1400);
   notify('CENTINELA DESACTIVADO · DISTRITO LIBERADO',4);
   onVictory?.();
  }
  return true;
 }
 function firePulse(radius=8){
  const ring=circle(playerPosition.x,playerPosition.z,cyan,.93);
  waves.push({mesh:ring,life:.57,duration:.57,expand:radius,spin:false});
  for(let i=projectiles.length-1;i>=0;i--){
    const p=projectiles[i];
    if(p.body.position.distanceTo(playerPosition)<radius){
      scene.remove(p.body);projectiles.splice(i,1);
    }
  }
  return hitBoss(2);
 }
 function reset(){
  for(const o of objects){scene.remove(o);}
  objects.length=0;projectiles.length=0;pickups.length=0;waves.length=0;
  boss=null;phase=1;time=0;
  uiBoss?.classList.add('hidden');
  if(flash)flash.classList.remove('active');
 }
 function update(dt,{time:runtime,health=100,heal=()=>{}}={}){
  time+=dt;
  // Existing enemies and the boss generate pressure but every projectile can be dodged.
  for(let i=projectiles.length-1;i>=0;i--){
    const p=projectiles[i];
    p.life-=dt;p.body.position.addScaledVector(p.dir,dt*p.speed);
    const d=p.body.position.distanceTo(new THREE.Vector3(playerPosition.x,playerPosition.y+1.3,playerPosition.z));
    if(p.hostile&&d<.93){
      hurt(p.damage);
      impact(p.body.position.x,p.body.position.y,p.body.position.z,p.body.material.color);
      scene.remove(p.body);projectiles.splice(i,1);continue;
    }
    if(p.life<=0){scene.remove(p.body);projectiles.splice(i,1);}
  }
  for(let i=pickups.length-1;i>=0;i--){
    const p=pickups[i];p.age+=dt;
    p.gem.rotation.y+=dt*2;
    p.group.position.y=1.25+Math.sin(p.age*3)*.15;
    if(Math.hypot(playerPosition.x-p.x,playerPosition.z-p.z)<1.6 && playerPosition.y<3.5){
      heal(24);notify('BOTIQUÍN RECUPERADO · +24 INTEGRIDAD',1.6);
      scene.remove(p.group);pickups.splice(i,1);
    }
  }
  for(let i=waves.length-1;i>=0;i--){
    const w=waves[i];w.life-=dt;
    const t=1-Math.max(0,w.life)/w.duration;
    w.mesh.scale.setScalar(1+t*w.expand);
    w.mesh.material.opacity=Math.max(0,.8*(1-t));
    if(w.spin)w.mesh.rotation.y+=dt*4;
    if(w.life<=0){scene.remove(w.mesh);waves.splice(i,1);}
  }
  if(phase!==2||!boss?.active)return;
  const b=boss;
  b.clock+=dt;b.shot-=dt;b.blast-=dt;
  const dx=playerPosition.x-b.group.position.x;
  const dz=playerPosition.z-b.group.position.z;
  const dist=Math.hypot(dx,dz);
  b.group.position.y=4.8+Math.sin(b.clock*2.4)*.35;
  b.group.rotation.y=Math.atan2(-dx,-dz);
  b.group.scale.lerp(new THREE.Vector3(1,1,1),Math.min(1,dt*9));
  b.eye.material.opacity=Math.min(1,b.eye.material.opacity+dt*1.7);
  b.beacon.intensity=2.4+Math.sin(b.clock*6)*.8;
  // Keep the boss within the central northern corridor.
  if(dist>8&&dist<42){
    const velocity=b.phase2?2.55:1.65;
    b.group.position.x=clamp(b.group.position.x+dx/dist*dt*velocity,-4.5,4.5);
    b.group.position.z=clamp(b.group.position.z+dz/dist*dt*velocity,-62,-33);
  }
  b.warning.position.set(b.group.position.x,.09,b.group.position.z);
  if(b.shot<=0&&dist<33){
    b.shot=b.phase2?1.45:2.5;
    shoot(b.group.position,{x:playerPosition.x,y:playerPosition.y+1.2,z:playerPosition.z},
      {speed:b.phase2?13:10,damage:b.phase2?12:9,tint:0xff526b});
  }
  if(b.blast<=0&&dist<13){
    b.blast=b.phase2?4.4:6;
    b.warningTime=1.25;
    b.warning.material.color.setHex(0xff405f);
    b.warning.material.opacity=.8;
    notify('¡ONDA DE CHOQUE! SALTA O ESQUIVA',1.3);
  }
  if(b.warningTime>0){
    b.warningTime-=dt;
    const progress=1-b.warningTime/1.25;
    b.warning.scale.setScalar(1+progress*7.5);
    b.warning.material.opacity=.55+Math.sin(time*22)*.25;
    if(b.warningTime<=0){
      const impactDistance=Math.hypot(playerPosition.x-b.group.position.x,playerPosition.z-b.group.position.z);
      const radius=8.6;
      if(impactDistance<radius&&playerPosition.y<1.25)hurt(b.phase2?20:15);
      const ring=circle(b.group.position.x,b.group.position.z,red,.96);
      waves.push({mesh:ring,life:.54,duration:.54,expand:9,spin:false});
      b.warning.scale.setScalar(1);b.warning.material.opacity=.3;
    }
  }
 }
 return {
  shoot,dropHeal,startBoss,hitBoss,firePulse,reset,update,
  get phase(){return phase;},get boss(){return boss;},
  get projectileCount(){return projectiles.length;}
 };
}
