import * as THREE from 'three';

// Phase 2: facade atlas and detailed architecture. Shaders and textures are
// entirely original procedural content, drawn locally without image downloads.
const hash=(a,b=0)=>{let t=Math.sin(a*127.13+b*312.9+41.9)*43858.5453;return t-Math.floor(t)};
const P=[
 {wall:'#425364',brick:'#293a4b',trim:'#6f8792',glass:'#142636',lit:'#9fbed1'},
 {wall:'#545760',brick:'#363b47',trim:'#99a0a8',glass:'#101e2b',lit:'#d4c5a2'},
 {wall:'#273e4e',brick:'#192e3e',trim:'#5e8291',glass:'#152b3e',lit:'#80c3dc'},
 {wall:'#594d4b',brick:'#41393c',trim:'#918385',glass:'#142733',lit:'#f3bd93'},
 {wall:'#394655',brick:'#253443',trim:'#879ca7',glass:'#102232',lit:'#9edfec'}
];
function facadeTexture(theme,variant){
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=1024;
 const c=canvas.getContext('2d');
 c.fillStyle=theme.wall;c.fillRect(0,0,512,1024);
 // Stone coursing, staggered joints, carbon/grime trails.
 for(let y=0;y<1024;y+=24){
  c.fillStyle=y%48===0?'#101c2650':'#02081125';c.fillRect(0,y,512,2);
  for(let x=(Math.floor(y/24)%2)*45;x<512;x+=90){
   c.fillRect(x,y,2,24);
  }
 }
 for(let j=0;j<1700;j++){
  let x=hash(j,22)*512,y=hash(j,47)*1024;
  c.fillStyle=hash(j,67)>.55?'#b3c3d007':'#00051018';
  c.fillRect(x,y,1+hash(j,4)*2,5+hash(j,6)*27);
 }
 const rows=11;
 const cols=variant%2===0?4:3;
 const pitchX=512/cols,pitchY=1024/rows;
 for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
  const gx=x*pitchX,gy=y*pitchY;
  const windowWidth=pitchX*(variant===2?.59:.62);
  const windowHeight=pitchY*(variant===1?.72:.64);
  const bx=gx+(pitchX-windowWidth)/2,by=gy+pitchY*.14;
  c.fillStyle='#090f19';c.fillRect(bx-7,by-6,windowWidth+14,windowHeight+13);
  c.fillStyle=theme.trim;c.fillRect(bx-5,by-4,windowWidth+10,windowHeight+9);
  const lit=hash(x+y*9,variant)>.56;
  const glass=c.createLinearGradient(bx,by,bx+windowWidth,by+windowHeight);
  glass.addColorStop(0,lit?theme.lit:theme.glass);
  glass.addColorStop(.5,lit?'#78899a':'#102536');
  glass.addColorStop(1,'#070f1d');
  c.fillStyle=glass;c.fillRect(bx,by,windowWidth,windowHeight);
  c.fillStyle='#d2e9ee45';c.fillRect(bx+3,by+3,3,windowHeight-7);
  c.fillStyle=theme.trim;c.fillRect(bx+windowWidth*.49,by,4,windowHeight);
  c.fillRect(bx,by+windowHeight*.47,windowWidth,3);
  if(variant===1||variant===3) {
   c.fillStyle=theme.brick;
   c.fillRect(gx+pitchX*.11,gy+pitchY*.93,pitchX*.78,5);
  }
  c.fillStyle='#080b1555';c.fillRect(bx-8,by+windowHeight+4,windowWidth+16,6);
 }
 const texture=new THREE.CanvasTexture(canvas);
 texture.colorSpace=THREE.SRGBColorSpace;
 texture.anisotropy=4;
 return texture;
}
function instanced(scene,geometry,material,placements){
 if(!placements.length)return null;
 const mesh=new THREE.InstancedMesh(geometry,material,placements.length);
 const o=new THREE.Object3D();
 placements.forEach((p,i)=>{
  const [x,y,z,sx,sy,sz,rot=0]=p;
  o.position.set(x,y,z);o.rotation.set(0,rot,0);o.scale.set(sx,sy,sz);o.updateMatrix();
  mesh.setMatrixAt(i,o.matrix);
 });
 mesh.instanceMatrix.needsUpdate=true;scene.add(mesh);return mesh;
}
function bmesh(scene,geometry,material,p,s,rot=0){
 const m=new THREE.Mesh(geometry,material);m.position.set(...p);m.scale.set(...s);m.rotation.y=rot;scene.add(m);return m;
}
function makeBuildings(scene,buildings){
 const palettes=P.map((p,i)=>facadeTexture(p,i));
 const mats=palettes.map(tex=>new THREE.MeshStandardMaterial({
  map:tex,color:0xb5c8d2,metalness:.12,roughness:.8
 }));
 const metal=new THREE.MeshStandardMaterial({color:0x536b7b,metalness:.68,roughness:.38});
 const dark=new THREE.MeshStandardMaterial({color:0x263849,metalness:.5,roughness:.45});
 const stone=new THREE.MeshStandardMaterial({color:0x6c7881,metalness:.15,roughness:.76});
 const ornate=[],trim=[],vents=[],rail=[],roofGlass=[],fire=[];
 const cube=new THREE.BoxGeometry(1,1,1);
 const roofGeom=new THREE.CylinderGeometry(1,1,1,12);
 const pipes=new THREE.CylinderGeometry(1,1,1,8);
 const total=buildings.length;
 for(let i=0;i<total;i++){
  const b=buildings[i],x=b.x,z=b.z,h=b.height,w=b.width,d=b.depth;
  const v=hash(x*.3,z*.3),style=Math.floor(v*mats.length);
  // Facade overlay occupies the outermost ~6cm without altering collision.
  const facade=new THREE.Mesh(cube,mats[style]);
  facade.position.set(x,h/2,z);facade.scale.set(w+.06,h,d+.06);
  scene.add(facade);
  const floors=Math.min(12,Math.floor(h/3));
  // On tall buildings draw horizontal belt course and deep recessed walls.
  const foundationH=Math.min(4.1,Math.max(2.7,h*.15));
  ornate.push([x,foundationH,z+d/2+.14,w+.25,.27,.35]);
  ornate.push([x,foundationH,z-d/2-.14,w+.25,.27,.35]);
  ornate.push([x+w/2+.14,foundationH,z,.35,.27,d+.25]);
  ornate.push([x-w/2-.14,foundationH,z,.35,.27,d+.25]);
  for(let f=1;f<Math.max(2,floors-1);f+=2){
   const y=foundationH+f*2.85;if(y>h-.9)break;
   trim.push([x,y,z+d/2+.15,w+.25,.085,.26]);
   trim.push([x,y,z-d/2-.15,w+.25,.085,.26]);
  }
  // Cornices, terraced caps and varied rooflines.
  const crown=h+.5,edgeHeight=v>.62?1.15:.43;
  for(const dx of [-1,1]){
   rail.push([x+dx*w*.50,crown+edgeHeight/2,z,.23,edgeHeight,d+.3]);
  }
  for(const dz of [-1,1]){
   rail.push([x,crown+edgeHeight/2,z+dz*d*.5,w+.3,edgeHeight,.23]);
  }
  if(v>.23&&v<.52){
   // Raised penthouse has irregular profile and roof detail.
   const ph=new THREE.Mesh(cube,dark);
   ph.position.set(x+1.1,h+1.4,z+.8);ph.scale.set(w*.5,2.0,d*.53);
   scene.add(ph);
   roofGlass.push([x+1.1,h+2.42,z+.8,w*.52,.13,d*.54]);
  }else if(v>.65){
   // Mechanical roof equipment, exhaust baffles.
   vents.push([x-1.6,h+1.0,z+1.3,2.4,1.5,2.9]);
   vents.push([x+2.3,h+.8,z-2.2,1.4,1,1.7]);
  }
  // External fire escapes with ladder rails: one side on each alternate tower.
  if(i%3===0){
   const side=i%2?1:-1;
   const fx=x+side*(w/2+.36);
   for(let yy=4;yy<h-2;yy+=4.1){
    fire.push([fx,yy,z,.92,.11,3.2]);
    fire.push([fx+side*.42,yy+.42,z+1.43,.065,.85,.065]);
    fire.push([fx+side*.42,yy+.42,z-1.43,.065,.85,.065]);
   }
   fire.push([fx+side*.49,h/2,z+1.27,.09,h-.6,.07]);
   fire.push([fx+side*.49,h/2,z-1.27,.09,h-.6,.07]);
  }
  // Balcony projections are lightweight physically based detail.
  if(style===1||style===3){
   for(let yy=5;yy<h-3;yy+=6){
    const side=i%2?1:-1;
    ornate.push([x,yy,z+side*(d/2+.49),w*.68,.13,.86]);
    ornate.push([x,yy+.45,z+side*(d/2+.83),w*.66,.91,.07]);
   }
  }
 }
 instanced(scene,cube,stone,ornate);
 instanced(scene,cube,metal,trim);
 instanced(scene,cube,dark,vents);
 instanced(scene,cube,stone,rail);
 instanced(scene,cube,metal,roofGlass);
 instanced(scene,cube,metal,fire);
 return {palettes};
}
function shapeAwnings(scene,buildings){
 const dark=new THREE.MeshPhysicalMaterial({color:0x213d53,metalness:.36,roughness:.48,clearcoat:.3});
 const fabric=new THREE.MeshStandardMaterial({color:0x5c6570,metalness:.12,roughness:.82,side:THREE.DoubleSide});
 const glass=new THREE.MeshPhysicalMaterial({color:0x183549,metalness:.45,roughness:.16,clearcoat:1,transparent:true,opacity:.82});
 const roadMat=new THREE.MeshBasicMaterial({color:0x86b1d1,transparent:true,opacity:.26});
 const cube=new THREE.BoxGeometry(1,1,1);
 const doors=[],awnings=[],sconces=[];
 for(const [i,b] of buildings.entries()){
  const n=hash(i,2),x=b.x,z=b.z,w=b.width,d=b.depth;
  const sides=[-1,1];
  const s=sides[i%2];
  for(let k=-1;k<=1;k++){
   doors.push([x+k*(w*.27),1.78,z+s*(d/2+.085),2.35,3.15,.12]);
  }
  const awningY=3.55;
  awnings.push([x,awningY,z+s*(d/2+1.2),w*.84,.2,2.8]);
  for(let q=-2;q<=2;q++){
   sconces.push([x+q*w*.15,3.2,z+s*(d/2+1.6),.16,.09,.32]);
  }
 }
 instanced(scene,cube,glass,doors);
 instanced(scene,cube,fabric,awnings);
 instanced(scene,cube,roadMat,sconces);
}
function createRooftopDetails(scene,buildings,mobile){
 const steel=new THREE.MeshStandardMaterial({color:0x82919b,metalness:.72,roughness:.3});
 const rust=new THREE.MeshStandardMaterial({color:0x64595a,metalness:.6,roughness:.64});
 const roof=new THREE.MeshStandardMaterial({color:0x344757,metalness:.61,roughness:.55});
 const cylinder=new THREE.CylinderGeometry(.5,.5,1,12);
 const cone=new THREE.ConeGeometry(1,1,12);
 const cube=new THREE.BoxGeometry(1,1,1);
 const ducts=[],vents=[],antennas=[],tanks=[],crossbars=[];
 for(let i=0;i<buildings.length;i++){
  const b=buildings[i],x=b.x,z=b.z,h=b.height;
  if(i%4===0){
   tanks.push([x+2.4,h+2.2,z-1.6,1.6,2.3,1.6]);
   for(let a=0;a<4;a++){
    const ang=a*Math.PI/2;
    antennas.push([x+2.4+Math.cos(ang)*.68,h+1.0,z-1.6+Math.sin(ang)*.68,.09,1.8,.09]);
   }
  }else{
   ducts.push([x-2,h+.8,z-1,3.5,.60,.72]);
   vents.push([x-1,h+.72,z+2,.88,.8,.88]);
   vents.push([x+1.5,h+.65,z-2,.95,.7,.86]);
  }
  if(i%5===0){
   antennas.push([x-2,h+4.5,z+2,.09,7.3,.09]);
   for(let n=0;n<3;n++){
    const y=h+3+n*1.2;
    crossbars.push([x-2,y,z+2,1.4,.08,.08]);
   }
  }
 }
 instanced(scene,cube,roof,ducts);
 instanced(scene,cylinder,steel,vents);
 instanced(scene,cube,steel,antennas);
 instanced(scene,cylinder,rust,tanks);
 instanced(scene,cube,steel,crossbars);
}
function scatterStreetDetails(scene,buildings,mobile){
 const cylinder=new THREE.CylinderGeometry(.5,.5,1,7);
 const leafGeo=new THREE.IcosahedronGeometry(.75,1);
 const trunks=[],leaves=[],barriers=[];
 const bark=new THREE.MeshStandardMaterial({color:0x3f423d,roughness:1});
 const foliage=new THREE.MeshStandardMaterial({color:0x213c33,roughness:.93,flatShading:false});
 const concrete=new THREE.MeshStandardMaterial({color:0x65727a,roughness:.89});
 for(let i=0;i<buildings.length;i+=2){
  const b=buildings[i],side=i%3===0?-1:1;
  const x=b.x+side*(b.width/2+1.4),z=b.z+side*(b.depth/2-1.5);
  trunks.push([x,1.65,z,.44,3.3,.44]);
  leaves.push([x,3.65,z,1.6,2,1.65]);
  leaves.push([x+.55,4.2,z-.5,1.3,1.45,1.3]);
 }
 for(let i=-68;i<70;i+=16){
  barriers.push([8.25,.35,i,.25,.72,.25]);
  barriers.push([-8.25,.35,i,.25,.72,.25]);
 }
 instanced(scene,cylinder,bark,trunks);
 instanced(scene,leafGeo,foliage,leaves);
 instanced(scene,cylinder,concrete,barriers);
}
export function installCityV4({scene,buildings,mobile}){
 makeBuildings(scene,buildings);
 shapeAwnings(scene,buildings);
 createRooftopDetails(scene,buildings,mobile);
 scatterStreetDetails(scene,buildings,mobile);
 return {installed:true,facades:buildings.length};
}
