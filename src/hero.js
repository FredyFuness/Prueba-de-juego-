import * as THREE from 'three';
const polished=new THREE.MeshPhysicalMaterial({color:0x415361,metalness:.75,roughness:.25,clearcoat:1});
const steel=new THREE.MeshStandardMaterial({color:0x172431,metalness:.47,roughness:.54});
const matte=new THREE.MeshStandardMaterial({color:0x0b1521,metalness:.22,roughness:.83,side:THREE.DoubleSide});
const edge=new THREE.MeshStandardMaterial({color:0x71838c,metalness:.85,roughness:.27});
const energy=new THREE.MeshStandardMaterial({color:0x9becff,emissive:0x35caff,emissiveIntensity:2.3});
const enemyRed=new THREE.MeshStandardMaterial({color:0xff827c,emissive:0xe72b36,emissiveIntensity:2});
const sph=new THREE.SphereGeometry(1,16,12);
function oval(parent,mat,x,y,z,a,b,c){
 const o=new THREE.Mesh(sph,mat);o.position.set(x,y,z);o.scale.set(a,b,c);parent.add(o);return o;
}
function rod(parent,mat,from,to,r1,r2){
 const d=new THREE.Vector3(...to).sub(new THREE.Vector3(...from));
 const m=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,d.length(),10),mat);
 m.position.copy(new THREE.Vector3(...from).add(new THREE.Vector3(...to)).multiplyScalar(.5));
 m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());parent.add(m);return m;
}
function plate(parent,mat,coords,z=-.35){
 const shape=new THREE.Shape();
 coords.forEach((p,i)=>i?shape.lineTo(p[0],p[1]):shape.moveTo(p[0],p[1]));
 shape.closePath();
 const geo=new THREE.ExtrudeGeometry(shape,{depth:.045,bevelEnabled:true,bevelSize:.015,bevelThickness:.016,bevelSegments:2});
 const m=new THREE.Mesh(geo,mat);m.position.z=z;parent.add(m);return m;
}
export function makeHero(){
 const root=new THREE.Group(),body=new THREE.Group(),arms=[],legs=[];
 root.add(body);
 oval(body,steel,0,1.43,0,.53,.68,.36);
 oval(body,polished,0,1.51,-.30,.47,.54,.20);
 oval(body,steel,0,.96,0,.40,.24,.3);
 for(const s of [-1,1]){
  plate(body,polished,[[s*.04,1.84],[s*.46,1.81],[s*.48,1.56],[s*.12,1.48]],-.49);
  plate(body,polished,[[s*.1,1.43],[s*.40,1.44],[s*.38,1.22],[s*.1,1.21]],-.46);
  for(let i=0;i<3;i++)rod(body,edge,[s*.15,1.31+i*.075,-.50],[s*.36,1.31+i*.075,-.46],.022,.02);
 }
 plate(body,matte,[[-.1,1.82],[.1,1.82],[.13,1.58],[0,1.51],[-.13,1.58]],-.56);
 oval(body,energy,0,1.65,-.59,.13,.08,.055);
 rod(body,edge,[-.42,1.02,-.16],[.42,1.02,-.16],.08,.08);
 for(let i=-2;i<=2;i++)oval(body,edge,i*.125,1.02,-.35,.041,.1,.058);
 const head=new THREE.Group();head.position.y=2.34;root.add(head);
 oval(head,steel,0,0,0,.33,.40,.32);
 oval(head,polished,0,.13,.03,.325,.28,.31);
 plate(head,matte,[[-.28,-.10],[-.14,-.32],[.14,-.32],[.28,-.10],[.21,.04],[-.21,.04]],-.29);
 oval(head,energy,0,.028,-.327,.24,.074,.035);
 rod(head,edge,[-.18,-.14,-.326],[.18,-.14,-.326],.024,.022);
 for(const s of [-1,1]){
  oval(head,polished,s*.33,-.03,.03,.085,.17,.14);
  rod(head,edge,[s*.19,.30,.03],[s*.2,.47,.03],.033,.021);
 }
 for(const s of [-1,1]){
  const arm=new THREE.Group();arm.position.set(s*.62,1.91,0);root.add(arm);arms.push(arm);
  oval(arm,polished,s*.015,-.1,0,.285,.24,.30);
  rod(arm,steel,[0,-.18,0],[s*.08,-.61,0],.23,.18);
  oval(arm,edge,s*.08,-.64,0,.21,.19,.20);
  rod(arm,polished,[s*.08,-.68,0],[s*.12,-1.02,-.04],.19,.13);
  oval(arm,matte,s*.12,-1.09,-.07,.18,.13,.18);
  for(let k=0;k<3;k++)rod(arm,edge,[s*.25,-.75-k*.087,-.10],[s*.25,-.75-k*.087,.14],.015,.015);
  const leg=new THREE.Group();leg.position.set(s*.25,.94,0);root.add(leg);legs.push(leg);
  oval(leg,steel,0,-.17,0,.26,.31,.26);
  rod(leg,steel,[0,-.20,0],[0,-.50,0],.22,.18);
  oval(leg,polished,0,-.48,-.15,.23,.18,.16);
  rod(leg,polished,[0,-.53,0],[0,-.73,.01],.19,.15);
  oval(leg,matte,0,-.8,-.12,.22,.16,.29);
 }
 const cols=17,rows=12,pos=[],uv=[],ind=[],base=[];
 for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){
  const t=j/rows,u=i/cols,x=(u-.5)*(.9+2.0*t),y=1.95-1.8*t,z=.27+.68*t*t;
  pos.push(x,y,z);uv.push(u,1-t);base.push(x,y,z,t,u);
 }
 for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){
  const k=j*(cols+1)+i;ind.push(k,k+cols+1,k+1,k+1,k+cols+1,k+cols+2);
 }
 const geo=new THREE.BufferGeometry();
 geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
 geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(ind);geo.computeVertexNormals();
 const cape=new THREE.Mesh(geo,matte);cape.frustumCulled=false;root.add(cape);
 const light=new THREE.PointLight(0x34aaff,1,5);light.position.set(0,1.65,-.6);root.add(light);
 let time=0;
 function animate(dt,speed,gliding,attacking,dodging){
  time+=dt;
  const step=Math.sin(time*12)*Math.min(.55,speed*.07);
  legs[0].rotation.x=gliding?-.2:step;legs[1].rotation.x=gliding?-.2:-step;
  arms[0].rotation.x=gliding?-.7:-step*.7;
  arms[1].rotation.x=attacking?-1.7:gliding?-.7:step*.7;
  arms[0].rotation.z=gliding?-.6:0;arms[1].rotation.z=gliding?.6:0;
  body.rotation.z=Math.sin(time*7)*Math.min(.035,speed*.008);
  body.rotation.x=dodging?-.35:0;
  const p=geo.attributes.position;
  for(let i=0;i<p.count;i++){
   const k=i*5,x=base[k],y=base[k+1],z=base[k+2],t=base[k+3],u=base[k+4];
   p.setXYZ(i,x*(gliding?1.65:1)+Math.sin(time*5+t*8)*t*.11,
    y+(gliding?.22*t:0)+Math.sin(time*3+u*5)*.04*t,
    z+Math.sin(time*8+t*6+u*4)*(.04+.15*t)+(gliding?-.22*t:0));
  }
  p.needsUpdate=true;geo.computeVertexNormals();
  light.intensity=gliding?1.2:.65;
 }
 return {root,arms,legs,cape,animate};
}
export function makeRaider(){
 const root=new THREE.Group();
 oval(root,steel,0,1.2,0,.45,.56,.32);
 oval(root,polished,0,1.37,-.26,.39,.36,.13);
 oval(root,steel,0,2.05,0,.31,.34,.27);
 oval(root,enemyRed,0,2.07,-.27,.245,.075,.045);
 for(const s of [-1,1]){
  oval(root,polished,s*.43,1.67,0,.20,.25,.22);
  rod(root,steel,[s*.48,1.54,0],[s*.5,.91,0],.15,.11);
  rod(root,steel,[s*.2,.88,0],[s*.22,.21,0],.20,.12);
  oval(root,polished,s*.22,.2,-.12,.19,.14,.23);
 }
 return root;
}
