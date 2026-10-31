import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import * as T from 'three';
import {RectAreaLightUniformsLib} from 'three/addons/lights/RectAreaLightUniformsLib.js';
import {Reflector} from 'three/addons/objects/Reflector.js';
import {createLaboratory} from './laboratory-stage.js';
import {photographicEnvironments,photographicPresets} from './photographic-environments.js';

export async function createStudio(scene,renderer,floor,key,fill){
 RectAreaLightUniformsLib.init();
 const pmrem=new T.PMREMGenerator(renderer);const room=new RoomEnvironment();const softboxEnv=pmrem.fromScene(room,.04);room.dispose();pmrem.dispose();
 const group=new T.Group();group.name='网页摄影棚柔光箱';scene.add(group);
 const target=new T.Vector3(0,0,0),lights=[];
 function area(name,pos,intensity,w,h){const l=new T.RectAreaLight(0xffffff,intensity,w,h);l.name=name;l.position.set(...pos);l.lookAt(target);group.add(l);lights.push(l);return l;}
 area('左前大型柔光箱',[-3,2.4,2],5,2.6,3.4);
 area('右侧大型柔光箱',[3,1.8,0],3.3,2,3);
 area('顶部柔光箱',[0,4,0],3.5,3.5,2.5);
 area('左后条形轮廓灯',[-2,2,-2],6,.35,2.7);
 area('右后条形轮廓灯',[2,2.6,-2],5,.4,2.7);
 key.position.set(-3,5,3);key.intensity=.65;key.color.set('#fffdf7');key.shadow.mapSize.set(2048,2048);key.shadow.bias=-.00004;key.shadow.normalBias=.002;key.shadow.radius=3;
 key.shadow.mapSize.set(1024,1024);key.shadow.radius=6;renderer.shadowMap.type=T.PCFShadowMap;fill.intensity=.10;
 floor.name='摄影棚半反射地面';floor.material.roughness=.42;floor.material.transparent=true;floor.material.opacity=.88;floor.material.depthWrite=false;floor.renderOrder=1;
 const mirror=new Reflector(new T.PlaneGeometry(100,100),{textureWidth:768,textureHeight:768,multisample:0,clipBias:.003,color:0xbcc3cb});mirror.name='实时地面反射';mirror.rotation.x=-Math.PI/2;scene.add(mirror);
 const reflect=mirror.onBeforeRender;
 mirror.onBeforeRender=function(renderer,scene,...args){if(!scene.overrideMaterial)return reflect.call(this,renderer,scene,...args);};
 // A smooth floor-to-wall sweep; Y is up in the browser.
 const profile=[[-12,0],[3,0]];for(let i=1;i<=40;i++){const a=i/40*Math.PI/2;profile.push([3+4*Math.sin(a),4*(1-Math.cos(a))]);}profile.push([7,12]);
 const points=[],indices=[],n=profile.length;for(const x of [-20,20])for(const[z,y]of profile)points.push(x,y,-z);
 for(let i=0;i<n-1;i++)indices.push(i,n+i,n+i+1,i,n+i+1,i+1);
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(points,3));geometry.setIndex(indices);geometry.computeVertexNormals();
 const sweep=new T.Mesh(geometry,new T.MeshStandardMaterial({color:'#aab0b8',roughness:.8,side:T.DoubleSide}));sweep.name='无缝弧形背景';scene.add(sweep);
 const laboratory=createLaboratory(renderer);scene.add(laboratory.root);
 const loadPhotographic=photographicEnvironments(renderer);
 let current='light',unit=1/.315,studioScale=1,environmentToken=0,initialRotation=0;
 const sunBase=new T.Vector3();
 async function apply(id){
  if(id==='lab')id='workshop';
  const token=++environmentToken,photographic=photographicPresets[id]?await loadPhotographic(id):null;
  if(token!==environmentToken)return;
  current=id;const workshop=id==='workshop'||id==='foundry',dark=id==='dark';
  laboratory.root.visible=workshop;group.visible=!photographic;floor.visible=mirror.visible=sweep.visible=!workshop;
  scene.backgroundBlurriness=0;scene.backgroundIntensity=1;scene.backgroundRotation.set(0,0,0);
  renderer.toneMapping=T.AgXToneMapping;
  if(photographic){
   scene.environment=photographic.reflection.texture;scene.environmentIntensity=photographic.intensity;
   scene.environmentRotation.set(0,photographic.rotation,0);renderer.toneMappingExposure=photographic.exposure;
   if(workshop){scene.background=photographic.hdr;scene.backgroundBlurriness=.035;scene.backgroundRotation.copy(scene.environmentRotation);scene.backgroundIntensity=.8;}
   else {scene.background=new T.Color('#aeb6bd');floor.material.color.set('#aeb4bd');sweep.material.color.copy(floor.material.color);floor.material.opacity=.9;}
   key.position.set(-3,2.8,1.4).multiplyScalar(unit);key.target.position.set(0,.18*unit,0);key.intensity=photographic.sun;key.color.set('#fff2de');
   fill.position.set(2,1.5,2).multiplyScalar(unit);fill.intensity=.25;fill.color.set('#d4e7ff');key.shadow.normalBias=.00018*unit;key.shadow.mapSize.set(2048,2048);
   Object.assign(key.shadow.camera,{left:-.9*unit,right:.9*unit,top:.9*unit,bottom:-.9*unit,near:.05*unit,far:12*unit});
  }else{
   scene.environment=softboxEnv.texture;scene.environmentIntensity=dark?.75:1;scene.environmentRotation.set(0,115*Math.PI/180,0);scene.background=new T.Color(dark?'#242d3b':'#b8bdc5');floor.material.color.set(dark?'#26303c':'#aeb4bd');floor.material.opacity=dark?.80:.90;sweep.material.color.copy(floor.material.color);renderer.toneMappingExposure=dark?.9:1;
   key.position.set(-3,5,3).multiplyScalar(studioScale);key.target.position.set(0,0,0);key.intensity=.65;key.color.set('#fffdf7');fill.intensity=.10;fill.color.set('#e7efff');fill.position.set(-3,2,-3);
   key.shadow.normalBias=.0004*unit;key.shadow.mapSize.set(2048,2048);
   Object.assign(key.shadow.camera,{left:-.9*unit,right:.9*unit,top:.9*unit,bottom:-.9*unit,near:.01,far:10*unit});
   lights.forEach((l,i)=>{l.intensity=[.5,.18,.2,dark?.8:.5,dark?.7:.4][i];l.color.set(id==='warm'?'#fff9ef':'#ffffff');});
  }
  key.shadow.map?.dispose();key.shadow.map=null;key.shadow.camera.updateProjectionMatrix();
  key.target.updateMatrixWorld();renderer.shadowMap.needsUpdate=true;
  sunBase.copy(key.position);initialRotation=scene.environmentRotation.y;
  const angle=document.getElementById('environment-rotation');if(angle){angle.value=Math.round((initialRotation*180/Math.PI+360)%360);document.getElementById('environment-angle').value=angle.value+'°';}
  const source=document.getElementById('environment-source');if(source){source.hidden=!photographic;if(photographic)source.href=photographic.source;}
 }
 function update(){mirror.position.y=floor.position.y-.002;sweep.position.y=floor.position.y-.01;laboratory.setHeight(floor.position.y);}
 apply('light');update();
 function setScale(scale){studioScale=scale;unit=scale/.315;group.scale.setScalar(scale);sweep.scale.setScalar(scale);laboratory.setScale(unit);apply(current);}
 laboratory.setScale(unit);
 function rotate(degrees){const angle=T.MathUtils.degToRad(degrees);scene.environmentRotation.y=angle;if(scene.background?.isTexture)scene.backgroundRotation.y=angle;key.position.copy(sunBase).applyAxisAngle(new T.Vector3(0,1,0),angle-initialRotation);renderer.shadowMap.needsUpdate=true;}
 return {mirror,sweep,group,laboratory,apply,update,setScale,rotate,get variant(){return current;},get dark(){return current==='dark';}};
}
