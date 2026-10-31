import * as T from 'three';
import {HDRLoader} from 'three/addons/loaders/HDRLoader.js';

export const photographicPresets={
 workshop:{asset:'aerodynamics_workshop',rotation:0,intensity:1.05,exposure:1,sun:2.4},
 foundry:{asset:'industrial_workshop_foundry',rotation:1.3,intensity:1,exposure:1,sun:1.2},
 metalStudio:{asset:'studio_small_09',rotation:1.7,intensity:1,exposure:.95,sun:.65}
};
export function photographicEnvironments(renderer){
 const cache=new Map();
 return async function load(id){
  const preset=photographicPresets[id];
  if(!cache.has(id))cache.set(id,new HDRLoader().loadAsync(`./assets/environments/${preset.asset}_2k.hdr`).then(hdr=>{
   hdr.mapping=T.EquirectangularReflectionMapping;
   const pmrem=new T.PMREMGenerator(renderer),reflection=pmrem.fromEquirectangular(hdr);pmrem.dispose();
   return {...preset,hdr,reflection,source:`https://polyhaven.com/a/${preset.asset}`};
  }).catch(error=>{cache.delete(id);throw error;}));
  return cache.get(id);
 };
}
