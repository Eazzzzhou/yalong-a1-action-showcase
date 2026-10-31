import * as T from 'three';

// A separate UV set preserves the panel printing and the user's replacement UVs.
// Capture rest-pose coordinates once: the finish then travels with each rig part.
export async function restoreSurfaceDetail(meshes,renderer,worldScale=1){
 const loader=new T.TextureLoader(),cache=new Map();
 async function detail(channel){
  if(!cache.has(channel))cache.set(channel,loader.loadAsync(`./assets/microfinish/grain_${channel}.png`).then(t=>{
   t.colorSpace=T.NoColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.channel=1;
   t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());return t;
  }));
  return cache.get(channel);
 }
 const [grain,rough]=await Promise.all([detail('normal'),detail('rough')]);
 const brushed=await loader.loadAsync('./assets/microfinish/Metal009_2K-JPG_NormalGL.jpg');
 brushed.colorSpace=T.NoColorSpace;brushed.wrapS=brushed.wrapT=T.RepeatWrapping;brushed.channel=1;
 brushed.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
 const wear=await loader.loadAsync('./assets/microfinish/Plastic001_2K-JPG_NormalGL.jpg');
 wear.colorSpace=T.NoColorSpace;wear.wrapS=wear.wrapT=T.RepeatWrapping;wear.channel=1;wear.repeat.set(.25,.25);
 wear.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
 for(const mesh of meshes){
  const m=mesh.material,name=m.name;
  const coating=['black.001','green.001','plastic'].includes(name);
  const plastic=name==='M_black_powder'||name.startsWith('Photo_Gimbal');
  const metal=['steel','M_alu_brushed','M_steel_satin'].includes(name);
  const caseAluminum=name==='M_case_paint_silver';
  if(!coating&&!plastic&&!metal&&!caseAluminum)continue;
  mesh.updateWorldMatrix(true,false);
  const g=mesh.geometry.clone(),p=g.getAttribute('position'),n=g.getAttribute('normal');
  const uv=new Float32Array(p.count*2),v=new T.Vector3(),normal=new T.Vector3();
  const nm=new T.Matrix3().getNormalMatrix(mesh.matrixWorld),tile=(caseAluminum?.20:metal?.10:.03)*worldScale;
  for(let i=0;i<p.count;i++){
   v.fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld).divideScalar(tile);
   normal.fromBufferAttribute(n,i).applyMatrix3(nm).normalize();
   const ax=Math.abs(normal.x),ay=Math.abs(normal.y),az=Math.abs(normal.z);
   if(ax>=ay&&ax>=az){uv[2*i]=v.z;uv[2*i+1]=v.y;}
   else if(ay>=az){uv[2*i]=v.x;uv[2*i+1]=v.z;}
   else {uv[2*i]=v.x;uv[2*i+1]=v.y;}
  }
  g.setAttribute('uv1',new T.BufferAttribute(uv,2));g.deleteAttribute('tangent');mesh.geometry=g;
  if(coating||plastic){
   m.bumpMap=null;m.normalMap=grain;m.normalScale.set(coating?.5:.65,coating?.5:.65);
   m.roughnessMap=rough;m.roughness=coating?.40:.48;
   if(name==='green.001')m.color.set('#227322');
  }else if(m.normalMap){
   m.normalMap=m.normalMap.clone();m.normalMap.channel=1;m.normalMap.repeat.set(1,1);
   m.normalMap.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
   m.normalScale.set(.22,-.22);
  }
  if(metal&&m.roughnessMap){m.roughnessMap=m.roughnessMap.clone();m.roughnessMap.channel=1;m.roughnessMap.repeat.set(1,1);}
  if(caseAluminum){
   // Replace the dense periodic rib tile: its high-contrast repetition aliases at distance.
   // Keep the aluminium BRDF and add only faint, non-periodic brushed micro-normals.
   m.normalMap=brushed;m.normalScale.set(.045,.045);m.bumpMap=null;m.roughness=.30;
   m.metalness=.95;m.color.set('#bdc2c4');m.anisotropy=.32;m.anisotropyRotation=0;
   m.normalMap.minFilter=T.LinearMipmapLinearFilter;m.normalMap.generateMipmaps=true;
  }
  const jaw=name==='black.001'&&mesh.name.startsWith('jaw_')&&!mesh.name.includes('gear');
  const armMetal=name==='black.001'&&!jaw;
  const gimbalMetal=name==='M_black_powder'&&/^gimbal_(base|turntable)$/.test(mesh.name);
  if(jaw){
   m.name='Photo_jaw_matte';m.color.set('#151a18');m.metalness=.04;m.roughness=.66;m.clearcoat=0;m.normalScale.set(.7,.7);
  }else if(armMetal||gimbalMetal){
   m.name=armMetal?'Photo_arm_black_metal':'Photo_gimbal_black_metal';m.color.set('#424b48');m.metalness=.85;m.roughness=.30;m.clearcoat=.1;m.clearcoatRoughness=.3;
   m.normalMap=brushed;m.normalScale.set(.07,.07);
  }
  if(jaw||(name==='M_black_powder'&&!gimbalMetal)){
   // Low-strength captured surface scuffs, confined to coated parts, not optics/metal.
   m.normalMap=wear;m.normalScale.set(.22,.22);m.clearcoat=0;
   if(!jaw)m.roughness=.58;
  }
  m.needsUpdate=true;
 }
}
