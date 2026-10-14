// NOCTURNE / Premium environmental art direction.
// Procedural textures and reusable instancing: no external models or copyrighted assets.
import * as THREE from 'three';

const random = (a, b = 0) => {
  const n = Math.sin(a * 127.1 + b * 311.7 + 18.19) * 43758.5453123;
  return n - Math.floor(n);
};
const palette = {
  cyan: 0x40e8ff, blue: 0x3179ff, pink: 0xff557d, gold: 0xffbb6a,
  asphalt: 0x111b28, concrete: 0x263442, windows: 0x102437
};
function box(parent, mat, pos, size, geo) {
  const object = new THREE.Mesh(geo || new THREE.BoxGeometry(1, 1, 1), mat);
  object.position.set(...pos);
  object.scale.set(...size);
  parent.add(object);
  return object;
}
function basic(color, opacity = 1, additive = false) {
  return new THREE.MeshBasicMaterial({
    color, transparent: opacity < 1 || additive, opacity,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    depthWrite: !additive, side: THREE.DoubleSide
  });
}
function texCanvas(w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  return [canvas, canvas.getContext('2d')];
}
function makeAsphaltTexture() {
  const [canvas, ctx] = texCanvas(512, 512);
  const img = ctx.createImageData(512, 512);
  const data = img.data;
  for (let y = 0; y < 512; y++) for (let x = 0; x < 512; x++) {
    const i = (y * 512 + x) * 4;
    const noise = random(x * 1.173, y * 1.673);
    const crack = random(Math.floor(x / 47), Math.floor(y / 49)) * 12;
    const v = Math.floor(23 + noise * 30 + crack);
    data[i] = v * .73; data[i + 1] = v * .95; data[i + 2] = v * 1.17; data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  for (let i = 0; i < 140; i++) {
    const x = random(i, 19) * 512, y = random(i, 11) * 512;
    ctx.fillStyle = i % 3 ? '#33415055' : '#83909b23';
    ctx.fillRect(x, y, 1 + random(i, 2) * 7, 1.4);
  }
  for (let i = 0; i < 7; i++) {
    const x = random(i, 26) * 512, y = random(i, 18) * 512;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.bezierCurveTo(x + 12, y + 6, x - 20, y + 30, x + 13, y + 62);
    ctx.strokeStyle = '#080e17aa';ctx.lineWidth = .7;ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 4;
  return texture;
}
function makeConcreteTexture() {
  const [canvas, ctx] = texCanvas(256, 256);
  const img = ctx.createImageData(256, 256), d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const p = i / 4, x = p % 256, y = Math.floor(p / 256);
    const grain = random(x * .97, y * 1.29) * 35;
    d[i] = 56 + grain;d[i+1] = 67 + grain;d[i+2] = 76 + grain;d[i+3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  ctx.strokeStyle = '#121d2a80';ctx.lineWidth = 2;
  for (let y = 0; y < 256; y += 64) {
    ctx.beginPath();ctx.moveTo(0, y);ctx.lineTo(256, y);ctx.stroke();
  }
  for (let y = 0; y < 256; y += 128) {
    ctx.beginPath();ctx.moveTo(128, y);ctx.lineTo(128, y + 64);ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  return tex;
}
function radialTexture() {
  const [canvas, ctx] = texCanvas(128, 128);
  const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(.13, 'rgba(255,255,255,.7)');
  grad.addColorStop(.42, 'rgba(255,255,255,.16)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle=grad;ctx.fillRect(0,0,128,128);
  return new THREE.CanvasTexture(canvas);
}
function signTexture(text, accent, subtitle) {
  const [canvas, ctx] = texCanvas(768, 256);
  const background=ctx.createLinearGradient(0,0,768,256);
  background.addColorStop(0,'#050c1a');background.addColorStop(1,'#172537');
  ctx.fillStyle=background;ctx.fillRect(0,0,768,256);
  ctx.strokeStyle=accent;ctx.lineWidth=5;ctx.strokeRect(9,9,750,238);
  ctx.globalAlpha=.25;
  for(let x=0;x<768;x+=26){ctx.fillStyle=accent;ctx.fillRect(x,0,1,256);}
  ctx.globalAlpha=1;
  ctx.shadowColor=accent;ctx.shadowBlur=22;
  ctx.font='900 95px Arial, Helvetica, sans-serif';
  ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillStyle=accent;ctx.fillText(text,384,118,720);
  ctx.shadowBlur=0;
  ctx.font='700 26px Arial, sans-serif';ctx.letterSpacing='9px';
  ctx.fillStyle='#bcd0e6';ctx.fillText(subtitle,384,204,720);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  texture.anisotropy=4;
  return texture;
}
function planarEllipse(scene, x, z, sx, sy, color, alpha, rotation=0) {
  const obj=new THREE.Mesh(new THREE.PlaneGeometry(1,1),basic(color,alpha,true));
  obj.rotation.x=-Math.PI/2;obj.rotation.z=rotation;
  obj.scale.set(sx,sy,1);obj.position.set(x,.069,z);
  scene.add(obj);
  return obj;
}
function batch(scene, objects, geometry, mat) {
  if(!objects.length)return;
  const group=new THREE.InstancedMesh(geometry,mat,objects.length);
  const dummy=new THREE.Object3D();
  objects.forEach(([x,y,z,sx,sy,sz,ry=0],i)=>{
    dummy.position.set(x,y,z);dummy.rotation.set(0,ry,0);dummy.scale.set(sx,sy,sz);
    dummy.updateMatrix();group.setMatrixAt(i,dummy.matrix);
  });
  group.instanceMatrix.needsUpdate=true;
  group.frustumCulled=false;
  scene.add(group);
  return group;
}
function createAtmosphere(scene) {
  const dome=new THREE.Mesh(new THREE.SphereGeometry(300, 24, 14),
    new THREE.ShaderMaterial({
      side:THREE.BackSide,depthWrite:false,fog:false,
      uniforms:{top:{value:new THREE.Color(0x030815)},horizon:{value:new THREE.Color(0x22394e)}},
      vertexShader:'varying vec3 vPosition; void main(){vPosition=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
      fragmentShader:'varying vec3 vPosition;uniform vec3 top;uniform vec3 horizon;void main(){float h=clamp(normalize(vPosition).y*0.5+0.5,0.0,1.0);float k=smoothstep(0.20,0.85,h);gl_FragColor=vec4(mix(horizon,top,k),1.0);}'
    }));
  scene.add(dome);
  const starPositions=[];
  for(let i=0;i<560;i++){
    const theta=random(i,2)*Math.PI*2;
    const phi=.17+random(i,9)*1.21;
    const radius=180;
    starPositions.push(radius*Math.sin(phi)*Math.cos(theta),radius*Math.cos(phi),radius*Math.sin(phi)*Math.sin(theta));
  }
  const starsGeo=new THREE.BufferGeometry();
  starsGeo.setAttribute('position',new THREE.Float32BufferAttribute(starPositions,3));
  const stars=new THREE.Points(starsGeo,new THREE.PointsMaterial({
    color:0x9cc6ff,size:.37,transparent:true,opacity:.7,depthWrite:false,fog:false
  }));
  scene.add(stars);
  const hazeMat=basic(0x326280,.033,true);
  const haze=new THREE.Mesh(new THREE.PlaneGeometry(178,178),hazeMat);
  haze.rotation.x=-Math.PI/2;haze.position.y=.18;scene.add(haze);
  return {stars,haze};
}
function makeWetStreets(scene) {
  const asphalt=makeAsphaltTexture();
  const concrete=makeConcreteTexture();
  const surface=new THREE.MeshStandardMaterial({
    map:asphalt,color:0xb2c8dc,roughness:.33,metalness:.31
  });
  const slabs=new THREE.MeshStandardMaterial({
    map:concrete,color:0x8c9caf,roughness:.9,metalness:.04
  });
  const roadGeo=new THREE.PlaneGeometry(6.45,166);
  const roadParts=[];
  const coords=[-60,-40,-20,0,20,40,60];
  for(const lane of coords) {
    const tex=asphalt.clone();tex.needsUpdate=true;tex.repeat.set(1.1,22);
    const mat=surface.clone();mat.map=tex;
    const road=new THREE.Mesh(roadGeo,mat);
    road.rotation.x=-Math.PI/2;road.position.set(lane,.049,0);scene.add(road);roadParts.push(road);
    const across=new THREE.Mesh(roadGeo,mat.clone());
    across.rotation.set(-Math.PI/2,0,Math.PI/2);
    across.position.set(0,.051,lane);
    scene.add(across);roadParts.push(across);
  }
  const sidewalkParts=[];
  const curbLine=[];
  for(const x of [-60,-40,-20,20,40,60]) for(const z of [-60,-40,-20,20,40,60]) {
    const path=new THREE.Mesh(new THREE.BoxGeometry(18.4,.16,18.4),slabs);
    path.position.set(x,.07,z);scene.add(path);sidewalkParts.push(path);
    for(const off of [-8.5,8.5]){
      curbLine.push([x+off,.17,z, .09,.13,16.2]);
      curbLine.push([x,.17,z+off, 16.2,.13,.09]);
    }
  }
  batch(scene,curbLine,new THREE.BoxGeometry(1,1,1),
    new THREE.MeshStandardMaterial({color:0x677888,roughness:.71,metalness:.16}));
  const roadMark=new THREE.MeshStandardMaterial({color:0x9aa6aa,roughness:.65,metalness:.16});
  const markings=[];
  // Pedestrian crossings are grouped in one draw call.
  for(const x of [-40,0,40])for(const z of [-40,0,40]){
    for(let i=-3;i<=3;i++){
      markings.push([x+i*.86,.063,z-5, .51,.013,2.5]);
      markings.push([x-5,.064,z+i*.86, 2.5,.013,.51]);
    }
  }
  batch(scene,markings,new THREE.BoxGeometry(1,1,1),roadMark);
  // Light-reactive puddles and reflection streaks simulate wet asphalt on mobile.
  const puddles=[];
  for(let i=0;i<110;i++){
    let x=(random(i,43)-.5)*138,z=(random(i,53)-.5)*138;
    const nx=Math.round(x/20)*20,nz=Math.round(z/20)*20;
    if(Math.abs(x-nx)>3.1 && Math.abs(z-nz)>3.1)continue;
    const radius=.7+random(i,14)*2.2;
    const mat=basic(i%5?0x355a77:0x54819c,.07+random(i,92)*.10,true);
    const puddle=new THREE.Mesh(new THREE.CircleGeometry(1,18),mat);
    puddle.rotation.x=-Math.PI/2;puddle.rotation.z=random(i,5)*Math.PI;
    puddle.scale.set(radius,.23+random(i,18)*1.1,1);
    puddle.position.set(x,.076,z);
    scene.add(puddle);puddles.push(puddle);
  }
  return {roadParts,sidewalkParts,puddles};
}
function addArchitecture(scene,buildings) {
  const ledges=[],pillars=[],rooftops=[],doors=[],shutters=[];
  const darkSteel=new THREE.MeshStandardMaterial({color:0x324b60,roughness:.52,metalness:.58});
  const rim=new THREE.MeshStandardMaterial({color:0x536d7e,roughness:.7,metalness:.3});
  const roofSteel=new THREE.MeshStandardMaterial({color:0x1e303f,roughness:.5,metalness:.6});
  const shutterMat=new THREE.MeshStandardMaterial({color:0x0c1a28,roughness:.38,metalness:.68});
  for(const b of buildings){
    const w=b.width,d=b.depth,h=b.height;
    const variation=random(b.x,b.z);
    // Art-deco steel pillars and dark glass horizontal separation.
    for(const dx of [-w/2+.25,w/2-.25]){
      pillars.push([b.x+dx,h/2,b.z+d/2+.05,.2,h,.24]);
      pillars.push([b.x+dx,h/2,b.z-d/2-.05,.2,h,.24]);
    }
    for(const dz of [-d/2+.25,d/2-.25]){
      pillars.push([b.x+w/2+.05,h/2,b.z+dz,.24,h,.2]);
      pillars.push([b.x-w/2-.05,h/2,b.z+dz,.24,h,.2]);
    }
    for(let y=3;y<h-1;y+=3.1){
      ledges.push([b.x,y,b.z+d/2+.12,w,.085,.35]);
      ledges.push([b.x,y,b.z-d/2-.12,w,.085,.35]);
      ledges.push([b.x+w/2+.12,y,b.z,.35,.085,d]);
      ledges.push([b.x-w/2-.12,y,b.z,.35,.085,d]);
    }
    for(const dx of [-w/2,w/2]){
      rooftops.push([b.x+dx,h+.5,b.z,.17,.52,d+.4]);
    }
    for(const dz of [-d/2,d/2]){
      rooftops.push([b.x,h+.5,b.z+dz,w+.4,.52,.17]);
    }
    const side=variation>.5?1:-1;
    doors.push([b.x,1.3,b.z+side*(d/2+.065),2.3,2.6,.15]);
    shutters.push([b.x+3.15,1.6,b.z+side*(d/2+.08),2.45,2.25,.15]);
    const exhaust=new THREE.Mesh(new THREE.CylinderGeometry(.28,.4,.8,10),roofSteel);
    exhaust.position.set(b.x-w*.24,h+.8,b.z-d*.18);scene.add(exhaust);
    const cover=box(scene,darkSteel,[b.x-w*.24,h+1.25,b.z-d*.18],[.9,.11,.9]);
    if(variation>.70){
      const mast=box(scene,rim,[b.x+w*.1,h+4,b.z],[.10,7.8,.1]);
      const beacon=new THREE.Mesh(new THREE.SphereGeometry(.19,8,5),basic(0xff5877));
      beacon.position.set(mast.position.x,h+8,b.z);scene.add(beacon);
      beacon.userData.blink=true;
    }
  }
  batch(scene,ledges,new THREE.BoxGeometry(1,1,1),darkSteel);
  batch(scene,pillars,new THREE.BoxGeometry(1,1,1),rim);
  batch(scene,rooftops,new THREE.BoxGeometry(1,1,1),roofSteel);
  batch(scene,doors,new THREE.BoxGeometry(1,1,1),shutterMat);
  batch(scene,shutters,new THREE.BoxGeometry(1,1,1),shutterMat);
}
function createGlow(scene,texture,x,y,z,scale,color,alpha=.8) {
  const spr=new THREE.Sprite(new THREE.SpriteMaterial({
    map:texture,color,transparent:true,opacity:alpha,blending:THREE.AdditiveBlending,
    depthWrite:false,depthTest:true,fog:false
  }));
  spr.position.set(x,y,z);
  spr.scale.set(scale,scale,1);scene.add(spr);
  return spr;
}
function neonDistrict(scene,glow) {
  const glowing=[], lights=[];
  const signs=[
    {x:-20,z:-20,t:'NOVA',sub:'INDUSTRIES',col:'#45dfff',face:'front'},
    {x:20,z:-20,t:'NIGHT',sub:'LOUNGE   •   24H',col:'#ff567d',face:'front'},
    {x:-20,z:20,t:'ECHO',sub:'COMMUNICATIONS',col:'#71f5c8',face:'back'},
    {x:20,z:20,t:'ATLAS',sub:'TECHNOLOGIES',col:'#ffc578',face:'back'},
    {x:-40,z:-20,t:'SECTOR 07',sub:'SECURITY NETWORK',col:'#42b5ff',face:'front'},
    {x:40,z:20,t:'ORBIT',sub:'CYBER SYSTEMS',col:'#d18cff',face:'back'},
    {x:-20,z:-40,t:'ZENITH',sub:'DATA CENTER',col:'#90d7ff',face:'front'},
    {x:20,z:-40,t:'VOID',sub:'STREET MARKET',col:'#ff668c',face:'front'},
    {x:0,z:-60,t:'NØX',sub:'MIDNIGHT CITY',col:'#51efff',face:'front'}
  ];
  for(const [index,s] of signs.entries()){
    const buildingsZ=[-20,20,-40,-60];
    const faceZ=s.face==='front' ? s.z+8.5 : s.z-8.5;
    const texture=signTexture(s.t,s.col,s.sub);
    const panel=new THREE.Mesh(new THREE.PlaneGeometry(8.4,2.85),
      new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide,transparent:true,depthWrite:false}));
    panel.position.set(s.x,7.4+index%3*2.6,faceZ);
    panel.rotation.y=s.face==='front'?0:Math.PI;
    scene.add(panel);
    const back=box(scene,new THREE.MeshStandardMaterial({
      color:0x060c13,metalness:.8,roughness:.23
    }),[s.x,panel.position.y,faceZ+(s.face==='front'?-.10:.10)],[8.9,3.25,.2]);
    // A faint ground reflection makes the signs feel integrated with the wet world.
    const accent=new THREE.Color(s.col);
    glowing.push(createGlow(scene,glow,s.x,panel.position.y,faceZ+1,8,accent,.33));
    planarEllipse(scene,s.x,(s.z>0?s.z-10:s.z+10),2.6,6.5,accent,.15);
    if(index<5){
      const light=new THREE.PointLight(accent,index<2?5.4:3.8,20,2);
      light.position.set(s.x,5,faceZ+(s.face==='front'?1.5:-1.5));
      scene.add(light);lights.push(light);
    }
  }
  const signs2=[
    {x:-11.65,z:-20,y:5,c:0x55e4ff,label:'◈'},
    {x:11.65,z:20,y:6,c:0xff6897,label:'◈'},
    {x:-31.65,z:0,y:5,c:0x83f3d0,label:'◈'}
  ];
  signs2.forEach(s=>{
    const panel=box(scene,new THREE.MeshStandardMaterial({
      color:s.c,emissive:s.c,emissiveIntensity:2.3,roughness:.24
    }),[s.x,s.y,s.z],[.15,3.3,1.1]);
    glowing.push(createGlow(scene,glow,s.x,s.y,s.z,4.4,s.c,.37));
  });
  return {glowing,lights};
}
function createVehicles(scene,glow) {
  const cars=[],wheels=new THREE.CylinderGeometry(.47,.47,.23,12);
  const materialTire=new THREE.MeshStandardMaterial({color:0x070d14,roughness:.9});
  const glass=new THREE.MeshPhysicalMaterial({color:0x0b273b,metalness:.4,roughness:.18,clearcoat:1,clearcoatRoughness:.12});
  const lights=new THREE.MeshBasicMaterial({color:0xf5efff});
  const brake=new THREE.MeshBasicMaterial({color:0xff274d});
  const values=[
    [-5.1,-13.3,0,0x243e54],
    [5.1,-32,Math.PI,0x444b5b],
    [-5.1,26,0,0x4a3245],
    [25.7,-5.2,Math.PI/2,0x254e56],
    [-34,5.2,Math.PI/2,0x463f56],
    [44.4,5.3,-Math.PI/2,0x354c5f],
    [-46,-5.3,Math.PI,0x536072]
  ];
  for(const [x,z,angle,color] of values){
    const root=new THREE.Group();root.position.set(x,.27,z);root.rotation.y=angle;scene.add(root);
    const paint=new THREE.MeshPhysicalMaterial({color,metalness:.68,roughness:.24,clearcoat:1,clearcoatRoughness:.11});
    box(root,paint,[0,.53,0],[2.03,.72,4.18]);
    box(root,paint,[0,1.18,-.18],[1.72,.66,2.4]);
    box(root,glass,[0,1.2,-1.39],[1.5,.5,.06]);
    box(root,glass,[0,1.2,1.02],[1.5,.5,.06]);
    for(const w of [-.98,.98])for(const d of [-1.36,1.35]){
      const wheel=new THREE.Mesh(wheels,materialTire);wheel.rotation.z=Math.PI/2;
      wheel.position.set(w,.29,d);root.add(wheel);
      const hub=new THREE.Mesh(new THREE.CylinderGeometry(.2,.2,.245,8),
        new THREE.MeshStandardMaterial({color:0x81909d,metalness:.9,roughness:.25}));
      hub.rotation.z=Math.PI/2;hub.position.copy(wheel.position);root.add(hub);
    }
    for(const side of [-.67,.67]){
      box(root,lights,[side,.58,-2.105],[.42,.18,.05]);
      box(root,brake,[side,.58,2.105],[.36,.15,.05]);
    }
    const shadow=new THREE.Mesh(new THREE.PlaneGeometry(2.3,4.7),basic(0x00030a,.4));
    shadow.rotation.x=-Math.PI/2;shadow.position.y=-.22;root.add(shadow);
    cars.push(root);
    createGlow(scene,glow,x,.7,z-2.25,2.25,0xc8eaff,.45);
  }
  return cars;
}
function dressCity(scene,glow) {
  const steel=new THREE.MeshStandardMaterial({color:0x2b4351,roughness:.47,metalness:.65});
  const teal=new THREE.MeshBasicMaterial({color:0x68f0ef});
  const red=new THREE.MeshBasicMaterial({color:0xff5c66});
  const props=[];
  for(let z=-63;z<=63;z+=20){
    // Transit shelters, small bollards, planters.
    for(const x of [-8.6,8.6]){
      if(z===-3)continue;
      box(scene,steel,[x,1.25,z],[2.3,.14,3.4]);
      box(scene,steel,[x,2.55,z],[2.5,.16,3.65]);
      for(const zz of [-1.4,1.4]){
        box(scene,steel,[x,1.4,z+zz],[.08,2.3,.08]);
      }
      box(scene,new THREE.MeshPhysicalMaterial({
        color:0x264257,transparent:true,opacity:.42,roughness:.09,metalness:.17,depthWrite:false,
        side:THREE.DoubleSide
      }),[x+(x>0?1.06:-1.06),1.56,z],[.06,1.62,2.8]);
      createGlow(scene,glow,x,2.7,z,3.2,0x46cdff,.2);
    }
  }
  const bollards=[];
  for(const x of [-12,12])for(let z=-68;z<=68;z+=8) {
    bollards.push([x,.39,z,.18,.78,.18]);
  }
  batch(scene,bollards,new THREE.CylinderGeometry(.5,.5,1,8),steel);
  for(const x of [-10,10])for(const z of [-10,10]){
    const pole=box(scene,steel,[x,2.15,z],[.13,4.3,.13]);
    const signal=box(scene,steel,[x,4.23,z],[.48,1.14,.5]);
    for(let i=0;i<3;i++){
      const bulb=new THREE.Mesh(new THREE.SphereGeometry(.14,8,5),
        i===0?red:i===1?new THREE.MeshBasicMaterial({color:0x44350c}):teal);
      bulb.position.set(x,4.55-i*.3,z+.28);scene.add(bulb);
    }
  }
  const lines=[];
  for(const b of [-60,-40,-20,20,40,60]){
    for(const z of [-67,-47,-27,-7,13,33,53]){
      lines.push([b-8.4,.27,z,.12,.12,.8]);
    }
  }
  batch(scene,lines,new THREE.BoxGeometry(1,1,1),new THREE.MeshBasicMaterial({color:0x68e6fb}));
  return props;
}
function addHeroArmor(player,glow) {
  if(!player)return [];
  const steel=new THREE.MeshStandardMaterial({color:0x243b50,roughness:.33,metalness:.78});
  const graphite=new THREE.MeshStandardMaterial({color:0x0d1929,roughness:.37,metalness:.7});
  const bright=new THREE.MeshStandardMaterial({color:0x80f4ff,emissive:0x33caff,emissiveIntensity:2.7,metalness:.2,roughness:.25});
  const warm=new THREE.MeshStandardMaterial({color:0xffad68,emissive:0xa83c11,emissiveIntensity:1.2,roughness:.36,metalness:.65});
  // Armor plates retain the original rig and animations.
  box(player,steel,[0,1.51,-.465],[.74,.48,.13]);
  box(player,graphite,[0,1.22,-.48],[.58,.25,.13]);
  for(const sign of [-1,1]){
    box(player,steel,[sign*.61,1.88,-.02],[.39,.27,.64]);
    box(player,graphite,[sign*.27,1.62,-.51],[.21,.55,.08]);
    box(player,bright,[sign*.36,1.73,-.53],[.065,.32,.055]);
    box(player,steel,[sign*.27,.84,-.26],[.37,.23,.20]);
    box(player,warm,[sign*.32,.96,-.414],[.12,.12,.11]);
  }
  box(player,bright,[0,1.63,-.548],[.36,.065,.08]);
  box(player,steel,[0,2.56,-.225],[.66,.11,.21]);
  box(player,bright,[0,2.13,-.358],[.09,.04,.035]);
  // Ribbed spine and cape clasp.
  box(player,steel,[0,1.88,.44],[.88,.16,.16]);
  const aura=createGlow(player,glow,0,1.72,-.86,2.15,0x56edff,.24);
  return [aura];
}
export function installPremiumGraphics({scene,camera,renderer,buildings,player,mobile}) {
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.23;
  scene.fog=new THREE.FogExp2(0x0d2030,mobile?.014:.0105);
  const glow=radialTexture();
  createAtmosphere(scene);
  makeWetStreets(scene);
  addArchitecture(scene,buildings);
  const neon=neonDistrict(scene,glow);
  createVehicles(scene,glow);
  dressCity(scene,glow);
  const heroAura=addHeroArmor(player,glow);
  const lampGlow=[];
  for(let x=-60;x<=60;x+=20){
    for(const z of [-9.5,9.5]){
      const spot=createGlow(scene,glow,x+8.5,4.8,z,4.0,0xffd49c,.42);
      lampGlow.push(spot);
      planarEllipse(scene,x+8.5,z,1.7,4.5,0xffcc9d,.09);
    }
  }
  // Pooling atmospheric cloud sprites prevents per-frame allocations.
  const cloudMaterial=new THREE.SpriteMaterial({
    map:glow,color:0x426681,transparent:true,opacity:.09,
    depthWrite:false,blending:THREE.AdditiveBlending
  });
  const clouds=[];
  for(let i=0;i<(mobile?13:28);i++){
    const s=new THREE.Sprite(cloudMaterial.clone());
    const angle=random(i,10)*Math.PI*2;
    const radius=15+random(i,13)*72;
    s.position.set(Math.cos(angle)*radius,8+random(i,18)*15,Math.sin(angle)*radius);
    s.scale.set(22+random(i,2)*28,3+random(i,4)*6,1);
    scene.add(s);clouds.push(s);
  }
  const direction=new THREE.Vector3();
  let quality=mobile?'balanced':'cinematic';
  function setQuality(level) {
    if(!['eco','balanced','cinematic'].includes(level))return quality;
    quality=level;
    const target=level==='eco'?1:level==='balanced'?1.45:Math.min(devicePixelRatio||1,2);
    renderer.setPixelRatio(Math.min(devicePixelRatio||1,target));
    renderer.setSize(window.innerWidth,window.innerHeight,false);
    renderer.shadowMap.enabled=level==='cinematic'&&!mobile;
    scene.fog.density=level==='eco'?.018:mobile?.014:.0105;
    clouds.forEach((obj,i)=>{obj.visible=level!=='eco'||i%3===0;});
    neon.glowing.forEach((obj,i)=>{obj.material.opacity=level==='eco'?.17:.33;});
    lampGlow.forEach((obj)=>{obj.material.opacity=level==='eco'?.18:.42;});
    return quality;
  }
  setQuality(quality);
  function update(dt,time,heroPosition,gliding=false) {
    // Subtle light flicker and drifting clouds add atmosphere, without runtime geometry creation.
    neon.lights.forEach((light,i)=>{
      light.intensity=(i<2?5.4:3.8)*(0.91+Math.sin(time*3.5+i*2.7)*.07);
    });
    neon.glowing.forEach((object,i)=>{
      object.material.opacity=(quality==='eco'?.17:.30)*(0.84+Math.sin(time*2+i*1.35)*.15);
    });
    clouds.forEach((obj,i)=>{
      obj.position.x+=dt*(.18+i%4*.10);
      if(obj.position.x>95)obj.position.x=-95;
      obj.position.y+=Math.sin(time*.4+i)*dt*.06;
    });
    heroAura.forEach(a=>{
      a.material.opacity=gliding?.35:.17+Math.sin(time*3)*.045;
      a.scale.setScalar(gliding?3.3:2.15);
    });
  }
  return { update, setQuality, getQuality:()=>quality };
}
