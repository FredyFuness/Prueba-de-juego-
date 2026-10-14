import * as THREE from 'three';

// NOCTURNE vehicles: original rounded coupe and patrol silhouettes,
// authored as beveled extruded profiles rather than stacked boxes.
// The roadway is not a race track; vehicles are static scene dressing.
const rimMaterial=new THREE.MeshStandardMaterial({color:0x7b8999,metalness:.88,roughness:.22});
const tireMaterial=new THREE.MeshStandardMaterial({color:0x0d1017,roughness:.93});
const darkTrim=new THREE.MeshPhysicalMaterial({color:0x0c1420,metalness:.61,roughness:.38,clearcoat:.34});
const glassMaterial=new THREE.MeshPhysicalMaterial({color:0x214054,metalness:.16,roughness:.1,clearcoat:1,clearcoatRoughness:.06,transparent:true,opacity:.77,side:THREE.DoubleSide});
const headlight=new THREE.MeshBasicMaterial({color:0xdcefff});
const taillight=new THREE.MeshBasicMaterial({color:0xff4358});
const wheelGeo=new THREE.CylinderGeometry(.405,.405,.19,20);
const hubGeo=new THREE.CylinderGeometry(.225,.225,.208,20);
const glassGeo=new THREE.PlaneGeometry(1,1);
function outline(kind){
  const s=new THREE.Shape();
  if(kind==='crossover'){
    s.moveTo(-2.15,.37);
    s.quadraticCurveTo(-2.25,.43,-2.18,.63);
    s.quadraticCurveTo(-2.05,.84,-1.65,.90);
    s.lineTo(1.68,.89);
    s.quadraticCurveTo(2.17,.83,2.22,.58);
    s.quadraticCurveTo(2.24,.4,2.12,.34);
    s.lineTo(-2.15,.34);
  }else{
    s.moveTo(-2.20,.32);
    s.quadraticCurveTo(-2.34,.49,-2.12,.60);
    s.quadraticCurveTo(-1.44,.86,-.95,.84);
    s.lineTo(1.45,.86);
    s.quadraticCurveTo(2.2,.69,2.17,.39);
    s.quadraticCurveTo(2.14,.33,1.96,.31);
    s.lineTo(-2.2,.32);
  }
  s.closePath();return s;
}
function roofShape(crossover){
 const p=new THREE.Shape();
 if(crossover){
  p.moveTo(-1.34,.87);
  p.lineTo(-.76,1.65);
  p.quadraticCurveTo(-.63,1.74,-.42,1.74);
  p.lineTo(.91,1.73);
  p.quadraticCurveTo(1.15,1.69,1.25,1.50);
  p.lineTo(1.59,.87);
 }else{
  p.moveTo(-1.22,.87);
  p.lineTo(-.69,1.57);
  p.quadraticCurveTo(-.54,1.67,-.31,1.67);
  p.lineTo(.78,1.66);
  p.quadraticCurveTo(.95,1.64,1.08,1.52);
  p.lineTo(1.55,.87);
 }
 p.closePath();return p;
}
function extrudedShape(shape,width,material,parent,bevel=.045){
 const geo=new THREE.ExtrudeGeometry(shape,{
  depth:width,steps:1,bevelEnabled:true,bevelThickness:bevel,
  bevelSize:bevel,bevelSegments:3,curveSegments:8
 });
 const obj=new THREE.Mesh(geo,material);
 obj.rotation.y=-Math.PI/2;obj.position.x=width/2;parent.add(obj);
 return obj;
}
function sideGlass(root,x,points){
 const positions=[];
 for(let i=1;i<points.length-1;i++){
  for(const p of [points[0],points[i],points[i+1]])positions.push(x,p[1],p[0]);
 }
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 geometry.computeVertexNormals();
 const mesh=new THREE.Mesh(geometry,glassMaterial);
 root.add(mesh);return mesh;
}
function lamp(root,x,y,z,color){
 const obj=new THREE.Mesh(new THREE.SphereGeometry(.12,10,8),color);
 obj.position.set(x,y,z);obj.scale.set(1.55,.65,.32);root.add(obj);
 return obj;
}
function glow(root,texture,x,y,z,tint,size){
 const sprite=new THREE.Sprite(new THREE.SpriteMaterial({
  map:texture,color:tint,transparent:true,opacity:.55,blending:THREE.AdditiveBlending,depthWrite:false
 }));
 sprite.position.set(x,y,z);sprite.scale.set(size,size,1);root.add(sprite);return sprite;
}
function createCar(scene,texture,{x,z,angle,color,crossover=false,police=false}){
 const root=new THREE.Group();root.position.set(x,.05,z);root.rotation.y=angle;scene.add(root);
 const paint=new THREE.MeshPhysicalMaterial({
  color,metalness:.60,roughness:.28,clearcoat:.95,clearcoatRoughness:.12
 });
 extrudedShape(outline(crossover?'crossover':'coupe'),1.89,paint,root,.055);
 extrudedShape(roofShape(crossover),1.54,darkTrim,root,.024);
 const leftSide=-.790,rightSide=.790;
 const y0=crossover?1.68:1.61,low=.91;
 for(const xSide of [leftSide,rightSide]){
  const A=[[-1.25,low],[-.66,y0-.06],[-.14,y0-.06],[-.13,low]];
  const B=[[-.04,low],[-.03,y0-.06],[.70,y0-.06],[1.19,low]];
  sideGlass(root,xSide+(xSide>0?.026:-.026),A);
  sideGlass(root,xSide+(xSide>0?.026:-.026),B);
  // Lower door-line seam, from curved silhouette to sill.
  const seam=new THREE.Mesh(new THREE.BoxGeometry(.022,.015,2.15),darkTrim);
  seam.position.set(xSide>0?1.006:-1.006,.74,.03);root.add(seam);
  const mirror=new THREE.Mesh(new THREE.SphereGeometry(.15,12,9),paint);
  mirror.position.set(xSide>0?1.05:-1.05,1.04,-.78);
  mirror.scale.set(1.4,.64,1.1);root.add(mirror);
 }
 for(const side of [-1,1]){
  for(const zWheel of [-1.40,1.43]){
   const tire=new THREE.Mesh(wheelGeo,tireMaterial);
   tire.rotation.z=Math.PI/2;
   tire.position.set(side*.92,.43,zWheel);root.add(tire);
   const hub=new THREE.Mesh(hubGeo,rimMaterial);hub.rotation.z=Math.PI/2;
   hub.position.copy(tire.position);hub.position.x+=side*.012;root.add(hub);
   const disc=new THREE.Mesh(new THREE.TorusGeometry(.21,.026,7,20),darkTrim);
   disc.rotation.y=Math.PI/2;
   disc.position.copy(tire.position);disc.position.x+=side*.115;root.add(disc);
  }
  const front=lamp(root,side*.67,.69,-2.20,headlight);
  const rear=lamp(root,side*.72,.65,2.17,taillight);
  front.scale.x=2.0;rear.scale.x=1.75;
  glow(root,texture,side*.67,.65,-2.28,0xb2dbff,1.65);
  glow(root,texture,side*.69,.63,2.22,0xff385f,1.15);
 }
 // Sculpted grille, windscreen wiper, and license plate.
 const grille=new THREE.Mesh(new THREE.BoxGeometry(1.13,.18,.041),darkTrim);
 grille.position.set(0,.52,-2.22);root.add(grille);
 const plate=new THREE.Mesh(new THREE.BoxGeometry(.51,.15,.044),rimMaterial);
 plate.position.set(0,.53,2.18);root.add(plate);
 if(police){
  const strip=new THREE.Mesh(new THREE.CapsuleGeometry(.20,.55,4,12),
   new THREE.MeshBasicMaterial({color:0x398de9}));
  strip.rotation.z=Math.PI/2;strip.position.set(0,1.80,0);root.add(strip);
 }
 return root;
}
export function createPremiumVehicles(scene,texture){
 const vehicles=[
  {x:-5.1,z:-13.3,angle:0,color:0x314758,crossover:true},
  {x:5.1,z:-32,angle:Math.PI,color:0x414953},
  {x:-5.1,z:26,angle:0,color:0x4a3b48},
  {x:25.7,z:-5.2,angle:Math.PI/2,color:0x2c535b,crossover:true},
  {x:-34,z:5.2,angle:Math.PI/2,color:0x464456},
  {x:44.4,z:5.3,angle:-Math.PI/2,color:0x35516a,police:true},
  {x:-46,z:-5.3,angle:Math.PI,color:0x626b72}
 ];
 return vehicles.map(vehicle=>createCar(scene,texture,vehicle));
}
