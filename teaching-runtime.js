import * as T from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
export async function initTeachingDemo({scene,model,renderer,camera,controls}){
 await RAPIER.init();
 const world=new RAPIER.World({x:0,y:-9.81,z:0});world.timestep=1/120;world.integrationParameters.lengthUnit=.1;world.numSolverIterations=12;
 const status=document.querySelector('#action-status');const say=t=>status.textContent=t;
 const objects=new Map();model.traverse(o=>objects.set(o.name,o));const find=n=>{const o=objects.get(n);if(!o)throw Error('Missing '+n);return o};
 const root=find('arm4-rebuilt-root'),groups=['J1','J2','J3'].map(j=>find('rig-'+j));
 const initial=[-58.7,-12,-6].map(T.MathUtils.degToRad),rest=groups.map(g=>g.quaternion.clone());
 const jaws=[find('rig-jaw_left'),find('rig-jaw_right')],jawRest=jaws.map(o=>o.quaternion.clone());const jawAxis=new T.Vector3(0,.6,.8).normalize();
 const plate=new T.Box3().setFromObject(find('base_mounting_plate')).getCenter(new T.Vector3());
 const yaw=new T.Group();yaw.name='底座竖直转轴';scene.add(yaw);yaw.position.copy(plate);yaw.attach(root);
 const tipNodes=['jaw_left_cross_spacer_2','jaw_right_cross_spacer_2'].map(find);const centers=tipNodes.map(o=>{o.geometry.computeBoundingBox();return o.geometry.boundingBox.getCenter(new T.Vector3())});
 let tcp=null;const rawtip=()=>centers.map((p,i)=>tipNodes[i].localToWorld(p.clone())).reduce((a,b)=>a.add(b)).multiplyScalar(.5);
 const tip=()=>tcp?find('rig-J3').localToWorld(tcp.clone()):rawtip();const axisX=new T.Vector3(1,0,0);let q=[0,...initial],opening=10;
 function pose(values=q,open=opening){q=[...values];opening=open;yaw.rotation.y=q[0];groups.forEach((g,i)=>g.quaternion.copy(rest[i]).multiply(new T.Quaternion().setFromAxisAngle(axisX,q[i+1]-initial[i])));jaws.forEach((g,i)=>g.quaternion.copy(jawRest[i]).multiply(new T.Quaternion().setFromAxisAngle(jawAxis,T.MathUtils.degToRad(open-14)*(i===0?1:-1))));scene.updateMatrixWorld(true);}
 const wrist=()=>find('rig-J3').getWorldPosition(new T.Vector3());
 pose(q,0);tcp=find('rig-J3').worldToLocal(rawtip());pose(q,10);const limits=[[-2.6,2.6],[-1.65,1.45],[-1.6,1.5],[-2.8,2.8]];
 function residual(target){const t=tip(),dir=t.clone().sub(wrist()).normalize();return [target.x-t.x,target.y-t.y,target.z-t.z,-dir.x*.008,(-1-dir.y)*.008,-dir.z*.008];}
 function solveOnce(target,seed=q){let a=[...seed];pose(a,10);let best=[...a],bestCost=Infinity;
  for(let it=0;it<130;it++){
   pose(a,10);const e=residual(target),cost=e.reduce((s,x)=>s+x*x,0);if(cost<bestCost){bestCost=cost;best=[...a]};if(cost<1e-8)break;
   const J=[];for(let k=0;k<4;k++){const b=[...a];b[k]+=.001;pose(b,10);const f=residual(target);J[k]=e.map((v,i)=>(v-f[i])/.001)}
   const A=Array.from({length:4},(_,i)=>Array.from({length:5},(_,j)=>j===4?J[i].reduce((s,x,k)=>s+x*e[k],0):J[i].reduce((s,x,k)=>s+x*J[j][k],0)+(i===j?.00001:0)));
   for(let k=0;k<4;k++){let p=k;for(let i=k+1;i<4;i++)if(Math.abs(A[i][k])>Math.abs(A[p][k]))p=i;[A[k],A[p]]=[A[p],A[k]];const d=A[k][k]||1e-10;for(let j=k;j<5;j++)A[k][j]/=d;for(let i=0;i<4;i++)if(i!==k){const m=A[i][k];for(let j=k;j<5;j++)A[i][j]-=m*A[k][j]}}
   const old=[...a];let accepted=false;for(const step of [1,.5,.2,.05]){const b=old.map((v,k)=>T.MathUtils.clamp(v+T.MathUtils.clamp(A[k][4],-.25,.25)*step,...limits[k]));pose(b,10);const rr=residual(target);if(rr.reduce((s,x)=>s+x*x,0)<cost){a=b;accepted=true;break}}if(!accepted)break;
  }
  pose(best,10);return {angles:best,error:tip().distanceTo(target),cost:bestCost};
 }
 function solve(target,seed=q){let best=solveOnce(target,seed);if(best.error>.003){const ya=-Math.atan2(target.z-plate.z,target.x-plate.x);for(const s of [[ya,-.5,.9,-1.8],[ya,-1,1.3,-1.5],[ya,.4,-1,-1],[ya,-.8,-.9,1.6]]){const r=solveOnce(target,s);if(r.cost<best.cost)best=r}}pose(best.angles,10);return best}
 const cloud=new T.Group();cloud.name='云台折倒轴';scene.add(cloud);cloud.position.set(.114,.130,-.154);
 model.traverse(o=>{});const moving=[];model.traverse(o=>{if(o.isMesh&&(o.name.startsWith('camera_')||o.name.startsWith('gimbal_folded_side')))moving.push(o)});moving.forEach(o=>cloud.attach(o));cloud.rotation.x=Math.PI/2;
 const body=world.createRigidBody(RAPIER.RigidBodyDesc.fixed());world.createCollider(RAPIER.ColliderDesc.cuboid(.304,.004,.216).setTranslation(0,.091,0).setFriction(1),body);
 const sensorNames=[];model.traverse(o=>{if(o.isMesh&&o.name.startsWith('sensor_')&&o.name.includes('_socket_'))sensorNames.push(o.name)});world.createCollider(RAPIER.ColliderDesc.cuboid(2,.005,2).setTranslation(0,-.005,0),body);for(const n of [...sensorNames,'case_side_-1','case_side_1','case_end_-1','case_end_1','compute_window_frame','gimbal_base','speaker_mount_ring','board_pcb','oled_board',...Array.from({length:3},(_,i)=>'button_cap_'+i)]){const o=find(n),b=new T.Box3().setFromObject(o),s=b.getSize(new T.Vector3()).multiplyScalar(.5),p=b.getCenter(new T.Vector3());world.createCollider(RAPIER.ColliderDesc.cuboid(Math.max(s.x,.002),Math.max(s.y,.002),Math.max(s.z,.002)).setTranslation(p.x,p.y,p.z),body)}
 // Reachable physical work areas remain clear of buttons and sensor sockets.
 const sources=[new T.Vector3(-.235,.109,.137),new T.Vector3(-.235,.109,.174),new T.Vector3(-.198,.109,.174)];
 const drops=[new T.Vector3(.075,.109,.035),new T.Vector3(.075,.109,.067),new T.Vector3(.107,.109,.035)];
 const blocks=sources.map((p,i)=>{const rb=world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(p.x,p.y,p.z).setCanSleep(true).setCcdEnabled(true));const c=world.createCollider(RAPIER.ColliderDesc.cuboid(.011,.011,.011).setMass(.015).setFriction(1.5).setRestitution(.02),rb);const mesh=new T.Mesh(new T.BoxGeometry(.022,.022,.022),new T.MeshStandardMaterial({color:[0xd5a24a,0x79a9ac,0xc37c60][i],roughness:.55}));mesh.castShadow=mesh.receiveShadow=true;scene.add(mesh);return {rb,c,mesh,done:false}});
 for(const [name,p,w,d]of [['取料区',new T.Vector3(-.216,.0955,.154),.085,.09],['放置区',new T.Vector3(.09,.0955,.05),.076,.082]]){const mesh=new T.Mesh(new T.PlaneGeometry(w,d),new T.MeshStandardMaterial({color:0x4e6963,roughness:.85,transparent:true,opacity:.30,depthWrite:false}));mesh.rotation.x=-Math.PI/2;mesh.position.copy(p);scene.add(mesh)}
 const pads=[-1,1].map(side=>{const rb=world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased());const c=world.createCollider(RAPIER.ColliderDesc.cuboid(.0015,.010,.006).setFriction(2.5).setCollisionGroups(0x00020001),rb);const mesh=new T.Mesh(new T.BoxGeometry(.003,.020,.012),new T.MeshStandardMaterial({color:0x20272a,roughness:.85}));mesh.name='夹爪接触垫';mesh.castShadow=true;scene.add(mesh);return {rb,c,side,mesh}});
 const gripBody=world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased());let gripJoint=null,held=null;
 // Contact pads represent compliant inserts at the inside of the two real fingers.
 function syncPads(){const a=tipNodes[0].localToWorld(centers[0].clone()),b=tipNodes[1].localToWorld(centers[1].clone()),mid=a.clone().add(b).multiplyScalar(.5),across=b.clone().sub(a).normalize();const rot=new T.Quaternion().setFromUnitVectors(new T.Vector3(1,0,0),across);const half=a.distanceTo(b)*.5;
  for(const pad of pads){const p=mid.clone().addScaledVector(across,pad.side*half);pad.rb.setNextKinematicTranslation(p);pad.rb.setNextKinematicRotation(rot);pad.mesh.position.copy(p);pad.mesh.quaternion.copy(rot)}gripBody.setNextKinematicTranslation(mid);gripBody.setNextKinematicRotation(find('rig-J3').getWorldQuaternion(new T.Quaternion()));
 }
 function release(){if(gripJoint){world.removeImpulseJoint(gripJoint,true);gripJoint=null}const b=held;held=null;return b}
 function latch(block){const touched=pads.map(p=>{let hit=false;world.contactPair(p.c,block.c,m=>{if(m.numContacts()>0)hit=true});return hit});if(!touched.every(Boolean))return false;
  const hand=new T.Vector3().copy(gripBody.translation()),p=new T.Vector3().copy(block.rb.translation());const quat=block.rb.rotation();const inv=new T.Quaternion(quat.x,quat.y,quat.z,quat.w).invert();
  const hq=find('rig-J3').getWorldQuaternion(new T.Quaternion());gripJoint=world.createImpulseJoint(RAPIER.JointData.fixed(p.clone().sub(hand).applyQuaternion(hq.clone().invert()),{x:0,y:0,z:0,w:1},{x:0,y:0,z:0},inv.multiply(hq)),gripBody,block.rb,true);held=block;events.push({type:'bilateral-contact-grasp',time:simTime,position:{...block.rb.translation()}});return true;
 }
 const clearanceAudit=[];let lastAudit=0;const armMeshes=[];root.traverse(o=>{if(o.isMesh&&!/cable|lead|grommet/.test(o.name))armMeshes.push(o)});let simTime=0,acc=0,last=performance.now(),token=0,busy=false,cloudUp=false;const events=[];const waiters=[];
 function delay(seconds,id){return new Promise((resolve,reject)=>waiters.push({end:simTime+seconds,id,resolve,reject}))}
 async function tween(to,seconds,id,open=opening){const start=[...q],from=opening,t0=simTime;while(simTime-t0<seconds){if(id!==token)throw Error('cancelled');const t=Math.min(1,(simTime-t0)/seconds),u=t*t*(3-2*t);pose(start.map((v,i)=>v+(to[i]-v)*u),from+(open-from)*u);await delay(1/120,id)}pose(to,open)}
 async function move(target,seconds,id,open=opening){const from=[...q],fromOpen=opening,result=solve(target,from);pose(from,fromOpen);if(result.error>.006)throw Error('目标超出可达范围 '+result.error.toFixed(3));await tween(result.angles,seconds,id,open);return result}
 const homeResult={angles:[0,...[-54,-80.5,84].map(T.MathUtils.degToRad)],error:0};const home=homeResult.angles;home[0]=0;pose(home,10);
 function enabled(){for(const id of ['arm-start','gimbal-start'])document.querySelector('#'+id).disabled=busy}
 async function armAction(){if(busy)return;const block=blocks.find(b=>!b.done);if(!block){say('方块已全部搬运，请复位');return}busy=true;enabled();const id=++token;
  try{say('机械臂：抬起并转向取料区');const lift=[...q];lift[1]=Math.min(lift[1]+.28,1.4);lift[3]-=.28;await tween(lift,.9,id,12);const p=new T.Vector3().copy(block.rb.translation());await move(p.clone().add(new T.Vector3(0,.04,0)),1.8,id,12);say('机械臂：接近方块');await move(p.clone().add(new T.Vector3(0,.002,0)),1.5,id,12);
   say('机械臂：合爪');await tween(q,1,id,0);await delay(.25,id);if(!latch(block))throw Error('夹爪未形成双侧接触，请复位后重试');await move(p.clone().add(new T.Vector3(0,.06,0)),1.8,id,0);
   const index=blocks.indexOf(block),drop=drops[index];say('机械臂：转向放置区');await move(drop.clone().add(new T.Vector3(0,.06,0)),2.5,id,0);say('机械臂：降低、松爪');await move(drop.clone().add(new T.Vector3(0,.003,0)),1.6,id,0);release();await tween(q,.8,id,12);await delay(.5,id);block.done=true;await move(drop.clone().add(new T.Vector3(0,.04,0)),1.2,id,12);events.push({type:'placed',index,time:simTime});say('搬运完成，可再次启动或复位');
  }catch(e){if(id===token){release();say(e.message);events.push({type:'error',message:e.message})}}finally{if(id===token){busy=false;enabled()}}
 }
 async function gimbalAction(){if(busy)return;if(cloudUp){say('云台已升起');return}busy=true;enabled();const id=++token,t=simTime,from=cloud.rotation.x;try{say('云台：升起');while(simTime-t<2){cloud.rotation.x=from*(1-T.MathUtils.smoothstep((simTime-t)/2,0,1));await delay(1/120,id)}cloud.rotation.x=0;cloudUp=true;say('云台已到工作位置')}catch{}finally{if(id===token){busy=false;enabled()}}}
 let resetting=false;async function reset(){if(resetting)return;resetting=true;const id=++token;busy=true;enabled();try{say('复位：安全收回');if(held){const p=tip();await move(new T.Vector3(p.x,.113,p.z),1.5,id,0);release();await tween(q,.6,id,12)}const t=simTime,from=cloud.rotation.x;const armReturn=tween(home,2.5,id,10);while(simTime-t<2.5){cloud.rotation.x=from+(Math.PI/2-from)*T.MathUtils.smoothstep((simTime-t)/2.5,0,1);await delay(1/120,id)}await armReturn;cloud.rotation.x=Math.PI/2;cloudUp=false;for(let i=0;i<blocks.length;i++){const b=blocks[i];b.rb.setTranslation(sources[i],true);b.rb.setLinvel({x:0,y:0,z:0},true);b.rb.setAngvel({x:0,y:0,z:0},true);b.rb.setRotation({x:0,y:0,z:0,w:1},true);b.done=false}say('已复位：机械臂放平，云台倒下');events.push({type:'reset',time:simTime})}catch(e){say(e.message)}finally{resetting=false;if(id===token){busy=false;enabled()}}}
 const labelCanvas=document.createElement('canvas');labelCanvas.width=512;labelCanvas.height=128;const ctx=labelCanvas.getContext('2d');ctx.fillStyle='#e0e5e0';ctx.fillRect(0,0,512,128);ctx.fillStyle='#202726';ctx.font='64px Microsoft YaHei';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('复位',256,64);const tx=new T.CanvasTexture(labelCanvas);tx.colorSpace=T.SRGBColorSpace;const resetLabel=new T.Mesh(new T.PlaneGeometry(.022,.006),new T.MeshStandardMaterial({map:tx,roughness:.4,metalness:.4}));resetLabel.rotation.x=-Math.PI/2;resetLabel.position.set(.229,.0955,-.019);scene.add(resetLabel);const buttons=[find('button_cap_0'),find('button_cap_1'),find('button_cap_2')],actions=[armAction,gimbalAction,reset];const ray=new T.Raycaster(),mouse=new T.Vector2();let down;
 renderer.domElement.addEventListener('pointerdown',e=>down=[e.clientX,e.clientY]);renderer.domElement.addEventListener('pointerup',e=>{if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>5)return;const rect=renderer.domElement.getBoundingClientRect();mouse.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(mouse,camera);const hit=ray.intersectObjects(buttons)[0];if(hit)activate(buttons.indexOf(hit.object))});
 function activate(i){if(busy&&i!==2)return;const b=buttons[i],p=b.position.clone();b.position.y-=.0012;setTimeout(()=>b.position.copy(p),180);actions[i]()}['arm-start','gimbal-start','reset'].forEach((id,i)=>document.querySelector('#'+id).onclick=()=>activate(i));
 function update(now){if(busy&&simTime-lastAudit>.1){lastAudit=simTime;for(const o of armMeshes){if(new T.Box3().setFromObject(o).min.y>=.093)continue;let min=Infinity;const a=o.geometry.attributes.position,v=new T.Vector3();for(let i=0;i<a.count;i++)min=Math.min(min,v.fromBufferAttribute(a,i).applyMatrix4(o.matrixWorld).y);if(min<.093&&!clearanceAudit.some(e=>e.name===o.name))clearanceAudit.push({name:o.name,minY:min,time:simTime})}}acc+=Math.min((now-last)/1000,.05);last=now;while(acc>=1/120){syncPads();world.step();simTime+=1/120;acc-=1/120;for(let i=waiters.length-1;i>=0;i--){const w=waiters[i];if(w.id!==token){waiters.splice(i,1);w.reject(Error('cancelled'))}else if(simTime>=w.end){waiters.splice(i,1);w.resolve()}}}for(const b of blocks){b.mesh.position.copy(b.rb.translation());b.mesh.quaternion.copy(b.rb.rotation())}}
 say('就绪：点击箱内绿、黄、红按钮，或使用上方控制');
 return {update,armAction,gimbalAction,reset,pose,solve,tip,blocks,world,events,get state(){return {q,opening,busy,cloudUp,held:!!held,simTime,homeError:homeResult.error,tip:tip().toArray()}},cloud,pads,root,objects,clearanceAudit};
}










