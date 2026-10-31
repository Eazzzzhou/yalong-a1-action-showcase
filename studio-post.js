import * as T from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {GTAOPass} from 'three/addons/postprocessing/GTAOPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';

export function createStudioPost(renderer,scene,camera,stage){
 const target=new T.WebGLRenderTarget(1,1,{type:T.HalfFloatType,samples:4});
 const composer=new EffectComposer(renderer,target);
 composer.addPass(new RenderPass(scene,camera));
 const ao=new GTAOPass(scene,camera,1,1,undefined,{radius:.055,thickness:.035,distanceExponent:1,scale:1.6,samples:16},{samples:16,radius:8});
 ao.blendIntensity=1;composer.addPass(ao);composer.addPass(new OutputPass());
 let width=0,height=0;
 return {ao,render(){
  const size=renderer.getSize(new T.Vector2());
  if(size.x!==width||size.y!==height){width=size.x;height=size.y;composer.setSize(width,height);ao.setSize(Math.ceil(width*.65),Math.ceil(height*.65));}
  composer.render();
 }};
}
